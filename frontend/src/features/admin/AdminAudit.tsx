import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, History, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { AuditEntry } from '@/data/types'
import { downloadCsv } from '@/lib/downloads'
import { formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const ACTIONS = [
  'all',
  'Routing run completed',
  'Dispute resolved',
  'Verification approved',
  'Verification rejected',
  'Override applied',
  'QR activated',
  'QR deactivated',
  'QR reassigned',
  'Fee marked as paid',
  'Fee marked as unpaid',
  'Lead moved',
  'Risk alert escalated',
  'Follow-up assigned',
  'Risk flag resolved',
  'Agreement sent for consent',
  'Agreement activated',
  'Subscription lapsed',
  'Subscription renewed',
  'Reconciliation passed',
  'Reconciliation failed',
]

export function AdminAudit() {
  useDocumentTitle('Audit log')
  const [action, setAction] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filters = { action, from, to }
  const query = useQuery({
    queryKey: queryKeys.admin.audit(JSON.stringify(filters)),
    queryFn: () => adminApi.getAuditLog(filters),
  })

  const columns: Column<AuditEntry>[] = [
    {
      key: 'at',
      header: 'When',
      cell: (row) => <span className="tabular-nums">{formatDateTime(row.at)}</span>,
    },
    {
      key: 'actor',
      header: 'Who',
      cell: (row) => (
        <div>
          <p className="text-ink text-[13px] font-semibold">{row.actor}</p>
          <p className="text-muted text-[12px]">{row.actorRole}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <span className="text-ink text-[13px] font-semibold">{row.action}</span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      cell: (row) => (
        <div>
          <p className="text-[13px] tabular-nums">{row.target}</p>
          <p className="text-muted text-[12px]">{row.detail}</p>
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      align: 'right',
      cell: (row) => <span className="text-muted tabular-nums">{row.ip}</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        description="Every action taken in CreditFlow, in time order"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={(query.data?.length ?? 0) === 0}
            onClick={() =>
              downloadCsv(
                'creditflow-audit-log.csv',
                (query.data ?? []).map((row) => ({
                  when: row.at,
                  who: row.actor,
                  role: row.actorRole,
                  action: row.action,
                  target: row.target,
                  detail: row.detail,
                  ip: row.ip,
                })),
              )
            }
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Lock className="text-muted h-4 w-4" />
          <p className="text-muted text-[13px]">
            This record is read-only. Entries cannot be edited or deleted, by anyone.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field id="audit-action" label="Action">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger id="audit-action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === 'all' ? 'All actions' : item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="audit-from" label="From">
          <Input
            id="audit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field id="audit-to" label="To">
          <Input
            id="audit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No entries in this range',
          body: 'Widen the dates or pick a different action.',
          icon: <History className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="Audit log"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            dense
          />
        )}
      </QueryBoundary>

      <AlertBanner
        tone="info"
        title="Who can see this"
        body="Only CreditFlow operations staff can open the audit log."
      />
    </div>
  )
}
