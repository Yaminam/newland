import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Users2, Handshake, ClipboardCheck, TrendingUp, ArrowRight, Building2 } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

type Benefit = { icon: ComponentType<{ className?: string }>; title: string; body: string; aside: string }

const BENEFITS: Benefit[] = [
  {
    icon: Users2,
    title: 'Cohort dashboard',
    body: 'Every startup on one screen: stage, sector, ask, readiness. No more chasing 30 founders for an update.',
    aside: 'bye, “any update?” emails',
  },
  {
    icon: Handshake,
    title: 'Intros on their behalf',
    body: 'Send curated introductions for your companies. Be the connector, without living in a spreadsheet.',
    aside: 'the spreadsheet stays shut',
  },
  {
    icon: ClipboardCheck,
    title: 'DD checklists',
    body: 'Get startups investor-ready before the first call. Fewer “we’ll send that over” moments.',
    aside: 'ready, not ghosted',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline visibility',
    body: 'Every intro, acceptance and deal in view. Spot who needs a nudge and who’s about to close.',
    aside: 'see the close coming',
  },
]

export function Incubation() {
  const reducedMotion = useReducedMotion()

  return (
    <section
      id="for-incubators"
      style={{ background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="relative w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            For incubators &amp; accelerators
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
          >
            Herd the whole cohort from one portal.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Connect your founders to the right investors and track every intro, deal and milestone,
            without sending a single “any update?” email into the void.
          </p>
        </motion.div>

        {/* Horizontal journey line — edge to edge */}
        <div className="relative mt-20 sm:mt-24">
          {/* connecting spine, drawn in (desktop) */}
          <motion.span
            aria-hidden
            className="absolute z-0 hidden h-[2px] lg:block"
            style={{ top: 30, left: '12.5%', right: '12.5%', background: 'var(--gradient-primary)', opacity: 0.45, transformOrigin: 'left' }}
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1, ease: EASE }}
          />

          {/* glowing pulse that travels the line */}
          {!reducedMotion && (
            <motion.span
              aria-hidden
              className="absolute z-[1] hidden h-3 w-3 -translate-x-1/2 rounded-full lg:block"
              style={{ top: 24, background: 'var(--blue)', boxShadow: '0 0 0 4px rgba(96,165,250,0.18), 0 0 14px 2px rgba(96,165,250,0.6)' }}
              initial={{ left: '12.5%', opacity: 0 }}
              whileInView={{ left: ['12.5%', '87.5%'], opacity: [0, 1, 1, 1, 0] }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
            />
          )}

          <div className="grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-4 lg:gap-x-10">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  className="relative flex flex-col items-center px-2 text-center"
                  initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
                >
                  {/* node on the line */}
                  <motion.span
                    className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-white"
                    style={{
                      background: 'var(--gradient-primary)',
                      boxShadow: '0 16px 36px -12px rgba(96,165,250,0.55), 0 0 0 7px var(--bg)',
                    }}
                    whileHover={reducedMotion ? undefined : { y: -5, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.45 }}
                  >
                    <Icon className="h-7 w-7" />
                  </motion.span>

                  <span className="mt-6 text-[12px] font-bold tabular-nums tracking-[0.18em]" style={{ color: 'var(--blue-l)' }}>
                    STEP {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="mt-1.5 font-bold"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 1.6vw, 1.45rem)', letterSpacing: '-0.02em', color: 'var(--ink)' }}
                  >
                    {b.title}
                  </h3>
                  <p className="mx-auto mt-2.5 text-[15px] leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '18rem' }}>
                    {b.body}
                  </p>
                  <p className="mt-3 text-[13px] italic" style={{ color: 'var(--blue-l)' }}>
                    ✦ {b.aside}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="mt-20 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <Link
            to="/auth/signup?role=incubation"
            className="btn-primary inline-flex items-center gap-2"
            style={{ height: 50, padding: '0 26px', fontSize: '15px', borderRadius: 11 }}
          >
            <Building2 className="h-4 w-4" />
            Set up your incubation portal
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
            Free for incubators · no credit card required
          </p>
        </motion.div>
      </div>
    </section>
  )
}
