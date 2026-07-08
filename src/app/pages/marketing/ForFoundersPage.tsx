import { useEffect, useState, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Check, Menu, X, Sparkles, Zap, Plus, Mail, Loader2, CheckCircle2,
  Target, ShieldCheck, Handshake, Landmark, TrendingUp, CalendarDays, Users2, Bot,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { SEO } from '@/app/components/SEO'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'
import { MarketingFooter } from './sections/MarketingFooter'
import { HowItWorks } from './sections/HowItWorks'

const EASE = [0.22, 1, 0.36, 1] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ── UTM + role passthrough → signup ──────────────────────────── */
function useSignupUrl() {
  const [searchParams] = useSearchParams()
  const params = new URLSearchParams()
  params.set('role', 'founder')
  ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
    const v = searchParams.get(k)
    if (v) params.set(k, v)
  })
  return `/auth/signup?${params.toString()}`
}

/* ── Minimal campaign nav (few escape routes = better conversion) ─ */
const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'What you get', href: '#features' },
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
        background: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
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
            <a key={l.href} href={l.href} className="text-[14px] font-semibold transition-colors hover:[color:var(--blue)]" style={{ color: 'var(--muted)' }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/auth/login" className="text-[14px] font-semibold transition-colors hover:[color:var(--blue)]" style={{ color: 'var(--ink)' }}>
            Sign in
          </Link>
          <Link to={signupUrl} className="btn-primary" style={{ height: 44, padding: '0 20px', fontSize: '14px', borderRadius: 11 }}>
            Get started free
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
            <Link to={signupUrl} className="btn-primary mt-2 justify-center" style={{ height: 48, fontSize: '15px', borderRadius: 11 }}>
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/* ── Hero ──────────────────────────────────────────────────────── */
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }
const item: Variants = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }

// Slot-machine rotating phrase (same idiom as the main landing hero)
const INTROS = ['warm intros', 'real intros', 'curated intros', 'instant intros']

function RotatingIntro({ reducedMotion }: { reducedMotion: boolean }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reducedMotion) return
    const t = setInterval(() => setI(p => (p + 1) % INTROS.length), 2600)
    return () => clearInterval(t)
  }, [reducedMotion])

  return (
    <motion.span
      layout={!reducedMotion}
      transition={{ layout: { duration: 0.45, ease: EASE } }}
      className="relative inline-block overflow-hidden align-bottom"
      style={{ paddingBottom: '0.1em' }}
    >
      {/* sizer matches the CURRENT word so the slot hugs it (no dead space) */}
      <span className="invisible whitespace-nowrap" aria-hidden>{INTROS[i]}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={INTROS[i]}
          className="absolute inset-0 flex items-start justify-center whitespace-nowrap"
          style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          initial={reducedMotion ? false : { y: '110%' }}
          animate={{ y: '0%' }}
          exit={reducedMotion ? undefined : { y: '-110%' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {INTROS[i]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

type HeroChipData = { side: 'l' | 'r'; top: string; x: string; rot: number; title: string; sub?: string; tone: 'pain' | 'win' }
const HERO_CHIPS: HeroChipData[] = [
  { side: 'l', top: '8%', x: '3%', rot: -5, title: '“Quick chat about your round?”', sub: 'Seen · 12 days ago · no reply', tone: 'pain' },
  { side: 'l', top: '30%', x: '5%', rot: 3, title: 'Warm intro accepted', tone: 'win' },
  { side: 'l', top: '53%', x: '2.5%', rot: -3, title: '“Let’s circle back in Q3”', sub: 'Narrator: they did not', tone: 'pain' },
  { side: 'l', top: '76%', x: '4.5%', rot: 4, title: 'Matched to your stage', tone: 'win' },
  { side: 'r', top: '10%', x: '3%', rot: 5, title: 'Reply in 2 days. Wild.', tone: 'win' },
  { side: 'r', top: '32%', x: '4.5%', rot: -4, title: '“Sounds interesting, keep me posted!”', sub: 'Translation: a polite no', tone: 'pain' },
  { side: 'r', top: '55%', x: '2.5%', rot: 3, title: 'Coffee booked → term sheet?', tone: 'win' },
  { side: 'r', top: '78%', x: '4%', rot: -3, title: 'Cold email #47', sub: 'Delivered. Devastatingly ignored.', tone: 'pain' },
]

// chip that parallaxes toward (wins) or away from (pains) the cursor
function HeroChip({ c, i, mx, my, reducedMotion }: { c: HeroChipData; i: number; mx: MotionValue<number>; my: MotionValue<number>; reducedMotion: boolean }) {
  const isWin = c.tone === 'win'
  const factor = (isWin ? 1 : -1) * (16 + (i % 3) * 8)
  const x = useTransform(mx, v => v * factor)
  const y = useTransform(my, v => v * factor)
  return (
    <motion.div
      aria-hidden
      className="absolute hidden rounded-2xl px-4 py-3 xl:block"
      style={{
        ...(c.side === 'l' ? { left: c.x } : { right: c.x }),
        top: c.top,
        width: 190,
        rotate: c.rot,
        x: reducedMotion ? 0 : x,
        y: reducedMotion ? 0 : y,
        background: 'var(--surface)',
        border: isWin ? '1px solid var(--blue-border)' : '1px solid var(--line)',
        boxShadow: isWin ? '0 22px 50px -28px rgba(96,165,250,0.3)' : '0 22px 50px -28px rgba(15,23,42,0.25)',
      }}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5 + i * 0.1, ease: EASE }}
      whileHover={reducedMotion ? undefined : { scale: 1.06 }}
    >
      {isWin ? (
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          <span className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>{c.title}</span>
        </div>
      ) : (
        <>
          <div className="text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--muted)' }}>{c.title}</div>
          {c.sub && <div className="mt-1.5 text-[11px]" style={{ color: 'var(--muted-2)' }}>{c.sub}</div>}
        </>
      )}
    </motion.div>
  )
}

function Hero({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const onMove = (e: ReactMouseEvent<HTMLElement>) => {
    if (reducedMotion) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1)
    my.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <section className="relative overflow-hidden" onMouseMove={onMove}>
      {/* backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="cc-pattern-dots absolute inset-0 opacity-[0.35]" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(1100px 520px at 50% -10%, rgba(96,165,250,0.1) 0%, transparent 60%)' }} />
        <div className="absolute" style={{ top: '14%', left: '-6%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.12), transparent 65%)', filter: 'blur(28px)' }} />
        <div className="absolute" style={{ top: '20%', right: '-6%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147,197,253,0.12), transparent 65%)', filter: 'blur(28px)' }} />
      </div>

      {/* cursor-reactive proof chips (wide screens) */}
      {HERO_CHIPS.map((c, i) => (
        <HeroChip key={i} c={c} i={i} mx={mx} my={my} reducedMotion={!!reducedMotion} />
      ))}

      <motion.div
        className="relative mx-auto max-w-3xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pb-20 sm:pt-24"
        variants={container}
        initial={reducedMotion ? false : 'hidden'}
        animate={reducedMotion ? false : 'show'}
      >
        <motion.p variants={item} className="text-[12.5px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--blue)' }}>
          For founders raising in India
        </motion.p>

        <motion.h1
          variants={item}
          className="mx-auto mt-6 max-w-3xl font-bold"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.4rem, 5.6vw, 4.25rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--ink)' }}
        >
          Get{' '}
          <RotatingIntro reducedMotion={!!reducedMotion} />{' '}
          to investors who actually fund your stage.
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl"
          style={{ fontSize: 'clamp(1.0625rem, 1.6vw, 1.25rem)', lineHeight: 1.6, color: 'var(--muted)' }}
        >
          Set up your one-pager once. FounderCentral matches you to the right investors and opens the
          door with a curated intro. No cold emails, no spray-and-pray.
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={signupUrl} className="btn-primary w-full sm:w-auto" style={{ height: 54, padding: '0 28px', fontSize: '1rem', borderRadius: 12 }}>
            Start free in 2 minutes
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how-it-works" className="btn-outline w-full sm:w-auto" style={{ height: 54, padding: '0 24px', fontSize: '0.9375rem', borderRadius: 12 }}>
            See how it works
          </a>
        </motion.div>

        <motion.div variants={item} className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13.5px]" style={{ color: 'var(--muted-2)' }}>
          <span>Free for founders</span>
          <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
          <span>No credit card</span>
          <span aria-hidden style={{ color: 'var(--faint)' }}>·</span>
          <span>~8 minutes to set up</span>
        </motion.div>

        {/* risk-reversal hook */}
        <motion.p variants={item} className="mt-3 text-[13px] italic" style={{ color: 'var(--muted-2)' }}>
          Genuinely free for founders. No catch, no card, no countdown timer.
        </motion.p>
      </motion.div>
    </section>
  )
}

/* ── Hook strip: quirky CRO value hooks ────────────────────────── */
const HOOKS = [
  'Free forever (yes, actually free)',
  'Warm intros, not cold spam',
  'Real investors, not a dead database',
  '8 minutes. One coffee. Done.',
]

function HookStrip() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <motion.div
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-5 sm:px-10"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {HOOKS.map(h => (
          <span key={h} className="group inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
            <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" style={{ color: 'var(--blue)' }} />
            {h}
          </span>
        ))}
      </motion.div>
    </section>
  )
}

/* ── Playful animated product simulation (6 steps, looping) ────── */
const DEMO_MATCHES = [
  { name: 'Lighthouse Ventures', initials: 'LV', fit: 94, tag: 'Seed · SaaS' },
  { name: 'Banyan Capital', initials: 'BC', fit: 91, tag: 'Pre-seed · India' },
  { name: 'Northstar Angels', initials: 'NS', fit: 88, tag: 'Angel · Fintech' },
]
const STEP_LABELS = ['Build your one-pager', 'Find your fit', 'Ranked by fit', 'Request a warm intro', 'They said yes', 'Straight to your inbox']

function MatchStep({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const fade = {
    initial: reducedMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: EASE },
  }

  // 0 — one-pager filling in
  if (step === 0) {
    return (
      <motion.div className="flex flex-col gap-2.5" {...fade}>
        {[['Company', 'Acme Labs'], ['Stage', 'Pre-seed'], ['Raising', '$500K']].map(([k, v], idx) => (
          <motion.div
            key={k}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}
            initial={reducedMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.2 + idx * 0.28 }}
          >
            <span className="text-[13px]" style={{ color: 'var(--muted-2)' }}>{k}</span>
            <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>{v}</span>
          </motion.div>
        ))}
        <motion.div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--pos)' }} initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> One-pager saved
        </motion.div>
      </motion.div>
    )
  }

  // 1 — scanning investors
  if (step === 1) {
    return (
      <motion.div className="flex flex-col items-center justify-center gap-4 py-6" {...fade}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--blue)' }} />
        <div className="text-[14.5px] font-semibold" style={{ color: 'var(--ink)' }}>Scanning 2,400 investors…</div>
        <div className="h-1.5 w-full max-w-[230px] overflow-hidden rounded-full" style={{ background: 'var(--blue-bg)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'var(--gradient-primary)' }} initial={reducedMotion ? { width: '100%' } : { width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.6, ease: EASE }} />
        </div>
        <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>Matching on stage, sector, cheque size</div>
      </motion.div>
    )
  }

  // 2 — ranked matches
  if (step === 2) {
    return (
      <motion.div className="flex flex-col gap-2.5" {...fade}>
        {DEMO_MATCHES.map((m, idx) => (
          <motion.div
            key={m.name}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}
            initial={reducedMotion ? false : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.15 + idx * 0.3, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)' }}>{m.initials}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{m.name}</div>
              <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>{m.tag}</div>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold tabular-nums" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)' }}>{m.fit}% fit</span>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  // 3 — request a warm intro
  if (step === 3) {
    return (
      <motion.div className="flex flex-col gap-3" {...fade}>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--blue-border)' }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: 'var(--blue-bg)', color: 'var(--blue-h)' }}>LV</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold" style={{ color: 'var(--ink)' }}>Lighthouse Ventures</div>
            <div className="text-[12px]" style={{ color: 'var(--muted-2)' }}>Seed · SaaS · 94% fit</div>
          </div>
        </div>
        <motion.div
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-bold text-white"
          style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 28px -10px rgba(96,165,250,0.6)' }}
          animate={reducedMotion ? undefined : { scale: [1, 1.04, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Handshake className="h-4 w-4" /> Request warm intro
        </motion.div>
      </motion.div>
    )
  }

  // 4 — accepted (confetti)
  if (step === 4) {
    return (
      <motion.div className="relative flex flex-col items-center justify-center gap-3 py-5" {...fade}>
        {!reducedMotion && <Confetti />}
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-full text-white"
          style={{ background: 'var(--pos)' }}
          initial={reducedMotion ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 15 }}
        >
          <Check className="h-7 w-7" strokeWidth={3} />
        </motion.span>
        <div className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>Intro accepted</div>
        <div className="text-[13px]" style={{ color: 'var(--muted)' }}>Lighthouse Ventures wants to talk.</div>
      </motion.div>
    )
  }

  // 5 — straight to inbox
  return (
    <motion.div className="flex flex-col gap-2.5" {...fade}>
      <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted-2)' }}>Inbox</div>
      <div className="flex items-start gap-3 rounded-xl px-3 py-3" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--blue-bg)' }}>
          <Mail className="h-[18px] w-[18px]" style={{ color: 'var(--blue)' }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[14px] font-bold" style={{ color: 'var(--ink)' }}>Lighthouse Ventures</span>
            <span className="shrink-0 text-[11px]" style={{ color: 'var(--muted-2)' }}>now</span>
          </div>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--muted)' }}>“Loved the deck. Free Tuesday to talk numbers?”</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--pos)' }}>
        <Check className="h-3.5 w-3.5" strokeWidth={3} /> You’re connected. We step out.
      </div>
    </motion.div>
  )
}

function MatchDemo() {
  const reducedMotion = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reducedMotion) { setStep(2); return }
    const t = setInterval(() => setStep(s => (s + 1) % 6), 3800)
    return () => clearInterval(t)
  }, [reducedMotion])

  return (
    <section style={{ background: 'linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        {/* copy */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            See it work
          </p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3.1rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            From one-pager to “let’s talk” in a few taps.
          </h2>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Set your thesis once. We rank the investors who fit, you request the intro, and the warm reply
            lands in your inbox. Watch the whole loop.
          </p>
        </motion.div>

        {/* the window */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24, rotate: -1 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="overflow-hidden rounded-[20px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 40px 80px -32px rgba(15,23,42,0.28)' }}
        >
          {/* window top bar */}
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
            <span className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
            <span className="ml-2 text-[12px] font-semibold" style={{ color: 'var(--muted-2)' }}>FounderCentral</span>
          </div>

          {/* step label + progress */}
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
              <span style={{ color: 'var(--blue)' }}>{step + 1}.</span> {STEP_LABELS[step]}
            </span>
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((_, i) => (
                <span key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === step ? 18 : 6, background: i <= step ? 'var(--blue)' : 'var(--blue-l)', opacity: i <= step ? 1 : 0.4 }} />
              ))}
            </div>
          </div>

          {/* step content (fixed height so it never jumps) */}
          <div className="flex min-h-[210px] flex-col justify-center p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <MatchStep key={step} step={step} reducedMotion={!!reducedMotion} />
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Sticky floating CTA (appears after the hero) ──────────────── */
function StickyCta({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 760)
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
          <div
            className="flex items-center gap-3 rounded-full py-2.5 pl-5 pr-2.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--blue-border)', boxShadow: '0 20px 50px -16px rgba(96,165,250,0.45)' }}
          >
            <Zap className="hidden h-4 w-4 shrink-0 sm:block" style={{ color: 'var(--blue)' }} />
            <span className="hidden text-[14px] font-semibold sm:inline" style={{ color: 'var(--ink)' }}>
              Still here? Your one-pager could’ve been done by now.
            </span>
            <span className="text-[14px] font-semibold sm:hidden" style={{ color: 'var(--ink)' }}>
              Ready when you are.
            </span>
            <Link to={signupUrl} className="btn-primary shrink-0" style={{ height: 40, padding: '0 16px', fontSize: '13.5px', borderRadius: 999 }}>
              Get started free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissed(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:[background:var(--surface-2)]"
              style={{ color: 'var(--muted-2)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Shared stagger variants (pain + objection lists) ──────────── */
const obList: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const obItem: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }

/* ── Founder pain agitation ────────────────────────────────────── */
const PAINS = [
  '47 cold emails. 2 replies. 0 cheques.',
  'No warm network, no rich uncle, no alumni group.',
  'Raising blind, guessing who’s even writing cheques.',
  'Your deck living in 14 browser tabs and a dead Notion page.',
]

function FounderProblem() {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16 lg:py-24">
        {/* heading */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            The founder reality
          </p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.4vw, 3.5rem)', lineHeight: 1.08, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Sound familiar?
          </h2>
          <p className="mt-5 max-w-xs text-[16px] font-semibold" style={{ color: 'var(--blue)' }}>
            None of this has to be your reality. ↓
          </p>
        </motion.div>

        {/* pains */}
        <motion.div
          className="border-t"
          style={{ borderColor: 'var(--line)' }}
          variants={obList}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {PAINS.map(p => (
            <motion.div key={p} variants={obItem} className="flex items-center gap-4 border-b py-5" style={{ borderColor: 'var(--line)' }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--neg-bg)', color: 'var(--neg)' }}>
                <X className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="text-[clamp(1.1rem,1.9vw,1.4rem)] font-semibold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--ink-2)' }}>
                {p}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Before / after comparison ─────────────────────────────────── */
const OLD_WAY = ['Cold emails into the void', 'Spray-and-pray to 4,000 names', 'Dead databases, deader funds', '“Just circling back” for the fifth time', 'No clue who’s actually active']
const NEW_WAY = ['Curated warm intros', 'Ranked by real fit', 'Active cheque-writers only', 'One intro, then straight to email', 'See exactly why each matched']

function BeforeAfter() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            Two ways to raise
          </p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Pick the one that works.
          </h2>
        </motion.div>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-0">
          {/* center VS badge */}
          <span
            className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[12px] font-bold uppercase tracking-wider sm:flex"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted-2)', boxShadow: '0 10px 24px -10px rgba(15,23,42,0.25)' }}
          >
            vs
          </span>

          {/* old way */}
          <motion.div
            className="sm:pr-16"
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <h3 className="text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--muted-2)' }}>The cold-email way</h3>
            <ul className="mt-7 flex flex-col gap-5">
              {OLD_WAY.map(o => (
                <li key={o} className="flex items-center gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}>
                    <X className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-[17px]" style={{ color: 'var(--muted)', textDecoration: 'line-through', textDecorationColor: 'var(--faint)' }}>{o}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* new way */}
          <motion.div
            className="sm:border-l sm:pl-16"
            style={{ borderColor: 'var(--line)' }}
            initial={reducedMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
          >
            <h3 className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--blue)' }}>
              <Sparkles className="h-4 w-4" /> The FounderCentral way
            </h3>
            <ul className="mt-7 flex flex-col gap-5">
              {NEW_WAY.map(n => (
                <li key={n} className="flex items-center gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 18px -8px rgba(96,165,250,0.5)' }}>
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-[17px] font-semibold" style={{ color: 'var(--ink)' }}>{n}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── Founder FAQ ────────────────────────────────────────────────── */
const FOUNDER_FAQS = [
  { q: 'What do investors actually see about me?', a: 'Only what you make public on your one-pager. Your deck, raise size and traction stay private until you accept an intro request.' },
  { q: 'How does a warm intro actually work?', a: 'You request, the investor accepts, you both get each other’s email. We make the introduction, then step out of the way.' },
  { q: 'Do I have to accept every intro request?', a: 'Never. You approve each one. Decline anything that isn’t a fit, no awkwardness and no penalty.' },
  { q: 'Which stages and sectors do you cover?', a: 'Idea-stage to growth, across sectors. Investors publish their own thesis, and we only surface the ones that match yours.' },
  { q: 'Are the investor profiles real?', a: 'Yes. Profiles are verified and kept current by our team. We aggregate public ecosystem data, but nothing reaches you until it’s checked.' },
  { q: 'Is my data safe?', a: 'Encrypted in transit and at rest. Your deck goes nowhere you didn’t send it, and you control exactly what’s shared.' },
]

function FounderFAQ() {
  const reducedMotion = useReducedMotion()
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <section id="faq" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div
          className="text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            Founder questions
          </p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.1rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            The stuff you’re actually wondering.
          </h2>
        </motion.div>

        <div className="mt-12 border-t" style={{ borderColor: 'var(--line)' }}>
          {FOUNDER_FAQS.map((faq, i) => {
            const isOpen = openIdx === i
            return (
              <div key={faq.q} className="border-b" style={{ borderColor: 'var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-4 py-6 text-left"
                >
                  <span className="flex-1 font-bold transition-colors duration-200 group-hover:[color:var(--blue)]" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)', letterSpacing: '-0.015em', color: isOpen ? 'var(--blue)' : 'var(--ink)' }}>
                    {faq.q}
                  </span>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                    style={{ background: isOpen ? 'var(--gradient-primary)' : 'var(--surface)', color: isOpen ? '#fff' : 'var(--muted-2)', border: isOpen ? 'none' : '1px solid var(--line)', transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)' }}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="max-w-xl pb-6 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{faq.a}</p>
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

/* ── Objection-buster (CRO: kill the "yeah, but…" doubts) ──────── */
const OBJECTIONS = [
  { q: 'I’m too early for investors.', a: 'Pre-revenue, pre-seed, pre-everything? Plenty of cheque-writers back exactly that stage. We’ll show you which ones.' },
  { q: 'I don’t have a warm network.', a: 'That’s the whole point. We are the warm network. You bring the company, we bring the intro.' },
  { q: 'These platforms are ghost towns.', a: 'No graveyard here. Only active investors writing cheques right now, kept current by actual humans.' },
  { q: 'I don’t have time for another tool.', a: 'Eight minutes once, then we work in the background. No dashboard to babysit, no busywork.' },
  { q: 'What’s the catch on “free”?', a: 'There isn’t one. Founders never pay us a rupee. We’re building the network we wish we’d had.' },
  { q: 'Will you spam my inbox?', a: 'One email when something actually matters. We hate inbox clutter as much as you do.' },
]

function ObjectionBuster() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--bg)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            Every excuse, answered
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
          >
            Yeah, but&hellip;
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            We’ve heard them all. Here’s the short version, before you talk yourself out of it.
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-x-12 gap-y-2 sm:mt-16 sm:grid-cols-2"
          variants={obList}
          initial={reducedMotion ? false : 'hidden'}
          whileInView={reducedMotion ? undefined : 'show'}
          viewport={{ once: true, margin: '-60px' }}
        >
          {OBJECTIONS.map(o => (
            <motion.div key={o.q} variants={obItem} className="border-t py-6" style={{ borderColor: 'var(--line)' }}>
              {/* the doubt, demolished */}
              <p
                className="text-[16px] italic"
                style={{ color: 'var(--muted-2)', textDecoration: 'line-through', textDecorationColor: '#FB7185', textDecorationThickness: '2px' }}
              >
                &ldquo;{o.q}&rdquo;
              </p>
              {/* the comeback */}
              <p className="mt-2.5 flex items-start gap-2.5">
                <ArrowRight className="mt-[3px] h-4 w-4 shrink-0" style={{ color: 'var(--blue)' }} />
                <span className="text-[16px] font-semibold leading-relaxed" style={{ color: 'var(--ink)' }}>{o.a}</span>
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Founder-framed features (interactive manifesto) ───────────── */
type FFeature = { icon: LucideIcon; title: string; body: string }
const FOUNDER_FEATURES: FFeature[] = [
  { icon: Target, title: 'Matched to you', body: 'Investors ranked by fit with your stage, sector and cheque size. Not a 50,000-name dump.' },
  { icon: ShieldCheck, title: 'Vetted investors', body: 'Real, active cheque-writers. We background-check them so you never pitch a dead fund.' },
  { icon: Handshake, title: 'Warm intros', body: 'Request, they accept, you both get the email. No cold outreach, ever.' },
  { icon: Landmark, title: 'Grants for you', body: 'Every Indian grant you might qualify for. We read the fine print so you don’t.' },
  { icon: TrendingUp, title: 'Funding radar', body: 'A live read on who’s raising, who’s writing cheques, who quietly folded.' },
  { icon: CalendarDays, title: 'Rooms worth it', body: 'Pitch nights and office hours, filtered to your stage and city.' },
  { icon: Users2, title: 'Co-investors', body: 'Find investors backing the same round. Split the diligence, close faster.' },
  { icon: Bot, title: 'Your deck’s AI', body: 'An AI that’s read your deck and your market. Useful, occasionally brutal.' },
]

function FounderFeatures() {
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const current = FOUNDER_FEATURES[active]
  const ActiveIcon = current.icon

  const hl = (i: number, label: string) => {
    const isActive = i === active
    return (
      <button
        type="button"
        onMouseEnter={() => setActive(i)}
        onFocus={() => setActive(i)}
        className="relative isolate inline-block cursor-pointer bg-transparent font-bold transition-transform duration-200 hover:-translate-y-[2px]"
        style={{ color: 'var(--blue)' }}
      >
        {isActive && (
          <motion.span
            layoutId="founder-feat-marker"
            aria-hidden
            className="absolute z-0 rounded-[0.3em]"
            style={{ inset: '0.04em -0.2em 0.02em', background: 'var(--blue-bg)', boxShadow: 'inset 0 -0.42em 0 rgba(147,197,253,0.28)' }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </button>
    )
  }

  return (
    <section id="features" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%)' }}>
      <div aria-hidden className="cc-pattern-dots pointer-events-none absolute inset-0 opacity-[0.25]" />
      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-24 lg:py-28">
        <motion.div
          className="mb-10 flex items-center gap-4"
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--blue)' }}>
            What you actually get
          </span>
          <span className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--blue-l), transparent)' }} />
          <span className="hidden text-[12px] font-medium sm:inline" style={{ color: 'var(--muted-2)' }}>✶ poke the glowing words</span>
        </motion.div>

        <motion.p
          className="max-w-none"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.8rem)', lineHeight: 1.34, letterSpacing: '-0.022em', fontWeight: 700, color: 'var(--ink-2)' }}
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          You get the {hl(0, 'matches')} worth your time, {hl(1, 'investors')} we’ve already
          background-checked, cold emails turned into {hl(2, 'warm intros')}, every {hl(3, 'grant')} with
          your name on it, a live read on who’s {hl(4, 'funding')} whom, the {hl(5, 'events')} actually
          worth the commute, {hl(6, 'co-investing')} made refreshingly simple, and an {hl(7, 'AI')} that’s
          read your deck and won’t sugar-coat a thing.
        </motion.p>

        <div className="mt-16 border-t pt-9" style={{ borderColor: 'var(--line)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.title}
              className="flex items-center gap-4 sm:gap-5"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: EASE }}
            >
              <span className="hidden shrink-0 font-bold tabular-nums sm:block" style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1, color: 'var(--blue-l)' }}>
                {String(active + 1).padStart(2, '0')}
                <span style={{ fontSize: '1rem', color: 'var(--muted-2)' }}> / 08</span>
              </span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 30px -10px rgba(96,165,250,0.5)' }}>
                <ActiveIcon className="h-6 w-6" />
              </span>
              <p className="text-[16px] leading-relaxed sm:text-[18px]" style={{ color: 'var(--muted)' }}>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>{current.title}.</span>{' '}
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ── Confetti burst (plays on mount) ───────────────────────────── */
const CONFETTI_COLORS = ['#60A5FA', '#16A34A', '#F59E0B', '#EC4899', '#8B5CF6']
function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20">
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2
        const dist = 48 + Math.random() * 52
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist - 16
        return (
          <motion.span
            key={i}
            className="absolute block h-2 w-2 rounded-[2px]"
            style={{ background: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4, rotate: Math.random() * 540 }}
            transition={{ duration: 0.9 + Math.random() * 0.4, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

/* ── Reusable lead-capture form (CRO) ──────────────────────────── */
function LeadForm({ dark = false, cta = 'Get the brief' }: { dark?: boolean; cta?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'done') return
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      toast.error('Enter a valid email address.')
      return
    }
    setStatus('submitting')
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed, name: null, status: 'active', source: 'founder_landing' })
    if (error && error.code !== '23505') {
      setStatus('idle')
      toast.error('Could not save. Please try again.')
      return
    }
    setStatus('done')
    setEmail('')
  }

  if (status === 'done') {
    return (
      <motion.div
        className="relative inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
        style={dark
          ? { background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
          : { background: 'var(--pos-bg)', color: 'var(--pos)', border: '1px solid #BBF7D0' }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      >
        <Confetti />
        <CheckCircle2 className="h-4 w-4" /> You&apos;re in. Watch your inbox.
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="you@yourstartup.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={status === 'submitting'}
        className="text-sm"
        style={{
          flex: 1, height: 50, minWidth: 0, padding: '0 16px', borderRadius: 12, outline: 'none',
          background: dark ? 'rgba(255,255,255,0.12)' : 'var(--surface)',
          color: dark ? '#fff' : 'var(--ink)',
          border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid var(--line)',
        }}
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={dark ? '' : 'btn-primary'}
        style={dark
          ? { height: 50, padding: '0 22px', borderRadius: 12, fontWeight: 700, fontSize: '0.9375rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#0D1B2A' }
          : { height: 50, padding: '0 22px', fontSize: '0.9375rem', borderRadius: 12 }}
      >
        {status === 'submitting'
          ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving</>)
          : (<><Mail className="h-4 w-4" /> {cta}</>)}
      </button>
    </form>
  )
}

/* ── Lead-capture section (for the not-ready-yet crowd) ─────────── */
const LEAD_PERKS = ['Who’s actively writing cheques this month', 'Fresh grants you might qualify for', 'One email a week. Unsubscribe in one click.']

function LeadCaptureSection() {
  const reducedMotion = useReducedMotion()
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        {/* copy */}
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]" style={{ color: '#93C5FD' }}>
            Not ready to set up?
          </p>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.6vw, 2.9rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: '#fff' }}>
            Get the founder fundraising brief.
          </h2>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.74)' }}>
            No pressure, no spam. Just the signal that helps you raise, straight to your inbox.
          </p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {LEAD_PERKS.map(p => (
              <li key={p} className="flex items-center gap-2.5 text-[14.5px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                <Check className="h-4 w-4 shrink-0" style={{ color: '#93C5FD' }} /> {p}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* form */}
        <motion.div
          className="rounded-3xl p-8 sm:p-10"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 70px -40px rgba(0,0,0,0.5)' }}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: 'var(--gradient-primary)', boxShadow: '0 12px 28px -10px rgba(0,0,0,0.4)' }}>
              <Mail className="h-[22px] w-[22px]" />
            </span>
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: '#fff' }}>The weekly brief</span>
          </div>
          <p className="mt-4 mb-5 text-[14.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Drop your email and we&apos;ll send the first issue this week.
          </p>
          <LeadForm dark cta="Send it to me" />
          <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Free. One click to unsubscribe. We never share your email.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ── Founder pillars (clean 2x2, no awkward cross) ─────────────── */
const PILLARS: { icon: LucideIcon; kicker: string; title: string; body: string }[] = [
  { icon: Users2, kicker: 'Connect', title: 'Real people, real intros', body: 'Actual introductions to actual investors. No bots pretending to be a “warm connection.”' },
  { icon: Target, kicker: 'Discover', title: 'Quality over quantity', body: 'Three right intros beat thirty sprayed into the void. We optimise for fit, not list size.' },
  { icon: ShieldCheck, kicker: 'Trust', title: 'Locked down, both sides', body: 'Verified profiles, encrypted in transit and at rest. SOC 2 readiness in progress. Your deck goes nowhere you didn’t send it.' },
  { icon: TrendingUp, kicker: 'Growth', title: 'We win when you do', body: 'We only win when you raise, so everything we build points at getting more founders funded.' },
]

function FounderPillars() {
  const reducedMotion = useReducedMotion()
  return (
    <section style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="relative w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
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
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}>
            Four things we won&apos;t bend on.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            The non-negotiables. The stuff we&rsquo;d rather lose a deal than fake.
          </p>
        </motion.div>

        {/* horizontal timeline */}
        <div className="relative mt-20 sm:mt-24">
          {/* spine, drawn in (desktop) */}
          <motion.span
            aria-hidden
            className="absolute z-0 hidden h-[2px] lg:block"
            style={{ top: 30, left: '12.5%', right: '12.5%', background: 'var(--gradient-primary)', opacity: 0.45, transformOrigin: 'left' }}
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1, ease: EASE }}
          />

          <motion.div
            className="grid grid-cols-1 gap-y-14 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-16 lg:grid-cols-4 lg:gap-x-8"
            variants={obList}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
          >
            {PILLARS.map(p => {
              const Icon = p.icon
              return (
                <motion.div key={p.kicker} variants={obItem} className="group relative flex flex-col items-center px-2 text-center">
                  {/* node on the line */}
                  <span
                    className="relative z-10 flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:-translate-y-1"
                    style={{ background: 'var(--gradient-primary)', boxShadow: '0 16px 36px -12px rgba(96,165,250,0.55), 0 0 0 7px var(--surface-2)' }}
                  >
                    <Icon className="h-7 w-7" />
                  </span>

                  {/* gradient kicker */}
                  <span
                    className="mt-6 font-bold"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2vw, 2.1rem)', letterSpacing: '-0.025em', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: '0.04em' }}
                  >
                    {p.kicker}
                  </span>
                  <h3 className="mt-1 font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '17px', letterSpacing: '-0.015em', color: 'var(--ink)' }}>
                    {p.title}
                  </h3>
                  <p className="mx-auto mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '17rem' }}>
                    {p.body}
                  </p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── Founder closer ────────────────────────────────────────────── */
function FounderClose({ signupUrl }: { signupUrl: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden">
      <div className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20"
          style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1E3A8A 45%, #1D4ED8 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="relative mx-auto max-w-2xl">
            <motion.h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.4vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em', color: '#fff' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              Your next investor intro is one setup away.
            </motion.h2>
            <motion.p
              className="mx-auto mt-5 max-w-lg text-base leading-relaxed sm:text-lg"
              style={{ color: 'rgba(255,255,255,0.78)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            >
              Build your one-pager once and start getting matched to investors who back your stage and sector. Free, forever, for founders.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-col items-center gap-4"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            >
              <Link
                to={signupUrl}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-9 text-base font-bold"
                style={{ background: '#fff', color: '#0D1B2A', boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)' }}
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: '#4ADE80' }} /> Free for founders</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: '#4ADE80' }} /> No credit card</span>
                <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: '#4ADE80' }} /> ~8 minutes</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */
export function ForFoundersPage() {
  const signupUrl = useSignupUrl()

  return (
    <div className="marketing-page" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <SEO
        title="FounderCentral for Founders: warm intros to investors who fund your stage"
        bareTitle
        description="Stop cold-emailing investors. FounderCentral matches founders to stage-relevant VCs, angels and family offices, then opens the door with a curated warm introduction. Free for founders."
        path="/for-founders"
      />
      <Nav signupUrl={signupUrl} />
      <main>
        <Hero signupUrl={signupUrl} />
        <HookStrip />
        <MatchDemo />
        <FounderProblem />
        <BeforeAfter />
        <HowItWorks />
        <FounderFeatures />
        <ObjectionBuster />
        <FounderPillars />
        <LeadCaptureSection />
        <FounderFAQ />
        <FounderClose signupUrl={signupUrl} />
      </main>
      <MarketingFooter />
      <StickyCta signupUrl={signupUrl} />
    </div>
  )
}
