import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

type Value = { kicker: string; title: string; body: string }

const VALUES: Value[] = [
  {
    kicker: 'Matching',
    title: 'Ranked. Not random.',
    body: 'Seed angels for seed rounds, growth funds for growth. You get the short list that actually fits, not a 50,000-name database that fits no one.',
  },
  {
    kicker: 'Intel',
    title: 'We read the boring stuff',
    body: 'Grants, cheques and pitch nights across India, tracked and refreshed weekly. You get the signal; we’ll keep the spreadsheets.',
  },
  {
    kicker: 'Intros',
    title: 'Warm intros, zero cold spam',
    body: 'You ask, they accept, you both get the email. Then we step out. No “just circling back” for the fourth time.',
  },
  {
    kicker: 'Pricing',
    title: 'Free. Actually free.',
    body: 'No paywall between you and your raise. Founders never pay us a rupee. That’s the deal, not a free trial.',
  },
]

const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } }
const cell: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

export function ValueStrip() {
  const reducedMotion = useReducedMotion()

  return (
    <section aria-label="Why FounderCentral" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
      <div className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
        {/* Header row — heading left, intro right */}
        <motion.div
          className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-end lg:gap-12"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--blue)' }}>
              Why it works
            </p>
            <h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.875rem, 3.4vw, 2.75rem)', lineHeight: 1.12, letterSpacing: '-0.025em', color: 'var(--ink)' }}
            >
              Four reasons. No fluff.
            </h2>
          </div>
          <p className="max-w-md text-[15px] font-semibold leading-relaxed lg:justify-self-end lg:text-right" style={{ color: 'var(--ink-2)' }}>
            No dashboard to learn, no “14-day trial” that quietly starts billing. Just the handful of
            things that actually move a raise forward.
          </p>
        </motion.div>

        {/* 2×2 grid */}
        <motion.div
          className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderColor: 'var(--line)' }}
          variants={grid}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {VALUES.map((v, i) => (
            <motion.div key={v.title} variants={cell} className="group flex gap-5">
              <div
                className="shrink-0 font-bold leading-none text-[color:var(--faint)] transition-colors duration-200 group-hover:text-[color:var(--blue)]"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}
              >
                0{i + 1}
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--blue)' }}>
                  {v.kicker}
                </div>
                <h3
                  className="mt-1.5 font-bold"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', lineHeight: 1.18, letterSpacing: '-0.015em', color: 'var(--ink)' }}
                >
                  {v.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {v.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
