import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'

const EASE = [0.22, 1, 0.36, 1] as const

interface NavItem { label: string; href: string; desc: string; external?: boolean }
interface NavGroupDef { label: string; items: NavItem[] }

/* Three umbrella terms instead of eight links. Labels are deliberately
   plain so nobody has to guess what's behind them; the personality lives
   in the item descriptions.
 *
 * ORDER MATTERS: menus, and the items inside them, follow the page's
 * top-to-bottom order. Reading the nav left-to-right and each dropdown
 * top-to-bottom always walks you further DOWN the page, never back up.
 * Page order: #features (11) → #how-it-works (18) → #for-founders (19)
 * → #for-investors (20) → #for-incubators (21) → #about (23)
 * → #newsletter (25) → #faq (27). Blog is external, so it sits last. */
const NAV: NavGroupDef[] = [
  {
    label: 'Product',
    items: [
      { label: 'Features', href: '#features', desc: 'Everything a raising founder needs.' },
      { label: 'How it works', href: '#how-it-works', desc: 'From match to warm intro in three moves.' },
    ],
  },
  {
    label: 'Who it’s for',
    items: [
      { label: 'For founders', href: '#for-founders', desc: 'Warm intros to investors who fund your stage.' },
      { label: 'For investors', href: '#for-investors', desc: 'High-signal deal flow, on your thesis.' },
      { label: 'For incubators', href: '#for-incubators', desc: 'Run your cohort’s fundraise from one portal.' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'About', href: '#about', desc: 'Why we exist, and what we won’t bend on.' },
      { label: 'Newsletter', href: '#newsletter', desc: 'Fundraising insights, every Monday.' },
      { label: 'FAQ', href: '#faq', desc: 'Honest answers to the awkward questions.' },
      { label: 'Blog', href: 'https://foundercentral.in/blog', desc: 'Writing on raising in India.', external: true },
    ],
  },
]

const triggerCls =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors [color:var(--muted)] hover:[background:var(--surface-2)] hover:[color:var(--ink)]'

function NavGroup({ group }: { group: NavGroupDef }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDoc)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDoc) }
  }, [open])

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(o => !o)} className={triggerCls}>
        {group.label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none', opacity: 0.6 }} />
      </button>

      <AnimatePresence>
        {open && (
          /* pt-2 keeps the hover bridge intact between trigger and panel */
          <motion.div
            className="absolute left-1/2 top-full z-50 w-[320px] -translate-x-1/2 pt-2"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: EASE }}
          >
            <div className="overflow-hidden rounded-2xl p-1.5"
              style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 28px 60px -24px rgba(13,27,42,0.35)' }}>
              {group.items.map(it => (
                <a key={it.label} href={it.href} onClick={() => setOpen(false)}
                  {...(it.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="group block rounded-xl px-3 py-2.5 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--rd-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span className="flex items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--rd-ink)' }}>
                    {it.label}
                    <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60" />
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: 'var(--rd-muted-2)' }}>{it.desc}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function RedesignNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', latest => {
    const next = latest > 560
    setScrolled(prev => (prev !== next ? next : prev))
  })

  const ctaLabel = scrolled ? 'Unlock my matches' : 'Find my investors'

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav
        className="flex h-16 w-full items-center justify-between gap-6 px-6 transition-all duration-300 sm:px-10 lg:px-16"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.6)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(15,23,42,0.08)' : 'transparent'}`,
          boxShadow: scrolled ? '0 10px 30px -18px rgba(15,23,42,0.2)' : 'none',
        }}
      >
        <Link to="/" className="flex shrink-0 items-center" aria-label="FounderCentral home">
          <FounderCentralLogo size="md" />
        </Link>

        {/* Three umbrella menus */}
        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV.map(g => <NavGroup key={g.label} group={g} />)}
        </div>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link to="/auth/login" className="rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors [color:var(--ink)] hover:[color:var(--blue)]">
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="group inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all"
            style={{ height: 38, padding: '0 16px', fontSize: '13.5px', background: 'var(--rd-grad)', color: 'white', boxShadow: '0 6px 16px -6px rgba(37,99,235,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={ctaLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                {ctaLabel}
              </motion.span>
            </AnimatePresence>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden"
          style={{ border: '1px solid var(--rd-border)', background: 'var(--rd-surface)', color: 'var(--rd-ink)' }}
        >
          {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
        </button>
      </nav>

      {/* Mobile: groups expanded, no nested tapping */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="w-full overflow-hidden lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'saturate(180%) blur(16px)',
              WebkitBackdropFilter: 'saturate(180%) blur(16px)',
              borderBottom: '1px solid rgba(15,23,42,0.08)',
              boxShadow: '0 16px 40px -16px rgba(15,23,42,0.2)',
            }}
          >
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 sm:px-10">
              {NAV.map(g => (
                <div key={g.label} className="mb-4">
                  <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--rd-muted-2)' }}>{g.label}</div>
                  {g.items.map(it => (
                    <a key={it.label} href={it.href} onClick={() => setMobileOpen(false)}
                      {...(it.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="block rounded-lg px-3 py-2.5 text-[14px] font-medium" style={{ color: 'var(--rd-ink)' }}>
                      {it.label}
                    </a>
                  ))}
                </div>
              ))}
              <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[14px] font-semibold" style={{ color: 'var(--rd-ink)' }}>Sign in</Link>
                <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold" style={{ height: 44, background: 'var(--rd-grad)', color: 'white', fontSize: '14px' }}>
                  Find my investors <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
