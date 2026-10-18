import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-[12px] font-medium">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted text-[12px]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: ReactNode
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-muted text-[13px]">{label}</span>
      <span className="text-ink text-right text-[13px] font-semibold">{value}</span>
    </div>
  )
}
