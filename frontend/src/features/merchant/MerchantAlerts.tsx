import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BellRing, CheckCircle2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { QueryBoundary } from '@/components/shared/states'
import { PageHeader } from '@/components/shared/PageHeader'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { Alert } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useSession } from '@/stores/session'

const TYPE_ICONS: Record<Alert['type'], typeof AlertTriangle> = {
  low_activity: AlertTriangle,
  subscription_due: Tag,
  milestone: CheckCircle2,
  at_risk: AlertTriangle,
  high_risk: AlertTriangle,
  default: AlertTriangle,
}

export function MerchantAlerts() {
  useDocumentTitle('Alerts')
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.merchant.alerts(merchantId ?? ''),
    queryFn: () => merchantApi.getAlerts(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const markRead = useMutation({
    mutationFn: (alertId: string) => merchantApi.markAlertRead(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant'] }),
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alerts"
        description="Anything that needs your attention"
        backTo="/merchant"
        backLabel="Home"
      />

      {query.data && query.data.some((alert) => !alert.read) ? (
        <AlertBanner
          tone="amber"
          title={`${query.data.filter((alert) => !alert.read).length} unread alerts`}
          body="Older alerts stay here for your records."
        />
      ) : null}

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No alerts right now',
          body: "We'll tell you here if sales slow down, your plan needs renewal, or you cross a repayment milestone.",
          icon: <BellRing className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <ul className="space-y-3">
            {rows.map((alert) => {
              const Icon = TYPE_ICONS[alert.type]
              const isMilestone = alert.type === 'milestone'
              return (
                <li key={alert.id}>
                  <Card className={cn(!alert.read && 'border-l-amber border-l-4')}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]',
                          isMilestone
                            ? 'bg-tint-success text-success'
                            : 'bg-tint-amber text-amber-ink',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-ink text-sm font-semibold">{alert.title}</p>
                          {!alert.read ? (
                            <span className="bg-tint-amber text-amber-ink rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="text-muted mt-1 text-[13px]">{alert.body}</p>
                        <p className="text-muted mt-1.5 text-[12px] tabular-nums">
                          {formatDateTime(alert.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {alert.action ? (
                          <Button
                            size="sm"
                            variant="amber"
                            onClick={() => navigate(alert.action!.to)}
                          >
                            {alert.action.label}
                          </Button>
                        ) : null}
                        {!alert.read ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markRead.mutate(alert.id)}
                          >
                            Mark as read
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </QueryBoundary>
    </div>
  )
}
