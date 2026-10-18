import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  History,
  Headphones,
  QrCode,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { LastUpdated } from '@/components/shared/LastUpdated'
import { Money } from '@/components/shared/Money'
import { QueryBoundary } from '@/components/shared/states'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { useSession } from '@/stores/session'
import { formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const QUICK_LINKS = [
  { to: '/merchant/qr', label: 'Show QR', icon: QrCode },
  { to: '/merchant/transactions', label: 'History', icon: History },
  { to: '/merchant/support', label: 'Raise issue', icon: Headphones },
]

export function MerchantHome() {
  useDocumentTitle('Home')
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.merchant.home(merchantId ?? ''),
    queryFn: () => merchantApi.getHome(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const markRead = useMutation({
    mutationFn: (alertId: string) => merchantApi.markAlertRead(alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant'] }),
  })

  return (
    <QueryBoundary query={query} empty={{ title: 'No credit linked to this shop yet' }}>
      {(data) => {
        const { stats, agreement, merchant } = data
        const percentRepaid =
          ((agreement.creditAmount - agreement.outstanding) / agreement.creditAmount) *
          100
        const topAlert = data.alerts.find((alert) => !alert.read)
        const lapsed = merchant.subscription.status === 'lapsed'

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-navy text-[20px] leading-tight font-semibold">
                  {merchant.name}
                </h1>
                <p className="text-muted text-[13px]">{merchant.shopType}</p>
              </div>
              <StatusBadge status={stats.state} />
            </div>

            <LastUpdated at={data.updatedAt} onRefresh={() => query.refetch()} />

            {lapsed ? (
              <AlertBanner
                tone="amber"
                title="Your plan has lapsed"
                body="Renew to keep seeing repayment updates in the app. Your QR keeps accepting payments."
                action={
                  <Button
                    size="sm"
                    variant="amber"
                    onClick={() => navigate('/merchant/subscription')}
                  >
                    Renew plan
                  </Button>
                }
              />
            ) : null}

            {topAlert ? (
              <AlertBanner
                tone={topAlert.type === 'milestone' ? 'success' : 'amber'}
                title={topAlert.title}
                body={topAlert.body}
                action={
                  <div className="flex items-center gap-2">
                    {topAlert.action ? (
                      <Button
                        size="sm"
                        variant="amber"
                        onClick={() => navigate(topAlert.action!.to)}
                      >
                        {topAlert.action.label}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markRead.mutate(topAlert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                }
              />
            ) : null}

            <Card>
              <CardContent className="p-5">
                <p className="text-muted text-[13px] font-semibold">
                  Amount you still owe
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <Money value={agreement.outstanding} emphasis="hero" />
                </div>
                <p className="text-muted mt-1 text-[13px]">
                  to {data.lender.name} · Credit of {formatMoney(agreement.creditAmount)}
                </p>

                <div className="mt-5">
                  <ProgressBar
                    percent={percentRepaid}
                    label="Repaid so far"
                    variant={stats.state === 'completed' ? 'success' : 'teal'}
                    caption={`${formatMoney(agreement.creditAmount - agreement.outstanding)} of ${formatMoney(agreement.creditAmount)} covered by daily sales`}
                  />
                </div>

                <div className="border-line mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-muted text-[12px]">Today's digital sales</p>
                    <p className="text-navy mt-0.5 text-[20px] font-bold tabular-nums">
                      {formatMoney(stats.todaySales)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted text-[12px]">Sent to lender today</p>
                    <p className="text-navy mt-0.5 text-[20px] font-bold tabular-nums">
                      {formatMoney(stats.todayRepayment)}
                    </p>
                  </div>
                </div>

                <div className="text-muted mt-4 flex items-center gap-2 text-[13px]">
                  <CalendarDays className="h-4 w-4" />
                  {stats.projectedCompletionDays !== null ? (
                    <span>
                      At this pace, fully repaid in about{' '}
                      <span className="text-ink font-semibold">
                        {stats.projectedCompletionDays} days
                      </span>
                    </span>
                  ) : (
                    <span>No projected completion yet — sales have been quiet.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className="border-line bg-surface hover:border-navy/30 hover:bg-canvas flex flex-col items-center justify-center gap-2 rounded-[8px] border px-2 py-4 text-center transition-colors duration-150"
                >
                  <link.icon className="text-teal h-5 w-5" />
                  <span className="text-ink text-[13px] font-semibold">{link.label}</span>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="text-teal h-4 w-4" />
                  This week
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row
                  label="Sales captured"
                  value={formatMoney(
                    data.series14.slice(-7).reduce((sum, day) => sum + day.sales, 0),
                  )}
                />
                <Row label="Repaid to lender" value={formatMoney(stats.weekRepayment)} />
                <Row
                  label="Received by you"
                  value={formatMoney(
                    data.series14
                      .slice(-7)
                      .reduce((sum, day) => sum + day.merchantReceived, 0),
                  )}
                />
                <Row label="Payments today" value={String(data.transactionsToday)} />
              </CardContent>
            </Card>

            {agreement.outstanding <= 0 ? (
              <AlertBanner
                tone="success"
                title="Credit fully repaid"
                body="Your closure certificate is ready in the agreement section."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/merchant/agreement')}
                  >
                    View agreement
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                }
              />
            ) : null}

            <button
              onClick={() => navigate('/merchant/credit')}
              className="border-line bg-surface hover:bg-canvas flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left"
            >
              <span className="text-ink flex items-center gap-2 text-[13px] font-semibold">
                <AlertTriangle className="text-muted h-4 w-4" />
                Credit details and agreement
              </span>
              <ArrowRight className="text-muted h-4 w-4" />
            </button>
          </div>
        )
      }}
    </QueryBoundary>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-muted text-[13px]">{label}</span>
      <span className="text-ink text-[14px] font-semibold tabular-nums">{value}</span>
    </div>
  )
}
