import { Fragment } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

const STEPS = [
  {
    n: '01',
    tag: 'Setup',
    title: 'Create your profile',
    body: 'The same questions every investor opens with: stage, sector, ask, traction. Answered once, and you’re done forever.',
    points: [
      'About 8 minutes, less than a cold-email draft',
      'Write it once, reuse it forever',
      'Edit anything, anytime',
      'No “so, tell me about yourself” on repeat',
    ],
    quip: 'Your deck can finally stop living in 14 open tabs.',
  },
  {
    n: '02',
    tag: 'Match',
    title: 'Get matched',
    body: 'A short, ranked list of investors who actually fit, with the reasons shown. Not a 50,000-name database that fits no one.',
    points: [
      'Ranked by real fit, with the reasons',
      'See exactly why each one matched',
      'Only investors writing cheques right now',
      'Seed angels for seed rounds, not Series-C tourists',
    ],
    quip: 'Three right intros beat thirty wrong ones.',
  },
  {
    n: '03',
    tag: 'Connect',
    title: 'Request a warm intro',
    body: 'You ask, they accept, you both get the email. Then we step out of the conversation entirely.',
    points: [
      'Both sides opt in, never cold spam',
      'Straight to email, no middleman',
      'The conversation moves to where deals close',
      'We make the intro, then politely vanish',
    ],
    quip: 'No “just circling back” required. Ever.',
  },
]

const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }
const cell: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }
const arrowV: Variants = { hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EASE } } }
const bulletList: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }
const bullet: Variants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } } }

export function HowItWorks() {
  const reducedMotion = useReducedMotion()

  return (
    <section id="how-it-works" className="relative">
      <div className="w-full px-6 py-16 sm:px-10 sm:py-18 lg:px-16">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--blue)' }}>
            How it works
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 3.6vw, 2.875rem)', lineHeight: 1.14, letterSpacing: '-0.025em', color: 'var(--ink)' }}
          >
            From cold inbox to warm intro, in three moves.
          </h2>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-stretch gap-4 sm:mt-14 md:flex-row md:gap-4"
          variants={grid}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <motion.div
                variants={cell}
                whileHover={reducedMotion ? undefined : { y: -6, boxShadow: '0 24px 48px -26px rgba(96,165,250,0.32)', borderColor: 'rgba(96,165,250,0.35)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="group relative flex flex-1 flex-col overflow-hidden rounded-3xl p-9 sm:p-10"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
              >
                {/* Top accent bar — draws in on hover */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  style={{ background: 'var(--gradient-primary)' }}
                />

                <div className="flex items-center justify-between">
                  <span
                    className="font-bold leading-none"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 3.5vw, 3.5rem)', letterSpacing: '-0.04em', color: 'var(--blue)' }}
                  >
                    {s.n}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em]"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.2)' }}
                  >
                    {s.tag}
                  </span>
                </div>

                <h3
                  className="mt-6 font-bold"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2vw, 1.875rem)', lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--ink)' }}
                >
                  {s.title}
                </h3>
                <p className="mt-3.5 text-[15.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {s.body}
                </p>

                <motion.ul className="mt-7 space-y-3.5" variants={bulletList}>
                  {s.points.map(p => (
                    <motion.li key={p} variants={bullet} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-[14.5px] leading-snug" style={{ color: 'var(--ink-2)' }}>{p}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <div className="mt-auto border-t pt-6" style={{ borderColor: 'var(--line)' }}>
                  <p className="text-[13.5px] italic" style={{ color: 'var(--muted-2)' }}>{s.quip}</p>
                </div>
              </motion.div>

              {/* Direction arrow between cards */}
              {i < STEPS.length - 1 && (
                <motion.div variants={arrowV} className="flex shrink-0 items-center justify-center" aria-hidden>
                  <motion.span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }}
                    animate={reducedMotion ? undefined : { scale: [1, 1.12, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  >
                    <ChevronRight className="h-5 w-5 rotate-90 md:rotate-0" style={{ color: 'var(--blue)' }} />
                  </motion.span>
                </motion.div>
              )}
            </Fragment>
          ))}
        </motion.div>

        <motion.p
          className="mx-auto mt-12 max-w-2xl text-center text-[14px]"
          style={{ color: 'var(--muted-2)' }}
          initial={reducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          That’s the whole thing. No dashboards to babysit, no 14-step funnel. Just the introduction that was missing.
        </motion.p>
      </div>
    </section>
  )
}
