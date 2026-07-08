import { CheckCircle2, ArrowRight, Send, Mail } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

/**
 * Three animated micro-illustrations for HowItWorks. Each mounts fresh every
 * time its step becomes active (the showcase remounts on step change), so the
 * animation replays on every loop — like a short looping clip of the product.
 */

const EASE = [0.22, 1, 0.36, 1] as const

const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
}
const rise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
}

function useAnim() {
  const reducedMotion = useReducedMotion()
  return {
    reducedMotion,
    initial: reducedMotion ? false : 'hidden',
    animate: reducedMotion ? undefined : 'show',
  } as const
}

export function StepOnePagerMock() {
  const { reducedMotion, initial, animate } = useAnim()
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 8px 20px -12px rgba(15,23,42,0.10)' }}
      variants={stack}
      initial={initial}
      animate={animate}
    >
      <div className="flex items-center gap-1.5 border-b px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#EF4444' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#F59E0B' }} />
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#10B981' }} />
        <span className="ml-2 text-[10px] font-medium" style={{ color: 'var(--muted-2)' }}>
          Your one-pager
        </span>
      </div>

      <div className="space-y-2.5 px-3 py-3">
        <motion.div className="flex items-center gap-2" variants={rise}>
          <div className="h-7 w-7 shrink-0 rounded-md" style={{ background: 'var(--gradient-primary)' }} />
          <div className="flex-1">
            {/* "typing" name bar */}
            <motion.div
              className="h-2 rounded-full"
              style={{ background: 'var(--ink)', opacity: 0.85, maxWidth: 80 }}
              initial={reducedMotion ? false : { width: 0 }}
              animate={{ width: 80 }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
            />
            <motion.div
              className="mt-1 h-1.5 rounded-full"
              style={{ background: 'var(--muted-2)', opacity: 0.45, maxWidth: 56 }}
              initial={reducedMotion ? false : { width: 0 }}
              animate={{ width: 56 }}
              transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
            />
          </div>
          <motion.div
            className="rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider"
            style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.6 }}
          >
            SEED
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <FormField label="Sector" value="FinTech" />
          <FormField label="Geo" value="India" />
          <FormField label="Raise" value="₹6 Cr" />
          <FormField label="Stage" value="Pre-rev" />
        </div>

        <motion.div className="pt-1.5" variants={rise}>
          <div className="mb-1 h-1.5 w-12 rounded-full" style={{ background: 'var(--muted-2)', opacity: 0.4 }} />
          <div className="space-y-1">
            {['100%', '88%', '72%'].map((w, i) => (
              <motion.div
                key={w}
                className="h-1.5 rounded-full"
                style={{ background: 'var(--surface-2)', width: w, transformOrigin: 'left' }}
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.12, ease: EASE }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      className="rounded-md px-2 py-1.5"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
      variants={rise}
    >
      <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
        {label}
      </div>
      <div className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>
        {value}
      </div>
    </motion.div>
  )
}

export function StepMatchingMock() {
  const { reducedMotion, initial, animate } = useAnim()
  const matches = [
    { name: 'Blume Ventures', score: 94, tag: 'Seed-A · ₹4-15 Cr', color: '#06B6D4' },
    { name: 'Kalaari Capital', score: 87, tag: 'Series A · ₹15+ Cr', color: '#10B981' },
    { name: 'Ramesh Patel', score: 82, tag: 'Angel · ₹25-75 L', color: 'var(--warn)' },
  ]
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 8px 20px -12px rgba(15,23,42,0.10)' }}
      variants={stack}
      initial={initial}
      animate={animate}
    >
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
          Matched investors
        </span>
        <motion.span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
          initial={reducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.2 }}
        >
          {matches.length}
        </motion.span>
      </div>
      <div className="space-y-1.5 px-2.5 py-2.5">
        {matches.map((m, i) => (
          <motion.div
            key={m.name}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
            variants={rise}
          >
            <div className="h-7 w-7 shrink-0 rounded-md" style={{ background: m.color, opacity: 0.85 }} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>
                {m.name}
              </div>
              <div className="truncate text-[9px]" style={{ color: 'var(--muted-2)' }}>
                {m.tag}
              </div>
            </div>
            <ScoreRing score={m.score} delay={0.3 + i * 0.18} reducedMotion={!!reducedMotion} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function ScoreRing({ score, delay, reducedMotion }: { score: number; delay: number; reducedMotion: boolean }) {
  const radius = 11
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative h-7 w-7 shrink-0">
      <svg viewBox="0 0 30 30" className="h-7 w-7 -rotate-90">
        <circle cx="15" cy="15" r={radius} stroke="var(--line)" strokeWidth="2.5" fill="none" />
        <motion.circle
          cx="15"
          cy="15"
          r={radius}
          stroke="var(--blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, delay, ease: EASE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[8.5px] font-bold" style={{ color: 'var(--blue)' }}>
        {score}
      </div>
    </div>
  )
}

export function StepIntroMock() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 8px 20px -12px rgba(15,23,42,0.10)' }}
      initial={reducedMotion ? false : 'hidden'}
      animate={reducedMotion ? undefined : 'show'}
    >
      {/* Top: pending state */}
      <div className="px-3 pt-3 pb-2">
        <motion.div
          className="flex items-center gap-2 rounded-lg p-2"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
        >
          <motion.div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            animate={reducedMotion ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Send className="h-3.5 w-3.5" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] font-semibold" style={{ color: 'var(--ink)' }}>
              Intro request sent
            </div>
            <div className="text-[9px]" style={{ color: 'var(--muted-2)' }}>
              Waiting on Blume Ventures
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle: arrow */}
      <motion.div
        className="flex items-center justify-center py-1"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.3 }}
      >
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, 3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-90" style={{ color: 'var(--muted-2)' }} />
        </motion.div>
      </motion.div>

      {/* Bottom: accepted + emails revealed */}
      <div className="px-3 pb-3 pt-1">
        <motion.div
          className="rounded-lg p-2"
          style={{
            background: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 100%)',
            border: '1px solid rgba(16,185,129,0.30)',
          }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.95 }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <motion.div
              initial={reducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 1.15 }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--pos)' }} />
            </motion.div>
            <div className="text-[10.5px] font-semibold" style={{ color: 'var(--ink)' }}>
              Accepted · emails shared
            </div>
          </div>
          <div className="space-y-1 pl-5">
            {['aarav@yourstartup.in', 'karthik@blume.vc'].map((email, i) => (
              <motion.div
                key={email}
                className="flex items-center gap-1.5 text-[9.5px]"
                style={{ color: 'var(--muted)' }}
                initial={reducedMotion ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 1.3 + i * 0.15, ease: EASE }}
              >
                <Mail className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate font-mono">{email}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
