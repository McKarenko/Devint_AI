"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "../lib/utils"

/** Поле пароля с кнопкой, которая показывает или прячет символы. */
const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    /** Пароль виден целиком. */
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="password-field">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("field-control field-password", className)}
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
