import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Search } from 'lucide-react'
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
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { VerificationItem } from '@/data/types'
import { formatDateTime, relativeFromNow } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

export function AdminVerification() {
  useDocumentTitle('Verification queue')
  const navigate = useNavigate()
  const [status, setStatus] = useState('pending')
  const [search, setSearch] = useState('')

  const filters = { status }
  const query = useQuery({
    queryKey: [...queryKeys.admin.verifications(), status],
    queryFn: () => adminApi.getVerifications(filters),
  })

  const rows = (query.data ?? []).filter((item) =>
    search ? item.merchantName.toLowerCase().includes(search.toLowerCase()) : true,
  )

  const columns: Column<VerificationItem>[] = [
    {
      key: 'merchant',
      header: 'Shop',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.merchantName}</p>
          <p className="text-muted text-[12px] tabular-nums">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      cell: (row) => (
        <div>
          <p className="text-[13px]">{formatDateTime(row.submittedAt)}</p>
          <p className="text-muted text-[12px]">{relativeFromNow(row.submittedAt)}</p>
        </div>
      ),
    },
    { key: 'agent', header: 'Field agent', cell: (row) => row.agentName },
    {
      key: 'photos',
      header: 'Documents',
      align: 'right',
      cell: (row) => (
        <span className="text-muted text-[13px] tabular-nums">
          {row.shopPhotos} photos · {row.idType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Verification queue"
        description="Shop visits waiting for a decision"
      />

      <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="verify-status" label="Show">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="verify-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="more_docs">More documents needed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="verify-search" label="Search">
          <div className="relative">
            <Search className="text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="verify-search"
              className="pl-9"
              placeholder="Shop name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={() => rows.length === 0}
        empty={{
          title: 'Queue is clear',
          body: 'No verification requests match this filter.',
          icon: <ClipboardCheck className="h-6 w-6" />,
        }}
      >
        {() => (
          <DataTable
            label="Verification queue"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            onRowClick={(row) => navigate(`/admin/verification/${row.id}`)}
          />
        )}
      </QueryBoundary>
    </div>
  )
}
