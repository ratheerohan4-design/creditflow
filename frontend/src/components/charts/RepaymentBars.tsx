import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyAggregate } from '@/data/types'
import { AXIS_TICK, CHART_COLORS, ChartTooltip, dayTick, moneyTick } from './chartTheme'

interface RepaymentBarsProps {
  data: DailyAggregate[]
  highlightDate?: string
  height?: number
}

export function RepaymentBars({ data, highlightDate, height = 200 }: RepaymentBarsProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
          barCategoryGap="26%"
        >
          <CartesianGrid stroke={CHART_COLORS.line} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickFormatter={dayTick}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.line }}
            interval={Math.max(Math.ceil(data.length / 7) - 1, 0)}
          />
          <YAxis
            tick={AXIS_TICK}
            tickFormatter={moneyTick}
            tickLine={false}
            axisLine={false}
            width={62}
          />
          <Tooltip
            cursor={{ fill: 'rgba(13,43,69,0.05)' }}
            content={
              <ChartTooltip
                titleMap={{
                  repaymentRouted: 'Sent to lender',
                  merchantReceived: 'You received',
                }}
              />
            }
          />
          <Bar dataKey="repaymentRouted" name="repaymentRouted" radius={[3, 3, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  entry.date === highlightDate ? CHART_COLORS.amber : CHART_COLORS.teal
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
