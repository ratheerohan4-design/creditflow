import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Download, Printer, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { PageHeader } from '@/components/shared/PageHeader'
import { QueryBoundary } from '@/components/shared/states'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { merchantApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'
import { downloadFile } from '@/lib/downloads'

export function MerchantQr() {
  useDocumentTitle('QR code')
  const merchantId = useSession((state) => state.merchantId)
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const query = useQuery({
    queryKey: queryKeys.merchant.profile(merchantId ?? ''),
    queryFn: () => merchantApi.getProfile(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  function upiUrl(upiId: string, name: string) {
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`
  }

  async function copyUpi(upiId: string) {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function downloadQr(name: string) {
    const node = printRef.current?.querySelector('svg')
    if (!node) return
    const svg = node.outerHTML
    const source = `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
    downloadFile(
      `creditflow-qr-${name.toLowerCase().replace(/\s+/g, '-')}.svg`,
      'image/svg+xml',
      source,
    )
  }

  function shareQr(upiId: string, name: string) {
    const text = `Pay ${name} on UPI: ${upiId}`
    if (navigator.share) {
      void navigator.share({ title: `${name} QR code`, text }).catch(() => undefined)
    } else {
      void copyUpi(upiId)
    }
  }

  return (
    <QueryBoundary query={query}>
      {(merchant) => (
        <div className="space-y-5">
          <PageHeader
            title="QR code"
            description="Paste this at the counter. Every payment starts repaying your credit."
            backTo="/merchant"
            backLabel="Home"
          />

          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <div className="flex items-center gap-2">
                <StatusBadge status="active" />
                <span className="text-muted text-[12px]">Accepting payments</span>
              </div>

              <div
                ref={printRef}
                className="border-line print-area mt-5 rounded-[8px] border bg-white p-4"
              >
                <QRCodeSVG
                  value={upiUrl(merchant.upiId, merchant.name)}
                  size={224}
                  bgColor="#FFFFFF"
                  fgColor="#0D2B45"
                  level="M"
                  marginSize={2}
                />
              </div>

              <p className="text-navy mt-4 text-[16px] font-semibold">{merchant.name}</p>
              <button
                onClick={() => copyUpi(merchant.upiId)}
                className="text-teal hover:bg-canvas mt-1 inline-flex items-center gap-2 rounded-[6px] px-2 py-1 text-[14px] font-semibold tabular-nums"
              >
                {merchant.upiId}
                {copied ? (
                  <Check className="text-success h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              {copied ? (
                <p className="text-success-ink text-[12px]">UPI ID copied</p>
              ) : null}

              <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" onClick={() => downloadQr(merchant.name)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareQr(merchant.upiId, merchant.name)}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </CardContent>
          </Card>

          <AlertBanner
            tone="info"
            title="How the split works"
            body="Customers pay any amount. Your share reaches you instantly, and the agreed percentage goes to your lender the same day."
          />

          <p className="text-muted text-center text-[12px]">
            Your QR keeps working even if your subscription plan lapses.
          </p>
        </div>
      )}
    </QueryBoundary>
  )
}
