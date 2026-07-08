import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, CreditCard, Clock } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

const TRUST = [
  { icon: ShieldCheck, label: 'Free for founders' },
  { icon: CreditCard, label: 'No credit card' },
  { icon: Clock, label: '~8 minutes to set up' },
]

export function FinalCTA() {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden">
      <div className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20 lg:py-24"
          style={{
            background: 'linear-gradient(135deg, #0D1B2A 0%, #1E3A8A 45%, #1D4ED8 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Animated aurora orbs */}
          {!reducedMotion && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                style={{ top: '-25%', left: '12%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147,197,253,0.32), transparent 65%)', filter: 'blur(24px)' }}
                animate={{ x: [0, 40, -20, 0], y: [0, 26, -12, 0], scale: [1, 1.12, 0.95, 1] }}
                transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute"
                style={{ bottom: '-30%', right: '14%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.28), transparent 65%)', filter: 'blur(24px)' }}
                animate={{ x: [0, -32, 18, 0], y: [0, -20, 12, 0], scale: [1, 1.1, 0.94, 1] }}
                transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
              />
            </>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />

          {/* quirky tombstone for the dearly departed cold email */}
          <div
            aria-hidden
            className="absolute bottom-6 left-6 hidden -rotate-6 select-none rounded-xl px-3 py-2 text-left lg:block"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(4px)' }}
          >
            <div className="text-[13px] font-bold text-white/85">🪦 The cold email</div>
            <div className="text-[10.5px] text-white/55">2009 – 2026 · won’t be missed</div>
          </div>

          <div className="relative mx-auto max-w-3xl">
            <motion.span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              ✦ The “just circling back” era ends here
            </motion.span>

            <motion.h2
              className="mt-6 font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.4vw, 3.5rem)', lineHeight: 1.08, letterSpacing: '-0.025em', color: '#fff' }}
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.05, ease: EASE }}
            >
              Skip the{' '}
              <span className="relative inline-block whitespace-nowrap">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>cold emails</span>
                {/* strike that draws itself through "cold emails" */}
                <motion.span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-[3px] w-full rounded-full"
                  style={{ background: '#FB7185', transformOrigin: 'left' }}
                  initial={reducedMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
                />
              </span>
              .{' '}
              <span style={{ background: 'linear-gradient(135deg, #BFDBFE 0%, #fff 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                Get the warm intro.
              </span>
            </motion.h2>

            <motion.p
              className="mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'rgba(255,255,255,0.78)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            >
              No more “just bumping this to the top of your inbox 🙂”. Request curated, fit-led intros and
              trade the spray-and-pray for something that, wild idea, actually works.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-col items-center gap-4"
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            >
              <motion.div whileHover={reducedMotion ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/auth/signup"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl px-9 text-base font-bold transition-shadow"
                  style={{ background: '#fff', color: '#0D1B2A', boxShadow: '0 16px 40px -12px rgba(0,0,0,0.45)' }}
                >
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>

              {/* Trust chips */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {TRUST.map(t => {
                  const Icon = t.icon
                  return (
                    <span key={t.label} className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      <Icon className="h-4 w-4" style={{ color: '#4ADE80' }} /> {t.label}
                    </span>
                  )
                })}
              </div>

              {/* cheeky P.S. */}
              <motion.p
                className="mt-1 text-[12.5px] italic"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                initial={reducedMotion ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              >
                P.S. your 47 unanswered cold emails send their regards. (There are none.)
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
