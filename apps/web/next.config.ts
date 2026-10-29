import type { NextConfig } from "next"

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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
