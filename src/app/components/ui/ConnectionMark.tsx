interface ConnectionMarkProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Decorative illustration: two nodes linked by a curving arc — visual
 * metaphor for FounderCentral's founder ↔ investor introduction.
 * Painted in the brand blue → green gradient, works in both themes.
 */
export function ConnectionMark({ size = 140, className = '', style }: ConnectionMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden
    >
      <defs>
        <linearGradient id="cc-mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="var(--blue)" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="cc-mark-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="var(--blue)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981"             stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Soft outer ring */}
      <circle
        cx="70" cy="70" r="58"
        stroke="url(#cc-mark-ring)"
        strokeWidth="1.5"
        strokeDasharray="3 5"
      />

      {/* Connecting arc */}
      <path
        d="M 34 92 Q 70 32 106 92"
        stroke="url(#cc-mark-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left node (founder) */}
      <circle cx="34" cy="92" r="11" fill="var(--blue)" />
      <circle cx="34" cy="92" r="4.5" fill="var(--surface)" />

      {/* Right node (investor) */}
      <circle cx="106" cy="92" r="11" fill="#10B981" />
      <circle cx="106" cy="92" r="4.5" fill="var(--surface)" />

      {/* Apex dot */}
      <circle cx="70" cy="38" r="3.5" fill="url(#cc-mark-grad)" />
    </svg>
  )
}
