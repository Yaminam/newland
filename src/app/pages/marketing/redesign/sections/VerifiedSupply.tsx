import { BadgeCheck, CircleDot, UserPlus } from 'lucide-react'
import type { ComponentType } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { CountUp } from '../CountUp'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
const card: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

interface Tier {
  icon: ComponentType<{ className?: string }>
  tag: string
  tone: 'gold' | 'blue' | 'muted'
  title: string
  body: string
}

const TIERS: Tier[] = [
  { icon: BadgeCheck, tag: 'Verified', tone: 'gold', title: 'Human-checked and active', body: 'Reviewed by our team, ranked highest in your matches. The 192 we stand behind today.' },
  { icon: CircleDot, tag: 'Listed', tone: 'blue', title: 'Aggregated, clearly marked', body: 'Pulled from public ecosystem data. Counted honestly, never dressed up as verified.' },
  { icon: UserPlus, tag: 'Unclaimed', tone: 'muted', title: 'A warm reactivation lead', body: '“12 founders matched you this week. Claim your free profile.” Cold supply, woken up.' },
]

const toneMap = {
  gold: { c: 'var(--rd-gold)', bg: 'var(--rd-gold-bg)' },
  blue: { c: 'var(--rd-blue)', bg: 'var(--rd-blue-bg)' },
  muted: { c: 'var(--rd-muted)', bg: 'var(--rd-bg-2)' },
}

export function VerifiedSupply() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left — the confident statement + honest dual number */}
          <div>
            <span className="rd-eyebrow gold mb-5">Honest scale</span>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
              Big number and real number. Both true.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
              Anyone can claim ten thousand investors. We tag every one with a verification tier, so you always know exactly what you are looking at.
            </p>

            <div className="mt-9 flex items-stretch gap-4">
              <div className="flex-1 rounded-2xl p-5" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)' }}>
                <div className="rd-num text-[38px] font-extrabold leading-none" style={{ color: 'var(--rd-ink)' }}><CountUp to={5000} suffix="+" /></div>
                <div className="mt-2 text-[13px]" style={{ color: 'var(--rd-muted)' }}>in the directory</div>
              </div>
              <div className="flex-1 rounded-2xl p-5" style={{ background: 'var(--rd-gold-bg)', border: '1px solid rgba(30,58,138,0.22)' }}>
                <div className="rd-num flex items-center gap-1.5 text-[38px] font-extrabold leading-none" style={{ color: 'var(--rd-gold)' }}>
                  <CountUp to={192} /> <BadgeCheck className="h-6 w-6" />
                </div>
                <div className="mt-2 text-[13px] font-medium" style={{ color: 'var(--rd-gold)' }}>verified and active</div>
              </div>
            </div>
          </div>

          {/* Right — the three tiers */}
          <motion.div className="flex flex-col gap-4" variants={reduce ? undefined : list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
            {TIERS.map(t => {
              const Icon = t.icon
              const tone = toneMap[t.tone]
              const isGold = t.tone === 'gold'
              return (
                <motion.div key={t.tag} variants={reduce ? undefined : card}
                  whileHover={reduce ? undefined : { y: -4 }}
                  className={isGold ? 'rd-lit p-5' : 'rounded-2xl p-5'}
                  style={isGold ? undefined : { background: 'var(--rd-surface)', border: '1px solid var(--rd-border)' }}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.c }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[16px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--rd-ink)' }}>{t.title}</span>
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ background: tone.bg, color: tone.c }}>{t.tag}</span>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{t.body}</p>
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
