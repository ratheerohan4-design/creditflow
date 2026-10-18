import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  tone?: 'teal' | 'amber' | 'navy' | 'success'
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, tone = 'teal', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'bg-tint-neutral relative h-2 w-full overflow-hidden rounded-full',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full rounded-full transition-[width] duration-200',
        tone === 'teal' && 'bg-teal',
        tone === 'amber' && 'bg-amber',
        tone === 'navy' && 'bg-navy',
        tone === 'success' && 'bg-success',
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = 'Progress'

export { Progress }
