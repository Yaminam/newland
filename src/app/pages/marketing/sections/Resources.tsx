import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Presentation, TrendingUp, Users2, ClipboardCheck, Mail, ArrowRight, BookOpen } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

type Resource = {
  icon: ComponentType<{ className?: string }>
  category: string
  label: string
  title: string
  slug: string
  teaser: string
  read: string
}

const RESOURCES: Resource[] = [
  { icon: Presentation, category: 'Pitch Deck', label: 'the investor-ready deck', title: 'How to build an investor-ready pitch deck', slug: 'investor-ready-pitch-deck', teaser: 'The 11 slides investors actually read, and the order that keeps them awake.', read: '8 min' },
  { icon: TrendingUp, category: 'Fundraising', label: 'approaching VCs in India', title: 'How to approach VCs in India', slug: 'approach-vcs-india', teaser: 'Warm paths, timing, and a first email that doesn’t get ignored.', read: '6 min' },
  { icon: Users2, category: 'Investor Types', label: 'angel vs VC vs family office', title: 'Angel vs VC vs family office', slug: 'angel-vs-vc-vs-family-office', teaser: 'Which money fits which moment, without the jargon.', read: '5 min' },
  { icon: ClipboardCheck, category: 'Checklist', label: 'the seed checklist', title: 'Seed funding checklist for Indian startups', slug: 'seed-funding-checklist-india', teaser: 'Everything ready before you raise. Tick it, then relax (a little).', read: '7 min' },
  { icon: Mail, category: 'Templates', label: 'the warm-intro template', title: 'Warm intro email template', slug: 'warm-intro-email-template', teaser: 'The one email that gets opened. Copy, paste, personalise, send.', read: '3 min' },
]

export function Resources() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const current = RESOURCES[active]
  const ActiveIcon = current.icon

  return (
    <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="relative mx-auto max-w-6xl px-6 py-24 text-center sm:px-10 sm:py-28 lg:py-32">
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-2xl"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            Founder Resources
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
          >
            Guides to sharpen your fundraise.
          </h2>
        </motion.div>

        {/* Big headline links, wrapped as a spread */}
        <motion.div
          className="mx-auto mt-14 flex max-w-5xl flex-wrap items-center justify-center gap-x-5 gap-y-3"
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {RESOURCES.map((r, i) => {
            const isActive = i === active
            return (
              <span key={r.slug} className="inline-flex items-center gap-x-5">
                <Link
                  to={`/blog/${r.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="relative isolate inline-block font-bold transition-transform duration-200 hover:-translate-y-[2px]"
                  style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 3.6vw, 3rem)', letterSpacing: '-0.028em', lineHeight: 1.15 }}
                >
                  {/* sliding highlighter marker */}
                  {isActive && (
                    <motion.span
                      layoutId="res-marker"
                      aria-hidden
                      className="absolute z-0 rounded-[0.3em]"
                      style={{ inset: '0.04em -0.2em 0.02em', background: 'var(--blue-bg)', boxShadow: 'inset 0 -0.42em 0 rgba(147,197,253,0.28)' }}
                      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className="relative z-10"
                    style={
                      isActive
                        ? { background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: '0.06em' }
                        : { color: 'var(--ink-2)' }
                    }
                  >
                    {r.label}
                  </span>
                </Link>
                {i < RESOURCES.length - 1 && (
                  <span aria-hidden style={{ color: 'var(--faint)', fontSize: 'clamp(1.3rem, 2.6vw, 2.2rem)' }}>
                    ·
                  </span>
                )}
              </span>
            )
          })}
        </motion.div>

        {/* Hovered guide detail */}
        <div className="mt-14 flex min-h-[4rem] items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.slug}
              className="flex max-w-2xl items-center gap-4 text-left"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ background: 'var(--gradient-primary)', boxShadow: '0 14px 32px -10px rgba(96,165,250,0.55)' }}
              >
                <ActiveIcon className="h-[22px] w-[22px]" />
              </span>
              <div>
                <span className="font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--blue)', fontSize: '11px' }}>
                  {current.category} · {current.read} read
                </span>
                <p className="mt-1 text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {current.teaser}{' '}
                  <Link to={`/blog/${current.slug}`} className="inline-flex items-center gap-1 font-bold whitespace-nowrap" style={{ color: 'var(--blue)' }}>
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Browse all */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Link
            to="/blog"
            className="group mt-10 inline-flex items-center gap-2 font-bold"
            style={{ color: 'var(--blue)' }}
          >
            <BookOpen className="h-[18px] w-[18px]" />
            Browse the full library
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
