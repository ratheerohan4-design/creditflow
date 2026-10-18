import type {
  Agreement,
  Alert,
  AuditEntry,
  DailyAggregate,
  Dispute,
  FeeEntry,
  LeadStage,
  Merchant,
  QrProfile,
  RiskAlert,
  Subscription,
  SupportTicket,
  Transaction,
  VerificationItem,
} from './types'
import {
  agreements,
  alerts,
  auditLog,
  disputes,
  fees,
  leads,
  merchants,
  qrProfiles,
  riskAlerts,
  supportTickets,
  transactions,
  verifications,
  aggregates,
  TODAY,
} from './seed'

/**
 * The mock API is in-memory, so a page reload would normally wipe every
 * change. This overlay writes the same changes to localStorage and replays
 * them on load, which is how a real backend would behave.
 */
const KEY = 'creditflow-demo-db'
const VERSION = 1

/** Puts the demo back to its seeded state on the next load. */
export function clearDb() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
}

// Captured before anything is logged, so seeded payments are never re-added.
const seedTransactionIds = new Set(transactions.map((t) => t.id))

interface Snapshot {
  v: number
  agreements: Record<
    string,
    Pick<Agreement, 'outstanding' | 'completedDate' | 'paused' | 'graceDays' | 'endDate'>
  >
  aggregates: Record<string, DailyAggregate>
  newTransactions: Transaction[]
  alerts: Alert[]
  tickets: SupportTicket[]
  disputes: Dispute[]
  riskAlerts: RiskAlert[]
  audit: AuditEntry[]
  fees: Record<string, FeeEntry['status']>
  leads: Record<string, LeadStage>
  verifications: Record<string, Pick<VerificationItem, 'status' | 'pendingNote'>>
  qr: Record<string, Pick<QrProfile, 'status' | 'upiId' | 'generatedOn' | 'reassignedFrom'>>
  subscriptions: Record<string, Subscription>
}

function replaceArray<T>(target: T[], source: T[] | undefined) {
  if (source) target.splice(0, target.length, ...source)
}

export function persistDb() {
  if (typeof localStorage === 'undefined') return
  const snapshot: Snapshot = {
    v: VERSION,
    agreements: Object.fromEntries(
      agreements.map((a) => [
        a.id,
        {
          outstanding: a.outstanding,
          completedDate: a.completedDate,
          paused: a.paused,
          graceDays: a.graceDays,
          endDate: a.endDate,
        },
      ]),
    ),
    // Only today's totals can change when a sale is logged.
    aggregates: Object.fromEntries(
      aggregates.filter((row) => row.date === TODAY).map((row) => [`${row.merchantId}:${row.date}`, row]),
    ),
    newTransactions: transactions.filter((t) => !seedTransactionIds.has(t.id)),
    alerts,
    tickets: supportTickets,
    disputes,
    riskAlerts,
    audit: auditLog,
    fees: Object.fromEntries(fees.map((f) => [f.id, f.status])),
    leads: Object.fromEntries(leads.map((l) => [l.id, l.stage])),
    verifications: Object.fromEntries(
      verifications.map((v) => [v.id, { status: v.status, pendingNote: v.pendingNote }]),
    ),
    qr: Object.fromEntries(
      qrProfiles.map((q) => [
        q.merchantId,
        {
          status: q.status,
          upiId: q.upiId,
          generatedOn: q.generatedOn,
          reassignedFrom: q.reassignedFrom,
        },
      ]),
    ),
    subscriptions: Object.fromEntries(merchants.map((m) => [m.id, m.subscription])),
  }

  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // Storage full or blocked: the demo still works for the current page.
  }
}

export function restoreDb() {
  if (typeof localStorage === 'undefined') return
  const raw = localStorage.getItem(KEY)
  if (!raw) return

  let snapshot: Snapshot
  try {
    snapshot = JSON.parse(raw) as Snapshot
  } catch {
    localStorage.removeItem(KEY)
    return
  }
  if (snapshot.v !== VERSION) return

  for (const agreement of agreements) {
    const saved = snapshot.agreements?.[agreement.id]
    if (saved) Object.assign(agreement, saved)
  }

  for (const [key, row] of Object.entries(snapshot.aggregates ?? {})) {
    const target = aggregates.find((a) => `${a.merchantId}:${a.date}` === key)
    if (target) Object.assign(target, row)
  }

  for (const txn of snapshot.newTransactions ?? []) {
    if (!transactions.some((t) => t.id === txn.id)) transactions.push(txn)
  }

  replaceArray(alerts, snapshot.alerts)
  replaceArray(supportTickets, snapshot.tickets)
  replaceArray(disputes, snapshot.disputes)
  replaceArray(riskAlerts, snapshot.riskAlerts)
  replaceArray(auditLog, snapshot.audit)

  for (const [id, status] of Object.entries(snapshot.fees ?? {})) {
    const fee = fees.find((f) => f.id === id)
    if (fee) fee.status = status
  }

  for (const [id, stage] of Object.entries(snapshot.leads ?? {})) {
    const lead = leads.find((l) => l.id === id)
    if (lead) lead.stage = stage
  }

  for (const [id, saved] of Object.entries(snapshot.verifications ?? {})) {
    const item = verifications.find((v) => v.id === id)
    if (item) Object.assign(item, saved)
  }

  for (const [id, saved] of Object.entries(snapshot.qr ?? {})) {
    const profile = qrProfiles.find((q) => q.merchantId === id)
    if (profile) Object.assign(profile, saved)
  }

  for (const [id, subscription] of Object.entries(snapshot.subscriptions ?? {})) {
    const merchant: Merchant | undefined = merchants.find((m) => m.id === id)
    if (merchant) merchant.subscription = subscription
  }
}
