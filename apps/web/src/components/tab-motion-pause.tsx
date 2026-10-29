"use client"

import { useEffect } from "react"

/** Ставит анимации на паузу, пока вкладка скрыта. На экран ничего не рисует. */
function TabMotionPause() {
  useEffect(() => {
    /** Корень страницы. Класс на нём читает стили. */
    const root = document.documentElement

    /** Включает паузу, когда вкладку не видно. */
    function sync() {
      root.classList.toggle("tab-hidden", document.hidden)
    }

    sync()
    document.addEventListener("visibilitychange", sync)

    return () => {
      document.removeEventListener("visibilitychange", sync)
      root.classList.remove("tab-hidden")
    }
  }, [])

  return null
}

export { TabMotionPause }
