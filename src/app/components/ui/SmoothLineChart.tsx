import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface LineSeries {
  key: string
  color: string
  /** Fill under the curve as a soft gradient. Defaults to true for first series. */
  fill?: boolean
  label?: string
}

interface SmoothLineChartProps<T extends Record<string, unknown>> {
  data: T[]
  xKey: keyof T & string
  series: LineSeries[]
  height?: number
  /** Optional highlight: renders a frosted callout at the matching xKey value. */
  highlight?: { xValue: string | number; title?: string; value?: string }
}

/**
 * Smooth two-series line chart with gradient area fill under the primary
 * series. No visible gridlines, muted axis labels, no axis lines. Matches
 * the dashboard reference aesthetic.
 */
export function SmoothLineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 240,
  highlight,
}: SmoothLineChartProps<T>) {
  // Compute the x-index of the highlighted point so we can position
  // the callout proportionally.
  const highlightIndex = highlight
    ? data.findIndex(d => d[xKey] === highlight.xValue)
    : -1
  const highlightPct = highlightIndex >= 0 && data.length > 1
    ? (highlightIndex / (data.length - 1)) * 100
    : null

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={s.color} stopOpacity={0.22} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey={xKey as string}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
            padding={{ left: 12, right: 12 }}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
            width={48}
            tickFormatter={v => {
              const n = Number(v)
              if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
              return String(v)
            }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              boxShadow: 'var(--sh-4)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--muted)' }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.25}
              fill={(s.fill ?? i === 0) ? `url(#grad-${s.key})` : 'transparent'}
              fillOpacity={1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--surface)', stroke: s.color }}
            />
          ))}
          {/* Second-series "line only" accent pass for clarity over fills */}
          {series.slice(1).map(s => (
            <Line
              key={`line-${s.key}`}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2.25}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {highlight && highlightPct != null && (
        <div
          className="cc-glass"
          style={{
            position: 'absolute',
            top: 12,
            left: `${highlightPct}%`,
            transform: 'translateX(-50%)',
            padding: '10px 14px',
            minWidth: 92,
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          {highlight.title && (
            <div style={{ fontSize: 10, color: 'var(--muted-2)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 2 }}>
              {highlight.title}
            </div>
          )}
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            {highlight.value ?? ''}
          </div>
        </div>
      )}
    </div>
  )
}
