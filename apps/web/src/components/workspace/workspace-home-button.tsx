"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

/** Кнопка возврата на основной рабочий экран. */
function WorkspaceHomeButton() {
  const pathname = usePathname()
  const router = useRouter()

  /** Идёт короткий поворот после нажатия. */
  const [turning, setTurning] = useState(false)

  /** Крутит кнопку и открывает /home, если это ещё не текущий адрес. */
  function onClick() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!reduceMotion) {
      setTurning(false)
      window.requestAnimationFrame(() => {
        setTurning(true)
      })
    }

    if (pathname !== "/home") {
      router.push("/home")
    }
  }

  return (
    <button
      type="button"
      className={turning ? "workspace-home is-turning" : "workspace-home"}
      aria-label="На основной экран"
      onClick={onClick}
      onAnimationEnd={() => setTurning(false)}
    >
      <svg className="workspace-home-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 11.2 12 5l8 6.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7 10.8V19h10v-8.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export { WorkspaceHomeButton }
