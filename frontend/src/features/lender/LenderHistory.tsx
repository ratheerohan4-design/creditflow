import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { addDaysKey, displayDayKey, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { downloadCsv } from '@/lib/downloads'
import { useSession } from '@/stores/session'

interface HistoryRow {
  date: string
  sales: number
  repayment: number
  merchants: number
}

export function LenderHistory() {
  useDocumentTitle('Repayment history')
  const lenderId = useSession((state) => state.lenderId)
  const [from, setFrom] = useState(addDaysKey(-29))
  const [to, setTo] = useState(addDaysKey(0))

  const filters = { from, to }
  const query = useQuery({
    queryKey: queryKeys.lender.history(lenderId ?? '', JSON.stringify(filters)),
    queryFn: () => lenderApi.getHistory(lenderId ?? '', filters),
    enabled: Boolean(lenderId),
  })

  const columns: Column<HistoryRow>[] = [
    { key: 'date', header: 'Day', cell: (row) => displayDayKey(row.date) },
    {
      key: 'merchants',
      header: 'Shops that routed',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{row.merchants}</span>,
    },
    {
      key: 'sales',
      header: 'Total sales behind it',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatMoney(row.sales)}</span>,
    },
    {
      key: 'repayment',
      header: 'Received by you',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{formatMoney(row.repayment)}</span>
      ),
    },
  ]

  const totalReceived = (query.data ?? []).reduce((sum, row) => sum + row.repayment, 0)

  function download() {
    downloadCsv(
      `creditflow-repayments-${from}-to-${to}.csv`,
      (query.data ?? []).map((row) => ({
        day: row.date,
        shops: row.merchants,
        sales: row.sales,
        received: row.repayment,
      })),
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Repayment history"
        description="Day-by-day totals of what reached you"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={download}
            disabled={(query.data?.length ?? 0) === 0}
          >
            <Download className="h-4 w-4" />
            Download statement
          </Button>
        }
      />

      <AlertBanner
        tone="info"
        title="Totals only"
        body="You see daily repayment totals, never your customers' payment references."
      />

      <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="from" label="From">
          <Input
            id="from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field id="to" label="To">
          <Input
            id="to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-baseline justify-between gap-2 p-4">
          <p className="text-muted text-[13px]">Received in this period</p>
          <p className="text-navy text-[24px] font-bold tabular-nums">
            {formatMoney(totalReceived)}
          </p>
        </CardContent>
      </Card>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No repayments in this period',
          body: 'Pick a wider range to see earlier history.',
          icon: <History className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="Repayment history"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.date}
            dense
          />
        )}
      </QueryBoundary>
    </div>
  )
}
