import { useEffect, useState, type MouseEvent } from 'react'
import {
  CheckCircle2,
  Sparkles,
  Search,
  Send,
  Mail,
  PartyPopper,
  Loader2,
  Zap,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'
import { useCoarsePointer } from '../lib/useCoarsePointer'

type Match = {
  name: string
  tag: string
  initials: string
  hue: string
  score: number
}

const MATCHES: Match[] = [
  { name: 'Sequoia Surge',    tag: 'Seed · ₹2-8 Cr',     initials: 'SS', hue: '#6366F1', score: 96 },
  { name: 'Blume Ventures',   tag: 'Seed-A · ₹4-15 Cr',  initials: 'BV', hue: '#06B6D4', score: 92 },
  { name: 'Ramesh Patel',     tag: 'Angel · ₹25-75 L',   initials: 'RP', hue: '#F59E0B', score: 88 },
  { name: 'Kalaari Capital',  tag: 'Series A · ₹15+ Cr', initials: 'KC', hue: '#10B981', score: 81 },
]

const TOP = MATCHES[0]
const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Looping product demo timeline (ms per step). Steps:
 *   0      scanning
 *   1-4    matches pop in one at a time
 *   5      top match selected + "Request intro"
 *   6      intro request sent
 *   7      investor accepted
 *   8      connected over email
 */
const TIMELINE = [1300, 900, 900, 900, 1050, 1700, 1500, 2000, 2600]

export function HubVisual() {
  const reducedMotion = useReducedMotion()
  const coarse = useCoarsePointer()
  const flat = !!reducedMotion || coarse
  const [step, setStep] = useState(reducedMotion ? 4 : 0)
  const [showToast, setShowToast] = useState(false)

  // 3D cursor tilt — flat at rest, tilts toward the cursor (desktop only).
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const springCfg = { stiffness: 150, damping: 18, mass: 0.4 }
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), springCfg)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), springCfg)

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (flat) return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function handleLeave() {
    mx.set(0)
    my.set(0)
  }

  // Advance through the timeline, looping forever.
  useEffect(() => {
    if (reducedMotion) return
    const t = setTimeout(() => setStep(s => (s + 1) % TIMELINE.length), TIMELINE[step])
    return () => clearTimeout(t)
  }, [step, reducedMotion])

  // Pop a toast as each new match (steps 1-4) lands.
  useEffect(() => {
    if (reducedMotion || step < 1 || step > 4) return
    setShowToast(true)
    const t = setTimeout(() => setShowToast(false), 1100)
    return () => clearTimeout(t)
  }, [step, reducedMotion])

  const visibleCount = Math.min(step, 4)
  const visible = MATCHES.slice(0, visibleCount)
  const scanning = !reducedMotion && step === 0
  const topSelected = step >= 5
  const latest = step >= 1 && step <= 4 ? MATCHES[step - 1] : null

  return (
    <div className="relative mx-auto" style={{ maxWidth: 560, perspective: 1400 }}>
      {/* Glow behind the panel */}
      {!reducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10"
          style={{
            background: 'radial-gradient(closest-side, rgba(37,99,235,0.20), transparent 75%)',
            filter: 'blur(10px)',
          }}
          animate={{ opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Idle float wrapper */}
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* 3D tilt layer */}
        <motion.div
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          style={flat ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative"
        >
          {/* ── Floating 3D popups (sit above the card on the Z axis) ── */}
          <AnimatePresence>
            {!reducedMotion && step >= 1 && (
              <motion.div
                key="live-pop"
                className="absolute -left-5 top-10 z-30 hidden lg:flexitems-center gap-1.5 rounded-full px-3 py-2"
                style={{
                  background: 'white',
                  border: '1px solid var(--line)',
                  boxShadow: '0 18px 40px -10px rgba(15,23,42,0.35)',
                  z: 70,
                }}
                initial={{ opacity: 0, scale: 0.6, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                <Zap className="h-3.5 w-3.5" style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                <span className="text-[11.5px] font-bold" style={{ color: 'var(--ink)' }}>
                  Live matching
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {topSelected && (
              <motion.div
                key="score-pop"
                className="absolute -right-6 top-4 z-30 hidden lg:flexh-[74px] w-[74px] flex-col items-center justify-center rounded-2xl"
                style={{
                  background: 'var(--gradient-primary)',
                  color: 'white',
                  boxShadow: '0 22px 48px -12px rgba(37,99,235,0.6)',
                  z: 95,
                }}
                initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ type: 'spring', stiffness: 340, damping: 18 }}
              >
                <span className="text-[20px] font-extrabold leading-none">{TOP.score}%</span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider opacity-90">
                  Top fit
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 7 && (
              <motion.div
                key="accept-pop"
                className="absolute -bottom-4 -left-4 z-30 hidden lg:flexitems-center gap-1.5 rounded-full px-3 py-2"
                style={{
                  background: 'var(--pos)',
                  color: 'white',
                  boxShadow: '0 18px 40px -10px rgba(22,163,74,0.5)',
                  z: 85,
                }}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 340, damping: 18 }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[11.5px] font-bold">Intro accepted</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── The card ── */}
          <div
            className="relative w-full overflow-hidden rounded-[28px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.96) 100%)',
              border: '1px solid var(--line)',
              boxShadow:
                '0 40px 90px -30px rgba(15,23,42,0.24), 0 10px 28px -8px rgba(15,23,42,0.10)',
            }}
          >
            <div className="cc-pattern-dots pointer-events-none absolute inset-0 opacity-[0.25]" aria-hidden />

            {/* Floating "new match" toast */}
            <AnimatePresence>
              {showToast && latest && (
                <motion.div
                  key={latest.name}
                  className="absolute left-1/2 top-3.5 z-20 flex items-center gap-2 rounded-full px-3.5 py-2"
                  style={{
                    background: 'var(--ink)',
                    color: 'white',
                    boxShadow: '0 14px 34px -8px rgba(15,23,42,0.5)',
                    x: '-50%',
                  }}
                  initial={{ opacity: 0, y: -18, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 26 }}
                >
                  <CheckCircle2 className="h-4 w-4" style={{ color: '#4ADE80' }} />
                  <span className="text-[12.5px] font-semibold">New match · {latest.name}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative p-6 sm:p-7">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>
                    Your investor matches
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider"
                  style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {!reducedMotion && (
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
                        style={{ background: 'var(--pos)' }}
                      />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pos)' }} />
                  </span>
                  Live
                </span>
              </div>

              {/* Founder profile bar */}
              <div
                className="relative mt-5 overflow-hidden rounded-2xl p-5"
                style={{ background: 'var(--gradient-primary)', color: 'white' }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] opacity-80">
                      Your profile
                    </div>
                    <div className="mt-1 text-[17px] font-bold leading-tight">Stage: Seed</div>
                    <div className="text-[12px] opacity-90">FinTech · India</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider opacity-80">Raising</div>
                    <div className="text-[21px] font-bold leading-tight">₹6 Cr</div>
                  </div>
                </div>
              </div>

              {/* Match list — fixed height so the panel never jumps */}
              <div className="relative mt-4" style={{ minHeight: 296 }}>
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      className="absolute inset-x-0 top-0 flex items-center gap-3 rounded-2xl px-4 py-4"
                      style={{ background: 'var(--surface)', border: '1px dashed var(--line)', color: 'var(--muted)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                        className="flex h-5 w-5 items-center justify-center"
                      >
                        <Search className="h-4 w-4" style={{ color: 'var(--blue)' }} />
                      </motion.div>
                      <span className="text-[13.5px] font-medium">Scanning investors that fit your stage…</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {visible.map(m => {
                      const isTop = m.name === TOP.name
                      const highlight = topSelected && isTop
                      return (
                        <motion.div
                          key={m.name}
                          layout
                          className="flex items-center gap-3.5 rounded-2xl px-4 py-3"
                          style={{
                            background: highlight ? 'var(--blue-bg)' : 'var(--surface)',
                            border: `1px solid ${highlight ? 'var(--blue)' : 'var(--line)'}`,
                            boxShadow: highlight ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                          }}
                          initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white"
                            style={{ background: m.hue }}
                          >
                            {m.initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                              <span className="truncate">{m.name}</span>
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                            </div>
                            <div className="truncate text-[12px]" style={{ color: 'var(--muted-2)' }}>
                              {m.tag}
                            </div>
                          </div>

                          <div className="shrink-0 text-right" style={{ width: 72 }}>
                            <div className="text-[13px] font-bold" style={{ color: 'var(--blue)' }}>
                              {m.score}%
                            </div>
                            <div
                              className="mt-1 h-2 w-full overflow-hidden rounded-full"
                              style={{ background: 'var(--surface-3)' }}
                            >
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'var(--gradient-primary)' }}
                                initial={reducedMotion ? false : { width: 0 }}
                                animate={{ width: `${m.score}%` }}
                                transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action footer */}
              <div className="relative mt-4" style={{ minHeight: 58 }}>
                <AnimatePresence mode="wait">
                  <Footer key={footerKey(step)} step={step} reducedMotion={!!reducedMotion} />
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Caption strip below visual */}
      <div
        className="mx-auto mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--pos)' }} />
        Ranked by fit: stage, cheque size &amp; thesis
      </div>
    </div>
  )
}

function footerKey(step: number): string {
  if (step >= 8) return 'connected'
  if (step === 7) return 'accepted'
  if (step === 6) return 'requested'
  if (step === 5) return 'select'
  return 'finding'
}

function Footer({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const fade = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.3, ease: EASE },
  }

  if (step === 5) {
    return (
      <motion.div {...fade} className="flex items-center justify-between gap-3">
        <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          Best fit: <strong style={{ color: 'var(--ink)' }}>{TOP.name}</strong>
        </span>
        <motion.span
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white"
          style={{ background: 'var(--gradient-primary)' }}
          animate={reducedMotion ? undefined : { scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Send className="h-3.5 w-3.5" />
          Request intro
        </motion.span>
      </motion.div>
    )
  }

  if (step === 6) {
    return (
      <motion.div
        {...fade}
        className="flex items-center gap-2.5 rounded-xl px-4 py-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
      >
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--blue)' }} />
        <span className="text-[12.5px] font-medium">Intro request sent to {TOP.name}…</span>
      </motion.div>
    )
  }

  if (step === 7) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        className="flex items-center gap-2.5 rounded-xl px-4 py-3"
        style={{ background: 'var(--pos-bg)', border: '1px solid #BBF7D0', color: 'var(--pos)' }}
      >
        <PartyPopper className="h-4 w-4" />
        <span className="text-[12.5px] font-semibold">{TOP.name} accepted your intro request!</span>
      </motion.div>
    )
  }

  if (step >= 8) {
    return (
      <motion.div
        {...fade}
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        style={{ background: 'var(--ink)', color: 'white' }}
      >
        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
          <Mail className="h-4 w-4" style={{ color: '#4ADE80' }} />
          You&apos;re connected, say hello
        </span>
        <span className="rounded-md px-2 py-1 text-[10.5px] font-medium" style={{ background: 'rgba(255,255,255,0.14)' }}>
          intro@sequoia.vc
        </span>
      </motion.div>
    )
  }

  return (
    <motion.div {...fade} className="flex items-center gap-2.5 px-1" style={{ color: 'var(--muted-2)' }}>
      <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--blue)' }} />
      <span className="text-[12.5px] font-medium">Ranking the investors most likely to back you…</span>
    </motion.div>
  )
}
