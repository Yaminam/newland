import { Check, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { AUDIENCES, TONE, type Audience } from '../audiences'

const EASE = [0.22, 1, 0.36, 1] as const
const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } }
const cell: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/* Value points taken verbatim from FounderCentral's own audience pages. */
const POINTS: Record<Audience, string[]> = {
  founders: ['Investors ranked by fit, with reasons shown', 'One-click warm intros, both sides opt in', 'Grants, events and the funding feed'],
  investors: ['Pre-qualified founders, vetted upstream', 'Structured one-pagers, comparable like for like', 'Signal, not noise. Your inbox stays an inbox'],
  incubators: ['Cohort dashboard: stage, ask, readiness', 'Send curated intros on their behalf', 'Pipeline visibility, every deal to close'],
}

// Each card jumps to that audience's own full section further down the page.
const TARGET: Record<Audience, string> = { founders: '#for-founders', investors: '#for-investors', incubators: '#for-incubators' }

export function Audiences() {
  const reduce = useReducedMotion()

  const go = (a: Audience) => {
    document.querySelector(TARGET[a])?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section id="who-its-for" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">Who it’s for</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Built for all three sides of the table.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            FounderCentral is a network, not a directory. Founders, investors and programs each get their own front door, and every introduction needs both sides to say yes.
          </p>
        </div>

        <motion.div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3"
          variants={reduce ? undefined : grid} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {(Object.keys(AUDIENCES) as Audience[]).map(k => {
            const a = AUDIENCES[k]
            const t = TONE[k]
            const Icon = a.icon
            return (
              <motion.div key={k} variants={reduce ? undefined : cell} whileHover={reduce ? undefined : { y: -6 }}
                className="flex flex-col rounded-2xl p-6"
                style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}>
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.c, border: `1px solid ${t.br}` }}>
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', letterSpacing: '-0.015em', color: 'var(--rd-ink)' }}>{a.tab}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
                  {a.headLead} <span style={{ color: t.c, fontWeight: 700 }}>{a.headAccent}</span>
                </p>

                <ul className="mt-5 flex flex-col gap-2.5">
                  {POINTS[k].map(p => (
                    <li key={p} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: t.bg, color: t.c }}>
                        <Check className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                      <span className="text-[13.5px] leading-snug" style={{ color: 'var(--rd-ink-2)' }}>{p}</span>
                    </li>
                  ))}
                </ul>

                <button type="button" onClick={() => go(k)}
                  className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-bold transition-colors"
                  style={{ color: t.c }}>
                  Explore for {a.tab.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
