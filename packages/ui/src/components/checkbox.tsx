import * as React from "react"
import { Check } from "lucide-react"

/** Круглая галочка. Ссылка внутри текста не должна её переключать. */
type CheckboxProps = {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: React.ReactNode
}

/** Круглая галочка с текстом справа. */
function Checkbox({ id, checked, onCheckedChange, children }: CheckboxProps) {
  return (
    <div className="check-row">
      <input
        id={id}
        className="check-input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <label className="check-label" htmlFor={id}>
        <span className="check-box" aria-hidden>
          {checked ? <Check size={12} strokeWidth={3} /> : null}
        </span>
        <span>{children}</span>
      </label>
    </div>
  )
}

export { Checkbox }
