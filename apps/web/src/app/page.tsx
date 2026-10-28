"use client"

import { useState, type PointerEvent } from "react"

import { Button, ConorFace, type ConorFaceState, type ConorGaze } from "@devint_ai/ui"

/** Кнопки состояний лица. */
const faceStates: { state: ConorFaceState; label: string }[] = [
  { state: "calm", label: "Спокойный" },
  { state: "listening", label: "Слушает" },
  { state: "thinking", label: "Думает" },
  { state: "speaking", label: "Говорит" },
  { state: "happy", label: "Доволен" },
  { state: "displeased", label: "Недоволен" },
]

/** Кнопки ручного взгляда. Отрицательный y смотрит вверх. */
const faceGazes: { gaze: ConorGaze; label: string }[] = [
  { gaze: { x: -6, y: 0 }, label: "Влево" },
  { gaze: { x: 0, y: 0 }, label: "Прямо" },
  { gaze: { x: 6, y: 0 }, label: "Вправо" },
  { gaze: { x: 0, y: -24 }, label: "Вверх" },
  { gaze: { x: 0, y: 24 }, label: "Вниз" },
]

/** Ограничивает нормаль курсора диапазоном от -1 до 1. */
function clampUnit(value: number) {
  return Math.min(1, Math.max(-1, value))
}

/** Временный показ лица. Позже эту страницу заменит лендинг. */
export default function HomePage() {
  /** Выбранное состояние лица. */
  const [state, setState] = useState<ConorFaceState>("calm")

  /** Ручной взгляд. Пустое значение включает автоповедение. */
  const [gaze, setGaze] = useState<ConorGaze | undefined>(undefined)

  /** Переводит положение курсора над страницей в сдвиг радужки. */
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    /** Границы блока. */
    const rect = event.currentTarget.getBoundingClientRect()

    /** Горизонталь от -1 до 1. */
    const normalX = clampUnit(((event.clientX - rect.left) / rect.width) * 2 - 1)

    /** Вертикаль от -1 до 1. */
    const normalY = clampUnit(((event.clientY - rect.top) / rect.height) * 2 - 1)

    setGaze({
      x: Math.round(normalX * 6),
      y: Math.round(normalY * 24),
    })
  }

  /** Возвращает автоматический взгляд, когда курсор ушёл со страницы. */
  function onPointerLeave() {
    setGaze(undefined)
  }

  return (
    <main className="app-frame min-h-screen" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div style={{ maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
        <ConorFace state={state} gaze={gaze} />
      </div>
      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {faceStates.map((item) => (
          <Button
            key={item.state}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setState(item.state)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {faceGazes.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGaze(item.gaze)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </main>
  )
}
