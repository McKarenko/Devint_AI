import { startAccountCleanup } from "./cleanup.js"
import { readApiConfig } from "./config.js"
import { checkDatabaseConnection, closeDatabase, openDatabase } from "./db.js"
import { loadPasswordLists } from "./password-policy.js"
import { prepareDummyPasswordHash } from "./password.js"
import { buildApiApp } from "./server.js"

/** Запускает API и закрывает его по сигналу остановки. */
async function startApi() {
  /** Проверенные настройки. При ошибке сервер не стартует. */
  const config = readApiConfig()

  /** Списки частых паролей. Цифры без самих паролей. */
  const passwordLists = loadPasswordLists()
  console.log(
    `списки паролей: ${passwordLists.loadMs} мс, ${passwordLists.bytes} байт, ${passwordLists.count} значений`,
  )

  openDatabase(config.databaseUrl)
  await checkDatabaseConnection()

  /** Время фиктивного хеша. Сам хеш в эту строку не входит. */
  const dummyPasswordMs = await prepareDummyPasswordHash()
  console.log(`фиктивный хеш пароля: ${dummyPasswordMs} мс`)

  /** Собранное приложение. */
  const app = await buildApiApp(config)

  /** Останавливает часовую чистку. Её таймер не должен держать процесс. */
  const stopCleanup = await startAccountCleanup((errorName) => {
    app.log.error({ errorName })
  })

  /** Уже идёт закрытие. Второй сигнал не должен закрывать сервер ещё раз. */
  let closing = false

  /** Закрывает чистку, сервер, затем подключение к базе. */
  async function stopApi() {
    if (closing) {
      return
    }

    closing = true
    stopCleanup()
    await app.close()
    await closeDatabase()
  }

  process.once("SIGINT", () => {
    void stopApi().then(() => {
      process.exit(0)
    })
  })

  process.once("SIGTERM", () => {
    void stopApi().then(() => {
      process.exit(0)
    })
  })

  await app.listen({ host: config.apiHost, port: config.apiPort })
}

startApi().catch((error: unknown) => {
  /** Текст причины без стека. */
  const reason = error instanceof Error ? error.message : "неизвестная ошибка"

  console.error(`API не запущен: ${reason}`)
  process.exit(1)
})
