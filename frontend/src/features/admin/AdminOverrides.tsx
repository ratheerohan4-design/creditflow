import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { agreements, merchants } from '@/data/seed'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'

const OVERRIDE_TYPES = [
  {
    value: 'adjust_balance',
    label: 'Adjust balance',
    valueHint: 'Rupees to reduce the balance by',
  },
  {
    value: 'extend_period',
    label: 'Extend repayment period',
    valueHint: 'Extra days to add',
  },
  { value: 'grace_extension', label: 'Extend grace days', valueHint: 'Extra grace days' },
  { value: 'pause_routing', label: 'Pause routing', valueHint: '' },
  { value: 'force_close', label: 'Force close agreement', valueHint: '' },
]

const overrideSchema = z.object({
  agreementId: z.string().min(1, 'Pick an agreement'),
  type: z.string().min(1),
  value: z.string().optional(),
})

type OverrideForm = z.infer<typeof overrideSchema>

export function AdminOverrides() {
  useDocumentTitle('Overrides')
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<OverrideForm>({
    resolver: zodResolver(overrideSchema),
    defaultValues: { agreementId: '', type: 'adjust_balance', value: '' },
  })

  const auditQuery = useQuery({
    queryKey: queryKeys.admin.audit('overrides'),
    queryFn: () => adminApi.getAuditLog({ action: 'Override applied' }),
  })

  const apply = useMutation({
    mutationFn: (input: {
      agreementId: string
      type: string
      value: string
      reason: string
    }) => adminApi.applyOverride(input),
    onSuccess: (agreement) => {
      setSuccess(agreement.id)
      queryClient.invalidateQueries({ queryKey: ['admin'] })
    },
  })

  const type = form.watch('type')
  const agreementId = form.watch('agreementId')
  const agreement = agreements.find((a) => a.id === agreementId)
  const needsValue = Boolean(OVERRIDE_TYPES.find((t) => t.value === type)?.valueHint)
  const valueInvalid =
    needsValue && (!form.watch('value') || Number(form.watch('value')) <= 0)

  function submit() {
    if (valueInvalid) return
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Overrides"
        description="Manual corrections to a live agreement. Every override needs a reason."
      />

      {success ? (
        <AlertBanner
          tone="success"
          title={`Override applied to ${success}`}
          body="The change is live and written to the audit log."
          action={
            <Button size="sm" variant="ghost" onClick={() => setSuccess(null)}>
              Dismiss
            </Button>
          }
        />
      ) : null}

      {apply.isError ? (
        <AlertBanner
          tone="danger"
          title="We couldn't apply that override"
          body="Nothing was changed. Please try again."
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Apply an override</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
              <Field
                id="agreementId"
                label="Agreement"
                required
                error={form.formState.errors.agreementId?.message}
              >
                <Select
                  value={agreementId}
                  onValueChange={(value) =>
                    form.setValue('agreementId', value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="agreementId">
                    <SelectValue placeholder="Pick an agreement" />
                  </SelectTrigger>
                  <SelectContent>
                    {agreements.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.id} · {merchants.find((m) => m.id === a.merchantId)?.name} ·{' '}
                        {formatMoney(a.outstanding)} outstanding
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <fieldset>
                <legend className="text-ink mb-2 text-[13px] font-semibold">
                  Override type
                </legend>
                <RadioGroup
                  value={type}
                  onValueChange={(value) => form.setValue('type', value)}
                  className="gap-2.5"
                >
                  {OVERRIDE_TYPES.map((option) => (
                    <label
                      key={option.value}
                      className="text-ink flex cursor-pointer items-center gap-2.5 text-[13px]"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      {option.label}
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>

              {needsValue ? (
                <Field
                  id="override-value"
                  label={
                    OVERRIDE_TYPES.find((t) => t.value === type)?.valueHint ?? 'Value'
                  }
                  required
                  error={valueInvalid ? 'Enter a value greater than zero' : undefined}
                >
                  <Input
                    id="override-value"
                    inputMode="numeric"
                    {...form.register('value')}
                  />
                </Field>
              ) : null}

              {agreement ? (
                <p className="bg-canvas text-muted rounded-[6px] px-3 py-2 text-[12px]">
                  {agreement.id} currently shows {formatMoney(agreement.outstanding)}{' '}
                  outstanding, grace of {agreement.graceDays} days, target completion{' '}
                  {formatDateTime(agreement.endDate).split(',')[0]}.
                </p>
              ) : null}

              <Button type="submit" disabled={valueInvalid || !agreementId}>
                Review and apply
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="text-teal h-4 w-4" />
              Recent overrides
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(auditQuery.data ?? []).length === 0 ? (
              <p className="text-muted py-8 text-center text-[13px]">
                No overrides recorded yet.
              </p>
            ) : (
              <ul className="divide-line divide-y">
                {(auditQuery.data ?? []).slice(0, 8).map((entry) => (
                  <li key={entry.id} className="py-3">
                    <p className="text-ink text-[13px] font-semibold">{entry.target}</p>
                    <p className="text-muted text-[12px]">{entry.detail}</p>
                    <p className="text-muted mt-0.5 text-[11px] tabular-nums">
                      {formatDateTime(entry.at)} · {entry.actor}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Apply this override?"
        description={
          agreement
            ? `${OVERRIDE_TYPES.find((t) => t.value === type)?.label} on ${agreement.id}. This changes what the merchant and lender see immediately.`
            : 'This changes what the merchant and lender see immediately.'
        }
        confirmLabel="Apply override"
        busy={apply.isPending}
        onConfirm={(reason) => {
          const values = form.getValues()
          apply.mutate({
            agreementId: values.agreementId,
            type: values.type,
            value: values.value ?? '',
            reason,
          })
        }}
      />
    </div>
  )
}
