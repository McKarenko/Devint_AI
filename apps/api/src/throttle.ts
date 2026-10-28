import { createHmac } from "node:crypto"

import { and, eq, or, sql } from "drizzle-orm"

import { getDatabase } from "./db.js"
import { authEvents, loginFailures, trustedPairs } from "./db/schema.js"

/** Сколько неудач связки почты и адреса блокируют дальнейшие попытки. */
const pairFailureLimit = 5

/** Окно связки. */
const pairWindowMs = 15 * 60 * 1000

/** Сколько неудач одной почты блокируют её со всех адресов. */
const emailFailureLimit = 20

/** Окно почты. */
const emailWindowMs = 60 * 60 * 1000

/** Сколько неудач с одного адреса блокируют его для любой почты. */
const ipFailureLimit = 40

/** Окно адреса. */
const ipWindowMs = 60 * 60 * 1000

/** Что именно считаем в login_failures. */
type FailureKind = "pair" | "email" | "ip"

/** Событие журнала. Наружу эти строки не отдаются. */
type AuthEventKind =
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_reset_confirmed"
  | "session_revoked_all"

/** Три обезличенных ключа одной попытки. */
type ThrottleKeys = {
  pair: string
  email: string
  ip: string
}

/** Блокировка. Секунды до конца самого длинного окна. */
type ThrottleBlock = {
  retryAfterSeconds: number
}

/** Транзакция Drizzle. */
type DbTransaction = Parameters<Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]>[0]

/** Подключение или транзакция, куда можно записать событие. */
type EventWriter = ReturnType<typeof getDatabase> | DbTransaction

/** Дополняет группу IPv6 нулями слева до четырёх знаков. */
function padIpv6Group(group: string) {
  return group.padStart(4, "0")
}

/** Разворачивает сокращённую запись IPv6 в восемь групп. Неадрес возвращает пустую строку. */
function expandIpv6(value: string) {
  /** Левая и правая части вокруг «::». Больше одного такого сжатия быть не может. */
  const halves = value.split("::")

  if (halves.length > 2) {
    return ""
  }

  /** Группы до сжатия. */
  const left = halves[0] ? halves[0].split(":") : []
  /** Группы после сжатия. У записи без «::» правой части нет. */
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : []

  if (halves.length === 1) {
    if (left.length !== 8) {
      return ""
    }

    return left.map(padIpv6Group).join(":")
  }

  /** Сколько нулевых групп спрятано в «::». */
  const missing = 8 - left.length - right.length

  if (missing < 0) {
    return ""
  }

  return [...left, ...Array.from({ length: missing }, () => "0"), ...right].map(padIpv6Group).join(":")
}

/** Адрес для ключа попытки. У IPv6 остаются первые 64 бита, IPv4-mapped становится IPv4. */
function normalizeIpForThrottle(ip: string) {
  /** Адрес без пробелов и без зоны вроде %eth0. */
  const bare = ip.trim().toLowerCase().split("%")[0] ?? ""

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(bare)) {
    return bare
  }

  /** Хвост IPv4 внутри записи ::ffff:a.b.c.d. */
  const mappedDotted = bare.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)

  if (mappedDotted?.[1]) {
    return mappedDotted[1]
  }

  /** Восемь групп. Пустая строка значит, что это не IPv6. */
  const expanded = expandIpv6(bare)
  /** Группы развёрнутой записи. */
  const groups = expanded.split(":")

  if (groups.length !== 8) {
    return bare
  }

  if (groups.slice(0, 5).every((group) => group === "0000") && groups[5] === "ffff") {
    /** Старшие 16 бит адреса IPv4. */
    const high = Number.parseInt(groups[6] ?? "0", 16)
    /** Младшие 16 бит адреса IPv4. */
    const low = Number.parseInt(groups[7] ?? "0", 16)

    return `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`
  }

  return groups.slice(0, 4).join(":")
}

/** HMAC материала. В результат не входят почта и адрес. */
function attemptKey(secret: string, kind: FailureKind, material: string) {
  return createHmac("sha256", secret).update(`${kind}\0${material}`).digest("hex")
}

/** Ключи связки, почты и адреса. Почта уже в нижнем регистре. */
function throttleKeys(secret: string, email: string, ip: string): ThrottleKeys {
  /** Адрес после правила IPv6. В почтовый ключ он не входит. */
  const address = normalizeIpForThrottle(ip)

  return {
    pair: attemptKey(secret, "pair", `${email}\0${address}`),
    email: attemptKey(secret, "email", email),
    ip: attemptKey(secret, "ip", address),
  }
}

/** Секунды до освобождения окна. Меньше одной секунды не отдаём. */
function retryAfterSeconds(oldestMs: number, windowMs: number, nowMs: number) {
  /** Когда самая старая попытка окна выйдет из него. */
  const releaseMs = oldestMs + windowMs

  return Math.max(1, Math.ceil((releaseMs - nowMs) / 1000))
}

/** Время из ответа базы. Пустое значение значит, что попыток в окне нет. */
function readOldestMs(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  /** Момент попытки. База может отдать дату или строку. */
  const oldestMs = value instanceof Date ? value.getTime() : new Date(String(value)).getTime()

  if (Number.isNaN(oldestMs)) {
    return null
  }

  return oldestMs
}

/** Есть ли живая доверенная связка. Почтовую блокировку она снимает, остальные нет. */
async function isTrustedPair(pairKey: string) {
  /** Строка не старше 30 дней. */
  const found = await getDatabase()
    .select({ keyHash: trustedPairs.keyHash })
    .from(trustedPairs)
    .where(and(eq(trustedPairs.keyHash, pairKey), sql`${trustedPairs.lastSeenAt} > now() - interval '30 days'`))
    .limit(1)

  return found[0] !== undefined
}

/** Считает три окна по индексу. Не блокирует, если попыток меньше порога. */
async function checkLoginThrottle(keys: ThrottleKeys): Promise<ThrottleBlock | null> {
  /** Счётчики и признак доверенной связки. Запросы идут вместе. */
  const [rows, trusted] = await Promise.all([
    getDatabase()
      .select({
        pairCount: sql<number>`count(*) filter (where ${loginFailures.kind} = 'pair')::int`,
        pairOldest: sql<Date | null>`min(${loginFailures.createdAt}) filter (where ${loginFailures.kind} = 'pair')`,
        emailCount: sql<number>`count(*) filter (where ${loginFailures.kind} = 'email')::int`,
        emailOldest: sql<Date | null>`min(${loginFailures.createdAt}) filter (where ${loginFailures.kind} = 'email')`,
        ipCount: sql<number>`count(*) filter (where ${loginFailures.kind} = 'ip')::int`,
        ipOldest: sql<Date | null>`min(${loginFailures.createdAt}) filter (where ${loginFailures.kind} = 'ip')`,
      })
      .from(loginFailures)
      .where(
        or(
          and(
            eq(loginFailures.kind, "pair"),
            eq(loginFailures.keyHash, keys.pair),
            sql`${loginFailures.createdAt} > now() - interval '15 minutes'`,
          ),
          and(
            eq(loginFailures.kind, "email"),
            eq(loginFailures.keyHash, keys.email),
            sql`${loginFailures.createdAt} > now() - interval '1 hour'`,
          ),
          and(
            eq(loginFailures.kind, "ip"),
            eq(loginFailures.keyHash, keys.ip),
            sql`${loginFailures.createdAt} > now() - interval '1 hour'`,
          ),
        ),
      ),
    isTrustedPair(keys.pair),
  ])

  /** Строка счётчиков. На пустой выборке её может не быть. */
  const counts = rows[0]
  /** Сейчас. От этой точки считаются секунды Retry-After. */
  const nowMs = Date.now()
  /** Самая долгая блокировка из тех, что уже сработали. */
  let retryAfter = 0

  /** Неудачи связки. */
  const pairCount = Number(counts?.pairCount ?? 0)
  /** Неудачи почты. Доверенная связка этот порог не применяет. */
  const emailCount = trusted ? 0 : Number(counts?.emailCount ?? 0)
  /** Неудачи адреса. */
  const ipCount = Number(counts?.ipCount ?? 0)
  /** Самая старая связка в окне. */
  const pairOldest = readOldestMs(counts?.pairOldest)
  /** Самая старая почта в окне. */
  const emailOldest = trusted ? null : readOldestMs(counts?.emailOldest)
  /** Самый старый адрес в окне. */
  const ipOldest = readOldestMs(counts?.ipOldest)

  if (pairCount >= pairFailureLimit && pairOldest !== null) {
    retryAfter = Math.max(retryAfter, retryAfterSeconds(pairOldest, pairWindowMs, nowMs))
  }

  if (emailCount >= emailFailureLimit && emailOldest !== null) {
    retryAfter = Math.max(retryAfter, retryAfterSeconds(emailOldest, emailWindowMs, nowMs))
  }

  if (ipCount >= ipFailureLimit && ipOldest !== null) {
    retryAfter = Math.max(retryAfter, retryAfterSeconds(ipOldest, ipWindowMs, nowMs))
  }

  if (retryAfter === 0) {
    return null
  }

  return { retryAfterSeconds: retryAfter }
}

/** Пишет три строки неудачи. Проверка и запись намеренно не в одной транзакции. */
async function recordLoginFailure(keys: ThrottleKeys) {
  await getDatabase()
    .insert(loginFailures)
    .values([
      { kind: "pair", keyHash: keys.pair },
      { kind: "email", keyHash: keys.email },
      { kind: "ip", keyHash: keys.ip },
    ])
}

/** Удаляет неудачи связки после успешного входа. Почту и адрес не трогает. */
async function clearPairFailures(pairKey: string) {
  await getDatabase()
    .delete(loginFailures)
    .where(and(eq(loginFailures.kind, "pair"), eq(loginFailures.keyHash, pairKey)))
}

/** Снимает блокировку почты и этой связки после смены пароля. Адрес не трогает. */
async function clearEmailAndPairFailures(emailKey: string, pairKey: string) {
  await getDatabase()
    .delete(loginFailures)
    .where(
      or(
        and(eq(loginFailures.kind, "email"), eq(loginFailures.keyHash, emailKey)),
        and(eq(loginFailures.kind, "pair"), eq(loginFailures.keyHash, pairKey)),
      ),
    )
}

/** Запоминает связку успешного входа. Повтор в те же сутки время не двигает. */
async function rememberTrustedPair(pairKey: string) {
  /** Момент входа. Повторная запись за сутки его не подставит. */
  const seenAt = new Date()

  await getDatabase()
    .insert(trustedPairs)
    .values({ keyHash: pairKey, lastSeenAt: seenAt })
    .onConflictDoUpdate({
      target: trustedPairs.keyHash,
      set: { lastSeenAt: seenAt },
      setWhere: sql`${trustedPairs.lastSeenAt} < now() - interval '1 day'`,
    })
}

/** Пишет событие журнала. Почты и адреса в строке нет. */
async function writeAuthEvent(kind: AuthEventKind, userId: string | null, writer: EventWriter = getDatabase()) {
  await writer.insert(authEvents).values({
    userId,
    kind,
  })
}

export {
  checkLoginThrottle,
  clearEmailAndPairFailures,
  clearPairFailures,
  normalizeIpForThrottle,
  recordLoginFailure,
  rememberTrustedPair,
  throttleKeys,
  writeAuthEvent,
}
