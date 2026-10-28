"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

/** Окно поверх страницы. Закрывается по Esc и возвращает фокус. */
function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

/** Затемнение и само окно. */
function DialogContent({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className="dialog-window" aria-describedby={undefined}>
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export { Dialog, DialogContent }
