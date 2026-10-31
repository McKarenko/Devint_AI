"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Нижняя панель рабочего экрана.
 * Пять линз ниже — временный показ раскрытия. Позже их уберут целиком.
 * Свет сдвигается только над самой панелью. Шапка свой свет не отдаёт.
 */

function DockHome() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 11.4 12 6l7 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 11V18h9.2v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DockStar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5.2 14.1 10l5.1.5-3.9 3.4 1.2 4.9L12 16.2 7.5 18.8 8.7 13.9 4.8 10.5 9.9 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DockFile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 5.2h5.4L16.8 9v9.8H8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 5.4V9h3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DockChat() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 7.2h12v7.2H10.4L7.2 17.4V14.4H6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DockGear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 4.4v2.3M12 17.3v2.3M4.4 12h2.3M17.3 12h2.3M6.6 6.6l1.6 1.6M15.8 15.8l1.6 1.6M17.4 6.6l-1.6 1.6M8.2 15.8l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

const demoLenses: { label: string; mark: ReactNode }[] = [
  { label: "Дом", mark: <DockHome /> },
  { label: "Тест", mark: <DockStar /> },
  { label: "Файлы", mark: <DockFile /> },
  { label: "Чат", mark: <DockChat /> },
  { label: "Настройки", mark: <DockGear /> },
]

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
      <div className="workspace-dock-slots" data-demo="temporary" aria-hidden="true">
        {demoLenses.map((item) => (
          <div key={item.label} className="workspace-dock-lens">
            <span className="workspace-dock-glyph">{item.mark}</span>
            <span className="workspace-dock-label">{item.label}</span>
          </div>
        ))}
      </div>
    </nav>
  )
}

export { WorkspaceDock }
