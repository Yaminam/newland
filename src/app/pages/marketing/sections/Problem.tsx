import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useInView, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

type Row =
  | { label: string; type: 'climb'; value: number }
  | { label: string; type: 'replies' }
  | { label: string; type: 'count'; value: number }
  | { label: string; type: 'text'; value: string }

const SCORE: Row[] = [
  { label: 'Cold emails sent', type: 'climb', value: 47 },
  { label: 'Replies', type: 'replies' },
  { label: '“Sounds interesting!”s', type: 'count', value: 6 },
  { label: '“Let’s circle back”s', type: 'count', value: 12 },
  { label: 'DMs left on read', type: 'count', value: 9 },
  { label: 'Runway burned', type: 'text', value: 'plenty' },
]

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }
const item: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }

export function Problem() {
  const reducedMotion = useReducedMotion()
  const boardRef = useRef<HTMLDivElement>(null)
  const inView = useInView(boardRef, { once: true, margin: '-60px' })

  return (
    <section className="border-y" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
      <div className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <motion.p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: 'var(--blue)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              The honest part
            </motion.p>

            <motion.h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 3.8vw, 3rem)', lineHeight: 1.12, letterSpacing: '-0.025em', color: 'var(--ink)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
            >
              Cold outreach is a{' '}
              <span className="relative inline-block" style={{ color: 'var(--neg)' }}>
                slow death.
                <motion.span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 rounded-full"
                  style={{ height: '0.06em', background: 'var(--neg)', transformOrigin: 'left' }}
                  initial={reducedMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
                />
              </span>
            </motion.h2>

            <motion.p
              className="mt-6 max-w-xl text-[16px] leading-relaxed"
              style={{ color: 'var(--muted)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
            >
              You&apos;ve sent the cold emails. You&apos;ve slid into LinkedIn DMs. You&apos;ve asked the
              three investor friends you have if they &ldquo;know someone who might be a fit.&rdquo; They
              didn&apos;t. Meanwhile your runway gets shorter, your deck sits open in another tab, and the
              gap between you and the right investor is one introduction nobody&apos;s making.
            </motion.p>

            <motion.p
              className="mt-7 text-[19px] font-bold leading-snug"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.015em', color: 'var(--ink)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
            >
              Match your stage. Not a spray-and-pray database.
            </motion.p>
          </div>

          {/* Animated "scoreboard" */}
          <motion.div
            ref={boardRef}
            variants={list}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
            className="lg:pl-6"
          >
            <motion.div variants={item} className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2)' }}>
              Your cold outreach, by the numbers
            </motion.div>

            <div className="space-y-3.5">
              {SCORE.map(r => (
                <motion.div key={r.label} variants={item} className="flex items-baseline">
                  <span className="shrink-0 text-[15.5px]" style={{ color: 'var(--muted)' }}>
                    {r.label}
                  </span>
                  <span
                    aria-hidden
                    className="mx-3 flex-1 border-b border-dotted"
                    style={{ borderColor: 'var(--faint)', transform: 'translateY(-4px)' }}
                  />
                  <ScoreValue row={r} inView={inView} reduced={!!reducedMotion} />
                </motion.div>
              ))}
            </div>

            <motion.p variants={item} className="mt-6 text-[14px] italic" style={{ color: 'var(--muted-2)' }}>
              Conversion rate: a heroic 0%.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ScoreValue({ row, inView, reduced }: { row: Row; inView: boolean; reduced: boolean }) {
  if (row.type === 'text') {
    return <span className="shrink-0 font-num font-bold" style={{ fontFamily: 'var(--font-num)', fontSize: '16px', color: 'var(--ink)' }}>{row.value}</span>
  }
  if (row.type === 'replies') return <RepliesValue inView={inView} reduced={reduced} />
  if (row.type === 'climb') return <ClimbValue base={row.value} inView={inView} reduced={reduced} />
  return <CountValue to={row.value} inView={inView} reduced={reduced} />
}

const numStyle = (alert?: boolean) => ({
  fontFamily: 'var(--font-num)',
  fontVariantNumeric: 'tabular-nums' as const,
  fontSize: alert ? '20px' : '16px',
  color: alert ? 'var(--neg)' : 'var(--ink)',
})

function CountValue({ to, inView, reduced }: { to: number; inView: boolean; reduced: boolean }) {
  const [val, setVal] = useState(reduced ? to : 0)
  useEffect(() => {
    if (reduced || !inView) { setVal(to); return }
    const controls = animate(0, to, { duration: 1.1, ease: EASE, onUpdate: v => setVal(Math.round(v)) })
    return () => controls.stop()
  }, [inView, to, reduced])
  return <span className="shrink-0 font-bold" style={numStyle()}>{val}</span>
}

function ClimbValue({ base, inView, reduced }: { base: number; inView: boolean; reduced: boolean }) {
  const [val, setVal] = useState(reduced ? base : 0)
  useEffect(() => {
    if (reduced || !inView) { setVal(base); return }
    const controls = animate(0, base, { duration: 1.1, ease: EASE, onUpdate: v => setVal(Math.round(v)) })
    return () => controls.stop()
  }, [inView, base, reduced])
  useEffect(() => {
    if (reduced || !inView) return
    const t = setInterval(() => setVal(v => v + 1), 2300)
    return () => clearInterval(t)
  }, [inView, reduced])
  return <span className="shrink-0 font-bold" style={numStyle()}>{val}</span>
}

function RepliesValue({ inView, reduced }: { inView: boolean; reduced: boolean }) {
  const [tease, setTease] = useState(false)
  useEffect(() => {
    if (reduced || !inView) return
    const id = setInterval(() => {
      setTease(true)
      setTimeout(() => setTease(false), 1000)
    }, 5200)
    return () => clearInterval(id)
  }, [inView, reduced])
  return (
    <span className="relative shrink-0 font-bold" style={numStyle(true)}>
      0
      <AnimatePresence>
        {tease && (
          <motion.span
            className="absolute -right-1 -top-4 text-[11px] font-bold"
            style={{ color: 'var(--pos)' }}
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            +1?
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
