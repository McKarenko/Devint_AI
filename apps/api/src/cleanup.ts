import { and, isNotNull, isNull, or, sql } from "drizzle-orm"

import { getDatabase } from "./db.js"
import { authEvents, emailTokens, loginFailures, mailEvents, sessions, trustedPairs, users } from "./db/schema.js"

/** Как часто повторять чистку. */
const cleanupIntervalMs = 60 * 60 * 1000

/** Куда писать имя ошибки. Текст и почта сюда не входят. */
type CleanupLog = (errorName: string) => void

/** Удаляет старые аккаунты, токены, письма, сессии, попытки входа и журнал. */
async function runAccountCleanup() {
  /** Подключение. Его открывают до вызова чистки. */
  const database = getDatabase()

  await database
    .delete(users)
    .where(and(isNull(users.emailVerifiedAt), sql`${users.updatedAt} < now() - interval '24 hours'`))

  await database.delete(emailTokens).where(
    and(
      or(isNotNull(emailTokens.usedAt), sql`${emailTokens.expiresAt} < now()`),
      sql`${emailTokens.createdAt} < now() - interval '7 days'`,
    ),
  )

  await database.delete(mailEvents).where(sql`${mailEvents.createdAt} < now() - interval '7 days'`)

  await database.delete(sessions).where(
    or(
      sql`${sessions.expiresAt} < now() - interval '7 days'`,
      sql`${sessions.absoluteExpiresAt} < now() - interval '7 days'`,
      sql`${sessions.revokedAt} < now() - interval '7 days'`,
    ),
  )

  await database.delete(loginFailures).where(sql`${loginFailures.createdAt} < now() - interval '24 hours'`)

  await database.delete(authEvents).where(sql`${authEvents.createdAt} < now() - interval '90 days'`)

  await database.delete(trustedPairs).where(sql`${trustedPairs.lastSeenAt} < now() - interval '30 days'`)
}

/** Запускает чистку сразу и потом раз в час. Таймер не держит процесс. */
async function startAccountCleanup(logError: CleanupLog) {
  try {
    await runAccountCleanup()
  } catch (error: unknown) {
    logError(error instanceof Error ? error.name : "UnknownError")
  }

  /** Повтор чистки. unref позволяет процессу завершиться, не дожидаясь часа. */
  const timer = setInterval(() => {
    void runAccountCleanup().catch((error: unknown) => {
      logError(error instanceof Error ? error.name : "UnknownError")
    })
  }, cleanupIntervalMs)

  timer.unref()

  return function stopAccountCleanup() {
    clearInterval(timer)
  }
}

export { startAccountCleanup }
