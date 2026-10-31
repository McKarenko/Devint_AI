"use client"

import { useEffect, useRef, useState } from "react"

import { useWorkspaceSurface } from "./workspace-surface"

/** Витрина: навес, фасад и дверь. Читается и лицом, и оборотом. */
function ShopMark() {
  return (
    <svg className="workspace-shop-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.4 7.2h17.2v3H3.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6.6 10.2h10.8V18.8H6.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10.7 18.8v-4.5h2.6v4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Кнопка-заглушка магазина. Оплату и страницу магазина не открывает. */
function WorkspaceShopButton() {
  const { surface, openShop } = useWorkspaceSurface()
  const inShop = surface === "shop"
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(0)

  useEffect(() => {
    return () => window.clearTimeout(flashTimer.current)
  }, [])

  function onClick() {
    if (!inShop) openShop()
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    setFlash(true)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), 420)
  }

  const className = ["workspace-shop", inShop ? "is-open" : "", flash ? "is-flash" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      type="button"
      className={className}
      aria-label="Магазин"
      aria-pressed={inShop}
      onClick={onClick}
    >
      <span
        className="workspace-shop-lens"
        style={{ transform: `perspective(64px) rotateY(${inShop ? 180 : 0}deg)` }}
      >
        <span className="workspace-shop-face workspace-shop-face-front">
          <ShopMark />
        </span>
        <span className="workspace-shop-face workspace-shop-face-back">
          <ShopMark />
        </span>
      </span>
    </button>
  )
}

export { WorkspaceShopButton }
