import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

/** Папка этого файла: src при запуске из исходников и dist после сборки. */
const here = dirname(fileURLToPath(import.meta.url))

/** Применяет миграции и права роли приложения. Адрес базы в лог не пишется. */
async function runMigrations() {
  /** Адрес роли миграций. Роль приложения сюда не подставляем. */
  const migrateUrl = process.env.MIGRATE_DATABASE_URL?.trim() ?? ""

  if (migrateUrl.length === 0) {
    console.error("Миграции не запущены: MIGRATE_DATABASE_URL не задан")
    process.exit(1)
  }

  /** Одно подключение. Его закрываем в любом исходе. */
  const sqlClient = postgres(migrateUrl, { max: 1 })

  try {
    await migrate(drizzle(sqlClient), { migrationsFolder: join(here, "../drizzle") })
    await sqlClient.unsafe(readFileSync(join(here, "../../../infrastructure/docker/grant-app.sql"), "utf8"))
  } catch (error: unknown) {
    /** Имя ошибки. Текст может содержать адрес базы, поэтому его не печатаем. */
    const errorName = error instanceof Error ? error.name : "UnknownError"

    console.error(`Миграции не выполнены: ${errorName}`)
    process.exitCode = 1
  } finally {
    await sqlClient.end({ timeout: 5 })
  }
}

await runMigrations()
