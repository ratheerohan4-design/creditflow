import { Badge } from '@/components/ui/badge'
import type { AgreementStatus } from '@/data/types'

export type StatusVariant = 'neutral' | 'navy' | 'teal' | 'amber' | 'success' | 'danger'

interface StatusStyle {
  label: string
  variant: StatusVariant
}

/**
 * Every status in the product carries a text label as well as a colour.
 * New statuses must be added here so no screen invents its own wording.
 */
const STATUS_STYLES: Record<string, StatusStyle> = {
  on_track: { label: 'Active', variant: 'teal' },
  low_activity: { label: 'Low activity', variant: 'amber' },
  at_risk: { label: 'At risk', variant: 'amber' },
  high_risk: { label: 'High risk', variant: 'danger' },
  default: { label: 'Default', variant: 'danger' },
  paused: { label: 'Routing paused', variant: 'neutral' },
  completed: { label: 'Complete', variant: 'success' },
  new: { label: 'New', variant: 'amber' },
  acknowledged: { label: 'Acknowledged', variant: 'navy' },
  escalated: { label: 'Escalated', variant: 'danger' },
  open: { label: 'Open', variant: 'amber' },
  resolved: { label: 'Resolved', variant: 'success' },
  in_progress: { label: 'In progress', variant: 'navy' },
  routed: { label: 'Routed', variant: 'teal' },
  pending: { label: 'Settling', variant: 'amber' },
  paid: { label: 'Paid', variant: 'success' },
  unpaid: { label: 'Unpaid', variant: 'amber' },
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  lapsed: { label: 'Lapsed', variant: 'amber' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  more_docs: { label: 'More documents needed', variant: 'navy' },
  upi: { label: 'UPI', variant: 'teal' },
  cash: { label: 'Cash logged', variant: 'neutral' },
}

const DOT_COLORS: Record<StatusVariant, string> = {
  neutral: 'bg-muted',
  navy: 'bg-navy',
  teal: 'bg-teal',
  amber: 'bg-amber',
  success: 'bg-success',
  danger: 'bg-danger',
}

export function statusLabel(key: string): string {
  return STATUS_STYLES[key]?.label ?? key
}

export function statusVariant(key: string): StatusVariant {
  return STATUS_STYLES[key]?.variant ?? 'neutral'
}

interface StatusBadgeProps {
  status: AgreementStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? { label: status, variant: 'neutral' as const }
  return (
    <Badge variant={style.variant} className={className}>
      <span className={cnDot(DOT_COLORS[style.variant])} aria-hidden="true" />
      {style.label}
    </Badge>
  )
}

function cnDot(color: string) {
  return `inline-block h-1.5 w-1.5 rounded-full ${color}`
}
