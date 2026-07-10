import type { ComponentType } from 'react'
import { Users, GraduationCap, Newspaper, CalendarDays, Check, Lock } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const rowV: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

interface Row { icon: ComponentType<{ className?: string }>; label: string; free: string; gated: string }

const ROWS: Row[] = [
  { icon: Users, label: 'Investors', free: 'Live count, masked cards, fit %, stage and cheque band', gated: 'Names, contact, full thesis, one-click warm intro' },
  { icon: GraduationCap, label: 'Grants', free: 'Titles, amount, deadline and the “47 active” count', gated: 'Eligibility, how to apply, the full list and tracking' },
  { icon: Newspaper, label: 'Funding news', free: 'Latest headlines, source and date', gated: 'Full articles, the full feed, filters and saving' },
  { icon: CalendarDays, label: 'Events', free: 'Next few: name, city and date', gated: 'Registration links, full calendar, filters and RSVP' },
]

export function FreeVsGated() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Left — the rule */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="rd-eyebrow gold mb-5">The model</span>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3.1rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
              See enough to believe it. Log in to act on it.
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
              One simple rule runs the whole platform. Free shows you the discovery, so you know the data is real and plentiful. A free profile unlocks the detail and the action.
            </p>
            <div className="mt-7 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: 'var(--rd-green-bg)', color: 'var(--rd-green)' }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--rd-muted)' }}>Free, no account</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: 'var(--rd-gold-bg)', color: 'var(--rd-gold)' }}><Lock className="h-3.5 w-3.5" /></span>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--rd-muted)' }}>With a free profile</span>
              </div>
            </div>
          </div>

          {/* Right — the four categories */}
          <motion.div className="flex flex-col gap-4" variants={list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
            {ROWS.map(r => {
              const Icon = r.icon
              return (
                <motion.div key={r.label} variants={reduce ? undefined : rowV} whileHover={reduce ? undefined : { y: -4 }} className="rounded-2xl p-5" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}>
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-[17px] w-[17px]" /></span>
                    <span className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--rd-ink)' }}>{r.label}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl p-3.5" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--rd-green)' }}>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Free
                      </div>
                      <p className="text-[13px] leading-snug" style={{ color: 'var(--rd-muted)' }}>{r.free}</p>
                    </div>
                    <div className="rounded-xl p-3.5" style={{ background: 'var(--rd-gold-bg)', border: '1px solid rgba(30,58,138,0.2)' }}>
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--rd-gold)' }}>
                        <Lock className="h-3.5 w-3.5" /> Unlocked
                      </div>
                      <p className="text-[13px] leading-snug" style={{ color: 'var(--rd-ink-2)' }}>{r.gated}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
