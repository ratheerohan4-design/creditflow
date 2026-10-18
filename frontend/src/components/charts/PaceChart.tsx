import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AXIS_TICK,
  CHART_COLORS,
  ChartTooltip,
  LegendLabel,
  dayTick,
  moneyTick,
} from './chartTheme'

interface PacePoint {
  date: string
  expected: number
  actual: number
}

export function PaceChart({
  data,
  height = 220,
}: {
  data: PacePoint[]
  height?: number
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4">
        <LegendLabel color={CHART_COLORS.amber}>Expected repayment</LegendLabel>
        <LegendLabel color={CHART_COLORS.teal}>Received so far</LegendLabel>
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
            barGap={2}
          >
            <CartesianGrid stroke={CHART_COLORS.line} vertical={false} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              tickFormatter={dayTick}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.line }}
              interval={Math.max(Math.ceil(data.length / 6) - 1, 0)}
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
                  titleMap={{ expected: 'Expected', actual: 'Received so far' }}
                />
              }
            />
            <Bar
              dataKey="expected"
              name="expected"
              fill={CHART_COLORS.amber}
              radius={[3, 3, 0, 0]}
              barSize={10}
            />
            <Bar
              dataKey="actual"
              name="actual"
              fill={CHART_COLORS.teal}
              radius={[3, 3, 0, 0]}
              barSize={10}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
