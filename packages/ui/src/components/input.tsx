import * as React from "react"

import { cn } from "../lib/utils"

/** Поле ввода. Подсказка стоит по центру и пропадает, когда есть текст. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn("field-control", className)} {...props} />
  },
)

Input.displayName = "Input"

export { Input }
