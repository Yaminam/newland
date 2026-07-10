import { Link } from 'react-router-dom'
import { ArrowRight, ListOrdered, BookOpenCheck, Handshake, HeartHandshake } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { FounderPanel } from '../audiences'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const item: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/* The four pillars, verbatim from FounderCentral's own founder pages. */
const POINTS = [
  { icon: ListOrdered, title: 'Ranked. Not random.', body: 'Ranked by fit, not by who scraped the most profiles. Seed angels for seed rounds, growth funds for growth.' },
  { icon: BookOpenCheck, title: 'We read the boring stuff', body: 'Every Indian grant you might qualify for. We read the fine print so you don’t have to.' },
  { icon: Handshake, title: 'Warm intros, zero cold spam', body: 'Request, they accept, you both get the email. The product then steps out of the way.' },
  { icon: HeartHandshake, title: 'Free. Actually free.', body: 'Founders never pay us a rupee. No credit card, no trial that quietly expires.' },
]

export function ForFounders() {
  const reduce = useReducedMotion()
  return (
    <section id="for-founders" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          {/* Copy left */}
          <motion.div variants={reduce ? undefined : list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <motion.span variants={reduce ? undefined : item} className="rd-eyebrow mb-5">For founders</motion.span>

            <motion.h2 variants={reduce ? undefined : item} className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
              Warm intros to investors who <span className="rd-grad-text">actually fund your stage.</span>
            </motion.h2>

            <motion.p variants={reduce ? undefined : item} className="mt-5 max-w-lg text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
              Set up your one-pager once. FounderCentral matches you to the right investors and opens the door with a curated intro. No cold emails, no spray-and-pray.
            </motion.p>

            <motion.div variants={reduce ? undefined : item} className="mt-8 grid gap-5 sm:grid-cols-2">
              {POINTS.map(p => {
                const Icon = p.icon
                return (
                  <div key={p.title}>
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)', border: '1px solid rgba(37,99,235,0.2)' }}>
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
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <span className="text-[13px] font-medium" style={{ color: 'var(--rd-muted-2)' }}>
                Free for founders · No credit card · About 8 minutes to set up
              </span>
            </motion.div>
          </motion.div>

          {/* One-pager panel right */}
          <motion.div className="relative"
            initial={reduce ? false : { opacity: 0, y: 26, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-70px' }}
            transition={{ duration: 0.7, ease: EASE }}>
            <div aria-hidden className="pointer-events-none absolute -inset-8 z-0" style={{ background: 'radial-gradient(circle at 55% 40%, rgba(37,99,235,0.2), transparent 60%)', filter: 'blur(24px)' }} />
            <FounderPanel />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
