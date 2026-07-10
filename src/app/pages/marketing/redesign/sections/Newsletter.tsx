import { useState } from 'react'
import { Mail, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

// ⚠️ This landing build has no backend. Submitting hands off to the real
// newsletter page. Wire this to your actual list before launch.
const SIGNUP_URL = 'https://foundercentral.in/newsletter'

export function Newsletter() {
  const reduce = useReducedMotion()
  const [email, setEmail] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = SIGNUP_URL
  }

  return (
    <section id="newsletter" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <motion.div className="rd-lit mx-auto max-w-3xl px-7 py-12 text-center sm:px-12"
          initial={reduce ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-70px' }} transition={{ duration: 0.65, ease: EASE }}>

          <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: 'var(--rd-grad)', boxShadow: '0 16px 34px -14px rgba(37,99,235,0.6)' }}>
            <Mail className="h-5 w-5" />
          </span>

          <span className="rd-eyebrow mb-5">The weekly brief</span>

          <h2 className="mx-auto max-w-xl font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.5vw, 2.8rem)', lineHeight: 1.08, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Fundraising insights, every Monday.
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-[15.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            Who’s raising, who’s writing cheques, and what actually changed this week. Short, useful, and free.
          </p>

          <form onSubmit={submit} className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-2.5 sm:flex-row">
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input
              id="nl-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@startup.in"
              className="w-full flex-1 rounded-xl px-4 text-[15px] outline-none transition-colors"
              style={{ height: 52, background: 'var(--rd-surface-2)', border: '1.5px solid var(--rd-border-2)', color: 'var(--rd-ink)' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--rd-blue)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--rd-border-2)')}
            />
            <button type="submit" className="rd-btn rd-btn-primary shrink-0" style={{ height: 52, padding: '0 24px', fontSize: '15px' }}>
              Subscribe free <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-[12.5px]" style={{ color: 'var(--rd-muted-2)' }}>
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
