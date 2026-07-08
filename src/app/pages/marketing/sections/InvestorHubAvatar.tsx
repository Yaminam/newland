import { motion, useReducedMotion } from 'framer-motion'
import { FounderCentralMark } from '@/app/components/FounderCentralMark'

/**
 * Brand-mockup-style hub illustration: dark navy backdrop, concentric rings,
 * avatar circles (gradient + initials, not real photos) distributed around
 * the rings, FounderCentral mark at the center. Designed to live inside the
 * dark InvestorsStrip section.
 */

type Avatar = {
  initials: string
  /** Position relative to center as percentages (50,50 = dead center) */
  top: string
  left: string
  size: number
  gradient: string
  delay: number
}

const AVATARS: Avatar[] = [
  { initials: 'BV', top: '12%', left: '78%', size: 56, gradient: 'linear-gradient(135deg,#06B6D4,#0891B2)', delay: 0 },
  { initials: 'KC', top: '36%', left: '92%', size: 48, gradient: 'linear-gradient(135deg,#10B981,#2563EB)', delay: 0.6 },
  { initials: 'RP', top: '68%', left: '82%', size: 52, gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', delay: 1.2 },
  { initials: 'AL', top: '74%', left: '20%', size: 50, gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', delay: 1.8 },
  { initials: 'SS', top: '32%', left: '8%',  size: 54, gradient: 'linear-gradient(135deg,#6366F1,#1D4ED8)', delay: 2.4 },
]

export function InvestorHubAvatar() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 460, aspectRatio: '1 / 1' }}>
      {/* Concentric rings */}
      {[
        { size: 96, opacity: 0.30 },
        { size: 64, opacity: 0.22 },
        { size: 42, opacity: 0.18 },
        { size: 22, opacity: 0.12 },
      ].map((ring, i) => (
        <motion.div
          key={ring.size}
          aria-hidden
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: '50%',
            width: `${ring.size}%`,
            height: `${ring.size}%`,
            transform: 'translate(-50%, -50%)',
            border: `1px dashed rgba(96, 165, 250, ${ring.opacity})`,
          }}
          animate={
            reducedMotion
              ? undefined
              : {
                  rotate: i % 2 === 0 ? 360 : -360,
                  scale: [1, 1.015, 1],
                }
          }
          transition={{
            rotate: { duration: 80 + i * 30, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}

      {/* Connection lines from center to each avatar */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="hub-avatar-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {AVATARS.map((a, i) => {
          // Convert percentage strings to numbers for SVG line endpoints
          const x = parseFloat(a.left)
          const y = parseFloat(a.top)
          return (
            <line
              key={a.initials}
              x1={50}
              y1={50}
              x2={x}
              y2={y}
              stroke="url(#hub-avatar-line)"
              strokeWidth="0.3"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-opacity"
                values="0.4;1;0.4"
                dur={`${3.5 + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </line>
          )
        })}
      </svg>

      {/* Center hub — FounderCentral mark with glow */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        animate={
          reducedMotion
            ? undefined
            : {
                scale: [1, 1.04, 1],
              }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 86,
            height: 86,
            background: 'linear-gradient(135deg,#2563EB 0%,#1E40AF 100%)',
            boxShadow:
              '0 0 0 6px rgba(37,99,235,0.18), 0 0 0 14px rgba(37,99,235,0.08), 0 18px 40px -10px rgba(37,99,235,0.55)',
          }}
        >
          <FounderCentralMark size={42} />
        </div>
      </motion.div>

      {/* Avatar circles around the rings */}
      {AVATARS.map(a => (
        <div
          key={a.initials}
          className="absolute"
          style={{
            top: a.top,
            left: a.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="flex items-center justify-center rounded-full font-bold text-white"
            style={{
              width: a.size,
              height: a.size,
              background: a.gradient,
              border: '2px solid rgba(255,255,255,0.20)',
              boxShadow:
                '0 12px 30px -8px rgba(0,0,0,0.55), 0 0 0 4px rgba(15,35,60,0.6)',
              fontSize: a.size * 0.32,
              letterSpacing: '0.02em',
            }}
            animate={
              reducedMotion
                ? undefined
                : {
                    y: [0, -5, 0, 4, 0],
                  }
            }
            transition={{
              duration: 5 + a.delay,
              delay: a.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {a.initials}
          </motion.div>
        </div>
      ))}

      {/* Soft radial glow behind the whole thing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.05) 40%, transparent 70%)',
        }}
      />
    </div>
  )
}
