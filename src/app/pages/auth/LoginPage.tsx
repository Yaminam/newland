import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/AuthContext'
import { loginSchema, type LoginFormData } from '@/app/lib/validation'
import { SEO } from '@/app/components/SEO'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

/* ── Shared styles ─────────────────────────────────────────────── */

const inputWrap: React.CSSProperties = {
  position: 'relative',
}
const inputClass = 'w-full h-12 pl-11 pr-4 text-[14px] rounded-xl border outline-none transition-all'
const inputBase: React.CSSProperties = {
  color: '#0F172A',
  background: '#F8FAFC',
  borderColor: '#E2E8F0',
  fontFamily: 'var(--font-body)',
}
const inputFocus = 'focus:border-[#2563EB] focus:ring-2 focus:ring-[rgba(37,99,235,0.10)] focus:bg-white'
const labelClass = 'block text-[13px] font-semibold mb-2'
const iconStyle: React.CSSProperties = { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94A3B8' }

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.5 29.3 3.5 24 3.5c-7.7 0-14.3 4.4-17.7 11.2z" />
    <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8L6 33.3c3.4 6.8 10 11.2 18 11.2z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z" />
  </svg>
)


/* ── Password Login ────────────────────────────────────────────── */

function PasswordLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const [showGoogleHint, setShowGoogleHint] = useState(false)

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setShowGoogleHint(false)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.'
      toast.error(msg)
      if (msg === 'Invalid email or password.') {
        setShowGoogleHint(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div>
        <label className={labelClass} style={{ color: '#334155' }}>Email Address</label>
        <div style={inputWrap}>
          <Mail style={{ ...iconStyle, ...(errors.email ? { color: '#DC2626' } : {}) }} />
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@company.co"
            className={`${inputClass} ${inputFocus}`}
            style={{ ...inputBase, borderColor: errors.email ? '#FCA5A5' : '#E2E8F0' }}
          />
        </div>
        {errors.email && <p className="text-[11px] mt-1.5" style={{ color: '#DC2626' }}>{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className={labelClass} style={{ color: '#334155' }}>Password</label>
        <div style={inputWrap}>
          <Lock style={{ ...iconStyle, ...(errors.password ? { color: '#DC2626' } : {}) }} />
          <input
            {...register('password')}
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={`${inputClass} ${inputFocus}`}
            style={{ ...inputBase, paddingRight: 48, borderColor: errors.password ? '#FCA5A5' : '#E2E8F0' }}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
          >
            {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>
        {errors.password && <p className="text-[11px] mt-1.5" style={{ color: '#DC2626' }}>{errors.password.message}</p>}
      </div>

      {/* Keep me logged in + Forgot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked style={{ accentColor: '#2563EB', width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>Keep me logged in</span>
        </label>
        <Link
          to="/auth/forgot-password"
          style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}
        >
          Forgot Password?
        </Link>
      </div>

      {/* Login button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] flex items-center justify-center gap-2 text-[15px] font-bold rounded-xl border-none transition-all"
        style={{
          background: '#0F172A',
          color: '#FFFFFF',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
          boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          'Login'
        )}
      </button>

      {showGoogleHint && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: '#1E40AF' }}>
            Signed up with Google? Use <strong>Continue with Google</strong> below — no password needed.
          </p>
        </div>
      )}
    </form>
  )
}

/* ── Login Page ────────────────────────────────────────────────── */

export function LoginPage() {
  const { loginWithGoogle, isAuthenticated, isLoading } = useAuth()
  const [gLoading, setGLoading] = useState(false)

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />

  const onGoogle = async () => {
    setGLoading(true)
    try {
      await loginWithGoogle()
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Google sign-in failed.'
      if (m !== 'Sign-in cancelled.') toast.error(m)
    } finally { setGLoading(false) }
  }

  return (
    <>
      <SEO title="Sign In" path="/auth/login" noindex />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--font-display)',
            margin: '0 0 6px',
          }}
        >
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          Sign in to continue where you left off
        </p>
      </div>

      <PasswordLogin />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
      </div>

      {/* Google login */}
      <button
        type="button"
        onClick={onGoogle}
        disabled={gLoading}
        className="w-full h-12 flex items-center justify-center gap-3 text-[14px] font-semibold rounded-xl border transition-all"
        style={{
          background: '#FFFFFF',
          color: '#0F172A',
          borderColor: '#E2E8F0',
          cursor: gLoading ? 'wait' : 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <GoogleIcon />
        {gLoading ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* Bottom link */}
      <p style={{ fontSize: 14, textAlign: 'center', marginTop: 28, color: '#64748B' }}>
        New to FounderCentral?{' '}
        <Link to="/auth/signup" style={{ fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
          Create Account
        </Link>
      </p>
    </>
  )
}
