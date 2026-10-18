import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  backTo?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-5', className)}>
      {backTo ? (
        <Link
          to={backTo}
          className="text-teal mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel ?? 'Back'}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-navy text-[20px] leading-tight font-semibold">{title}</h1>
          {description ? (
            <p className="text-muted mt-1 text-[13px]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
