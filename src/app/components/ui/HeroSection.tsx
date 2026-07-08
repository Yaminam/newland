import { motion } from 'framer-motion'

interface HeroStatPill {
  label: string
  value: string | number
}

interface HeroSectionProps {
  title: string
  subtitle?: string
  eyebrow?: string
  stats?: HeroStatPill[]
  children?: React.ReactNode
  className?: string
}

export function HeroSection({
  title,
  subtitle,
  eyebrow,
  stats,
  children,
  className = '',
}: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`hero-gradient ${className}`}
      style={{ padding: '28px 28px 24px', marginBottom: 20 }}
    >
      {/* Eyebrow */}
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.50)',
            letterSpacing: '1.2px',
            textTransform: 'uppercase' as const,
            marginBottom: 8,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {eyebrow}
        </motion.p>
      )}

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontSize: 'clamp(26px, 4vw, 34px)',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
          lineHeight: 1.15,
          fontFamily: 'var(--font-display)',
          margin: 0,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {title}
      </motion.h1>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.60)',
            marginTop: 8,
            lineHeight: '20px',
            position: 'relative',
            zIndex: 1,
            maxWidth: 480,
          }}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Stat pills row */}
      {stats && stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 24,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="hero-stat-pill">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Custom content slot */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ marginTop: 20, position: 'relative', zIndex: 1 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}
