import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import { ProgressBar } from '@/components/shared/ProgressBar'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { lenderApi, type LenderPortfolioRow } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'on_track', label: 'Active' },
  { value: 'low_activity', label: 'Low activity' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'high_risk', label: 'High risk' },
  { value: 'default', label: 'Default' },
  { value: 'completed', label: 'Complete' },
]

export function LenderMerchants() {
  useDocumentTitle('Merchants')
  const navigate = useNavigate()
  const lenderId = useSession((state) => state.lenderId)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filters = { search, status }
  const query = useQuery({
    queryKey: queryKeys.lender.merchants(lenderId ?? '', JSON.stringify(filters)),
    queryFn: () => lenderApi.getMerchants(lenderId ?? '', filters),
    enabled: Boolean(lenderId),
  })

  const columns: Column<LenderPortfolioRow>[] = [
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.merchant.name}</p>
          <p className="text-muted text-[12px]">
            {row.merchant.city} · {row.agreement.id}
          </p>
        </div>
      ),
    },
    {
      key: 'credit',
      header: 'Credit given',
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">{formatMoney(row.agreement.creditAmount)}</span>
      ),
    },
    {
      key: 'outstanding',
      header: 'Still owed',
      align: 'right',
      cell: (row) => (
        <span className="tabular-nums">{formatMoney(row.agreement.outstanding)}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Repaid',
      className: 'w-56',
      mobileLabel: 'Repaid',
      cell: (row) => (
        <ProgressBar
          percent={row.repaidPercent}
          label=""
          variant={
            row.stats.state === 'completed'
              ? 'success'
              : row.stats.state === 'default'
                ? 'danger'
                : 'teal'
          }
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.stats.state} />,
    },
    {
      key: 'activity',
      header: 'Last activity',
      align: 'right',
      cell: (row) => (
        <span className="text-muted text-[12px] tabular-nums">
          {row.stats.daysSinceLastPayment === 0
            ? 'Today'
            : `${row.stats.daysSinceLastPayment} days ago`}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Merchants" description="Everyone you have given credit to" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="search" label="Search">
          <div className="relative">
            <Search className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="search"
              placeholder="Shop name, town or agreement"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </Field>
        <Field id="status" label="Status">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No merchants match these filters',
          body: 'Clear the search or pick a different status.',
        }}
      >
        {(rows) => (
          <DataTable
            label="Merchants"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.agreement.id}
            onRowClick={(row) => navigate(`/lender/merchants/${row.merchant.id}`)}
          />
        )}
      </QueryBoundary>
    </div>
  )
}
