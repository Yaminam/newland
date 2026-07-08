import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/app/lib/supabase'
import { isEmailVerified } from '@/app/lib/authSecurity'
import { useAuth } from '@/app/context/AuthContext'
import { useEmailVerification } from '@/app/hooks/useEmailVerification'
import { SEO } from '@/app/components/SEO'

export function EmailVerificationPage() {
  const { pendingVerificationEmail } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'verified' | 'pending'>('loading')

  const emailFromState = (location.state as { email?: string } | null)?.email ?? null
  const email = useMemo(() => emailFromState ?? pendingVerificationEmail, [emailFromState, pendingVerificationEmail])
  const {
    resend,
    isResending,
    cooldownSeconds,
    retriesLeft,
    error,
    success,
  } = useEmailVerification(email)

  useEffect(() => {
    let isMounted = true

    async function resolveVerificationStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!isMounted) return
      setStatus(isEmailVerified(user) ? 'verified' : 'pending')
    }

    void resolveVerificationStatus()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void resolveVerificationStatus()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const verified = status === 'verified'

  // Auto-redirect to login once verified (user can sign in immediately)
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => navigate('/auth/login'), 2000)
      return () => clearTimeout(timer)
    }
  }, [verified, navigate])

  const resendDisabled = cooldownSeconds > 0 || isResending || !email || retriesLeft <= 0

  return (
    <>
      <SEO title="Verify Email" path="/auth/verify-email" noindex />
      <div
        className="marketing-page min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--blue-bg)' }}
          >
            <Mail className="w-10 h-10" style={{ color: 'var(--blue)' }} />
          </div>

          {/* Title */}
          <h1
            className="font-bold mb-3"
            style={{
              fontSize: '1.5rem',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            {status === 'loading' ? 'Checking verification' : verified ? 'Email verified' : 'Please verify your email'}
          </h1>

          {/* Description */}
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            {status === 'loading'
              ? 'Validating your verification link.'
              : verified
                ? 'Your email has been verified successfully.'
                : 'We sent a verification link to your email address. Please open it before signing in.'}
          </p>

          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            {email ? (
              <>Verification email sent to <strong style={{ color: 'var(--ink)' }}>{email}</strong></>
            ) : (
              'We could not determine the email address for this verification request.'
            )}
          </p>

          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {verified
              ? 'You can now sign in and complete your profile setup.'
              : 'If the email does not arrive, you can resend it once the cooldown timer reaches zero.'}
          </p>

          {/* Resend card */}
          {!verified && (
            <div
              className="p-5 mb-6 mx-auto"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-lg)',
              }}
            >
              <div className="flex flex-col gap-4 items-center text-center">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    Resend available in {cooldownSeconds}s
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    Retries left: {retriesLeft}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={resendDisabled}
                  className="w-full inline-flex items-center justify-center gap-2 font-semibold transition-all"
                  style={{
                    height: 44,
                    fontSize: '0.875rem',
                    background: resendDisabled ? 'var(--faint)' : 'var(--blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--r-sm)',
                    cursor: resendDisabled ? 'not-allowed' : 'pointer',
                    boxShadow: resendDisabled ? 'none' : 'var(--sh-2)',
                  }}
                  onMouseEnter={e => {
                    if (!resendDisabled) {
                      e.currentTarget.style.background = 'var(--blue-h)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!resendDisabled) {
                      e.currentTarget.style.background = 'var(--blue)'
                    }
                  }}
                >
                  {isResending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </div>

              {success && (
                <p className="text-sm mt-4 text-center" style={{ color: 'var(--pos)' }}>{success}</p>
              )}

              {error && (
                <p className="text-sm mt-4 text-center" style={{ color: 'var(--neg)' }}>{error}</p>
              )}
            </div>
          )}

          {/* Back to login */}
          <div className="text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-2 font-semibold transition-all"
              style={{
                height: 44,
                padding: '0 24px',
                background: 'var(--blue)',
                color: 'white',
                borderRadius: 'var(--r-sm)',
                fontSize: '0.875rem',
                boxShadow: 'var(--sh-2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--blue-h)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--blue)'
                e.currentTarget.style.boxShadow = 'var(--sh-2)'
              }}
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  )
}
