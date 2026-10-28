import type { ReactNode } from "react"

import { BrandLogo } from "./brand-logo"
import "./auth.css"

/** Общая оболочка: фон, логотип и название. Карточка живёт отдельно и может уезжать. */
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <BrandLogo />
      <p className="auth-wordmark">
        <span>DEVINT </span>
        <span className="auth-wordmark-ai">AI</span>
      </p>
      {children}
    </main>
  )
}

export { AuthShell }
