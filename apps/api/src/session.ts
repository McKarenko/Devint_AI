import { createHash, randomBytes } from "node:crypto"

import { and, asc, eq, gt, isNull, sql } from "drizzle-orm"
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify"

import "@fastify/cookie"

import { type NodeEnv } from "./config.js"
import { getDatabase } from "./db.js"
import { sessions, users } from "./db/schema.js"

/** Скользящий срок сессии и Max-Age cookie. */
const sessionTtlMs = 30 * 24 * 60 * 60 * 1000

/** Потолок со дня входа. Дольше этого продление не идёт. */
const absoluteSessionTtlMs = 90 * 24 * 60 * 60 * 1000

/** Как часто писать продление. Чаще этого базу не трогаем. */
const sessionRenewAfterMs = 15 * 60 * 1000

/** Сколько живых сессий можно держать на одного пользователя. */
const maxLiveSessions = 10

/** Сколько случайных байт в токене. */
const sessionTokenBytes = 32

/** Имя cookie в разработке. */
const sessionCookieBaseName = "devint_session"

/** Префикс имени cookie в production. С ним Secure обязателен, Domain нельзя. */
const productionCookiePrefix = "__Host-"

/** Max-Age cookie в секундах. Совпадает со сроком 30 дней. */
const sessionCookieMaxAgeSeconds = 30 * 24 * 60 * 60

/** Почта живой сессии. Ключ — сам запрос, чтобы не тащить её в логи. */
const sessionEmails = new WeakMap<FastifyRequest, string>()

/** Токен и его хеш. В базу и в логи попадает только хеш. */
type SessionToken = {
  token: string
  tokenHash: string
}

/** Живая сессия и почта владельца. Идентификатор наружу не отдаём. */
type ActiveSession = {
  email: string
  expiresAt: Date
  absoluteExpiresAt: Date
  renewed: boolean
}

/** Случайный токен и sha256 в hex. */
function createSessionToken(): SessionToken {
  /** Сам токен для cookie. В базе его не храним. */
  const token = randomBytes(sessionTokenBytes).toString("base64url")

  return { token, tokenHash: hashSessionToken(token) }
}

/** Хеш токена сессии. Сам токен в результат не входит. */
function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

/** Имя cookie. В production с префиксом __Host-. */
function sessionCookieName(nodeEnv: NodeEnv) {
  if (nodeEnv === "production") {
    return `${productionCookiePrefix}${sessionCookieBaseName}`
  }

  return sessionCookieBaseName
}

/** Флаги cookie. Domain не задаём. Secure только в production. */
function sessionCookieFlags(nodeEnv: NodeEnv) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: nodeEnv === "production",
  }
}

/** Секунды жизни cookie. Не больше 30 дней и не дальше потолка сессии. */
function cookieMaxAgeSeconds(absoluteExpiresAt: Date, now: Date) {
  /** Целые секунды до потолка. Отрицательное значит, что потолок уже прошёл. */
  const remainingSeconds = Math.floor((absoluteExpiresAt.getTime() - now.getTime()) / 1000)

  if (remainingSeconds < 0) {
    return 0
  }

  if (remainingSeconds > sessionCookieMaxAgeSeconds) {
    return sessionCookieMaxAgeSeconds
  }

  return remainingSeconds
}

/** Max-Age новой сессии. Потолок 90 дней, поэтому здесь выходит 30 дней. */
function cookieMaxAgeForNewSession(now: Date) {
  return cookieMaxAgeSeconds(new Date(now.getTime() + absoluteSessionTtlMs), now)
}

/** Кладёт тот же токен в cookie. Значение в лог не пишем. */
function setSessionCookie(reply: FastifyReply, token: string, nodeEnv: NodeEnv, maxAgeSeconds: number) {
  reply.setCookie(sessionCookieName(nodeEnv), token, {
    ...sessionCookieFlags(nodeEnv),
    maxAge: maxAgeSeconds,
  })
}

/** Стирает cookie теми же флагами и Max-Age 0. */
function clearSessionCookie(reply: FastifyReply, nodeEnv: NodeEnv) {
  reply.clearCookie(sessionCookieName(nodeEnv), sessionCookieFlags(nodeEnv))
}

/** Достаёт токен из cookie. Пустую строку считаем отсутствием. */
function readSessionToken(request: FastifyRequest, nodeEnv: NodeEnv) {
  /** Значение cookie. Его нет, если человек ещё не входил. */
  const token = request.cookies[sessionCookieName(nodeEnv)]

  if (typeof token !== "string" || token.length === 0) {
    return undefined
  }

  return token
}

/** Создаёт сессию и возвращает токен для cookie. Старую сессию из запроса отзывает. */
async function createSession(userId: string, previousToken: string | undefined) {
  /** Новый токен. Наружу уходит только он, в базу — хеш. */
  const created = createSessionToken()

  /** Сейчас. От этой точки считаются оба срока. */
  const now = new Date()

  await getDatabase().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId})::bigint)`)

    if (previousToken !== undefined) {
      await tx
        .update(sessions)
        .set({ revokedAt: now })
        .where(and(eq(sessions.tokenHash, hashSessionToken(previousToken)), isNull(sessions.revokedAt)))
    }

    /** Живые сессии этого человека, старые впереди. */
    const live = await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now),
          gt(sessions.absoluteExpiresAt, now),
        ),
      )
      .orderBy(asc(sessions.createdAt))

    /** Самая старая живая сессия. Её отзываем, если мест уже нет. */
    const oldest = live[0]

    if (live.length >= maxLiveSessions && oldest) {
      await tx.update(sessions).set({ revokedAt: now }).where(eq(sessions.id, oldest.id))
    }

    await tx.insert(sessions).values({
      userId,
      tokenHash: created.tokenHash,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + sessionTtlMs),
      absoluteExpiresAt: new Date(now.getTime() + absoluteSessionTtlMs),
    })
  })

  return created.token
}

/** Ищет живую сессию по токену и продлевает её, если прошло 15 минут. */
async function findActiveSession(token: string) {
  /** Сейчас. Просроченная сессия сюда не попадает. */
  const now = new Date()

  /** Строка сессии и почта. Нет строки — токен чужой, отозван или просрочен. */
  const found = await getDatabase()
    .select({
      id: sessions.id,
      email: users.email,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
      absoluteExpiresAt: sessions.absoluteExpiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        gt(sessions.absoluteExpiresAt, now),
      ),
    )
    .limit(1)

  /** Найденная сессия. */
  const session = found[0]

  if (!session) {
    return null
  }

  if (now.getTime() - session.lastSeenAt.getTime() >= sessionRenewAfterMs) {
    /** Новый срок. Пустой ответ значит, что сессию уже отозвали. */
    const expiresAt = await renewSession(session.id, session.absoluteExpiresAt, now)

    if (!expiresAt) {
      return null
    }

    return {
      email: session.email,
      expiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
      renewed: true,
    } satisfies ActiveSession
  }

  return {
    email: session.email,
    expiresAt: session.expiresAt,
    absoluteExpiresAt: session.absoluteExpiresAt,
    renewed: false,
  } satisfies ActiveSession
}

/** Сдвигает срок к минимуму из «сейчас + 30 дней» и потолка. Пусто, если строку уже отозвали. */
async function renewSession(sessionId: string, absoluteExpiresAt: Date, now: Date) {
  /** Новый скользящий срок. Дальше потолка не уезжает. */
  const expiresAt = new Date(Math.min(now.getTime() + sessionTtlMs, absoluteExpiresAt.getTime()))

  /** Обновлённая строка. Нет её — сессию успели отозвать. */
  const updated = await getDatabase()
    .update(sessions)
    .set({ lastSeenAt: now, expiresAt })
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
    .returning({ id: sessions.id })

  if (!updated[0]) {
    return null
  }

  return expiresAt
}

/** Отзывает одну сессию по токену и возвращает её пользователя. Почта здесь не нужна. */
async function revokeSession(token: string) {
  /** Отозванная строка. Нет её — живой сессии с этим токеном не было. */
  const revoked = await getDatabase()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), isNull(sessions.revokedAt)))
    .returning({ userId: sessions.userId })

  return revoked[0]?.userId
}

/** Транзакция Drizzle. Её update совпадает с подключением. */
type SessionTransaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0]

/** Подключение или транзакция, в которой можно обновить сессии. */
type SessionStore = Pick<ReturnType<typeof getDatabase>, "update"> | SessionTransaction

/** Отзывает все живые сессии пользователя. Второй аргумент — та же транзакция, что смена пароля. */
async function revokeAllUserSessions(userId: string, store: SessionStore = getDatabase()) {
  await store
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))
}

/** Пускает дальше только с живой сессией. Иначе 401 и cookie стирается. */
function requireSession(nodeEnv: NodeEnv): preHandlerHookHandler {
  return async function requireSession(request, reply) {
    /** Токен из cookie. Его нет — человек не вошёл. */
    const token = readSessionToken(request, nodeEnv)

    if (token === undefined) {
      clearSessionCookie(reply, nodeEnv)
      return reply.code(401).send({ error: "unauthorized" })
    }

    /** Живая сессия. Продление уже внутри поиска. */
    const session = await findActiveSession(token)

    if (!session) {
      clearSessionCookie(reply, nodeEnv)
      return reply.code(401).send({ error: "unauthorized" })
    }

    sessionEmails.set(request, session.email)

    if (session.renewed) {
      setSessionCookie(reply, token, nodeEnv, cookieMaxAgeSeconds(session.absoluteExpiresAt, new Date()))
    }
  }
}

/** Почта, которую положил requireSession. Без него значения нет. */
function readSessionEmail(request: FastifyRequest) {
  return sessionEmails.get(request)
}

export {
  clearSessionCookie,
  cookieMaxAgeForNewSession,
  createSession,
  findActiveSession,
  readSessionEmail,
  readSessionToken,
  renewSession,
  requireSession,
  revokeAllUserSessions,
  revokeSession,
  setSessionCookie,
}
