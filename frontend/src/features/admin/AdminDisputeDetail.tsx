import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DetailRow, Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { DisputeResolution } from '@/data/types'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const RESOLUTIONS: Array<{ value: DisputeResolution; label: string; detail: string }> = [
  {
    value: 'reverse',
    label: "Reverse in the merchant's favour",
    detail: "Credit the shop back and pull the amount from the lender's side.",
  },
  {
    value: 'uphold',
    label: 'Uphold the deduction',
    detail: 'The routed amount stays with the lender.',
  },
  {
    value: 'split',
    label: 'Split the amount',
    detail: 'Share the disputed amount between both parties.',
  },
]

export function AdminDisputeDetail() {
  const { disputeId = '' } = useParams()
  const queryClient = useQueryClient()
  const [resolution, setResolution] = useState<DisputeResolution>('split')
  const [splitPercent, setSplitPercent] = useState(50)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.admin.dispute(disputeId),
    queryFn: async () => {
      const all = await adminApi.getDisputes({ status: 'all' })
      const found = all.find((d) => d.id === disputeId)
      if (!found) throw new Error("We couldn't find that dispute.")
      return found
    },
    enabled: Boolean(disputeId),
  })

  useDocumentTitle(query.data ? `${query.data.id} · Dispute` : 'Dispute')

  const resolve = useMutation({
    mutationFn: (reason: string) =>
      adminApi.resolveDispute(disputeId, {
        resolution,
        splitPercent: resolution === 'split' ? splitPercent : undefined,
        note: reason,
      }),
    onSuccess: () => {
      setDone(true)
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  return (
    <QueryBoundary query={query}>
      {(dispute) => (
        <div className="space-y-5">
          <PageHeader
            title={`Dispute ${dispute.id}`}
            description={`${dispute.merchantName} · raised ${formatDateTime(dispute.createdAt)}`}
            backTo="/admin/disputes"
            backLabel="All disputes"
            actions={<StatusBadge status={dispute.status} />}
          />

          {done || dispute.status === 'resolved' ? (
            <AlertBanner
              tone="success"
              title="Dispute resolved"
              body={
                dispute.resolvedAt
                  ? `${dispute.resolvedBy ?? 'Ops'} resolved it on ${formatDateTime(dispute.resolvedAt)} and both parties were notified.`
                  : 'Both parties have been notified.'
              }
            />
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>The payment</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label="Transaction"
                  value={<span className="tabular-nums">{dispute.transactionId}</span>}
                />
                <DetailRow
                  label="Amount in question"
                  value={
                    dispute.amount > 0 ? (
                      <span className="tabular-nums">{formatMoney(dispute.amount)}</span>
                    ) : (
                      'Not specified'
                    )
                  }
                />
                <DetailRow
                  label="Agreement"
                  value={<span className="tabular-nums">{dispute.agreementId}</span>}
                />
                <DetailRow label="Merchant" value={dispute.merchantName} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Merchant's claim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-ink text-[13px] font-semibold">{dispute.reason}</p>
                <p className="text-muted mt-2 text-[13px] leading-relaxed">
                  {dispute.description}
                </p>
              </CardContent>
            </Card>
          </div>

          {dispute.status === 'open' ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Resolve</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={resolution}
                  onValueChange={(value) => setResolution(value as DisputeResolution)}
                  className="gap-3"
                >
                  {RESOLUTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="border-line hover:bg-canvas flex cursor-pointer items-start gap-2.5 rounded-[6px] border p-3"
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="mt-1"
                      />
                      <span>
                        <span className="text-ink block text-[13px] font-semibold">
                          {option.label}
                        </span>
                        <span className="text-muted block text-[12px]">
                          {option.detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>

                {resolution === 'split' ? (
                  <div className="mt-4 max-w-xs">
                    <Field
                      id="split"
                      label="Share for the merchant (%)"
                      hint="The rest goes back to the lender."
                    >
                      <Input
                        id="split"
                        type="number"
                        min={0}
                        max={100}
                        value={splitPercent}
                        onChange={(event) => setSplitPercent(Number(event.target.value))}
                      />
                    </Field>
                  </div>
                ) : null}

                <Button className="mt-4" onClick={() => setConfirmOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Resolve dispute
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Resolve this dispute?"
            description={`${RESOLUTIONS.find((r) => r.value === resolution)?.label} for ${dispute.merchantName}. Both parties are notified straight away.`}
            confirmLabel="Resolve and notify"
            busy={resolve.isPending}
            onConfirm={(reason) => resolve.mutate(reason)}
          />
        </div>
      )}
    </QueryBoundary>
  )
}
