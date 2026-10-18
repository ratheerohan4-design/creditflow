import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'amber' | 'danger' | 'success'
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
            {label}
          </p>
          {icon ? (
            <span
              className={cn(
                'text-muted',
                tone === 'amber' && 'text-amber-ink',
                tone === 'danger' && 'text-danger',
                tone === 'success' && 'text-success',
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>
        <div className="text-navy mt-1.5 text-[22px] leading-tight font-bold tabular-nums">
          {value}
        </div>
        {hint ? <div className="text-muted mt-1 text-[12px]">{hint}</div> : null}
      </CardContent>
    </Card>
  )
}
