interface ProgressRingProps {
  /** Percentage 0–100. */
  value: number
  /** Pixel diameter of the ring. */
  size?: number
  /** Track thickness in pixels. */
  thickness?: number
  /** Foreground stroke — supports CSS var, hex, or gradient id URL. */
  color?: string
  /** Track (background ring) color. */
  trackColor?: string
  /** Start angle in degrees. 0 = top. Default -180 for semi-circle-from-left. */
  startAngle?: number
  /** Sweep angle in degrees. Default 360 for full ring; 180 for semi-gauge. */
  sweep?: number
  /** Label rendered in the center. If omitted, shows `${value}%`. */
  label?: React.ReactNode
  /** Secondary label under the main label. */
  sublabel?: React.ReactNode
  className?: string
}

/**
 * SVG progress ring / semi-gauge.
 *
 * Full ring:  <ProgressRing value={72} />
 * Semi-gauge: <ProgressRing value={72} startAngle={-180} sweep={180} />
 */
export function ProgressRing({
  value,
  size = 140,
  thickness = 10,
  color = 'var(--blue)',
  trackColor = 'var(--surface-2)',
  startAngle = -90,
  sweep = 360,
  label,
  sublabel,
  className = '',
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value)) / 100
  const r = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = (sweep / 360) * (2 * Math.PI * r)
  const dashOffset = circumference * (1 - pct)

  return (
    <div className={className} style={{ position: 'relative', width: size, height: sweep < 360 ? size / 2 + thickness : size }}>
      <svg
        width={size}
        height={sweep < 360 ? size / 2 + thickness : size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${startAngle}deg)`, transformOrigin: 'center' }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: sweep < 360 ? 'flex-end' : 'center',
          paddingBottom: sweep < 360 ? 8 : 0,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: size * 0.22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
          {label ?? `${Math.round(value)}%`}
        </div>
        {sublabel && (
          <div style={{ fontSize: size * 0.09, color: 'var(--muted-2)', marginTop: 4 }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
