import { useMemo } from 'react'

interface HeroNumberProps {
  /** Integer-or-float value to display. */
  value: number
  /** Optional currency prefix, e.g. "$" or "₹". */
  prefix?: string
  /** Optional unit suffix, e.g. "M", "Cr". */
  suffix?: string
  /** Number of decimal places to render (muted). 0 = no decimal. */
  decimals?: number
  /** Override font size with a rem string, e.g. "3rem". */
  size?: string
  className?: string
}

/**
 * Hero metric number with de-emphasized decimal tail.
 * Example: 57,985.07 renders with "57,985" bold and ".07" muted.
 */
export function HeroNumber({
  value,
  prefix,
  suffix,
  decimals = 0,
  size,
  className = '',
}: HeroNumberProps) {
  const { whole, decimal } = useMemo(() => {
    if (!Number.isFinite(value)) return { whole: '—', decimal: '' }
    const fixed = value.toFixed(Math.max(0, decimals))
    const [w, d] = fixed.split('.')
    const grouped = Number(w).toLocaleString()
    return { whole: grouped, decimal: d ?? '' }
  }, [value, decimals])

  return (
    <div
      className={`cc-hero-number ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {prefix && <span>{prefix}</span>}
      {whole}
      {decimal && <span className="decimal">.{decimal}</span>}
      {suffix && (
        <span style={{ marginLeft: 4, fontSize: '0.6em', color: 'var(--muted-2)' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}
