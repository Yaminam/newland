import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, BadgeCheck, Check, Sparkles, ChevronLeft, RotateCcw, MapPin, Wallet } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { MatchRing } from '@/app/components/ui/MatchRing'
import { CountUp } from '../CountUp'
import { useMatcher } from '../useMatcher'
import { STAGES, SECTORS, CITIES } from '../data'
import { AUDIENCES, TONE, InvestorPanel, IncubatorPanel, type Audience } from '../audiences'

const EASE = [0.22, 1, 0.36, 1] as const
const listV: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } }
const rowV: Variants = { hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0, transition: { duration: 0.42, ease: EASE } } }

const PICK_TONE = { blue: { c: 'var(--rd-blue)', bg: 'var(--rd-blue-bg)' }, gold: { c: 'var(--rd-gold)', bg: 'var(--rd-gold-bg)' }, green: { c: 'var(--rd-green)', bg: 'var(--rd-green-bg)' } }
const typeAccent: Record<string, string> = { VC: '#6366F1', Angel: 'var(--rd-blue)', 'Micro-VC': '#0D9488', 'Family office': 'var(--rd-green)' }

const CAPTION: Record<Audience, string> = {
  founders: 'Answer three quick questions to see your live matches.',
  investors: 'A live look at deal flow matched to your thesis.',
  incubators: 'A live look at your cohort’s fundraise, end to end.',
}

/* ── Founders: the 3-step matcher wizard ──────────────────────────────── */
function FounderWizard() {
  const reduce = useReducedMotion()
  const m = useMatcher()
  const [step, setStep] = useState(0)
  const [computing, setComputing] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const STEPS = [
    { label: 'Location', q: 'Where are you based?', hint: 'Every major Indian hub, plus remote-first funds.', options: CITIES as readonly string[], value: m.city as string, set: m.setCity as (v: string) => void, tone: 'green' as const },
    { label: 'Stage', q: 'What stage is your round?', hint: 'From your first cheque to growth rounds.', options: STAGES as readonly string[], value: m.stage as string, set: m.setStage as (v: string) => void, tone: 'blue' as const },
    { label: 'Sector', q: 'And your sector?', hint: 'Pick the closest fit. You can refine it later.', options: SECTORS as readonly string[], value: m.sector as string, set: m.setSector as (v: string) => void, tone: 'gold' as const },
  ]

  const choose = (v: string) => {
    STEPS[step].set(v)
    if (step < 2) { setStep(step + 1); return }
    setStep(3); setComputing(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setComputing(false), reduce ? 0 : 700)
  }
  const cur = STEPS[step]

  return (
    <div className="rd-lit relative z-10">
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--rd-border)' }}>
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#F87171' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#FBBF24' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#34D399' }} /></span>
        <span className="ml-2 text-[12.5px] font-bold" style={{ color: 'var(--rd-ink)', fontFamily: 'var(--font-display)' }}>Investor Match</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--rd-green)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rd-green)' }} />
          {step < 3 ? `Step ${step + 1} of 3` : `${m.matches} results`}
        </span>
      </div>

      <div className="p-4" style={{ minHeight: 248 }}>
        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-5 flex gap-1.5">
                {[0, 1, 2].map(k => <div key={k} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: k <= step ? 'var(--rd-blue)' : 'var(--rd-border-2)' }} />)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -18 }} transition={{ duration: 0.28, ease: EASE }}>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--rd-muted-2)' }}>{cur.label}</div>
                  <div className="mb-4 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '19px', letterSpacing: '-0.015em', color: 'var(--rd-ink)' }}>{cur.q}</div>
                  <div className="flex flex-wrap gap-2">
                    {cur.options.map(opt => {
                      const active = opt === cur.value
                      const t = PICK_TONE[cur.tone]
                      return (
                        <button key={opt} type="button" onClick={() => choose(opt)}
                          className="rounded-xl px-3.5 py-2.5 text-[13.5px] font-bold transition-all"
                          style={{ background: active ? t.bg : 'var(--rd-surface-2)', color: active ? t.c : 'var(--rd-ink-2)', border: `1.5px solid ${active ? t.c : 'var(--rd-border)'}` }}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-4 text-[12.5px]" style={{ color: 'var(--rd-muted-2)' }}>{cur.hint}</p>
                </motion.div>
              </AnimatePresence>
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: 'var(--rd-muted)' }}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[13.5px] font-bold" style={{ color: 'var(--rd-ink)' }}>
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--rd-blue)' }} />
                  {computing ? 'Scoring the directory…' : `${m.matches} investors match you`}
                </span>
                <button type="button" onClick={() => { setStep(0); setComputing(false) }} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--rd-muted)' }}>
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </button>
              </div>

              <AnimatePresence mode="wait">
                {computing ? (
                  <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                    {[0, 1, 2].map(i => <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ border: '1px solid var(--rd-border)' }}><div className="skeleton h-12 w-12 rounded-full" /><div className="flex-1"><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton mt-2.5 h-2.5 w-4/5 rounded" /><div className="skeleton mt-2 h-2.5 w-3/5 rounded" /></div></div>)}
                  </motion.div>
                ) : (
                  <motion.div key={m.comboKey} variants={reduce ? undefined : listV} initial={reduce ? false : 'hidden'} animate="show" className="flex flex-col gap-2">
                    {m.top.map(inv => (
                      <motion.div key={inv.name} variants={reduce ? undefined : rowV} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
                        <MatchRing score={inv.fit} size={48} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13.5px] font-bold" style={{ color: 'var(--rd-ink)', filter: 'blur(4.5px)', userSelect: 'none' }}>{inv.name}</span>
                            {inv.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--rd-gold)' }} />}
                            <span className="ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]" style={{ background: 'var(--rd-bg-2)', color: typeAccent[inv.type] }}>{inv.type}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {inv.sectors.slice(0, 2).map(sTag => (
                              <span key={sTag} className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ border: '1px solid var(--rd-border-2)', color: 'var(--rd-muted)' }}>{sTag}</span>
                            ))}
                            <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)', border: '1px solid rgba(37,99,235,0.2)' }}>{m.stage}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-[11px]" style={{ color: 'var(--rd-muted)' }}>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color: 'var(--rd-muted-2)' }} /> {m.city}</span>
                            <span className="rd-num inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--rd-ink-2)' }}><Wallet className="h-3 w-3" style={{ color: 'var(--rd-muted-2)' }} /> {inv.cheque}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-white" style={{ background: 'linear-gradient(120deg,#0D1B2A,#1E3A5F)' }}>
                <span className="inline-flex items-center gap-2 text-[12px] font-medium"><Lock className="h-3.5 w-3.5" style={{ color: 'var(--rd-gold-br)' }} /> +{m.locked} more match you</span>
                <Link to="/auth/signup" className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--rd-gold-br)' }}>Unlock all {m.matches} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ── Hero with the three-audience toggle ──────────────────────────────── */
export function HeroMatcher({ audience, setAudience }: { audience: Audience; setAudience: (a: Audience) => void }) {
  const reduce = useReducedMotion()
  const cfg = AUDIENCES[audience]
  const tone = TONE[audience]

  return (
    <section className="relative overflow-hidden">
      <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-12 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:pb-24 lg:pt-16">
        {/* ── Left ── */}
        <div>
          {/* Audience toggle */}
          <div className="mb-7 inline-flex flex-wrap gap-1.5 rounded-2xl p-1.5" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 8px rgba(13,27,42,0.05)' }}>
            {(Object.keys(AUDIENCES) as Audience[]).map(k => {
              const a = AUDIENCES[k]
              const Icon = a.icon
              const on = k === audience
              const t = TONE[k]
              return (
                <button key={k} type="button" onClick={() => setAudience(k)}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-bold transition-all"
                  style={{ background: on ? t.bg : 'transparent', color: on ? t.c : 'var(--rd-muted)', border: `1px solid ${on ? t.br : 'transparent'}` }}>
                  <Icon className="h-3.5 w-3.5" /> {a.tab}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={audience}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: EASE }}>

              <span className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
                style={{ background: tone.bg, color: tone.c, border: `1px solid ${tone.br}` }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: tone.c, animation: reduce ? undefined : 'rdPing 2s cubic-bezier(0,0,0.2,1) infinite' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone.c }} />
                </span>
                {cfg.eyebrow}
              </span>

              <h1 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 4.8vw, 4.3rem)', lineHeight: 0.99, letterSpacing: '-0.045em', color: 'var(--rd-ink)' }}>
                {cfg.headLead} <span className="rd-grad-text">{cfg.headAccent}</span>
              </h1>

              <p className="mt-5 max-w-md" style={{ fontSize: 'clamp(1.02rem, 1.4vw, 1.15rem)', lineHeight: 1.6, color: 'var(--rd-muted)' }}>{cfg.sub}</p>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link to="/auth/signup" className="rd-btn rd-btn-primary w-full sm:w-auto" style={{ height: 54, padding: '0 26px', fontSize: '15.5px' }}>
                  {cfg.cta} <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="rd-btn rd-btn-ghost w-full sm:w-auto" style={{ height: 54, padding: '0 22px', fontSize: '15px' }}>See how it works</a>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium" style={{ color: 'var(--rd-muted-2)' }}>
                {cfg.trust.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" style={{ color: 'var(--rd-green)' }} strokeWidth={3} /> {t}</span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t pt-6" style={{ borderColor: 'var(--rd-border)' }}>
                {cfg.stats.map(s => (
                  <div key={s.label}>
                    <div className="rd-num flex items-center gap-1 text-[27px] font-extrabold leading-none" style={{ color: s.accent ? tone.c : 'var(--rd-ink)' }}>
                      {s.count !== undefined ? <CountUp to={s.count} suffix={s.suffix} /> : s.big}
                      {s.accent && audience === 'founders' && <BadgeCheck className="h-4 w-4" />}
                    </div>
                    <div className="mt-1.5 text-[12px]" style={{ color: 'var(--rd-muted-2)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Right: the live product, tinted per audience ── */}
        <div className="relative" style={{ perspective: 1500 }}>
          <motion.div aria-hidden className="pointer-events-none absolute -inset-8 z-0"
            animate={{ background: `radial-gradient(circle at 55% 38%, ${tone.glow}, transparent 58%), radial-gradient(circle at 28% 85%, rgba(214,155,52,0.14), transparent 58%)` }}
            transition={{ duration: 0.5 }}
            style={{ filter: 'blur(24px)' }} />

          <motion.div style={{ transformPerspective: 1500 }}
            initial={reduce ? false : { opacity: 0, rotateY: -16, rotateX: 7, y: 24 }}
            animate={reduce ? false : { opacity: 1, rotateY: -12, rotateX: 6, y: 0 }}
            whileHover={reduce ? undefined : { rotateY: 0, rotateX: 0 }}
            transition={{ duration: 0.6, ease: EASE }}>
            <div style={{ minHeight: 430 }}>
              <AnimatePresence mode="wait">
                <motion.div key={audience}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: EASE }}>
                  {audience === 'founders' ? <FounderWizard /> : audience === 'investors' ? <InvestorPanel /> : <IncubatorPanel />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <p className="mt-5 text-center text-[12.5px] lg:text-right" style={{ color: 'var(--rd-muted-2)' }}>{CAPTION[audience]}</p>
        </div>
      </div>
    </section>
  )
}
