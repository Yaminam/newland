import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, FileText, Inbox } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { InvestorPanel } from '../audiences'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
const item: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/* Copy verbatim from FounderCentral's For-Investors page. */
const POINTS = [
  { icon: ShieldCheck, title: 'Pre-qualified founders', body: 'Vetted upstream. You skip the “is this even a real company?” triage entirely.' },
  { icon: FileText, title: 'Structured one-pagers', body: 'Every company in the same clean, comparable format. No 90-slide decks, no Loom links.' },
  { icon: Inbox, title: 'Signal, not noise', body: 'Only fit-matched founders reach you. Your inbox stays an inbox, not a graveyard.' },
]

export function ForInvestors() {
  const reduce = useReducedMotion()
  return (
    <section id="for-investors" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        {/* Panel on the left, so this lane mirrors the founders lane above it. */}
        <div className="grid items-center gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:gap-14">
          {/* Copy */}
          <motion.div className="order-1 lg:order-2" variants={reduce ? undefined : list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <motion.span variants={reduce ? undefined : item} className="rd-eyebrow gold mb-5">For investors</motion.span>

            <motion.h2 variants={reduce ? undefined : item} className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
              High-signal deal flow, <span style={{ color: 'var(--rd-gold)' }}>on your thesis.</span>
            </motion.h2>

            <motion.p variants={reduce ? undefined : item} className="mt-5 max-w-lg text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
              Set your thesis once. FounderCentral surfaces pre-qualified founders that match your stage, sector, cheque size and geography, each in the same clean one-page format. No cold inbox, no noise.
            </motion.p>

            <motion.div variants={reduce ? undefined : item} className="mt-8 flex flex-col gap-5">
              {POINTS.map(p => {
                const Icon = p.icon
                return (
                  <div key={p.title} className="flex items-start gap-3.5">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--rd-gold-bg)', color: 'var(--rd-gold)', border: '1px solid rgba(30,58,138,0.2)' }}>
                      <Icon className="h-[19px] w-[19px]" />
                    </span>
                    <div>
                      <div className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--rd-ink)' }}>{p.title}</div>
                      <p className="mt-1 max-w-md text-[14.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{p.body}</p>
                    </div>
                  </div>
                )
              })}
            </motion.div>

            <motion.div variants={reduce ? undefined : item} className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Magnetic>
                <Link to="/auth/signup" className="rd-btn rd-btn-gold" style={{ height: 52, padding: '0 26px', fontSize: '15px' }}>
                  Apply as an investor <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <span className="text-[13px] font-medium" style={{ color: 'var(--rd-muted-2)' }}>
                Run multiple theses · Pause or decline anytime
              </span>
            </motion.div>
          </motion.div>

          {/* Live deal-flow panel */}
          <motion.div className="relative order-2 lg:order-1"
            initial={reduce ? false : { opacity: 0, y: 26, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.7, ease: EASE }}>
            <div aria-hidden className="pointer-events-none absolute -inset-8 z-0" style={{ background: 'radial-gradient(circle at 55% 40%, rgba(59,130,246,0.2), transparent 60%)', filter: 'blur(24px)' }} />
            <InvestorPanel />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
