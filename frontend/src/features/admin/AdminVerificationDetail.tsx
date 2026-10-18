import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Camera, FileText, MapPin, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DetailRow } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { formatDateTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/** A simple drawn shop front stands in for the field agent's photo in this build. */
function ShopPhoto({ index, capturedAt }: { index: number; capturedAt: string }) {
  return (
    <figure className="border-line bg-canvas overflow-hidden rounded-[8px] border">
      <svg
        viewBox="0 0 200 130"
        className="h-28 w-full"
        role="img"
        aria-label={`Shop photo ${index}`}
      >
        <rect width="200" height="130" fill="#EEF0F4" />
        <rect
          x="24"
          y="52"
          width="152"
          height="62"
          fill="#FFFFFF"
          stroke="#0D2B45"
          strokeWidth="2"
        />
        <path
          d="M18 52 L100 26 L182 52 Z"
          fill="#F5A623"
          stroke="#0D2B45"
          strokeWidth="2"
        />
        <rect
          x="44"
          y="70"
          width="34"
          height="44"
          fill="#E2EEF1"
          stroke="#0D2B45"
          strokeWidth="1.6"
        />
        <rect
          x="94"
          y="70"
          width="62"
          height="26"
          fill="#EEF0F4"
          stroke="#0D2B45"
          strokeWidth="1.6"
        />
        <path d="M94 83 h62 M114 70 v26 M136 70 v26" stroke="#0D2B45" strokeWidth="1.2" />
        <circle cx="168" cy="104" r="5" fill="#0A4A5C" />
      </svg>
      <figcaption className="text-muted flex items-center gap-1.5 px-2.5 py-2 text-[11px]">
        <Camera className="h-3.5 w-3.5" />
        Photo {index} · captured {formatDateTime(capturedAt)}
      </figcaption>
    </figure>
  )
}

export function AdminVerificationDetail() {
  const { verificationId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<'rejected' | 'more_docs' | null>(
    null,
  )

  const query = useQuery({
    queryKey: queryKeys.admin.verification(verificationId),
    queryFn: () => adminApi.getVerification(verificationId),
    enabled: Boolean(verificationId),
  })

  useDocumentTitle(
    query.data ? `${query.data.merchantName} · Verification` : 'Verification',
  )

  const review = useMutation({
    mutationFn: (input: {
      decision: 'approved' | 'rejected' | 'more_docs'
      reason?: string
    }) => adminApi.reviewVerification(verificationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  return (
    <QueryBoundary query={query}>
      {(item) => (
        <div className="space-y-5">
          <PageHeader
            title={item.merchantName}
            description={`Submitted ${formatDateTime(item.submittedAt)} by ${item.agentName}`}
            backTo="/admin/verification"
            backLabel="Verification queue"
            actions={<StatusBadge status={item.status} />}
          />

          {review.isSuccess ? (
            <AlertBanner
              tone={review.data.status === 'approved' ? 'success' : 'amber'}
              title={
                review.data.status === 'approved'
                  ? 'Verification approved'
                  : review.data.status === 'rejected'
                    ? 'Verification rejected'
                    : 'More documents requested'
              }
              body="The decision is written to the audit log."
            />
          ) : null}

          {review.isError ? (
            <AlertBanner
              tone="danger"
              title="We couldn't save that decision"
              body="Please try again. Our team has been alerted."
            />
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Camera className="text-teal h-4 w-4" />
                Shop photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: item.shopPhotos }).map((_, index) => (
                  <ShopPhoto
                    key={index}
                    index={index + 1}
                    capturedAt={item.submittedAt}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-teal h-4 w-4" />
                  Identity documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow label="Document type" value={item.idType} />
                <DetailRow
                  label="Number"
                  value={<span className="tabular-nums">{item.idNumber}</span>}
                />
                <DetailRow label="Submitted with" value="Field agent app" />
                <p className="bg-canvas text-muted mt-3 rounded-[6px] px-3 py-2 text-[12px]">
                  Full document numbers stay masked in this view.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-teal h-4 w-4" />
                  Shop location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label="Coordinates"
                  value={
                    <span className="tabular-nums">
                      {item.gps.lat.toFixed(4)}, {item.gps.lng.toFixed(4)}
                    </span>
                  }
                />
                <DetailRow label="Address" value={item.gps.address} />
                <a
                  className="text-teal mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
                  href={`https://www.google.com/maps?q=${item.gps.lat},${item.gps.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in maps
                </a>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Field agent notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-ink text-[13px] leading-relaxed">{item.agentNotes}</p>
              {item.pendingNote ? (
                <p className="bg-tint-navy text-navy mt-3 rounded-[6px] px-3 py-2 text-[12px]">
                  {item.pendingNote}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent
              className={cn(
                'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
              )}
            >
              <p className="text-muted text-[13px]">
                Approving moves the shop into the agreement pipeline.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPendingAction('more_docs')}
                  disabled={review.isPending}
                >
                  Request more documents
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingAction('rejected')}
                  disabled={review.isPending}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => review.mutate({ decision: 'approved' })}
                  disabled={review.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {review.isPending ? 'Working…' : 'Approve'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={pendingAction !== null}
            onOpenChange={(open) => !open && setPendingAction(null)}
            title={
              pendingAction === 'rejected'
                ? 'Reject this verification?'
                : 'Ask for more documents?'
            }
            description={
              pendingAction === 'rejected'
                ? `${item.merchantName} will be told the shop could not be verified. This decision is recorded.`
                : `${item.merchantName} will be asked for the missing documents. The request stays in the queue.`
            }
            confirmLabel={
              pendingAction === 'rejected' ? 'Reject verification' : 'Send request'
            }
            busy={review.isPending}
            onConfirm={(reason) => {
              if (!pendingAction) return
              review.mutate({ decision: pendingAction, reason })
              navigate(`/admin/verification/${verificationId}`, { replace: true })
            }}
          />
        </div>
      )}
    </QueryBoundary>
  )
}
