"use client"

import { useWorkspaceSurface } from "./workspace-surface"

/** Тонкая витрина: рамка и полка. Читается и лицом, и оборотом. */
function ShopMark() {
  return (
    <svg className="workspace-shop-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 8.5h11v9h-11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 12.5h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Кнопка-заглушка магазина. Оплату и страницу магазина не открывает. */
function WorkspaceShopButton() {
  const { surface, openShop } = useWorkspaceSurface()
  const inShop = surface === "shop"

  return (
    <button
      type="button"
      className={inShop ? "workspace-shop is-open" : "workspace-shop"}
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
