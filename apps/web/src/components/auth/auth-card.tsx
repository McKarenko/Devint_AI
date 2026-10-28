import type { ReactNode } from "react"

/** Карточка формы. По рамке пробегает синий огонёк. */
function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section className="auth-card">
      <div className="auth-card-body">{children}</div>
    </section>
  )
}

export { AuthCard }
