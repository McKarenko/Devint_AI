"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { useWorkspaceSurface } from "./workspace-surface"

/** Кнопка возврата на основной рабочий экран. */
function WorkspaceHomeButton() {
  const pathname = usePathname()
  const router = useRouter()
  const { openHome } = useWorkspaceSurface()

  /** Сколько раз нажали. Каждый клик крутит линзу ещё на 360°. */
  const [flips, setFlips] = useState(0)

  /** Идёт короткий импульс масштаба. */
  const [pulsing, setPulsing] = useState(false)

  /** Идёт полный оборот: блик на это время прячется с оборотной стороны. */
  const [turning, setTurning] = useState(false)

  /** Переворачивает линзу и открывает /home, если это ещё не текущий адрес. */
  function onClick() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!reduceMotion) {
      setFlips((value) => value + 1)
      setPulsing(false)
      setTurning(false)
      window.requestAnimationFrame(() => {
        setPulsing(true)
        setTurning(true)
      })
    }

    openHome()

    if (pathname !== "/home") {
      router.push("/home")
    }
  }

  return (
    <button
      type="button"
      className={["workspace-home", pulsing ? "is-pulsing" : "", turning ? "is-turning" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-label="На основной экран"
      onClick={onClick}
      onAnimationEnd={(event) => {
        if (event.animationName === "workspace-home-pulse") setPulsing(false)
        if (event.animationName === "workspace-glint-pass") setTurning(false)
      }}
    >
      <span
        className="workspace-home-lens"
        style={{ transform: `perspective(64px) rotateY(${flips * 360}deg)` }}
      >
        <svg className="workspace-home-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 11.2 12 5l8 6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 10.8V19h10v-8.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}

export { WorkspaceHomeButton }
