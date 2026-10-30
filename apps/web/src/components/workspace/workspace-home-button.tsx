"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

/** Кнопка возврата на основной рабочий экран. */
function WorkspaceHomeButton() {
  const pathname = usePathname()
  const router = useRouter()

  /** Сколько раз нажали. Каждый клик переворачивает линзу ещё на 180°. */
  const [flips, setFlips] = useState(0)

  /** Идёт короткий импульс масштаба. */
  const [pulsing, setPulsing] = useState(false)

  /** Переворачивает линзу и открывает /home, если это ещё не текущий адрес. */
  function onClick() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!reduceMotion) {
      setFlips((value) => value + 1)
      setPulsing(false)
      window.requestAnimationFrame(() => {
        setPulsing(true)
      })
    }

    if (pathname !== "/home") {
      router.push("/home")
    }
  }

  return (
    <button
      type="button"
      className={pulsing ? "workspace-home is-pulsing" : "workspace-home"}
      aria-label="На основной экран"
      onClick={onClick}
      onAnimationEnd={() => setPulsing(false)}
    >
      <span
        className="workspace-home-lens"
        style={{ transform: `perspective(64px) rotateY(${flips * 180}deg)` }}
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
