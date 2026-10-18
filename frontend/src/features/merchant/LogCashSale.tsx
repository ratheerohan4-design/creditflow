import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { Field } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { merchantApi } from '@/data/api'
import type { Transaction } from '@/data/types'
import { formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const cashSaleSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Enter the sale amount' })
    .min(50, 'Enter at least ₹50')
    .max(200000, 'For amounts this large, ask your lender to confirm first'),
  note: z.string().trim().max(120, 'Keep the note under 120 characters').optional(),
})

type CashSaleForm = z.infer<typeof cashSaleSchema>

export function LogCashSale() {
  useDocumentTitle('Log cash sale')
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)
  const queryClient = useQueryClient()
  const [receipt, setReceipt] = useState<Transaction | null>(null)

  const form = useForm<CashSaleForm>({
    resolver: zodResolver(cashSaleSchema),
    defaultValues: { amount: undefined, note: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: CashSaleForm) =>
      merchantApi.logCashSale(merchantId ?? '', {
        amount: values.amount,
        note: values.note,
      }),
    onSuccess: (txn) => {
      setReceipt(txn)
      queryClient.invalidateQueries({ queryKey: ['merchant'] })
      form.reset({ amount: undefined, note: '' })
    },
  })

  const amount = Number(form.watch('amount') ?? 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Log a cash sale"
        description="For payments customers gave you by hand"
        backTo="/merchant"
        backLabel="Home"
      />

      <AlertBanner
        tone="info"
        title="Self-reported sales"
        body="Cash sales are logged by you, not routed from a QR payment. They still reduce what you owe."
      />

      {receipt ? (
        <Card className="border-success/25">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-success h-5 w-5" />
              <p className="text-success-ink text-sm font-semibold">
                {formatMoney(receipt.amount)} logged as a cash sale
              </p>
            </div>
            <dl className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <dt className="text-muted text-[13px]">Sent to lender</dt>
                <dd>
                  <Money value={receipt.repayment} />
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-muted text-[13px]">Platform fee</dt>
                <dd>
                  <Money value={receipt.platformFee} />
                </dd>
              </div>
              <div className="border-line flex items-baseline justify-between border-t pt-2">
                <dt className="text-ink text-[13px] font-semibold">You received</dt>
                <dd>
                  <Money value={receipt.merchantPayout} emphasis="large" />
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setReceipt(null)}>
                Log another sale
              </Button>
              <Button onClick={() => navigate('/merchant')}>Back to home</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <form
              onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
              className="space-y-4"
            >
              <Field
                id="amount"
                label="Sale amount"
                required
                error={form.formState.errors.amount?.message}
                hint="Enter the full amount the customer handed over."
              >
                <Input
                  id="amount"
                  inputMode="decimal"
                  placeholder="₹ 1,500"
                  {...form.register('amount')}
                />
              </Field>

              <Field
                id="note"
                label="Note (optional)"
                error={form.formState.errors.note?.message}
              >
                <Input
                  id="note"
                  placeholder="For example: 5 kg rice, cash"
                  {...form.register('note')}
                />
              </Field>

              {amount > 0 ? (
                <div className="bg-canvas rounded-[6px] p-3">
                  <p className="text-muted text-[12px]">After this sale is logged</p>
                  <p className="text-ink mt-1 text-[13px]">
                    About{' '}
                    <span className="font-semibold tabular-nums">
                      {formatMoney(amount * 0.2)}
                    </span>{' '}
                    goes to your lender, the rest is yours.
                  </p>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Logging sale…' : 'Log cash sale'}
              </Button>

              {mutation.isError ? (
                <AlertBanner
                  tone="danger"
                  title="We couldn't save this sale"
                  body="Please check the amount and try again."
                />
              ) : null}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
