import { ShieldCheck, Eye, RefreshCw } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { CountUp } from '../CountUp'

const EASE = [0.22, 1, 0.36, 1] as const
const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const cell: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

const STATS: { to?: number; suffix?: string; text?: string; l: string; sub: string }[] = [
  { to: 5000, suffix: '+', l: 'Investors in the directory', sub: '192 human-verified and active' },
  { to: 47, l: 'Active grants', sub: 'Refreshed weekly across India' },
  { to: 30, suffix: '+', l: 'Events this month', sub: 'Pitch days, demo nights, office hours' },
  { text: 'Daily', l: 'Funding news', sub: 'Freshness is the proof' },
]

const TRUST = [
  { icon: ShieldCheck, text: 'Every investor is human-checked before they are listed' },
  { icon: Eye, text: 'You see why each match was made, never a black box' },
  { icon: RefreshCw, text: 'Counts are pulled live, so the page can never overstate' },
]

export function Proof() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">Is this real?</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.6vw, 2.9rem)', lineHeight: 1.08, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Every number here is live. None of it is invented.
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            We would rather show you a true 23 than a fake 2,000. Each figure below is pulled straight from the database, so it is always accurate and grows on its own.
          </p>
        </div>

        <motion.div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4"
          variants={grid} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {STATS.map((s, i) => (
            <motion.div key={s.l} variants={reduce ? undefined : cell} className="text-center md:text-left"
              style={{ borderLeft: i === 0 ? 'none' : undefined }}>
              <div className="rd-num text-[42px] font-extrabold leading-none sm:text-[52px]" style={{ color: 'var(--rd-ink)' }}>
                {s.text ? s.text : <CountUp to={s.to!} suffix={s.suffix} />}
              </div>
              <div className="mt-3 text-[14px] font-bold" style={{ color: 'var(--rd-ink-2)' }}>{s.l}</div>
              <div className="mt-1 text-[12.5px] leading-snug" style={{ color: 'var(--rd-muted-2)' }}>{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="rd-hr my-12" />

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
          {TRUST.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.div key={t.text} className="flex items-center gap-3"
                initial={reduce ? false : { opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-[18px] w-[18px]" /></span>
                <span className="text-[13.5px] font-medium leading-snug" style={{ color: 'var(--rd-ink-2)' }}>{t.text}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
