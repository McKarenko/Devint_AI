import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"

import "./globals.css"

/** Единственный шрифт продукта. Файлы лежат в проекте, лицензия OFL. */
const montserrat = localFont({
  src: "../fonts/Montserrat[wght].ttf",
  weight: "300 600",
  display: "swap",
  variable: "--font-montserrat",
})

/** Метаданные приложения. */
export const metadata: Metadata = {
  title: "devint_ai",
  description: "devint_ai",
}

/** Цвет панели браузера, чтобы при загрузке не мелькал белый. */
export const viewport: Viewport = {
  themeColor: "#05070b",
}

/** Корневой layout приложения. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${montserrat.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
