import { Link } from 'react-router-dom'
import { ArrowRight, LayoutDashboard, Send, ClipboardCheck, GitBranch } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { IncubatorPanel } from '../audiences'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const item: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/* Copy verbatim from FounderCentral's For-Incubators page. */
const POINTS = [
  { icon: LayoutDashboard, title: 'Cohort dashboard', body: 'Every startup on one screen: stage, sector, ask, readiness. No more chasing 30 founders for an update.' },
  { icon: Send, title: 'Intros on their behalf', body: 'Send curated introductions for your companies. Be the connector, without living in a spreadsheet.' },
  { icon: ClipboardCheck, title: 'Diligence checklists', body: 'Get startups investor-ready before the first call. Fewer “we’ll send that over” moments.' },
  { icon: GitBranch, title: 'Pipeline visibility', body: 'Every intro, acceptance and deal in view. Spot who needs a nudge and who’s about to close.' },
]

export function ForIncubators() {
  const reduce = useReducedMotion()
  return (
    <section id="for-incubators" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        {/* Copy left, panel right, mirroring the founders lane. */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <motion.div className="relative order-2"
            initial={reduce ? false : { opacity: 0, y: 26, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.7, ease: EASE }}>
            <div aria-hidden className="pointer-events-none absolute -inset-8 z-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(37,99,235,0.18), transparent 60%)', filter: 'blur(24px)' }} />
            <IncubatorPanel />
          </motion.div>

          <motion.div className="order-1" variants={reduce ? undefined : list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <motion.span variants={reduce ? undefined : item} className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
              style={{ background: 'var(--rd-green-bg)', color: 'var(--rd-green)', border: '1px solid rgba(37,99,235,0.22)' }}>
              For incubators &amp; accelerators
            </motion.span>

            <motion.h2 variants={reduce ? undefined : item} className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
              Run your whole cohort’s fundraise <span style={{ color: 'var(--rd-green)' }}>from one portal.</span>
            </motion.h2>

            <motion.p variants={reduce ? undefined : item} className="mt-5 max-w-lg text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
              Connect your founders to the right investors, send curated introductions on their behalf, and track every deal and milestone, without living in a spreadsheet.
            </motion.p>

            <motion.div variants={reduce ? undefined : item} className="mt-8 grid gap-5 sm:grid-cols-2">
              {POINTS.map(p => {
                const Icon = p.icon
                return (
                  <div key={p.title}>
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--rd-green-bg)', color: 'var(--rd-green)', border: '1px solid rgba(37,99,235,0.2)' }}>
                      <Icon className="h-[19px] w-[19px]" />
                    </span>
                    <div className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '15.5px', color: 'var(--rd-ink)' }}>{p.title}</div>
                    <p className="mt-1 text-[14px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{p.body}</p>
                  </div>
                )
              })}
            </motion.div>

            <motion.div variants={reduce ? undefined : item} className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <Link to="/auth/signup" className="rd-btn rd-btn-primary" style={{ height: 52, padding: '0 26px', fontSize: '15px' }}>
                  Book a demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <span className="text-[13px] font-medium" style={{ color: 'var(--rd-muted-2)' }}>
                Free for incubators · Your whole cohort, one view
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
