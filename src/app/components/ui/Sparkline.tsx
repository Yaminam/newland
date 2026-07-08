import { Area, AreaChart, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  /** Raw numeric series. */
  data: number[]
  color?: string
  height?: number
  width?: number | string
  /** Fill the area under the line with a soft gradient. */
  filled?: boolean
  className?: string
}

/**
 * Tiny no-chrome area chart. No axes, no grid, no tooltip. Meant to sit
 * inline next to a hero number as a visual mood indicator.
 */
export function Sparkline({
  data,
  color = 'var(--blue)',
  height = 36,
  width = 96,
  filled = true,
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={className} style={{ width, height }} />
  }

  const gradId = `sparkgrad-${Math.random().toString(36).slice(2, 8)}`
  const series = data.map((v, i) => ({ i, v }))

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={color} stopOpacity={filled ? 0.35 : 0} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            fill={filled ? `url(#${gradId})` : 'transparent'}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
