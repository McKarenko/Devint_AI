"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"

/** Снимок уезжающей карточки. Нужен, когда адрес уже сменился, а картинку ещё надо доиграть. */
function AuthCardGhost({ node }: { node: HTMLElement }) {
  return (
    <div
      className="auth-stage-ghost"
      ref={(host) => {
        if (host && host.firstChild !== node) {
          host.replaceChildren(node)
        }
      }}
    />
  )
}

/** Сколько миллисекунд карточка уезжает и сколько приезжает. */
const motionMs = 340

/** Куда едет карточка относительно входа и регистрации. */
type MotionDirection = "to-register" | "to-login"

/** Покой, уезд старой карточки или приезд новой. */
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

/** Держит карточку на месте, пока адрес меняется. Логотип выше этой сцены не трогает. */
function AuthStage({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  /** Карточка, которую человек ещё видит. */
  const [shown, setShown] = useState(children)
  /** Уезд или приезд. */
  const [phase, setPhase] = useState<MotionPhase>("idle")
  /** Сторона текущего движения. */
  const [direction, setDirection] = useState<MotionDirection>("to-register")
  /** Адрес уже показанной карточки. */
  const shownPath = useRef(pathname)
  /** Адрес, к которому идём. */
  const targetPath = useRef<string | null>(null)
  /** Уезд уже доигран, новая карточка ещё не поставлена. */
  const leaveFinished = useRef(false)
  /** Пока идёт переход, второй клик его не перебивает. */
  const moving = useRef(false)
  /** Последние дети страницы. Нужны в таймере, где замыкание уже старое. */
  const latestChildren = useRef(children)
  /** Последний адрес. Тоже для таймера. */
  const latestPath = useRef(pathname)
  /** Снимок карточки для кнопок браузера. По ссылке он не нужен: адрес меняется после уезда. */
  const [ghost, setGhost] = useState<HTMLElement | null>(null)

  latestChildren.current = children
  latestPath.current = pathname

  /** Ставит новую карточку и запускает её приезд. */
  function showArrived(node: ReactNode, path: string) {
    shownPath.current = path
    targetPath.current = null
    leaveFinished.current = false
    setGhost(null)
    setShown(node)
    setPhase("enter")
  }

  useEffect(() => {
    /** Назад и вперёд меняют адрес сразу. Снимок снимаем, пока старая карточка ещё в дереве. */
    function onPop() {
      if (moving.current) {
        return
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return
      }

      /** Карточка, которая ещё на экране. */
      const card = document.querySelector(".auth-card")

      if (!card) {
        return
      }

      /** Новый адрес уже записан браузером. */
      const nextPath = window.location.pathname

      moving.current = true
      targetPath.current = nextPath
      setDirection(directionFor(nextPath))
      setGhost(card.cloneNode(true) as HTMLElement)
      setPhase("leave")
    }

    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    /** Клик по ссылке входа или регистрации. Обычный переход ждёт конца уезда. */
    function onSwitch(event: Event) {
      /** Куда просят перейти. */
      const href = (event as CustomEvent<string>).detail

      if (href !== "/login" && href !== "/register") {
        return
      }

      if (moving.current || href === shownPath.current) {
        return
      }

      moving.current = true
      targetPath.current = href
      setDirection(directionFor(href))

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href)
        return
      }

      setPhase("leave")
    }

    window.addEventListener("auth-switch", onSwitch)
    return () => window.removeEventListener("auth-switch", onSwitch)
  }, [router])

  useEffect(() => {
    if (pathname === shownPath.current) {
      return
    }

    if (phase === "leave" && !leaveFinished.current) {
      return
    }

    if (leaveFinished.current && targetPath.current === pathname) {
      showArrived(children, pathname)
      return
    }

    if (targetPath.current === pathname && phase === "leave") {
      return
    }

    if (targetPath.current === pathname && phase === "idle") {
      shownPath.current = pathname
      targetPath.current = null
      moving.current = false
      setShown(children)
      return
    }

    if (!targetPath.current && phase === "idle") {
      moving.current = true
      targetPath.current = pathname
      setDirection(directionFor(pathname))

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        shownPath.current = pathname
        targetPath.current = null
        moving.current = false
        setShown(children)
        return
      }

      setPhase("leave")
    }
  }, [pathname, children, phase])

  useEffect(() => {
    if (phase !== "leave") {
      return
    }

    /** Конец уезда. Событие анимации рамки сюда не подходит: оно срабатывает само по себе. */
    const timer = window.setTimeout(() => {
      leaveFinished.current = true
      /** Куда должны приехать. */
      const target = targetPath.current

      if (target && latestPath.current !== target) {
        router.push(target)
        return
      }

      showArrived(latestChildren.current, latestPath.current)
    }, motionMs)

    return () => window.clearTimeout(timer)
  }, [phase, router])

  useEffect(() => {
    if (phase !== "enter") {
      return
    }

    /** Конец приезда. После него ссылки снова можно нажимать. */
    const timer = window.setTimeout(() => {
      moving.current = false
      setPhase("idle")
    }, motionMs)

    return () => window.clearTimeout(timer)
  }, [phase])

  /** Класс сцены: движение или покой. */
  const className = ["auth-stage", phase === "idle" ? "" : "is-moving", motionClass(phase, direction)]
    .filter(Boolean)
    .join(" ")

  return <div className={className}>{phase === "leave" && ghost ? <AuthCardGhost node={ghost} /> : shown}</div>
}

export { AuthStage }
