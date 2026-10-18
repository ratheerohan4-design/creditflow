import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'border-line-strong bg-surface text-ink placeholder:text-muted/70 flex h-11 w-full rounded-[6px] border px-3 py-2 text-sm',
      'focus-visible:border-navy disabled:bg-canvas focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
