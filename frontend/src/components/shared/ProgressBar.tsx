import { Progress } from '@/components/ui/progress'
import { formatPercent } from '@/lib/format'
import type { StatusVariant } from '@/components/shared/StatusBadge'

const TONES: Record<StatusVariant, 'teal' | 'amber' | 'navy' | 'success'> = {
  neutral: 'navy',
  navy: 'navy',
  teal: 'teal',
  amber: 'amber',
  success: 'success',
  danger: 'amber',
}

interface ProgressBarProps {
  percent: number
  label: string
  caption?: string
  variant?: StatusVariant
}

export function ProgressBar({
  percent,
  label,
  caption,
  variant = 'teal',
}: ProgressBarProps) {
  const value = Math.min(Math.max(percent, 0), 100)
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-ink text-[13px] font-semibold">{label}</span>
        <span className="text-muted text-[13px] font-semibold tabular-nums">
          {formatPercent(value, value > 0 && value < 1 ? 1 : 0)}
        </span>
      </div>
      <Progress value={value} tone={TONES[variant]} />
      {caption ? <p className="text-muted mt-1.5 text-[12px]">{caption}</p> : null}
    </div>
  )
}
