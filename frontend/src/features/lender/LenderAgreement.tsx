import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { DetailRow, Field } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { lenderApi, merchantApi } from '@/data/api'
import { formatDate, formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const flagSchema = z.object({
  description: z
    .string()
    .trim()
    .min(15, 'Describe what looks wrong — at least 15 characters')
    .max(400, 'Keep it under 400 characters'),
})

type FlagForm = z.infer<typeof flagSchema>

export function LenderAgreement() {
  const { merchantId = '' } = useParams()
  const lenderId = useSession((state) => state.lenderId)
  const queryClient = useQueryClient()
  const [flagOpen, setFlagOpen] = useState(false)
  const [flaggedId, setFlaggedId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['lender', lenderId, 'agreement', merchantId] as const,
    queryFn: () => lenderApi.getAgreementView(lenderId ?? '', merchantId),
    enabled: Boolean(lenderId && merchantId),
  })

  useDocumentTitle(query.data ? `${query.data.agreement.id} · Agreement` : 'Agreement')

  const form = useForm<FlagForm>({
    resolver: zodResolver(flagSchema),
    defaultValues: { description: '' },
  })

  const flag = useMutation({
    mutationFn: (description: string) =>
      merchantApi.raiseDispute(merchantId, {
        transactionId: 'flagged-by-lender',
        reason: 'Lender flagged a repayment mismatch',
        description,
      }),
    onSuccess: (dispute) => {
      setFlaggedId(dispute.id)
      setFlagOpen(false)
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  return (
    <QueryBoundary query={query}>
      {({ agreement, merchant, lender }) => (
        <div className="space-y-5">
          <PageHeader
            title="Agreement"
            description={`${merchant.name} · ${agreement.id}`}
            backTo={`/lender/merchants/${merchant.id}`}
            backLabel="Repayment status"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFlagOpen(true)}
                disabled={agreement.outstanding <= 0}
              >
                <AlertTriangle className="h-4 w-4" />
                Flag dispute
              </Button>
            }
          />

          {flaggedId ? (
            <AlertBanner
              tone="success"
              title={`Dispute ${flaggedId} raised`}
              body="Our operations team will review it with both parties."
              action={
                <Button size="sm" variant="ghost" onClick={() => setFlaggedId(null)}>
                  Dismiss
                </Button>
              }
            />
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Merchant"
                value={`${merchant.name} (${merchant.ownerName})`}
              />
              <DetailRow label="Shop" value={`${merchant.shopType}, ${merchant.city}`} />
              <DetailRow
                label="Lender"
                value={`${lender.name} (${lender.contactPerson})`}
              />
              <DetailRow
                label="Status"
                value={<StatusBadge status={agreement.paused ? 'paused' : 'on_track'} />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Credit amount"
                value={<Money value={agreement.creditAmount} />}
              />
              <DetailRow
                label="Disbursed on"
                value={formatDate(agreement.disbursedDate)}
              />
              <DetailRow
                label="Repayment rate"
                value={`${Math.round(agreement.rate * 100)}% of each sale`}
              />
              <DetailRow
                label="Minimum daily repayment"
                value={<Money value={agreement.minDailyFloor} />}
              />
              <DetailRow label="Grace days" value={`${agreement.graceDays} days`} />
              <DetailRow
                label="Target completion"
                value={formatDate(agreement.endDate)}
              />
              <DetailRow
                label="Still owed"
                value={<Money value={agreement.outstanding} />}
              />
              <div className="border-line border-t pt-3">
                <p className="text-muted text-[12px] font-semibold tracking-wide uppercase">
                  Penalty terms
                </p>
                <p className="text-ink mt-1 text-[13px] leading-relaxed">
                  {agreement.penaltyTerms}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Consent</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Consent given on"
                value={formatDate(agreement.consentDate)}
              />
              <DetailRow label="Onboarding agent" value={agreement.onboardingAgent} />
              <DetailRow
                label="Merchant UPI ID"
                value={<span className="tabular-nums">{merchant.upiId}</span>}
              />
            </CardContent>
          </Card>

          <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Flag a dispute</DialogTitle>
                <DialogDescription>
                  This raises a dispute on {merchant.name}'s agreement. Our team reviews
                  it with both parties.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit((values) => flag.mutate(values.description))}
                className="space-y-4"
              >
                <Field
                  id="flag-description"
                  label="What looks wrong?"
                  required
                  error={form.formState.errors.description?.message}
                >
                  <Textarea
                    id="flag-description"
                    placeholder="The last 4 days routed far less than the agreed 20% of sales."
                    {...form.register('description')}
                  />
                </Field>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFlagOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={flag.isPending}>
                    {flag.isPending ? 'Sending…' : 'Raise dispute'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <p className="text-muted text-[12px]">
            Merchant support record last updated {formatDateTime(agreement.consentDate)}.
          </p>
        </div>
      )}
    </QueryBoundary>
  )
}
