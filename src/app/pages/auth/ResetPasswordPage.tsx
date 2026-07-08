import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { PASSWORD_REQUIRED_MESSAGE, getPasswordPolicyError } from '@/app/lib/validation'
import { SEO } from '@/app/components/SEO'

const inputClass = 'w-full h-12 pl-11 pr-12 text-[14px] rounded-xl border outline-none transition-all'
const inputBase: React.CSSProperties = {
  color: '#0F172A',
  background: '#F8FAFC',
  borderColor: '#E2E8F0',
  fontFamily: 'var(--font-body)',
}
const inputFocus = 'focus:border-[#2563EB] focus:ring-2 focus:ring-[rgba(37,99,235,0.10)] focus:bg-white'
const iconStyle: React.CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94A3B8' }

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) setHasRecoverySession(Boolean(session))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setHasRecoverySession(Boolean(session))
      }
      if (event === 'SIGNED_OUT') {
        setHasRecoverySession(false)
      }
    })

    const hasCode = new URLSearchParams(window.location.search).has('code')
    if (hasCode) {
      const timer = setTimeout(() => {
        if (isMounted) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) setHasRecoverySession(Boolean(session))
          })
        }
      }, 2000)
      return () => {
        isMounted = false
        subscription.unsubscribe()
        clearTimeout(timer)
      }
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasRecoverySession) {
      toast.error('This password reset link is invalid or has expired.')
      return
    }

    if (password !== confirm) {
      toast.error("Passwords don't match")
      return
    }

    const passwordError = getPasswordPolicyError(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await supabase.rpc('ensure_email_identity').then(undefined, (err: unknown) =>
        console.warn('[resetPassword] ensure_email_identity skipped:', err)
      )
      void supabase.functions.invoke('notify-self', {
        body: { type: 'password_changed' },
      }).then(undefined, (err: unknown) => console.warn('[resetPassword] notify-self skipped:', err))
      await supabase.auth.signOut()
      toast.success('Password updated successfully')
      navigate('/auth/login')
    } catch {
      toast.error('Failed to update password. Please request a new reset link and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmitDisabled = isLoading || !password || !confirm || hasRecoverySession !== true
  const hasMismatch = confirm.length > 0 && confirm !== password

  if (hasRecoverySession === false) {
    return (
      <>
        <SEO title="Reset Password" path="/auth/reset-password" noindex />
        <div>
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
              Reset link expired
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              This password reset link is invalid or has expired. Request a new one to continue.
            </p>
          </div>

          <Link
            to="/auth/forgot-password"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              padding: '0 28px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
            }}
          >
            Request a new reset link
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO title="Reset Password" path="/auth/reset-password" noindex />
      <div>
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
            Set new password
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={iconStyle} />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={e => setPassword(e.target.value)}
                placeholder="Use 8+ chars with upper, lower, number, symbol"
                className={`${inputClass} ${inputFocus}`}
                style={inputBase}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
              >
                {show ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
              {PASSWORD_REQUIRED_MESSAGE}
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ ...iconStyle, ...(hasMismatch ? { color: '#DC2626' } : {}) }} />
              <input
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                className={`${inputClass} ${inputFocus}`}
                style={{ ...inputBase, borderColor: hasMismatch ? '#FCA5A5' : '#E2E8F0', paddingRight: 16 }}
              />
            </div>
            {hasMismatch && (
              <p style={{ fontSize: 11, color: '#DC2626', marginTop: 6 }}>Passwords don't match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full h-[52px] flex items-center justify-center gap-2 text-[15px] font-bold rounded-xl border-none transition-all"
            style={{
              background: isSubmitDisabled ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              boxShadow: isSubmitDisabled ? 'none' : '0 2px 8px rgba(15,23,42,0.15)',
              letterSpacing: '-0.01em',
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Update password'}
          </button>
        </form>
      </div>
    </>
  )
}
