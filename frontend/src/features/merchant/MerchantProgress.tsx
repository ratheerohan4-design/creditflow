import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { LastUpdated } from '@/components/shared/LastUpdated'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { RepaymentBars } from '@/components/charts/RepaymentBars'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { DailyAggregate } from '@/data/types'
import { displayDayKey, formatMoney, istDateKey } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

export function MerchantProgress() {
  useDocumentTitle('Daily progress')
  const merchantId = useSession((state) => state.merchantId)

  const query = useQuery({
    queryKey: queryKeys.merchant.progress(merchantId ?? ''),
    queryFn: () => merchantApi.getProgress(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const columns: Column<DailyAggregate>[] = [
    {
      key: 'date',
      header: 'Day',
      cell: (row) => displayDayKey(row.date),
    },
    {
      key: 'sales',
      header: 'Sales captured',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatMoney(row.sales)}</span>,
    },
    {
      key: 'repayment',
      header: 'Sent to lender',
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">{formatMoney(row.repaymentRouted)}</span>
      ),
    },
    {
      key: 'received',
      header: 'You received',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">
          {formatMoney(row.merchantReceived)}
        </span>
      ),
    },
  ]

  return (
    <QueryBoundary query={query}>
      {(data) => (
        <div className="space-y-5">
          <PageHeader
            title="Daily progress"
            description="Repayments routed from the last 14 days of sales"
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sent to lender, day by day</CardTitle>
            </CardHeader>
            <CardContent>
              {data.series14.length === 0 ? (
                <p className="text-muted py-8 text-center text-[13px]">
                  No sales recorded in the last 14 days.
                </p>
              ) : (
                <RepaymentBars data={data.series14} highlightDate={istDateKey()} />
              )}
              <p className="text-muted mt-3 text-[12px]">
                Today's bar is shown in amber. Cash sales you log yourself appear the same
                day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>This week</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Summary label="Sales captured" value={formatMoney(data.week.sales)} />
                <Summary
                  label="Sent to lender"
                  value={formatMoney(data.week.repayment)}
                />
                <Summary label="You received" value={formatMoney(data.week.received)} />
                <Summary
                  label="Days with sales"
                  value={`${data.week.activeDays} of ${data.week.days}`}
                />
              </dl>
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-navy text-[16px] font-semibold">Last 14 days</h2>
              <LastUpdated at={data.updatedAt} onRefresh={() => query.refetch()} />
            </div>
            {data.series14.length === 0 ? (
              <p className="border-line bg-surface text-muted rounded-[8px] border border-dashed py-10 text-center text-[13px]">
                Nothing to show yet. Sales appear here the same day they come in.
              </p>
            ) : (
              <DataTable
                label="Daily repayment progress"
                columns={columns}
                rows={[...data.series14].reverse()}
                rowKey={(row) => row.date}
                dense
              />
            )}
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-[12px]">{label}</dt>
      <dd className="text-navy mt-0.5 text-[16px] font-bold tabular-nums">{value}</dd>
    </div>
  )
}
