"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

type WorkspaceSurfaceName = "home" | "shop"

type WorkspaceSurfaceValue = {
  /** Какая поверхность сейчас лицом к пользователю. */
  surface: WorkspaceSurfaceName
  /** Показывает оборот Shop. Маршрут и окно магазина не открывает. */
  openShop: () => void
  /** Возвращает Shop лицом вперёд. */
  openHome: () => void
}

const WorkspaceSurfaceContext = createContext<WorkspaceSurfaceValue | null>(null)

/** Состояние шапки: дом или заглушка магазина. Позже отсюда откроется сцена магазина. */
function WorkspaceSurfaceProvider({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<WorkspaceSurfaceName>("home")
  const value = useMemo(
    () => ({
      surface,
      openShop: () => setSurface("shop"),
      openHome: () => setSurface("home"),
    }),
    [surface],
  )

  return <WorkspaceSurfaceContext.Provider value={value}>{children}</WorkspaceSurfaceContext.Provider>
}

/** Читает состояние дома и магазина. Вызывать только внутри рабочей оболочки. */
function useWorkspaceSurface() {
  const value = useContext(WorkspaceSurfaceContext)
  if (!value) {
    throw new Error("Состояние рабочего экрана доступно только внутри его оболочки")
  }
  return value
}

export { WorkspaceSurfaceProvider, useWorkspaceSurface }
