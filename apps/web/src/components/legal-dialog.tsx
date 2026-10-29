"use client"

import { Button, Dialog, DialogContent } from "@devint_ai/ui"

/** Окно с текстом документа. Закрытие возвращает фокус на кнопку, которая его открыла. */
function LegalDialog({
  title,
  content,
  open,
  onClose,
}: {
  title: string
  content: string
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent title={title}>
        <div className="dialog-body">{content}</div>
        <div className="dialog-actions">
          <Button type="button" variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LegalDialog }
