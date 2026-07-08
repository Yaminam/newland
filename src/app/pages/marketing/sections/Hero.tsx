import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

// Headline orchestrates a mask reveal: each word rises from behind a line.
const headline: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.1 } },
}
const maskWord: Variants = {
  hidden: { y: '115%' },
  show: { y: '0%', transition: { duration: 0.65, ease: EASE } },
}

const LEAD = ['Raise', 'smarter.', 'Meet', 'investors', 'who', 'actually']
const ROTATING = ['reply', 'show up', 'get IT', 'fund IT']
const LONGEST = 'show up'

type Chip = {
  side: 'l' | 'r'
  top: string
  x: string
  w: number
  rotate: number
  tone: 'pain' | 'win'
  title: string
  sub?: string
}

// Quirky messages that fill the side margins — pain (ignored clichés) vs win.
const CHIPS: Chip[] = [
  { side: 'l', top: '9%',  x: '2.5%', w: 196, rotate: -5, tone: 'pain', title: '“Quick chat about your round?”', sub: 'Seen · 12 days ago · no reply' },
  { side: 'l', top: '33%', x: '4%',   w: 182, rotate: 4,  tone: 'win',  title: 'Matched to your stage' },
  { side: 'l', top: '56%', x: '2%',   w: 198, rotate: 3,  tone: 'pain', title: '“Let’s circle back in Q3”', sub: 'Narrator: they did not' },
  { side: 'l', top: '78%', x: '3.5%', w: 178, rotate: -3, tone: 'win',  title: 'Reply in 2 days. Wild.' },
  { side: 'r', top: '12%', x: '2.5%', w: 184, rotate: 5,  tone: 'win',  title: 'Warm intro accepted' },
  { side: 'r', top: '35%', x: '3%',   w: 200, rotate: -4, tone: 'pain', title: '“Sounds interesting, keep me posted!”', sub: 'Translation: a polite no' },
  { side: 'r', top: '58%', x: '2%',   w: 190, rotate: -3, tone: 'win',  title: 'Coffee booked → term sheet?' },
  { side: 'r', top: '80%', x: '3.5%', w: 196, rotate: 4,  tone: 'pain', title: 'Cold email #47', sub: 'Delivered. Devastatingly ignored.' },
]

export function Hero() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden">
      {/* Soft, calm backdrop — texture + side glows so the margins feel intentional */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="cc-pattern-dots absolute inset-0 opacity-[0.35]" />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(1100px 520px at 50% -8%, rgba(96,165,250,0.08) 0%, transparent 60%)' }}
        />
        <div
          className="absolute"
          style={{ top: '12%', left: '-5%', width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.11), transparent 65%)', filter: 'blur(26px)' }}
        />
        <div
          className="absolute"
          style={{ top: '24%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147,197,253,0.12), transparent 65%)', filter: 'blur(26px)' }}
        />
      </div>

      {/* Quirky story chips fill the side margins (wide screens only) */}
      {CHIPS.map((c, i) => {
        const pos = c.side === 'l' ? { left: c.x } : { right: c.x }
        const isWin = c.tone === 'win'
        return (
          <motion.div
            key={i}
            aria-hidden
            className="absolute hidden rounded-2xl px-4 py-3 xl:block"
            style={{
              ...pos,
              top: c.top,
              width: c.w,
              rotate: c.rotate,
              background: 'var(--surface)',
              border: isWin ? '1px solid rgba(96,165,250,0.22)' : '1px solid var(--line)',
              boxShadow: isWin
                ? '0 22px 50px -28px rgba(96,165,250,0.3)'
                : '0 22px 50px -28px rgba(15,23,42,0.25)',
            }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: i % 2 === 0 ? [0, -9, 0] : [0, 9, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.4 + i * 0.08 },
              scale: { duration: 0.6, delay: 0.4 + i * 0.08 },
              y: { duration: 5.5 + (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {isWin ? (
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                <span className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
                  {c.title}
                </span>
              </div>
            ) : (
              <>
                <div className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--muted)' }}>
                  {c.title}
                </div>
                {c.sub && (
                  <div className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-2)' }}>
                    {c.sub}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )
      })}

      <motion.div
        className="relative mx-auto max-w-4xl px-5 pb-16 pt-20 text-center sm:px-8 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-28"
        variants={container}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'show'}
      >
        <motion.p
          variants={item}
          className="text-[12.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: 'var(--blue)' }}
        >
          For founders tired of being left on read
        </motion.p>

        {/* Headline with mask reveal + rotating accent word */}
        <motion.h1
          variants={headline}
          className="mx-auto mt-6 flex max-w-3xl flex-wrap items-end justify-center font-bold capitalize"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            columnGap: '0.28em',
            rowGap: '0.1em',
          }}
        >
          {LEAD.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden" style={{ paddingBottom: '0.1em' }}>
              <motion.span variants={maskWord} className="inline-block">
                {w}
              </motion.span>
            </span>
          ))}
          <motion.span variants={item} className="inline-block">
            <RotatingWord reducedMotion={!!reducedMotion} />
          </motion.span>
        </motion.h1>

        {/* One calm sentence */}
        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl"
          style={{ fontSize: 'clamp(1.0625rem, 1.6vw, 1.25rem)', lineHeight: 1.6, color: 'var(--muted)' }}
        >
          No cold emails into the void, no “let’s circle back.” Just warm intros to investors who
          actually back your stage and sector.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="btn-primary w-full capitalize sm:w-auto"
            style={{ height: 54, padding: '0 28px', fontSize: '1rem', borderRadius: 12 }}
          >
            Find relevant investors
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/auth/signup"
            className="btn-outline w-full sm:w-auto"
            style={{ height: 54, padding: '0 24px', fontSize: '0.9375rem', borderRadius: 12 }}
          >
            Join FounderCentral
          </Link>
        </motion.div>

        {/* Quiet trust line */}
        <motion.div
          variants={item}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13.5px] capitalize"
          style={{ color: 'var(--muted-2)' }}
        >
          <span>Free for founders</span>
          <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
          <span>No credit card</span>
          <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
          <span>Zero cold emails</span>
        </motion.div>
      </motion.div>
    </section>
  )
}

function RotatingWord({ reducedMotion }: { reducedMotion: boolean }) {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    const t = setInterval(() => setI(p => (p + 1) % ROTATING.length), 2400)
    return () => clearInterval(t)
  }, [reducedMotion])

  return (
    <span className="relative inline-block align-bottom">
      {/* Clip box — slot-machine word swap */}
      <span className="relative inline-block overflow-hidden" style={{ paddingBottom: '0.1em' }}>
        {/* invisible sizer reserves stable width + height */}
        <span className="invisible" aria-hidden>{LONGEST}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={ROTATING[i]}
            className="absolute inset-0 flex items-start justify-center"
            style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
            initial={reducedMotion ? false : { y: '110%' }}
            animate={{ y: '0%' }}
            exit={reducedMotion ? undefined : { y: '-110%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {ROTATING[i]}
          </motion.span>
        </AnimatePresence>
      </span>

      {/* Underline that draws once */}
      <motion.span
        aria-hidden
        className="absolute left-0 right-0 rounded-full"
        style={{ bottom: '0', height: '0.06em', background: 'var(--gradient-primary)', transformOrigin: 'left' }}
        initial={reducedMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.95, ease: EASE }}
      />
    </span>
  )
}
