import { motion, useReducedMotion } from 'framer-motion'
import { Sparkles, Mail, ShieldCheck, TrendingUp, Send } from 'lucide-react'
import { type ComponentType } from 'react'

/**
 * 3D-feel floating composition. Uses CSS perspective + rotate3d on layered
 * cards/orbs at different z-depths so the result reads as 3D without any
 * heavy 3D library. Each element drifts independently. Reusable inside
 * dark sections (InvestorsStrip, FinalCTA) where it sits on a navy/blue
 * gradient background.
 *
 * Variants:
 *   "investors"  — tilted "investor" cards with Verified / Active badges
 *   "raise"      — "intro accepted" + "matched" + "deal closed" cards
 *
 * Both share the same scene structure; only card content changes.
 */

type SceneVariant = 'investors' | 'raise'

type FloatingCard = {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
  meta: string
  accent: string
  /** position from center: top%, left% */
  top: string
  left: string
  /** size in px */
  width: number
  /** rotation: rotateY,rotateX in deg */
  rotateY: number
  rotateX: number
  /** translateZ in px (depth) */
  z: number
  /** animation phase + amplitude */
  delay: number
  drift: number
}

const SCENES: Record<SceneVariant, FloatingCard[]> = {
  investors: [
    { id: 'i1', icon: ShieldCheck,  title: 'Verified investor',   meta: 'Seed · ₹2-8 Cr',    accent: '#06B6D4', top: '6%',  left: '4%',  width: 200, rotateY: 12, rotateX: -6, z: 60,  delay: 0,    drift: 8 },
    { id: 'i2', icon: TrendingUp,   title: 'Active in FinTech',   meta: 'Wrote 14 cheques',  accent: '#10B981', top: '54%', left: '0%',  width: 188, rotateY: 16, rotateX: -2, z: 30,  delay: 0.6,  drift: 6 },
    { id: 'i3', icon: Send,         title: 'New intro request',   meta: 'From Aarav · 1m ago', accent: '#F59E0B', top: '8%',  left: '62%', width: 196, rotateY: -14, rotateX: -8, z: 80, delay: 1.2,  drift: 7 },
    { id: 'i4', icon: Sparkles,     title: 'Match score 94',      meta: 'Thesis fit: high',  accent: '#6366F1', top: '60%', left: '54%', width: 200, rotateY: -18, rotateX: -3, z: 50,  delay: 1.8,  drift: 9 },
  ],
  raise: [
    { id: 'r1', icon: Send,         title: 'Intro request sent',  meta: 'To Blume Ventures', accent: '#06B6D4', top: '4%',  left: '6%',  width: 200, rotateY: 12, rotateX: -6, z: 60,  delay: 0,    drift: 8 },
    { id: 'r2', icon: Mail,         title: 'Accepted',             meta: 'Email shared',      accent: '#10B981', top: '52%', left: '2%',  width: 192, rotateY: 16, rotateX: -2, z: 30,  delay: 0.6,  drift: 6 },
    { id: 'r3', icon: Sparkles,     title: '3 new matches',       meta: 'Refreshed today',   accent: '#F59E0B', top: '6%',  left: '60%', width: 196, rotateY: -14, rotateX: -8, z: 80, delay: 1.2,  drift: 7 },
    { id: 'r4', icon: TrendingUp,   title: 'Round on track',      meta: '₹4.2 Cr / ₹6 Cr',   accent: '#6366F1', top: '58%', left: '56%', width: 204, rotateY: -18, rotateX: -3, z: 50,  delay: 1.8,  drift: 9 },
  ],
}

interface Floating3DSceneProps {
  variant?: SceneVariant
  /** Container max-width in px. Default 480. */
  maxWidth?: number
}

export function Floating3DScene({ variant = 'investors', maxWidth = 480 }: Floating3DSceneProps) {
  const reducedMotion = useReducedMotion()
  const cards = SCENES[variant]

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth,
        aspectRatio: '1 / 1',
        perspective: '1400px',
        perspectiveOrigin: '50% 40%',
      }}
    >
      {/* Ambient glow underneath */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(96,165,250,0.22) 0%, rgba(96,165,250,0.06) 40%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Floor grid suggesting 3D space */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: '-10%',
          right: '-10%',
          bottom: '-5%',
          height: '55%',
          transform: 'rotateX(72deg) translateZ(-40px)',
          transformOrigin: '50% 100%',
          background:
            'repeating-linear-gradient(0deg, rgba(96,165,250,0.18) 0 1px, transparent 1px 36px), ' +
            'repeating-linear-gradient(90deg, rgba(96,165,250,0.14) 0 1px, transparent 1px 36px)',
          maskImage: 'linear-gradient(180deg, transparent 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 30%, transparent 100%)',
          opacity: 0.65,
        }}
      />

      {/* Central glowing orb that anchors the scene */}
      <motion.div
        className="absolute"
        style={{
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transformStyle: 'preserve-3d',
        }}
        animate={
          reducedMotion
            ? undefined
            : {
                y: [0, -8, 0, 6, 0],
                rotateZ: [0, 4, 0, -3, 0],
              }
        }
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="rounded-full"
          style={{
            width: 96,
            height: 96,
            background: 'radial-gradient(circle at 30% 30%, #93C5FD 0%, #2563EB 45%, #1E40AF 100%)',
            boxShadow:
              '0 0 60px rgba(37,99,235,0.55), 0 0 0 8px rgba(37,99,235,0.10), 0 30px 50px -10px rgba(0,0,0,0.55), inset 0 -10px 30px rgba(13,27,42,0.45)',
          }}
        />
      </motion.div>

      {/* Floating 3D cards */}
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            className="absolute"
            style={{
              top: card.top,
              left: card.left,
              transformStyle: 'preserve-3d',
            }}
          >
            <motion.div
              style={{
                width: card.width,
                transformStyle: 'preserve-3d',
                transform: `translateZ(${card.z}px) rotateY(${card.rotateY}deg) rotateX(${card.rotateX}deg)`,
              }}
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, -card.drift, 0, card.drift * 0.6, 0],
                      rotateY: [card.rotateY, card.rotateY + (i % 2 === 0 ? 4 : -4), card.rotateY],
                    }
              }
              transition={{
                y: { duration: 6 + i * 0.7, delay: card.delay, repeat: Infinity, ease: 'easeInOut' },
                rotateY: { duration: 9 + i, delay: card.delay, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  background:
                    'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(14px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
                  boxShadow:
                    '0 30px 60px -20px rgba(0,0,0,0.55), 0 12px 24px -8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
                }}
              >
                {/* Top accent strip */}
                <div
                  className="h-[3px] w-full"
                  style={{ background: card.accent, boxShadow: `0 0 18px ${card.accent}` }}
                />
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `${card.accent}22`,
                      color: card.accent,
                      border: `1px solid ${card.accent}55`,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[12.5px] font-bold leading-tight"
                      style={{ color: 'white', letterSpacing: '-0.01em' }}
                    >
                      {card.title}
                    </div>
                    <div
                      className="mt-0.5 truncate text-[10.5px]"
                      style={{ color: 'rgba(255,255,255,0.62)' }}
                    >
                      {card.meta}
                    </div>
                  </div>
                  <div
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: card.accent, boxShadow: `0 0 8px ${card.accent}` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
