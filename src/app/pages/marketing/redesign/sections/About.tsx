import { HeartHandshake, BadgeCheck, Target, Flame } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const
const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const cell: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/* The four differentiators, verbatim from FounderCentral's About page. */
const POINTS = [
  { icon: HeartHandshake, title: 'Free for founders', body: 'Founders never pay us a rupee. No credit card, no trial that quietly expires.' },
  { icon: BadgeCheck, title: 'Verified investors', body: 'Real, active cheque-writers. Reviewed and kept current, not a graveyard of dead funds.' },
  { icon: Target, title: 'Thesis-matched intros', body: 'Ranked against a stated thesis, with the reasons shown. No black box, no vibes.' },
  { icon: Flame, title: 'Warm, not cold', body: 'Both sides opt in before contact. Nothing moves until each of you says yes.' },
]

export function About() {
  const reduce = useReducedMotion()
  return (
    <section id="about" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">About FounderCentral</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Every great startup deserves a <span className="rd-grad-text">fair shot at funding.</span>
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            Raising has always run on who you happen to know. We replace cold outreach with warm, thesis-matched introductions to verified investors, so the door opens on merit rather than on your address book.
          </p>
        </div>

        <motion.div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={reduce ? undefined : grid} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {POINTS.map(p => {
            const Icon = p.icon
            return (
              <motion.div key={p.title} variants={reduce ? undefined : cell} whileHover={reduce ? undefined : { y: -5 }}
                className="rounded-2xl p-6" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)', border: '1px solid rgba(37,99,235,0.18)' }}>
                  <Icon className="h-[20px] w-[20px]" />
                </span>
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '16.5px', letterSpacing: '-0.01em', color: 'var(--rd-ink)' }}>{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{p.body}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
