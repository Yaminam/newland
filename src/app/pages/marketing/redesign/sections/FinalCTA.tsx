import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

export function FinalCTA() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-bg)' }}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-24">
        <motion.div
          className="relative overflow-hidden rounded-[32px] px-8 py-16 text-center sm:px-14 sm:py-20"
          style={{ background: 'linear-gradient(135deg,#2563EB 0%,#4F46E5 52%,#1E40AF 100%)' }}
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {/* Ambient depth glows + gold warmth */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{ top: '-32%', right: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.28), transparent 62%)', filter: 'blur(24px)' }} />
            <div className="absolute" style={{ bottom: '-42%', left: '-6%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,185,90,0.35), transparent 62%)', filter: 'blur(28px)' }} />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-3xl font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 4.4vw, 3.7rem)', lineHeight: 1.04, letterSpacing: '-0.03em', color: '#fff' }}>
              See your matches. Then unlock the names.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
              You already ran the matcher and saw real investors who fit. A free profile just removes the blur, opens one-click intros, and hands you the grants, events and funding feed.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth/signup" className="rd-btn w-full sm:w-auto" style={{ height: 54, padding: '0 30px', background: '#fff', color: '#1E3A8A', fontSize: '16px' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                Create my free profile <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="rd-btn w-full sm:w-auto" style={{ height: 54, padding: '0 26px', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: '15px', background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                See how it works
              </a>
            </div>
            <p className="mt-7 text-[13.5px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Free for founders. No credit card. About 8 minutes to a full profile.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
