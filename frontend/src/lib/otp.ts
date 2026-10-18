/**
 * OTP delivery for the demo.
 *
 * Truecaller's verification SDK only runs inside Android/iOS apps, so a plain
 * browser cannot open the Truecaller one-tap sheet. What a web build *can* do
 * is call a partner backend that triggers Truecaller OTP / SMS delivery.
 *
 * This module therefore has three providers, picked in this order:
 *   1. "backend"    — VITE_OTP_ENDPOINT is set; it owns code generation and
 *                     can deliver via Truecaller or SMS. Nothing secret ships
 *                     in the bundle.
 *   2. "truecaller" — the native bridge exposed by the CreditFlow Android
 *                     wrapper (window.Truecaller.verify).
 *   3. "demo"       — no delivery channel configured: the code is generated
 *                     in the browser and shown on screen so the flow stays
 *                     fully functional for judges and reviewers.
 *
 * Verify always happens on the client here. A production build must verify
 * server-side; the endpoint contract below is built for that.
 */

export type OtpChannel = 'sms' | 'truecaller'

export interface TruecallerProfile {
  name?: string
  phone?: string
}

export interface SendResult {
  /** Which path actually delivered the code. */
  provider: 'backend' | 'truecaller' | 'demo'
  /** Present only for the demo provider, so the UI can display it. */
  demoCode?: string
  /** Human-readable note, e.g. why Truecaller fell back to SMS. */
  notice?: string
  /** Set when the Truecaller one-tap profile came back with the number. */
  profile?: TruecallerProfile
}

interface Challenge {
  code: string
  sentAt: number
  expiresAt: number
  attemptsLeft: number
}

const OTP_ENDPOINT = (import.meta.env.VITE_OTP_ENDPOINT as string | undefined)?.trim()
const OTP_TTL_MS = 3 * 60 * 1000
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 30 * 1000

const challenges = new Map<string, Challenge>()

declare global {
  interface Window {
    Truecaller?: {
      verify?: (options?: { phone?: string }) => Promise<TruecallerProfile | null>
    }
  }
}

function normalise(phone: string) {
  return phone.replace(/\D/g, '').slice(-10)
}

function generateCode() {
  const buffer = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer)
  } else {
    buffer[0] = Math.floor(Math.random() * 1_000_000)
  }
  return String(buffer[0] % 1_000_000).padStart(6, '0')
}

export function canUseTruecaller() {
  return typeof window !== 'undefined' && typeof window.Truecaller?.verify === 'function'
}

export function otpConfigured() {
  return Boolean(OTP_ENDPOINT) || canUseTruecaller()
}

async function sendViaBackend(phone: string, channel: OtpChannel): Promise<SendResult> {
  const response = await fetch(OTP_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: normalise(phone), channel }),
  })
  if (!response.ok) throw new Error(`OTP service returned ${response.status}`)
  const body = (await response.json()) as {
    provider?: 'backend' | 'truecaller'
    profile?: TruecallerProfile
  }
  return { provider: body.provider ?? 'backend', profile: body.profile }
}

/** Sends a code. Throws when the configured delivery channel rejects the request. */
export async function sendOtp(phone: string, channel: OtpChannel = 'sms'): Promise<SendResult> {
  const key = normalise(phone)

  const previous = challenges.get(key)
  if (previous && Date.now() - previous.sentAt < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - previous.sentAt)) / 1000)
    throw new Error(`Wait ${wait}s before asking for another code.`)
  }

  if (channel === 'truecaller' && canUseTruecaller()) {
    const profile = await window.Truecaller!.verify!({ phone: key })
    challenges.set(key, {
      code: '',
      sentAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_MS,
      attemptsLeft: MAX_ATTEMPTS,
    })
    return { provider: 'truecaller', profile: profile ?? undefined }
  }

  if (OTP_ENDPOINT) return sendViaBackend(phone, channel)

  const code = generateCode()
  challenges.set(key, {
    code,
    sentAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL_MS,
    attemptsLeft: MAX_ATTEMPTS,
  })
  return {
    provider: 'demo',
    demoCode: code,
    notice:
      channel === 'truecaller'
        ? 'Truecaller needs a mobile app or partner key. We sent a demo SMS code instead.'
        : undefined,
  }
}

export type VerifyFailure = 'expired' | 'incorrect' | 'too-many' | 'missing'

export function verifyOtp(phone: string, code: string): VerifyFailure | null {
  const challenge = challenges.get(normalise(phone))
  if (!challenge) return 'missing'
  if (challenge.attemptsLeft <= 0) return 'too-many'
  if (Date.now() > challenge.expiresAt) {
    challenges.delete(normalise(phone))
    return 'expired'
  }

  // Truecaller one-tap has already verified the number on the device.
  if (challenge.code === '') {
    challenges.delete(normalise(phone))
    return null
  }

  if (challenge.code !== code.trim()) {
    challenge.attemptsLeft -= 1
    return challenge.attemptsLeft <= 0 ? 'too-many' : 'incorrect'
  }

  challenges.delete(normalise(phone))
  return null
}

export function secondsUntilResend(phone: string) {
  const challenge = challenges.get(normalise(phone))
  if (!challenge) return 0
  return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - challenge.sentAt)) / 1000))
}

export function secondsUntilExpiry(phone: string) {
  const challenge = challenges.get(normalise(phone))
  if (!challenge) return 0
  return Math.max(0, Math.ceil((challenge.expiresAt - Date.now()) / 1000))
}
