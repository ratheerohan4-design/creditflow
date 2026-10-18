import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, AlertTriangle, IndianRupee, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { LastUpdated } from '@/components/shared/LastUpdated'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaceChart } from '@/components/charts/PaceChart'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDayMonth, formatMoney, relativeFromNow } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

export function LenderPortfolio() {
  useDocumentTitle('Portfolio')
  const lenderId = useSession((state) => state.lenderId)

  const query = useQuery({
    queryKey: queryKeys.lender.portfolio(lenderId ?? ''),
    queryFn: () => lenderApi.getPortfolio(lenderId ?? ''),
    enabled: Boolean(lenderId),
  })

  return (
    <QueryBoundary query={query}>
      {(data) => (
        <div className="space-y-5">
          <PageHeader
            title={data.lender.name}
            description={`Trade credit you have extended · ${data.lender.city}`}
            actions={
              <LastUpdated at={data.updatedAt} onRefresh={() => query.refetch()} />
            }
          />

          {data.atRiskCount > 0 ? (
            <AlertBanner
              tone="amber"
              title={`${data.atRiskCount} ${data.atRiskCount === 1 ? 'agreement needs' : 'agreements need'} attention`}
              body="Repairs, closures and slow footfall show up here before they become defaults."
              action={
                <Button asChild size="sm" variant="amber">
                  <Link to="/lender/risk">Open risk alerts</Link>
                </Button>
              }
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Credit extended"
              value={formatMoney(data.totalExtended)}
              hint={`${data.rows.length} agreements all time`}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Received today"
              value={formatMoney(data.receivedToday)}
              hint="Routed from this morning's sales"
              icon={<IndianRupee className="h-4 w-4" />}
            />
            <StatCard
              label="This week"
              value={formatMoney(data.receivedWeek)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="This month"
              value={formatMoney(data.receivedMonth)}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="Active agreements"
              value={String(data.activeCount)}
              hint={`${data.completedCount} completed`}
            />
            <StatCard
              label="Needs attention"
              value={String(data.atRiskCount)}
              tone={data.atRiskCount > 0 ? 'amber' : 'default'}
              hint="Low activity, at risk or default"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Repayment pace</CardTitle>
            </CardHeader>
            <CardContent>
              <PaceChart data={data.pace} />
              <p className="text-muted mt-3 text-[12px]">
                Amber is what these shops usually route by now. Teal is what has actually
                reached you over the last 30 days.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent repayments</CardTitle>
              </CardHeader>
              <CardContent>
                {data.feed.length === 0 ? (
                  <p className="text-muted py-8 text-center text-[13px]">
                    No repayments routed yet today.
                  </p>
                ) : (
                  <ul className="divide-line divide-y">
                    {data.feed.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div>
                          <Link
                            to={`/lender/merchants/${item.merchantId}`}
                            className="text-ink hover:text-teal text-[13px] font-semibold"
                          >
                            {item.merchantName}
                          </Link>
                          <p className="text-muted text-[12px] tabular-nums">
                            {relativeFromNow(item.iso)} · sale of{' '}
                            {formatMoney(item.amount)}
                          </p>
                        </div>
                        <span className="text-navy text-[14px] font-bold tabular-nums">
                          {formatMoney(item.repayment)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your merchants</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-line divide-y">
                  {[...data.rows]
                    .sort((a, b) => b.repaidPercent - a.repaidPercent)
                    .slice(0, 6)
                    .map((row) => (
                      <li
                        key={row.agreement.id}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <Link
                            to={`/lender/merchants/${row.merchant.id}`}
                            className="text-ink hover:text-teal block truncate text-[13px] font-semibold"
                          >
                            {row.merchant.name}
                          </Link>
                          <p className="text-muted text-[12px]">
                            {row.repaidPercent.toFixed(0)}% repaid · last sale{' '}
                            {row.lastActivityDate
                              ? formatDayMonth(`${row.lastActivityDate}T12:00:00+05:30`)
                              : '—'}
                          </p>
                        </div>
                        <StatusBadge status={row.stats.state} />
                      </li>
                    ))}
                </ul>
                <Link
                  to="/lender/merchants"
                  className="text-teal mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
                >
                  See all merchants
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
