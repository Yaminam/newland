import type { ComponentType } from 'react'
import { MousePointerClick, Send, Handshake } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

interface Step { icon: ComponentType<{ className?: string }>; title: string; body: string; accent: string }
const STEPS: Step[] = [
  { icon: MousePointerClick, title: 'Match in seconds', body: 'You just did it. Three taps surface the investors whose thesis actually fits your round, ranked by fit.', accent: 'var(--rd-blue)' },
  { icon: Send, title: 'Request a warm intro', body: 'One click sends the ask. No cold email, no scraping for an address that never replies. The founder stays in control of what is shared.', accent: 'var(--rd-gold)' },
  { icon: Handshake, title: 'They accept, you talk', body: 'When an investor says yes, you both get each other’s email and the product steps out of the way. The conversation moves to where deals actually get worked.', accent: 'var(--rd-green)' },
]

export function HowItWorks() {
  const reduce = useReducedMotion()
  return (
    <section id="how-it-works" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">How it works</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            From stranger to warm intro in three moves.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            The same loop you just ran in the matcher, all the way to an investor replying in your inbox.
          </p>
        </div>

        {/* Sticky-stack: each card pins near the top and the next slides over it. */}
        <div className="mx-auto mt-14 max-w-3xl pb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="md:sticky" style={{ top: `${96 + i * 18}px` }}>
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="relative mb-5 overflow-hidden rounded-3xl p-8 sm:p-10"
                  style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 24px 60px -30px rgba(13,27,42,0.4), 0 2px 6px rgba(13,27,42,0.05)', minHeight: 220 }}
                >
                  {/* Watermark number */}
                  <span aria-hidden className="rd-num pointer-events-none absolute select-none font-extrabold" style={{ top: -18, right: 6, fontSize: 150, lineHeight: 1, color: 'var(--rd-bg-2)', opacity: 0.9 }}>{i + 1}</span>
                  <div className="relative flex items-start gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: 'var(--rd-grad)', boxShadow: '0 16px 34px -14px rgba(37,99,235,0.6)' }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="pt-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rd-num text-[13px] font-bold" style={{ color: s.accent }}>Step {i + 1}</span>
                      </div>
                      <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.2vw, 1.7rem)', letterSpacing: '-0.02em', color: 'var(--rd-ink)' }}>{s.title}</h3>
                      <p className="mt-3 max-w-lg text-[15.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{s.body}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
