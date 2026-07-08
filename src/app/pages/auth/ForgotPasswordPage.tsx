import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import {
  assertPasswordResetAllowed,
  normalizeEmail,
  recordPasswordResetAttempt,
} from '@/app/lib/authSecurity'
import { logSecurityEvent } from '@/app/lib/securityEvents'
import { SEO } from '@/app/components/SEO'

const inputClass = 'w-full h-12 pl-11 pr-4 text-[14px] rounded-xl border outline-none transition-all'
const inputBase: React.CSSProperties = {
  color: '#0F172A',
  background: '#F8FAFC',
  borderColor: '#E2E8F0',
  fontFamily: 'var(--font-body)',
}
const inputFocus = 'focus:border-[#2563EB] focus:ring-2 focus:ring-[rgba(37,99,235,0.10)] focus:bg-white'
const iconStyle: React.CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94A3B8' }

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0 || !email) return
    setIsLoading(true)
    try {
      const normalizedEmail = normalizeEmail(email)
      assertPasswordResetAllowed(normalizedEmail)
      logSecurityEvent({ type: 'auth_password_reset_requested', email: normalizedEmail })
      const appUrl = import.meta.env.VITE_APP_URL as string | undefined
      const redirectBase = appUrl ?? window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${redirectBase}/auth/reset-password`,
      })
      if (error) throw error
      recordPasswordResetAttempt(normalizedEmail)
      setEmail(normalizedEmail)
      setSent(true)
      setCooldown(60)
      intervalRef.current = setInterval(() => {
        setCooldown(c => {
          if (c <= 1) { clearInterval(intervalRef.current!); intervalRef.current = null; return 0 }
          return c - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : 'If that email is registered, a reset link has been sent.'
      logSecurityEvent({ type: 'auth_password_reset_failure', outcome: 'failure', email, message })
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || cooldown > 0 || !email

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle2 style={{ width: 32, height: 32, color: '#2563EB' }} />
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
          }}
        >
          Email sent
        </h2>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 6 }}>
          Check <strong style={{ color: '#0F172A' }}>{email}</strong> for a password reset link.
        </p>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24 }}>
          Not seeing it? Check your spam folder. If you signed up with Google, just{' '}
          <Link to="/auth/login" style={{ fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
            sign in with Google
          </Link>{' '}
          instead — no password needed.
        </p>
        <Link
          to="/auth/login"
          style={{ fontWeight: 700, fontSize: 13, color: '#2563EB', textDecoration: 'none' }}
        >
          Back to sign in
        </Link>
      </motion.div>
    )
  }

  return (
    <>
      <SEO title="Forgot Password" path="/auth/forgot-password" noindex />
      <div>
        <Link
          to="/auth/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#64748B',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: 32,
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to sign in
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
            }}
          >
            Reset password
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>
            Enter your email and we'll send a reset link. If you signed up with Google, just{' '}
            <Link to="/auth/login" style={{ fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
              sign in with Google
            </Link>{' '}
            instead.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={iconStyle} />
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={`${inputClass} ${inputFocus}`}
                style={inputBase}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isDisabled}
            className="w-full h-[52px] flex items-center justify-center gap-2 text-[15px] font-bold rounded-xl border-none transition-all"
            style={{
              background: isDisabled ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isDisabled ? 'none' : '0 2px 8px rgba(15,23,42,0.15)',
              letterSpacing: '-0.01em',
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send reset link'}
          </button>
        </form>
      </div>
    </>
  )
}
