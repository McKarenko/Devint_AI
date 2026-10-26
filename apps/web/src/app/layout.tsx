import type { Metadata } from "next"
import { Playfair_Display_SC } from "next/font/google"

import "./globals.css"

/** Единственный шрифт продукта (SIL OFL 1.1 — коммерческое использование разрешено). */
const playfairDisplaySc = Playfair_Display_SC({
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair-display-sc",
  display: "swap",
})

/** Метаданные приложения. */
export const metadata: Metadata = {
  title: "devint_ai",
  description: "devint_ai",
}

/** Корневой layout приложения. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${playfairDisplaySc.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
