import { useState, type ComponentType, type ReactNode } from 'react'
import { Target, ShieldCheck, Handshake, Landmark, TrendingUp, CalendarDays, Users2, Bot } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

type Feature = { icon: ComponentType<{ className?: string }>; title: string; body: string }

const FEATURES: Feature[] = [
  { icon: Target, title: 'Smart matching', body: 'Ranked by fit, not by who scraped the most profiles.' },
  { icon: ShieldCheck, title: 'Verified investors', body: 'Real, active cheque-writers. Not a graveyard of dead funds.' },
  { icon: Handshake, title: 'Warm intros', body: 'Request, accept, email. The whole flow fits in one breath.' },
  { icon: Landmark, title: 'Govt grants', body: 'Every Indian grant you might qualify for. We read the fine print so you don’t.' },
  { icon: TrendingUp, title: 'Funding tracker', body: 'Who’s raising, who’s writing cheques, who quietly folded.' },
  { icon: CalendarDays, title: 'Events', body: 'Pitch nights and office hours, filtered to your stage and city.' },
  { icon: Users2, title: 'Co-invest', body: 'Find investors backing the same round. Split the diligence, close faster.' },
  { icon: Bot, title: 'Ask AI', body: 'An AI that’s read your deck and your market. Useful, occasionally brutal.' },
]

export function Features() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const current = FEATURES[active]
  const ActiveIcon = current.icon

  const hl = (i: number, label: ReactNode) => {
    const isActive = i === active
    return (
      <button
        type="button"
        onMouseEnter={() => setActive(i)}
        onFocus={() => setActive(i)}
        className="relative isolate inline-block cursor-pointer bg-transparent font-bold transition-transform duration-200 hover:-translate-y-[2px]"
        style={{ color: 'var(--blue)' }}
      >
        {/* Highlighter marker slides between words */}
        {isActive && (
          <motion.span
            layoutId="feat-marker"
            aria-hidden
            className="absolute z-0 rounded-[0.3em]"
            style={{
              inset: '0.04em -0.18em 0.02em',
              background: 'var(--blue-bg)',
              boxShadow: 'inset 0 -0.42em 0 rgba(147,197,253,0.28)',
            }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </button>
    )
  }

  return (
    <section id="features" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%)' }}>
      {/* faint editorial texture */}
      <div aria-hidden className="cc-pattern-dots pointer-events-none absolute inset-0 opacity-[0.25]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-24 lg:py-28">
        {/* eyebrow row */}
        <motion.div
          className="mb-10 flex items-center gap-4"
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            What you actually get
          </span>
          <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--blue-l), transparent)' }} />
          <span className="hidden text-[12px] font-medium sm:inline" style={{ color: 'var(--muted-2)' }}>
            ✶ poke the glowing words
          </span>
        </motion.div>

        {/* manifesto */}
        <motion.p
          className="max-w-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 3vw, 2.8rem)',
            lineHeight: 1.34,
            letterSpacing: '-0.022em',
            fontWeight: 700,
            color: 'var(--ink-2)',
          }}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          We rank the {hl(0, 'matches')} worth your time, background-check the {hl(1, 'investors')} so you
          don’t have to, turn cold emails into {hl(2, 'warm intros')}, dig up every {hl(3, 'grant')} with your
          name on it, keep tabs on who’s {hl(4, 'funding')} whom, round up the {hl(5, 'events')} actually
          worth the commute, make {hl(6, 'co-investing')} refreshingly simple, then hand you an{' '}
          {hl(7, 'AI')} that’s read your deck and won’t sugar-coat a thing.
        </motion.p>

        {/* detail appears below on hover */}
        <div className="mt-16 border-t pt-9" style={{ borderColor: 'var(--line)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.title}
              className="flex items-center gap-4 sm:gap-5"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <span
                className="hidden shrink-0 font-bold tabular-nums sm:block"
                style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1, color: 'var(--blue-l)' }}
              >
                {String(active + 1).padStart(2, '0')}
                <span style={{ fontSize: '1rem', color: 'var(--muted-2)' }}> / 08</span>
              </span>

              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 30px -10px rgba(96,165,250,0.5)' }}
              >
                <ActiveIcon className="h-6 w-6" />
              </span>

              <p className="text-[16px] leading-relaxed sm:text-[18px]" style={{ color: 'var(--muted)' }}>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>{current.title}.</span>{' '}
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
