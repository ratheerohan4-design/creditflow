import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[12px] font-semibold leading-5',
  {
    variants: {
      variant: {
        neutral: 'border-line-strong bg-tint-neutral text-muted',
        navy: 'border-navy/20 bg-tint-navy text-navy',
        teal: 'border-teal/20 bg-tint-teal text-teal',
        amber: 'border-amber/40 bg-tint-amber text-amber-ink',
        success: 'border-success/20 bg-tint-success text-success-ink',
        danger: 'border-danger/25 bg-tint-danger text-danger-ink',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
