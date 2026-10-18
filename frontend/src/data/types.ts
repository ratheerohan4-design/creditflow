export type Role = 'merchant' | 'lender' | 'admin'

export type AgreementStatus =
  | 'on_track'
  | 'low_activity'
  | 'at_risk'
  | 'high_risk'
  | 'default'
  | 'paused'
  | 'completed'

export interface Invoice {
  id: string
  period: string
  date: string
  amount: number
  status: 'paid' | 'unpaid'
}

export interface Subscription {
  plan: 'Starter' | 'Growth' | 'Business'
  monthlyFee: number
  status: 'active' | 'lapsed'
  lapsedOn?: string
  nextBillingDate: string
  invoices: Invoice[]
}

export interface Merchant {
  id: string
  name: string
  ownerName: string
  shopType: string
  city: string
  state: string
  phone: string
  upiId: string
  agentName: string
  subscription: Subscription
}

export interface Lender {
  id: string
  name: string
  contactPerson: string
  phone: string
  city: string
  since: string
}

export interface Agreement {
  id: string
  merchantId: string
  lenderId: string
  creditAmount: number
  disbursedDate: string
  startDate: string
  endDate: string
  completedDate?: string
  rate: number
  minDailyFloor: number
  graceDays: number
  penaltyTerms: string
  outstanding: number
  consentDate: string
  onboardingAgent: string
  paused: boolean
}

export type TransactionChannel = 'upi' | 'cash'

export interface Transaction {
  id: string
  agreementId: string
  merchantId: string
  date: string
  iso: string
  channel: TransactionChannel
  amount: number
  repayment: number
  merchantPayout: number
  platformFee: number
  upiRef?: string
  payerHandle?: string
  selfReported: boolean
  status: 'routed' | 'pending'
}

export interface DailyAggregate {
  date: string
  sales: number
  repaymentRouted: number
  merchantReceived: number
  txnCount: number
}

export type AlertType =
  'low_activity' | 'subscription_due' | 'milestone' | 'at_risk' | 'high_risk' | 'default'

export interface Alert {
  id: string
  merchantId: string
  type: AlertType
  title: string
  body: string
  createdAt: string
  read: boolean
  action?: { label: string; to: string }
}

export type RiskAlertStatus = 'new' | 'acknowledged' | 'escalated'

export interface RiskAlert {
  id: string
  merchantId: string
  merchantName: string
  agreementId: string
  type: 'low_activity' | 'at_risk' | 'high_risk' | 'default' | 'no_response'
  severity: 'low' | 'medium' | 'high'
  daysSinceLastPayment: number
  status: RiskAlertStatus
  createdAt: string
  note?: string
}

export type DisputeResolution = 'reverse' | 'uphold' | 'split'

export interface Dispute {
  id: string
  transactionId: string
  merchantId: string
  merchantName: string
  agreementId: string
  reason: string
  description: string
  amount: number
  createdAt: string
  status: 'open' | 'resolved'
  resolution?: DisputeResolution
  splitPercent?: number
  resolvedAt?: string
  resolvedBy?: string
}

export type FeeType = 'platform' | 'subscription' | 'late_fee' | 'onboarding'

export interface FeeEntry {
  id: string
  date: string
  merchantId: string
  merchantName: string
  type: FeeType
  period: string
  amount: number
  status: 'paid' | 'unpaid'
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  actorRole: string
  action: string
  target: string
  detail: string
  ip: string
}

export type LeadStage =
  'lead' | 'contacted' | 'visit' | 'verified' | 'agreement' | 'active'

export interface Lead {
  id: string
  businessName: string
  ownerName: string
  phone: string
  city: string
  stage: LeadStage
  creditEstimate: number
  assignedTo: string
  updatedAt: string
  note: string
}

export interface VerificationItem {
  id: string
  merchantId: string
  merchantName: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'more_docs'
  agentName: string
  gps: { lat: number; lng: number; address: string }
  agentNotes: string
  idType: string
  idNumber: string
  shopPhotos: number
  pendingNote?: string
}

export interface SupportTicket {
  id: string
  merchantId: string
  subject: string
  category: 'payment' | 'qr' | 'billing' | 'agreement'
  createdAt: string
  status: 'open' | 'in_progress' | 'resolved'
  lastUpdate: string
  detail: string
}

export interface QrProfile {
  merchantId: string
  merchantName: string
  upiId: string
  status: 'active' | 'inactive'
  generatedOn: string
  reassignedFrom?: string
}

export interface PlatformStats {
  totalSalesToday: number
  totalRoutedToday: number
  activeAgreements: number
  verificationsPending: number
  openDisputes: number
  routingSuccessRate: number
  reconciliation: 'passed' | 'failed'
  reconciliationAt: string
  defaultRate: number
  exceptionCount: number
  generatedAt: string
}
