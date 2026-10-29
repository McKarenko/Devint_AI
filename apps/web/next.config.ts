import type { NextConfig } from "next"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

/** Берёт адрес API из apps/web/.env.local, если его ещё нет в окружении. Корневой .env не читает. */
function fillPublicApiUrlFromLocalFile() {
  if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
    return
  }

  /** Локальный файл сайта. Его нет в git. */
  const filePath = join(process.cwd(), ".env.local")

  if (!existsSync(filePath)) {
    return
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    /** Строка без пробелов по краям. */
    const trimmed = line.trim()

    if (!trimmed.startsWith("NEXT_PUBLIC_API_URL=")) {
      continue
    }

    /** Значение после знака равенства, без кавычек. */
    const value = trimmed.slice("NEXT_PUBLIC_API_URL=".length).trim().replace(/^["']|["']$/g, "")

    if (value.length > 0) {
      process.env.NEXT_PUBLIC_API_URL = value
    }
  }
}

fillPublicApiUrlFromLocalFile()

/** Адрес API для браузера. Пустое значение роняет запуск, а не формы по одной. */
function readPublicApiUrl() {
  /** Сырое значение или отсутствие переменной. */
  const rawUrl = process.env.NEXT_PUBLIC_API_URL

  /** Адрес без краевых пробелов. */
  const apiUrl = rawUrl === undefined ? "" : rawUrl.trim()

  if (apiUrl.length === 0) {
    throw new Error(
      "NEXT_PUBLIC_API_URL не задан. Сайт не знает адрес API. Задайте его в apps/web/.env.local или в окружении перед запуском и перед сборкой.",
    )
  }

  /** Разобранный адрес. */
  let url: URL

  try {
    url = new URL(apiUrl)
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL должен быть адресом вида http://localhost:4000")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_URL должен начинаться с http:// или https://")
  }

  if (url.username.length > 0 || url.password.length > 0) {
    throw new Error("NEXT_PUBLIC_API_URL не должен содержать логин или пароль")
  }

  if (url.pathname !== "/" || url.search.length > 0 || url.hash.length > 0) {
    throw new Error("NEXT_PUBLIC_API_URL должен быть адресом без пути, параметров и якоря")
  }

  return url.origin
}

/** Адрес API, который вшивается в страницы. */
const publicApiUrl = readPublicApiUrl()

/** Корень репозитория. Нужен, чтобы сборка сайта видела пакеты монорепозитория. */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

/** Заголовки каждого ответа сайта. HSTS здесь нет: его поставит HTTPS-прокси. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
]

/** Конфигурация Next.js для web-приложения devint_ai. */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@devint_ai/ui"],
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
