"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react"

/** Обычный вход. */
const loginHref = "/login" as const

/** Регистрация. */
const registerHref = "/register" as const

/** Запрос ссылки на сброс. Это тот же вход, не отдельная страница. */
const resetRequestHref = "/login?reset=1" as const

/** Адрес соседней карточки входа. */
type AuthSwitchHref = typeof loginHref | typeof registerHref | typeof resetRequestHref

/** Сколько ждать, прежде чем перейти самим, если сцена клик не взяла. */
const fallbackMs = 100

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
  /** Запасной переход, если сцена клик не взяла. */
  const router = useRouter()
  /** Запасной переход. Сбрасывается, если сцена успела взять клик. */
  const fallbackTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (fallbackTimer.current !== null) {
        window.clearTimeout(fallbackTimer.current)
      }
    }
  }, [])

  /** Просит сцену сначала увезти карточку, а уже потом сменить адрес. */
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }

    event.preventDefault()

    if (fallbackTimer.current !== null) {
      window.clearTimeout(fallbackTimer.current)
      fallbackTimer.current = null
    }

    /** Сцена отменяет событие, когда берёт проезд. Занятая сцена его не трогает. */
    const switched = new CustomEvent<AuthSwitchHref>("auth-switch", { cancelable: true, detail: href })
    window.dispatchEvent(switched)

    if (switched.defaultPrevented) {
      return
    }

    fallbackTimer.current = window.setTimeout(() => {
      fallbackTimer.current = null
      router.push(href)
    }, fallbackMs)
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  )
}

export { AuthSwitchLink, loginHref, registerHref, resetRequestHref }
