import { Button } from "@devint_ai/ui"

/** Стартовая страница-каркас продукта. */
export default function HomePage() {
  return (
    <main className="app-frame min-h-screen">
      <header className="header-text">devint_ai</header>
      <p className="header-text" style={{ marginTop: "var(--space-frame)" }}>
        Каркас готов.
      </p>
      <div style={{ marginTop: "var(--space-frame)" }}>
        <Button type="button">Продолжить</Button>
      </div>
    </main>
  )
}
