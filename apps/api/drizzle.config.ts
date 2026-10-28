import { defineConfig } from "drizzle-kit"

/** Строка подключения. В сообщение об ошибке её не подставляем. */
const databaseUrl = process.env.DATABASE_URL

if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  throw new Error("DATABASE_URL не задан")
}

/** Настройки генератора миграций. */
const drizzleConfig = defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
})

export default drizzleConfig
