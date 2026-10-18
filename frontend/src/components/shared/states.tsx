import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, RefreshCw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { UseQueryResult } from '@tanstack/react-query'

interface LoadingStateProps {
  label?: string
  rows?: number
  className?: string
}

export function LoadingState({
  label = 'Loading…',
  rows = 3,
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className={index === 0 ? 'h-20 w-full' : 'h-14 w-full'} />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  body?: string
  action?: ReactNode
  icon?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, body, action, icon, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-line bg-surface flex flex-col items-center justify-center rounded-[8px] border border-dashed px-6 text-center',
        compact ? 'py-8' : 'py-12',
      )}
    >
      <span className="text-muted mb-3">{icon ?? <Inbox className="h-6 w-6" />}</span>
      <p className="text-ink text-sm font-semibold">{title}</p>
      {body ? <p className="text-muted mt-1 max-w-sm text-[13px]">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  body?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({
  title = "We couldn't load this page",
  body = 'Something went wrong on our side. Please try again.',
  onRetry,
  compact,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'border-danger/25 bg-tint-danger flex flex-col items-center justify-center rounded-[8px] border px-6 text-center',
        compact ? 'py-8' : 'py-12',
      )}
    >
      <span className="text-danger mb-3">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="text-danger-ink text-sm font-semibold">{title}</p>
      <p className="text-danger-ink/85 mt-1 max-w-sm text-[13px]">{body}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function NoCreditState() {
  return (
    <EmptyState
      icon={<Wallet className="h-6 w-6" />}
      title="No active credit yet"
      body="When your lender approves credit, it will show up here with the repayment progress."
    />
  )
}

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
  empty?: { title: string; body?: string; icon?: ReactNode }
  loadingRows?: number
  isEmpty?: (data: T) => boolean
}

/**
 * Every list and dashboard runs through this so loading, empty and error
 * states never depend on the screen author remembering them.
 */
export function QueryBoundary<T>({
  query,
  children,
  empty,
  loadingRows = 3,
  isEmpty,
}: QueryBoundaryProps<T>) {
  if (query.isPending) return <LoadingState rows={loadingRows} />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />
  if (isEmpty?.(query.data)) {
    return (
      <EmptyState
        title={empty?.title ?? 'Nothing here yet'}
        body={empty?.body}
        icon={empty?.icon}
      />
    )
  }
  return <>{children(query.data)}</>
}
