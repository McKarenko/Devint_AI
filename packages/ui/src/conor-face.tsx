"use client"

import { useEffect, useId, useState } from "react"

/** Состояния лица Конора. */
type ConorFaceState = "calm" | "listening" | "thinking" | "speaking" | "happy" | "displeased"

/** Сдвиг радужки в пикселях. */
type ConorGaze = {
  x: number
  y: number
}

/** Пропсы лица. Фон и рамку задаёт родитель. */
type ConorFaceProps = {
  /** Текущее состояние. По умолчанию спокойное. */
  state?: ConorFaceState
  /** Ручной взгляд. Если передан, автодвижение взгляда выключено. */
  gaze?: ConorGaze
  /** Дополнительный класс на svg. */
  className?: string
}

/** Область отрисовки лица. */
const faceViewBox = "180 36 280 206"

/** Подпись для скринридеров. */
const faceLabel = "Лицо Конора"

/** Сдвиг левого глаза. */
const eyeLeftTransform = "translate(212,52)"

/** Сдвиг правого глаза. */
const eyeRightTransform = "translate(370,52)"

/** Центр радужки в локальных координатах глаза. */
const irisCenterX = 29

/** Центр радужки в локальных координатах глаза. */
const irisCenterY = 56

/** Минимальный сдвиг взгляда по горизонтали. */
const gazeXMin = -6

/** Максимальный сдвиг взгляда по горизонтали. */
const gazeXMax = 6

/** Минимальный сдвиг взгляда по вертикали. */
const gazeYMin = -24

/** Максимальный сдвиг взгляда по вертикали. */
const gazeYMax = 24

/** Нижняя граница блуждания по вертикали. */
const wanderYMin = -12

/** Верхняя граница блуждания по вертикали. */
const wanderYMax = 12

/** Период блуждания взгляда, мс. */
const wanderMs = 2600

/** Период чередования взгляда в раздумье, мс. */
const thinkMs = 1400

/** Период моргания, мс. */
const blinkMs = 4300

/** Сколько веко держится закрытым, мс. */
const blinkHoldMs = 140

/** Период смены кадра рта, мс. */
const speakMs = 150

/** Плавность век. */
const lidTransition = "transform 300ms ease"

/** Плавность радужки. */
const irisTransition = "transform 250ms ease-out"

/** Фон глаза. */
const eyeFill = "#071524"

/** Заливка век и зрачка. */
const lidFill = "#05070b"

/** Рот спокойного состояния. При reduced motion им же говорит. */
const mouthCalm = "M292 210 Q320 220 348 210"

/** Рот, когда слушает. */
const mouthListening = "M300 212 Q320 216 340 212"

/** Рот, когда думает. */
const mouthThinking = "M300 214 Q320 214 340 214"

/** Рот, когда доволен. */
const mouthHappy = "M286 206 Q320 234 354 206"

/** Рот, когда недоволен. */
const mouthDispleased = "M298 216 Q320 210 342 216"

/** Кадры рта во время речи. */
const mouthSpeaking = [
  "M296 208 Q320 228 344 208",
  "M298 210 Q320 240 342 210",
  "M294 210 Q320 220 346 210",
  "M298 209 Q320 234 342 209",
] as const

/** Первый кадр речи. Запасной путь — спокойный рот, если кадра нет. */
const mouthSpeakingFirst = mouthSpeaking[0] ?? mouthCalm

/** Взгляд в начале раздумья, до первого чередования. */
const thinkStartGaze: ConorGaze = { x: 6, y: -22 }

/** Две точки, между которыми ходит взгляд в раздумье. */
const thinkAlternateGaze: ConorGaze[] = [
  { x: 6, y: -20 },
  { x: -6, y: -20 },
]

/** Нулевой взгляд, пока блуждание ещё не сдвинуло радужку. */
const restGaze: ConorGaze = { x: 0, y: 0 }

/** Три слоя обводки глаза, от широкого к тонкому. */
const eyeStrokes = [
  { stroke: "#1d6fff", opacity: 0.14, width: 14 },
  { stroke: "#3aa8ff", opacity: 0.3, width: 7 },
  { stroke: "#8fdcff", opacity: 1, width: 2.5 },
]

/** Три слоя обводки рта, от широкого к тонкому. */
const mouthStrokes = [
  { stroke: "#1d6fff", opacity: 0.15, width: 16 },
  { stroke: "#3aa8ff", opacity: 0.3, width: 9 },
  { stroke: "#8fdcff", opacity: 1, width: 3.5 },
]

/** Четыре круга радужки от внешнего к зрачку. */
const irisCircles = [
  { r: 27, fill: "#1d6fff", opacity: 0.16 },
  { r: 21, fill: "#3aa8ff", opacity: 0.45 },
  { r: 16, fill: "#7fd0ff", opacity: 1 },
  { r: 6.5, fill: lidFill, opacity: 1 },
]

/** Веки и путь рта для каждого состояния. */
const faceByState: Record<ConorFaceState, { upper: number; lower: number; mouth: string; wanders: boolean }> = {
  calm: { upper: 0.12, lower: 0, mouth: mouthCalm, wanders: true },
  listening: { upper: 0, lower: 0, mouth: mouthListening, wanders: true },
  thinking: { upper: 0.25, lower: 0, mouth: mouthThinking, wanders: false },
  speaking: { upper: 0.12, lower: 0, mouth: mouthSpeakingFirst, wanders: true },
  happy: { upper: 0.1, lower: 0.35, mouth: mouthHappy, wanders: false },
  displeased: { upper: 0.5, lower: 0.22, mouth: mouthDispleased, wanders: false },
}

/** Ограничивает число диапазоном. */
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Случайное целое включительно. Вызывать только из useEffect. */
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Пропсы одного глаза. */
type ConorEyeProps = {
  /** Сдвиг группы глаза. */
  translate: string
  /** Уникальный id обрезки радужки. */
  clipId: string
  /** Сдвиг радужки по горизонтали. */
  gazeX: number
  /** Сдвиг радужки по вертикали. */
  gazeY: number
  /** Насколько верхнее веко закрыто, от 0 до 1. */
  upperScale: number
  /** Насколько нижнее веко закрыто, от 0 до 1. */
  lowerScale: number
  /** Плавность век. none при reduced motion. */
  lidMotion: string
  /** Плавность радужки. none при reduced motion. */
  irisMotion: string
}

/** Один глаз: фон, радужка, веки и три контура. */
function ConorEye({
  translate,
  clipId,
  gazeX,
  gazeY,
  upperScale,
  lowerScale,
  lidMotion,
  irisMotion,
}: ConorEyeProps) {
  return (
    <g transform={translate}>
      <rect x={0} y={0} width={58} height={112} rx={29} fill={eyeFill} />
      <clipPath id={clipId}>
        <rect x={0} y={0} width={58} height={112} rx={29} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <g style={{ transform: `translate(${gazeX}px, ${gazeY}px)`, transition: irisMotion }}>
          {irisCircles.map((circle) => (
            <circle
              key={circle.r}
              cx={irisCenterX}
              cy={irisCenterY}
              r={circle.r}
              fill={circle.fill}
              fillOpacity={circle.opacity}
            />
          ))}
        </g>
        <rect
          x={-2}
          y={-2}
          width={62}
          height={116}
          fill={lidFill}
          style={{
            transform: `scaleY(${upperScale})`,
            transformBox: "fill-box",
            transformOrigin: "50% 0%",
            transition: lidMotion,
          }}
        />
        <rect
          x={-2}
          y={-2}
          width={62}
          height={116}
          fill={lidFill}
          style={{
            transform: `scaleY(${lowerScale})`,
            transformBox: "fill-box",
            transformOrigin: "50% 100%",
            transition: lidMotion,
          }}
        />
      </g>
      {eyeStrokes.map((layer) => (
        <rect
          key={layer.width}
          x={0}
          y={0}
          width={58}
          height={112}
          rx={29}
          fill="none"
          stroke={layer.stroke}
          strokeOpacity={layer.opacity}
          strokeWidth={layer.width}
        />
      ))}
    </g>
  )
}

/** Лицо Конора: два глаза и рот. Без фона и без рамки. */
function ConorFace({ state = "calm", gaze, className }: ConorFaceProps) {
  /** Сырой id React. В нём бывают двоеточия, для svg они не годятся. */
  const rawId = useId()

  /** Id без двоеточий. */
  const faceId = rawId.replace(/:/g, "")

  /** Id обрезки левого глаза. */
  const leftClipId = `${faceId}-left`

  /** Id обрезки правого глаза. */
  const rightClipId = `${faceId}-right`

  /** Включено ли сокращение движения в системе. */
  const [reducedMotion, setReducedMotion] = useState(false)

  /** Верхнее веко сейчас закрыто морганием. */
  const [blinking, setBlinking] = useState(false)

  /** Автоматический взгляд. null — ещё не было тика таймера. */
  const [autoGaze, setAutoGaze] = useState<ConorGaze | null>(null)

  /** Номер кадра рта во время речи. */
  const [speakFrame, setSpeakFrame] = useState(0)

  /** Веки, рот и признак блуждания для текущего состояния. */
  const face = faceByState[state]

  /** Ручной взгляд передан родителем. */
  const manualGaze = gaze !== undefined

  /** Следит за prefers-reduced-motion. */
  useEffect(() => {
    /** Медиазапрос системы. */
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")

    /** Записывает текущее значение запроса. */
    const apply = () => {
      setReducedMotion(media.matches)
    }

    apply()
    media.addEventListener("change", apply)

    return () => {
      media.removeEventListener("change", apply)
    }
  }, [])

  /** Сбрасывает авто-взгляд при смене состояния или появлении ручного взгляда. */
  useEffect(() => {
    setAutoGaze(null)
  }, [state, manualGaze])

  /** Блуждание и чередование взгляда. Случайные числа только здесь. */
  useEffect(() => {
    if (reducedMotion || manualGaze) {
      return
    }

    if (state === "thinking") {
      /** Индекс точки чередования. */
      let index = 0

      /** Таймер чередования. */
      const timer = window.setInterval(() => {
        /** Следующая точка взгляда. */
        const point = thinkAlternateGaze[index % thinkAlternateGaze.length] ?? thinkStartGaze

        index += 1
        setAutoGaze(point)
      }, thinkMs)

      return () => {
        window.clearInterval(timer)
      }
    }

    if (!face.wanders) {
      return
    }

    /** Таймер блуждания. */
    const timer = window.setInterval(() => {
      setAutoGaze({
        x: randomInt(gazeXMin, gazeXMax),
        y: randomInt(wanderYMin, wanderYMax),
      })
    }, wanderMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [state, manualGaze, reducedMotion, face.wanders])

  /** Моргание верхним веком. */
  useEffect(() => {
    if (reducedMotion) {
      return
    }

    /** Таймер возврата века после моргания. */
    let hold: number | undefined

    /** Таймер периода моргания. */
    const timer = window.setInterval(() => {
      setBlinking(true)
      hold = window.setTimeout(() => {
        setBlinking(false)
      }, blinkHoldMs)
    }, blinkMs)

    return () => {
      window.clearInterval(timer)

      if (hold !== undefined) {
        window.clearTimeout(hold)
      }

      setBlinking(false)
    }
  }, [state, reducedMotion])

  /** Сбрасывает кадр рта при смене состояния. */
  useEffect(() => {
    setSpeakFrame(0)
  }, [state])

  /** Крутит кадры рта, пока Конор говорит. */
  useEffect(() => {
    if (state !== "speaking" || reducedMotion) {
      return
    }

    /** Таймер кадров рта. */
    const timer = window.setInterval(() => {
      setSpeakFrame((frame) => (frame + 1) % mouthSpeaking.length)
    }, speakMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [state, reducedMotion])

  /** Итоговый сдвиг радужки. */
  const resolvedGaze = gaze
    ? { x: clamp(gaze.x, gazeXMin, gazeXMax), y: clamp(gaze.y, gazeYMin, gazeYMax) }
    : autoGaze ?? (state === "thinking" ? thinkStartGaze : restGaze)

  /** Текущее закрытие верхнего века. */
  const upperScale = blinking ? 1 : face.upper

  /** Текущее закрытие нижнего века. */
  const lowerScale = face.lower

  /** Плавность век с учётом reduced motion. */
  const lidMotion = reducedMotion ? "none" : lidTransition

  /** Плавность радужки с учётом reduced motion. */
  const irisMotion = reducedMotion ? "none" : irisTransition

  /** Путь рта. У речи без анимации движения берётся спокойный рот. */
  const mouthPath =
    state === "speaking" ? (reducedMotion ? mouthCalm : mouthSpeaking[speakFrame] ?? mouthCalm) : face.mouth

  return (
    <svg viewBox={faceViewBox} width="100%" role="img" aria-label={faceLabel} className={className}>
      <ConorEye
        translate={eyeLeftTransform}
        clipId={leftClipId}
        gazeX={resolvedGaze.x}
        gazeY={resolvedGaze.y}
        upperScale={upperScale}
        lowerScale={lowerScale}
        lidMotion={lidMotion}
        irisMotion={irisMotion}
      />
      <ConorEye
        translate={eyeRightTransform}
        clipId={rightClipId}
        gazeX={resolvedGaze.x}
        gazeY={resolvedGaze.y}
        upperScale={upperScale}
        lowerScale={lowerScale}
        lidMotion={lidMotion}
        irisMotion={irisMotion}
      />
      {mouthStrokes.map((layer) => (
        <path
          key={layer.width}
          d={mouthPath}
          fill="none"
          stroke={layer.stroke}
          strokeOpacity={layer.opacity}
          strokeWidth={layer.width}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export { ConorFace, type ConorFaceProps, type ConorFaceState, type ConorGaze }
