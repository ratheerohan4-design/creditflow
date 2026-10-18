import { useQuery } from '@tanstack/react-query'
import { Download, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QueryBoundary } from '@/components/shared/states'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDate, formatMoney } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { closureCertificate, savePdf } from '@/lib/pdf'
import { useSession } from '@/stores/session'

export function LenderCompleted() {
  useDocumentTitle('Completed')
  const lenderId = useSession((state) => state.lenderId)

  const query = useQuery({
    queryKey: queryKeys.lender.completed(lenderId ?? ''),
    queryFn: () => lenderApi.getCompleted(lenderId ?? ''),
    enabled: Boolean(lenderId),
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-navy text-[20px] font-semibold">Completed agreements</h1>
        <p className="text-muted mt-1 text-[13px]">
          Credits that were repaid in full, on time or ahead of schedule
        </p>
      </div>

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No completed credits yet',
          body: 'Agreements appear here once the full amount has been repaid.',
          icon: <Trophy className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.agreement.id}>
                <Card className="border-success/25">
                  <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-ink text-[15px] font-semibold">
                        {row.merchant.name}
                      </p>
                      <p className="text-muted text-[13px]">
                        {formatMoney(row.agreement.creditAmount)} repaid in full · started{' '}
                        {formatDate(row.agreement.startDate)} · completed{' '}
                        {formatDate(row.agreement.completedDate ?? row.agreement.endDate)}
                      </p>
                      <p className="text-muted mt-1 text-[12px] tabular-nums">
                        {row.agreement.id}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        savePdf(
                          closureCertificate(row.agreement, row.merchant, row.lender),
                          `${row.agreement.id}-certificate.pdf`,
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                      Download certificate
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  )
}
