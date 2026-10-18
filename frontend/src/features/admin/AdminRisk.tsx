import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi, lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { RiskAlert } from '@/data/types'
import { formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const FOLLOW_UP_OWNERS = [
  'Vikram Yadav (field)',
  'Neelam Rani (field)',
  'Rahul Mehta (ops)',
]

export function AdminRisk() {
  useDocumentTitle('Risk flags')
  const queryClient = useQueryClient()
  const [assigning, setAssigning] = useState<RiskAlert | null>(null)
  const [resolving, setResolving] = useState<RiskAlert | null>(null)
  const [owner, setOwner] = useState(FOLLOW_UP_OWNERS[0])
  const [done, setDone] = useState<string | null>(null)

  const query = useQuery({
    queryKey: queryKeys.admin.risk(),
    queryFn: () => adminApi.getRiskFlags(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] })

  const escalate = useMutation({
    mutationFn: (id: string) => lenderApi.escalateRisk(id),
    onSuccess: () => {
      invalidate()
      setDone('Escalated to the field team')
    },
  })

  const assign = useMutation({
    mutationFn: ({ id, owner }: { id: string; owner: string }) =>
      adminApi.assignFollowUp(id, owner),
    onSuccess: () => {
      invalidate()
      setAssigning(null)
      setDone('Follow-up assigned')
    },
  })

  const resolve = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      adminApi.resolveRisk(id, note),
    onSuccess: () => {
      invalidate()
      setResolving(null)
      setDone('Risk flag resolved')
    },
  })

  const columns: Column<RiskAlert>[] = [
    {
      key: 'merchant',
      header: 'Merchant',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.merchantName}</p>
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
          {row.severity === 'high'
            ? 'High'
            : row.severity === 'medium'
              ? 'Medium'
              : 'Low'}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days since last payment',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{row.daysSinceLastPayment}</span>,
    },
    { key: 'created', header: 'Raised', cell: (row) => formatDateTime(row.createdAt) },
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
          <Button size="sm" variant="outline" onClick={() => setAssigning(row)}>
            <UserCheck className="h-4 w-4" />
            Assign follow-up
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setResolving(row)}>
            Resolve
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Risk flags" description="All shops across every lender" />

      {done ? (
        <AlertBanner
          tone="success"
          title={done}
          body="Recorded in the audit log."
          action={
            <Button size="sm" variant="ghost" onClick={() => setDone(null)}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      {escalate.isError || assign.isError || resolve.isError ? (
        <AlertBanner
          tone="danger"
          title="We couldn't save that change"
          body="Nothing was changed. Please try again."
        />
      ) : null}

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No risk flags',
          body: 'Every active agreement is within its repayment pace.',
          icon: <ShieldAlert className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="Risk flags"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
          />
        )}
      </QueryBoundary>

      <Dialog
        open={assigning !== null}
        onOpenChange={(open) => !open && setAssigning(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a follow-up</DialogTitle>
            <DialogDescription>
              {assigning
                ? `${assigning.merchantName} — ${assigning.type.replace('_', ' ')}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <Field id="owner" label="Follow-up owner" required>
            <div className="space-y-2">
              {FOLLOW_UP_OWNERS.map((name) => (
                <label
                  key={name}
                  className="text-ink flex cursor-pointer items-center gap-2.5 text-[13px]"
                >
                  <input
                    type="radio"
                    name="owner"
                    value={name}
                    checked={owner === name}
                    onChange={() => setOwner(name)}
                    className="h-4 w-4 accent-[#0D2B45]"
                  />
                  {name}
                </label>
              ))}
            </div>
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>
              Cancel
            </Button>
            <Button
              disabled={assign.isPending}
              onClick={() => assigning && assign.mutate({ id: assigning.id, owner })}
            >
              {assign.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={resolving !== null}
        onOpenChange={(open) => !open && setResolving(null)}
        title="Resolve this risk flag?"
        description={
          resolving
            ? `${resolving.merchantName} will be removed from the risk queue. This does not change the agreement itself.`
            : ''
        }
        confirmLabel="Resolve flag"
        busy={resolve.isPending}
        onConfirm={(reason) => {
          if (!resolving) return
          resolve.mutate({ id: resolving.id, note: reason })
        }}
      />
    </div>
  )
}
