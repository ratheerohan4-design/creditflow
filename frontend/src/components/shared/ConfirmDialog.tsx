import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  reasonLabel?: string
  reasonHint?: string
  onConfirm: (reason: string) => void
  busy?: boolean
}

/**
 * Ops actions that change money or access always ask why, and the reason is
 * carried into the audit log.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  reasonLabel = 'Reason',
  reasonHint = 'This is recorded in the audit log.',
  onConfirm,
  busy,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const reasonRef = useRef<HTMLTextAreaElement>(null)

  const trimmed = reason.trim()
  const showError = touched && trimmed.length === 0

  function close(next: boolean) {
    if (!next) {
      setReason('')
      setTouched(false)
    }
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          reasonRef.current?.focus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-reason">
            {reasonLabel}{' '}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          </Label>
          <Textarea
            id="confirm-reason"
            ref={reasonRef}
            value={reason}
            aria-invalid={showError}
            aria-describedby={showError ? 'confirm-reason-error' : undefined}
            placeholder="For example: merchant shared the customer's payment screenshot."
            onChange={(event) => {
              setReason(event.target.value)
              setTouched(true)
            }}
          />
          {showError ? (
            <p id="confirm-reason-error" className="text-danger text-[12px] font-medium">
              Please write a short reason before confirming.
            </p>
          ) : (
            <p className="text-muted text-[12px]">{reasonHint}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || trimmed.length === 0}
            onClick={(event) => {
              if (trimmed.length === 0) {
                event.preventDefault()
                setTouched(true)
                return
              }
              onConfirm(trimmed)
              close(false)
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
