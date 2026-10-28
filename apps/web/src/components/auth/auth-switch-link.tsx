"use client"

import type { MouseEvent, ReactNode } from "react"

/** Адрес соседней страницы входа. */
type AuthSwitchHref = "/login" | "/register"

/** Ссылка между входом и регистрацией. Без скрипта остаётся обычным переходом. */
function AuthSwitchLink({ href, children }: { href: AuthSwitchHref; children: ReactNode }) {
  /** Просит сцену сначала увезти карточку, а уже потом сменить адрес. */
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }

    event.preventDefault()
    window.dispatchEvent(new CustomEvent("auth-switch", { detail: href }))
  }

  return (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  )
}

export { AuthSwitchLink }
