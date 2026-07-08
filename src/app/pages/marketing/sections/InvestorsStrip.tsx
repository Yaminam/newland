import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, FileText, Inbox, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

type Point = { icon: ComponentType<{ className?: string }>; title: string; body: string }

const POINTS: Point[] = [
  {
    icon: ShieldCheck,
    title: 'Pre-qualified founders',
    body: 'Vetted upstream, so you skip the “is this even a real company?” part entirely.',
  },
  {
    icon: FileText,
    title: 'Structured one-pagers',
    body: 'Every pitch in the same clean format. No 90-slide decks, no Loom links you’ll never open.',
  },
  {
    icon: Inbox,
    title: 'Zero inbox spam',
    body: 'Only fit-matched intros reach you. Your inbox stays an inbox, not a graveyard.',
  },
]

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }
const cell: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

export function InvestorsStrip() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="for-investors" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            className="max-w-2xl"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
              For investors
            </p>
            <h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3.1rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
            >
              The central hub for serious deal flow.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Set your thesis once and the right founders find you, not the other 4,000. High signal,
              because the noise gets filtered upstream.
            </p>
          </motion.div>

          <motion.div
            className="shrink-0"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          >
            <Link
              to="/auth/signup?role=investor"
              className="btn-primary inline-flex items-center gap-2"
              style={{ height: 50, padding: '0 26px', fontSize: '15px', borderRadius: 12 }}
            >
              Apply as an investor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        {/* Quiet divider */}
        <motion.div
          className="mt-16 h-px w-full"
          style={{ background: 'var(--line)', transformOrigin: 'left' }}
          initial={reducedMotion ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8, ease: EASE }}
        />

        {/* Three benefits — simple, airy 3-up */}
        <motion.div
          className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-12"
          variants={list}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {POINTS.map(p => {
            const Icon = p.icon
            return (
              <motion.div key={p.title} variants={cell}>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ background: 'var(--gradient-primary)', boxShadow: '0 14px 30px -12px rgba(96,165,250,0.5)' }}
                >
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <h3
                  className="mt-5 font-bold"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.015em', color: 'var(--ink)' }}
                >
                  {p.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {p.body}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
