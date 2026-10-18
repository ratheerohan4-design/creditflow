import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'border-line-strong bg-surface text-ink placeholder:text-muted/70 flex min-h-24 w-full rounded-[6px] border px-3 py-2 text-sm',
      'focus-visible:border-navy disabled:bg-canvas focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
