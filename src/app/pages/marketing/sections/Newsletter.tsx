import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EASE = [0.22, 1, 0.36, 1] as const

const PERKS = ['Fundraising insights', 'Investor intelligence', 'Startup autopsies', 'Weekly resources']

const STORIES: Array<{ tag: string; title: string }> = [
  { tag: 'Valuations', title: 'Seed rounds are pricing 12% tighter than Q1. Time to trim the ask?' },
  { tag: 'Signal', title: 'Three global funds just opened India offices. Guess who’s hiring scouts.' },
  { tag: 'Autopsy', title: 'Why a ₹40 Cr D2C brand quietly shut down (it rhymes with “burn rate”).' },
]

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }
const item: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }

export function Newsletter() {
  const reducedMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || status === 'done') return

    const trimmedEmail = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast.error('Enter a valid email address.')
      return
    }

    setStatus('submitting')
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmedEmail, name: name.trim() || null, status: 'active', source: 'landing' })

    if (error && error.code !== '23505') {
      setStatus('idle')
      toast.error('Could not subscribe. Please try again.')
      return
    }

    setStatus('done')
    setEmail('')
    setName('')
  }

  return (
    <section id="newsletter">
      <div className="w-full px-6 py-16 sm:px-10 sm:py-18 lg:px-16">
        <div
          className="overflow-hidden rounded-3xl"
          style={{ background: 'linear-gradient(160deg, var(--blue-bg) 0%, var(--surface) 55%)', border: '1px solid var(--line)' }}
        >
          <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-14 lg:p-14">
            {/* Left — copy + form */}
            <div>
              <motion.div
                className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ background: 'var(--surface)', color: 'var(--blue)', border: '1px solid rgba(96,165,250,0.25)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <Mail className="h-3 w-3" />
                Capital Intelligence Brief
              </motion.div>

              <motion.h2
                className="font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', lineHeight: 1.14, letterSpacing: '-0.025em', color: 'var(--ink)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
              >
                The weekly briefing founders actually read.
              </motion.h2>

              <motion.p
                className="mt-4 max-w-xl text-[15px] leading-relaxed"
                style={{ color: 'var(--muted)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
              >
                Fundraising strategies, cap-table dynamics, investor signals and ecosystem moves. Five
                minutes, zero fluff, no “as an AI language model.”
              </motion.p>

              <motion.div
                className="mt-5 flex flex-wrap gap-x-5 gap-y-2"
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
              >
                {PERKS.map(p => (
                  <span key={p} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--blue)' }} />
                    {p}
                  </span>
                ))}
              </motion.div>

              {status !== 'done' ? (
                <motion.form
                  onSubmit={handleSubmit}
                  className="mt-7 max-w-md"
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
                >
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={status === 'submitting'}
                      className="text-sm sm:w-40"
                      style={{ height: 48, padding: '0 14px', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none' }}
                    />
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
                      style={{ flex: 1, minWidth: 0, height: 48, padding: '0 14px', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="btn-primary mt-2.5 w-full sm:w-auto"
                    style={{ height: 48, padding: '0 26px', fontSize: '0.9375rem', borderRadius: 12 }}
                  >
                    {status === 'submitting' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing</>
                    ) : (
                      <>Subscribe free <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                  <p className="mt-3 text-xs" style={{ color: 'var(--muted-2)' }}>
                    One email per week. Unsubscribe anytime ·{' '}
                    <Link to="/newsletter" className="underline-offset-2 hover:underline" style={{ color: 'var(--blue)' }}>read past issues</Link>
                  </p>
                </motion.form>
              ) : (
                <div className="mt-7 inline-flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'var(--pos-bg)', border: '1px solid #BBF7D0' }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--pos)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>You&apos;re in! Check your inbox this Monday.</span>
                </div>
              )}
            </div>

            {/* Right — this week's issue (editorial teaser) */}
            <motion.div
              className="rounded-2xl p-6 sm:p-7"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 18px 50px -34px rgba(15,23,42,0.25)' }}
              variants={list}
              initial={reducedMotion ? false : 'hidden'}
              whileInView={reducedMotion ? undefined : 'show'}
              viewport={{ once: true, margin: '-60px' }}
            >
              <motion.div variants={item} className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--muted-2)' }}>
                  In this week’s issue
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                  #24
                </span>
              </motion.div>

              <div className="mt-4 space-y-4">
                {STORIES.map(s => (
                  <motion.div key={s.tag} variants={item} className="border-t pt-4 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--blue)' }}>{s.tag}</span>
                    <p className="mt-1 text-[14.5px] font-medium leading-snug" style={{ color: 'var(--ink)' }}>{s.title}</p>
                  </motion.div>
                ))}
              </div>

              <motion.p variants={item} className="mt-5 text-[12px]" style={{ color: 'var(--muted-2)' }}>
                5-minute read · lands every Monday.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
