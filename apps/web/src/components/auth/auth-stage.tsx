"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"

/** Сколько миллисекунд карточка уезжает и сколько приезжает. */
const motionMs = 340

/** Если адрес так и не сменился, сцену всё равно отпускаем. */
const unlockMs = motionMs + 800

/** Куда едет карточка относительно входа и регистрации. */
type MotionDirection = "to-register" | "to-login"

/** Покой, уезд текущей карточки или приезд новой. */
type MotionPhase = "idle" | "leave" | "enter"

/** Регистрация приезжает справа. Вход приезжает слева. */
function directionFor(path: string): MotionDirection {
  return path === "/register" ? "to-register" : "to-login"
}

/** Класс движения карточки. Пустая строка, пока страница стоит. */
function motionClass(phase: MotionPhase, direction: MotionDirection) {
  if (phase === "leave" && direction === "to-register") {
    return "auth-stage-leave-register"
  }

  if (phase === "leave") {
    return "auth-stage-leave-login"
  }

  if (phase === "enter" && direction === "to-register") {
    return "auth-stage-enter-register"
  }

  if (phase === "enter") {
    return "auth-stage-enter-login"
  }

  return ""
}

/** Браузер просит обойтись без движения. */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Держит карточку на месте, пока адрес меняется. Логотип выше этой сцены не трогает. */
function AuthStage({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  /** Корень сцены. С него ставим фокус после перехода. */
  const stageRef = useRef<HTMLDivElement>(null)
  /** Фаза, которую видит обработчик клика. Состояние к тому моменту может быть старым. */
  const phaseRef = useRef<MotionPhase>("idle")
  /** Адрес, куда клик ещё только собирается перейти. Назад его не ждёт. */
  const pendingTarget = useRef<string | null>(null)
  /** Адрес, под который уже подогнана сцена. */
  const [shownPath, setShownPath] = useState(pathname)
  /** Уезд или приезд. Назад и вперёд сразу ставят покой. */
  const [phase, setPhase] = useState<MotionPhase>("idle")
  /** Сторона текущего клика. */
  const [direction, setDirection] = useState<MotionDirection>("to-register")
  /** После перехода нужно поставить фокус в новую форму. */
  const [focusPending, setFocusPending] = useState(false)

  phaseRef.current = phase

  if (pathname !== shownPath) {
    /** Этот переход начат кликом, а не кнопкой истории. */
    const fromClick = pendingTarget.current === pathname

    if (!fromClick) {
      pendingTarget.current = null
    }

    setShownPath(pathname)
    setPhase(fromClick && !prefersReducedMotion() ? "enter" : "idle")
    setFocusPending(true)
  }

  useEffect(() => {
    if (pendingTarget.current === pathname) {
      pendingTarget.current = null
    }
  }, [pathname])

  useEffect(() => {
    /** Клик по ссылке входа или регистрации. Адрес меняется только после уезда. */
    function onSwitch(event: Event) {
      /** Куда просят перейти. */
      const href = (event as CustomEvent<string>).detail

      if (href !== "/login" && href !== "/register") {
        return
      }

      if (phaseRef.current !== "idle" || href === pathname) {
        return
      }

      pendingTarget.current = href
      setDirection(directionFor(href))

      if (prefersReducedMotion()) {
        router.push(href)
        return
      }

      setPhase("leave")
    }

    window.addEventListener("auth-switch", onSwitch)
    return () => window.removeEventListener("auth-switch", onSwitch)
  }, [pathname, router])

  useEffect(() => {
    if (phase !== "leave") {
      return
    }

    /** Куда должны приехать. Пустое значение значит, что переход уже отменили. */
    const target = pendingTarget.current

    if (!target) {
      setPhase("idle")
      return
    }

    /** Смена адреса после уезда. */
    const pushTimer = window.setTimeout(() => {
      router.push(target)
    }, motionMs)

    /** Запасной выход, если адрес так и не сменился. */
    const unlockTimer = window.setTimeout(() => {
      if (pendingTarget.current === target) {
        pendingTarget.current = null
      }

      setPhase((current) => (current === "leave" ? "idle" : current))
    }, unlockMs)

    return () => {
      window.clearTimeout(pushTimer)
      window.clearTimeout(unlockTimer)
    }
  }, [phase, router])

  useEffect(() => {
    if (phase !== "enter") {
      return
    }

    /** Конец приезда. Дальше форму снова можно нажать. */
    const timer = window.setTimeout(() => {
      setPhase("idle")
    }, motionMs)

    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== "idle" || !focusPending) {
      return
    }

    setFocusPending(false)

    /** Куда поставить фокус. Сначала поле, если его ещё нет — заголовок. */
    const field = stageRef.current?.querySelector("input")
    if (field instanceof HTMLElement) {
      field.focus()
      return
    }

    /** Заголовок новой карточки. */
    const heading = stageRef.current?.querySelector("h1")
    if (heading instanceof HTMLElement) {
      heading.tabIndex = -1
      heading.focus()
    }
  }, [phase, focusPending])

  /** Класс сцены: движение или покой. */
  const className = ["auth-stage", phase === "idle" ? "" : "is-moving", motionClass(phase, direction)]
    .filter(Boolean)
    .join(" ")

  return (
    <div ref={stageRef} className={className} inert={phase !== "idle"}>
      {children}
    </div>
  )
}

export { AuthStage }
