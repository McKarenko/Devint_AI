"use client"

import { useEffect, useRef } from "react"

import { WorkspaceHomeButton } from "./workspace-home-button"
import { WorkspaceIsland } from "./workspace-island"
import { WorkspaceShopButton } from "./workspace-shop-button"

import "./workspace.css"

/**
 * Верхняя шапка рабочего экрана на всю ширину.
 * Три зоны: слева действия, в центре место под выступ (и под вырез телефона), справа резерв.
 * Левая зона отдана только нашим кнопкам.
 * Курсор чуть сдвигает общий свет. На телефоне и при reduced-motion свет стоит на месте.
 */
function WorkspaceHeader() {
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const surface = header

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!finePointer.matches || reduceMotion.matches) return

    /** Номер кадра. Пока он не ноль, новое движение ждёт уже запрошенный кадр. */
    let frame = 0

    /** Куда поставить свет в ближайшем кадре. */
    let nextX = 0.36
    let nextY = 0.2

    /** Считает положение света от курсора и откладывает запись до следующего кадра. */
    function onMove(event: PointerEvent) {
      const box = surface.getBoundingClientRect()
      const pointerX = (event.clientX - box.left) / (box.width || 1)
      const pointerY = (event.clientY - box.top) / (box.height || 1)
      nextX = 0.36 + (pointerX - 0.5) * 0.28
      nextY = 0.2 + (pointerY - 0.5) * 0.12
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        surface.style.setProperty("--light-x", String(nextX))
        surface.style.setProperty("--light-y", String(nextY))
      })
    }

    /** Возвращает свет в покой. Переход делает сама таблица стилей. */
    function onLeave() {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
      surface.style.removeProperty("--light-x")
      surface.style.removeProperty("--light-y")
    }

    header.addEventListener("pointermove", onMove)
    header.addEventListener("pointerleave", onLeave)
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      header.removeEventListener("pointermove", onMove)
      header.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <header ref={headerRef} className="workspace-header">
      <div className="workspace-header-plate" aria-hidden="true">
        <WorkspaceIsland />
      </div>
      <div className="workspace-header-actions">
        <WorkspaceHomeButton />
        <WorkspaceShopButton />
      </div>
      <div className="workspace-header-center" aria-hidden="true" />
      <div className="workspace-header-reserve" aria-hidden="true" />
    </header>
  )
}

export { WorkspaceHeader }
