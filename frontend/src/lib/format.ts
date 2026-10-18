/**
 * Every money figure in the product is shown in full Indian grouping
 * (₹2,30,000). We never shorten to lakhs/crores, because shopkeepers read
 * bank statements in full figures.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const IST = 'Asia/Kolkata'

export function formatMoney(value: number): string {
  return inr.format(Math.round(value))
}

export function formatNumber(value: number): string {
  return plain.format(Math.round(value))
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

export function formatDate(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: IST,
  })
}

export function formatDayMonth(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: IST,
  })
}

export function formatWeekday(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: IST,
  })
}

export function formatTime(value: string | Date): string {
  return toDate(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  })
}

export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)}, ${formatTime(value)} IST`
}

/** Dashboards show how fresh their numbers are, always in IST. */
export function relativeFromNow(value: string | Date): string {
  const diffMs = Date.now() - toDate(value).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

/** Day key in IST, used to bucket transactions into days. */
export function istDateKey(value: string | Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(toDate(value))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function addDaysKey(days: number, from: Date = new Date()): string {
  const d = new Date(from.getTime() + days * 86400000)
  return istDateKey(d)
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T00:00:00Z`).getTime()
  const b = new Date(`${toKey}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86400000)
}

export function keyToDate(key: string): Date {
  return new Date(`${key}T12:00:00+05:30`)
}

export function displayDayKey(key: string): string {
  return formatDayMonth(keyToDate(key))
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value
}
