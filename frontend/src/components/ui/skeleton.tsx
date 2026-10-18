import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-tint-neutral animate-pulse rounded-[6px]', className)}
      {...props}
    />
  )
}

export { Skeleton }
