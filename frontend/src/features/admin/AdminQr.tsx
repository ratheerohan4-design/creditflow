import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Field } from '@/components/shared/Field'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import type { QrProfile } from '@/data/types'
import { formatDayMonth } from '@/lib/format'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

export function AdminQr() {
  useDocumentTitle('QR codes')
  const queryClient = useQueryClient()
  const adminName = useSession((state) => state.name)
  const [deactivating, setDeactivating] = useState<QrProfile | null>(null)
  const [reassigning, setReassigning] = useState<QrProfile | null>(null)
  const [newUpiId, setNewUpiId] = useState('')
  const [reassignReason, setReassignReason] = useState('')
  const [reassignTouched, setReassignTouched] = useState(false)

  const query = useQuery({
    queryKey: queryKeys.admin.qr(),
    queryFn: () => adminApi.getQrProfiles(),
  })

  const setStatus = useMutation({
    mutationFn: ({
      merchantId,
      status,
      reason,
    }: {
      merchantId: string
      status: QrProfile['status']
      reason?: string
    }) => adminApi.setQrStatus(merchantId, status, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })

  const reassign = useMutation({
    mutationFn: ({ merchantId, upiId }: { merchantId: string; upiId: string }) =>
      adminApi.reassignQr(merchantId, upiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      setReassigning(null)
      setNewUpiId('')
      setReassignReason('')
      setReassignTouched(false)
    },
  })

  const reasonInvalid = reassignReason.trim().length === 0

  const columns: Column<QrProfile>[] = [
    {
      key: 'qr',
      header: 'QR',
      cell: (row) => (
        <QRCodeSVG
          value={`upi://pay?pa=${row.upiId}&pn=${encodeURIComponent(row.merchantName)}&cu=INR`}
          size={44}
          bgColor="#FFFFFF"
          fgColor="#0D2B45"
          level="M"
        />
      ),
    },
    {
      key: 'merchant',
      header: 'Shop',
      cell: (row) => (
        <div>
          <p className="text-ink font-semibold">{row.merchantName}</p>
          <p className="text-muted text-[12px] tabular-nums">{row.upiId}</p>
          {row.reassignedFrom ? (
            <p className="text-muted text-[11px]">reassigned from {row.reassignedFrom}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'generated',
      header: 'Generated',
      cell: (row) => formatDayMonth(`${row.generatedOn}T12:00:00+05:30`),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'active' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={setStatus.isPending}
              onClick={() => setDeactivating(row)}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={setStatus.isPending}
              onClick={() =>
                setStatus.mutate({ merchantId: row.merchantId, status: 'active' })
              }
            >
              Activate
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setReassigning(row)
              setNewUpiId(row.upiId)
            }}
          >
            Reassign
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="QR codes"
        description="Each shop's payment QR and where it points"
      />

      {setStatus.isError || reassign.isError ? (
        <AlertBanner
          tone="danger"
          title="We couldn't save that change"
          body="Nothing was changed. Please try again."
        />
      ) : null}

      <QueryBoundary
        query={query}
        isEmpty={(rows) => rows.length === 0}
        empty={{
          title: 'No QR codes yet',
          body: 'QR codes are generated when a shop is onboarded.',
          icon: <QrCode className="h-6 w-6" />,
        }}
      >
        {(rows) => (
          <DataTable
            label="QR codes"
            columns={columns}
            rows={rows}
            rowKey={(row) => row.merchantId}
          />
        )}
      </QueryBoundary>

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Deactivate this QR?"
        description={
          deactivating
            ? `${deactivating.merchantName} will stop receiving payments until it is activated again. Existing repayments are not affected.`
            : ''
        }
        confirmLabel="Deactivate QR"
        busy={setStatus.isPending}
        onConfirm={(reason) => {
          if (!deactivating) return
          setStatus.mutate({
            merchantId: deactivating.merchantId,
            status: 'inactive',
            reason,
          })
        }}
      />

      <Dialog
        open={reassigning !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReassigning(null)
            setReassignTouched(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign QR code</DialogTitle>
            <DialogDescription>
              {reassigning
                ? `${reassigning.merchantName} currently uses ${reassigning.upiId}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field
              id="upi"
              label="New UPI ID"
              required
              error={
                reassignTouched && !/^[\w.-]{3,}@[a-zA-Z]{2,}$/.test(newUpiId)
                  ? 'Enter a valid UPI ID, for example shopname@ybl'
                  : undefined
              }
            >
              <Input
                id="upi"
                value={newUpiId}
                onChange={(event) => setNewUpiId(event.target.value)}
                placeholder="shopname@ybl"
              />
            </Field>
            <Field
              id="reassign-reason"
              label="Reason"
              required
              error={
                reassignTouched && reasonInvalid ? 'A reason is required' : undefined
              }
              hint="Recorded in the audit log as the acting operator."
            >
              <Input
                id="reassign-reason"
                value={reassignReason}
                onChange={(event) => setReassignReason(event.target.value)}
                placeholder={`For example: old UPI closed by ${adminName.split(' ')[0]}`}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassigning(null)}>
              Cancel
            </Button>
            <Button
              disabled={reassign.isPending}
              onClick={() => {
                setReassignTouched(true)
                if (
                  !reassigning ||
                  reasonInvalid ||
                  !/^[\w.-]{3,}@[a-zA-Z]{2,}$/.test(newUpiId)
                ) {
                  return
                }
                reassign.mutate({ merchantId: reassigning.merchantId, upiId: newUpiId })
              }}
            >
              {reassign.isPending ? 'Saving…' : 'Save new UPI ID'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
