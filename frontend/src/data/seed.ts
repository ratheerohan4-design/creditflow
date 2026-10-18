import { splitPayment } from '@/lib/calc'
import { formatMoney, istDateKey } from '@/lib/format'
import type {
  Agreement,
  Alert,
  AuditEntry,
  DailyAggregate,
  Dispute,
  FeeEntry,
  Lead,
  Lender,
  Merchant,
  QrProfile,
  RiskAlert,
  SupportTicket,
  Transaction,
  VerificationItem,
} from './types'
import { between, intBetween, mulberry32, pickOne, seedFrom } from './rng'

export const TODAY = istDateKey()

function dayKeyOffset(offset: number): string {
  const d = new Date(Date.now() + offset * 86400000)
  return istDateKey(d)
}

function isoOn(dayKey: string, hour: number, minute: number): string {
  return `${dayKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`
}

function dow(dayKey: string): number {
  return new Date(`${dayKey}T00:00:00Z`).getUTCDay()
}

export const lenders: Lender[] = [
  {
    id: 'l1',
    name: 'Mahalaxmi Traders',
    contactPerson: 'Suresh Chandra',
    phone: '98110 42233',
    city: 'Bahadurgarh, Haryana',
    since: '2025-11-04',
  },
  {
    id: 'l2',
    name: 'Bansal Wholesale Distributors',
    contactPerson: 'Anil Bansal',
    phone: '98990 71245',
    city: 'New Delhi',
    since: '2025-12-18',
  },
  {
    id: 'l3',
    name: 'Kumar Agro Supplies',
    contactPerson: 'Devender Kumar',
    phone: '98127 55401',
    city: 'Panipat, Haryana',
    since: '2026-01-22',
  },
]

interface SubscriptionSeed {
  plan: 'Starter' | 'Growth' | 'Business'
  monthlyFee: number
  status: 'active' | 'lapsed'
  months: number
}

const subscriptionSeeds: Record<string, SubscriptionSeed> = {
  m1: { plan: 'Growth', monthlyFee: 399, status: 'active', months: 5 },
  m2: { plan: 'Business', monthlyFee: 799, status: 'lapsed', months: 4 },
  m3: { plan: 'Growth', monthlyFee: 399, status: 'active', months: 4 },
  m4: { plan: 'Starter', monthlyFee: 199, status: 'active', months: 3 },
  m5: { plan: 'Business', monthlyFee: 799, status: 'active', months: 6 },
  m6: { plan: 'Growth', monthlyFee: 399, status: 'active', months: 3 },
  m7: { plan: 'Starter', monthlyFee: 199, status: 'active', months: 2 },
  m8: { plan: 'Growth', monthlyFee: 399, status: 'active', months: 7 },
  m9: { plan: 'Starter', monthlyFee: 199, status: 'active', months: 6 },
  m10: { plan: 'Starter', monthlyFee: 199, status: 'lapsed', months: 2 },
}

function buildSubscription(merchantId: string) {
  const seed = subscriptionSeeds[merchantId]
  const rnd = mulberry32(seedFrom(`${merchantId}-sub`))
  const invoices = Array.from({ length: seed.months }, (_, i) => {
    const monthOffset = -(i + 1)
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    const period = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const unpaid = seed.status === 'lapsed' && i === 0
    return {
      id: `INV-${merchantId.toUpperCase()}-${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`,
      period,
      date: dayKeyOffset(-30 * (i + 1) + intBetween(rnd, -3, 3)),
      amount: seed.monthlyFee,
      status: unpaid ? ('unpaid' as const) : ('paid' as const),
    }
  })

  const nextBilling = dayKeyOffset(seed.status === 'lapsed' ? 0 : intBetween(rnd, 3, 9))
  return {
    plan: seed.plan,
    monthlyFee: seed.monthlyFee,
    status: seed.status,
    lapsedOn:
      seed.status === 'lapsed' ? dayKeyOffset(-intBetween(rnd, 6, 14)) : undefined,
    nextBillingDate: nextBilling,
    invoices,
  }
}

interface MerchantSeed {
  id: string
  name: string
  ownerName: string
  shopType: string
  city: string
  state: string
  phone: string
  upiId: string
  agentName: string
}

const merchantSeeds: MerchantSeed[] = [
  {
    id: 'm1',
    name: 'Sharma General Store',
    ownerName: 'Rakesh Sharma',
    shopType: 'Kirana and daily needs',
    city: 'Bahadurgarh',
    state: 'Haryana',
    phone: '98765 43210',
    upiId: 'sharmastore@ybl',
    agentName: 'Vikram Yadav',
  },
  {
    id: 'm2',
    name: 'Gupta Textiles',
    ownerName: 'Sunita Gupta',
    shopType: 'Fabric and readymade',
    city: 'Rohtak',
    state: 'Haryana',
    phone: '98712 33489',
    upiId: 'guptatextiles@okaxis',
    agentName: 'Vikram Yadav',
  },
  {
    id: 'm3',
    name: 'Verma Hardware',
    ownerName: 'Ashok Verma',
    shopType: 'Hardware and paints',
    city: 'Panipat',
    state: 'Haryana',
    phone: '94163 77210',
    upiId: 'vermahardware@ybl',
    agentName: 'Neelam Rani',
  },
  {
    id: 'm4',
    name: 'Jain Kirana',
    ownerName: 'Mohit Jain',
    shopType: 'Kirana and daily needs',
    city: 'New Delhi',
    state: 'Delhi',
    phone: '99104 66238',
    upiId: 'jainkirana@paytm',
    agentName: 'Neelam Rani',
  },
  {
    id: 'm5',
    name: 'Singh Electricals',
    ownerName: 'Gurpreet Singh',
    shopType: 'Electrical goods',
    city: 'Sonipat',
    state: 'Haryana',
    phone: '98230 51176',
    upiId: 'singhelectricals@okaxis',
    agentName: 'Vikram Yadav',
  },
  {
    id: 'm6',
    name: 'Aggarwal Footwear',
    ownerName: 'Nidhi Aggarwal',
    shopType: 'Footwear retail',
    city: 'New Delhi',
    state: 'Delhi',
    phone: '98180 22904',
    upiId: 'aggarwalfootwear@ybl',
    agentName: 'Imran Sheikh',
  },
  {
    id: 'm7',
    name: 'Mishra Namkeen Bhandar',
    ownerName: 'Deepak Mishra',
    shopType: 'Snacks and sweets',
    city: 'Gurugram',
    state: 'Haryana',
    phone: '98735 90124',
    upiId: 'mishranamkeen@okaxis',
    agentName: 'Imran Sheikh',
  },
  {
    id: 'm8',
    name: 'Kaur Sports Goods',
    ownerName: 'Jaspreet Kaur',
    shopType: 'Sports gear',
    city: 'Ludhiana',
    state: 'Punjab',
    phone: '98146 33027',
    upiId: 'kaursports@ybl',
    agentName: 'Neelam Rani',
  },
  {
    id: 'm9',
    name: 'Bhandari Sweets',
    ownerName: 'Ramesh Bhandari',
    shopType: 'Sweets and catering',
    city: 'Meerut',
    state: 'Uttar Pradesh',
    phone: '98971 44580',
    upiId: 'bhandarisweets@paytm',
    agentName: 'Imran Sheikh',
  },
  {
    id: 'm10',
    name: 'Rana Juice Corner',
    ownerName: 'Sandeep Rana',
    shopType: 'Juice and snacks',
    city: 'Karnal',
    state: 'Haryana',
    phone: '98129 67340',
    upiId: 'ranajuice@okaxis',
    agentName: 'Neelam Rani',
  },
]

export const merchants: Merchant[] = merchantSeeds.map((seed) => ({
  ...seed,
  subscription: buildSubscription(seed.id),
}))

interface Plan {
  id: string
  merchantId: string
  lenderId: string
  creditAmount: number
  rate: number
  startDaysAgo: number
  plannedDays: number
  baseSales: number
  volatility: number
  minDailyFloor: number
  graceDays: number
  profile: 'steady' | 'slow' | 'stopped' | 'low_activity' | 'fast'
  slowDays?: number
  slowFactor?: number
  penaltyTerms: string
  onboardingAgent: string
}

const plans: Plan[] = [
  {
    id: 'CF-AG-1042',
    merchantId: 'm1',
    lenderId: 'l1',
    creditAmount: 230000,
    rate: 0.2,
    startDaysAgo: 62,
    plannedDays: 150,
    baseSales: 5200,
    volatility: 0.3,
    minDailyFloor: 400,
    graceDays: 5,
    profile: 'steady',
    penaltyTerms:
      'No penalty for early repayment. A late fee of Rs. 100 per day applies after 5 grace days with no routed repayment.',
    onboardingAgent: 'Vikram Yadav',
  },
  {
    id: 'CF-AG-1039',
    merchantId: 'm2',
    lenderId: 'l1',
    creditAmount: 400000,
    rate: 0.18,
    startDaysAgo: 70,
    plannedDays: 180,
    baseSales: 6500,
    volatility: 0.28,
    minDailyFloor: 500,
    graceDays: 7,
    profile: 'slow',
    slowDays: 9,
    slowFactor: 0.45,
    penaltyTerms:
      'Late fee of Rs. 150 per day after 7 grace days. Lender may recall the remaining balance if no payment is routed for 21 days.',
    onboardingAgent: 'Vikram Yadav',
  },
  {
    id: 'CF-AG-1051',
    merchantId: 'm3',
    lenderId: 'l2',
    creditAmount: 300000,
    rate: 0.2,
    startDaysAgo: 40,
    plannedDays: 150,
    baseSales: 5600,
    volatility: 0.32,
    minDailyFloor: 450,
    graceDays: 5,
    profile: 'steady',
    penaltyTerms: 'Late fee of Rs. 100 per day after 5 grace days.',
    onboardingAgent: 'Neelam Rani',
  },
  {
    id: 'CF-AG-1055',
    merchantId: 'm4',
    lenderId: 'l1',
    creditAmount: 150000,
    rate: 0.25,
    startDaysAgo: 45,
    plannedDays: 120,
    baseSales: 3800,
    volatility: 0.26,
    minDailyFloor: 350,
    graceDays: 4,
    profile: 'steady',
    penaltyTerms: 'Late fee of Rs. 75 per day after 4 grace days.',
    onboardingAgent: 'Neelam Rani',
  },
  {
    id: 'CF-AG-1018',
    merchantId: 'm5',
    lenderId: 'l1',
    creditAmount: 500000,
    rate: 0.15,
    startDaysAgo: 75,
    plannedDays: 300,
    baseSales: 6000,
    volatility: 0.34,
    minDailyFloor: 600,
    graceDays: 10,
    profile: 'stopped',
    penaltyTerms:
      'Late fee of Rs. 250 per day after 10 grace days. Lender may recall the balance or pause the merchant QR after 21 days with no routed repayment.',
    onboardingAgent: 'Vikram Yadav',
  },
  {
    id: 'CF-AG-1060',
    merchantId: 'm6',
    lenderId: 'l2',
    creditAmount: 260000,
    rate: 0.15,
    startDaysAgo: 55,
    plannedDays: 200,
    baseSales: 7200,
    volatility: 0.3,
    minDailyFloor: 500,
    graceDays: 5,
    profile: 'steady',
    penaltyTerms: 'Late fee of Rs. 120 per day after 5 grace days.',
    onboardingAgent: 'Imran Sheikh',
  },
  {
    id: 'CF-AG-1034',
    merchantId: 'm7',
    lenderId: 'l3',
    creditAmount: 180000,
    rate: 0.22,
    startDaysAgo: 66,
    plannedDays: 160,
    baseSales: 4600,
    volatility: 0.3,
    minDailyFloor: 400,
    graceDays: 5,
    profile: 'slow',
    slowDays: 10,
    slowFactor: 0.5,
    penaltyTerms: 'Late fee of Rs. 100 per day after 5 grace days.',
    onboardingAgent: 'Imran Sheikh',
  },
  {
    id: 'CF-AG-1012',
    merchantId: 'm8',
    lenderId: 'l1',
    creditAmount: 120000,
    rate: 0.3,
    startDaysAgo: 88,
    plannedDays: 120,
    baseSales: 8000,
    volatility: 0.24,
    minDailyFloor: 300,
    graceDays: 3,
    profile: 'fast',
    penaltyTerms: 'Late fee of Rs. 75 per day after 3 grace days.',
    onboardingAgent: 'Neelam Rani',
  },
  {
    id: 'CF-AG-1024',
    merchantId: 'm9',
    lenderId: 'l2',
    creditAmount: 90000,
    rate: 0.25,
    startDaysAgo: 70,
    plannedDays: 100,
    baseSales: 7000,
    volatility: 0.22,
    minDailyFloor: 300,
    graceDays: 3,
    profile: 'fast',
    penaltyTerms: 'Late fee of Rs. 75 per day after 3 grace days.',
    onboardingAgent: 'Imran Sheikh',
  },
  {
    id: 'CF-AG-1048',
    merchantId: 'm10',
    lenderId: 'l3',
    creditAmount: 80000,
    rate: 0.25,
    startDaysAgo: 50,
    plannedDays: 130,
    baseSales: 3200,
    volatility: 0.35,
    minDailyFloor: 250,
    graceDays: 4,
    profile: 'low_activity',
    penaltyTerms: 'Late fee of Rs. 75 per day after 4 grace days.',
    onboardingAgent: 'Neelam Rani',
  },
]

/** Sales are quieter on Mondays and busier around the weekend in these shops. */
function weekdayFactor(dayKey: string): number {
  const day = dow(dayKey)
  if (day === 5 || day === 6) return 1.28
  if (day === 0) return 1.08
  if (day === 1) return 0.85
  return 1
}

const PAYER_DOMAINS = ['@okaxis', '@ybl', '@paytm', '@ibl', '@axl']

interface BuiltDay {
  aggregate: DailyAggregate & { merchantId: string }
  transactions: Transaction[]
}

function buildAgreementHistory(plan: Plan): BuiltDay[] {
  const rnd = mulberry32(seedFrom(plan.id))
  const days: BuiltDay[] = []
  let outstanding = plan.creditAmount
  let completedDate: string | undefined
  let txnSequence = 0

  for (let offset = -plan.startDaysAgo; offset <= 0; offset++) {
    const dateKey = dayKeyOffset(offset)
    const daysAgo = -offset

    let sales = 0
    if (plan.profile === 'stopped' && daysAgo <= 22) {
      sales = 0
    } else if (plan.profile === 'low_activity' && daysAgo <= 4) {
      sales = 0
    } else {
      sales =
        plan.baseSales * weekdayFactor(dateKey) * (1 + plan.volatility * (rnd() * 2 - 1))
      if (plan.profile === 'slow' && plan.slowDays && daysAgo < plan.slowDays) {
        sales *= plan.slowFactor ?? 0.45
      }
    }
    sales = Math.max(Math.round(sales), 0)

    const transactions: Transaction[] = []
    let repaymentRouted = 0
    let merchantReceived = 0

    if (sales > 0) {
      const isToday = offset === 0
      const parts: number[] = []
      const count = isToday ? intBetween(rnd, 2, 5) : intBetween(rnd, 3, 7)
      let left = sales
      for (let i = 0; i < count - 1; i++) {
        const share = Math.max(60, Math.round(left * between(rnd, 0.12, 0.38)))
        if (left - share < 60) break
        parts.push(share)
        left -= share
      }
      if (left > 0) parts.push(left)

      const nowHour = isToday ? new Date().getHours() : 21

      parts.forEach((amount) => {
        const split = splitPayment(amount, plan.rate, outstanding)
        outstanding = Math.max(outstanding - split.repayment, 0)
        repaymentRouted += split.repayment
        merchantReceived += split.merchantPayout

        const channel = rnd() < 0.86 ? 'upi' : 'cash'
        const hour = 9 + Math.floor(rnd() * Math.max(nowHour - 9 + 1, 1))
        const safeHour = isToday ? Math.min(hour, nowHour) : Math.min(hour, 21)
        const minute = intBetween(rnd, 0, 59)
        txnSequence += 1

        transactions.push({
          id: `TX-${dateKey.replace(/-/g, '')}-${plan.merchantId}-${String(txnSequence).padStart(3, '0')}`,
          agreementId: plan.id,
          merchantId: plan.merchantId,
          date: dateKey,
          iso: isoOn(dateKey, safeHour, minute),
          channel,
          amount,
          repayment: split.repayment,
          merchantPayout: split.merchantPayout,
          platformFee: split.platformFee,
          upiRef:
            channel === 'upi' ? String(Math.floor(rnd() * 8.9e11 + 1e11)) : undefined,
          payerHandle:
            channel === 'upi'
              ? `${String.fromCharCode(97 + intBetween(rnd, 0, 25))}***${pickOne(rnd, PAYER_DOMAINS)}`
              : undefined,
          selfReported: channel === 'cash',
          // A small share of payments are still settling with the bank.
          status: rnd() < 0.012 ? 'pending' : 'routed',
        })
      })

      // Once the balance hits zero on a day, that day's repayment still counts.
      // Later days route nothing because there is nothing left to repay.
      if (outstanding <= 0 && !completedDate) {
        completedDate = dateKey
      }
    }

    days.push({
      aggregate: {
        merchantId: plan.merchantId,
        date: dateKey,
        sales,
        repaymentRouted,
        merchantReceived,
        txnCount: transactions.length,
      },
      transactions,
    })
  }

  return days
}

const historyByMerchant = new Map<string, BuiltDay[]>()
const agreements: Agreement[] = []
const transactions: Transaction[] = []
const aggregates: Array<DailyAggregate & { merchantId: string }> = []

for (const plan of plans) {
  const days = buildAgreementHistory(plan)
  historyByMerchant.set(plan.merchantId, days)
  const totalRepaid = days.reduce((sum, d) => sum + d.aggregate.repaymentRouted, 0)
  const completedDay = days.find(
    (_, index) =>
      plan.creditAmount -
        days.slice(0, index + 1).reduce((s, x) => s + x.aggregate.repaymentRouted, 0) <=
      0,
  )
  days.forEach((d) => {
    aggregates.push(d.aggregate)
    transactions.push(...d.transactions)
  })
  agreements.push({
    id: plan.id,
    merchantId: plan.merchantId,
    lenderId: plan.lenderId,
    creditAmount: plan.creditAmount,
    disbursedDate: dayKeyOffset(-plan.startDaysAgo),
    startDate: dayKeyOffset(-plan.startDaysAgo),
    endDate: dayKeyOffset(-plan.startDaysAgo + plan.plannedDays),
    completedDate: completedDay ? completedDay.aggregate.date : undefined,
    rate: plan.rate,
    minDailyFloor: plan.minDailyFloor,
    graceDays: plan.graceDays,
    penaltyTerms: plan.penaltyTerms,
    outstanding: Math.max(plan.creditAmount - totalRepaid, 0),
    consentDate: dayKeyOffset(-plan.startDaysAgo - 1),
    onboardingAgent: plan.onboardingAgent,
    paused: false,
  })
}

transactions.sort((a, b) => (a.iso < b.iso ? 1 : -1))
aggregates.sort((a, b) => (a.date < b.date ? 1 : -1))

export { agreements, transactions, aggregates, historyByMerchant }

function repaidSoFar(merchantId: string): {
  repaid: number
  credit: number
  outstanding: number
} {
  const agreement = agreements.find((a) => a.merchantId === merchantId)!
  return {
    repaid: agreement.creditAmount - agreement.outstanding,
    credit: agreement.creditAmount,
    outstanding: agreement.outstanding,
  }
}

const milestoneAlerts: Alert[] = []
for (const agreement of agreements) {
  const percent =
    (repaidSoFar(agreement.merchantId).repaid / agreement.creditAmount) * 100
  if (percent >= 25 && agreement.outstanding > 0) {
    const mark = percent >= 75 ? 75 : percent >= 50 ? 50 : 25
    const lenderName =
      lenders.find((l) => l.id === agreement.lenderId)?.name ?? 'your lender'
    milestoneAlerts.push({
      id: `AL-MILE-${agreement.merchantId}`,
      merchantId: agreement.merchantId,
      type: 'milestone',
      title: `${mark}% milestone crossed`,
      body: `You have repaid ${formatMoney(
        agreement.creditAmount - agreement.outstanding,
      )} of ${formatMoney(agreement.creditAmount)} borrowed from ${lenderName}.`,
      createdAt: isoOn(dayKeyOffset(-1), 9, 15),
      read: false,
    })
  }
}

export const alerts: Alert[] = [
  {
    id: 'AL-SUB-1001',
    merchantId: 'm1',
    type: 'subscription_due',
    title: 'Growth plan renews in a few days',
    body: 'Rs. 399 will be charged from your linked bank account on the billing date.',
    createdAt: isoOn(dayKeyOffset(-1), 8, 5),
    read: false,
    action: { label: 'Renew', to: '/merchant/subscription' },
  },
  ...milestoneAlerts.filter((a) => a.merchantId === 'm1'),
  {
    id: 'AL-LOW-0987',
    merchantId: 'm1',
    type: 'low_activity',
    title: 'Three quiet days last fortnight',
    body: 'No UPI sales for 3 days. Sales resumed on their own, nothing to do.',
    createdAt: isoOn(dayKeyOffset(-16), 19, 40),
    read: true,
  },
  {
    id: 'AL-SUB-1002',
    merchantId: 'm2',
    type: 'subscription_due',
    title: 'Business plan lapsed',
    body: 'Your plan ended. Renew to keep receiving repayment updates in the app. Your QR keeps working.',
    createdAt: isoOn(dayKeyOffset(-9), 7, 30),
    read: false,
    action: { label: 'Renew', to: '/merchant/subscription' },
  },
  {
    id: 'AL-LOW-0991',
    merchantId: 'm10',
    type: 'low_activity',
    title: 'No digital sales for 4 days',
    body: 'Nothing has come through the QR since Monday. Log cash sales if customers paid by hand.',
    createdAt: isoOn(dayKeyOffset(-1), 18, 0),
    read: false,
    action: { label: 'Log cash sale', to: '/merchant/log-cash-sale' },
  },
]

export const riskAlerts: RiskAlert[] = [
  {
    id: 'RA-2041',
    merchantId: 'm2',
    merchantName: 'Gupta Textiles',
    agreementId: 'CF-AG-1039',
    type: 'at_risk',
    severity: 'medium',
    daysSinceLastPayment: 1,
    status: 'new',
    createdAt: isoOn(dayKeyOffset(-2), 10, 20),
    note: 'Repayment pace has been under 70% of target for 9 days.',
  },
  {
    id: 'RA-2033',
    merchantId: 'm5',
    merchantName: 'Singh Electricals',
    agreementId: 'CF-AG-1018',
    type: 'default',
    severity: 'high',
    daysSinceLastPayment: 22,
    status: 'escalated',
    createdAt: isoOn(dayKeyOffset(-12), 11, 5),
    note: 'No routed payment since the shop shut for repairs. Field visit requested.',
  },
  {
    id: 'RA-2044',
    merchantId: 'm7',
    merchantName: 'Mishra Namkeen Bhandar',
    agreementId: 'CF-AG-1034',
    type: 'at_risk',
    severity: 'medium',
    daysSinceLastPayment: 1,
    status: 'acknowledged',
    createdAt: isoOn(dayKeyOffset(-3), 9, 45),
    note: 'Owner says footfall dropped during the market renovation.',
  },
  {
    id: 'RA-2048',
    merchantId: 'm10',
    merchantName: 'Rana Juice Corner',
    agreementId: 'CF-AG-1048',
    type: 'low_activity',
    severity: 'low',
    daysSinceLastPayment: 4,
    status: 'new',
    createdAt: isoOn(dayKeyOffset(-1), 18, 10),
  },
]

const disputeSource = (merchantId: string, daysAgo: number) => {
  const list = transactions.filter(
    (t) => t.merchantId === merchantId && t.date === dayKeyOffset(-daysAgo),
  )
  return list[list.length - 1] ?? transactions.find((t) => t.merchantId === merchantId)!
}

const d1 = disputeSource('m1', 9)
const d2 = disputeSource('m2', 5)
const d3 = disputeSource('m4', 17)

export const disputes: Dispute[] = [
  {
    id: 'DSP-318',
    transactionId: d1.id,
    merchantId: 'm1',
    merchantName: 'Sharma General Store',
    agreementId: 'CF-AG-1042',
    reason: 'Amount deducted does not match the sale',
    description:
      'Customer paid Rs. 1,200 on the QR but only part reached my account. Please check the split.',
    amount: Math.max(d1.repayment - 100, 50),
    createdAt: isoOn(dayKeyOffset(-9), 20, 12),
    status: 'open',
  },
  {
    id: 'DSP-321',
    transactionId: d2.id,
    merchantId: 'm2',
    merchantName: 'Gupta Textiles',
    agreementId: 'CF-AG-1039',
    reason: 'Same sale deducted twice',
    description:
      'One customer payment shows twice in my statement. Both times the lender share was routed.',
    amount: Math.max(d2.repayment, 100),
    createdAt: isoOn(dayKeyOffset(-5), 17, 33),
    status: 'open',
  },
  {
    id: 'DSP-305',
    transactionId: d3.id,
    merchantId: 'm4',
    merchantName: 'Jain Kirana',
    agreementId: 'CF-AG-1055',
    reason: 'Cash sale shown as UPI',
    description: 'I logged a cash sale but it appears as a UPI payment in the statement.',
    amount: Math.max(d3.repayment - 60, 40),
    createdAt: isoOn(dayKeyOffset(-17), 13, 5),
    status: 'resolved',
    resolution: 'uphold',
    resolvedAt: isoOn(dayKeyOffset(-11), 12, 40),
    resolvedBy: 'Priya Nair',
  },
]

function buildFees(): FeeEntry[] {
  const rows: FeeEntry[] = []
  let counter = 0

  for (const merchant of merchants) {
    const merchantTxns = transactions.filter((t) => t.merchantId === merchant.id)
    // One platform-fee entry per week, from the routed sales that week.
    for (let week = 0; week < 8; week++) {
      const from = dayKeyOffset(-7 * (week + 1) + 1)
      const to = dayKeyOffset(-7 * week)
      const weekTxns = merchantTxns.filter((t) => t.date >= from && t.date <= to)
      if (weekTxns.length === 0) continue
      const amount = weekTxns.reduce((sum, t) => sum + t.platformFee, 0)
      // A shop that finished repaying pays no routing fee on later sales.
      if (amount === 0) continue
      counter += 1
      rows.push({
        id: `FEE-${String(counter).padStart(4, '0')}`,
        date: to,
        merchantId: merchant.id,
        merchantName: merchant.name,
        type: 'platform',
        period: `${from} to ${to}`,
        amount,
        status: week === 0 && merchant.id.charCodeAt(1) % 2 === 0 ? 'unpaid' : 'paid',
      })
    }

    counter += 1
    rows.push({
      id: `FEE-${String(counter).padStart(4, '0')}`,
      date: merchant.subscription.invoices[0].date,
      merchantId: merchant.id,
      merchantName: merchant.name,
      type: 'subscription',
      period: merchant.subscription.invoices[0].period,
      amount: merchant.subscription.monthlyFee,
      status: merchant.subscription.status === 'lapsed' ? 'unpaid' : 'paid',
    })
  }

  rows.push(
    {
      id: 'FEE-0901',
      date: dayKeyOffset(-14),
      merchantId: 'm5',
      merchantName: 'Singh Electricals',
      type: 'late_fee',
      period: 'Grace days exceeded',
      amount: 1500,
      status: 'unpaid',
    },
    {
      id: 'FEE-0884',
      date: dayKeyOffset(-40),
      merchantId: 'm3',
      merchantName: 'Verma Hardware',
      type: 'onboarding',
      period: 'Shop visit and QR kit',
      amount: 499,
      status: 'paid',
    },
    {
      id: 'FEE-0890',
      date: dayKeyOffset(-55),
      merchantId: 'm6',
      merchantName: 'Aggarwal Footwear',
      type: 'onboarding',
      period: 'Shop visit and QR kit',
      amount: 499,
      status: 'paid',
    },
  )

  return rows.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const fees: FeeEntry[] = buildFees()

export const leads: Lead[] = [
  {
    id: 'LD-411',
    businessName: 'Deshwal Plywood',
    ownerName: 'Karan Deshwal',
    phone: '98123 44001',
    city: 'Bahadurgarh',
    stage: 'lead',
    creditEstimate: 150000,
    assignedTo: 'Vikram Yadav',
    updatedAt: isoOn(dayKeyOffset(-2), 16, 10),
    note: 'Walk-in from the weekly wholesaler meet.',
  },
  {
    id: 'LD-409',
    businessName: 'Goyal Mobile Point',
    ownerName: 'Sanjay Goyal',
    phone: '99711 30214',
    city: 'Rohtak',
    stage: 'contacted',
    creditEstimate: 200000,
    assignedTo: 'Vikram Yadav',
    updatedAt: isoOn(dayKeyOffset(-3), 11, 25),
    note: 'Asked for the fee sheet on WhatsApp.',
  },
  {
    id: 'LD-406',
    businessName: 'Shanti Provision Store',
    ownerName: 'Rekha Devi',
    phone: '98912 77345',
    city: 'New Delhi',
    stage: 'visit',
    creditEstimate: 120000,
    assignedTo: 'Neelam Rani',
    updatedAt: isoOn(dayKeyOffset(-1), 10, 5),
    note: 'Shop visit booked for Friday morning.',
  },
  {
    id: 'LD-402',
    businessName: 'Tiwari Medical Hall',
    ownerName: 'Arun Tiwari',
    phone: '94160 22987',
    city: 'Panipat',
    stage: 'verified',
    creditEstimate: 350000,
    assignedTo: 'Neelam Rani',
    updatedAt: isoOn(dayKeyOffset(-1), 18, 45),
    note: 'Documents verified, waiting for lender approval.',
  },
  {
    id: 'LD-398',
    businessName: 'Neha Beauty Parlour',
    ownerName: 'Neha Arora',
    phone: '98273 61120',
    city: 'Gurugram',
    stage: 'agreement',
    creditEstimate: 90000,
    assignedTo: 'Imran Sheikh',
    updatedAt: isoOn(dayKeyOffset(-2), 14, 30),
    note: 'Agreement sent for consent on the merchant phone.',
  },
  {
    id: 'LD-395',
    businessName: 'Saini Milk Depot',
    ownerName: 'Mohit Saini',
    phone: '98120 90887',
    city: 'Sonipat',
    stage: 'active',
    creditEstimate: 250000,
    assignedTo: 'Vikram Yadav',
    updatedAt: isoOn(dayKeyOffset(-6), 9, 50),
    note: 'First repayment routed this morning.',
  },
]

export const verifications: VerificationItem[] = [
  {
    id: 'VF-2210',
    merchantId: 'm-lead-402',
    merchantName: 'Tiwari Medical Hall',
    submittedAt: isoOn(dayKeyOffset(-1), 17, 20),
    status: 'pending',
    agentName: 'Neelam Rani',
    gps: {
      lat: 29.3916,
      lng: 76.9711,
      address: 'Opposite Grain Market, Sector 3, Panipat',
    },
    agentNotes:
      'Shop runs for 9 years. Supplies two chemists nearby. Wants credit for stock.',
    idType: 'Aadhaar',
    idNumber: 'XXXX XXXX 4471',
    shopPhotos: 3,
  },
  {
    id: 'VF-2208',
    merchantId: 'm-lead-406',
    merchantName: 'Shanti Provision Store',
    submittedAt: isoOn(dayKeyOffset(-2), 12, 5),
    status: 'pending',
    agentName: 'Vikram Yadav',
    gps: { lat: 28.6139, lng: 77.209, address: 'Lane 4, Sadar Bazaar, New Delhi' },
    agentNotes: 'Rented shop, landlord consent taken. QR already in use for UPI.',
    idType: 'Aadhaar',
    idNumber: 'XXXX XXXX 8123',
    shopPhotos: 2,
  },
  {
    id: 'VF-2205',
    merchantId: 'm-lead-398',
    merchantName: 'Neha Beauty Parlour',
    submittedAt: isoOn(dayKeyOffset(-4), 15, 40),
    status: 'more_docs',
    agentName: 'Imran Sheikh',
    gps: { lat: 28.4595, lng: 77.0266, address: 'Sector 14 Market, Gurugram' },
    agentNotes: 'Asked for the electricity bill as address proof.',
    idType: 'PAN',
    idNumber: 'XXXXX 9214K',
    shopPhotos: 3,
    pendingNote: 'Waiting for address proof since 4 days.',
  },
  {
    id: 'VF-2212',
    merchantId: 'm-lead-411',
    merchantName: 'Deshwal Plywood',
    submittedAt: isoOn(dayKeyOffset(0), 11, 15),
    status: 'pending',
    agentName: 'Vikram Yadav',
    gps: { lat: 28.6826, lng: 76.9234, address: 'Jhajjar Road, Bahadurgarh' },
    agentNotes: 'Godown and shop both visited. Stock worth roughly Rs. 8 lakh.',
    idType: 'Aadhaar',
    idNumber: 'XXXX XXXX 1180',
    shopPhotos: 4,
  },
]

export const supportTickets: SupportTicket[] = [
  {
    id: 'TK-552',
    merchantId: 'm1',
    subject: 'QR sticker faded after rain',
    category: 'qr',
    createdAt: isoOn(dayKeyOffset(-12), 10, 30),
    status: 'resolved',
    lastUpdate: isoOn(dayKeyOffset(-10), 15, 10),
    detail: 'Replacement sticker printed and pasted at the counter.',
  },
  {
    id: 'TK-566',
    merchantId: 'm1',
    subject: 'One payment missing from yesterday',
    category: 'payment',
    createdAt: isoOn(dayKeyOffset(-9), 20, 15),
    status: 'in_progress',
    lastUpdate: isoOn(dayKeyOffset(-2), 12, 45),
    detail: "Dispute DSP-318 raised. Lender asked for the customer's payment screenshot.",
  },
]

export const qrProfiles: QrProfile[] = merchants.map((merchant, index) => ({
  merchantId: merchant.id,
  merchantName: merchant.name,
  upiId: merchant.upiId,
  status: index === 7 ? 'inactive' : 'active',
  generatedOn: dayKeyOffset(-(20 + index * 6)),
  reassignedFrom: index === 5 ? 'aggarwalfootwear@okaxis' : undefined,
}))

export const auditLog: AuditEntry[] = [
  {
    id: 'AU-90241',
    at: isoOn(TODAY, 9, 12),
    actor: 'system',
    actorRole: 'System',
    action: 'Routing run completed',
    target: 'All active agreements',
    detail: 'Morning settlement window closed. 8 of 9 agreements received payments.',
    ip: '10.0.0.4',
  },
  {
    id: 'AU-90238',
    at: isoOn(dayKeyOffset(-1), 18, 44),
    actor: 'Priya Nair',
    actorRole: 'Ops',
    action: 'Dispute resolved',
    target: 'DSP-305',
    detail: 'Upheld. Cash sale channel corrected on the merchant statement.',
    ip: '49.36.180.22',
  },
  {
    id: 'AU-90235',
    at: isoOn(dayKeyOffset(-1), 16, 2),
    actor: 'Rahul Mehta',
    actorRole: 'Ops',
    action: 'Verification approved',
    target: 'VF-2199',
    detail: 'Saini Milk Depot cleared. Agreement CF-AG-1062 drafted.',
    ip: '49.36.180.19',
  },
  {
    id: 'AU-90231',
    at: isoOn(dayKeyOffset(-2), 11, 28),
    actor: 'Priya Nair',
    actorRole: 'Ops',
    action: 'Override applied',
    target: 'CF-AG-1018',
    detail:
      'Grace extension of 7 days for Singh Electricals. Reason: shop shut for repairs.',
    ip: '49.36.180.22',
  },
  {
    id: 'AU-90227',
    at: isoOn(dayKeyOffset(-3), 14, 9),
    actor: 'Rahul Mehta',
    actorRole: 'Ops',
    action: 'QR reactivated',
    target: 'Aggarwal Footwear',
    detail: 'Merchant submitted a new QR photo after the counter was renovated.',
    ip: '49.36.180.19',
  },
  {
    id: 'AU-90220',
    at: isoOn(dayKeyOffset(-4), 10, 55),
    actor: 'system',
    actorRole: 'System',
    action: 'Reconciliation passed',
    target: 'Bank file 2026-10-11',
    detail: 'All routed amounts matched the partner bank file. No exceptions.',
    ip: '10.0.0.4',
  },
  {
    id: 'AU-90216',
    at: isoOn(dayKeyOffset(-5), 17, 21),
    actor: 'Vikram Yadav',
    actorRole: 'Field agent',
    action: 'Lead moved to Verified',
    target: 'LD-402',
    detail: 'Tiwari Medical Hall documents uploaded from the field app.',
    ip: '106.51.72.140',
  },
  {
    id: 'AU-90210',
    at: isoOn(dayKeyOffset(-6), 9, 3),
    actor: 'Priya Nair',
    actorRole: 'Ops',
    action: 'Fee marked as paid',
    target: 'FEE-0890',
    detail: 'Onboarding fee collected by bank transfer.',
    ip: '49.36.180.22',
  },
  {
    id: 'AU-90204',
    at: isoOn(dayKeyOffset(-8), 15, 47),
    actor: 'system',
    actorRole: 'System',
    action: 'Subscription lapsed',
    target: 'Gupta Textiles',
    detail: 'Business plan not renewed. QR remains active per policy.',
    ip: '10.0.0.4',
  },
  {
    id: 'AU-90198',
    at: isoOn(dayKeyOffset(-10), 12, 30),
    actor: 'Rahul Mehta',
    actorRole: 'Ops',
    action: 'Risk alert escalated',
    target: 'RA-2033',
    detail: 'Field visit scheduled for Singh Electricals.',
    ip: '49.36.180.19',
  },
  {
    id: 'AU-90190',
    at: isoOn(dayKeyOffset(-13), 11, 14),
    actor: 'Priya Nair',
    actorRole: 'Ops',
    action: 'Agreement activated',
    target: 'CF-AG-1060',
    detail:
      'Merchant consent received on SMS. Disbursement confirmed by Bansal Wholesale.',
    ip: '49.36.180.22',
  },
  {
    id: 'AU-90182',
    at: isoOn(dayKeyOffset(-16), 16, 38),
    actor: 'system',
    actorRole: 'System',
    action: 'Reconciliation failed',
    target: 'Bank file 2026-09-29',
    detail: '2 entries unmatched. Exception queue raised for ops review.',
    ip: '10.0.0.4',
  },
]

export function merchantById(id: string): Merchant {
  const merchant = merchants.find((m) => m.id === id)
  if (!merchant) throw new Error(`Unknown merchant: ${id}`)
  return merchant
}

export function lenderById(id: string): Lender {
  const lender = lenders.find((l) => l.id === id)
  if (!lender) throw new Error(`Unknown lender: ${id}`)
  return lender
}

export function agreementForMerchant(merchantId: string): Agreement {
  const agreement = agreements.find((a) => a.merchantId === merchantId)
  if (!agreement) throw new Error(`No agreement for merchant: ${merchantId}`)
  return agreement
}

export function aggregatesFor(merchantId: string): DailyAggregate[] {
  return (historyByMerchant.get(merchantId) ?? []).map((d) => d.aggregate)
}

export function seedSummary(merchantId: string) {
  return repaidSoFar(merchantId)
}
