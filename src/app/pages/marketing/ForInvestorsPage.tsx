import { useEffect, useState, type FormEvent, type ComponentType } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Check, Menu, X, Plus, Mail, Loader2, Search,
  ShieldCheck, FileText, Filter, Target, Layers, Lock, SlidersHorizontal, Rocket,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { SEO } from '@/app/components/SEO'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'
import { MarketingFooter } from './sections/MarketingFooter'

const EASE = [0.22, 1, 0.36, 1] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ── UTM + role passthrough → signup ──────────────────────────── */
function useSignupUrl() {
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams()
  params.set('role', 'investor')
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

function Nav({ signupUrl }: { signupUrl: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-10">
        <Link to="/" aria-label="FounderCentral home" className="flex items-center">
          <FounderCentralLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-[14px] font-semibold transition-colors hover:[color:var(--blue-h)]" style={{ color: 'var(--muted)' }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/auth/login" className="text-[14px] font-semibold transition-colors hover:[color:var(--blue-h)]" style={{ color: 'var(--ink)' }}>
            Sign in
          </Link>
          <Link to={signupUrl} className="btn-primary" style={{ height: 44, padding: '0 20px', fontSize: '14px', borderRadius: 10 }}>
            Apply as an investor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setOpen(o => !o)} style={{ color: 'var(--ink)' }}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t lg:hidden" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div className="flex flex-col gap-1 px-5 py-3">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
                {l.label}
              </a>
            ))}
            <Link to={signupUrl} className="btn-primary mt-2 justify-center" style={{ height: 48, fontSize: '15px', borderRadius: 10 }}>
              Apply as an investor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/* ── Deal-flow window (serious, pre-qualified founders arriving) ─ */
const DEAL_FLOW = [
  { name: 'Northwind Robotics', initials: 'NR', tag: 'Seed · Deep tech · $1.2M', fit: 96 },
  { name: 'Ledgerline', initials: 'LL', tag: 'Pre-seed · Fintech · $500K', fit: 93 },
  { name: 'Cropwise', initials: 'CW', tag: 'Seed · Agritech · $800K', fit: 90 },
]

function FitRing({ fit, reducedMotion }: { fit: number; reducedMotion: boolean }) {
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="2.5" />
        <motion.circle
          cx="18" cy="18" r="15.5" fill="none" stroke="var(--blue-h)" strokeWidth="2.5" strokeLinecap="round"
          pathLength={100} strokeDasharray="100"
          initial={reducedMotion ? false : { strokeDashoffset: 100 }}
          whileInView={{ strokeDashoffset: 100 - fit }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
          style={reducedMotion ? { strokeDashoffset: 100 - fit } : undefined}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10.5px] font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{fit}%</span>
    </div>
  )
}

const STEP_LABELS = ['Set your thesis', 'Match on fit', 'Your deal flow', 'Review the one-pager', 'Request an intro']
const THESIS_CHIPS = ['Seed', 'Deep tech', '$0.5M–$2M', 'India']
const ONE_PAGER: [string, string][] = [
  ['Stage', 'Seed'],
  ['Sector', 'Deep tech · Robotics'],
  ['Raising', '$1.2M'],
  ['Traction', '3 paid pilots'],
  ['Team', 'ex-Boston Dynamics'],
]

function DealStep({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const fade = { initial: reducedMotion ? false : { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: EASE } }

  // 0 — set thesis
  if (step === 0) {
    return (
      <motion.div className="flex flex-col gap-4" {...fade}>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>Your thesis</div>
        <div className="flex flex-wrap gap-2">
          {THESIS_CHIPS.map((c, idx) => (
            <motion.span
              key={c}
              className="rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)', border: '1px solid var(--blue-border)' }}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: reducedMotion ? 0 : 0.2 + idx * 0.2, type: 'spring', stiffness: 320, damping: 22 }}
            >
              {c}
            </motion.span>
          ))}
        </div>
        <motion.div className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--pos)' }} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Thesis saved
        </motion.div>
      </motion.div>
    )
  }

  // 1 — matching
  if (step === 1) {
    return (
      <motion.div className="flex flex-col items-center justify-center gap-4 py-5" {...fade}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--blue-h)' }} />
        <div className="text-[14.5px] font-semibold" style={{ color: 'var(--ink)' }}>Scanning founders…</div>
        <div className="h-1.5 w-full max-w-[230px] overflow-hidden rounded-full" style={{ background: 'var(--blue-bg)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} initial={reducedMotion ? { width: '100%' } : { width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.6, ease: EASE }} />
        </div>
        <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>Ranking on stage, sector and cheque size</div>
      </motion.div>
    )
  }

  // 2 — deal flow
  if (step === 2) {
    return (
      <motion.div className="flex flex-col" {...fade}>
        {DEAL_FLOW.map((d, i) => (
          <motion.div
            key={d.name}
            className="flex items-center gap-4 border-b py-3.5 last:border-b-0"
            style={{ borderColor: 'var(--line)' }}
            initial={reducedMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.15 + i * 0.18, duration: 0.45, ease: EASE }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>{d.initials}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>{d.name}</div>
              <div className="truncate text-[12.5px]" style={{ color: 'var(--muted-2)' }}>{d.tag}</div>
            </div>
            <FitRing fit={d.fit} reducedMotion={reducedMotion} />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  // 3 — review one-pager
  if (step === 3) {
    return (
      <motion.div {...fade}>
        <div className="mb-3 flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>NR</span>
          <div>
            <div className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>Northwind Robotics</div>
            <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>Structured one-pager</div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {ONE_PAGER.map(([k, v], idx) => (
            <motion.div key={k} className="flex items-center justify-between" initial={reducedMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reducedMotion ? 0 : 0.12 + idx * 0.12 }}>
              <span className="text-[13px]" style={{ color: 'var(--muted-2)' }}>{k}</span>
              <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{v}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  // 4 — request an intro
  return (
    <motion.div className="flex flex-col gap-3" {...fade}>
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--blue-border)' }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>NR</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold" style={{ color: 'var(--ink)' }}>Northwind Robotics</div>
          <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>Seed · Deep tech · 96% fit</div>
        </div>
      </div>
      <motion.div
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-bold text-white"
        style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 28px -10px rgba(37,99,235,0.5)' }}
        animate={reducedMotion ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Mail className="h-4 w-4" /> Request introduction
      </motion.div>
      <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: 'var(--pos)' }}>
        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Both sides opt in. The reply lands in your inbox.
      </div>
    </motion.div>
  )
}

function DealFlow() {
  const reducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reducedMotion) { setStep(2); return }
    const t = setInterval(() => setStep(s => (s + 1) % 5), 3200)
    return () => clearInterval(t)
  }, [reducedMotion])

  return (
    <motion.div
      className="overflow-hidden rounded-[20px]"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 50px 90px -40px rgba(13,27,42,0.42), 0 8px 24px -14px rgba(13,27,42,0.14)' }}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* premium top accent */}
      <div aria-hidden className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #60A5FA)' }} />

      {/* header */}
      <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-5">
        <div>
          <div className="text-[15px] font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ink)' }}>Deal flow</div>
          <div className="mt-0.5 text-[12.5px]" style={{ color: 'var(--blue-h)' }}>
            <span style={{ color: 'var(--muted-2)' }}>{step + 1}/5 · </span>{STEP_LABELS[step]}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--pos)' }} /> Live
        </span>
      </div>

      {/* progress rail */}
      <div className="flex items-center gap-1.5 px-6 pb-4">
        {STEP_LABELS.map((_, i) => (
          <span key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i <= step ? 'var(--blue-h)' : 'var(--line)' }} />
        ))}
      </div>

      {/* step content */}
      <div className="flex min-h-[228px] flex-col justify-center border-t px-6 py-5" style={{ borderColor: 'var(--line)' }}>
        <AnimatePresence mode="wait">
          <DealStep key={step} step={step} reducedMotion={!!reducedMotion} />
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
          <motion.p variants={item} className="mb-5 text-[12.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--blue-h)' }}>
            For investors
          </motion.p>
          <motion.h1
            variants={item}
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--ink)' }}
          >
            High-signal deal flow, on your thesis.
          </motion.h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Set your thesis once. FounderCentral surfaces pre-qualified founders that match your stage,
            sector, cheque size and geography, each in the same clean one-page format. No cold inbox, no noise.
          </motion.p>

          {/* differentiator bullets */}
          <motion.ul variants={item} className="mt-7 flex flex-col gap-3">
            {[
              'One thesis, or many. Your call.',
              'Both sides opt in to every introduction.',
              'Founders never pay, so the pipeline stays full.',
            ].map(b => (
              <li key={b} className="group flex items-start gap-3 text-[15.5px]" style={{ color: 'var(--ink-2)' }}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={signupUrl} className="btn-primary w-full sm:w-auto" style={{ height: 54, padding: '0 28px', fontSize: '1rem', borderRadius: 11 }}>
              Get free access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="btn-outline" style={{ height: 54, padding: '0 24px', fontSize: '0.9375rem', borderRadius: 11 }}>
              See how it works
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-8 border-t pt-6" style={{ borderColor: 'var(--line)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--muted-2)' }}>Built for</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] font-semibold" style={{ color: 'var(--ink-2)' }}>
              <span>VCs</span>
              <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
              <span>Angels</span>
              <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
              <span>Family offices</span>
              <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
              <span>Syndicates</span>
            </div>
          </motion.div>
        </motion.div>

        <DealFlow />
      </div>
    </section>
  )
}

/* ── Value props ───────────────────────────────────────────────── */
type Value = { icon: ComponentType<{ className?: string }>; title: string; body: string }
const VALUES: Value[] = [
  { icon: ShieldCheck, title: 'Pre-qualified founders', body: 'Vetted upstream. You skip the “is this even a real company?” triage entirely.' },
  { icon: FileText, title: 'Structured one-pagers', body: 'Every company in the same clean, comparable format. No 90-slide decks, no Loom links.' },
  { icon: Filter, title: 'Signal, not noise', body: 'Only fit-matched founders reach you. Your inbox stays an inbox, not a graveyard.' },
]
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const cell: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

/* bespoke mini-visuals, one per value */
const SIGNAL_DOTS = Array.from({ length: 21 }, (_, i) => [4, 11, 16].includes(i))

function ValueViz({ i, reducedMotion }: { i: number; reducedMotion: boolean }) {
  const panel = 'relative flex h-[280px] flex-col justify-center overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1.5'
  const panelStyle = { background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 30px 60px -38px rgba(13,27,42,0.3)' } as const

  // 0 — vetting: verified vs filtered
  if (i === 0) {
    const rows = [
      { in: 'AR', name: 'Acme Robotics', ok: true },
      { in: 'BW', name: 'Bytewave', ok: true },
      { in: 'GH', name: 'Ghostco', ok: false },
    ]
    return (
      <div className={panel} style={panelStyle}>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>Upstream vetting</div>
        <div className="flex flex-col gap-2.5">
          {rows.map((r, idx) => (
            <motion.div
              key={r.name}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--bg)', border: '1px solid var(--line)', opacity: r.ok ? 1 : 0.5 }}
              initial={reducedMotion ? false : { opacity: 0, x: 16 }}
              whileInView={{ opacity: r.ok ? 1 : 0.5, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reducedMotion ? 0 : 0.15 + idx * 0.12 }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: r.ok ? 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' : 'var(--muted-2)' }}>{r.in}</span>
              <span className="flex-1 text-[13.5px] font-bold" style={{ color: 'var(--ink)', textDecoration: r.ok ? 'none' : 'line-through' }}>{r.name}</span>
              {r.ok ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}><Check className="h-3 w-3" strokeWidth={3} /> Verified</span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}>Filtered out</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // 1 — structured one-pager
  if (i === 1) {
    const fields: [string, string][] = [['Stage', 'Pre-seed'], ['Sector', 'Fintech'], ['Raising', '$500K'], ['Traction', '1,200 users']]
    return (
      <div className={panel} style={panelStyle}>
        <div className="mb-3 flex items-center gap-3 border-b pb-3" style={{ borderColor: 'var(--line)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>LL</span>
          <div>
            <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink)' }}>Ledgerline</div>
            <div className="text-[11.5px]" style={{ color: 'var(--muted-2)' }}>Structured one-pager</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {fields.map(([k, v], idx) => (
            <motion.div key={k} initial={reducedMotion ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reducedMotion ? 0 : 0.12 + idx * 0.1 }}>
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-2)' }}>{k}</div>
              <div className="mt-0.5 text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{v}</div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // 2 — noise vs signal
  return (
    <div className={panel} style={panelStyle}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>Everything else</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--blue-h)' }}>What reaches you</span>
      </div>
      <div className="grid grid-cols-7 gap-2.5">
        {SIGNAL_DOTS.map((bright, idx) => (
          <motion.span
            key={idx}
            className="aspect-square rounded-full"
            style={{ background: bright ? 'var(--blue-h)' : 'var(--surface-3)', boxShadow: bright ? '0 0 0 3px var(--blue-bg)' : 'none' }}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: bright ? 1 : 0.7, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: reducedMotion ? 0 : (idx % 7) * 0.03 + Math.floor(idx / 7) * 0.05 }}
          />
        ))}
      </div>
      <div className="mt-4 text-[12px]" style={{ color: 'var(--muted-2)' }}>
        Hundreds filtered upstream. Only the fit-matched few land in your inbox.
      </div>
    </div>
  )
}

function ValueProps() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="value" style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="w-full px-6 pb-24 pt-16 sm:px-10 sm:pb-28 sm:pt-20 lg:px-16 lg:pb-32 lg:pt-24">
        {/* heading */}
        <motion.div className="mx-auto max-w-2xl text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>What you get</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Deal flow worth your time.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Three things every investor on FounderCentral can count on, on every match.
          </p>
        </motion.div>

        {/* end-to-end timeline */}
        <div className="relative mt-20 sm:mt-24">
          {/* spine, drawn in (desktop) */}
          <motion.span
            aria-hidden
            className="absolute z-0 hidden h-[2px] lg:block"
            style={{ top: 26, left: '16.66%', right: '16.66%', background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #60A5FA)', opacity: 0.5, transformOrigin: 'left' }}
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1, ease: EASE }}
          />

          <motion.div
            className="grid grid-cols-1 gap-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-3 lg:gap-10"
            variants={list}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
          >
            {VALUES.map((v, i) => (
              <motion.div key={v.title} variants={cell} className="flex flex-col items-center text-center">
                {/* node on the line */}
                <span
                  className="relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full text-[16px] font-bold text-white"
                  style={{ background: 'var(--gradient-primary)', boxShadow: '0 14px 30px -12px rgba(37,99,235,0.5), 0 0 0 7px var(--surface-2)' }}
                >
                  {i + 1}
                </span>

                {/* visual */}
                <div className="mt-8 w-full max-w-sm"><ValueViz i={i} reducedMotion={!!reducedMotion} /></div>

                {/* text */}
                <h3 className="mt-10 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 2vw, 1.55rem)', lineHeight: 1.15, letterSpacing: '-0.018em', color: 'var(--ink)' }}>{v.title}</h3>
                <p className="mx-auto mt-2.5 max-w-xs text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{v.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── How it works (investor flow) ──────────────────────────────── */
type Step = { icon: ComponentType<{ className?: string }>; title: string; body: string }
const STEPS: Step[] = [
  { icon: SlidersHorizontal, title: 'Publish your thesis', body: 'Stage, sector, cheque size and geography. Set as many theses as you run.' },
  { icon: Target, title: 'Get matched founders', body: 'Ranked by fit against your thesis, with the reasons shown. No black box.' },
  { icon: Layers, title: 'Review one-pagers', body: 'Compare companies like for like, in the same structured format, in seconds.' },
  { icon: Mail, title: 'Request or accept intros', body: 'Both sides opt in. The conversation moves straight to your inbox.' },
]

function HowItWorks() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="how-it-works" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:py-24">
        {/* sticky heading */}
        <motion.div className="lg:sticky lg:top-28 lg:self-start" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>How it works</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Four steps from thesis to term sheet.
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            From your thesis to a warm reply, the whole path is four steps. You stay in control at each one.
          </p>
        </motion.div>

        {/* numbered process list */}
        <motion.div className="border-t" style={{ borderColor: 'var(--line)' }} variants={list} initial={reducedMotion ? false : 'hidden'} whileInView={reducedMotion ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.title} variants={cell} whileHover={reducedMotion ? undefined : { x: 6 }} transition={{ type: 'spring', stiffness: 300, damping: 26 }} className="group grid grid-cols-[auto_1fr] gap-5 border-b py-7" style={{ borderColor: 'var(--line)' }}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-bold tabular-nums transition-colors duration-300" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)', border: '1px solid var(--blue-border)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
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

/* ── Trust / credibility ───────────────────────────────────────── */
const TRUST: Value[] = [
  { icon: ShieldCheck, title: 'Verified, both sides', body: 'Founders are reviewed and kept current. You stay in control of what you share and see.' },
  { icon: Lock, title: 'Private by default', body: 'Encrypted in transit and at rest. Nothing moves between parties without consent.' },
  { icon: SlidersHorizontal, title: 'On your terms', body: 'Run multiple theses, pause anytime, decline freely. No obligation, no noise.' },
]

function Trust() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="mx-auto max-w-2xl text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>Built for trust</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Serious infrastructure for serious capital.
          </h2>
        </motion.div>
        {/* verification seals on a secure chain */}
        <div className="relative mt-16 sm:mt-20">
          {/* dotted secure line connecting the seals */}
          <motion.span
            aria-hidden
            className="absolute top-[44px] hidden border-t-2 border-dashed lg:block"
            style={{ left: '16.66%', right: '16.66%', borderColor: 'var(--blue-border)', transformOrigin: 'left' }}
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: EASE }}
          />

          <motion.div className="grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3" variants={list} initial={reducedMotion ? false : 'hidden'} whileInView={reducedMotion ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
            {TRUST.map(t => {
              const Icon = t.icon
              return (
                <motion.div key={t.title} variants={cell} className="group flex flex-col items-center text-center">
                  {/* seal */}
                  <span
                    className="relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ background: 'var(--surface)', border: '2px solid var(--blue-l)', color: 'var(--blue-h)', boxShadow: '0 0 0 6px var(--surface-2), 0 16px 34px -12px rgba(37,99,235,0.32)' }}
                  >
                    <span aria-hidden className="absolute inset-[6px] rounded-full" style={{ border: '1px dashed var(--blue-border)' }} />
                    <Icon className="h-8 w-8" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: 'var(--pos)', boxShadow: '0 0 0 3px var(--surface-2)' }}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  </span>

                  <h3 className="mt-7 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 1.9vw, 1.45rem)', letterSpacing: '-0.018em', color: 'var(--ink)' }}>{t.title}</h3>
                  <p className="mx-auto mt-2.5 max-w-xs text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{t.body}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── Lead capture (request access) ─────────────────────────────── */
function LeadForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'done') return
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) { toast.error('Enter a valid email address.'); return }
    setStatus('submitting')
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed, name: null, status: 'active', source: 'investor_landing' })
    if (error && error.code !== '23505') { setStatus('idle'); toast.error('Could not save. Please try again.'); return }
    setStatus('done')
    setEmail('')
  }

  if (status === 'done') {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: '1px solid var(--success-border)' }}>
        <Check className="h-4 w-4" strokeWidth={3} /> Request received. We’ll be in touch.
      </div>
    )
  }
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
      <input
        type="email" inputMode="email" autoComplete="email" required
        placeholder="you@fund.com" value={email} onChange={e => setEmail(e.target.value)} disabled={status === 'submitting'}
        className="text-sm"
        style={{ flex: 1, height: 50, minWidth: 0, padding: '0 16px', borderRadius: 11, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', outline: 'none' }}
      />
      <button type="submit" disabled={status === 'submitting'} className="btn-primary" style={{ height: 50, padding: '0 22px', fontSize: '0.9375rem', borderRadius: 11 }}>
        {status === 'submitting' ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending</>) : (<>Request access</>)}
      </button>
    </form>
  )
}

const ACCESS_STEPS = [
  { t: 'Share your work email', s: 'Takes a few seconds, no forms to fill.' },
  { t: 'We confirm your thesis fits', s: 'A quick review by our team.' },
  { t: 'Access + a short walkthrough', s: 'We get you set up properly.' },
]

function LeadCapture() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div
          className="relative overflow-hidden rounded-3xl"
          style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 44px 90px -48px rgba(13,27,42,0.5)' }}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <RisingParticles />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr]">
            {/* left: copy + form */}
            <div className="p-8 sm:p-12">
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#93C5FD' }}>Not ready to apply?</p>
              <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)', lineHeight: 1.1, letterSpacing: '-0.026em', color: '#fff' }}>
                Request access to the platform.
              </h2>
              <p className="mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.74)' }}>
                Leave your work email and we’ll reach out with access and a short walkthrough.
              </p>
              <div className="mt-7"><LeadForm /></div>
              <p className="mt-3.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>No spam. No obligation. Founders are always free.</p>
            </div>

            {/* right: what happens next */}
            <div className="relative overflow-hidden p-8 sm:p-12 lg:border-l" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="relative text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#93C5FD' }}>What happens next</p>
              <div className="relative mt-6 flex flex-col gap-5">
                {ACCESS_STEPS.map((st, i) => (
                  <div key={st.t} className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 18px -8px rgba(0,0,0,0.4)' }}>{i + 1}</span>
                    <div>
                      <div className="text-[15px] font-bold" style={{ color: '#fff' }}>{st.t}</div>
                      <div className="mt-0.5 text-[13.5px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{st.s}</div>
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
  { q: 'How are founders vetted?', a: 'Profiles are reviewed and kept current by our team. Nothing reaches your matches until it has been checked, and anything that looks off is pulled fast.' },
  { q: 'What does it cost?', a: 'Investor pricing is shared during onboarding once your thesis is set up. Founders are always free.' },
  { q: 'How do introductions work?', a: 'You request or accept an introduction, both sides opt in, and you each receive the other’s email. The platform then steps out of the way.' },
  { q: 'Can I run more than one thesis?', a: 'Yes. Run as many theses as you invest across. Each surfaces its own ranked, fit-matched deal flow.' },
  { q: 'How is my activity kept private?', a: 'Encrypted in transit and at rest. Founders see only what you choose to share, and nothing moves without your consent.' },
]

function FAQ() {
  const reducedMotion = useReducedMotion()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div className="text-center" initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>Investor questions</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Answered plainly.
          </h2>
        </motion.div>
        <div className="mt-12 border-t" style={{ borderColor: 'var(--line)' }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="group flex w-full items-center gap-4 py-6 text-left">
                  <span className="flex-1 font-bold transition-colors duration-200 group-hover:[color:var(--blue-h)]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)', letterSpacing: '-0.015em', color: isOpen ? 'var(--blue-h)' : 'var(--ink)' }}>
                    {f.q}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300" style={{ background: isOpen ? 'var(--gradient-primary)' : 'var(--surface)', color: isOpen ? '#fff' : 'var(--muted-2)', border: isOpen ? 'none' : '1px solid var(--line)', transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)' }}>
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-6 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{f.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Closer (dark, navy, serious) ──────────────────────────────── */
function Closer({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative overflow-hidden">
      <div className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <RisingParticles />
          <AscendingRocket left="84%" delay={1.2} dur={8} size={26} />
          <div className="relative mx-auto max-w-2xl">
            <motion.h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em', color: '#fff' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, ease: EASE }}>
              Put your thesis to work.
            </motion.h2>
            <motion.p className="mx-auto mt-5 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.78)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }}>
              Apply once, set your thesis, and start reviewing pre-qualified founders that fit. It takes a few minutes.
            </motion.p>
            <motion.div className="mt-9" initial={reducedMotion ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: 0.14, ease: EASE }}>
              <Link to={signupUrl} className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-9 text-base font-bold" style={{ background: '#fff', color: '#0D1B2A', boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)' }}>
                Apply as an investor
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Hook strip (value reinforcement) ──────────────────────────── */
const HOOKS = ['Pre-qualified, verified founders', 'One structured format, every deal', 'Ranked to your thesis', 'You control what reaches you']

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
      {/* edge fades */}
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
  { q: 'I already get plenty of deal flow.', a: 'Volume isn’t the constraint, fit is. We rank to your thesis so your time goes only to companies that match.' },
  { q: 'Another platform to keep up with?', a: 'No new habit required. Matches come to you in one format. Review when you want, ignore when you don’t.' },
  { q: 'Is the quality actually there?', a: 'Founders are vetted upstream and presented in a comparable one-pager, with the reasons for each match shown.' },
  { q: 'I don’t have time to set this up.', a: 'Setup takes minutes. After that it runs in the background and only surfaces fit-matched companies.' },
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
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            You might be thinking&hellip;
          </h2>
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

/* ── Sticky apply bar (CRO) ────────────────────────────────────── */
function StickyApply({ signupUrl }: { signupUrl: string }) {
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
        <motion.div
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
          initial={reducedMotion ? false : { y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? undefined : { y: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="flex items-center gap-3 rounded-full py-2.5 pl-5 pr-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--blue-border)', boxShadow: '0 20px 50px -16px rgba(37,99,235,0.4)' }}>
            <span className="hidden text-[14px] font-semibold sm:inline" style={{ color: 'var(--ink)' }}>Deal flow on your thesis, a few minutes away.</span>
            <span className="text-[14px] font-semibold sm:hidden" style={{ color: 'var(--ink)' }}>See your deal flow.</span>
            <Link to={signupUrl} className="btn-primary shrink-0" style={{ height: 40, padding: '0 16px', fontSize: '13.5px', borderRadius: 999 }}>
              Apply as an investor
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button type="button" aria-label="Dismiss" onClick={() => setDismissed(true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:[background:var(--surface-2)]" style={{ color: 'var(--muted-2)' }}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Claim your profile (CRO: already-in-directory path) ───────── */
function ClaimProfile({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  const navigate = useNavigate()
  const [firm, setFirm] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = firm.trim()
    navigate(q ? `${signupUrl}&firm=${encodeURIComponent(q)}` : signupUrl)
  }

  return (
    <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        {/* left: copy + search */}
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.55, ease: EASE }}>
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue-h)' }}>Already in the ecosystem?</p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 2.9rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Find and claim your profile.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            We aggregate public ecosystem data, so your firm may already be in our directory. Search,
            confirm it’s you, and take control of your profile in minutes.
          </p>
          <form onSubmit={onSubmit} className="mt-7 flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={firm}
              onChange={e => setFirm(e.target.value)}
              placeholder="Your firm or fund name"
              className="text-sm"
              style={{ flex: 1, height: 50, minWidth: 0, padding: '0 16px', borderRadius: 11, background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none' }}
            />
            <button type="submit" className="btn-primary" style={{ height: 50, padding: '0 22px', fontSize: '0.9375rem', borderRadius: 11 }}>
              <Search className="h-4 w-4" /> Search the directory
            </button>
          </form>
          <p className="mt-3.5 text-[13px]" style={{ color: 'var(--muted-2)' }}>Verifying takes a couple of minutes. You decide what stays public.</p>
        </motion.div>

        {/* right: illustrative match card */}
        <motion.div
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 44px 90px -48px rgba(13,27,42,0.34)' }}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        >
          <div aria-hidden className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #1E3A8A, #2563EB, #60A5FA)' }} />
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>Directory match</span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)' }}>Unclaimed</span>
            </div>

            <div className="flex items-center gap-3.5 rounded-xl px-3.5 py-3" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>LV</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14.5px] font-bold" style={{ color: 'var(--ink)' }}>Lighthouse Ventures</div>
                <div className="truncate text-[12.5px]" style={{ color: 'var(--muted-2)' }}>Aggregated from public sources</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {['VC', 'Seed – Series A', 'Deep tech', 'India'].map(c => (
                <span key={c} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}>{c}</span>
              ))}
            </div>

            <Link to={signupUrl} className="btn-primary mt-5 w-full justify-center" style={{ height: 46, fontSize: '14px', borderRadius: 11 }}>
              <ShieldCheck className="h-4 w-4" /> This is us. Claim it.
            </Link>
            <Link to={signupUrl} className="mt-3 block text-center text-[13px] font-semibold" style={{ color: 'var(--muted-2)' }}>
              Not your firm? Start fresh instead
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── THESIS mnemonic (memorable recap) ─────────────────────────── */
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

const THESIS = [
  { l: 'T', word: 'Thesis', line: 'Set it once: stage, sector, cheque, geography.' },
  { l: 'H', word: 'High-signal', line: 'Only fit-matched founders reach you.' },
  { l: 'E', word: 'Every one vetted', line: 'Pre-qualified upstream, no triage.' },
  { l: 'S', word: 'Structured', line: 'One clean one-pager per company.' },
  { l: 'I', word: 'Intros', line: 'Both sides opt in, straight to email.' },
  { l: 'S', word: 'Saves time', line: 'It runs quietly in the background.' },
]

function ThesisMnemonic() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || reducedMotion) return
    const id = setInterval(() => setActive((a) => (a + 1) % THESIS.length), 2800)
    return () => clearInterval(id)
  }, [paused, reducedMotion])

  const cur = THESIS[active]
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
            One word runs your deal flow.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Hover a letter, or watch it spell itself out.
          </p>
        </motion.div>

        {/* giant interactive wordmark — spotlight sweeps across THESIS */}
        <div
          className="mx-auto mt-12 flex max-w-4xl flex-nowrap items-end justify-center gap-[0.04em] sm:mt-14"
          onMouseLeave={() => setPaused(false)}
        >
          {THESIS.map((t, i) => {
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
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.6rem, 13vw, 8.5rem)', fontWeight: 800, letterSpacing: '-0.05em', padding: 0 }}
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
                    layoutId="thesis-spot"
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
          {THESIS.map((_, i) => (
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
export function ForInvestorsPage() {
  const signupUrl = useSignupUrl()
  return (
    <div className="marketing-page" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <SEO
        title="FounderCentral for Investors: high-signal, pre-qualified deal flow on your thesis"
        bareTitle
        description="Set your thesis once and review pre-qualified founders matched to your stage, sector, cheque size and geography, each in a structured one-page format. No cold inbox, no noise."
        path="/for-investors"
      />
      <Nav signupUrl={signupUrl} />
      <main>
        <Hero signupUrl={signupUrl} />
        <HookStrip />
        <ValueProps />
        <HowItWorks />
        <ThesisMnemonic />
        <ClaimProfile signupUrl={signupUrl} />
        <Trust />
        <Objections />
        <LeadCapture />
        <FAQ />
        <Closer signupUrl={signupUrl} />
      </main>
      <MarketingFooter />
      <StickyApply signupUrl={signupUrl} />
    </div>
  )
}
