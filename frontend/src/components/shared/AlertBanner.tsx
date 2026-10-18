import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, PauseCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'amber' | 'success' | 'danger' | 'info' | 'navy'

const TONES: Record<Tone, { wrapper: string; icon: string; Icon: typeof AlertTriangle }> =
  {
    amber: {
      wrapper: 'border-amber/40 bg-tint-amber text-amber-ink',
      icon: 'text-amber-ink',
      Icon: AlertTriangle,
    },
    danger: {
      wrapper: 'border-danger/25 bg-tint-danger text-danger-ink',
      icon: 'text-danger',
      Icon: AlertTriangle,
    },
    success: {
      wrapper: 'border-success/25 bg-tint-success text-success-ink',
      icon: 'text-success',
      Icon: CheckCircle2,
    },
    info: {
      wrapper: 'border-teal/20 bg-tint-teal text-teal',
      icon: 'text-teal',
      Icon: Info,
    },
    navy: {
      wrapper: 'border-navy/20 bg-tint-navy text-navy',
      icon: 'text-navy',
      Icon: PauseCircle,
    },
  }

interface AlertBannerProps {
  tone?: Tone
  title: string
  body?: string
  action?: ReactNode
  className?: string
}

export function AlertBanner({
  tone = 'info',
  title,
  body,
  action,
  className,
}: AlertBannerProps) {
  const style = TONES[tone]
  const { Icon } = style
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-[8px] border p-4 sm:flex-row sm:items-center sm:justify-between',
        style.wrapper,
        className,
      )}
    >
      <div className="flex gap-3">
        <span className={cn('mt-0.5 shrink-0', style.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {body ? <p className="mt-0.5 text-[13px] opacity-90">{body}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 pl-8 sm:pl-0">{action}</div> : null}
    </div>
  )
}
