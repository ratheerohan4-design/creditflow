import type { ReactNode } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MoneyProps {
  value: number
  className?: string
  /** Large, bold balance figure used for the numbers that matter most. */
  emphasis?: 'default' | 'large' | 'hero'
}

export function Money({ value, className, emphasis = 'default' }: MoneyProps) {
  return (
    <span
      className={cn(
        'tabular-nums',
        emphasis === 'hero' &&
          'text-navy text-[36px] leading-[1.1] font-bold tracking-[-0.02em]',
        emphasis === 'large' &&
          'text-navy text-[28px] leading-tight font-bold tracking-[-0.01em]',
        emphasis === 'default' && 'text-ink font-semibold',
        className,
      )}
    >
      {formatMoney(value)}
    </span>
  )
}

interface MoneyPairProps {
  label: string
  value: number
  children?: ReactNode
}

export function MoneyPair({ label, value }: MoneyPairProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-muted text-[13px]">{label}</span>
      <Money value={value} />
    </div>
  )
}
