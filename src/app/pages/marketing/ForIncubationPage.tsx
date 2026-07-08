import { useEffect, useState, type FormEvent, type ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Check, Menu, X, Plus, Loader2, Building2,
  Users2, Handshake, ClipboardCheck, LineChart, Send, Target,
  Rocket, GraduationCap, Landmark, Boxes,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { SEO } from '@/app/components/SEO'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'
import { MarketingFooter } from './sections/MarketingFooter'

const EASE = [0.22, 1, 0.36, 1] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function useSignupUrl() {
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams()
  params.set('role', 'incubation')
  ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
    const v = searchParams.get(k)
    if (v) params.set(k, v)
  })
  return `/auth/signup?${params.toString()}`
}

/* ── Nav ───────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'What you get', href: '#value' },
  { label: 'FAQ', href: '#faq' },
]

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className="sticky top-0 z-50 transition-all duration-300" style={{ background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-10">
        <Link to="/" aria-label="FounderCentral home" className="flex items-center"><FounderCentralLogo size="md" /></Link>
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(l => (<a key={l.href} href={l.href} className="text-[14px] font-semibold transition-colors hover:[color:var(--blue-h)]" style={{ color: 'var(--muted)' }}>{l.label}</a>))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/auth/login" className="text-[14px] font-semibold transition-colors hover:[color:var(--blue-h)]" style={{ color: 'var(--ink)' }}>Sign in</Link>
          <a href="#demo" className="btn-primary" style={{ height: 44, padding: '0 20px', fontSize: '14px', borderRadius: 10 }}>Book a demo<ArrowRight className="h-4 w-4" /></a>
        </div>
        <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setOpen(o => !o)} style={{ color: 'var(--ink)' }}>{open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>
      {open && (
        <div className="border-t lg:hidden" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div className="flex flex-col gap-1 px-5 py-3">
            {NAV_LINKS.map(l => (<a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>{l.label}</a>))}
            <a href="#demo" onClick={() => setOpen(false)} className="btn-primary mt-2 justify-center" style={{ height: 48, fontSize: '15px', borderRadius: 10 }}>Book a demo<ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      )}
    </header>
  )
}

/* ── Cohort board visual ───────────────────────────────────────── */
const COHORT = [
  { in: 'AR', name: 'Acme Robotics', stage: 'Seed', status: 'Intro sent', tone: 'blue' as const },
  { in: 'BW', name: 'Bytewave', stage: 'Pre-seed', status: 'In diligence', tone: 'warn' as const },
  { in: 'CW', name: 'Cropwise', stage: 'Seed', status: 'Term sheet', tone: 'pos' as const },
  { in: 'NW', name: 'Northwind', stage: 'Seed', status: 'Matched', tone: 'muted' as const },
]
const TONE: Record<string, { bg: string; color: string }> = {
  blue: { bg: 'var(--blue-bg)', color: 'var(--blue-h)' },
  warn: { bg: 'var(--warn-bg)', color: 'var(--warn)' },
  pos: { bg: 'var(--pos-bg)', color: 'var(--pos)' },
  muted: { bg: 'var(--surface-3)', color: 'var(--muted-2)' },
}

const COHORT_STEPS = ['Add your cohort', 'Match to investors', 'Send intros', 'Track to close']

function CohortStep({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const fade = { initial: reducedMotion ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: EASE } }

  // 1 — matching
  if (step === 1) {
    return (
      <motion.div className="flex flex-col items-center justify-center gap-4 py-5" {...fade}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--blue-h)' }} />
        <div className="text-[14.5px] font-semibold" style={{ color: 'var(--ink)' }}>Matching your cohort to investors…</div>
        <div className="h-1.5 w-full max-w-[230px] overflow-hidden rounded-full" style={{ background: 'var(--blue-bg)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} initial={reducedMotion ? { width: '100%' } : { width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.6, ease: EASE }} />
        </div>
        <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>4 startups · ranked by fit</div>
      </motion.div>
    )
  }

  return (
    <motion.div className="flex flex-col" {...fade}>
      {COHORT.map((c, i) => {
        const b = step === 0
          ? { text: 'Added', bg: 'var(--pos-bg)', color: 'var(--pos)' }
          : step === 2
            ? { text: 'Intro sent', bg: 'var(--blue-bg)', color: 'var(--blue-h)' }
            : { text: c.status, bg: TONE[c.tone].bg, color: TONE[c.tone].color }
        return (
          <motion.div
            key={c.name}
            className="flex items-center gap-3 border-b py-3 last:border-b-0"
            style={{ borderColor: 'var(--line)' }}
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.15 + i * 0.14, duration: 0.45, ease: EASE }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>{c.in}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{c.name}</div>
              <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>{c.stage}</div>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: b.bg, color: b.color }}>{b.text}</span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function CohortBoard() {
  const reducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reducedMotion) { setStep(3); return }
    const t = setInterval(() => setStep(s => (s + 1) % 4), 3200)
    return () => clearInterval(t)
  }, [reducedMotion])

  return (
    <motion.div
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 50px 90px -40px rgba(13,27,42,0.4)' }}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div aria-hidden className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #60A5FA)' }} />
      <div className="flex items-center justify-between gap-3 border-b px-5 pb-4 pt-4" style={{ borderColor: 'var(--line)' }}>
        <div>
          <div className="text-[14px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Cohort portal</div>
          <div className="mt-0.5 text-[12.5px] font-semibold" style={{ color: 'var(--blue-h)' }}>
            <span style={{ color: 'var(--muted-2)' }}>{step + 1}/4 · </span>{COHORT_STEPS[step]}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pos)' }} /> Live
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-5 pb-4 pt-3.5">
        {COHORT_STEPS.map((_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= step ? 'var(--blue-h)' : 'var(--line)' }} />
        ))}
      </div>
      <div className="flex min-h-[212px] flex-col justify-center border-t px-5 py-4 sm:px-6" style={{ borderColor: 'var(--line)' }}>
        <AnimatePresence mode="wait">
          <CohortStep key={step} step={step} reducedMotion={!!reducedMotion} />
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Hero ──────────────────────────────────────────────────────── */
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }

function Hero({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1100px 520px at 80% -10%, rgba(96,165,250,0.1) 0%, transparent 60%)' }} />
      </div>
      <FloatingOrbs />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <motion.div variants={container} initial={reducedMotion ? false : 'hidden'} animate={reducedMotion ? false : 'show'}>
          <motion.p variants={item} className="mb-5 text-[12.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--blue-h)' }}>For incubators &amp; accelerators</motion.p>
          <motion.h1 variants={item} className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.3rem, 4.8vw, 3.9rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            Run your whole cohort&rsquo;s fundraise from one portal.
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Connect your founders to the right investors, send curated introductions on their behalf, and
            track every deal and milestone, without living in a spreadsheet.
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="btn-primary w-full sm:w-auto" style={{ height: 54, padding: '0 28px', fontSize: '1rem', borderRadius: 11 }}>
              Book your free demo
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link to={signupUrl} className="btn-outline" style={{ height: 54, padding: '0 24px', fontSize: '0.9375rem', borderRadius: 11 }}>Set up your portal</Link>
          </motion.div>
          <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]" style={{ color: 'var(--muted-2)' }}>
            <span className="group inline-flex items-center gap-1.5"><Check className="h-4 w-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" style={{ color: 'var(--pos)' }} /> Free for incubators</span>
            <span className="group inline-flex items-center gap-1.5"><Check className="h-4 w-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" style={{ color: 'var(--pos)' }} /> Your whole cohort, one view</span>
            <span className="group inline-flex items-center gap-1.5"><Check className="h-4 w-4 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6" style={{ color: 'var(--pos)' }} /> No spreadsheets</span>
          </motion.div>
        </motion.div>
        <CohortBoard />
      </div>
    </section>
  )
}

/* ── Value / benefits ──────────────────────────────────────────── */
type Benefit = { icon: ComponentType<{ className?: string }>; title: string; body: string }
const BENEFITS: Benefit[] = [
  { icon: Users2, title: 'Cohort dashboard', body: 'Every startup on one screen: stage, sector, ask, readiness. No more chasing 30 founders for an update.' },
  { icon: Handshake, title: 'Intros on their behalf', body: 'Send curated introductions for your companies. Be the connector, without living in a spreadsheet.' },
  { icon: ClipboardCheck, title: 'Diligence checklists', body: 'Get startups investor-ready before the first call. Fewer “we’ll send that over” moments.' },
  { icon: LineChart, title: 'Pipeline visibility', body: 'Every intro, acceptance and deal in view. Spot who needs a nudge and who’s about to close.' },
]
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const cell: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

function Benefits() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="value" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="max-w-2xl" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>What you get</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            One portal for the whole cohort.
          </h2>
        </motion.div>
        <motion.div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2" variants={list} initial={reducedMotion ? false : 'hidden'} whileInView={reducedMotion ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {BENEFITS.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div key={b.title} variants={cell} whileHover={reducedMotion ? undefined : { y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} className="group flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105" style={{ background: 'var(--gradient-primary)', boxShadow: '0 14px 30px -12px rgba(37,99,235,0.45)' }}>
                  <Icon className="h-[22px] w-[22px]" />
                </span>
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.15rem, 1.8vw, 1.4rem)', letterSpacing: '-0.015em', color: 'var(--ink)' }}>{b.title}</h3>
                    <span className="text-[12px] font-bold tabular-nums" style={{ color: 'var(--blue-l)' }}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <p className="mt-2 max-w-md text-[15.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{b.body}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ── How it works ──────────────────────────────────────────────── */
type Step = { icon: ComponentType<{ className?: string }>; title: string; body: string }
const STEPS: Step[] = [
  { icon: Users2, title: 'Add your cohort', body: 'Bring your startups in, or invite them to build their one-pagers. Stage, sector, ask, all in one place.' },
  { icon: Target, title: 'Match to investors', body: 'Each company is matched to investors that fit, ranked by relevance with the reasons shown.' },
  { icon: Send, title: 'Send intros on their behalf', body: 'Make curated introductions as the trusted connector. Both sides opt in.' },
  { icon: LineChart, title: 'Track to close', body: 'Watch every intro, meeting and term sheet across the cohort, and step in where it counts.' },
]

function HowItWorks() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="how-it-works" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-24">
        <motion.div className="lg:sticky lg:top-28 lg:self-start" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>How it works</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            From cohort to close, in one place.
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            You stay the connector your founders trust. We handle the matching, the format and the tracking.
          </p>
        </motion.div>

        <motion.div className="border-t" style={{ borderColor: 'var(--line)' }} variants={list} initial={reducedMotion ? false : 'hidden'} whileInView={reducedMotion ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.title} variants={cell} whileHover={reducedMotion ? undefined : { x: 6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="group grid grid-cols-[auto_1fr] gap-5 border-b py-7" style={{ borderColor: 'var(--line)' }}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold tabular-nums" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)', border: '1px solid var(--blue-border)' }}>{String(i + 1).padStart(2, '0')}</span>
                <div className="pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--blue-h)' }}><Icon className="h-[18px] w-[18px]" /></span>
                    <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.15rem, 1.9vw, 1.4rem)', letterSpacing: '-0.015em', color: 'var(--ink)' }}>{s.title}</h3>
                  </div>
                  <p className="mt-2 max-w-md text-[15.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{s.body}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Who it's for ──────────────────────────────────────────────── */
const AUDIENCE: { icon: ComponentType<{ className?: string }>; label: string }[] = [
  { icon: Rocket, label: 'Accelerators' },
  { icon: Building2, label: 'Incubators' },
  { icon: GraduationCap, label: 'University programs' },
  { icon: Landmark, label: 'Government schemes' },
  { icon: Boxes, label: 'Studio & platform teams' },
  { icon: Users2, label: 'Angel networks' },
]

function WhoFor() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:px-10 sm:py-18">
        <motion.div className="mx-auto max-w-xl" initial={reducedMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5, ease: EASE }}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>Built for</p>
          <h2 className="mt-3 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', lineHeight: 1.14, letterSpacing: '-0.022em', color: 'var(--ink)' }}>
            Any program backing founders who raise.
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6"
          variants={list}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-40px' }}
        >
          {AUDIENCE.map(a => {
            const Icon = a.icon
            return (
              <motion.div key={a.label} variants={cell} className="group flex flex-col items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-1" style={{ background: 'var(--surface)', color: 'var(--blue-h)', border: '1px solid var(--line)', boxShadow: '0 10px 24px -14px rgba(13,27,42,0.3)' }}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-[13.5px] font-semibold leading-tight" style={{ color: 'var(--ink-2)' }}>{a.label}</span>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Book a demo (lead capture) ────────────────────────────────── */
function DemoForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  const inputBase = dark
    ? { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', outline: 'none' as const }
    : { background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none' as const }
  const inputClass = `text-sm${dark ? ' placeholder:text-white/50' : ''}`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'done') return
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) { toast.error('Enter a valid work email.'); return }
    setStatus('submitting')
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed, name: org.trim() || null, status: 'active', source: 'incubation_landing' })
    if (error && error.code !== '23505') { setStatus('idle'); toast.error('Could not send. Please try again.'); return }
    setStatus('done'); setEmail(''); setOrg('')
  }

  if (status === 'done') {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: '1px solid var(--success-border)' }}>
        <Check className="h-4 w-4" strokeWidth={3} /> Request received. We’ll reach out to schedule your demo.
      </div>
    )
  }
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2.5">
      <input type="text" value={org} onChange={e => setOrg(e.target.value)} placeholder="Your program or organisation" className={inputClass} style={{ height: 50, padding: '0 16px', borderRadius: 11, ...inputBase }} />
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input type="email" inputMode="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourprogram.org" disabled={status === 'submitting'} className={inputClass} style={{ flex: 1, height: 50, minWidth: 0, padding: '0 16px', borderRadius: 11, ...inputBase }} />
        <button type="submit" disabled={status === 'submitting'} className="btn-primary" style={{ height: 50, padding: '0 22px', fontSize: '0.9375rem', borderRadius: 11 }}>
          {status === 'submitting' ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending</>) : (<>Book a demo</>)}
        </button>
      </div>
    </form>
  )
}

const DEMO_STEPS = [
  { t: 'Tell us about your program', s: 'Org name and work email, that’s it.' },
  { t: 'A short walkthrough', s: 'We show the cohort portal on your stage and sector.' },
  { t: 'Bring your cohort in', s: 'We help you set up and invite your founders.' },
]

function DemoSection({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  return (
    <section id="demo" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 44px 90px -48px rgba(13,27,42,0.5)' }} initial={reducedMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, ease: EASE }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <RisingParticles />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-12">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#93C5FD' }}>See it on your cohort</p>
              <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', lineHeight: 1.1, letterSpacing: '-0.026em', color: '#fff' }}>Book a demo.</h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.74)' }}>
                Tell us about your program and we’ll walk you through the cohort portal, then help you bring your founders in.
              </p>
              <div className="mt-7"><DemoForm dark /></div>
              <p className="mt-3.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Prefer to explore first? <Link to={signupUrl} className="font-semibold" style={{ color: '#93C5FD' }}>Set up your portal</Link> directly.
              </p>
            </div>
            <div className="relative overflow-hidden p-8 sm:p-12 lg:border-l" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.22), transparent 70%)', filter: 'blur(18px)' }} />
              <p className="relative text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#93C5FD' }}>What happens next</p>
              <div className="relative mt-6 flex flex-col gap-5">
                {DEMO_STEPS.map((st, i) => (
                  <div key={st.t} className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)', boxShadow: '0 8px 18px -8px rgba(96,165,250,0.6)' }}>{i + 1}</span>
                    <div>
                      <div className="text-[15px] font-bold" style={{ color: '#fff' }}>{st.t}</div>
                      <div className="mt-0.5 text-[13.5px]" style={{ color: 'rgba(255,255,255,0.68)' }}>{st.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── FAQ ───────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'How do introductions on behalf of founders work?', a: 'You request or make curated introductions for your companies. Both the founder and the investor opt in, and the conversation moves to email. You stay the trusted connector throughout.' },
  { q: 'Is there a cost for incubators?', a: 'Free to run your cohort and make introductions. Pricing for advanced tooling is shared during onboarding. Founders are always free.' },
  { q: 'How many startups can I add?', a: 'As many as you run. The cohort dashboard scales from a handful of companies to a full programme.' },
  { q: 'Can my team collaborate in one portal?', a: 'Yes. Invite your team, manage the cohort together, and keep everyone on the same pipeline view.' },
  { q: 'Do founders need their own accounts?', a: 'Each founder builds and owns their one-pager. You get the cohort-wide view and the tools to connect them to investors.' },
]

function FAQ() {
  const reducedMotion = useReducedMotion()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>For programs</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>Answered plainly.</h2>
        </motion.div>
        <div className="mt-12 border-t" style={{ borderColor: 'var(--line)' }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="group flex w-full items-center gap-4 py-6 text-left">
                  <span className="flex-1 font-bold transition-colors duration-200 group-hover:[color:var(--blue-h)]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)', letterSpacing: '-0.015em', color: isOpen ? 'var(--blue-h)' : 'var(--ink)' }}>{f.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300" style={{ background: isOpen ? 'var(--gradient-primary)' : 'var(--surface)', color: isOpen ? '#fff' : 'var(--muted-2)', border: isOpen ? 'none' : '1px solid var(--line)', transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)' }}><Plus className="h-4 w-4" /></span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden"><p className="max-w-xl pb-6 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{f.a}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Closer ────────────────────────────────────────────────────── */
function Closer() {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      <div className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <RisingParticles />
          <AscendingRocket left="84%" delay={1.2} dur={8} size={26} />
          <div className="relative mx-auto max-w-2xl">
            <motion.h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em', color: '#fff' }} initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, ease: EASE }}>
              Give your cohort an unfair fundraising edge.
            </motion.h2>
            <motion.p className="mx-auto mt-5 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.78)' }} initial={reducedMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }}>
              Book a demo and we’ll show you the cohort portal on your own program, then help you bring your founders in.
            </motion.p>
            <motion.div className="mt-9" initial={reducedMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: 0.14, ease: EASE }}>
              <a href="#demo" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-9 text-base font-bold" style={{ background: '#fff', color: '#0D1B2A', boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)' }}>
                <Building2 className="h-5 w-5" /> Book a demo
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Hook strip (CRO) ──────────────────────────────────────────── */
const HOOKS = ['Your whole cohort, one screen', 'Curated intros on their behalf', 'Investor-ready before the first call', 'Every deal tracked to close']

function HookStrip() {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return (
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 sm:px-10">
          {HOOKS.map(h => (
            <span key={h} className="inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
              <Check className="h-4 w-4" strokeWidth={3} style={{ color: 'var(--blue-h)' }} />
              {h}
            </span>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 sm:w-28" style={{ background: 'linear-gradient(90deg, var(--surface), transparent)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 sm:w-28" style={{ background: 'linear-gradient(270deg, var(--surface), transparent)' }} />
      <div className="flex py-5">
        <motion.div className="flex shrink-0" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}>
          {[0, 1].map(group => (
            <div key={group} className="flex shrink-0 items-center">
              {[...HOOKS, ...HOOKS, ...HOOKS].map((h, i) => (
                <span key={`${group}-${i}`} className="inline-flex shrink-0 items-center gap-2 px-7 text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
                  <Check className="h-4 w-4 shrink-0" strokeWidth={3} style={{ color: 'var(--blue-h)' }} />
                  {h}
                  <span aria-hidden className="ml-7 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--blue-l)' }} />
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Objection handling (CRO) ──────────────────────────────────── */
const OBJECTIONS = [
  { q: 'We already track our cohort in spreadsheets.', a: 'Spreadsheets don’t rank investor fit or send introductions. This does both, and keeps the whole pipeline in one live view.' },
  { q: 'Will this add work for my team?', a: 'It removes work. No more chasing 30 founders for updates or hunting for the right investor, it’s all in one portal.' },
  { q: 'Do our founders have to do extra?', a: 'They build one structured one-pager, once. You get the cohort-wide view and the tools to connect them.' },
  { q: 'Is it actually free for us?', a: 'Running your cohort and making introductions is free. Founders are always free too.' },
]
const obList: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const obItem: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

function Objections() {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <FloatingOrbs />
      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="mx-auto max-w-2xl text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>Straight answers</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>You might be thinking&hellip;</h2>
        </motion.div>
        <motion.div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-2 sm:mt-16 sm:grid-cols-2" variants={obList} initial={reducedMotion ? false : 'hidden'} whileInView={reducedMotion ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {OBJECTIONS.map(o => (
            <motion.div
              key={o.q}
              variants={obItem}
              whileHover={reducedMotion ? undefined : { y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="group border-t py-6"
              style={{ borderColor: 'var(--line)' }}
            >
              <p className="text-[16px] font-semibold italic" style={{ color: 'var(--ink-2)' }}>&ldquo;{o.q}&rdquo;</p>
              <p className="mt-2.5 flex items-start gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--blue-h)' }} />
                <span className="text-[15.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{o.a}</span>
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Sticky demo bar (CRO) ─────────────────────────────────────── */
function StickyDemo() {
  const reducedMotion = useReducedMotion()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" initial={reducedMotion ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducedMotion ? undefined : { y: 90, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
          <div className="flex items-center gap-3 rounded-full py-2.5 pl-5 pr-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--blue-border)', boxShadow: '0 20px 50px -16px rgba(37,99,235,0.4)' }}>
            <span className="hidden text-[14px] font-semibold sm:inline" style={{ color: 'var(--ink)' }}>Give your cohort a stronger raise.</span>
            <span className="text-[14px] font-semibold sm:hidden" style={{ color: 'var(--ink)' }}>See the portal.</span>
            <a href="#demo" onClick={() => setDismissed(true)} className="btn-primary shrink-0" style={{ height: 40, padding: '0 16px', fontSize: '13.5px', borderRadius: 999 }}>
              Book a demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:[background:var(--surface-2)]" style={{ color: 'var(--muted-2)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Ambient motion (rising particles + ascending rockets) ─────── */
const PARTICLES = [
  { x: 5, size: 4, delay: 0, dur: 9, o: 0.5 }, { x: 13, size: 6, delay: 2.4, dur: 11, o: 0.35 },
  { x: 21, size: 3, delay: 1.1, dur: 8, o: 0.55 }, { x: 30, size: 5, delay: 3.6, dur: 12, o: 0.3 },
  { x: 38, size: 4, delay: 0.6, dur: 10, o: 0.45 }, { x: 47, size: 7, delay: 4.2, dur: 13, o: 0.28 },
  { x: 55, size: 3, delay: 1.8, dur: 9, o: 0.5 }, { x: 63, size: 5, delay: 3.0, dur: 11, o: 0.34 },
  { x: 71, size: 4, delay: 0.3, dur: 10, o: 0.48 }, { x: 79, size: 6, delay: 2.0, dur: 12, o: 0.32 },
  { x: 87, size: 3, delay: 4.8, dur: 8, o: 0.52 }, { x: 94, size: 5, delay: 1.4, dur: 11, o: 0.38 },
]

function RisingParticles() {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, bottom: -12, width: p.size, height: p.size, background: `rgba(147,197,253,${p.o})`, boxShadow: `0 0 ${p.size * 2}px rgba(96,165,250,0.6)` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, -560], opacity: [0, p.o, p.o, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

function AscendingRocket({ left, delay = 0, dur = 8, size = 26 }: { left: string; delay?: number; dur?: number; size?: number }) {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-0"
      style={{ left }}
      initial={{ x: -24, y: 80, opacity: 0 }}
      animate={{ x: [-24, 70], y: [80, -220], opacity: [0, 1, 1, 0] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeOut' }}
    >
      <div className="relative">
        <span
          className="absolute bottom-1 right-full h-[2px] w-24 origin-right -rotate-[26deg] rounded-full"
          style={{ background: 'linear-gradient(270deg, rgba(147,197,253,0.85), transparent)' }}
        />
        <Rocket style={{ width: size, height: size, color: '#93C5FD', filter: 'drop-shadow(0 0 10px rgba(96,165,250,0.75))' }} />
      </div>
    </motion.div>
  )
}

/* soft drifting orbs for light sections — subtle life, no clutter */
function FloatingOrbs() {
  const reducedMotion = useReducedMotion()
  if (reducedMotion) return null
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 300, height: 300, left: '-5%', top: '8%', background: 'radial-gradient(circle, rgba(96,165,250,0.16), transparent 70%)' }}
        animate={{ y: [0, -28, 0], x: [0, 16, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{ width: 240, height: 240, right: '-4%', bottom: '6%', background: 'radial-gradient(circle, rgba(147,197,253,0.18), transparent 70%)' }}
        animate={{ y: [0, 24, 0], x: [0, -14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* ── COHORT mnemonic (memorable recap) ─────────────────────────── */
const COHORT_WORDS = [
  { l: 'C', word: 'Cohort', line: 'Every startup you back, on one screen.' },
  { l: 'O', word: 'On their behalf', line: 'Curated intros, made as the connector.' },
  { l: 'H', word: 'Hand-picked', line: 'Investors matched and ranked by fit.' },
  { l: 'O', word: 'One format', line: 'Every founder, the same clean one-pager.' },
  { l: 'R', word: 'Ready', line: 'Diligence checklists before the first call.' },
  { l: 'T', word: 'Tracked', line: 'Every intro and deal, all the way to close.' },
]

function CohortMnemonic() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || reducedMotion) return
    const id = setInterval(() => setActive((a) => (a + 1) % COHORT_WORDS.length), 2800)
    return () => clearInterval(id)
  }, [paused, reducedMotion])

  const cur = COHORT_WORDS[active]
  const BLUE_GLOW = 'linear-gradient(135deg, #60A5FA 0%, #93C5FD 100%)'

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <RisingParticles />
      <AscendingRocket left="7%" delay={0} dur={9} size={24} />
      <AscendingRocket left="78%" delay={3.6} dur={8} size={28} />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="mx-auto max-w-2xl text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#93C5FD' }}>The shorthand</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: '#fff' }}>
            One word runs your cohort.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Hover a letter, or watch it spell itself out.
          </p>
        </motion.div>

        {/* giant interactive wordmark — spotlight sweeps across COHORT */}
        <div
          className="mx-auto mt-12 flex max-w-4xl flex-nowrap items-end justify-center gap-[0.04em] sm:mt-14"
          onMouseLeave={() => setPaused(false)}
        >
          {COHORT_WORDS.map((t, i) => {
            const on = i === active
            return (
              <button
                key={i}
                type="button"
                aria-label={`${t.l} — ${t.word}`}
                onMouseEnter={() => { setActive(i); setPaused(true) }}
                onFocus={() => { setActive(i); setPaused(true) }}
                onClick={() => { setActive(i); setPaused(true) }}
                className="relative cursor-pointer select-none bg-transparent leading-[0.85] outline-none"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 12vw, 8rem)', fontWeight: 800, letterSpacing: '-0.05em', padding: 0 }}
              >
                <motion.span
                  className="block"
                  animate={reducedMotion ? undefined : { y: on ? -6 : 0, scale: on ? 1.04 : 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  style={
                    on
                      ? { background: BLUE_GLOW, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: '0.06em', filter: 'drop-shadow(0 16px 30px rgba(96,165,250,0.5))' }
                      : { color: 'rgba(255,255,255,0.13)', paddingBottom: '0.06em', transition: 'color 0.35s ease' }
                  }
                >
                  {t.l}
                </motion.span>
                {on && !reducedMotion && (
                  <motion.span
                    layoutId="cohort-spot"
                    className="absolute -bottom-1 left-1/2 h-[5px] w-[64%] -translate-x-1/2 rounded-full"
                    style={{ background: BLUE_GLOW, boxShadow: '0 0 14px rgba(96,165,250,0.7)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* meaning panel — crossfades with the active letter */}
        <div className="relative mx-auto mt-10 flex min-h-[112px] max-w-xl items-start justify-center text-center sm:min-h-[100px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reducedMotion ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', letterSpacing: '-0.02em', color: '#fff' }}>
                <span style={{ background: BLUE_GLOW, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{cur.l}</span>
                <span style={{ color: '#fff' }}>{cur.word.slice(1)}</span>
              </h3>
              <p className="mx-auto mt-2 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>{cur.line}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* progress rail */}
        <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-2">
          {COHORT_WORDS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to letter ${i + 1}`}
              onClick={() => { setActive(i); setPaused(true) }}
              onMouseEnter={() => { setActive(i); setPaused(true) }}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === active ? 28 : 10, background: i === active ? '#60A5FA' : 'rgba(255,255,255,0.22)' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */
export function ForIncubationPage() {
  const signupUrl = useSignupUrl()
  return (
    <div className="marketing-page" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <SEO
        title="FounderCentral for Incubators & Accelerators: run your cohort’s fundraise from one portal"
        bareTitle
        description="Connect your cohort to the right investors, send curated introductions on their behalf, and track every deal and milestone from a single portal. Built for accelerators, incubators and programs."
        path="/for-incubators"
      />
      <Nav />
      <main>
        <Hero signupUrl={signupUrl} />
        <HookStrip />
        <Benefits />
        <HowItWorks />
        <CohortMnemonic />
        <WhoFor />
        <Objections />
        <DemoSection signupUrl={signupUrl} />
        <FAQ />
        <Closer />
      </main>
      <MarketingFooter />
      <StickyDemo />
    </div>
  )
}
