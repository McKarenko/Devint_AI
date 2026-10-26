/** Порт API из окружения или значение по умолчанию. */
const apiPort = Number(process.env.API_PORT ?? 4000)

/** Хост API из окружения или значение по умолчанию. */
const apiHost = process.env.API_HOST ?? "0.0.0.0"

/**
 * Точка входа API-каркаса.
 * Бизнес-логика пока не подключена — только заглушка запуска.
 */
function startApiSkeleton() {
  // eslint-disable-next-line no-console
  console.log(`[devint_ai/api] skeleton listening plan: ${apiHost}:${apiPort}`)
}

startApiSkeleton()
