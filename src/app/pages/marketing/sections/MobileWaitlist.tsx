import { useState, type FormEvent, type ComponentType } from 'react'
import { Smartphone, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EASE = [0.22, 1, 0.36, 1] as const

export function MobileWaitlist() {
  const reducedMotion = useReducedMotion()
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
    const { error } = await supabase.from('mobile_waitlist').insert({ email: trimmed, source: 'landing' })

    if (error && error.code !== '23505') {
      setStatus('idle')
      toast.error('Could not save. Please try again.')
      return
    }

    setStatus('done')
    setEmail('')
  }

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      {/* soft ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -right-20 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full lg:block" style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.1), transparent 70%)', filter: 'blur(20px)' }} />

      <div className="relative w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Copy + form */}
          <div className="order-1">
            <motion.div
              className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <Smartphone className="h-3 w-3" />
              Apps launching soon
            </motion.div>

            <motion.h2
              className="font-bold"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.6vw, 3rem)', lineHeight: 1.12, letterSpacing: '-0.028em', color: 'var(--ink)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
            >
              iOS and Android. Almost there.
            </motion.h2>

            <motion.p
              className="mt-5 max-w-xl text-[16px] leading-relaxed"
              style={{ color: 'var(--muted)' }}
              initial={reducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
            >
              Triage intros from the bus, take investor calls on the go, and ping back the second a match
              drops. The web app works today; the phones are on their final lap.
            </motion.p>

            {/* Store badges */}
            <motion.div
              className="mt-7 flex flex-wrap gap-3"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
            >
              {STORES.map(({ name, sub, Logo }) => (
                <div
                  key={name}
                  className="inline-flex items-center gap-3 rounded-2xl px-4 py-2.5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
                >
                  <Logo />
                  <div className="text-left leading-tight">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--muted-2)' }}>{sub}</div>
                    <div className="text-[14.5px] font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>{name}</div>
                  </div>
                  <span
                    className="ml-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue-border)' }}
                  >
                    Soon
                  </span>
                </div>
              ))}
            </motion.div>

            {status !== 'done' ? (
              <motion.form
                onSubmit={handleSubmit}
                className="mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="you@yourstartup.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'submitting'}
                  className="cc-wl-input text-sm"
                  style={{ flex: 1, height: 50, minWidth: 0, padding: '0 16px', borderRadius: 12, background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="btn-primary"
                  style={{ height: 50, padding: '0 22px', fontSize: '0.9375rem', borderRadius: 12 }}
                >
                  {status === 'submitting' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving</>
                  ) : (
                    <><Bell className="h-4 w-4" /> Notify me when it&apos;s live</>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                className="mt-8 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: '1px solid #BBF7D0' }}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <CheckCircle2 className="h-4 w-4" />
                You&apos;re on the list. We&apos;ll email you the moment it ships.
              </motion.div>
            )}

            <p className="mt-3.5 text-xs" style={{ color: 'var(--muted-2)' }}>
              One email when the apps go live. No newsletter spam. Promise.
            </p>
          </div>

          {/* Minimal "coming soon" device */}
          <div className="order-2 flex justify-center">
            <ComingSoonPhone reducedMotion={!!reducedMotion} />
          </div>
        </div>
      </div>
    </section>
  )
}

function ComingSoonPhone({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative" style={{ perspective: 1000 }}>
      {!reducedMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10"
          style={{ background: 'radial-gradient(closest-side, rgba(96,165,250,0.18), transparent 75%)', filter: 'blur(12px)' }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative" style={{ width: 248, height: 500 }}>
          <div
            className="absolute inset-0 rounded-[46px]"
            style={{ background: 'linear-gradient(160deg, #1A2A3F 0%, #0D1B2A 100%)', padding: 7, boxShadow: '0 50px 80px -28px rgba(15,23,42,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)' }}
          >
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[40px] px-8 text-center" style={{ background: 'linear-gradient(170deg, #2563EB 0%, #1D4ED8 52%, #0D1B2A 100%)' }}>
              {/* notch */}
              <div className="absolute left-1/2 top-3.5 h-[24px] w-[96px] -translate-x-1/2 rounded-full" style={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.08)' }} />

              {/* faint app-icon grid for depth */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} />

              <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px]" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.24)', backdropFilter: 'blur(8px)', boxShadow: '0 10px 24px -8px rgba(0,0,0,0.4)' }}>
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div className="relative mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">FounderCentral</div>
              <div className="relative mt-2 text-[21px] font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                Coming soon<br />to your pocket
              </div>

              {/* final-lap progress */}
              <div className="relative mt-6 w-[160px]">
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#fff' }}
                    initial={reducedMotion ? false : { width: 0 }}
                    whileInView={{ width: '92%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, delay: 0.4, ease: EASE }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-white/80">
                  <span className="relative flex h-1.5 w-1.5">
                    {!reducedMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Final lap · iOS &amp; Android
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" style={{ color: 'var(--ink)' }} aria-hidden>
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8C2.94 17.49 1.9 14.68 1.9 12.03c0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.978 4.46z" />
    </svg>
  )
}

function GooglePlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <defs>
        <linearGradient id="gplay-grad-mw" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E0FF" />
          <stop offset="34%" stopColor="#00F076" />
          <stop offset="67%" stopColor="#FFD400" />
          <stop offset="100%" stopColor="#FF3B44" />
        </linearGradient>
      </defs>
      <path d="M4 2.4 L20 12 L4 21.6 Z" fill="url(#gplay-grad-mw)" />
    </svg>
  )
}

const STORES: Array<{ name: string; sub: string; Logo: ComponentType }> = [
  { name: 'App Store', sub: 'Coming soon to', Logo: AppleLogo },
  { name: 'Google Play', sub: 'Coming soon on', Logo: GooglePlayLogo },
]
