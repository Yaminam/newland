import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface PillBarChartProps<T extends Record<string, unknown>> {
  data: T[]
  xKey: keyof T & string
  yKey: keyof T & string
  height?: number
  /** Primary bar color. Any bar can be "highlighted" to use accentColor. */
  color?: string
  accentColor?: string
  /** Index (or indexes) of bars to render in accentColor. */
  accentIndexes?: number[]
}

/**
 * Rounded-pill bar chart. Each bar has full rounded top + bottom and
 * floats against the axis. Accent indexes paint in a contrasting color.
 */
export function PillBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  height = 220,
  color = 'var(--blue)',
  accentColor = 'var(--pos)',
  accentIndexes = [],
}: PillBarChartProps<T>) {
  const accentSet = new Set(accentIndexes)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 4 }} barCategoryGap="22%">
        <XAxis
          dataKey={xKey as string}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-2)', fontSize: 11 }}
          width={40}
          tickFormatter={v => {
            const n = Number(v)
            if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
            return String(v)
          }}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-2)', opacity: 0.4 }}
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-4)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
        />
        <Bar dataKey={yKey as string} radius={[14, 14, 14, 14]} maxBarSize={32}>
          {data.map((_, i) => (
            <Cell key={i} fill={accentSet.has(i) ? accentColor : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
