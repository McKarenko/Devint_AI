import Image from "next/image"

/** Ширина показа логотипа в пикселях. */
const logoDisplayWidth = 150

/** Высота показа логотипа в пикселях. */
const logoDisplayHeight = 160

/** Горизонталь центра ядра относительно логотипа. */
const coreLeft = "46.34%"

/** Вертикаль центра ядра относительно логотипа. */
const coreTop = "49.39%"

/** Диаметр ядра относительно ширины логотипа. */
const coreSize = "33.6%"

/** Логотип, свечение, ядро и искры. Числа выше можно править. */
function BrandLogo() {
  return (
    <div className="brand-logo" style={{ width: logoDisplayWidth, height: logoDisplayHeight }}>
      <div className="brand-logo-glow" />
      <Image
        className="brand-logo-image"
        src="/images/brand/logo-480.png"
        alt="Логотип Devint"
        width={logoDisplayWidth}
        height={logoDisplayHeight}
        priority
      />
      <div
        className="brand-core"
        style={{ left: coreLeft, top: coreTop, width: coreSize }}
        aria-hidden
      >
        <div className="brand-core-sphere" />
        <div className="brand-orbit">
          <span className="brand-glint" style={{ left: "62%", top: "20%", width: "9%" }} />
        </div>
        <div className="brand-orbit brand-orbit-back">
          <span className="brand-glint brand-glint-soft" style={{ left: "30%", top: "68%", width: "6%" }} />
        </div>
      </div>
      <span className="brand-spark" style={{ left: "26%", top: "35%", animationDelay: "0s" }} />
      <span className="brand-spark" style={{ left: "72%", top: "66%", animationDelay: "0.9s" }} />
      <span className="brand-spark" style={{ left: "66%", top: "30%", animationDelay: "1.6s" }} />
    </div>
  )
}

export { BrandLogo, coreLeft, coreSize, coreTop, logoDisplayHeight, logoDisplayWidth }
