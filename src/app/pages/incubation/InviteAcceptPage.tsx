import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Mail,
  MapPin, Globe, Tag,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'

// ─── Page state machine ───────────────────────────────────────────────────────

type PageState = 'loading' | 'invalid' | 'ready' | 'email_sent' | 'accepting' | 'done' | 'error'

interface InviteDetails {
  company_name: string
  founder_email: string
  founder_name: string | null
  incubation_name: string
  incubation_type: string | null
  incubation_description: string | null
  incubation_website: string | null
  incubation_sectors: string[] | null
  incubation_city: string | null
  expires_at: string | null
}

// ─── Auth sub-tab ─────────────────────────────────────────────────────────────

type AuthTab = 'create' | 'signin'

// ─── Design helpers ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#4B5563' }}>
      {children}
    </label>
  )
}

function TextInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly,
  autoComplete,
  rightSlot,
}: {
  type?: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  readOnly?: boolean
  autoComplete?: string
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          background: readOnly ? '#F9FAFB' : '#FFFFFF',
          border: '1.5px solid #E5E7EB',
          color: '#111827',
          paddingRight: rightSlot ? 40 : undefined,
        }}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  )
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
      style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

function fmtExpiry(iso: string | null | undefined): string {
  if (!iso) return 'N/A'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Accept Invitation logic (shared) ────────────────────────────────────────

async function callAcceptInvitation(token: string): Promise<void> {
  const { error } = await supabase.rpc('accept_incubation_invitation', { invite_token: token })
  if (error) throw new Error(error.message || 'Failed to accept invitation')
}

// ─── Create Account Form ──────────────────────────────────────────────────────

function CreateAccountForm({
  invite,
  token,
  onEmailSent,
  onAccepted,
}: {
  invite: InviteDetails
  token: string
  onEmailSent: (email: string) => void
  onAccepted: () => void
}) {
  const [email] = useState(invite.founder_email)
  const [fullName, setFullName] = useState(invite.founder_name ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!fullName.trim()) { toast.error('Please enter your full name'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }

    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            first_name: fullName.trim().split(' ')[0] ?? '',
            last_name: fullName.trim().split(' ').slice(1).join(' ') ?? '',
          },
          emailRedirectTo: window.location.href,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // Auto-confirmed: isAuthenticated will become true only AFTER AuthContext's
      // ensureProfile completes (it's awaited before setUser). The autoAccept
      // effect in InviteAcceptPage then calls accept — profile is guaranteed
      // to exist, so no FK race condition.
      if (data.user && data.user.email_confirmed_at) {
        return
      }

      onEmailSent(email)
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Email</FieldLabel>
        <TextInput
          type="email"
          value={email}
          readOnly
          autoComplete="email"
        />
        <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>Pre-filled from your invitation</p>
      </div>

      <div>
        <FieldLabel>Full Name</FieldLabel>
        <TextInput
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
      </div>

      <div>
        <FieldLabel>Password <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(min 8 characters)</span></FieldLabel>
        <TextInput
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Choose a strong password"
          autoComplete="new-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <div>
        <FieldLabel>Confirm Password</FieldLabel>
        <TextInput
          type={showCpw ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowCpw(v => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <PrimaryButton onClick={submit} loading={submitting}>
        Create Account & Accept
      </PrimaryButton>
    </div>
  )
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

function SignInForm({
  invite,
  token,
  onAccepted,
}: {
  invite: InviteDetails
  token: string
  onAccepted: () => void
}) {
  const [email] = useState(invite.founder_email)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!password) { toast.error('Please enter your password'); return }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message || 'Invalid email or password')
        return
      }

      await callAcceptInvitation(token)
      onAccepted()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Email</FieldLabel>
        <TextInput
          type="email"
          value={email}
          readOnly
          autoComplete="email"
        />
      </div>

      <div>
        <FieldLabel>Password</FieldLabel>
        <TextInput
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your account password"
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <PrimaryButton onClick={submit} loading={submitting}>
        Sign In & Accept
      </PrimaryButton>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [pageState, setPageState] = useState<PageState>('loading')
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [authTab, setAuthTab] = useState<AuthTab>('create')
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  // ─── Load invitation on mount ───────────────────────────────────────────────

  useEffect(() => {
    if (!token || authLoading) return

    const load = async () => {
      setPageState('loading')
      try {
        const { data, error } = await supabase.rpc('get_incubation_invitation', { invite_token: token })
        if (error) throw error

        const rows = Array.isArray(data) ? data : data ? [data] : []
        if (rows.length === 0) {
          setPageState('invalid')
          return
        }

        const row = rows[0] as InviteDetails
        setInvite(row)
        setPageState('ready')
      } catch {
        setPageState('invalid')
      }
    }

    void load()
  }, [token, authLoading])

  // ─── Auto-accept when user becomes authenticated while on this page ──────────

  useEffect(() => {
    if (pageState !== 'ready' || !isAuthenticated || !token) return

    const autoAccept = async () => {
      setAccepting(true)
      try {
        await callAcceptInvitation(token)
        setPageState('done')
      } catch (err: unknown) {
        toast.error((err as Error).message ?? 'Failed to accept invitation')
        setPageState('error')
      } finally {
        setAccepting(false)
      }
    }

    void autoAccept()
  }, [isAuthenticated, pageState, token])

  // ─── Redirect after done ────────────────────────────────────────────────────

  useEffect(() => {
    if (pageState !== 'done') return
    const timer = setTimeout(() => { navigate('/onboarding', { state: { fromInvite: true } }) }, 2000)
    return () => clearTimeout(timer)
  }, [pageState, navigate])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleEmailSent = (email: string) => {
    setSentEmail(email)
    setPageState('email_sent')
  }

  const handleAccepted = () => {
    setPageState('done')
  }

  const handleManualAccept = async () => {
    if (!token) return
    setAccepting(true)
    try {
      await callAcceptInvitation(token)
      setPageState('done')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to accept invitation')
      setPageState('error')
    } finally {
      setAccepting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 40%, #0F172A 100%)',
      }}
    >
      <AnimatePresence mode="wait">
        {pageState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#A78BFA' }} />
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Loading your invitation…
            </p>
          </motion.div>
        )}

        {pageState === 'invalid' && (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            {/* Purple header */}
            <div
              className="px-6 py-8 flex flex-col items-center text-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              <AlertCircle className="w-10 h-10 mb-3" style={{ color: '#FCA5A5' }} />
              <h1 className="text-xl font-bold text-white">Invitation Not Found</h1>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm mb-2" style={{ color: '#374151' }}>
                This invitation link has expired, already been used, or does not exist.
              </p>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Please contact your incubation program admin to request a new invitation.
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Go to FounderCentral
              </a>
            </div>
          </motion.div>
        )}

        {pageState === 'email_sent' && sentEmail && (
          <motion.div
            key="email_sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            {/* Purple header */}
            <div
              className="px-6 py-8 flex flex-col items-center text-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Check your email</h1>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm mb-3" style={{ color: '#374151' }}>
                We sent a verification link to
              </p>
              <p className="text-sm font-bold mb-4" style={{ color: '#7C3AED' }}>{sentEmail}</p>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Click the link in that email to confirm your account and accept the invitation.
              </p>
              <div
                className="flex items-start gap-3 p-3 rounded-xl text-left"
                style={{ background: '#F5F3FF', border: '1px solid #EDE9FE' }}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#7C3AED' }} />
                <p className="text-[12px]" style={{ color: '#5B21B6' }}>
                  After verifying, return to this page to complete the process.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {pageState === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            <div
              className="px-6 py-10 flex flex-col items-center text-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <CheckCircle2 className="w-9 h-9 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">You're in!</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Redirecting to onboarding…
              </p>
              <Loader2 className="w-5 h-5 animate-spin mt-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
          </motion.div>
        )}

        {pageState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            <div
              className="px-6 py-8 flex flex-col items-center text-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
            >
              <AlertCircle className="w-10 h-10 mb-3" style={{ color: '#FCA5A5' }} />
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                We couldn't complete the acceptance process. Please try again or contact support.
              </p>
              <button
                onClick={() => setPageState('ready')}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {(pageState === 'ready' || pageState === 'accepting') && invite && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#FFFFFF', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}
          >
            {/* Purple gradient header */}
            <div
              className="px-6 pt-8 pb-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 55%, #7C3AED 100%)' }}
            >
              {/* Decorative circles */}
              <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.4)' }} />
              <div aria-hidden className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.6)' }} />

              {/* Platform label */}
              <div className="relative z-10 flex items-center gap-2 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Powered by
                </p>
                <span className="text-sm font-black text-white tracking-tight">FounderCentral</span>
              </div>

              {/* Incubation name + type badge */}
              <div className="relative z-10 mb-3">
                <h1 className="text-2xl font-extrabold text-white leading-tight mb-2">
                  {invite.incubation_name}
                </h1>
                {invite.incubation_type && (
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' }}
                  >
                    {invite.incubation_type.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Invite message */}
              <p className="relative z-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <span className="font-semibold text-white">{invite.incubation_name}</span> has personally
                invited <span className="font-semibold text-white">{invite.company_name}</span> to join their program.
              </p>

              {/* Meta chips: location + expiry */}
              <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4">
                {invite.incubation_city && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    <MapPin className="w-3 h-3" /> {invite.incubation_city}
                  </span>
                )}
                {invite.expires_at && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    <AlertCircle className="w-3 h-3" /> Expires {fmtExpiry(invite.expires_at)}
                  </span>
                )}
                {invite.incubation_website && (
                  <a
                    href={invite.incubation_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
                  >
                    <Globe className="w-3 h-3" />
                    {invite.incubation_website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </div>
            </div>

            {/* About the program */}
            {(invite.incubation_description || (invite.incubation_sectors && invite.incubation_sectors.length > 0)) && (
              <div className="px-6 pt-5 pb-1">
                {invite.incubation_description && (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>
                    {invite.incubation_description}
                  </p>
                )}
                {invite.incubation_sectors && invite.incubation_sectors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Tag className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#9CA3AF' }} />
                    {invite.incubation_sectors.slice(0, 6).map(s => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ borderBottom: '1px solid #F3F4F6', marginBottom: 0 }} />
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">
              {/* Already authenticated: show direct accept button */}
              {isAuthenticated ? (
                <div className="text-center">
                  <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                    You're signed in. Click below to accept the invitation and join{' '}
                    <span className="font-semibold" style={{ color: '#111827' }}>{invite.incubation_name}</span>.
                  </p>
                  <PrimaryButton onClick={handleManualAccept} loading={accepting}>
                    Accept Invitation
                  </PrimaryButton>
                </div>
              ) : (
                <>
                  {/* Auth tabs */}
                  <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#F3F4F6' }}>
                    {([
                      ['create', 'Create Account'],
                      ['signin', 'Already have an account'],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setAuthTab(key)}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: authTab === key ? '#FFFFFF' : 'transparent',
                          color: authTab === key ? '#7C3AED' : '#6B7280',
                          boxShadow: authTab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {authTab === 'create' ? (
                      <motion.div
                        key="create"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CreateAccountForm
                          invite={invite}
                          token={token!}
                          onEmailSent={handleEmailSent}
                          onAccepted={handleAccepted}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SignInForm
                          invite={invite}
                          token={token!}
                          onAccepted={handleAccepted}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 text-center">
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                By accepting, you agree to FounderCentral's{' '}
                <a href="/terms-of-service" className="underline" style={{ color: '#7C3AED' }}>Terms</a>{' '}
                &{' '}
                <a href="/privacy-policy" className="underline" style={{ color: '#7C3AED' }}>Privacy Policy</a>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
