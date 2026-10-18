import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Bell, BarChart3, Home, LogOut, Menu, QrCode } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Logo } from '@/components/shared/Logo'
import { cn } from '@/lib/utils'
import { queryKeys } from '@/data/keys'
import { merchantApi } from '@/data/api'
import { useSession } from '@/stores/session'

const TABS = [
  { to: '/merchant', label: 'Home', icon: Home, end: true },
  { to: '/merchant/progress', label: 'Progress', icon: BarChart3, end: false },
  { to: '/merchant/qr', label: 'QR', icon: QrCode, end: false },
  { to: '/merchant/alerts', label: 'Alerts', icon: Bell, end: false },
  { to: '/merchant/more', label: 'More', icon: Menu, end: false },
]

export function MerchantLayout() {
  const navigate = useNavigate()
  const merchantId = useSession((state) => state.merchantId)
  const signOut = useSession((state) => state.signOut)

  const home = useQuery({
    queryKey: queryKeys.merchant.home(merchantId ?? ''),
    queryFn: () => merchantApi.getHome(merchantId ?? ''),
    enabled: Boolean(merchantId),
  })

  const unread = home.data?.unreadAlerts ?? 0

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="bg-canvas flex min-h-screen flex-col">
      <header className="print-hide border-line bg-surface sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4">
          <NavLink to="/merchant" aria-label="CreditFlow home">
            <Logo className="h-8" />
          </NavLink>
          <div className="flex items-center gap-3">
            <p className="text-muted hidden text-[13px] sm:block">
              {home.data?.merchant.name}
            </p>
            <button
              onClick={handleSignOut}
              className="text-muted hover:bg-canvas hover:text-ink inline-flex h-11 items-center gap-1.5 rounded-[6px] px-2 text-[13px] font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav
          className="border-line hidden border-t md:block"
          aria-label="Merchant sections"
        >
          <div className="mx-auto flex w-full max-w-3xl gap-1 px-4">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'relative inline-flex h-12 items-center gap-2 px-3 text-[13px] font-semibold',
                    isActive ? 'text-navy' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.label === 'Alerts' && unread > 0 ? (
                      <span className="bg-amber text-navy rounded-full px-1.5 text-[11px] font-bold tabular-nums">
                        {unread}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'absolute inset-x-2 bottom-0 h-0.5 rounded-full',
                        isActive ? 'bg-navy' : 'bg-transparent',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 md:pb-10">
        <div className="cf-fade">
          <Outlet />
        </div>
      </main>

      <nav
        className="print-hide border-line bg-surface fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Merchant sections"
      >
        <ul className="mx-auto flex w-full max-w-3xl">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
                    isActive ? 'text-navy' : 'text-muted',
                  )
                }
              >
                <span className="relative">
                  <tab.icon className="h-5 w-5" />
                  {tab.label === 'Alerts' && unread > 0 ? (
                    <span className="bg-amber text-navy absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums">
                      {unread}
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
