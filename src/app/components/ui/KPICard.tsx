import { motion } from 'framer-motion'
import { HeroNumber } from './HeroNumber'
import { DeltaBadge } from './DeltaBadge'
import { Sparkline } from './Sparkline'

export type KPIVariant = 'default' | 'hero'

interface KPICardProps {
  icon: React.ElementType
  label: string
  value: string | number
  numericValue?: number
  sub?: string
  color?: string
  delay?: number
  variant?: KPIVariant
  delta?: number
  trend?: number[]
}

export function KPICard({
  icon: Icon,
  label,
  value,
  numericValue,
  sub,
  color = 'var(--blue)',
  delay = 0,
  variant = 'default',
  delta,
  trend,
}: KPICardProps) {
  const isHero = variant === 'hero'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={isHero ? 'hero-gradient cc-kpi-hero' : 'card'}
      style={{
        padding: '20px',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative accent line at top for default variant */}
      {!isHero && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 20,
            right: 20,
            height: 2,
            background: `linear-gradient(90deg, ${color}, transparent)`,
            borderRadius: '0 0 2px 2px',
            opacity: 0.4,
          }}
        />
      )}

      {/* Icon */}
      <div
        className="flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: isHero ? 'rgba(255,255,255,0.12)' : `color-mix(in srgb, ${color} 10%, transparent)`,
          marginBottom: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Icon style={{ width: 18, height: 18, color: isHero ? '#FFFFFF' : color }} />
      </div>

      {/* Value — numeric style matching mobile */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: 6 }}>
        {numericValue !== undefined ? (
          <HeroNumber value={numericValue} size="1.5rem" className="mb-0" />
        ) : typeof value === 'number' ? (
          <HeroNumber value={value} size="1.5rem" className="mb-0" />
        ) : (
          <p
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              color: isHero ? '#FFFFFF' : 'var(--ink)',
              fontFamily: 'var(--font-num)',
              fontVariantNumeric: 'tabular-nums',
              margin: 0,
              lineHeight: 1,
            }}
          >
            {value}
          </p>
        )}
      </div>

      {/* Label — overline style matching mobile */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase' as const,
          color: isHero ? 'rgba(255,255,255,0.65)' : 'var(--muted-2)',
          margin: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {label}
      </p>

      {/* Delta + trend row */}
      {(delta !== undefined || (trend && trend.length > 1)) && (
        <div className="flex items-center gap-2 mt-3" style={{ position: 'relative', zIndex: 1 }}>
          {delta !== undefined && <DeltaBadge value={delta} />}
          {trend && trend.length > 1 && (
            <Sparkline data={trend} color={isHero ? '#FFFFFF' : color} height={28} width={64} />
          )}
        </div>
      )}

      {/* Sub text */}
      {sub && (
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isHero ? 'rgba(255,255,255,0.70)' : 'var(--muted-2)',
            marginTop: 6,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {sub}
        </p>
      )}
    </motion.div>
  )
}
