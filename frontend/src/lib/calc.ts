import type { Agreement, DailyAggregate } from '@/data/types'
import { daysBetween } from '@/lib/format'

/** CreditFlow earns a flat cut on every routed sale, capped so small sales stay fair. */
export const PLATFORM_FEE_RATE = 0.01
export const PLATFORM_FEE_CAP = 20

export function platformFeeFor(saleAmount: number): number {
  if (saleAmount <= 0) return 0
  return Math.min(Math.round(saleAmount * PLATFORM_FEE_RATE), PLATFORM_FEE_CAP)
}

/** The rule every screen must follow: repayment = min(amount x rate, outstanding). */
export function repaymentFor(
  saleAmount: number,
  rate: number,
  outstanding: number,
): number {
  if (saleAmount <= 0 || outstanding <= 0) return 0
  return Math.min(Math.round(saleAmount * rate), Math.max(outstanding, 0))
}

export interface PaymentSplit {
  repayment: number
  merchantPayout: number
  platformFee: number
}

/** merchant payout = amount - repayment - platform fee */
export function splitPayment(
  saleAmount: number,
  rate: number,
  outstanding: number,
): PaymentSplit {
  const repayment = repaymentFor(saleAmount, rate, outstanding)
  const platformFee = repayment > 0 ? platformFeeFor(saleAmount) : 0
  const merchantPayout = Math.max(saleAmount - repayment - platformFee, 0)
  return { repayment, merchantPayout, platformFee }
}

export function repaidTotal(creditAmount: number, outstanding: number): number {
  return Math.max(creditAmount - outstanding, 0)
}

export function repaidPercent(creditAmount: number, outstanding: number): number {
  if (creditAmount <= 0) return 0
  return Math.min((repaidTotal(creditAmount, outstanding) / creditAmount) * 100, 100)
}

export type RepaymentState =
  | 'on_track'
  | 'low_activity'
  | 'at_risk'
  | 'high_risk'
  | 'default'
  | 'paused'
  | 'completed'

export interface StateInput {
  outstanding: number
  creditAmount: number
  daysSinceLastPayment: number
  paceRatio: number
  daysBelowPace: number
  paused: boolean
}

/** Alert ladder from the product spec, evaluated on the client from the daily series. */
export function evaluateState(input: StateInput): RepaymentState {
  if (input.outstanding <= 0) return 'completed'
  if (input.paused) return 'paused'
  if (input.daysSinceLastPayment >= 21) return 'default'
  if (input.paceRatio < 0.5 && input.daysBelowPace >= 14) return 'high_risk'
  if (input.paceRatio < 0.7 && input.daysBelowPace >= 7) return 'at_risk'
  if (input.daysSinceLastPayment >= 3) return 'low_activity'
  return 'on_track'
}

export interface SeriesStats {
  state: RepaymentState
  daysSinceLastPayment: number
  paceRatio: number
  daysBelowPace: number
  avgDailySales: number
  baselineDailySales: number
  todaySales: number
  todayRepayment: number
  weekRepayment: number
  monthRepayment: number
  projectedCompletionDays: number | null
}

export function analyseSeries(
  series: DailyAggregate[],
  agreement: Pick<Agreement, 'creditAmount' | 'rate' | 'outstanding' | 'paused'>,
): SeriesStats {
  const ordered = [...series].sort((a, b) => (a.date < b.date ? -1 : 1))
  const today = ordered[ordered.length - 1]
  const todayKey = today?.date ?? ''

  let daysSinceLastPayment = 0
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i].sales > 0) {
      daysSinceLastPayment = daysBetween(ordered[i].date, todayKey)
      break
    }
    daysSinceLastPayment = daysBetween(ordered[i].date, todayKey)
  }

  const last30 = ordered.slice(-30)
  const activeDays = last30.filter((d) => d.sales > 0).length || 1
  const avgDailySales =
    last30.reduce((sum, d) => sum + d.sales, 0) / Math.max(activeDays, 1)

  // Pace is measured against the shop's own habit before the current week,
  // so a slow fortnight shows up instead of quietly lowering the target.
  const baselineWindow = ordered.slice(-30, -7)
  const baselineActive = baselineWindow.filter((d) => d.sales > 0).length || 1
  const baselineDailySales =
    baselineWindow.reduce((sum, d) => sum + d.sales, 0) / Math.max(baselineActive, 1)
  const expectedDailyRepayment = Math.max(baselineDailySales * agreement.rate, 1)
  const last7 = ordered.slice(-7)
  const actualDailyRepayment =
    last7.reduce((sum, d) => sum + d.repaymentRouted, 0) / Math.max(last7.length, 1)
  const paceRatio = actualDailyRepayment / expectedDailyRepayment

  let daysBelowPace = 0
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (
      ordered[i].sales > 0 &&
      ordered[i].repaymentRouted < 0.7 * expectedDailyRepayment
    ) {
      daysBelowPace++
    } else {
      break
    }
  }

  const week = ordered.slice(-7)
  const month = ordered.slice(-30)
  const todayRepayment = today?.repaymentRouted ?? 0

  const dailyRepaymentCapacity = Math.max(avgDailySales * agreement.rate, 50)
  const projectedCompletionDays =
    agreement.outstanding > 0 && avgDailySales > 0
      ? Math.ceil(agreement.outstanding / dailyRepaymentCapacity)
      : null

  return {
    state: evaluateState({
      outstanding: agreement.outstanding,
      creditAmount: agreement.creditAmount,
      daysSinceLastPayment,
      paceRatio,
      daysBelowPace,
      paused: agreement.paused,
    }),
    daysSinceLastPayment,
    paceRatio,
    daysBelowPace,
    avgDailySales,
    baselineDailySales,
    todaySales: today?.sales ?? 0,
    todayRepayment,
    weekRepayment: week.reduce((sum, d) => sum + d.repaymentRouted, 0),
    monthRepayment: month.reduce((sum, d) => sum + d.repaymentRouted, 0),
    projectedCompletionDays,
  }
}

export function milestoneFor(percent: number): 25 | 50 | 75 | 100 | null {
  for (const mark of [100, 75, 50, 25] as const) {
    if (percent >= mark && percent < mark + 4) return mark
  }
  return null
}

/** Estimates days to repay for a sample daily sales figure, used while drafting agreements. */
export function estimatedDaysToRepay(
  creditAmount: number,
  rate: number,
  sampleDailySales: number,
): number {
  const daily = Math.max(sampleDailySales * rate, 1)
  return Math.ceil(creditAmount / daily)
}
