import type { ComponentType } from 'react'
import { MousePointerClick, Send, Handshake, Check, ArrowRight, Mail } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { MatchRing } from '@/app/components/ui/MatchRing'

const EASE = [0.22, 1, 0.36, 1] as const

/* ── Live product previews. Real components, not screenshots, so they stay
   sharp on any display and add no image weight to the page. ────────────── */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 24px 50px -28px rgba(13,27,42,0.4), 0 2px 6px rgba(13,27,42,0.05)' }}>
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid var(--rd-border)' }}>
        <span className="flex gap-1"><i className="h-2 w-2 rounded-full" style={{ background: '#BFDBFE' }} /><i className="h-2 w-2 rounded-full" style={{ background: '#60A5FA' }} /><i className="h-2 w-2 rounded-full" style={{ background: '#2563EB' }} /></span>
        <span className="ml-1.5 text-[11px] font-bold" style={{ color: 'var(--rd-ink)', fontFamily: 'var(--font-display)' }}>{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

const BlurName = ({ name, w }: { name: string; w: string }) => (
  <span className={`block truncate text-[11.5px] font-bold ${w}`} style={{ color: 'var(--rd-ink)', filter: 'blur(4px)', userSelect: 'none' }}>{name}</span>
)

/** Step 1 — a ranked match list. */
function MatchPreview() {
  const rows = [
    { fit: 96, name: 'Everblue Ventures', meta: 'Seed · ₹2 - 8 Cr' },
    { fit: 93, name: 'Kavya Capital', meta: 'Seed · ₹1 - 5 Cr' },
    { fit: 90, name: 'Meridian Angels', meta: 'Seed · ₹25 - 75 L' },
  ]
  return (
    <Frame title="Investor Match">
      <div className="flex flex-col gap-1.5">
        {rows.map(r => (
          <div key={r.name} className="flex items-center gap-2.5 rounded-lg p-2" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
            <MatchRing score={r.fit} size={28} />
            <div className="min-w-0 flex-1">
              <BlurName name={r.name} w="w-24" />
              <div className="mt-0.5 text-[10px]" style={{ color: 'var(--rd-muted)' }}>{r.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  )
}

/** Step 2 — requesting a warm intro. */
function IntroPreview() {
  return (
    <Frame title="Request intro">
      <div className="flex items-center gap-2.5 rounded-lg p-2" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
        <MatchRing score={96} size={28} />
        <div className="min-w-0 flex-1"><BlurName name="Everblue Ventures" w="w-24" /><div className="mt-0.5 text-[10px]" style={{ color: 'var(--rd-muted)' }}>Seed · SaaS</div></div>
      </div>
      <div className="mt-2 rounded-lg p-2.5 text-[10.5px] leading-relaxed" style={{ background: 'var(--rd-surface-2)', border: '1px dashed var(--rd-border-2)', color: 'var(--rd-muted)' }}>
        “We’re raising a seed round for a vertical SaaS product, ₹40 L ARR, growing 18% a month.”
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-bold text-white" style={{ background: 'var(--rd-grad)' }}>
        <Send className="h-3.5 w-3.5" /> Send intro request
      </div>
    </Frame>
  )
}

/** Step 3 — the intro is accepted and both sides connect. */
function AcceptedPreview() {
  return (
    <Frame title="Inbox">
      <div className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: 'var(--rd-green-bg)', border: '1px solid rgba(37,99,235,0.22)' }}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--rd-green)', color: '#fff' }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
        <span className="text-[11.5px] font-bold" style={{ color: 'var(--rd-green)' }}>Intro accepted</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
          <Mail className="h-3 w-3 shrink-0" style={{ color: 'var(--rd-muted-2)' }} />
          <span className="truncate text-[10px] font-semibold" style={{ color: 'var(--rd-ink-2)' }}>you@startup.in</span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--rd-blue)' }} />
        <div className="flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
          <Mail className="h-3 w-3 shrink-0" style={{ color: 'var(--rd-muted-2)' }} />
          <BlurName name="partner@fund.vc" w="w-20" />
        </div>
      </div>
      <div className="mt-2 rounded-lg p-2.5 text-[10.5px] leading-relaxed" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)', color: 'var(--rd-muted)' }}>
        “Happy to connect. Free for a call Thursday?”
      </div>
    </Frame>
  )
}

interface Step { icon: ComponentType<{ className?: string }>; title: string; body: string; accent: string; Visual: () => React.JSX.Element }
const STEPS: Step[] = [
  { icon: MousePointerClick, title: 'Match in seconds', body: 'You just did it. Three taps surface the investors whose thesis actually fits your round, ranked by fit.', accent: 'var(--rd-blue)', Visual: MatchPreview },
  { icon: Send, title: 'Request a warm intro', body: 'One click sends the ask. No cold email, no scraping for an address that never replies. You stay in control of what is shared.', accent: 'var(--rd-gold)', Visual: IntroPreview },
  { icon: Handshake, title: 'They accept, you talk', body: 'When an investor says yes, you both get each other’s email and the product steps out of the way.', accent: 'var(--rd-green)', Visual: AcceptedPreview },
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
        <div className="mx-auto mt-14 max-w-4xl pb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const Visual = s.Visual
            return (
              <div key={s.title} className="md:sticky" style={{ top: `${96 + i * 18}px` }}>
                <motion.div
                  initial={reduce ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="relative mb-5 overflow-hidden rounded-3xl p-6 sm:p-8"
                  style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 24px 60px -30px rgba(13,27,42,0.4), 0 2px 6px rgba(13,27,42,0.05)' }}
                >
                  <div className="grid items-center gap-7 md:grid-cols-[1fr_0.92fr]">
                    {/* Copy */}
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: 'var(--rd-grad)', boxShadow: '0 14px 30px -14px rgba(37,99,235,0.6)' }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rd-num text-[13px] font-bold" style={{ color: s.accent }}>Step {i + 1}</span>
                      </div>
                      <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 2.2vw, 1.65rem)', letterSpacing: '-0.02em', color: 'var(--rd-ink)' }}>{s.title}</h3>
                      <p className="mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{s.body}</p>
                    </div>

                    {/* Live product preview */}
                    <div className="relative">
                      <div aria-hidden className="pointer-events-none absolute -inset-4 z-0" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(37,99,235,0.13), transparent 62%)', filter: 'blur(16px)' }} />
                      <div className="relative z-10"><Visual /></div>
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
