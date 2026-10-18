import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailRow } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDate, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { agreementPdf, savePdf } from '@/lib/pdf'
import { useSession } from '@/stores/session'

export function MerchantCredit() {
  useDocumentTitle('Credit details')
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)

  const query = useQuery({
    queryKey: queryKeys.merchant.agreement(merchantId ?? ''),
    queryFn: () => merchantApi.getAgreement(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  return (
    <QueryBoundary query={query}>
      {({ merchant, agreement, lender }) => {
        const percent =
          ((agreement.creditAmount - agreement.outstanding) / agreement.creditAmount) *
          100
        return (
          <div className="space-y-5">
            <PageHeader
              title="Credit details"
              description="The credit your lender gave you, in plain words"
              backTo="/merchant"
              backLabel="Home"
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    savePdf(
                      agreementPdf(agreement, merchant, lender),
                      `${agreement.id}.pdf`,
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Download agreement PDF
                </Button>
              }
            />

            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-muted text-[13px]">Amount you still owe</p>
                    <Money value={agreement.outstanding} emphasis="large" />
                  </div>
                  <StatusBadge status={agreement.paused ? 'paused' : 'on_track'} />
                </div>
                <div className="mt-4">
                  <ProgressBar
                    percent={percent}
                    label="Repaid so far"
                    caption={`${formatMoney(agreement.creditAmount - agreement.outstanding)} of ${formatMoney(agreement.creditAmount)}`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Your lender</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow label="Lender" value={lender.name} />
                <DetailRow label="Contact person" value={lender.contactPerson} />
                <DetailRow
                  label="Credit given"
                  value={<Money value={agreement.creditAmount} />}
                />
                <DetailRow label="Start date" value={formatDate(agreement.startDate)} />
                <DetailRow
                  label="Target completion"
                  value={formatDate(agreement.endDate)}
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
              </CardContent>
            </Card>

            <button
              onClick={() => navigate('/merchant/agreement')}
              className="border-line bg-surface hover:bg-canvas flex w-full items-center justify-between rounded-[8px] border px-4 py-3 text-left"
            >
              <span className="text-ink text-[13px] font-semibold">
                Read the full agreement and consent details
              </span>
              <ArrowRight className="text-muted h-4 w-4" />
            </button>
          </div>
        )
      }}
    </QueryBoundary>
  )
}
