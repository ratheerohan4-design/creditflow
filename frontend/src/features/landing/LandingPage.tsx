import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  Landmark,
  Lock,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/Logo'
import { useDocumentTitle } from '@/lib/hooks'
import { useSession } from '@/stores/session'

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For merchants', href: '#merchant' },
  { label: 'For lenders', href: '#lender' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '#faq' },
]

const STEPS = [
  {
    icon: Smartphone,
    title: 'Sign up with the shop’s own number',
    body: 'The number that already receives UPI money is the identity. One code, no forms at the counter, no new hardware.',
    detail: '2 minutes · OTP verified',
  },
  {
    icon: ReceiptText,
    title: 'Agree one split, once',
    body: 'Lender and shop settle a share of daily sales, a repayment cap and a tenure. Operations records it — both sides see the same document.',
    detail: 'One agreement · Both portals',
  },
  {
    icon: Zap,
    title: 'Every sale pays the credit down',
    body: 'Collections split at settlement. The lender’s share goes to the loan, the rest stays with the shop, and the ledger updates itself.',
    detail: 'Automatic · Daily',
  },
]

const PORTALS = [
  {
    role: 'merchant',
    icon: Store,
    label: 'Merchant',
    title: 'The shop',
    body: 'Sees today’s collections, how much of the credit is left, and exactly when the next auto-split runs.',
    points: ['Sales + repayment pace', 'QR profile and alerts', 'Log a cash sale'],
    accent: 'text-teal',
    tint: 'bg-tint-teal',
  },
  {
    role: 'lender',
    icon: Truck,
    label: 'Lender',
    title: 'The lender',
    body: 'A live portfolio instead of month-end statements: pace against plan, risk flags and every repayment.',
    points: ['Portfolio health', 'Merchant-level pace', 'Risk and history'],
    accent: 'text-navy',
    tint: 'bg-tint-navy',
  },
  {
    role: 'admin',
    icon: ShieldCheck,
    label: 'Operations',
    title: 'The desk',
    body: 'Onboarding, KYC, QR issuance, disputes and fees — with an audit trail behind every decision.',
    points: ['Verification queue', 'Overrides and fees', 'Full audit log'],
    accent: 'text-amber-ink',
    tint: 'bg-tint-amber',
  },
] as const

const SHOP_POINTS = [
  'No collateral, no guarantor, no new QR stand',
  'The repayment comes out of money the shop already collected',
  'Grace days and a pause control when a week is slow',
  'Nothing hidden: every rupee split is itemised',
]

const LENDER_POINTS = [
  'Collections arrive daily instead of monthly',
  'One agreement defines the share, cap and tenure',
  'Early warning when pace falls behind plan',
  'Audited trail for every override and adjustment',
]

const SECURITY = [
  {
    icon: Lock,
    title: 'Split at settlement',
    body: 'The lender’s share is carved out before the shop’s balance is credited, so repayment never depends on a follow-up call.',
  },
  {
    icon: BadgeCheck,
    title: 'Consent first',
    body: 'KYC, bank proof and QR ownership are verified before an agreement can be created — not after money moves.',
  },
  {
    icon: Clock,
    title: 'Immutable trail',
    body: 'Every override, fee waiver and dispute resolution writes an audit entry with actor, time and reason.',
  },
  {
    icon: Wallet,
    title: 'Transparent fees',
    body: 'Fees are a single, published line item on the agreement. No penalty surprises buried in the schedule.',
  },
]

const FAQS = [
  {
    q: 'Is CreditFlow a lender or a wallet?',
    a: 'Neither. CreditFlow is the repayment rail between a shop and its lender. The lender funds the credit; CreditFlow routes a pre-agreed share of each UPI settlement back to them and keeps both sides in the same ledger.',
  },
  {
    q: 'Does the shop need a new QR code?',
    a: 'No. The demo uses the shop’s existing UPI QR. Operations can issue a new or replacement QR where a lender needs ownership proof, and the old one is reassigned rather than deleted.',
  },
  {
    q: 'What happens on a day with no sales?',
    a: 'The agreement moves into a grace window and shows up on the lender’s risk tab. The shop can pause the agreement, and a cash sale can be logged manually so the record stays complete.',
  },
  {
    q: 'Is this connected to real money or Truecaller?',
    a: 'Not in this build. Every number on the portals is mock data seeded in the browser. Sign-in runs a real client-side OTP check, but the code is shown on screen (demo mode). Truecaller one-tap needs the native app or a partner key — the web build falls back to SMS automatically.',
  },
  {
    q: 'How do I try the three portals?',
    a: 'Open the demo, enter any 10-digit mobile number, read the demo code on the next screen, and pick Merchant, Lender or Operations. There is a “Reset demo data” action on the sign-in page whenever you want a clean slate.',
  },
]

function BrandNav() {
  const role = useSession((state) => state.role)
  const home = role === 'merchant' ? '/merchant' : role === 'lender' ? '/lender' : '/admin'

  return (
    <header className="border-line/80 bg-canvas/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1140px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="shrink-0" aria-label="CreditFlow home">
          <Logo className="h-8" />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted hover:text-navy text-[13px] font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to={role ? home : '/login'}>{role ? 'Dashboard' : 'Sign in'}</Link>
          </Button>
          <Button asChild variant="amber" size="sm">
            <Link to="/login">
              Open demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function SplitCard() {
  return (
    <div className="relative">
      <div className="border-line bg-surface rounded-[10px] border p-5 shadow-[0_18px_50px_-32px_rgba(13,43,69,0.55)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted text-[11px] font-semibold tracking-[0.12em] uppercase">
              Today’s collections
            </p>
            <p className="text-navy mt-1 text-[30px] leading-none font-semibold tabular-nums">
              ₹42,180
            </p>
          </div>
          <span className="bg-tint-success text-success-ink inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold">
            <TrendingUp className="h-3 w-3" />
            +8.4%
          </span>
        </div>

        <div className="mt-5">
          <div className="text-muted flex items-center justify-between text-[11px] font-medium">
            <span>Split at settlement</span>
            <span>1,236 payments</span>
          </div>
          <div className="bg-tint-neutral mt-2 flex h-2.5 overflow-hidden rounded-full">
            <div className="bg-teal w-[26%] rounded-l-full" />
            <div className="bg-navy w-[74%]" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-teal font-semibold">26% → lender</span>
            <span className="text-navy font-semibold">74% → shop</span>
          </div>
        </div>

        <div className="border-line mt-5 space-y-3 border-t pt-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink flex items-center gap-2 font-medium">
              <span className="bg-tint-teal text-teal flex h-6 w-6 items-center justify-center rounded-[5px]">
                <Truck className="h-3.5 w-3.5" />
              </span>
              Mahalaxmi Traders
            </span>
            <span className="text-navy font-semibold tabular-nums">+₹10,966</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-ink flex items-center gap-2 font-medium">
              <span className="bg-tint-navy text-navy flex h-6 w-6 items-center justify-center rounded-[5px]">
                <Store className="h-3.5 w-3.5" />
              </span>
              Sharma General Store
            </span>
            <span className="text-navy font-semibold tabular-nums">+₹31,214</span>
          </div>
        </div>
      </div>

      <div className="border-line bg-surface mt-3 rounded-[10px] border p-4 shadow-[0_14px_36px_-30px_rgba(13,43,69,0.5)]">
        <div className="flex items-center justify-between">
          <p className="text-muted text-[11px] font-semibold tracking-[0.12em] uppercase">
            Agreement · AG-1042
          </p>
          <span className="bg-tint-amber text-amber-ink rounded-full px-2 py-0.5 text-[10px] font-semibold">
            On pace
          </span>
        </div>
        <p className="text-ink mt-2 text-[13px] font-semibold">
          ₹46,000 of ₹75,000 repaid
        </p>
        <div className="bg-tint-neutral mt-2 h-2 overflow-hidden rounded-full">
          <div className="bg-amber h-full w-[61%] rounded-full" />
        </div>
        <p className="text-muted mt-2 text-[11px]">
          Next auto-split in 4 min · 38 days left
        </p>
      </div>

      <div className="border-line bg-surface absolute -top-4 -right-3 hidden items-center gap-2 rounded-full border px-3 py-1.5 shadow-[0_10px_24px_-16px_rgba(13,43,69,0.6)] sm:flex">
        <span className="bg-tint-success text-success flex h-5 w-5 items-center justify-center rounded-full">
          <Check className="h-3 w-3" />
        </span>
        <span className="text-ink text-[11px] font-semibold">₹1,240 received · split done</span>
      </div>
    </div>
  )
}

export function LandingPage() {
  useDocumentTitle('Supplier credit that repays itself')

  return (
    <div className="bg-canvas min-h-screen">
      <BrandNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px]"
            style={{
              background:
                'radial-gradient(600px 300px at 20% 40%, rgba(10,74,92,0.10), transparent 70%), radial-gradient(520px 260px at 80% 10%, rgba(245,166,35,0.14), transparent 70%)',
            }}
          />
          <div className="relative mx-auto grid w-full max-w-[1140px] items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <span className="border-line bg-surface text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide">
                <Sparkles className="text-amber h-3.5 w-3.5" />
                Built for the shop-floor, not the boardroom
              </span>
              <h1 className="text-navy mt-5 text-[34px] leading-[1.08] font-semibold tracking-[-0.02em] sm:text-[46px] lg:text-[54px]">
                Supplier credit
                <br />
                that repays itself.
              </h1>
              <p className="text-muted mt-5 max-w-[520px] text-[15px] leading-relaxed sm:text-[16px]">
                A shop takes stock on credit today. Every UPI sale from then on splits
                automatically — the lender’s share goes to the loan, the rest stays in the
                till. No chasing, no collection calls, no new hardware.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild variant="amber" size="lg">
                  <Link to="/login">
                    Try the live demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <ul className="text-muted mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
                {['Works on the existing QR', 'No collateral', 'Three portals, one ledger'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="text-success h-3.5 w-3.5" />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="mx-auto w-full max-w-[420px] lg:max-w-none">
              <SplitCard />
            </div>
          </div>
        </section>

        {/* Facts strip */}
        <section className="border-line bg-surface border-y">
          <div className="mx-auto grid w-full max-w-[1140px] grid-cols-2 gap-y-6 px-5 py-7 sm:px-8 lg:grid-cols-4">
            {[
              { value: '1 QR', label: 'No new collection point' },
              { value: 'Daily', label: 'Split runs with settlement' },
              { value: '3 portals', label: 'Shop, lender and operations' },
              { value: '100%', label: 'Of actions leave an audit entry' },
            ].map((stat) => (
              <div key={stat.label} className="lg:border-line lg:border-r lg:last:border-0">
                <p className="text-navy text-[20px] font-semibold tracking-tight">{stat.value}</p>
                <p className="text-muted mt-0.5 text-[12px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-[1140px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="max-w-[620px]">
              <p className="text-teal text-[11px] font-semibold tracking-[0.16em] uppercase">
                How it works
              </p>
              <h2 className="text-navy mt-3 text-[26px] leading-tight font-semibold sm:text-[34px]">
                Three steps. Then it runs in the background.
              </h2>
              <p className="text-muted mt-3 text-[14px]">
                The whole product is one loop: a sale arrives, a share leaves, a balance
                falls. Everything else exists to make that loop trustworthy.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="border-line bg-surface rounded-[10px] border p-6 transition-shadow duration-200 hover:shadow-[0_18px_40px_-32px_rgba(13,43,69,0.5)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-tint-navy text-navy flex h-10 w-10 items-center justify-center rounded-[8px]">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="text-line-strong text-[28px] leading-none font-semibold tabular-nums">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-ink mt-4 text-[15px] font-semibold">{step.title}</h3>
                  <p className="text-muted mt-2 text-[13px] leading-relaxed">{step.body}</p>
                  <p className="text-teal mt-4 text-[11px] font-semibold tracking-wide uppercase">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Portals */}
        <section className="bg-surface border-line border-y">
          <div className="mx-auto w-full max-w-[1140px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[560px]">
                <p className="text-teal text-[11px] font-semibold tracking-[0.16em] uppercase">
                  One app, three views
                </p>
                <h2 className="text-navy mt-3 text-[26px] leading-tight font-semibold sm:text-[34px]">
                  Everyone sees the same numbers.
                </h2>
                <p className="text-muted mt-3 text-[14px]">
                  A merchant, a lender and an operations desk open the same agreement and
                  the same ledger. No reconciliation meetings, no mismatched statements.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/login">
                  Open the demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {PORTALS.map((portal) => (
                <div
                  key={portal.role}
                  className="border-line bg-canvas flex flex-col rounded-[10px] border p-6"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${portal.tint} ${portal.accent} flex h-9 w-9 items-center justify-center rounded-[7px]`}
                    >
                      <portal.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-ink text-[13px] font-semibold">{portal.label}</p>
                      <p className="text-muted text-[11px]">{portal.title}</p>
                    </div>
                  </div>
                  <p className="text-muted mt-4 flex-1 text-[13px] leading-relaxed">{portal.body}</p>
                  <ul className="mt-4 space-y-2">
                    {portal.points.map((point) => (
                      <li key={point} className="text-ink flex items-center gap-2 text-[12px]">
                        <Check className="text-success h-3.5 w-3.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/login"
                    className="text-teal mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold hover:underline"
                  >
                    Open {portal.label.toLowerCase()} portal
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two sides */}
        <section className="mx-auto w-full max-w-[1140px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <div
              id="merchant"
              className="border-line bg-surface scroll-mt-20 rounded-[10px] border p-7"
            >
              <span className="bg-tint-teal text-teal inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                <Store className="h-3.5 w-3.5" />
                For the shop
              </span>
              <h3 className="text-navy mt-4 text-[20px] font-semibold">
                Stock now, pay from what you already sell
              </h3>
              <p className="text-muted mt-2 text-[13px] leading-relaxed">
                The shop never writes a cheque. A slice of every sale settles the credit
                before the money reaches the till, so a good week pays faster automatically.
              </p>
              <ul className="mt-5 space-y-3">
                {SHOP_POINTS.map((point) => (
                  <li key={point} className="text-ink flex gap-2.5 text-[13px]">
                    <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="lender"
              className="border-line bg-surface scroll-mt-20 rounded-[10px] border p-7"
            >
              <span className="bg-tint-navy text-navy inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                <Landmark className="h-3.5 w-3.5" />
                For the lender
              </span>
              <h3 className="text-navy mt-4 text-[20px] font-semibold">
                Daily collections instead of month-end hope
              </h3>
              <p className="text-muted mt-2 text-[13px] leading-relaxed">
                Repayment is a stream, not an event. The lender watches pace against plan,
                gets flagged the day a shop falls behind, and sees why in the same screen.
              </p>
              <ul className="mt-5 space-y-3">
                {LENDER_POINTS.map((point) => (
                  <li key={point} className="text-ink flex gap-2.5 text-[13px]">
                    <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="bg-navy scroll-mt-20 text-white">
          <div className="mx-auto w-full max-w-[1140px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="max-w-[620px]">
              <p className="text-amber text-[11px] font-semibold tracking-[0.16em] uppercase">
                Trust, by construction
              </p>
              <h2 className="mt-3 text-[26px] leading-tight font-semibold sm:text-[34px]">
                Money that moves without a phone call needs proof behind it.
              </h2>
              <p className="mt-3 text-[14px] text-white/70">
                Four rules shape every screen: the split is structural, consent comes first,
                every action is logged, and fees are readable by a shopkeeper.
              </p>
            </div>

            <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {SECURITY.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-white/10 text-white">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold">{item.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/65">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3 rounded-[10px] border border-white/15 bg-white/5 p-5">
              <QrCode className="text-amber h-5 w-5 shrink-0" />
              <p className="flex-1 text-[13px] text-white/80">
                <span className="font-semibold text-white">Demo build.</span> All portals run
                on in-browser mock data — no live money, no bank connection. Reset it any time
                from the sign-in screen.
              </p>
              <Button asChild variant="amber" size="sm">
                <Link to="/login">Take a look</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto w-full max-w-[900px] scroll-mt-20 px-5 py-16 sm:px-8 lg:py-24">
          <div className="text-center">
            <p className="text-teal text-[11px] font-semibold tracking-[0.16em] uppercase">FAQ</p>
            <h2 className="text-navy mt-3 text-[26px] leading-tight font-semibold sm:text-[34px]">
              Questions judges usually ask
            </h2>
          </div>

          <div className="border-line bg-surface mt-9 divide-y divide-line overflow-hidden rounded-[10px] border">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="text-muted h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="text-muted -mt-1 px-5 pb-5 text-[13px] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-[1140px] px-5 pb-16 sm:px-8 lg:pb-24">
          <div className="border-line bg-surface flex flex-col items-start gap-6 rounded-[12px] border p-7 sm:flex-row sm:items-center sm:justify-between lg:p-10">
            <div>
              <h2 className="text-navy text-[22px] leading-tight font-semibold sm:text-[26px]">
                Open a portal and watch a sale split.
              </h2>
              <p className="text-muted mt-2 max-w-[520px] text-[13px]">
                Merchant, lender and operations are all live. Use any mobile number, then the
                demo code shown on screen.
              </p>
            </div>
            <Button asChild variant="amber" size="lg" className="shrink-0">
              <Link to="/login">
                Enter the demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-line bg-surface border-t">
        <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-6 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Logo className="h-7" />
            <p className="text-muted mt-2 max-w-[420px] text-[12px]">
              CreditFlow routes supplier-credit repayments between shops and lenders. This
              build is a demo and is not a lender, bank or wallet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            <Link to="/login" className="text-muted hover:text-navy font-medium">
              Sign in
            </Link>
            <a href="#how-it-works" className="text-muted hover:text-navy font-medium">
              How it works
            </a>
            <span className="text-muted">© 2026 CreditFlow</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
