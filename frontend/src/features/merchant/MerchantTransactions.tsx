import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState, QueryBoundary } from '@/components/shared/states'
import { Field, DetailRow } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { Transaction } from '@/data/types'
import { addDaysKey, formatDateTime, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { agreementStatement, savePdf } from '@/lib/pdf'
import { useSession } from '@/stores/session'

export function MerchantTransactions() {
  useDocumentTitle('Payments')
  const merchantId = useSession((state) => state.merchantId)
  const [channel, setChannel] = useState<'all' | 'upi' | 'cash'>('all')
  const [from, setFrom] = useState(addDaysKey(-13))
  const [to, setTo] = useState(addDaysKey(0))
  const [selected, setSelected] = useState<Transaction | null>(null)

  const filters = { channel, from, to }
  const query = useQuery({
    queryKey: queryKeys.merchant.transactions(merchantId ?? '', JSON.stringify(filters)),
    queryFn: () => merchantApi.getTransactions(merchantId ?? '', filters),
    enabled: Boolean(merchantId),
  })

  const agreementQuery = useQuery({
    queryKey: queryKeys.merchant.agreement(merchantId ?? ''),
    queryFn: () => merchantApi.getAgreement(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const columns: Column<Transaction>[] = useMemo(
    () => [
      {
        key: 'time',
        header: 'Time',
        cell: (row) => (
          <span className="text-[13px]">
            {formatDateTime(row.iso).replace(' IST', '')}
          </span>
        ),
      },
      {
        key: 'channel',
        header: 'Type',
        cell: (row) => <StatusBadge status={row.channel} />,
      },
      {
        key: 'amount',
        header: 'Received',
        align: 'right',
        cell: (row) => <span className="tabular-nums">{formatMoney(row.amount)}</span>,
      },
      {
        key: 'repayment',
        header: 'Sent to lender',
        align: 'right',
        cell: (row) => <span className="tabular-nums">{formatMoney(row.repayment)}</span>,
      },
      {
        key: 'payout',
        header: 'You keep',
        align: 'right',
        cell: (row) => (
          <span className="font-semibold tabular-nums">
            {formatMoney(row.merchantPayout)}
          </span>
        ),
      },
      {
        key: 'ref',
        header: 'Reference',
        align: 'right',
        hideOnMobile: true,
        cell: (row) => (
          <span className="text-muted text-[12px] tabular-nums">
            {row.upiRef ? `UPI ${row.upiRef.slice(0, 6)}…` : 'Self-reported'}
          </span>
        ),
      },
    ],
    [],
  )

  function downloadStatement() {
    const data = agreementQuery.data
    if (!data) return
    const rows = (query.data ?? []).map((txn) => ({
      date: txn.iso,
      ref: txn.upiRef ?? `CASH-${txn.id.slice(-6)}`,
      sale: txn.amount,
      repayment: txn.repayment,
      payout: txn.merchantPayout,
    }))
    const doc = agreementStatement(data.merchant, data.agreement, rows, from, to)
    savePdf(doc, `creditflow-statement-${from}-to-${to}.pdf`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Every payment that arrived on your QR code"
        backTo="/merchant"
        backLabel="Home"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={downloadStatement}
            disabled={!agreementQuery.data || (query.data?.length ?? 0) === 0}
          >
            <Download className="h-4 w-4" />
            Download statement
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="from" label="From">
          <Input
            id="from"
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </Field>
        <Field id="to" label="To">
          <Input
            id="to"
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
          />
        </Field>
        <Field id="channel" label="Type">
          <Select
            value={channel}
            onValueChange={(value) => setChannel(value as 'all' | 'upi' | 'cash')}
          >
            <SelectTrigger id="channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="upi">UPI only</SelectItem>
              <SelectItem value="cash">Cash logged by me</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No payments in this period',
          body: 'Try a wider date range, or log a cash sale if customers paid by hand.',
          icon: <FileText className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="Payments"
            columns={columns}
            rows={rows.slice(0, 60)}
            rowKey={(row) => row.id}
            onRowClick={(row) => setSelected(row)}
          />
        )}
      </QueryBoundary>

      {query.data && query.data.length > 60 ? (
        <p className="text-muted text-center text-[12px]">
          Showing the most recent 60 payments in this period.
        </p>
      ) : null}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Payment details</DialogTitle>
                <DialogDescription>{formatDateTime(selected.iso)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-1">
                <DetailRow
                  label="Amount received"
                  value={<Money value={selected.amount} />}
                />
                <DetailRow
                  label="Sent to lender"
                  value={<Money value={selected.repayment} />}
                />
                <DetailRow
                  label="Platform fee"
                  value={<Money value={selected.platformFee} />}
                />
                <DetailRow
                  label="You keep"
                  value={<Money value={selected.merchantPayout} />}
                />
                <DetailRow
                  label="Type"
                  value={
                    selected.channel === 'upi' ? 'UPI payment' : 'Cash logged by you'
                  }
                />
                {selected.upiRef ? (
                  <DetailRow
                    label="UPI reference"
                    value={<span className="tabular-nums">{selected.upiRef}</span>}
                  />
                ) : null}
                {selected.payerHandle ? (
                  <DetailRow
                    label="Payer"
                    value={<span className="tabular-nums">{selected.payerHandle}</span>}
                  />
                ) : null}
                <DetailRow
                  label="Status"
                  value={<StatusBadge status={selected.status} />}
                />
              </div>
              {selected.selfReported ? (
                <p className="bg-tint-neutral text-muted mt-3 rounded-[6px] px-3 py-2 text-[12px]">
                  This sale was logged by you, not routed from a QR payment.
                </p>
              ) : null}
            </>
          ) : (
            <EmptyState
              compact
              title="Payment not found"
              body="This payment is no longer available."
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
