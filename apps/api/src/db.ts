import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

/** Клиент пула: не больше 10 подключений. */
let sqlClient: ReturnType<typeof postgres> | undefined

/** Обёртка Drizzle над тем же подключением. */
let database: ReturnType<typeof drizzle> | undefined

/** Открывает пул до 10 подключений. Повторный вызов ничего не делает. */
function openDatabase(databaseUrl: string) {
  if (sqlClient) {
    return
  }

  sqlClient = postgres(databaseUrl, { max: 10, connect_timeout: 10 })
  database = drizzle(sqlClient)
}

/** Проверяет, что база отвечает. Адрес и пароль в ошибку не попадают. */
async function checkDatabaseConnection() {
  if (!database) {
    throw new Error("подключение к базе ещё не открыто")
  }

  try {
    await database.execute(sql`select 1`)
  } catch {
    throw new Error("не удалось подключиться к базе")
  }
}

/** Закрывает подключение. Повторный вызов безопасен. */
async function closeDatabase() {
  if (!sqlClient) {
    return
  }

  /** Клиент, который сейчас закрываем. */
  const client = sqlClient

  sqlClient = undefined
  database = undefined
  await client.end({ timeout: 5 })
}

/** Возвращает подключение Drizzle. Если база не открыта, бросает ошибку. */
function getDatabase() {
  if (!database) {
    throw new Error("подключение к базе ещё не открыто")
  }

  return database
}

export { checkDatabaseConnection, closeDatabase, getDatabase, openDatabase }
