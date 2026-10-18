import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { DetailRow } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { Invoice } from '@/data/types'
import { formatDate, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

export function MerchantSubscription() {
  useDocumentTitle('Plan')
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.merchant.subscription(merchantId ?? ''),
    queryFn: () => merchantApi.getSubscription(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const renew = useMutation({
    mutationFn: () => merchantApi.renewSubscription(merchantId ?? ''),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchant'] }),
  })

  const columns: Column<Invoice>[] = [
    { key: 'period', header: 'Billing period', cell: (row) => row.period },
    { key: 'date', header: 'Date', cell: (row) => formatDate(row.date) },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatMoney(row.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <QueryBoundary query={query}>
      {({ subscription, merchant }) => (
        <div className="space-y-5">
          <PageHeader
            title="Plan"
            description="What CreditFlow charges your shop each month"
            backTo="/merchant"
            backLabel="Home"
          />

          {subscription.status === 'lapsed' ? (
            <AlertBanner
              tone="amber"
              title="Your plan has lapsed"
              body={`Renew to keep seeing repayment updates. Your QR keeps accepting payments in the meantime.`}
              action={
                <Button
                  size="sm"
                  variant="amber"
                  onClick={() => renew.mutate()}
                  disabled={renew.isPending}
                >
                  {renew.isPending
                    ? 'Renewing…'
                    : `Renew for ${formatMoney(subscription.monthlyFee)}`}
                </Button>
              }
            />
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="text-teal h-4 w-4" />
                {subscription.plan} plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted text-[13px]">Monthly fee</span>
                <span className="text-navy text-[20px] font-bold tabular-nums">
                  {formatMoney(subscription.monthlyFee)}
                </span>
              </div>
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={subscription.status === 'lapsed' ? 'lapsed' : 'active'}
                  />
                }
              />
              <DetailRow
                label={
                  subscription.status === 'lapsed' ? 'Lapsed on' : 'Next billing date'
                }
                value={formatDate(
                  subscription.status === 'lapsed'
                    ? (subscription.lapsedOn ?? subscription.nextBillingDate)
                    : subscription.nextBillingDate,
                )}
              />
              <DetailRow label="Shop" value={merchant.name} />
              {subscription.status === 'active' ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => renew.mutate()}
                    disabled={renew.isPending}
                  >
                    {renew.isPending ? 'Working…' : 'Pay early'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-navy mb-3 text-[16px] font-semibold">Invoices</h2>
            <DataTable
              label="Subscription invoices"
              columns={columns}
              rows={subscription.invoices}
              rowKey={(row) => row.id}
              dense
            />
          </div>

          <p className="text-muted text-[12px]">
            Need a hand with billing?{' '}
            <button
              className="text-teal font-semibold hover:underline"
              onClick={() => navigate('/merchant/support')}
            >
              Raise a support request
            </button>
          </p>
        </div>
      )}
    </QueryBoundary>
  )
}
