import { readApiConfig } from "./config.js"
import { checkDatabaseConnection, closeDatabase, openDatabase } from "./db.js"

/** Проверяет соединение и завершает процесс. Строку подключения не печатает. */
async function runDatabaseCheck() {
  /** Проверенные настройки, включая DATABASE_URL. */
  const config = readApiConfig()

  openDatabase(config.databaseUrl)
  await checkDatabaseConnection()
  console.log("соединение есть")
  await closeDatabase()
}

runDatabaseCheck().catch((error: unknown) => {
  /** Короткая причина без адреса и пароля. */
  const reason = error instanceof Error ? error.message : "не удалось подключиться к базе"

  console.error(reason)
  process.exit(1)
})
