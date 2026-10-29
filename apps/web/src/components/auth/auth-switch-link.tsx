"use client"

import type { MouseEvent, ReactNode } from "react"

/** Обычный вход. */
const loginHref = "/login" as const

/** Регистрация. */
const registerHref = "/register" as const

/** Запрос ссылки на сброс. Это тот же вход, не отдельная страница. */
const resetRequestHref = "/login?reset=1" as const

/** Адрес соседней карточки входа. */
type AuthSwitchHref = typeof loginHref | typeof registerHref | typeof resetRequestHref

/** Ссылка между карточками входа. Без скрипта остаётся обычным переходом. */
function AuthSwitchLink({
  href,
  className,
  children,
}: {
  href: AuthSwitchHref
  className?: string
  children: ReactNode
}) {
  /** Просит сцену сначала увезти карточку, а уже потом сменить адрес. */
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }

    event.preventDefault()
    window.dispatchEvent(new CustomEvent("auth-switch", { detail: href }))
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

export { AuthSwitchLink, loginHref, registerHref, resetRequestHref }
