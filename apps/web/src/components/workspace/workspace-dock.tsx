"use client"

import { useEffect, useRef } from "react"

/**
 * Пустая нижняя панель рабочего экрана.
 * Место под будущие линзы есть, кнопок и иконок пока нет.
 * Свет сдвигается только над самой панелью. Шапка свой свет не отдаёт.
 */
function WorkspaceDock() {
  const dockRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const dock = dockRef.current
    if (!dock) return
    const surface = dock

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!finePointer.matches || reduceMotion.matches) return

    let frame = 0
    let nextX = 0.36
    let nextY = 0.2

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

    function onLeave() {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
        frame = 0
      }
      surface.style.removeProperty("--light-x")
      surface.style.removeProperty("--light-y")
    }

    dock.addEventListener("pointermove", onMove)
    dock.addEventListener("pointerleave", onLeave)
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame)
      dock.removeEventListener("pointermove", onMove)
      dock.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <nav ref={dockRef} className="workspace-dock" aria-label="Нижняя панель">
      <div className="workspace-dock-slots" />
    </nav>
  )
}

export { WorkspaceDock }
