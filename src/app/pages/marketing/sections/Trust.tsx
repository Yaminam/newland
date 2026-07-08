import type { ComponentType } from 'react'
import { Users, Search, ShieldCheck, TrendingUp } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

type Pillar = { icon: ComponentType<{ className?: string }>; kicker: string; title: string; body: string }

const PILLARS: Pillar[] = [
  {
    icon: Users,
    kicker: 'Connect',
    title: 'Real people, real intros',
    body: 'Actual introductions to actual investors. No bots pretending to be a “warm connection.”',
  },
  {
    icon: Search,
    kicker: 'Discover',
    title: 'Quality over quantity',
    body: 'Three right intros beat thirty sprayed into the void. We optimise for fit, not list size.',
  },
  {
    icon: ShieldCheck,
    kicker: 'Trust',
    title: 'Locked down, both sides',
    body: 'Verified profiles, encrypted in transit and at rest. SOC 2 readiness in progress. Your deck goes nowhere you didn’t send it.',
  },
  {
    icon: TrendingUp,
    kicker: 'Growth',
    title: 'We win when you do',
    body: 'We only make money when you raise, so the product gets sharper the more founders close.',
  },
]

const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const cell: Variants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } } }

// content is pulled toward the centre so the four pillars cluster around the emblem
const PAD = ['sm:pr-12 sm:pl-2 sm:pb-10', 'sm:pl-12 sm:pr-2 sm:pb-10', 'sm:pr-12 sm:pl-2 sm:pt-10', 'sm:pl-12 sm:pr-2 sm:pt-10']
// radial-wash origin = the inner (centre-facing) corner of each quadrant
const INNER = ['100% 100%', '0% 100%', '100% 0%', '0% 0%']

export function Trust() {
  const reducedMotion = useReducedMotion()

  return (
    <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            Our pillars
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
          >
            Four things we won&apos;t bend on.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            The non-negotiables. The stuff we’d rather lose a deal than fake.
          </p>
        </motion.div>

        {/* Crossed quadrants around a central emblem */}
        <motion.div
          className="relative mt-14 sm:mt-16"
          variants={grid}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {/* soft glow behind the centre */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 hidden h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full sm:block"
            style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent 70%)', filter: 'blur(12px)' }}
          />

          {/* the cross */}
          <span aria-hidden className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 sm:block" style={{ background: 'linear-gradient(180deg, transparent, var(--line) 14%, var(--line) 86%, transparent)' }} />
          <span aria-hidden className="absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 sm:block" style={{ background: 'linear-gradient(90deg, transparent, var(--line) 14%, var(--line) 86%, transparent)' }} />

          {/* rotating central emblem */}
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            {!reducedMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 -m-3 rounded-full"
                style={{ border: '1px dashed var(--blue-border)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <motion.span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: 'var(--gradient-primary)', boxShadow: '0 0 0 7px var(--surface-2), 0 14px 30px -8px rgba(96,165,250,0.6)' }}
              initial={reducedMotion ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            >
              <motion.span
                className="block h-3.5 w-3.5 rounded-[3px]"
                style={{ background: '#fff' }}
                animate={reducedMotion ? undefined : { rotate: [45, 135, 45] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            {PILLARS.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={p.kicker}
                  variants={cell}
                  className={`group relative flex min-h-[260px] flex-col justify-center overflow-hidden py-8 ${PAD[i]}`}
                >
                  {/* hover wash radiating from the centre */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at ${INNER[i]}, rgba(96,165,250,0.07), transparent 62%)` }}
                  />

                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110"
                        style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 28px -10px rgba(96,165,250,0.5)' }}
                      >
                        <Icon className="h-[22px] w-[22px]" />
                      </span>
                      <span
                        className="font-bold"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(1.6rem, 2.6vw, 2.1rem)',
                          letterSpacing: '-0.02em',
                          background: 'var(--gradient-primary)',
                          WebkitBackgroundClip: 'text',
                          backgroundClip: 'text',
                          color: 'transparent',
                          paddingBottom: '0.06em',
                        }}
                      >
                        {p.kicker}
                      </span>
                    </div>

                    <h3
                      className="mt-4 font-bold"
                      style={{ fontFamily: 'var(--font-display)', fontSize: '19px', letterSpacing: '-0.015em', color: 'var(--ink)' }}
                    >
                      {p.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
