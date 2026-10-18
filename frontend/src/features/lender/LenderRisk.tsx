import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { RiskAlert } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const SEVERITY_LABEL: Record<RiskAlert['severity'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const TYPE_LABEL: Record<RiskAlert['type'], string> = {
  low_activity: 'No sales lately',
  at_risk: 'Repayment pace below target',
  high_risk: 'Repayment pace far below target',
  default: 'No payment for 21 days',
  no_response: 'Merchant not responding',
}

export function LenderRisk() {
  useDocumentTitle('Risk alerts')
  const lenderId = useSession((state) => state.lenderId)
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')

  const query = useQuery({
    queryKey: queryKeys.lender.risk(lenderId ?? ''),
    queryFn: () => lenderApi.getRiskAlerts(lenderId ?? ''),
    enabled: Boolean(lenderId),
  })

  const acknowledge = useMutation({
    mutationFn: (id: string) => lenderApi.acknowledgeRisk(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lender'] }),
  })

  const escalate = useMutation({
    mutationFn: (id: string) => lenderApi.escalateRisk(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lender', 'admin'] }),
  })

  const rows = (query.data ?? []).filter((row) =>
    statusFilter === 'all' ? true : row.status === statusFilter,
  )

  const columns: Column<RiskAlert>[] = [
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <div>
          <Link
            to={`/lender/merchants/${row.merchantId}`}
            className="text-ink hover:text-teal font-semibold"
          >
            {row.merchantName}
          </Link>
          <p className="text-muted text-[12px] tabular-nums">{row.agreementId}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (row) => (
        <span
          className={
            row.severity === 'high'
              ? 'text-danger font-semibold'
              : row.severity === 'medium'
                ? 'text-amber-ink font-semibold'
                : 'text-muted font-semibold'
          }
        >
          {SEVERITY_LABEL[row.severity]}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'What happened',
      cell: (row) => (
        <div>
          <p className="text-ink text-[13px]">{TYPE_LABEL[row.type]}</p>
          {row.note ? <p className="text-muted text-[12px]">{row.note}</p> : null}
        </div>
      ),
    },
    {
      key: 'days',
      header: 'Days since last payment',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{row.daysSinceLastPayment}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'new' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => acknowledge.mutate(row.id)}
              disabled={acknowledge.isPending}
            >
              Acknowledge
            </Button>
          ) : null}
          {row.status !== 'escalated' ? (
            <Button
              size="sm"
              variant="amber"
              onClick={() => escalate.mutate(row.id)}
              disabled={escalate.isPending}
            >
              Request intervention
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Risk alerts"
        description="Sorted by severity, most urgent first"
      />

      {query.data && query.data.some((row) => row.severity === 'high') ? (
        <AlertBanner
          tone="danger"
          title="A merchant has stopped repaying"
          body="Request an intervention and our field team will visit the shop."
        />
      ) : null}

      <div className="max-w-xs">
        <Field id="risk-status" label="Show">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="risk-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All alerts</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={() => rows.length === 0}
        empty={{
          title: 'Nothing needs attention',
          body: 'No risk alerts match this filter right now.',
          icon: <AlertTriangle className="h-6 w-6" />,
        }}
      >
        {() => (
          <>
            <DataTable
              label="Risk alerts"
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
            />
            <Card className="mt-5">
              <CardContent className="flex items-center gap-3 p-4">
                <PhoneCall className="text-teal h-4 w-4" />
                <p className="text-muted text-[13px]">
                  Calling works better than messaging for slow months. Field visits can be
                  requested from the operations team.
                </p>
              </CardContent>
            </Card>
            <p className="text-muted mt-3 text-[12px]">
              Latest alert raised {rows[0] ? formatDateTime(rows[0].createdAt) : '—'}.
            </p>
          </>
        )}
      </QueryBoundary>
    </div>
  )
}
