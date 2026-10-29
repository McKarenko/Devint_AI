"use client"

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react"

/** Насколько сильно карточка склоняется к курсору, в градусах. */
const maxTilt = 6

/** Вертикальный сдвиг тени, когда карточка лежит ровно. */
const restShadowY = 30

/** Карточка формы. По рамке пробегает синий огонёк, к курсору она слегка склоняется. */
function AuthCard({ children }: { children: ReactNode }) {
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const stage = card?.closest(".auth-stage")
    if (!card || !(stage instanceof HTMLElement)) return
    const observer = new MutationObserver(() => {
      if (stage.classList.contains("is-moving")) layFlat(card, true)
    })
    observer.observe(stage, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return
    if (prefersReducedMotion()) return
    const stage = event.currentTarget.closest(".auth-stage")
    if (stage?.classList.contains("is-moving")) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    const length = Math.hypot(px, py)
    const scale = length > 0.5 ? 0.5 / length : 1
    const nx = px * scale
    const ny = py * scale
    const tilt = tiltLimit(rect)
    const card = event.currentTarget
    card.classList.remove("is-resting", "is-flat")
    writeTilt(
      card,
      -ny * tilt * 2,
      nx * tilt * 2,
      ((event.clientX - rect.left) / rect.width) * 100,
      ((event.clientY - rect.top) / rect.height) * 100,
      1,
    )
  }

  function onPointerLeave(event: PointerEvent<HTMLElement>) {
    layFlat(event.currentTarget, false)
  }

  return (
    <div className="auth-card-slot">
      <section
        ref={cardRef}
        className="auth-card"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerLeave}
      >
        <div className="auth-card-light" aria-hidden="true" />
        <div className="auth-card-body">{children}</div>
      </section>
    </div>
  )
}

/** Сильнее шести градусов не наклоняем и не даём карточке вылезти за края окна. */
function tiltLimit(rect: DOMRect) {
  const room = Math.max(0, (window.innerWidth - rect.width) / 2 - 8)
  const halfHeight = Math.max(rect.height / 2, 1)
  const byRoom = (Math.atan(room / halfHeight) * 180) / Math.PI
  return Math.min(maxTilt, byRoom)
}

/** Убрать наклон: сразу, если карточка уезжает, и плавно, если курсор ушёл. */
function layFlat(card: HTMLElement, immediate: boolean) {
  card.classList.toggle("is-resting", !immediate)
  card.classList.toggle("is-flat", immediate)
  writeTilt(card, 0, 0, 50, 50, 0)
}

/** Записать наклон, сдвиг тени и точку блика. */
function writeTilt(
  card: HTMLElement,
  rotateX: number,
  rotateY: number,
  glowX: number,
  glowY: number,
  glowAlpha: number,
) {
  card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`)
  card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`)
  card.style.setProperty("--tilt-shadow-x", (-rotateY * 2).toFixed(2))
  card.style.setProperty("--tilt-shadow-y", (restShadowY + rotateX * 1.5).toFixed(2))
  card.style.setProperty("--glow-x", `${glowX.toFixed(1)}%`)
  card.style.setProperty("--glow-y", `${glowY.toFixed(1)}%`)
  card.style.setProperty("--glow-alpha", glowAlpha.toFixed(2))
}

/** Человек просил меньше движения. */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export { AuthCard }
