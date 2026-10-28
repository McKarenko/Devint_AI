import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"

/** Варианты кнопки. default — главная, цвета только из токенов. */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap border border-transparent bg-transparent font-medium text-[var(--color-text)] transition-[background,color,box-shadow,transform,border-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-light)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent text-[var(--color-on-accent)] [background:var(--button-primary-bg)] [box-shadow:var(--button-primary-shadow)] hover:[background:var(--button-primary-bg-hover)] hover:[box-shadow:var(--button-primary-shadow),var(--button-primary-glow)] active:scale-[0.985] active:[box-shadow:var(--button-primary-shadow),var(--button-primary-glow-active)]",
        outline:
          "border-[var(--border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-hover)] hover:text-[var(--color-accent-light)] hover:[box-shadow:var(--button-soft-glow)]",
        ghost:
          "hover:bg-[var(--color-hover)] hover:text-[var(--color-accent-light)] hover:[box-shadow:var(--button-soft-glow)]",
      },
      size: {
        default: "h-12 px-4 text-[length:var(--font-size-control)]",
        sm: "h-9 px-3 text-[length:var(--font-size-body)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** Пропсы кнопки. */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Рендер как дочерний элемент (Radix Slot). */
  asChild?: boolean
}

/** Базовая кнопка shadcn/Radix для всего продукта. */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }
