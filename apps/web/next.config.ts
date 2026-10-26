import type { NextConfig } from "next"

/** Конфигурация Next.js для web-приложения devint_ai. */
const nextConfig: NextConfig = {
  transpilePackages: ["@devint_ai/ui"],
  poweredByHeader: false,
}

export default nextConfig
