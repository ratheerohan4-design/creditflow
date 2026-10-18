import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AlertTriangle, History, LayoutDashboard, LogOut, Users } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { lenderApi } from '@/data/api'
import { queryKeys } from '@/data/keys'
import { useSession } from '@/stores/session'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

const NAV = [
  { to: '/lender', label: 'Portfolio', icon: LayoutDashboard, end: true },
  { to: '/lender/merchants', label: 'Merchants', icon: Users, end: false },
  { to: '/lender/risk', label: 'Risk alerts', icon: AlertTriangle, end: false },
  { to: '/lender/history', label: 'History', icon: History, end: false },
]

const MOBILE_NAV = [
  { to: '/lender', label: 'Portfolio', icon: LayoutDashboard, end: true },
  { to: '/lender/merchants', label: 'Merchants', icon: Users, end: false },
  { to: '/lender/risk', label: 'Risk', icon: AlertTriangle, end: false },
  { to: '/lender/history', label: 'History', icon: History, end: false },
]

export function LenderLayout() {
  const navigate = useNavigate()
  const lenderId = useSession((state) => state.lenderId)
  const name = useSession((state) => state.name)
  const signOut = useSession((state) => state.signOut)

  const portfolio = useQuery({
    queryKey: queryKeys.lender.portfolio(lenderId ?? ''),
    queryFn: () => lenderApi.getPortfolio(lenderId ?? ''),
    enabled: Boolean(lenderId),
  })

  const atRisk = portfolio.data?.atRiskCount ?? 0

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="bg-canvas min-h-screen">
      <aside className="print-hide bg-navy fixed inset-y-0 left-0 z-30 hidden w-64 flex-col text-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <NavLink to="/lender" aria-label="CreditFlow home">
            <Logo inverted className="h-8" />
          </NavLink>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Lender sections">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-[6px] px-3 text-[13px] font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-white/70 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Risk alerts' && atRisk > 0 ? (
                <span className="bg-amber text-navy rounded-full px-1.5 text-[11px] font-bold tabular-nums">
                  {atRisk}
                </span>
              ) : null}
            </NavLink>
          ))}
          <NavLink
            to="/lender/completed"
            className={({ isActive }) =>
              cn(
                'flex h-11 items-center gap-3 rounded-[6px] px-3 text-[13px] font-semibold transition-colors duration-150',
                isActive
                  ? 'bg-white/12 text-white'
                  : 'text-white/70 hover:bg-white/8 hover:text-white',
              )
            }
          >
            Completed
          </NavLink>
        </nav>
        <div className="border-t border-white/12 p-4">
          <p className="text-[13px] font-semibold text-white">{name}</p>
          <p className="text-[12px] text-white/60">{portfolio.data?.lender.name}</p>
          <button
            onClick={handleSignOut}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border border-white/25 text-[13px] font-semibold text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <header className="print-hide border-navy/20 bg-navy sticky top-0 z-30 border-b text-white lg:hidden">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <NavLink to="/lender" aria-label="CreditFlow home">
            <Logo inverted className="h-8" />
          </NavLink>
          <button
            onClick={handleSignOut}
            className="inline-flex h-11 items-center gap-1.5 rounded-[6px] px-2 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-10">
          <div className="cf-fade">
            <Outlet />
          </div>
        </div>
      </main>

      <nav
        className="print-hide border-line bg-surface fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Lender sections"
      >
        <ul className="mx-auto flex w-full max-w-3xl">
          {MOBILE_NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
                    isActive ? 'text-navy' : 'text-muted',
                  )
                }
              >
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.label === 'Risk' && atRisk > 0 ? (
                    <span className="bg-amber text-navy absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums">
                      {atRisk}
                    </span>
                  ) : null}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
