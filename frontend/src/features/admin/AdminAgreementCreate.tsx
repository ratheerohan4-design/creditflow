import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FileSignature, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { DetailRow, Field } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { adminApi } from '@/data/api'
import { merchants, lenders } from '@/data/seed'
import { estimatedDaysToRepay, splitPayment } from '@/lib/calc'
import { addDaysKey, formatDate } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const agreementSchema = z.object({
  merchantId: z.string().min(1, 'Pick a merchant'),
  lenderId: z.string().min(1, 'Pick a lender'),
  creditAmount: z.coerce
    .number({ invalid_type_error: 'Enter the credit amount' })
    .min(25000, 'Minimum credit is ₹25,000')
    .max(500000, 'Maximum credit in this pilot is ₹5,00,000'),
  disbursementDate: z.string().min(1, 'Pick a disbursement date'),
  durationDays: z.coerce
    .number({ invalid_type_error: 'Enter the duration' })
    .min(30, 'At least 30 days')
    .max(365, 'At most 365 days'),
  ratePercent: z.coerce
    .number({ invalid_type_error: 'Enter the repayment percentage' })
    .min(15, 'Lowest supported rate is 15%')
    .max(30, 'Highest supported rate is 30%'),
  minDailyFloor: z.coerce.number({ invalid_type_error: 'Enter the daily floor' }).min(0),
  graceDays: z.coerce.number({ invalid_type_error: 'Enter grace days' }).min(0).max(30),
  penaltyTerms: z.string().trim().min(10, 'Write the penalty terms in plain words'),
  sampleDailySales: z.coerce
    .number({ invalid_type_error: 'Enter a sample daily sales figure' })
    .min(500, 'Enter at least ₹500'),
})

type AgreementForm = z.infer<typeof agreementSchema>

export function AdminAgreementCreate() {
  useDocumentTitle('New agreement')
  const [result, setResult] = useState<{ id: string; status: string } | null>(null)

  const form = useForm<AgreementForm>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      merchantId: '',
      lenderId: '',
      creditAmount: undefined,
      disbursementDate: addDaysKey(1),
      durationDays: 120,
      ratePercent: 20,
      minDailyFloor: 400,
      graceDays: 5,
      penaltyTerms:
        'No penalty for early repayment. A late fee applies after the grace days are used.',
      sampleDailySales: 5000,
    },
    mode: 'onBlur',
  })

  const send = useMutation({
    mutationFn: (values: AgreementForm) =>
      adminApi.createAgreement({
        merchantId: values.merchantId,
        lenderId: values.lenderId,
        creditAmount: values.creditAmount,
        repaymentRate: values.ratePercent / 100,
        sampleDailySales: values.sampleDailySales,
      }),
    onSuccess: (data) =>
      setResult({ id: data.id, status: "Sent for consent on the merchant's phone" }),
  })

  const activate = useMutation({
    mutationFn: (values: AgreementForm) =>
      adminApi.activateAgreement({
        merchantId: values.merchantId,
        creditAmount: values.creditAmount,
        rate: values.ratePercent / 100,
      }),
    onSuccess: (data) =>
      setResult({ id: data.id, status: 'Active — routing starts with the next sale' }),
  })

  const values = form.watch()
  const merchant = merchants.find((m) => m.id === values.merchantId)
  const lender = lenders.find((l) => l.id === values.lenderId)
  const rate = (values.ratePercent ?? 0) / 100
  const credit = values.creditAmount ?? 0
  const sampleSales = values.sampleDailySales ?? 0
  const estimatedDays =
    credit > 0 && sampleSales > 0 ? estimatedDaysToRepay(credit, rate, sampleSales) : null
  const dailyRepayment = Math.round(sampleSales * rate)
  const sampleSplit = sampleSales > 0 ? splitPayment(sampleSales, rate, credit) : null

  return (
    <div className="space-y-5">
      <PageHeader
        title="Draft an agreement"
        description="Set the terms, then send them to the merchant for consent"
      />

      {result ? (
        <AlertBanner
          tone="success"
          title={`Agreement ${result.id}`}
          body={result.status}
          action={
            <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-5">
            <form
              onSubmit={form.handleSubmit((values) => send.mutate(values))}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="merchantId"
                  label="Merchant"
                  required
                  error={form.formState.errors.merchantId?.message}
                >
                  <Select
                    value={values.merchantId}
                    onValueChange={(value) =>
                      form.setValue('merchantId', value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="merchantId">
                      <SelectValue placeholder="Pick a shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} · {m.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  id="lenderId"
                  label="Lender"
                  required
                  error={form.formState.errors.lenderId?.message}
                >
                  <Select
                    value={values.lenderId}
                    onValueChange={(value) =>
                      form.setValue('lenderId', value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="lenderId">
                      <SelectValue placeholder="Pick a lender" />
                    </SelectTrigger>
                    <SelectContent>
                      {lenders.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="creditAmount"
                  label="Credit amount"
                  required
                  error={form.formState.errors.creditAmount?.message}
                >
                  <Input
                    id="creditAmount"
                    inputMode="numeric"
                    placeholder="₹ 2,30,000"
                    {...form.register('creditAmount')}
                  />
                </Field>
                <Field
                  id="disbursementDate"
                  label="Disbursement date"
                  required
                  error={form.formState.errors.disbursementDate?.message}
                >
                  <Input
                    id="disbursementDate"
                    type="date"
                    {...form.register('disbursementDate')}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  id="ratePercent"
                  label="Repayment rate (% of each sale)"
                  required
                  error={form.formState.errors.ratePercent?.message}
                >
                  <Input
                    id="ratePercent"
                    inputMode="decimal"
                    {...form.register('ratePercent')}
                  />
                </Field>
                <Field
                  id="durationDays"
                  label="Duration (days)"
                  required
                  error={form.formState.errors.durationDays?.message}
                >
                  <Input
                    id="durationDays"
                    inputMode="numeric"
                    {...form.register('durationDays')}
                  />
                </Field>
                <Field
                  id="graceDays"
                  label="Grace days"
                  required
                  error={form.formState.errors.graceDays?.message}
                >
                  <Input
                    id="graceDays"
                    inputMode="numeric"
                    {...form.register('graceDays')}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="minDailyFloor"
                  label="Minimum daily repayment"
                  hint="Amount the shop should route even on a slow day"
                  error={form.formState.errors.minDailyFloor?.message}
                >
                  <Input
                    id="minDailyFloor"
                    inputMode="numeric"
                    placeholder="₹ 400"
                    {...form.register('minDailyFloor')}
                  />
                </Field>
                <Field
                  id="sampleDailySales"
                  label="Sample daily sales"
                  hint="Used to estimate how long repayment takes"
                  error={form.formState.errors.sampleDailySales?.message}
                >
                  <Input
                    id="sampleDailySales"
                    inputMode="numeric"
                    placeholder="₹ 5,000"
                    {...form.register('sampleDailySales')}
                  />
                </Field>
              </div>

              <Field
                id="penaltyTerms"
                label="Penalty terms"
                required
                error={form.formState.errors.penaltyTerms?.message}
                hint="Write it the way you would say it at the shop counter."
              >
                <Textarea id="penaltyTerms" {...form.register('penaltyTerms')} />
              </Field>

              <div className="border-line flex flex-wrap gap-2 border-t pt-4">
                <Button type="submit" disabled={send.isPending}>
                  <Send className="h-4 w-4" />
                  {send.isPending ? 'Sending…' : 'Send for consent'}
                </Button>
                <Button
                  type="button"
                  variant="amber"
                  disabled={activate.isPending}
                  onClick={form.handleSubmit((values) => activate.mutate(values))}
                >
                  <FileSignature className="h-4 w-4" />
                  {activate.isPending ? 'Activating…' : 'Approve and activate'}
                </Button>
              </div>

              {(send.isError || activate.isError) && (
                <AlertBanner
                  tone="danger"
                  title="We couldn't save this agreement"
                  body="Check the fields and try again. Our team has been alerted."
                />
              )}
            </form>
          </CardContent>
        </Card>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Live preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-line bg-canvas rounded-[8px] border p-4">
                <p className="text-navy text-[13px] font-semibold">
                  {merchant ? merchant.name : 'Pick a merchant'}
                </p>
                <p className="text-muted text-[12px]">
                  {lender ? `Credit from ${lender.name}` : 'Pick a lender'}
                </p>
                <div className="mt-3">
                  <Money value={credit} emphasis="large" />
                </div>
                <p className="text-muted mt-1 text-[12px]">
                  taken on{' '}
                  {values.disbursementDate ? formatDate(values.disbursementDate) : '—'} ·{' '}
                  {values.ratePercent || 0}% of every sale
                </p>

                <div className="border-line mt-4 space-y-1 border-t pt-3">
                  <DetailRow
                    label="Daily repayment at sample sales"
                    value={<Money value={dailyRepayment} />}
                  />
                  <DetailRow
                    label="Estimated days to repay"
                    value={estimatedDays ? `${estimatedDays} days` : '—'}
                  />
                  <DetailRow
                    label="Target completion"
                    value={
                      estimatedDays
                        ? formatDate(
                            new Date(
                              new Date(
                                `${values.disbursementDate ?? addDaysKey(1)}T12:00:00+05:30`,
                              ).getTime() +
                                estimatedDays * 86400000,
                            ).toISOString(),
                          )
                        : '—'
                    }
                  />
                  {sampleSplit ? (
                    <DetailRow
                      label="On a ₹1,000 sale, the shop keeps"
                      value={
                        <Money
                          value={Math.round(
                            (sampleSplit.merchantPayout / sampleSales) * 1000,
                          )}
                        />
                      }
                    />
                  ) : null}
                </div>

                {estimatedDays && (values.durationDays ?? 0) < estimatedDays ? (
                  <p className="bg-tint-amber text-amber-ink mt-3 rounded-[6px] px-3 py-2 text-[12px]">
                    At this pace the credit needs about {estimatedDays} days, longer than
                    the {values.durationDays}-day term you set.
                  </p>
                ) : null}
              </div>

              <p className="text-muted mt-3 text-[12px]">
                Consent arrives as an SMS link. Routing starts only after the merchant
                agrees and the lender disburses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
