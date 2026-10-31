"use client"

import { useWorkspaceSurface } from "./workspace-surface"

/** Кнопка-заглушка магазина. Оплату и страницу магазина не открывает. */
function WorkspaceShopButton() {
  const { surface, openShop } = useWorkspaceSurface()
  const inShop = surface === "shop"

  return (
    <button
      type="button"
      className="workspace-shop"
      aria-label="Магазин"
      aria-pressed={inShop}
      onClick={() => {
        if (!inShop) openShop()
      }}
    >
      <span
        className="workspace-shop-lens"
        style={{ transform: `perspective(64px) rotateY(${inShop ? 180 : 0}deg)` }}
      >
        <span className="workspace-shop-face workspace-shop-face-front">
          <svg className="workspace-shop-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 9h8l-.8 10H8.8L8 9Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 9a2.5 2.5 0 0 1 5 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="workspace-shop-face workspace-shop-face-back" aria-hidden="true" />
      </span>
    </button>
  )
}

export { WorkspaceShopButton }
