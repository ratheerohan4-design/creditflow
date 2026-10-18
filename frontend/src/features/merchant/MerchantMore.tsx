import { NavLink, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeIndianRupee,
  FileSignature,
  Headphones,
  History,
  CreditCard,
  LogOut,
  QrCode,
  Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { useDocumentTitle } from '@/lib/hooks'
import { cn } from '@/lib/utils'
import { useSession } from '@/stores/session'

const LINKS = [
  { to: '/merchant/credit', label: 'Credit details', icon: Wallet },
  { to: '/merchant/transactions', label: 'Payments and history', icon: History },
  { to: '/merchant/log-cash-sale', label: 'Log a cash sale', icon: BadgeIndianRupee },
  { to: '/merchant/agreement', label: 'Agreement', icon: FileSignature },
  { to: '/merchant/subscription', label: 'Plan and billing', icon: CreditCard },
  { to: '/merchant/support', label: 'Support', icon: Headphones },
  { to: '/merchant/qr', label: 'QR code', icon: QrCode },
]

export function MerchantMore() {
  useDocumentTitle('More')
  const navigate = useNavigate()
  const signOut = useSession((state) => state.signOut)

  return (
    <div className="space-y-5">
      <PageHeader title="More" description="Everything else about your shop's credit" />

      <Card className="divide-line divide-y overflow-hidden">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'hover:bg-canvas flex items-center gap-3 px-4 py-3.5',
                isActive && 'bg-canvas',
              )
            }
          >
            <link.icon className="text-teal h-4 w-4" />
            <span className="text-ink flex-1 text-[13px] font-semibold">
              {link.label}
            </span>
            <ArrowRight className="text-muted h-4 w-4" />
          </NavLink>
        ))}
      </Card>

      <button
        onClick={() => {
          signOut()
          navigate('/login')
        }}
        className="border-line-strong bg-surface text-ink hover:bg-canvas flex w-full items-center justify-center gap-2 rounded-[8px] border py-3 text-[13px] font-semibold"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>

      <p className="text-muted text-center text-[12px]">
        CreditFlow routes repayments between you and your lender. It is not a lender, bank
        or wallet.
      </p>
    </div>
  )
}
