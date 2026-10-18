import type { ReactNode } from 'react'
import { formatDayMonth, formatMoney } from '@/lib/format'

export const CHART_COLORS = {
  navy: '#0D2B45',
  teal: '#0A4A5C',
  tealLight: '#4E8FA3',
  amber: '#F5A623',
  line: '#E3E6EC',
  muted: '#5B6475',
}

export const AXIS_TICK = {
  fill: CHART_COLORS.muted,
  fontSize: 11,
}

export function moneyTick(value: number) {
  return formatMoney(value)
}

export function dayTick(value: string) {
  return formatDayMonth(`${value}T12:00:00+05:30`)
}

interface PayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: PayloadItem[]
  label?: string
  titleMap?: Record<string, string>
}

export function ChartTooltip({ active, payload, label, titleMap }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="border-line bg-surface rounded-[6px] border px-3 py-2 shadow-[0_6px_20px_rgba(13,43,69,0.14)]">
      <p className="text-navy mb-1 text-[12px] font-semibold">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="text-muted flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-[2px]"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              {titleMap?.[String(item.dataKey)] ?? item.name}
            </span>
            <span className="text-ink font-semibold tabular-nums">
              {formatMoney(Number(item.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LegendLabel({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="text-muted flex items-center gap-1.5 text-[12px]">
      <span
        className="inline-block h-2 w-2 rounded-[2px]"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}
