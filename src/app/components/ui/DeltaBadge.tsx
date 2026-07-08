import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

interface DeltaBadgeProps {
  /** The delta value. Sign determines direction if direction is auto. */
  value: number
  /** Decimal places to render. Default 2. */
  decimals?: number
  /** Render as percent (multiplies by 100 and suffixes '%'). Default true. */
  asPercent?: boolean
  /** Override direction. Default auto-detect from sign. */
  direction?: 'up' | 'down' | 'flat' | 'auto'
  className?: string
}

/**
 * Positive/negative delta pill — e.g. "+0.14% ↗" in green, "-1.2% ↘" in red.
 * Standardized across KPI cards and metric displays.
 */
export function DeltaBadge({
  value,
  decimals = 2,
  asPercent = true,
  direction = 'auto',
  className = '',
}: DeltaBadgeProps) {
  const dir: 'up' | 'down' | 'flat' =
    direction !== 'auto'
      ? direction
      : value > 0 ? 'up'
      : value < 0 ? 'down'
      : 'flat'

  const display = asPercent
    ? `${(value * 100).toFixed(decimals)}%`
    : value.toFixed(decimals)
  const sign = dir === 'up' ? '+' : dir === 'down' ? '' : ''

  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus

  return (
    <span className={`cc-delta ${dir} ${className}`}>
      {sign}{display}
      <Icon className="w-3 h-3" />
    </span>
  )
}
