import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LastUpdated } from '@/components/shared/LastUpdated'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RepaymentBars } from '@/components/charts/RepaymentBars'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDate, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

export function LenderRepayment() {
  const { merchantId = '' } = useParams()
  const lenderId = useSession((state) => state.lenderId)

  const query = useQuery({
    queryKey: queryKeys.lender.repayment(lenderId ?? '', merchantId),
    queryFn: () => lenderApi.getRepayment(lenderId ?? '', merchantId),
    enabled: Boolean(lenderId && merchantId),
  })

  useDocumentTitle(query.data ? `${query.data.merchant.name} · Repayment` : 'Repayment')

  return (
    <QueryBoundary query={query}>
      {(data) => (
        <div className="space-y-5">
          <PageHeader
            title={data.merchant.name}
            description={`${data.merchant.shopType} · ${data.merchant.city}`}
            backTo="/lender/merchants"
            backLabel="All merchants"
            actions={
              <div className="flex items-center gap-2">
                <StatusBadge status={data.stats.state} />
                <LastUpdated at={data.updatedAt} onRefresh={() => query.refetch()} />
              </div>
            }
          />

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-muted text-[13px]">Still owed to you</p>
                  <Money value={data.agreement.outstanding} emphasis="large" />
                  <p className="text-muted mt-1 text-[13px]">
                    of {formatMoney(data.agreement.creditAmount)} given on{' '}
                    {formatDate(data.agreement.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted text-[13px]">Daily average routed</p>
                  <p className="text-navy text-[20px] font-bold tabular-nums">
                    {formatMoney(
                      Math.round(data.stats.avgDailySales * data.agreement.rate),
                    )}
                  </p>
                  <p className="text-muted text-[12px]">
                    from sales of {formatMoney(Math.round(data.stats.avgDailySales))} per
                    day
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <ProgressBar
                  percent={data.repaidPercent}
                  label="Repaid so far"
                  variant={
                    data.stats.state === 'completed'
                      ? 'success'
                      : data.stats.state === 'default'
                        ? 'danger'
                        : 'teal'
                  }
                />
              </div>

              <div className="bg-canvas text-muted mt-4 flex items-center gap-2 rounded-[6px] px-3 py-2 text-[13px]">
                <CalendarClock className="h-4 w-4" />
                {data.stats.projectedCompletionDays !== null ? (
                  <span>
                    At this pace, fully repaid in about{' '}
                    <span className="text-ink font-semibold">
                      {data.stats.projectedCompletionDays} days
                    </span>{' '}
                    (
                    {formatDate(
                      new Date(
                        Date.now() + data.stats.projectedCompletionDays * 86400000,
                      ).toISOString(),
                    )}
                    )
                  </span>
                ) : (
                  <span>
                    No completion estimate — sales have been too quiet to project.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniStat label="Today" value={formatMoney(data.stats.todayRepayment)} />
            <MiniStat label="Last 7 days" value={formatMoney(data.stats.weekRepayment)} />
            <MiniStat
              label="Last 30 days"
              value={formatMoney(data.stats.monthRepayment)}
            />
            <MiniStat
              label="Days since last sale"
              value={String(data.stats.daysSinceLastPayment)}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Daily repayments, last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <RepaymentBars data={data.series30} height={220} />
            </CardContent>
          </Card>

          <Link
            to={`/lender/merchants/${data.merchant.id}/agreement`}
            className="border-line bg-surface hover:bg-canvas flex items-center justify-between rounded-[8px] border px-4 py-3"
          >
            <span className="text-ink text-[13px] font-semibold">
              Agreement and consent details
            </span>
            <ArrowRight className="text-muted h-4 w-4" />
          </Link>
        </div>
      )}
    </QueryBoundary>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface rounded-[8px] border p-4">
      <p className="text-muted text-[12px]">{label}</p>
      <p className="text-navy mt-1 text-[18px] font-bold tabular-nums">{value}</p>
    </div>
  )
}
