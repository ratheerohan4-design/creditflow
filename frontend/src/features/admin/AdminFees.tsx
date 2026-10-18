import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { FeeEntry } from '@/data/types'
import { downloadCsv } from '@/lib/downloads'
import { formatDayMonth, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const TYPE_LABEL: Record<FeeEntry['type'], string> = {
  platform: 'Platform fee',
  subscription: 'Subscription',
  late_fee: 'Late fee',
  onboarding: 'Onboarding',
}

export function AdminFees() {
  useDocumentTitle('Fees')
  const queryClient = useQueryClient()
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [marking, setMarking] = useState<FeeEntry | null>(null)

  const filters = { type, status }
  const query = useQuery({
    queryKey: queryKeys.admin.fees(JSON.stringify(filters)),
    queryFn: () => adminApi.getFees(filters),
  })

  const setFeeStatus = useMutation({
    mutationFn: ({
      id,
      status: next,
      reason,
    }: {
      id: string
      status: FeeEntry['status']
      reason?: string
    }) => adminApi.setFeeStatus(id, next, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  const rows = query.data ?? []
  const paidTotal = rows
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0)
  const unpaidTotal = rows
    .filter((r) => r.status === 'unpaid')
    .reduce((sum, r) => sum + r.amount, 0)

  const columns: Column<FeeEntry>[] = [
    {
      key: 'date',
      header: 'Date',
      cell: (row) => formatDayMonth(`${row.date}T12:00:00+05:30`),
    },
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.merchantName}</p>
          <p className="text-muted text-[12px]">{row.period}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', cell: (row) => TYPE_LABEL[row.type] },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{formatMoney(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      cell: (row) =>
        row.status === 'unpaid' ? (
          <Button
            size="sm"
            variant="outline"
            disabled={setFeeStatus.isPending}
            onClick={() => setFeeStatus.mutate({ id: row.id, status: 'paid' })}
          >
            Mark paid
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={setFeeStatus.isPending}
            onClick={() => setMarking(row)}
          >
            Mark unpaid
          </Button>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fees"
        description="Platform earnings from routing and subscriptions"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                `creditflow-fees-${type}-${status}.csv`,
                rows.map((row) => ({
                  date: row.date,
                  merchant: row.merchantName,
                  type: row.type,
                  period: row.period,
                  amount: row.amount,
                  status: row.status,
                })),
              )
            }
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border-line bg-surface rounded-[8px] border p-4">
          <p className="text-muted text-[12px]">Collected in this view</p>
          <p className="text-navy mt-1 text-[20px] font-bold tabular-nums">
            {formatMoney(paidTotal)}
          </p>
        </div>
        <div className="border-amber/40 bg-tint-amber rounded-[8px] border p-4">
          <p className="text-amber-ink text-[12px]">Still to collect</p>
          <p className="text-amber-ink mt-1 text-[20px] font-bold tabular-nums">
            {formatMoney(unpaidTotal)}
          </p>
        </div>
      </div>

      <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="fee-type" label="Fee type">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="fee-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="platform">Platform fee</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="late_fee">Late fee</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="fee-status" label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="fee-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No fee entries match these filters',
          body: 'Try a different type or status.',
        }}
      >
        {(rows) => (
          <DataTable
            label="Fee ledger"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            dense
          />
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={marking !== null}
        onOpenChange={(open) => !open && setMarking(null)}
        title="Mark this fee as unpaid?"
        description={
          marking
            ? `${TYPE_LABEL[marking.type]} of ${formatMoney(marking.amount)} for ${marking.merchantName} will show as outstanding again.`
            : ''
        }
        confirmLabel="Mark unpaid"
        busy={setFeeStatus.isPending}
        onConfirm={(reason) => {
          if (!marking) return
          setFeeStatus.mutate({ id: marking.id, status: 'unpaid', reason })
        }}
      />
    </div>
  )
}
