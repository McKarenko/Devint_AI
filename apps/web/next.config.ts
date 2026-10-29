import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import type { NextConfig } from "next"

/** Адрес API для браузера из корневого .env. Пароль базы не читается. */
function readPublicApiUrl() {
  /** Строки корневого файла настроек. */
  const lines = readFileSync(resolve(__dirname, "../../.env"), "utf8").split(/\r?\n/)
  /** Строка с адресом API. */
  const line = lines.find((item) => item.startsWith("NEXT_PUBLIC_API_URL="))
  /** Адрес без имени переменной. */
  const value = line?.slice("NEXT_PUBLIC_API_URL=".length).trim()

  if (!value) {
    throw new Error("в корневом .env нет NEXT_PUBLIC_API_URL")
  }

  return value
}

/** Заголовки каждого ответа сайта. HSTS здесь нет: его поставит HTTPS-прокси. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
]

/** Конфигурация Next.js для web-приложения devint_ai. */
const nextConfig: NextConfig = {
  transpilePackages: ["@devint_ai/ui"],
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL: readPublicApiUrl(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
