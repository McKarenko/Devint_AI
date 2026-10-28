/** Допустимые режимы запуска. */
const nodeEnvValues = ["development", "production", "test"] as const

/** Режим запуска API. */
type NodeEnv = (typeof nodeEnvValues)[number]

/** Куда девать письма, пока нет настоящего сервиса. */
const mailModeValues = ["console", "disabled"] as const

/** Режим писем в разработке. */
type MailMode = (typeof mailModeValues)[number]

/** Проверенные настройки API. */
type ApiConfig = {
  /** Адрес, на котором слушает сервер. */
  apiHost: string
  /** Порт сервера. */
  apiPort: number
  /** Единственный адрес сайта, которому браузеру можно ходить на API. */
  webOrigin: string
  /** Режим запуска. */
  nodeEnv: NodeEnv
  /** Куда писать письма в разработке. */
  mailMode: MailMode
  /** Строка подключения к базе. В логи её не писать. */
  databaseUrl: string
  /** Секрет обезличенных ключей попыток входа. В логи его не писать. */
  loginThrottleSecret: string
}

/** Хост по умолчанию: только этот компьютер, не вся локальная сеть. */
const defaultApiHost = "127.0.0.1"

/** Порт по умолчанию. */
const defaultApiPort = 4000

/** Адрес сайта по умолчанию для локальной разработки. */
const defaultWebOrigin = "http://localhost:3000"

/** Минимальный допустимый порт. */
const minPort = 1

/** Максимальный допустимый порт. */
const maxPort = 65535

/** Короче этого секрет попыток входа не принимаем. */
const minLoginThrottleSecretLength = 32

/** Читает настройки из окружения и останавливает запуск, если они неверные. */
function readApiConfig(): ApiConfig {
  /** Режим запуска. От него зависит, можно ли стартовать без почтового сервиса. */
  const nodeEnv = readNodeEnv()

  return {
    apiHost: readApiHost(),
    apiPort: readApiPort(),
    webOrigin: readWebOrigin(),
    nodeEnv,
    mailMode: readMailMode(nodeEnv),
    databaseUrl: readDatabaseUrl(),
    loginThrottleSecret: readLoginThrottleSecret(),
  }
}

/** Читает API_HOST. Пустая строка недопустима. */
function readApiHost(): string {
  /** Сырое значение или отсутствие переменной. */
  const rawHost = process.env.API_HOST

  /** Хост после обрезки пробелов. */
  const apiHost = rawHost === undefined ? defaultApiHost : rawHost.trim()

  if (apiHost.length === 0 || /\s/.test(apiHost)) {
    throw new Error("API_HOST должен быть адресом без пробелов, например 127.0.0.1")
  }

  return apiHost
}

/** Читает API_PORT. Нужно целое число от 1 до 65535. */
function readApiPort(): number {
  /** Сырое значение или отсутствие переменной. */
  const rawPort = process.env.API_PORT

  /** Текст порта. */
  const portText = rawPort === undefined ? String(defaultApiPort) : rawPort.trim()

  if (!/^\d+$/.test(portText)) {
    throw new Error("API_PORT должен быть целым числом от 1 до 65535")
  }

  /** Разобранный порт. */
  const apiPort = Number(portText)

  if (apiPort < minPort || apiPort > maxPort) {
    throw new Error("API_PORT должен быть целым числом от 1 до 65535")
  }

  return apiPort
}

/** Читает WEB_ORIGIN. Адрес без пути, параметров и якоря. */
function readWebOrigin(): string {
  /** Сырое значение или отсутствие переменной. */
  const rawOrigin = process.env.WEB_ORIGIN

  /** Текст адреса. */
  const originText = rawOrigin === undefined ? defaultWebOrigin : rawOrigin.trim()

  /** Разобранный адрес. */
  let url: URL

  try {
    url = new URL(originText)
  } catch {
    throw new Error("WEB_ORIGIN должен быть адресом вида http://localhost:3000")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("WEB_ORIGIN должен начинаться с http:// или https://")
  }

  if (url.username.length > 0 || url.password.length > 0) {
    throw new Error("WEB_ORIGIN не должен содержать логин или пароль")
  }

  if (url.pathname !== "/" || url.search.length > 0 || url.hash.length > 0) {
    throw new Error("WEB_ORIGIN должен быть адресом без пути, параметров и якоря")
  }

  return url.origin
}

/** Читает NODE_ENV. Пустое значение означает development. */
function readNodeEnv(): NodeEnv {
  /** Сырое значение или отсутствие переменной. */
  const rawEnv = process.env.NODE_ENV

  /** Текст режима. */
  const nodeEnv = rawEnv === undefined ? "development" : rawEnv.trim()

  if (!isNodeEnv(nodeEnv)) {
    throw new Error("NODE_ENV должен быть development, production или test")
  }

  return nodeEnv
}

/** Читает DATABASE_URL. Пароля по умолчанию нет, сам адрес в ошибку не попадает. */
function readDatabaseUrl(): string {
  /** Сырое значение или отсутствие переменной. */
  const rawUrl = process.env.DATABASE_URL

  if (rawUrl === undefined || rawUrl.trim().length === 0) {
    throw new Error("DATABASE_URL не задан")
  }

  /** Текст адреса без краевых пробелов. */
  const databaseUrl = rawUrl.trim()

  /** Разобранный адрес. */
  let url: URL

  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error("DATABASE_URL должен быть адресом postgresql://")
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL должен начинаться с postgresql:// или postgres://")
  }

  if (url.username.length === 0 || url.password.length === 0) {
    throw new Error("DATABASE_URL должен содержать пользователя и пароль")
  }

  if (url.hostname.length === 0) {
    throw new Error("DATABASE_URL должен содержать хост")
  }

  /** Имя базы из пути адреса. */
  const databaseName = url.pathname.replace(/^\//, "")

  if (databaseName.length === 0) {
    throw new Error("DATABASE_URL должен содержать имя базы")
  }

  return databaseUrl
}

/** Читает LOGIN_THROTTLE_SECRET. Короткий или пустой секрет не даёт серверу стартовать. */
function readLoginThrottleSecret(): string {
  /** Сырое значение или отсутствие переменной. */
  const rawSecret = process.env.LOGIN_THROTTLE_SECRET

  /** Секрет без краевых пробелов. Само значение в ошибку не попадает. */
  const loginThrottleSecret = rawSecret === undefined ? "" : rawSecret.trim()

  if (loginThrottleSecret.length < minLoginThrottleSecretLength) {
    throw new Error("LOGIN_THROTTLE_SECRET должен быть не короче 32 символов")
  }

  return loginThrottleSecret
}

/** Читает MAIL_MODE. В production без настоящего сервиса сервер не стартует. */
function readMailMode(nodeEnv: NodeEnv): MailMode {
  if (nodeEnv === "production") {
    throw new Error("В production нужен настоящий сервис отправки писем. Его ещё нет, сервер не запускается.")
  }

  /** Сырое значение или отсутствие переменной. */
  const rawMode = process.env.MAIL_MODE

  /** Режим писем. Пустое значение — печать в терминал. */
  const mailMode = rawMode === undefined ? "console" : rawMode.trim()

  if (!isMailMode(mailMode)) {
    throw new Error("MAIL_MODE должен быть console или disabled")
  }

  return mailMode
}

/** Проверяет, что строка входит в список режимов писем. */
function isMailMode(value: string): value is MailMode {
  return mailModeValues.some((item) => item === value)
}

/** Проверяет, что строка входит в список режимов. */
function isNodeEnv(value: string): value is NodeEnv {
  return nodeEnvValues.some((item) => item === value)
}

export { readApiConfig, type ApiConfig, type MailMode, type NodeEnv }
