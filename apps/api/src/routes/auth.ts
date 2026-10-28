import { and, eq, isNull, sql } from "drizzle-orm"
import type { FastifyInstance } from "fastify"

import { type NodeEnv } from "../config.js"
import { getDatabase } from "../db.js"
import { emailTokens, legalAcceptances, mailEvents, passwordCredentials, users } from "../db/schema.js"
import { offerVersion as currentOfferVersion, privacyVersion as currentPrivacyVersion } from "../legal-versions.js"
import {
  alreadyRegisteredLetter,
  createEmailToken,
  hashEmailToken,
  passwordChangedLetter,
  resetPasswordLetter,
  sendMail,
  verifyEmailLetter,
} from "../mail.js"
import { HashQueueFullError, hashPassword, readDummyPasswordHash, verifyPassword } from "../password.js"
import { rejectPassword } from "../password-policy.js"
import {
  clearSessionCookie,
  cookieMaxAgeForNewSession,
  createSession,
  readSessionEmail,
  readSessionToken,
  requireSession,
  revokeAllUserSessions,
  revokeSession,
  setSessionCookie,
} from "../session.js"
import {
  checkLoginThrottle,
  clearEmailAndPairFailures,
  clearPairFailures,
  recordLoginFailure,
  rememberTrustedPair,
  throttleKeys,
  writeAuthEvent,
} from "../throttle.js"

/** Сколько регистраций в час можно с одного адреса. */
const registerRateLimitMax = 10

/** Окно отдельного лимита регистрации. */
const registerRateLimitWindow = "1 hour"

/** Сколько подтверждений почты в час можно с одного адреса. */
const verifyRateLimitMax = 20

/** Окно лимита подтверждения почты. */
const verifyRateLimitWindow = "1 hour"

/** Сколько входов за 10 минут можно с одного адреса. */
const loginRateLimitMax = 20

/** Окно отдельного лимита входа. */
const loginRateLimitWindow = "10 minutes"

/** Сколько запросов сброса пароля в час можно с одного адреса. */
const resetRequestRateLimitMax = 10

/** Окно лимита запроса сброса. */
const resetRequestRateLimitWindow = "1 hour"

/** Сколько подтверждений сброса в час можно с одного адреса. */
const resetConfirmRateLimitMax = 20

/** Окно лимита подтверждения сброса. */
const resetConfirmRateLimitWindow = "1 hour"

/** Сколько живёт ссылка сброса пароля. */
const resetTokenTtlMs = 60 * 60 * 1000

/** Полных лет, с которых регистрация разрешена. */
const adultAgeYears = 18

/** Самая ранняя допустимая дата рождения. */
const earliestBirthDate = "1900-01-01"

/** Календарь возраста: московский день, без времени. */
const moscowTimeZone = "Europe/Moscow"

/** Сколько живёт ссылка подтверждения. */
const verifyTokenTtlMs = 24 * 60 * 60 * 1000

/** Транзакция базы. Тип берётся у открытого подключения. */
type AppTransaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0]

/** Письмо, которое уйдёт после ответа клиенту. */
type PendingMail = {
  to: string
  subject: string
  text: string
}

/** Тело регистрации. Лишние поля отсекает схема. */
type RegisterBody = {
  email: string
  password: string
  dateOfBirth: string
  confirmAdult: true
  acceptOffer: true
  acceptPersonalData: true
  offerVersion: string
  privacyVersion: string
}

/** Тело подтверждения почты. Лишние поля отсекает схема. */
type VerifyBody = {
  token: string
}

/** Тело входа. Лишние поля отсекает схема. */
type LoginBody = {
  email: string
  password: string
}

/** Тело запроса сброса. Лишние поля отсекает схема. */
type ResetRequestBody = {
  email: string
}

/** Тело подтверждения сброса. Лишние поля отсекает схема. */
type ResetConfirmBody = {
  token: string
  password: string
}

/** Схема Fastify. Причины отказа клиенту не перечисляются. */
const registerBodySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "email",
    "password",
    "dateOfBirth",
    "confirmAdult",
    "acceptOffer",
    "acceptPersonalData",
    "offerVersion",
    "privacyVersion",
  ],
  properties: {
    email: {
      type: "string",
      minLength: 3,
      maxLength: 254,
      pattern: "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$",
    },
    password: { type: "string", minLength: 10, maxLength: 128 },
    dateOfBirth: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    confirmAdult: { type: "boolean", const: true },
    acceptOffer: { type: "boolean", const: true },
    acceptPersonalData: { type: "boolean", const: true },
    offerVersion: { type: "string", minLength: 1, maxLength: 64 },
    privacyVersion: { type: "string", minLength: 1, maxLength: 64 },
  },
} as const

/** Схема входа. Пароль здесь короче, чем при регистрации: список слабых паролей не применяется. */
const loginBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
      minLength: 3,
      maxLength: 254,
      pattern: "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$",
    },
    password: { type: "string", minLength: 1, maxLength: 128 },
  },
} as const

/** Схема запроса сброса. Почта как у входа. */
const resetRequestBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["email"],
  properties: {
    email: {
      type: "string",
      minLength: 3,
      maxLength: 254,
      pattern: "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$",
    },
  },
} as const

/** Схема нового пароля. Токен и пароль, лишних полей нет. */
const resetConfirmBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["token", "password"],
  properties: {
    token: { type: "string", minLength: 20, maxLength: 128 },
    password: { type: "string", minLength: 10, maxLength: 128 },
  },
} as const

/** Схема токена. Короткий и лишний набор полей отсекаются здесь. */
const verifyBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["token"],
  properties: {
    token: { type: "string", minLength: 20, maxLength: 128 },
  },
} as const

/** Токен не подошёл. В тексте нет самого токена и почты. */
class InvalidTokenError extends Error {
  constructor() {
    super("токен не подошёл")
    this.name = "InvalidTokenError"
  }
}

/** Подключает регистрацию, подтверждение почты, вход, выход, сброс пароля и текущую сессию. */
function registerAuthRoutes(app: FastifyInstance, webOrigin: string, nodeEnv: NodeEnv, loginThrottleSecret: string) {
  app.post<{ Body: RegisterBody }>(
    "/auth/register",
    {
      schema: { body: registerBodySchema },
      config: {
        rateLimit: {
          max: registerRateLimitMax,
          timeWindow: registerRateLimitWindow,
        },
      },
      preValidation: async (request) => {
        normalizeEmail(request.body)
      },
    },
    async (request, reply) => {
      /** Проверенное тело. Пароль дальше только в хеш. */
      const body = request.body

      if (!isAllowedBirthDate(body.dateOfBirth)) {
        return reply.code(400).send({ error: "validation_failed" })
      }

      if (fullYears(body.dateOfBirth, moscowToday()) < adultAgeYears) {
        return reply.code(403).send({ error: "age_restriction" })
      }

      if (body.offerVersion !== currentOfferVersion || body.privacyVersion !== currentPrivacyVersion) {
        return reply.code(400).send({ error: "validation_failed" })
      }

      /** Причина слабости. Клиенту уходит только общий код, без текста. */
      const passwordRejection = rejectPassword(body.password, body.email, body.dateOfBirth)

      if (passwordRejection.length > 0) {
        return reply.code(400).send({ error: "weak_password" })
      }

      /** Письмо после ответа. Пустое значит, что лимит писем уже выбран. */
      let pendingMail: PendingMail | null = null

      try {
        /** Хеш считается и для нового, и для уже существующего email. */
        const passwordHash = await hashPassword(body.password)

        pendingMail = await getDatabase().transaction(async (tx) => {
          /** Уже записанный пользователь, если почта знакома. */
          const found = await tx
            .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
            .from(users)
            .where(sql`lower(${users.email}) = lower(${body.email})`)
            .limit(1)

          /** Найденная строка. */
          const existing = found[0]

          if (!existing) {
            /** Новая строка пользователя. Подтверждения почты ещё нет. */
            const inserted = await tx
              .insert(users)
              .values({ email: body.email, dateOfBirth: body.dateOfBirth })
              .returning({ id: users.id })

            /** Созданный пользователь. Пустой ответ базы здесь не ожидается. */
            const user = inserted[0]

            if (!user) {
              throw new Error("не удалось создать пользователя")
            }

            await tx.insert(passwordCredentials).values({
              userId: user.id,
              passwordHash,
            })
            await tx.insert(legalAcceptances).values(acceptanceRows(user.id, body.offerVersion, body.privacyVersion))
            return issueVerifyMail(tx, user.id, body.email, webOrigin)
          }

          if (!(await canSendMail(tx, existing.id))) {
            return null
          }

          if (existing.emailVerifiedAt) {
            await tx.insert(mailEvents).values({
              userId: existing.id,
              kind: "already_registered",
            })
            /** Письмо без изменений в аккаунте. */
            const letter = alreadyRegisteredLetter(webOrigin)
            return { to: body.email, subject: letter.subject, text: letter.text }
          }

          await tx
            .update(users)
            .set({ dateOfBirth: body.dateOfBirth, updatedAt: new Date() })
            .where(eq(users.id, existing.id))
          await tx
            .update(passwordCredentials)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(passwordCredentials.userId, existing.id))
          await tx.insert(legalAcceptances).values(acceptanceRows(existing.id, body.offerVersion, body.privacyVersion))
          await tx
            .update(emailTokens)
            .set({ usedAt: new Date() })
            .where(and(eq(emailTokens.userId, existing.id), isNull(emailTokens.usedAt)))

          return issueVerifyMail(tx, existing.id, body.email, webOrigin)
        })
      } catch (error: unknown) {
        if (error instanceof HashQueueFullError) {
          return reply.code(429).send({ error: "too_many_requests" })
        }

        if (isUniqueViolation(error)) {
          return reply.code(201).send({ status: "ok" })
        }

        request.log.error(dbErrorLog(error))
        throw new Error("не удалось зарегистрировать")
      }

      reply.code(201).send({ status: "ok" })
      deliverAfterResponse(request, pendingMail)
      return reply
    },
  )

  app.post<{ Body: VerifyBody }>(
    "/auth/verify-email",
    {
      schema: { body: verifyBodySchema },
      config: {
        rateLimit: {
          max: verifyRateLimitMax,
          timeWindow: verifyRateLimitWindow,
        },
      },
    },
    async (request, reply) => {
      /** Хеш присланного токена. Сам токен дальше не нужен. */
      const tokenHash = hashEmailToken(request.body.token)

      try {
        await getDatabase().transaction(async (tx) => {
          /** Строка, которую успели пометить первой. Вторая гонка получит ноль строк. */
          const used = await tx
            .update(emailTokens)
            .set({ usedAt: new Date() })
            .where(
              and(
                eq(emailTokens.tokenHash, tokenHash),
                eq(emailTokens.purpose, "verify_email"),
                isNull(emailTokens.usedAt),
                sql`${emailTokens.expiresAt} > now()`,
              ),
            )
            .returning({ userId: emailTokens.userId })

          /** Погашенный токен. Нет строки — токен чужой, старый или уже использован. */
          const tokenRow = used[0]

          if (!tokenRow) {
            throw new InvalidTokenError()
          }

          await tx
            .update(users)
            .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
            .where(eq(users.id, tokenRow.userId))
          await tx
            .update(emailTokens)
            .set({ usedAt: new Date() })
            .where(and(eq(emailTokens.userId, tokenRow.userId), isNull(emailTokens.usedAt)))
        })
      } catch (error: unknown) {
        if (error instanceof InvalidTokenError) {
          return reply.code(400).send({ error: "invalid_token" })
        }

        request.log.error(dbErrorLog(error))
        throw new Error("не удалось подтвердить почту")
      }

      return reply.code(200).send({ status: "ok" })
    },
  )

  app.post<{ Body: LoginBody }>(
    "/auth/login",
    {
      schema: { body: loginBodySchema },
      config: {
        rateLimit: {
          max: loginRateLimitMax,
          timeWindow: loginRateLimitWindow,
        },
      },
      preValidation: async (request) => {
        normalizeEmail(request.body)
      },
    },
    async (request, reply) => {
      /** Проверенное тело. Пароль дальше только в проверку хеша. */
      const body = request.body
      /** Обезличенные ключи. Почта и адрес в базу не пишутся. */
      const keys = throttleKeys(loginThrottleSecret, body.email, request.ip)
      /** Блокировка до хеша пароля. Нет её — попытку можно проверять. */
      const block = await checkLoginThrottle(keys)

      if (block) {
        reply.header("Retry-After", String(block.retryAfterSeconds))
        return reply.code(429).send({ error: "too_many_requests" })
      }

      try {
        /** Пользователь и хеш. Нет строки — почта не зарегистрирована. */
        const found = await getDatabase()
          .select({
            id: users.id,
            emailVerifiedAt: users.emailVerifiedAt,
            passwordHash: passwordCredentials.passwordHash,
          })
          .from(users)
          .leftJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
          .where(sql`lower(${users.email}) = lower(${body.email})`)
          .limit(1)

        /** Найденная строка. */
        const account = found[0]

        if (!account || account.passwordHash === null) {
          try {
            await verifyPassword(body.password, readDummyPasswordHash())
          } catch (error: unknown) {
            if (error instanceof HashQueueFullError) {
              throw error
            }

            await recordLoginFailure(keys)
            await writeAuthEvent("login_failed", null)
            throw error
          }

          await recordLoginFailure(keys)
          await writeAuthEvent("login_failed", null)
          return reply.code(401).send({ error: "invalid_credentials" })
        }

        /** Совпал ли пароль. Неверный ответ одинаковый и для чужой почты. */
        let passwordMatches = false

        try {
          passwordMatches = await verifyPassword(body.password, account.passwordHash)
        } catch (error: unknown) {
          if (error instanceof HashQueueFullError) {
            throw error
          }

          await recordLoginFailure(keys)
          await writeAuthEvent("login_failed", account.id)
          throw error
        }

        if (!passwordMatches) {
          await recordLoginFailure(keys)
          await writeAuthEvent("login_failed", account.id)
          return reply.code(401).send({ error: "invalid_credentials" })
        }

        if (account.emailVerifiedAt === null) {
          return reply.code(403).send({ error: "email_not_verified" })
        }

        /** Токен новой сессии. В ответ и в лог он не входит, только в cookie. */
        const token = await createSession(account.id, readSessionToken(request, nodeEnv))
        await clearPairFailures(keys.pair)
        await rememberTrustedPair(keys.pair)
        await writeAuthEvent("login_success", account.id)
        setSessionCookie(reply, token, nodeEnv, cookieMaxAgeForNewSession(new Date()))
      } catch (error: unknown) {
        if (error instanceof HashQueueFullError) {
          return reply.code(429).send({ error: "too_many_requests" })
        }

        request.log.error(dbErrorLog(error))
        throw new Error("не удалось войти")
      }

      return reply.code(200).send({ status: "ok" })
    },
  )

  app.post("/auth/logout", async (request, reply) => {
    /** Текущий токен. Подтверждение почты для выхода не нужно. */
    const token = readSessionToken(request, nodeEnv)

    if (token !== undefined) {
      /** Чья сессия отозвана. Нет идентификатора — живой сессии не было. */
      const userId = await revokeSession(token)

      if (userId !== undefined) {
        await writeAuthEvent("logout", userId)
      }
    }

    clearSessionCookie(reply, nodeEnv)
    return reply.code(200).send({ status: "ok" })
  })

  app.get(
    "/auth/me",
    { preHandler: requireSession(nodeEnv) },
    async (request, reply) => {
      /** Почта живой сессии. Других полей в ответе нет. */
      const email = readSessionEmail(request)

      if (email === undefined) {
        clearSessionCookie(reply, nodeEnv)
        return reply.code(401).send({ error: "unauthorized" })
      }

      return { email, emailVerified: true }
    },
  )

  app.post<{ Body: ResetRequestBody }>(
    "/auth/password-reset/request",
    {
      schema: { body: resetRequestBodySchema },
      config: {
        rateLimit: {
          max: resetRequestRateLimitMax,
          timeWindow: resetRequestRateLimitWindow,
        },
      },
      preValidation: async (request) => {
        normalizeEmail(request.body)
      },
    },
    async (request, reply) => {
      /** Почта из тела. В ответ и в лог она не входит. */
      const email = request.body.email

      reply.code(200).send({ status: "ok" })
      setImmediate(() => {
        void sendResetIfAllowed(email, webOrigin).catch((error: unknown) => {
          /** Имя сбоя. Почты и токена здесь нет. */
          const errorName = error instanceof Error ? error.name : "UnknownError"
          request.log.error({ errorName })
        })
      })
      return reply
    },
  )

  app.post<{ Body: ResetConfirmBody }>(
    "/auth/password-reset/confirm",
    {
      schema: { body: resetConfirmBodySchema },
      config: {
        rateLimit: {
          max: resetConfirmRateLimitMax,
          timeWindow: resetConfirmRateLimitWindow,
        },
      },
    },
    async (request, reply) => {
      /** Хеш присланного токена. Сам токен дальше не нужен. */
      const tokenHash = hashEmailToken(request.body.token)

      /** Живой токен сброса и владелец. Погашения ещё нет. */
      const found = await getDatabase()
        .select({
          tokenId: emailTokens.id,
          userId: users.id,
          email: users.email,
          dateOfBirth: users.dateOfBirth,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(emailTokens)
        .innerJoin(users, eq(users.id, emailTokens.userId))
        .where(
          and(
            eq(emailTokens.tokenHash, tokenHash),
            eq(emailTokens.purpose, "reset_password"),
            isNull(emailTokens.usedAt),
            sql`${emailTokens.expiresAt} > now()`,
          ),
        )
        .limit(1)

      /** Найденная строка. Нет её — токен чужой, старый или уже использован. */
      const account = found[0]

      if (!account) {
        return reply.code(400).send({ error: "invalid_token" })
      }

      if (rejectPassword(request.body.password, account.email, account.dateOfBirth).length > 0) {
        return reply.code(400).send({ error: "weak_password" })
      }

      /** Новый хеш. Пароль дальше не нужен. */
      let passwordHash: string

      try {
        passwordHash = await hashPassword(request.body.password)
      } catch (error: unknown) {
        if (error instanceof HashQueueFullError) {
          return reply.code(429).send({ error: "too_many_requests" })
        }

        throw error
      }

      /** Письмо после ответа. */
      let pendingMail: PendingMail | null = null

      try {
        pendingMail = await getDatabase().transaction(async (tx) => {
          /** Погашенная строка. Ноль строк — токен уже забрали в гонке. */
          const used = await tx
            .update(emailTokens)
            .set({ usedAt: new Date() })
            .where(
              and(
                eq(emailTokens.id, account.tokenId),
                isNull(emailTokens.usedAt),
                sql`${emailTokens.expiresAt} > now()`,
              ),
            )
            .returning({ id: emailTokens.id })

          if (!used[0]) {
            throw new InvalidTokenError()
          }

          await tx
            .update(passwordCredentials)
            .set({ passwordHash, updatedAt: new Date() })
            .where(eq(passwordCredentials.userId, account.userId))
          await tx
            .update(emailTokens)
            .set({ usedAt: new Date() })
            .where(and(eq(emailTokens.userId, account.userId), isNull(emailTokens.usedAt)))

          if (account.emailVerifiedAt === null) {
            await tx
              .update(users)
              .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
              .where(eq(users.id, account.userId))
          }

          await revokeAllUserSessions(account.userId, tx)
          await writeAuthEvent("password_reset_confirmed", account.userId, tx)
          await writeAuthEvent("session_revoked_all", account.userId, tx)
          await tx.insert(mailEvents).values({
            userId: account.userId,
            kind: "password_changed",
          })

          /** Текст письма. Почта уходит отдельно в sendMail. */
          const letter = passwordChangedLetter(webOrigin)

          return { to: account.email, subject: letter.subject, text: letter.text }
        })
      } catch (error: unknown) {
        if (error instanceof InvalidTokenError) {
          return reply.code(400).send({ error: "invalid_token" })
        }

        request.log.error(dbErrorLog(error))
        throw new Error("не удалось сменить пароль")
      }

      /** Ключи этой почты и текущего адреса. Адресную блокировку не снимаем. */
      const keys = throttleKeys(loginThrottleSecret, account.email, request.ip)

      try {
        await clearEmailAndPairFailures(keys.email, keys.pair)
      } catch (error: unknown) {
        /** Имя сбоя. Пароль уже сменён, клиенту всё равно отвечаем успехом. */
        const errorName = error instanceof Error ? error.name : "UnknownError"
        request.log.error({ errorName })
      }

      reply.code(200).send({ status: "ok" })
      deliverAfterResponse(request, pendingMail)
      return reply
    },
  )
}

/** Три согласия. Старые строки не удаляются. */
function acceptanceRows(userId: string, offerVersion: string, privacyVersion: string) {
  return [
    {
      userId,
      documentType: "age_confirmation",
      documentVersion: offerVersion,
    },
    {
      userId,
      documentType: "offer",
      documentVersion: offerVersion,
    },
    {
      userId,
      documentType: "personal_data_consent",
      documentVersion: privacyVersion,
    },
  ]
}

/** Можно ли слать ещё одно письмо этому пользователю. */
async function canSendMail(tx: AppTransaction, userId: string) {
  /** Число писем за минуту и за час. */
  const rows = await tx
    .select({
      recent: sql<string>`count(*) filter (where ${mailEvents.createdAt} > now() - interval '1 minute')`,
      hourly: sql<string>`count(*) filter (where ${mailEvents.createdAt} > now() - interval '1 hour')`,
    })
    .from(mailEvents)
    .where(eq(mailEvents.userId, userId))

  /** Счётчики. База может отдать число строкой. */
  const counts = rows[0]
  /** Письма за последнюю минуту. */
  const recent = Number(counts?.recent ?? 0)
  /** Письма за последний час. */
  const hourly = Number(counts?.hourly ?? 0)

  return recent < 1 && hourly < 5
}

/** Можно ли слать ещё одно письмо со сбросом. Считаются только события сброса. */
async function canSendResetMail(tx: AppTransaction, userId: string) {
  /** Число писем сброса за минуту и за час. */
  const rows = await tx
    .select({
      recent: sql<string>`count(*) filter (where ${mailEvents.createdAt} > now() - interval '1 minute')`,
      hourly: sql<string>`count(*) filter (where ${mailEvents.createdAt} > now() - interval '1 hour')`,
    })
    .from(mailEvents)
    .where(and(eq(mailEvents.userId, userId), eq(mailEvents.kind, "reset_password")))

  /** Счётчики. База может отдать число строкой. */
  const counts = rows[0]
  /** Письма сброса за последнюю минуту. */
  const recent = Number(counts?.recent ?? 0)
  /** Письма сброса за последний час. */
  const hourly = Number(counts?.hourly ?? 0)

  return recent < 1 && hourly < 5
}

/** После ответа ищет подтверждённую почту и, если лимит писем позволяет, шлёт ссылку сброса. */
async function sendResetIfAllowed(email: string, webOrigin: string) {
  /** Пользователь с этой почтой. Нет строки — адреса нет. */
  const found = await getDatabase()
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1)

  /** Найденная строка. */
  const user = found[0]

  if (!user || user.emailVerifiedAt === null) {
    return
  }

  /** Письмо. Пустое значит, что лимит писем уже выбран. */
  const pendingMail = await getDatabase().transaction(async (tx) => {
    if (!(await canSendResetMail(tx, user.id))) {
      return null
    }

    await tx
      .update(emailTokens)
      .set({ usedAt: new Date() })
      .where(
        and(eq(emailTokens.userId, user.id), eq(emailTokens.purpose, "reset_password"), isNull(emailTokens.usedAt)),
      )

    /** Новый токен. В базу пишется только хеш. */
    const created = createEmailToken()

    await tx.insert(emailTokens).values({
      userId: user.id,
      purpose: "reset_password",
      tokenHash: created.tokenHash,
      expiresAt: new Date(Date.now() + resetTokenTtlMs),
    })
    await tx.insert(mailEvents).values({
      userId: user.id,
      kind: "reset_password",
    })

    /** Текст письма. */
    const letter = resetPasswordLetter(webOrigin, created.token)

    return { to: email, subject: letter.subject, text: letter.text }
  })

  if (!pendingMail) {
    return
  }

  await sendMail(pendingMail.to, pendingMail.subject, pendingMail.text)
}

/** Гасит старые токены снаружи. Здесь создаёт новый и событие журнала. */
async function issueVerifyMail(tx: AppTransaction, userId: string, email: string, webOrigin: string) {
  /** Новый токен. Наружу из функции уходит только в тексте письма. */
  const created = createEmailToken()
  /** Срок ссылки: 24 часа от сейчас. */
  const expiresAt = new Date(Date.now() + verifyTokenTtlMs)

  await tx.insert(emailTokens).values({
    userId,
    purpose: "verify_email",
    tokenHash: created.tokenHash,
    expiresAt,
  })
  await tx.insert(mailEvents).values({
    userId,
    kind: "verify_email",
  })

  /** Текст письма. */
  const letter = verifyEmailLetter(webOrigin, created.token)

  return { to: email, subject: letter.subject, text: letter.text }
}

/** Печатает письмо после того, как ответ уже отдан клиенту. */
function deliverAfterResponse(
  request: { log: { error: (payload: { errorName: string }) => void } },
  pendingMail: PendingMail | null,
) {
  if (!pendingMail) {
    return
  }

  setImmediate(() => {
    void Promise.resolve()
      .then(() => sendMail(pendingMail.to, pendingMail.subject, pendingMail.text))
      .catch((error: unknown) => {
        /** Имя сбоя отправки. Текста письма и почты здесь нет. */
        const errorName = error instanceof Error ? error.name : "UnknownError"
        request.log.error({ errorName })
      })
  })
}

/** Убирает краевые пробелы и приводит почту к нижнему регистру до схемы. */
function normalizeEmail(body: unknown) {
  if (typeof body !== "object" || body === null || Array.isArray(body) || !("email" in body)) {
    return
  }

  /** Тело как запись, чтобы поправить почту на месте. */
  const record = body as { email?: unknown }

  if (typeof record.email !== "string") {
    return
  }

  record.email = record.email.trim().toLowerCase()
}

/** Дата существует, не раньше 1900 года и не в будущем по Москве. */
function isAllowedBirthDate(value: string) {
  if (!isRealCalendarDate(value)) {
    return false
  }

  if (value < earliestBirthDate || value > moscowToday()) {
    return false
  }

  return true
}

/** Проверяет, что день есть в календаре. 31 февраля сюда не проходит. */
function isRealCalendarDate(value: string) {
  /** Год, месяц и день из строки. */
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  /** Год. */
  const year = Number(match[1])

  /** Месяц от 1 до 12. */
  const month = Number(match[2])

  /** День месяца. */
  const day = Number(match[3])

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  /** Та же дата в UTC. Если день уехал, даты в календаре нет. */
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Сегодняшний день в Москве, формат ГГГГ-ММ-ДД. */
function moscowToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: moscowTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Полных лет на московский день. */
function fullYears(birthDate: string, today: string) {
  /** Разница годов. День рождения в этом году ещё может не наступить. */
  let years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4))

  if (today.slice(5) < birthDate.slice(5)) {
    years -= 1
  }

  return years
}

/** Имя ошибки и код Postgres, если он есть. Текст сообщения сюда не входит. */
function dbErrorLog(error: unknown) {
  /** Имя класса ошибки. У чужого значения имени нет. */
  const errorName = error instanceof Error ? error.name : "UnknownError"

  /** Код Postgres из самой ошибки или из вложенной причины. */
  const pgCode = readPgCode(error)

  if (pgCode === undefined) {
    return { errorName }
  }

  return { errorName, pgCode }
}

/** Достаёт код Postgres, не читая текст ошибки. */
function readPgCode(error: unknown) {
  /** Текущий уровень причины. */
  let current = error

  /** Глубина вложенности cause. Дальше пятого уровня не идём. */
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return undefined
    }

    if ("code" in current && typeof current.code === "string" && /^\d{5}$/.test(current.code)) {
      return current.code
    }

    if (!("cause" in current)) {
      return undefined
    }

    current = current.cause
  }

  return undefined
}

/** Код Postgres «значение уже есть». Текст ошибки не читаем: там может быть почта. */
function isUniqueViolation(error: unknown) {
  /** Текущий уровень причины. Drizzle прячет код базы во вложенном cause. */
  let current = error

  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return false
    }

    if ("code" in current && current.code === "23505") {
      return true
    }

    if (!("cause" in current)) {
      return false
    }

    current = current.cause
  }

  return false
}

export { registerAuthRoutes }
