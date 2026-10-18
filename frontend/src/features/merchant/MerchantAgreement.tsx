import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DetailRow } from '@/components/shared/Field'
import { Money } from '@/components/shared/Money'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDate, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { agreementPdf, closureCertificate, savePdf } from '@/lib/pdf'
import { useSession } from '@/stores/session'

export function MerchantAgreement() {
  useDocumentTitle('Agreement')
  const merchantId = useSession((state) => state.merchantId)

  const query = useQuery({
    queryKey: queryKeys.merchant.agreement(merchantId ?? ''),
    queryFn: () => merchantApi.getAgreement(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  return (
    <QueryBoundary query={query}>
      {({ merchant, agreement, lender }) => (
        <div className="space-y-5">
          <PageHeader
            title="Agreement"
            description="What you and your lender agreed to"
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
                Download PDF
              </Button>
            }
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Agreement ID"
                value={<span className="tabular-nums">{agreement.id}</span>}
              />
              <DetailRow
                label="Merchant"
                value={`${merchant.name} (${merchant.ownerName})`}
              />
              <DetailRow label="Shop" value={`${merchant.city}, ${merchant.state}`} />
              <DetailRow
                label="Lender"
                value={`${lender.name} (${lender.contactPerson})`}
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
                label="Repayment rate"
                value={`${Math.round(agreement.rate * 100)}% of each sale`}
              />
              <DetailRow
                label="Minimum daily repayment"
                value={<Money value={agreement.minDailyFloor} />}
              />
              <DetailRow label="Grace days" value={`${agreement.graceDays} days`} />
              <DetailRow
                label="Disbursed on"
                value={formatDate(agreement.disbursedDate)}
              />
              <DetailRow
                label="Target completion"
                value={formatDate(agreement.endDate)}
              />
              <DetailRow
                label="Amount you still owe"
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

          {agreement.outstanding <= 0 ? (
            <Card className="border-success/25 bg-tint-success">
              <CardContent className="p-5">
                <p className="text-success-ink text-sm font-semibold">
                  This credit is fully repaid
                </p>
                <p className="text-success-ink/85 mt-1 text-[13px]">
                  Completed on {formatDate(agreement.completedDate ?? agreement.endDate)}.
                  Your closure certificate is ready.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    savePdf(
                      closureCertificate(agreement, merchant, lender),
                      `${agreement.id}-certificate.pdf`,
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Download certificate
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <p className="text-muted text-[12px]">
            Total repaid so far:{' '}
            {formatMoney(agreement.creditAmount - agreement.outstanding)}
          </p>
        </div>
      )}
    </QueryBoundary>
  )
}
