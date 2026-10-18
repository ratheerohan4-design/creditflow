import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BadgePercent,
  FileSignature,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ShieldAlert,
  ClipboardCheck,
  Users,
  X,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { useSession } from '@/stores/session'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  section: string
}

const NAV: NavItem[] = [
  {
    to: '/admin',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true,
    section: 'Operations',
  },
  { to: '/admin/leads', label: 'Leads', icon: Users, section: 'Operations' },
  {
    to: '/admin/verification',
    label: 'Verification queue',
    icon: ClipboardCheck,
    section: 'Operations',
  },
  {
    to: '/admin/agreement-new',
    label: 'New agreement',
    icon: FileSignature,
    section: 'Operations',
  },
  { to: '/admin/qr', label: 'QR codes', icon: QrCode, section: 'Money' },
  { to: '/admin/overrides', label: 'Overrides', icon: ShieldAlert, section: 'Money' },
  { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, section: 'Money' },
  { to: '/admin/fees', label: 'Fees', icon: BadgePercent, section: 'Money' },
  { to: '/admin/risk', label: 'Risk flags', icon: ShieldAlert, section: 'Records' },
  { to: '/admin/audit', label: 'Audit log', icon: History, section: 'Records' },
]

const SECTIONS = ['Operations', 'Money', 'Records']

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav
      className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
      aria-label="Admin sections"
    >
      {SECTIONS.map((section) => (
        <div key={section}>
          <p className="text-muted px-3 pb-1.5 text-[11px] font-semibold tracking-wide uppercase">
            {section}
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((item) => item.section === section).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 rounded-[6px] px-3 text-[13px] font-semibold transition-colors duration-150',
                      isActive
                        ? 'bg-tint-navy text-navy'
                        : 'text-muted hover:bg-canvas hover:text-ink',
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const name = useSession((state) => state.name)
  const signOut = useSession((state) => state.signOut)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleSignOut() {
    signOut()
    navigate('/login')
  }

  return (
    <div className="bg-canvas min-h-screen">
      <aside className="print-hide border-line bg-surface fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="border-line flex h-16 items-center border-b px-5">
          <NavLink to="/admin" aria-label="CreditFlow home">
            <Logo className="h-8" />
          </NavLink>
        </div>
        <NavList />
        <div className="border-line border-t p-4">
          <p className="text-ink text-[13px] font-semibold">{name}</p>
          <p className="text-muted text-[12px]">Operations team</p>
          <button
            onClick={handleSignOut}
            className="border-line-strong text-ink hover:bg-canvas mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border text-[13px] font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {drawerOpen ? (
        <div className="print-hide fixed inset-0 z-50 lg:hidden">
          <button
            className="bg-navy/45 absolute inset-0"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="cf-fade bg-surface absolute inset-y-0 left-0 flex w-72 flex-col shadow-[0_0_40px_rgba(13,43,69,0.2)]">
            <div className="border-line flex h-16 items-center justify-between border-b px-5">
              <Logo className="h-8" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:bg-canvas hover:text-ink rounded-[6px] p-2"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <header className="print-hide border-line bg-surface sticky top-0 z-30 border-b lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="border-line text-ink inline-flex h-11 w-11 items-center justify-center rounded-[6px] border"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="h-8" />
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
          <div className="cf-fade">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
