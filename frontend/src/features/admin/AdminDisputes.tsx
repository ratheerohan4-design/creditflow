import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { Dispute } from '@/data/types'
import { daysBetween, formatDate, formatMoney, istDateKey } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

export function AdminDisputes() {
  useDocumentTitle('Disputes')
  const navigate = useNavigate()
  const [status, setStatus] = useState('open')

  const filters = { status }
  const query = useQuery({
    queryKey: [...queryKeys.admin.disputes(), status],
    queryFn: () => adminApi.getDisputes(filters),
  })

  const columns: Column<Dispute>[] = [
    {
      key: 'id',
      header: 'Dispute',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.id}</p>
          <p className="text-muted text-[12px] tabular-nums">{row.agreementId}</p>
        </div>
      ),
    },
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <div>
          <p className="text-ink text-[13px]">{row.merchantName}</p>
          <p className="text-muted text-[12px]">{row.reason}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount in question',
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">
          {row.amount > 0 ? formatMoney(row.amount) : 'Not specified'}
        </span>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">
          {daysBetween(row.createdAt.slice(0, 10), istDateKey())} days
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Raised',
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Disputes" description="Claims raised by merchants and lenders" />

      <div className="max-w-xs">
        <Field id="dispute-status" label="Show">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="dispute-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No disputes in this queue',
          body: 'Claims appear here as soon as a merchant or lender raises one.',
          icon: <AlertTriangle className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="Disputes"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/admin/disputes/${row.id}`)}
          />
        )}
      </QueryBoundary>
    </div>
  )
}
