import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'

// The redesign cuts the navbar to the decision: three ways in, one smart CTA.
const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works', isRoute: false },
  { label: 'For investors', href: '/for-investors', isRoute: true },
  { label: 'For incubators', href: '/for-incubators', isRoute: true },
] as const

const linkCls =
  'rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors [color:var(--muted)] hover:[background:var(--surface-2)] hover:[color:var(--ink)]'

export function RedesignNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  // Cross-threshold toggle only — no per-frame React state churn.
  useMotionValueEvent(scrollY, 'change', latest => {
    const next = latest > 560
    setScrolled(prev => (prev !== next ? next : prev))
  })

  // The CTA follows the funnel: discover at the top, convert past the tool.
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

        {/* Three links, centered */}
        <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map(link =>
            link.isRoute ? (
              <Link key={link.href} to={link.href} className={linkCls}>{link.label}</Link>
            ) : (
              <a key={link.href} href={link.href} className={linkCls}>{link.label}</a>
            ),
          )}
        </div>

        {/* One smart CTA + quiet sign-in */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link to="/auth/login" className="rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors [color:var(--ink)] hover:[color:var(--blue)]">
            Sign in
          </Link>
          <Link
            to="/auth/signup"
            className="group inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all"
            style={{ height: 38, padding: '0 16px', fontSize: '13.5px', background: 'var(--gradient-primary)', color: 'white', boxShadow: '0 6px 16px -6px rgba(37,99,235,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 22px -8px rgba(37,99,235,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px -6px rgba(37,99,235,0.5)' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={ctaLabel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {ctaLabel}
              </motion.span>
            </AnimatePresence>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:hidden"
          style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
        >
          {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="w-full overflow-hidden lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'saturate(180%) blur(16px)',
              WebkitBackdropFilter: 'saturate(180%) blur(16px)',
              borderBottom: '1px solid rgba(15,23,42,0.08)',
              boxShadow: '0 16px 40px -16px rgba(15,23,42,0.2)',
            }}
          >
            <div className="flex flex-col gap-0.5 px-5 py-3 sm:px-10">
              {NAV_LINKS.map(link =>
                link.isRoute ? (
                  <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{link.label}</Link>
                ) : (
                  <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{link.label}</a>
                ),
              )}
              <div className="mt-2 flex flex-col gap-2 border-t pt-3" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                <Link to="/auth/login" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>Sign in</Link>
                <Link to="/auth/signup" onClick={() => setMobileOpen(false)} className="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold" style={{ height: 44, background: 'var(--gradient-primary)', color: 'white', fontSize: '14px' }}>
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
