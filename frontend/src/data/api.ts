import { analyseSeries, repaidPercent, splitPayment, type SeriesStats } from '@/lib/calc'
import { formatMoney, istDateKey } from '@/lib/format'
import { persistDb, restoreDb } from '@/data/persistence'
import { sleep } from '@/lib/utils'
import {
  aggregates,
  agreements,
  auditLog,
  disputes,
  fees,
  alerts,
  leads,
  lenders,
  merchantById,
  qrProfiles,
  riskAlerts,
  supportTickets,
  transactions,
  verifications,
  aggregatesFor,
  agreementForMerchant,
  TODAY,
} from './seed'
import type {
  Agreement,
  Alert,
  AuditEntry,
  DailyAggregate,
  Dispute,
  DisputeResolution,
  FeeEntry,
  Lead,
  LeadStage,
  Lender,
  Merchant,
  PlatformStats,
  QrProfile,
  RiskAlert,
  SupportTicket,
  Transaction,
  VerificationItem,
} from './types'

const LATENCY = 380

async function respond<T>(value: T): Promise<T> {
  await sleep(LATENCY)
  return value
}

let auditSequence = 90242

function recordAudit(action: string, target: string, detail: string) {
  auditLog.unshift({
    id: `AU-${auditSequence++}`,
    at: new Date().toISOString(),
    actor: 'Priya Nair',
    actorRole: 'Ops',
    action,
    target,
    detail,
    ip: '49.36.180.22',
  })
  persistDb()
}

// Changes made in this session survive a page reload, like a real backend would.
restoreDb()

function dayOffset(days: number): string {
  return istDateKey(new Date(Date.now() + days * 86400000))
}

function statusOf(stats: SeriesStats) {
  return stats.state
}

export interface MerchantRowView {
  agreement: Agreement
  merchant: Merchant
  stats: SeriesStats
  repaidPercent: number
}

function rowFor(agreement: Agreement): MerchantRowView {
  const series = aggregatesFor(agreement.merchantId)
  const stats = analyseSeries(series, agreement)
  return {
    agreement,
    merchant: merchantById(agreement.merchantId),
    stats,
    repaidPercent: repaidPercent(agreement.creditAmount, agreement.outstanding),
  }
}

export interface MerchantHome {
  merchant: Merchant
  lender: Lender
  agreement: Agreement
  stats: SeriesStats
  series14: DailyAggregate[]
  alerts: Alert[]
  unreadAlerts: number
  transactionsToday: number
  updatedAt: string
}

export const merchantApi = {
  async getProfile(merchantId: string): Promise<Merchant> {
    return respond(merchantById(merchantId))
  },

  async getHome(merchantId: string): Promise<MerchantHome> {
    const merchant = merchantById(merchantId)
    const agreement = agreementForMerchant(merchantId)
    const lender = lenders.find((l) => l.id === agreement.lenderId)!
    const series = aggregatesFor(merchantId)
    const stats = analyseSeries(series, agreement)
    const merchantAlerts = alerts
      .filter((a) => a.merchantId === merchantId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    const transactionsToday = transactions.filter(
      (t) => t.merchantId === merchantId && t.date === TODAY,
    ).length

    return respond({
      merchant,
      lender,
      agreement,
      stats,
      series14: series.slice(-14),
      alerts: merchantAlerts,
      unreadAlerts: merchantAlerts.filter((a) => !a.read).length,
      transactionsToday,
      updatedAt: new Date().toISOString(),
    })
  },

  async getAgreement(merchantId: string) {
    const merchant = merchantById(merchantId)
    const agreement = agreementForMerchant(merchantId)
    const lender = lenders.find((l) => l.id === agreement.lenderId)!
    return respond({ merchant, agreement, lender })
  },

  async getProgress(merchantId: string) {
    const agreement = agreementForMerchant(merchantId)
    const series = aggregatesFor(merchantId)
    const stats = analyseSeries(series, agreement)
    const last14 = series.slice(-14)
    const last7 = series.slice(-7)
    return respond({
      agreement,
      stats,
      series14: last14,
      week: {
        days: last7.length,
        sales: last7.reduce((sum, d) => sum + d.sales, 0),
        repayment: last7.reduce((sum, d) => sum + d.repaymentRouted, 0),
        received: last7.reduce((sum, d) => sum + d.merchantReceived, 0),
        activeDays: last7.filter((d) => d.sales > 0).length,
      },
      updatedAt: new Date().toISOString(),
    })
  },

  async getTransactions(
    merchantId: string,
    filters: {
      channel?: Transaction['channel'] | 'all'
      from?: string
      to?: string
    } = {},
  ): Promise<Transaction[]> {
    const rows = transactions
      .filter((t) => t.merchantId === merchantId)
      .filter((t) =>
        filters.channel && filters.channel !== 'all'
          ? t.channel === filters.channel
          : true,
      )
      .filter((t) => (filters.from ? t.date >= filters.from : true))
      .filter((t) => (filters.to ? t.date <= filters.to : true))
      .sort((a, b) => (a.iso < b.iso ? 1 : -1))
    return respond(rows)
  },

  async getTransaction(merchantId: string, transactionId: string): Promise<Transaction> {
    const txn = transactions.find(
      (t) => t.merchantId === merchantId && t.id === transactionId,
    )
    if (!txn) throw new Error("We couldn't find that transaction.")
    return respond(txn)
  },

  async getAlerts(merchantId: string): Promise<Alert[]> {
    const rows = alerts
      .filter((a) => a.merchantId === merchantId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return respond(rows)
  },

  async markAlertRead(alertId: string): Promise<void> {
    const alert = alerts.find((a) => a.id === alertId)
    if (alert) alert.read = true
    persistDb()
    await sleep(120)
  },

  async getSubscription(merchantId: string) {
    const merchant = merchantById(merchantId)
    return respond({ subscription: merchant.subscription, merchant })
  },

  async renewSubscription(merchantId: string) {
    const merchant = merchantById(merchantId)
    const subscription = merchant.subscription
    const now = new Date()
    subscription.status = 'active'
    subscription.lapsedOn = undefined
    subscription.invoices.unshift({
      id: `INV-${merchantId.toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-R`,
      period: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      date: istDateKey(now),
      amount: subscription.monthlyFee,
      status: 'paid',
    })
    const next = new Date(now.getTime() + 30 * 86400000)
    subscription.nextBillingDate = istDateKey(next)
    recordAudit(
      'Subscription renewed',
      merchant.name,
      `${subscription.plan} plan extended by 30 days.`,
    )
    return respond(subscription)
  },

  /** Cash sales are the merchant's own declaration, they are never routed from a real payment. */
  async logCashSale(
    merchantId: string,
    input: { amount: number; note?: string },
  ): Promise<Transaction> {
    const merchant = merchantById(merchantId)
    const agreement = agreementForMerchant(merchantId)
    const split = splitPayment(input.amount, agreement.rate, agreement.outstanding)
    agreement.outstanding = Math.max(agreement.outstanding - split.repayment, 0)

    const now = new Date()
    const txn: Transaction = {
      id: `TX-${TODAY.replace(/-/g, '')}-${merchantId}-C${transactions.length}`,
      agreementId: agreement.id,
      merchantId,
      date: TODAY,
      iso: now.toISOString(),
      channel: 'cash',
      amount: input.amount,
      repayment: split.repayment,
      merchantPayout: split.merchantPayout,
      platformFee: split.platformFee,
      selfReported: true,
      status: 'routed',
    }
    transactions.unshift(txn)

    let today = aggregates.find((a) => a.merchantId === merchantId && a.date === TODAY)
    if (!today) {
      today = {
        merchantId,
        date: TODAY,
        sales: 0,
        repaymentRouted: 0,
        merchantReceived: 0,
        txnCount: 0,
      }
      aggregates.push(today)
      const history = aggregatesFor(merchantId)
      if (history.length > 0) history[history.length - 1] = today
    }
    today.sales += input.amount
    today.repaymentRouted += split.repayment
    today.merchantReceived += split.merchantPayout
    today.txnCount += 1
    persistDb()

    const percent = repaidPercent(agreement.creditAmount, agreement.outstanding)
    const mark =
      percent >= 100
        ? 100
        : percent >= 75
          ? 75
          : percent >= 50
            ? 50
            : percent >= 25
              ? 25
              : 0
    if (mark > 0 && Math.floor(percent) % 25 < 2) {
      alerts.unshift({
        id: `AL-MILE-${merchantId}-${Date.now()}`,
        merchantId,
        type: 'milestone',
        title: `${mark}% milestone crossed`,
        body: `You have repaid ${formatMoney(agreement.creditAmount - agreement.outstanding)} of ${formatMoney(agreement.creditAmount)}.`,
        createdAt: now.toISOString(),
        read: false,
      })
    }
    void merchant
    await sleep(LATENCY)
    return txn
  },

  async getTickets(merchantId: string): Promise<SupportTicket[]> {
    const rows = supportTickets
      .filter((t) => t.merchantId === merchantId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    return respond(rows)
  },

  async createTicket(
    merchantId: string,
    input: { subject: string; detail: string; category: SupportTicket['category'] },
  ): Promise<SupportTicket> {
    const now = new Date().toISOString()
    const ticket: SupportTicket = {
      id: `TK-${570 + supportTickets.length}`,
      merchantId,
      subject: input.subject,
      category: input.category,
      createdAt: now,
      status: 'open',
      lastUpdate: now,
      detail: input.detail,
    }
    supportTickets.unshift(ticket)
    persistDb()
    await sleep(LATENCY)
    return ticket
  },

  async raiseDispute(
    merchantId: string,
    input: { transactionId: string; reason: string; description: string },
  ): Promise<Dispute> {
    const merchant = merchantById(merchantId)
    const agreement = agreementForMerchant(merchantId)
    const txn = transactions.find((t) => t.id === input.transactionId)
    const dispute: Dispute = {
      id: `DSP-${322 + disputes.length}`,
      transactionId: input.transactionId,
      merchantId,
      merchantName: merchant.name,
      agreementId: agreement.id,
      reason: input.reason,
      description: input.description,
      amount: txn ? txn.repayment : 0,
      createdAt: new Date().toISOString(),
      status: 'open',
    }
    disputes.unshift(dispute)
    persistDb()
    await sleep(LATENCY)
    return dispute
  },
}

export interface LenderPortfolioRow extends MerchantRowView {
  lastActivityDate: string | null
}

export interface LenderPortfolio {
  lender: Lender
  totalExtended: number
  receivedToday: number
  receivedWeek: number
  receivedMonth: number
  activeCount: number
  atRiskCount: number
  completedCount: number
  rows: LenderPortfolioRow[]
  pace: Array<{ date: string; expected: number; actual: number }>
  feed: Array<{
    id: string
    merchantName: string
    merchantId: string
    amount: number
    repayment: number
    iso: string
  }>
  updatedAt: string
}

function lastActivityFor(merchantId: string): string | null {
  const series = aggregatesFor(merchantId)
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].sales > 0) return series[i].date
  }
  return null
}

function buildPace(lenderId: string) {
  const mine = agreements.filter((a) => a.lenderId === lenderId)
  const rows = mine.map((a) => ({ agreement: a, series: aggregatesFor(a.merchantId) }))
  const expectedDaily = rows.map(
    (r) =>
      (r.series.slice(-30).reduce((sum, d) => sum + d.sales, 0) /
        Math.max(r.series.slice(-30).filter((d) => d.sales > 0).length, 1)) *
      r.agreement.rate,
  )
  const dates = rows[0]?.series.slice(-30).map((d) => d.date) ?? []
  return dates.map((date, index) => ({
    date,
    expected: Math.round(expectedDaily.reduce((sum, v) => sum + v, 0)),
    actual: Math.round(
      rows.reduce(
        (sum, r) => sum + (r.series.find((d) => d.date === date)?.repaymentRouted ?? 0),
        0,
      ),
    ),
    index,
  }))
}

export const lenderApi = {
  async getPortfolio(lenderId: string): Promise<LenderPortfolio> {
    const lender = lenders.find((l) => l.id === lenderId)
    if (!lender) throw new Error('Lender not found')
    const mine = agreements.filter((a) => a.lenderId === lenderId)
    const rows: LenderPortfolioRow[] = mine
      .map((a) => ({ ...rowFor(a), lastActivityDate: lastActivityFor(a.merchantId) }))
      .sort((a, b) => b.stats.todayRepayment - a.stats.todayRepayment)

    const feed = transactions
      .filter((t) => mine.some((a) => a.merchantId === t.merchantId) && t.repayment > 0)
      .slice(0, 8)
      .map((t) => ({
        id: t.id,
        merchantName: merchantById(t.merchantId).name,
        merchantId: t.merchantId,
        amount: t.amount,
        repayment: t.repayment,
        iso: t.iso,
      }))

    return respond({
      lender,
      totalExtended: mine.reduce((sum, a) => sum + a.creditAmount, 0),
      receivedToday: rows.reduce((sum, r) => sum + r.stats.todayRepayment, 0),
      receivedWeek: rows.reduce((sum, r) => sum + r.stats.weekRepayment, 0),
      receivedMonth: rows.reduce((sum, r) => sum + r.stats.monthRepayment, 0),
      activeCount: rows.filter((r) => statusOf(r.stats) !== 'completed').length,
      atRiskCount: rows.filter((r) =>
        ['low_activity', 'at_risk', 'high_risk', 'default'].includes(statusOf(r.stats)),
      ).length,
      completedCount: rows.filter((r) => statusOf(r.stats) === 'completed').length,
      rows,
      pace: buildPace(lenderId).map(({ index, ...rest }) => {
        void index
        return rest
      }),
      feed,
      updatedAt: new Date().toISOString(),
    })
  },

  async getMerchants(
    lenderId: string,
    filters: { search?: string; status?: string } = {},
  ): Promise<LenderPortfolioRow[]> {
    const mine = agreements.filter((a) => a.lenderId === lenderId)
    let rows = mine.map((a) => ({
      ...rowFor(a),
      lastActivityDate: lastActivityFor(a.merchantId),
    }))
    if (filters.search) {
      const q = filters.search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.merchant.name.toLowerCase().includes(q) ||
          r.merchant.city.toLowerCase().includes(q) ||
          r.agreement.id.toLowerCase().includes(q),
      )
    }
    if (filters.status && filters.status !== 'all') {
      rows = rows.filter((r) => statusOf(r.stats) === filters.status)
    }
    return respond(rows.sort((a, b) => b.repaidPercent - a.repaidPercent))
  },

  async getRepayment(lenderId: string, merchantId: string) {
    const agreement = agreements.find(
      (a) => a.merchantId === merchantId && a.lenderId === lenderId,
    )
    if (!agreement) throw new Error("We couldn't find that agreement.")
    const row = rowFor(agreement)
    return respond({
      ...row,
      lender: lenders.find((l) => l.id === lenderId)!,
      series30: aggregatesFor(merchantId).slice(-30),
      updatedAt: new Date().toISOString(),
    })
  },

  async getAgreementView(lenderId: string, merchantId: string) {
    const agreement = agreements.find(
      (a) => a.merchantId === merchantId && a.lenderId === lenderId,
    )
    if (!agreement) throw new Error("We couldn't find that agreement.")
    return respond({
      agreement,
      merchant: merchantById(merchantId),
      lender: lenders.find((l) => l.id === lenderId)!,
    })
  },

  async getRiskAlerts(
    lenderId: string,
    filters: { status?: string } = {},
  ): Promise<RiskAlert[]> {
    const merchantIds = new Set(
      agreements.filter((a) => a.lenderId === lenderId).map((a) => a.merchantId),
    )
    const order: Record<RiskAlert['severity'], number> = { high: 0, medium: 1, low: 2 }
    let rows = riskAlerts.filter((r) => merchantIds.has(r.merchantId))
    if (filters.status && filters.status !== 'all')
      rows = rows.filter((r) => r.status === filters.status)
    return respond(rows.sort((a, b) => order[a.severity] - order[b.severity]))
  },

  async acknowledgeRisk(alertId: string): Promise<RiskAlert> {
    const alert = riskAlerts.find((r) => r.id === alertId)
    if (!alert) throw new Error('Alert not found')
    alert.status = 'acknowledged'
    alert.note = alert.note ?? 'Acknowledged by lender.'
    persistDb()
    await sleep(200)
    return alert
  },

  async escalateRisk(alertId: string): Promise<RiskAlert> {
    const alert = riskAlerts.find((r) => r.id === alertId)
    if (!alert) throw new Error('Alert not found')
    alert.status = 'escalated'
    recordAudit(
      'Risk alert escalated',
      alert.id,
      `Intervention requested for ${alert.merchantName}.`,
    )
    await sleep(220)
    return alert
  },

  async getHistory(
    lenderId: string,
    filters: { from?: string; to?: string } = {},
  ): Promise<
    Array<{ date: string; sales: number; repayment: number; merchants: number }>
  > {
    const merchantIds = new Set(
      agreements.filter((a) => a.lenderId === lenderId).map((a) => a.merchantId),
    )
    const byDate = new Map<
      string,
      { date: string; sales: number; repayment: number; merchants: Set<string> }
    >()
    for (const row of aggregates) {
      if (!merchantIds.has(row.merchantId)) continue
      if (filters.from && row.date < filters.from) continue
      if (filters.to && row.date > filters.to) continue
      const entry = byDate.get(row.date) ?? {
        date: row.date,
        sales: 0,
        repayment: 0,
        merchants: new Set<string>(),
      }
      entry.sales += row.sales
      entry.repayment += row.repaymentRouted
      entry.merchants.add(row.merchantId)
      byDate.set(row.date, entry)
    }
    const rows = [...byDate.values()]
      .map((e) => ({
        date: e.date,
        sales: e.sales,
        repayment: e.repayment,
        merchants: e.merchants.size,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    return respond(rows)
  },

  async getCompleted(lenderId: string) {
    const rows = agreements
      .filter((a) => a.lenderId === lenderId && a.outstanding <= 0)
      .map((a) => ({
        agreement: a,
        merchant: merchantById(a.merchantId),
        lender: lenders.find((l) => l.id === a.lenderId)!,
      }))
      .sort((a, b) =>
        (a.agreement.completedDate ?? '') < (b.agreement.completedDate ?? '') ? 1 : -1,
      )
    return respond(rows)
  },
}

export interface ExceptionItem {
  id: string
  kind: string
  label: string
  detail: string
  at: string
}

export const adminApi = {
  async getOverview() {
    const rows = agreements.map((a) => rowFor(a))
    const activeAgreements = rows.filter((r) => statusOf(r.stats) !== 'completed').length
    const pendingVerifications = verifications.filter(
      (v) => v.status === 'pending',
    ).length
    const openDisputes = disputes.filter((d) => d.status === 'open').length
    const pendingTxns = transactions.filter((t) => t.status === 'pending').length
    const defaultCount = rows.filter((r) => statusOf(r.stats) === 'default').length
    const unpaidFees = fees.filter((f) => f.status === 'unpaid').length

    const exceptions: ExceptionItem[] = [
      ...disputes
        .filter((d) => d.status === 'open')
        .map((d) => ({
          id: d.id,
          kind: 'Dispute',
          label: `${d.merchantName} — ${d.reason.toLowerCase()}`,
          detail: `Claimed ${formatMoney(d.amount)}`,
          at: d.createdAt,
        })),
      ...riskAlerts
        .filter((r) => r.status === 'escalated')
        .map((r) => ({
          id: r.id,
          kind: 'Risk',
          label: `${r.merchantName} — ${r.type.replace('_', ' ')}`,
          detail: `${r.daysSinceLastPayment} days since last payment`,
          at: r.createdAt,
        })),
      ...fees
        .filter((f) => f.status === 'unpaid')
        .slice(0, 3)
        .map((f) => ({
          id: f.id,
          kind: 'Fee',
          label: `${f.merchantName} — ${f.type.replace('_', ' ')} unpaid`,
          detail: formatMoney(f.amount),
          at: f.date,
        })),
    ]

    const stats: PlatformStats = {
      totalSalesToday: transactions
        .filter((t) => t.date === TODAY)
        .reduce((sum, t) => sum + t.amount, 0),
      totalRoutedToday: transactions
        .filter((t) => t.date === TODAY)
        .reduce((sum, t) => sum + t.repayment, 0),
      activeAgreements,
      verificationsPending: pendingVerifications,
      openDisputes,
      routingSuccessRate: Number(
        (
          ((transactions.length - pendingTxns) / Math.max(transactions.length, 1)) *
          100
        ).toFixed(1),
      ),
      reconciliation: 'passed',
      reconciliationAt: isoToday(9, 12),
      defaultRate: Number(
        ((defaultCount / Math.max(activeAgreements, 1)) * 100).toFixed(1),
      ),
      exceptionCount: exceptions.length,
      generatedAt: new Date().toISOString(),
    }

    return respond({ stats, exceptions, unpaidFees })
  },

  async getLeads(): Promise<Lead[]> {
    return respond([...leads].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))
  },

  async moveLead(leadId: string, stage: LeadStage): Promise<Lead> {
    const lead = leads.find((l) => l.id === leadId)
    if (!lead) throw new Error('Lead not found')
    lead.stage = stage
    lead.updatedAt = new Date().toISOString()
    recordAudit(
      'Lead moved',
      lead.id,
      `${lead.businessName} moved to ${stageLabel(stage)}.`,
    )
    await sleep(180)
    return lead
  },

  async getVerifications(filters: { status?: string } = {}): Promise<VerificationItem[]> {
    let rows = [...verifications]
    if (filters.status && filters.status !== 'all')
      rows = rows.filter((v) => v.status === filters.status)
    return respond(rows.sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1)))
  },

  async getVerification(id: string): Promise<VerificationItem> {
    const item = verifications.find((v) => v.id === id)
    if (!item) throw new Error("We couldn't find that verification.")
    return respond(item)
  },

  async reviewVerification(
    id: string,
    input: { decision: 'approved' | 'rejected' | 'more_docs'; reason?: string },
  ): Promise<VerificationItem> {
    const item = verifications.find((v) => v.id === id)
    if (!item) throw new Error("We couldn't find that verification.")
    item.status = input.decision
    item.pendingNote = input.reason
    recordAudit(
      `Verification ${input.decision === 'approved' ? 'approved' : input.decision === 'rejected' ? 'rejected' : 'sent back'}`,
      item.id,
      `${item.merchantName}${input.reason ? `. Reason: ${input.reason}` : '.'}`,
    )
    await sleep(LATENCY)
    return item
  },

  async createAgreement(input: {
    merchantId: string
    lenderId: string
    creditAmount: number
    repaymentRate: number
    sampleDailySales: number
  }) {
    const merchant = merchantById(input.merchantId)
    const id = `CF-AG-${1070 + agreements.length}`
    recordAudit(
      'Agreement sent for consent',
      id,
      `${merchant.name} — ${formatMoney(input.creditAmount)} at ${Math.round(input.repaymentRate * 100)}% of each sale.`,
    )
    await sleep(LATENCY)
    return { id, status: 'awaiting_consent' as const }
  },

  async activateAgreement(input: {
    merchantId: string
    creditAmount: number
    rate: number
  }) {
    const merchant = merchantById(input.merchantId)
    const id = `CF-AG-${1070 + agreements.length}`
    recordAudit(
      'Agreement activated',
      id,
      `${merchant.name} — ${formatMoney(input.creditAmount)} at ${Math.round(input.rate * 100)}% of each sale.`,
    )
    await sleep(LATENCY)
    return { id, status: 'active' as const }
  },

  async getQrProfiles(): Promise<QrProfile[]> {
    return respond([...qrProfiles])
  },

  async setQrStatus(
    merchantId: string,
    status: QrProfile['status'],
    reason?: string,
  ): Promise<QrProfile> {
    const profile = qrProfiles.find((q) => q.merchantId === merchantId)
    if (!profile) throw new Error('QR profile not found')
    profile.status = status
    recordAudit(
      status === 'active' ? 'QR activated' : 'QR deactivated',
      profile.merchantName,
      `UPI ID ${profile.upiId}.${reason ? ` Reason: ${reason}` : ''}`,
    )
    await sleep(200)
    return profile
  },

  async reassignQr(merchantId: string, upiId: string): Promise<QrProfile> {
    const profile = qrProfiles.find((q) => q.merchantId === merchantId)
    if (!profile) throw new Error('QR profile not found')
    profile.reassignedFrom = profile.upiId
    profile.upiId = upiId
    profile.generatedOn = istDateKey()
    recordAudit('QR reassigned', profile.merchantName, `New UPI ID ${upiId}.`)
    await sleep(220)
    return profile
  },

  async getDisputes(filters: { status?: string } = {}): Promise<Dispute[]> {
    let rows = [...disputes]
    if (filters.status && filters.status !== 'all')
      rows = rows.filter((d) => d.status === filters.status)
    return respond(rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
  },

  async resolveDispute(
    id: string,
    input: { resolution: DisputeResolution; splitPercent?: number; note?: string },
  ): Promise<Dispute> {
    const dispute = disputes.find((d) => d.id === id)
    if (!dispute) throw new Error('Dispute not found')
    dispute.status = 'resolved'
    dispute.resolution = input.resolution
    dispute.splitPercent = input.splitPercent
    dispute.resolvedAt = new Date().toISOString()
    dispute.resolvedBy = 'Priya Nair'
    recordAudit(
      'Dispute resolved',
      dispute.id,
      `${dispute.merchantName}: ${resolutionLabel(input.resolution)}${input.splitPercent ? ` (${input.splitPercent}% to merchant)` : ''}. ${input.note ?? ''}`.trim(),
    )
    await sleep(LATENCY)
    return dispute
  },

  async getFees(filters: { type?: string; status?: string } = {}): Promise<FeeEntry[]> {
    let rows = [...fees]
    if (filters.type && filters.type !== 'all')
      rows = rows.filter((f) => f.type === filters.type)
    if (filters.status && filters.status !== 'all')
      rows = rows.filter((f) => f.status === filters.status)
    return respond(rows)
  },

  async setFeeStatus(
    id: string,
    status: FeeEntry['status'],
    reason?: string,
  ): Promise<FeeEntry> {
    const fee = fees.find((f) => f.id === id)
    if (!fee) throw new Error('Fee entry not found')
    fee.status = status
    recordAudit(
      status === 'paid' ? 'Fee marked as paid' : 'Fee marked as unpaid',
      fee.id,
      `${fee.merchantName} — ${formatMoney(fee.amount)}.${reason ? ` Reason: ${reason}` : ''}`,
    )
    await sleep(200)
    return fee
  },

  async getRiskFlags(): Promise<RiskAlert[]> {
    const order: Record<RiskAlert['severity'], number> = { high: 0, medium: 1, low: 2 }
    return respond([...riskAlerts].sort((a, b) => order[a.severity] - order[b.severity]))
  },

  async assignFollowUp(alertId: string, owner: string): Promise<RiskAlert> {
    const alert = riskAlerts.find((r) => r.id === alertId)
    if (!alert) throw new Error('Alert not found')
    alert.status = 'acknowledged'
    alert.note = `Follow-up assigned to ${owner}.`
    recordAudit('Follow-up assigned', alert.id, `${alert.merchantName} — ${owner}.`)
    await sleep(200)
    return alert
  },

  async resolveRisk(alertId: string, note: string): Promise<RiskAlert> {
    const index = riskAlerts.findIndex((r) => r.id === alertId)
    if (index === -1) throw new Error('Alert not found')
    const [removed] = riskAlerts.splice(index, 1)
    recordAudit('Risk flag resolved', removed.id, `${removed.merchantName}. ${note}`)
    await sleep(220)
    return removed
  },

  async applyOverride(input: {
    agreementId: string
    type: string
    value: string
    reason: string
  }): Promise<Agreement> {
    const agreement = agreements.find((a) => a.id === input.agreementId)
    if (!agreement) throw new Error('Agreement not found')
    switch (input.type) {
      case 'adjust_balance':
        agreement.outstanding = Math.max(
          agreement.outstanding - Math.round(Number(input.value) || 0),
          0,
        )
        if (agreement.outstanding === 0) agreement.completedDate = istDateKey()
        break
      case 'extend_period':
        agreement.endDate = dayOffset(Math.round(Number(input.value) || 0))
        break
      case 'grace_extension':
        agreement.graceDays += Math.round(Number(input.value) || 0)
        break
      case 'pause_routing':
        agreement.paused = !agreement.paused
        break
      case 'force_close':
        agreement.outstanding = 0
        agreement.completedDate = istDateKey()
        break
    }
    recordAudit(
      'Override applied',
      agreement.id,
      `${overrideLabel(input.type)}. Reason: ${input.reason}`,
    )
    await sleep(LATENCY)
    return agreement
  },

  async getAuditLog(
    filters: { action?: string; from?: string; to?: string } = {},
  ): Promise<AuditEntry[]> {
    let rows = [...auditLog]
    if (filters.action && filters.action !== 'all') {
      rows = rows.filter((r) => r.action === filters.action)
    }
    if (filters.from) rows = rows.filter((r) => r.at.slice(0, 10) >= filters.from!)
    if (filters.to) rows = rows.filter((r) => r.at.slice(0, 10) <= filters.to!)
    return respond(rows)
  },
}

function isoToday(hour: number, minute: number): string {
  return `${TODAY}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`
}

export function stageLabel(stage: LeadStage): string {
  return {
    lead: 'Lead',
    contacted: 'Contacted',
    visit: 'Visit scheduled',
    verified: 'Verified',
    agreement: 'Agreement created',
    active: 'Active',
  }[stage]
}

export function overrideLabel(type: string): string {
  return (
    {
      adjust_balance: 'Balance adjusted',
      extend_period: 'Repayment period extended',
      grace_extension: 'Grace days extended',
      pause_routing: 'Routing paused',
      force_close: 'Agreement force closed',
    }[type] ?? type
  )
}

export function resolutionLabel(resolution: DisputeResolution): string {
  return {
    reverse: "Reversal in merchant's favour",
    uphold: 'Lender deduction upheld',
    split: 'Amount split between both parties',
  }[resolution]
}
