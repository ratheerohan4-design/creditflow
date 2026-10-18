import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Phone,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertBanner } from '@/components/shared/AlertBanner'
import { Field } from '@/components/shared/Field'
import { Logo } from '@/components/shared/Logo'
import { useDocumentTitle } from '@/lib/hooks'
import { clearDb } from '@/data/persistence'
import {
  canUseTruecaller,
  otpConfigured,
  sendOtp,
  verifyOtp,
  type OtpChannel,
  type SendResult,
  type VerifyFailure,
} from '@/lib/otp'
import { ROLE_HOME } from '@/app/RoleGuard'
import { useSession } from '@/stores/session'
import type { Role } from '@/data/types'

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, '').slice(-10))
  .refine((value) => /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit mobile number')

const ROLES: Array<{ role: Role; label: string; detail: string; icon: typeof Store }> = [
  { role: 'merchant', label: 'Merchant', detail: 'Shop owner', icon: Store },
  { role: 'lender', label: 'Lender', detail: 'Credit provider', icon: Truck },
  { role: 'admin', label: 'Operations', detail: 'CreditFlow desk', icon: ShieldCheck },
]

const OTP_LENGTH = 6

const FAILURE_COPY: Record<VerifyFailure, string> = {
  expired: 'That code expired. Send a new one.',
  incorrect: 'That code does not match. Check the digits and try again.',
  'too-many': 'Too many attempts. Send a fresh code.',
  missing: 'No code is active for this number. Send a new one.',
}

function maskPhone(phone: string) {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`
}

const BRAND_POINTS = [
  {
    icon: Zap,
    title: 'Split at settlement',
    body: 'The lender’s share leaves before the shop’s balance lands.',
  },
  {
    icon: Lock,
    title: 'One agreement',
    body: 'Same share, cap and tenure in every portal.',
  },
  {
    icon: ShieldCheck,
    title: 'Audited by default',
    body: 'Overrides, fees and disputes all leave a trail.',
  },
]

export function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const signIn = useSession((state) => state.signIn)

  const [role, setRole] = useState<Role>('merchant')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [delivery, setDelivery] = useState<SendResult | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)

  const inputs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (cooldown <= 0 && expiresIn <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
      setExpiresIn((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown, expiresIn])

  function completeSignIn(verifiedPhone: string) {
    signIn(role, verifiedPhone)
    navigate(ROLE_HOME[role])
  }

  async function requestCode(channel: OtpChannel) {
    const parsed = phoneSchema.safeParse(phone)
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? 'Enter a valid mobile number')
      return
    }
    setError(null)
    setPhoneError(null)
    setSending(true)
    try {
      const result = await sendOtp(parsed.data, channel)
      setDelivery(result)
      setPhone(parsed.data)

      if (result.provider === 'truecaller') {
        completeSignIn(parsed.data)
        return
      }

      setDigits(Array(OTP_LENGTH).fill(''))
      setStep('otp')
      setCooldown(30)
      setExpiresIn(180)
      window.setTimeout(() => inputs.current[0]?.focus(), 60)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send a code. Try again.')
    } finally {
      setSending(false)
    }
  }

  async function verifyCode(code: string) {
    if (verifying) return
    if (code.length !== OTP_LENGTH) {
      setError('Enter all six digits.')
      return
    }
    setVerifying(true)
    setError(null)
    // A short pause keeps the button state visible; the check itself is instant.
    await new Promise((resolve) => window.setTimeout(resolve, 400))
    const failure = verifyOtp(phone, code)
    if (failure) {
      setError(FAILURE_COPY[failure])
      setDigits(Array(OTP_LENGTH).fill(''))
      inputs.current[0]?.focus()
      setVerifying(false)
      return
    }
    completeSignIn(phone)
  }

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(/\D/g, '')
    if (!clean) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }
    const next = [...digits]
    clean
      .slice(0, OTP_LENGTH - index)
      .split('')
      .forEach((digit, offset) => {
        next[index + offset] = digit
      })
    setDigits(next)
    setError(null)
    const nextIndex = Math.min(index + clean.length, OTP_LENGTH - 1)
    inputs.current[nextIndex]?.focus()
    if (next.every(Boolean)) void verifyCode(next.join(''))
  }

  function onOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
      inputs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus()
  }

  function onOtpPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    event.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })
    setDigits(next)
    setError(null)
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (next.every(Boolean)) void verifyCode(next.join(''))
  }

  const truecallerReady = canUseTruecaller()
  const anyProvider = otpConfigured()

  return (
    <div className="bg-canvas lg:grid lg:min-h-screen lg:grid-cols-[1.02fr_1fr]">
      {/* Brand panel */}
      <aside className="bg-navy relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(520px 340px at 15% 0%, rgba(245,166,35,0.18), transparent 65%), radial-gradient(600px 400px at 100% 100%, rgba(10,74,92,0.9), transparent 70%)',
          }}
        />
        <div className="relative">
          <Link to="/" className="inline-flex" aria-label="CreditFlow home">
            <Logo className="h-8" inverted />
          </Link>
          <p className="text-amber mt-14 text-[11px] font-semibold tracking-[0.18em] uppercase">
            Sign in to CreditFlow
          </p>
          <h1 className="mt-4 max-w-[440px] text-[34px] leading-[1.1] font-semibold tracking-[-0.02em] xl:text-[40px]">
            Sales today repays yesterday’s credit.
          </h1>
          <p className="mt-4 max-w-[400px] text-[14px] leading-relaxed text-white/70">
            One UPI QR. One agreed split. A repayment that keeps up with the counter instead
            of the calendar.
          </p>

          <ul className="mt-10 space-y-5">
            {BRAND_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-white/10">
                  <point.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">{point.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-white/60">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 rounded-[10px] border border-white/12 bg-white/[0.06] p-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/50 uppercase">
            Live demo
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-[22px] leading-none font-semibold tabular-nums">₹42,180</p>
              <p className="mt-1 text-[11px] text-white/55">Collected today</p>
            </div>
            <div className="text-right">
              <p className="text-amber text-[15px] leading-none font-semibold tabular-nums">
                ₹10,966
              </p>
              <p className="mt-1 text-[11px] text-white/55">Repaid automatically</p>
            </div>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/15">
            <div className="bg-amber h-full w-[26%] rounded-l-full" />
            <div className="h-full w-[74%] bg-white/80" />
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col px-4 py-8 sm:px-8 lg:min-h-0 lg:justify-center lg:py-12">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/" aria-label="CreditFlow home">
              <Logo className="h-8" />
            </Link>
            <Link
              to="/"
              className="text-muted hover:text-navy inline-flex items-center gap-1.5 text-[12px] font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          </div>

          <div className="hidden items-center justify-between lg:flex">
            <Link
              to="/"
              className="text-muted hover:text-navy inline-flex items-center gap-1.5 text-[12px] font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
            <span className="text-muted inline-flex items-center gap-1.5 text-[11px] font-medium">
              <Sparkles className="text-amber h-3.5 w-3.5" />
              Demo build
            </span>
          </div>

          <div className="mt-7 lg:mt-10">
            <h2 className="text-navy text-[24px] leading-tight font-semibold">
              {step === 'phone' ? 'Sign in' : 'Enter the code'}
            </h2>
            <p className="text-muted mt-1.5 text-[13px]">
              {step === 'phone'
                ? 'Use the mobile number linked to your shop or lending account.'
                : `We sent a 6-digit code to ${maskPhone(phone)}.`}
            </p>
          </div>

          {/* Role picker */}
          <div className="mt-6">
            <p className="text-muted mb-2 text-[11px] font-semibold tracking-[0.1em] uppercase">
              Signing in as
            </p>
            <div
              role="radiogroup"
              aria-label="Portal to open"
              className="border-line bg-surface grid grid-cols-3 gap-1 rounded-[8px] border p-1"
            >
              {ROLES.map((item) => {
                const active = role === item.role
                return (
                  <button
                    key={item.role}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(item.role)}
                    className={`flex flex-col items-center gap-1 rounded-[6px] px-2 py-2.5 transition-colors duration-150 ${
                      active
                        ? 'bg-navy text-white'
                        : 'text-muted hover:bg-tint-neutral hover:text-ink'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-[12px] font-semibold">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-muted mt-1.5 text-[11px]">
              {ROLES.find((item) => item.role === role)?.detail} · you can switch later
            </p>
          </div>

          {error ? (
            <AlertBanner tone="danger" title="Could not continue" body={error} className="mt-5" />
          ) : null}

          {step === 'phone' ? (
            <form
              className="mt-5 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void requestCode('sms')
              }}
            >
              <Field
                id="phone"
                label="Mobile number"
                error={phoneError ?? undefined}
                hint="We’ll text a 6-digit code to this number."
                required
              >
                <div className="flex items-stretch gap-2">
                  <span className="border-line bg-surface text-muted flex h-11 shrink-0 items-center rounded-[6px] border px-3 text-[13px] font-semibold">
                    +91
                  </span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                    maxLength={11}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value.replace(/[^\d\s]/g, ''))
                      setPhoneError(null)
                    }}
                    aria-invalid={Boolean(phoneError)}
                  />
                </div>
              </Field>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4" />
                    Send SMS code
                  </>
                )}
              </Button>

              <div className="flex items-center gap-3">
                <span className="bg-line h-px flex-1" />
                <span className="text-muted text-[11px] font-medium uppercase">or</span>
                <span className="bg-line h-px flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={sending}
                onClick={() => void requestCode('truecaller')}
              >
                <Smartphone className="text-teal h-4 w-4" />
                Verify with Truecaller
              </Button>
              <p className="text-muted text-[11px] leading-relaxed">
                {truecallerReady
                  ? 'Truecaller one-tap is ready on this device.'
                  : anyProvider
                    ? 'Truecaller one-tap isn’t available in this browser, so this falls back to SMS.'
                    : 'Truecaller one-tap runs inside a mobile app, not a browser. This build falls back to a demo SMS code.'}
              </p>

              <AlertBanner
                tone="info"
                title="Hackathon demo"
                body="Any valid 10-digit number works. The code is shown on the next screen — nothing is actually sent."
                className="!mt-5"
              />
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex gap-2" onPaste={onOtpPaste}>
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputs.current[index] = element
                      }}
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                      value={digit}
                      maxLength={1}
                      onChange={(event) => setDigit(index, event.target.value)}
                      onKeyDown={(event) => onOtpKeyDown(index, event)}
                      onFocus={(event) => event.target.select()}
                      className="border-line bg-surface text-navy focus:border-navy h-13 w-full rounded-[6px] border text-center text-[20px] font-semibold tabular-nums transition-colors focus:outline-none"
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted">
                    {expiresIn > 0
                      ? `Code expires in ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`
                      : 'Code expired — request a new one'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-teal font-semibold hover:underline"
                  >
                    Change number
                  </button>
                </div>
              </div>

              {delivery?.demoCode ? (
                <div className="border-amber/40 bg-tint-amber text-amber-ink flex items-center justify-between gap-3 rounded-[8px] border px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wide uppercase">
                      Demo code
                    </p>
                    <p className="mt-0.5 text-[20px] font-semibold tracking-[0.3em] tabular-nums">
                      {delivery.demoCode}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDigits(delivery.demoCode!.split(''))
                      void verifyCode(delivery.demoCode!)
                    }}
                  >
                    Autofill
                  </Button>
                </div>
              ) : (
                <p className="text-muted text-[12px]">
                  Check the SMS on {maskPhone(phone)} and enter the six digits.
                </p>
              )}

              {delivery?.notice ? (
                <p className="text-muted flex gap-2 text-[11px] leading-relaxed">
                  <Check className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {delivery.notice}
                </p>
              ) : null}

              <Button
                type="button"
                className="w-full"
                disabled={verifying}
                onClick={() => void verifyCode(digits.join(''))}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying
                  </>
                ) : (
                  <>
                    Verify and continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                disabled={cooldown > 0 || sending}
                onClick={() => void requestCode('sms')}
                className="text-muted hover:text-navy flex w-full items-center justify-center gap-1.5 text-[12px] font-medium disabled:opacity-60"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          )}

          <div className="border-line mt-8 border-t pt-5">
            <p className="text-muted text-[11px] leading-relaxed">
              By continuing you agree to the demo terms. CreditFlow is not a lender, bank or
              wallet; it routes repayments between them.
            </p>
            <button
              type="button"
              onClick={() => {
                clearDb()
                window.location.reload()
              }}
              className="text-muted hover:text-navy mt-2 text-[11px] font-medium hover:underline"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
