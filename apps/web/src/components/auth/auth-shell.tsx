import type { ReactNode } from "react"

import { AuthCard } from "./auth-card"
import { BrandLogo } from "./brand-logo"
import "./auth.css"

/** Общая оболочка страниц входа: фон, логотип, название и карточка. */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <BrandLogo />
      <p className="auth-wordmark">
        <span>DEVINT </span>
        <span className="auth-wordmark-ai">AI</span>
      </p>
      <AuthCard>{children}</AuthCard>
    </main>
  )
}

export { AuthShell }
