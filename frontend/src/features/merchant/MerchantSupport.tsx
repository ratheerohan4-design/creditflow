import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState, QueryBoundary } from '@/components/shared/states'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { SupportTicket, Transaction } from '@/data/types'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const disputeSchema = z.object({
  transactionId: z.string().min(1, 'Pick the payment this is about'),
  reason: z.string().min(1, 'Choose a reason'),
  description: z
    .string()
    .trim()
    .min(15, 'Tell us a little more — at least 15 characters')
    .max(400, 'Keep it under 400 characters'),
})

type DisputeForm = z.infer<typeof disputeSchema>

const REASONS = [
  'Amount deducted does not match the sale',
  'Same sale deducted twice',
  'Payment missing from my statement',
  'Something else',
]

const FAQ = [
  {
    q: 'When does my share reach me?',
    a: "Instantly. The customer's payment splits the moment it lands — your share goes to your account, the lender's share is routed to them.",
  },
  {
    q: 'Do I need to pay anything manually?',
    a: 'No. As long as your QR keeps getting payments, the repayment happens on its own.',
  },
  {
    q: 'What if a customer pays in cash?',
    a: 'Log the sale in the app. It reduces what you owe the same day.',
  },
  {
    q: 'Can my lender see my customer list?',
    a: "No. Your lender sees the daily totals that belong to the repayment — never your customers' names or numbers.",
  },
]

export function MerchantSupport() {
  useDocumentTitle('Support')
  const merchantId = useSession((state) => state.merchantId)
  const queryClient = useQueryClient()

  const txnsQuery = useQuery({
    queryKey: queryKeys.merchant.transactions(merchantId ?? '', 'support'),
    queryFn: () => merchantApi.getTransactions(merchantId ?? '', {}),
    enabled: Boolean(merchantId),
  })

  const ticketsQuery = useQuery({
    queryKey: queryKeys.merchant.tickets(merchantId ?? ''),
    queryFn: () => merchantApi.getTickets(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const form = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { transactionId: '', reason: '', description: '' },
  })

  const [raised, setRaised] = useState<string | null>(null)

  const raise = useMutation({
    mutationFn: (values: DisputeForm) =>
      merchantApi.raiseDispute(merchantId ?? '', values),
    onSuccess: (dispute) => {
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['merchant'] })
      setRaised(dispute.id)
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support"
        description="We answer within one working day"
        backTo="/merchant"
        backLabel="Home"
      />

      {raised ? (
        <AlertBanner
          tone="success"
          title={`Dispute ${raised} raised`}
          body="Our team reviews it with your lender and replies here."
          action={
            <Button size="sm" variant="ghost" onClick={() => setRaised(null)}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Raise a dispute</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => raise.mutate(values))}
            className="space-y-4"
          >
            <Field
              id="transactionId"
              label="Which payment is this about?"
              required
              error={form.formState.errors.transactionId?.message}
            >
              <Select
                value={form.watch('transactionId')}
                onValueChange={(value) =>
                  form.setValue('transactionId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="transactionId">
                  <SelectValue placeholder="Pick a recent payment" />
                </SelectTrigger>
                <SelectContent>
                  {(txnsQuery.data ?? []).slice(0, 25).map((txn: Transaction) => (
                    <SelectItem key={txn.id} value={txn.id}>
                      {formatDateTime(txn.iso)} · {formatMoney(txn.amount)} ·{' '}
                      {txn.channel === 'upi' ? 'UPI' : 'Cash logged'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="reason"
              label="What went wrong?"
              required
              error={form.formState.errors.reason?.message}
            >
              <Select
                value={form.watch('reason')}
                onValueChange={(value) =>
                  form.setValue('reason', value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              id="description"
              label="Tell us more"
              required
              error={form.formState.errors.description?.message}
              hint="What the customer paid, and what you saw in the app."
            >
              <Textarea
                id="description"
                placeholder="Customer paid ₹1,200 at 4:35 pm but my statement shows less."
                {...form.register('description')}
              />
            </Field>

            <Button type="submit" disabled={raise.isPending}>
              {raise.isPending ? 'Sending…' : 'Raise dispute'}
            </Button>

            {raise.isError ? (
              <AlertBanner
                tone="danger"
                title="We couldn't send this"
                body="Please try again in a moment. Our team has been alerted."
              />
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Talk to us</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <a
            href="tel:+911800000000"
            className="border-line hover:bg-canvas flex items-center gap-3 rounded-[6px] border px-4 py-3"
          >
            <Phone className="text-teal h-4 w-4" />
            <span>
              <span className="text-ink block text-[13px] font-semibold">
                Call support
              </span>
              <span className="text-muted block text-[12px] tabular-nums">
                1800 000 000 · 9 am to 8 pm
              </span>
            </span>
          </a>
          <a
            href="https://wa.me/919000000000"
            target="_blank"
            rel="noreferrer"
            className="border-line hover:bg-canvas flex items-center gap-3 rounded-[6px] border px-4 py-3"
          >
            <MessageCircle className="text-teal h-4 w-4" />
            <span>
              <span className="text-ink block text-[13px] font-semibold">
                WhatsApp us
              </span>
              <span className="text-muted block text-[12px]">
                Send a photo of the receipt
              </span>
            </span>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Common questions</CardTitle>
        </CardHeader>
        <CardContent className="divide-line divide-y">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="text-ink cursor-pointer list-none text-[13px] font-semibold">
                {item.q}
              </summary>
              <p className="text-muted mt-2 text-[13px] leading-relaxed">{item.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-navy mb-3 text-[16px] font-semibold">Your requests</h2>
        <QueryBoundary
          query={ticketsQuery}
          isEmpty={(rows) => rows.length === 0}
          empty={{
            title: 'No requests yet',
            body: 'Anything you raise will appear here with its status.',
            icon: <CheckCircle2 className="h-6 w-6" />,
          }}
        >
          {(rows) => (
            <DataTable
              label="Support requests"
              columns={ticketColumns}
              rows={rows}
              rowKey={(row) => row.id}
            />
          )}
        </QueryBoundary>
      </div>

      {ticketsQuery.isPending ? null : ticketsQuery.isError ? (
        <EmptyState compact title="Couldn't load your requests" />
      ) : null}
    </div>
  )
}

const ticketColumns: Column<SupportTicket>[] = [
  { key: 'subject', header: 'Request', cell: (row) => row.subject },
  { key: 'created', header: 'Raised', cell: (row) => formatDateTime(row.createdAt) },
  {
    key: 'status',
    header: 'Status',
    align: 'right',
    cell: (row) => <StatusBadge status={row.status} />,
  },
]
