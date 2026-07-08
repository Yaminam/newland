import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/AuthContext'
import { signupSchema, type SignupFormData } from '@/app/lib/validation'
import { SEO } from '@/app/components/SEO'
import {
  Eye, EyeOff, TrendingUp, Rocket, Building2,
  ArrowLeft, ArrowRight, CheckCircle, Search,
  MapPin, Briefcase, Sparkles, Mail, Lock, User,
  ShieldCheck, RefreshCw, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

/* ── Types ──────────────────────────────────────────────────────── */

type Role = 'investor' | 'founder' | 'incubation'
type Step =
  | 'role'
  | 'investor-details'   // name + email + password all at once
  | 'investor-matches'   // 0 / 1 / N directory profiles found
  | 'email-confirm'      // confirm which email gets the OTP
  | 'otp'               // enter 6-digit code
  | 'form'              // non-investor signup form

interface DirectoryProfile {
  id:               string
  first_name:       string
  last_name:        string | null
  firm_name:        string | null
  title:            string | null
  photo_url:        string | null
  email:            string | null
  firm_focus:       string | null
  firm_stages:      string | null
  location_city:    string | null
  location_country: string | null
  firm_description: string | null
  linkedin_url:     string | null
}

interface InvestorDetails {
  firstName: string
  lastName:  string | undefined
  email:     string
  password:  string
}

/* ── Animation variants ─────────────────────────────────────────── */

const slideIn = {
  initial:   { opacity: 0, x: 40 },
  animate:   { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as any } },
  exit:      { opacity: 0, x: -30, transition: { duration: 0.2 } },
}
const slideBack = {
  initial:   { opacity: 0, x: -40 },
  animate:   { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as any } },
  exit:      { opacity: 0, x: 30, transition: { duration: 0.2 } },
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function maskEmail(email: string): string {
  const at    = email.indexOf('@')
  if (at < 0) return email
  const local  = email.slice(0, at)
  const domain = email.slice(at + 1)
  const shown  = local.slice(0, 2)
  const stars  = '*'.repeat(Math.max(4, local.length - 2))
  return `${shown}${stars}@${domain}`
}

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5 44.5 35.3 44.5 24c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 5.5 29.3 3.5 24 3.5c-7.7 0-14.3 4.4-17.7 11.2z"/>
    <path fill="#4CAF50" d="M24 44.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8L6 33.3c3.4 6.8 10 11.2 18 11.2z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
)

function BackBtn({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-[12px] font-medium mb-6 transition-colors hover:opacity-70"
      style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <ArrowLeft className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const colors = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#22C55E']
  const labels = ['Weak', 'Fair', 'Okay', 'Good', 'Strong']
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : '#E2E8F0' }} />
        ))}
      </div>
      <p className="text-[10px] font-medium" style={{ color: colors[score - 1] }}>{labels[score - 1]}</p>
    </div>
  )
}

function Field({
  label, icon: Icon, error, suffix, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label:   string
  icon:    React.ElementType
  error?:  string
  suffix?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11.5px] font-semibold mb-1.5" style={{ color: '#475569' }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: error ? '#EF4444' : '#CBD5E1' }} />
        <input {...props}
          className="w-full h-10 pl-9 text-[13px] rounded-xl border outline-none transition-all"
          style={{
            paddingRight: suffix ? 40 : 12,
            background:   '#F8FAFC',
            borderColor:  error ? '#FCA5A5' : '#E2E8F0',
            color:        '#0F172A',
            fontFamily:   'var(--font-body)',
          }}
          onFocus={e  => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)' }}
          onBlur={e   => { e.currentTarget.style.borderColor = error ? '#FCA5A5' : '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none' }}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {error && <p className="text-[10.5px] mt-1 font-medium" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  )
}

/* ── Profile mini-card ───────────────────────────────────────────── */

function ProfileCard({ profile, action }: { profile: DirectoryProfile; action: React.ReactNode }) {
  const focusTags = (profile.firm_focus  ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
  const stageTags = (profile.firm_stages ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 2)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E2E8F0' }}>
      <div className="h-1" style={{ background: 'linear-gradient(90deg,#2563EB 0%,#7C3AED 100%)' }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: '#EFF6FF', color: '#2563EB' }}>
              {(profile.first_name[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-bold truncate" style={{ color: '#0F172A' }}>
              {profile.first_name} {profile.last_name ?? ''}
            </p>
            {profile.title && <p className="text-[11px] truncate" style={{ color: '#64748B' }}>{profile.title}</p>}
          </div>
        </div>

        {profile.firm_name && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Briefcase className="w-3 h-3 shrink-0" style={{ color: '#CBD5E1' }} />
            <span className="text-[11.5px] font-semibold truncate" style={{ color: '#334155' }}>{profile.firm_name}</span>
          </div>
        )}
        {(profile.location_city || profile.location_country) && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <MapPin className="w-3 h-3 shrink-0" style={{ color: '#CBD5E1' }} />
            <span className="text-[11px]" style={{ color: '#94A3B8' }}>
              {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {(focusTags.length > 0 || stageTags.length > 0) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {focusTags.map(t => (
              <span key={t} className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>{t}</span>
            ))}
            {stageTags.map(t => (
              <span key={t} className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>{t}</span>
            ))}
          </div>
        )}
        {action}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 1 — Role Selection
══════════════════════════════════════════════════════════════════ */

const ROLES: {
  id:    Role
  label: string
  desc:  string
  sub:   string
  icon:  React.ElementType
  color: string
  bg:    string
  tag?:  string
}[] = [
  {
    id: 'founder', label: 'Founder', desc: 'Build & Fundraise',
    sub: 'Browse investors, manage intros, track your raise',
    icon: Rocket, color: '#2563EB', bg: '#EFF6FF',
  },
  {
    id: 'investor', label: 'Investor', desc: 'Discover & Invest',
    sub: 'Access curated deal flow, warm intros & pipeline tools',
    icon: TrendingUp, color: '#0EA5E9', bg: '#F0F9FF',
  },
  {
    id: 'incubation', label: 'Incubation', desc: 'Manage Your Cohort',
    sub: 'Run your programme, manage startups & investor relations',
    icon: Building2, color: '#7C3AED', bg: '#F5F3FF', tag: 'New',
  },
]

function RoleStep({ onSelect }: { onSelect: (r: Role) => void }) {
  const [hover, setHover] = useState<Role | null>(null)
  return (
    <motion.div key="role" {...slideIn}>
      <div className="mb-7">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#94A3B8' }}>Get Started</p>
        <h1 className="text-[26px] font-extrabold leading-tight"
          style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          I want to join as a...
        </h1>
        <p className="text-[13px] mt-1.5" style={{ color: '#94A3B8' }}>Select your role to personalise your experience</p>
      </div>

      <div className="space-y-3">
        {ROLES.map(role => {
          const Icon    = role.icon
          const isHover = hover === role.id
          return (
            <button key={role.id} type="button"
              onClick={() => onSelect(role.id)}
              onMouseEnter={() => setHover(role.id)}
              onMouseLeave={() => setHover(null)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200"
              style={{
                background: isHover ? role.bg : '#FAFAFA',
                border:     `2px solid ${isHover ? role.color : '#F1F5F9'}`,
                cursor:     'pointer',
                transform:  isHover ? 'translateY(-1px)' : 'none',
                boxShadow:  isHover ? `0 4px 16px ${role.color}18` : 'none',
              }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                style={{ background: isHover ? role.color : '#F1F5F9', boxShadow: isHover ? `0 4px 12px ${role.color}40` : 'none' }}>
                <Icon className="w-5 h-5 transition-colors" style={{ color: isHover ? '#fff' : '#94A3B8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[14px] font-bold" style={{ color: isHover ? role.color : '#1E293B' }}>{role.label}</span>
                  <span className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>· {role.desc}</span>
                  {role.tag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: '#EDE9FE', color: '#7C3AED', letterSpacing: '0.05em' }}>{role.tag}</span>
                  )}
                </div>
                <p className="text-[11.5px]" style={{ color: '#94A3B8' }}>{role.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 transition-all duration-200"
                style={{ color: isHover ? role.color : '#CBD5E1', transform: isHover ? 'translateX(2px)' : 'none' }} />
            </button>
          )
        })}
      </div>

      <p className="text-center text-[12px] mt-6" style={{ color: '#CBD5E1' }}>
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold transition-colors" style={{ color: '#2563EB', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 2 — Investor Details (name + email + password + search)
══════════════════════════════════════════════════════════════════ */

interface InvestorDetailsForm {
  firstName: string
  lastName:  string | undefined
  email:     string
  password:  string
  confirmPassword: string
}

function InvestorDetailsStep({
  onResults, onBack,
}: {
  onResults: (details: InvestorDetails, matches: DirectoryProfile[]) => void
  onBack:    () => void
}) {
  const [showPw,    setShowPw]    = useState(false)
  const [showCpw,   setShowCpw]   = useState(false)
  const [searching, setSearching] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<InvestorDetailsForm>({
    resolver: zodResolver(signupSchema) as any,
  })
  const pw = watch('password', '')

  const onSubmit = async (data: InvestorDetailsForm) => {
    const fn = data.firstName.trim()
    const ln = (data.lastName ?? '').trim()
    const em = data.email.trim().toLowerCase()

    setSearching(true)
    try {
      // Search by exact email OR exact first+last name (case-insensitive)
      const DIR_FIELDS = 'id,first_name,last_name,firm_name,title,photo_url,email,firm_focus,firm_stages,location_city,location_country,firm_description,linkedin_url'
      const [emailRes, nameRes] = await Promise.all([
        supabase
          .from('investor_directory')
          .select(DIR_FIELDS)
          .eq('status', 'approved')
          .ilike('email', em)
          .limit(3),
        supabase
          .from('investor_directory')
          .select(DIR_FIELDS)
          .eq('status', 'approved')
          .ilike('first_name', fn)
          .ilike('last_name', ln)
          .limit(5),
      ])

      // Deduplicate by id
      const seen    = new Set<string>()
      const combined: DirectoryProfile[] = []
      for (const row of [...(emailRes.data ?? []), ...(nameRes.data ?? [])]) {
        if (!seen.has(row.id)) { seen.add(row.id); combined.push(row as DirectoryProfile) }
      }

      onResults({ firstName: fn, lastName: ln, email: em, password: data.password }, combined)
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <motion.div key="investor-details" {...slideIn}>
      <BackBtn onClick={onBack} label="Change role" />

      <div className="mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#EFF6FF' }}>
          <Search className="w-5 h-5" style={{ color: '#2563EB' }} />
        </div>
        <h2 className="text-[22px] font-extrabold" style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Create your investor account
        </h2>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#94A3B8' }}>
          We'll check if your profile is already in our investor database.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="First name" icon={User} type="text" autoComplete="given-name"
            placeholder="Jane" error={errors.firstName?.message} {...register('firstName')} />
          <Field label="Last name"  icon={User} type="text" autoComplete="family-name"
            placeholder="Doe" {...register('lastName')} />
        </div>

        <Field label="Work email" icon={Mail} type="email" autoComplete="email"
          placeholder="you@fund.co" error={errors.email?.message} {...register('email')} />

        <div>
          <Field label="Password" icon={Lock}
            type={showPw ? 'text' : 'password'} autoComplete="new-password"
            placeholder="Min. 8 characters" error={errors.password?.message}
            suffix={
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0 }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')} />
          <PasswordStrength password={pw} />
        </div>

        <Field label="Confirm password" icon={Lock}
          type={showCpw ? 'text' : 'password'} autoComplete="new-password"
          placeholder="Re-enter password" error={errors.confirmPassword?.message}
          suffix={
            <button type="button" onClick={() => setShowCpw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0 }}>
              {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('confirmPassword')} />

        <button type="submit" disabled={searching}
          className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-xl transition-all mt-1"
          style={{
            background: '#1E3A5F', color: '#fff', border: 'none',
            cursor:      searching ? 'wait' : 'pointer',
            opacity:     searching ? 0.7 : 1,
            boxShadow:   '0 2px 10px rgba(15,23,42,0.12)',
            letterSpacing: '-0.01em',
          }}>
          {searching
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching database…</>
            : <><Search className="w-4 h-4" />Continue</>
          }
        </button>
      </form>

      <p className="text-center text-[11.5px] mt-4" style={{ color: '#CBD5E1' }}>
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold" style={{ color: '#2563EB', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 3 — Investor Matches (0 / 1 / N)
══════════════════════════════════════════════════════════════════ */

function InvestorMatchesStep({
  details, matches, onClaim, onSkip, onBack,
}: {
  details:  InvestorDetails
  matches:  DirectoryProfile[]
  onClaim:  (profile: DirectoryProfile) => void
  onSkip:   () => void
  onBack:   () => void
}) {
  // No matches
  if (matches.length === 0) {
    return (
      <motion.div key="investor-matches-0" {...slideIn}>
        <BackBtn onClick={onBack} label="Edit details" />

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 w-fit"
          style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
          <span className="text-[12px] font-bold" style={{ color: '#92400E' }}>No existing profile found</span>
        </div>

        <h2 className="text-[21px] font-extrabold mb-1.5"
          style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Let's create your profile
        </h2>
        <p className="text-[12.5px] mb-6" style={{ color: '#94A3B8' }}>
          We didn't find an existing investor profile for <strong>{details.firstName} {details.lastName}</strong>. We'll create a fresh account for you.
        </p>

        <button type="button" onClick={onSkip}
          className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-xl transition-all"
          style={{ background: '#1E3A5F', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
          <Rocket className="w-4 h-4" />
          Create Investor Account
        </button>
      </motion.div>
    )
  }

  // Single match
  if (matches.length === 1) {
    return (
      <motion.div key="investor-matches-1" {...slideIn}>
        <BackBtn onClick={onBack} label="Edit details" />

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 w-fit"
          style={{ background: '#D1FAE5', border: '1px solid #A7F3D0' }}>
          <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
          <span className="text-[12px] font-bold" style={{ color: '#065F46' }}>Profile found in our database!</span>
        </div>

        <h2 className="text-[21px] font-extrabold mb-1"
          style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Is this your profile?
        </h2>
        <p className="text-[12.5px] mb-4" style={{ color: '#94A3B8' }}>
          Claim it to join with your data already filled in.
        </p>

        <ProfileCard
          profile={matches[0]}
          action={
            <div className="space-y-2">
              <button type="button" onClick={() => onClaim(matches[0])}
                className="w-full h-10 flex items-center justify-center gap-2 text-[12.5px] font-bold rounded-xl transition-all hover:opacity-90"
                style={{ background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Sparkles className="w-3.5 h-3.5" />
                Yes — Claim My Profile
              </button>
              <button type="button" onClick={onSkip}
                className="w-full h-9 flex items-center justify-center text-[12px] font-medium rounded-xl transition-all"
                style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}>
                Not me — sign up fresh
              </button>
            </div>
          }
        />
      </motion.div>
    )
  }

  // Multiple matches
  return (
    <motion.div key="investor-matches-n" {...slideIn}>
      <BackBtn onClick={onBack} label="Edit details" />

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 w-fit"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <Search className="w-4 h-4" style={{ color: '#2563EB' }} />
        <span className="text-[12px] font-bold" style={{ color: '#1E40AF' }}>
          {matches.length} profiles found — which one is you?
        </span>
      </div>

      <h2 className="text-[21px] font-extrabold mb-1"
        style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        Select your profile
      </h2>
      <p className="text-[12.5px] mb-4" style={{ color: '#94A3B8' }}>
        We found multiple investors matching your details. Pick yours.
      </p>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5">
        {matches.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            action={
              <button type="button" onClick={() => onClaim(profile)}
                className="w-full h-9 flex items-center justify-center gap-2 text-[12px] font-bold rounded-xl transition-all hover:opacity-90"
                style={{ background: '#EFF6FF', color: '#2563EB', border: '1.5px solid #BFDBFE', cursor: 'pointer' }}>
                <CheckCircle className="w-3.5 h-3.5" />
                This is me →
              </button>
            }
          />
        ))}
      </div>

      <button type="button" onClick={onSkip}
        className="w-full h-10 flex items-center justify-center text-[12.5px] font-medium rounded-xl transition-all mt-4"
        style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}>
        None of these — sign up fresh
      </button>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 4 — Email Confirmation (which email gets the OTP)
══════════════════════════════════════════════════════════════════ */

function EmailConfirmStep({
  profile, enteredEmail, onSent, onSkip, onBack,
}: {
  profile:      DirectoryProfile
  enteredEmail: string
  onSent:       (verifyEmail: string, masked: string, isMismatch: boolean) => void
  onSkip:       () => void
  onBack:       () => void
}) {
  const profileEmail  = profile.email?.trim().toLowerCase() ?? null
  const emailsMatch   = !!profileEmail && profileEmail === enteredEmail.toLowerCase()
  const hasProfileEmail = !!profileEmail

  // Which email to send OTP to — default: profile email (proves ownership)
  // If no profile email, fall back to entered email
  const [useProfileEmail, setUseProfileEmail] = useState(hasProfileEmail)
  const [sending, setSending] = useState(false)

  const targetEmail = useProfileEmail && profileEmail ? profileEmail : enteredEmail
  const isMismatch  = !!profileEmail && !emailsMatch && !useProfileEmail

  async function send() {
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-claim-otp', {
        body: { email: targetEmail, firstName: profile.first_name },
      })
      if (error) { toast.error(error.message ?? 'Failed to send code'); return }
      onSent(targetEmail, (data as { maskedEmail?: string }).maskedEmail ?? maskEmail(targetEmail), isMismatch)
    } catch {
      toast.error('Failed to send code. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div key="email-confirm" {...slideIn}>
      <BackBtn onClick={onBack} label="Back" />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#EFF6FF' }}>
        <ShieldCheck className="w-5 h-5" style={{ color: '#2563EB' }} />
      </div>

      <h2 className="text-[22px] font-extrabold mb-1"
        style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        Verify your identity
      </h2>
      <p className="text-[13px] mt-1.5 mb-5 leading-relaxed" style={{ color: '#94A3B8' }}>
        We'll send a 6-digit code to confirm you're the owner of this profile.
      </p>

      {/* Case 1: no email mismatch (or no profile email) — just show the email */}
      {(emailsMatch || !hasProfileEmail) && (
        <div className="rounded-xl p-3.5 mb-5 flex items-center gap-3"
          style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
          <Mail className="w-4 h-4 shrink-0" style={{ color: '#94A3B8' }} />
          <div>
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#94A3B8' }}>
              {hasProfileEmail ? 'Profile email' : 'Your email'}
            </p>
            <p className="text-[13.5px] font-bold" style={{ color: '#0F172A' }}>
              {maskEmail(targetEmail)}
            </p>
          </div>
        </div>
      )}

      {/* Case 2: email mismatch — let user pick */}
      {!emailsMatch && hasProfileEmail && (
        <div className="space-y-2 mb-5">
          <p className="text-[11.5px] font-semibold mb-2" style={{ color: '#475569' }}>
            We found two email addresses. Which would you like to verify?
          </p>

          {/* Profile email option */}
          <button type="button"
            onClick={() => setUseProfileEmail(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{
              background:  useProfileEmail ? '#EFF6FF' : '#F8FAFC',
              border:      `1.5px solid ${useProfileEmail ? '#2563EB' : '#E2E8F0'}`,
              cursor:      'pointer',
            }}>
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: useProfileEmail ? '#2563EB' : '#CBD5E1' }}>
              {useProfileEmail && <div className="w-2 h-2 rounded-full" style={{ background: '#2563EB' }} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Profile email</p>
              <p className="text-[13px] font-bold truncate" style={{ color: '#0F172A' }}>{maskEmail(profileEmail!)}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: '#D1FAE5', color: '#059669' }}>Recommended</span>
          </button>

          {/* Entered email option */}
          <button type="button"
            onClick={() => setUseProfileEmail(false)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{
              background: !useProfileEmail ? '#EFF6FF' : '#F8FAFC',
              border:     `1.5px solid ${!useProfileEmail ? '#2563EB' : '#E2E8F0'}`,
              cursor:     'pointer',
            }}>
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={{ borderColor: !useProfileEmail ? '#2563EB' : '#CBD5E1' }}>
              {!useProfileEmail && <div className="w-2 h-2 rounded-full" style={{ background: '#2563EB' }} />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Your email</p>
              <p className="text-[13px] font-bold truncate" style={{ color: '#0F172A' }}>{maskEmail(enteredEmail)}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: '#FEF3C7', color: '#D97706' }}>Flagged for review</span>
          </button>

          {!useProfileEmail && (
            <p className="text-[10.5px] px-1" style={{ color: '#F59E0B' }}>
              Our team will review the email mismatch. Your profile will still be pre-filled.
            </p>
          )}
        </div>
      )}

      <button type="button" onClick={send} disabled={sending}
        className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-xl transition-all"
        style={{
          background: '#2563EB', color: '#fff', border: 'none',
          cursor:     sending ? 'wait' : 'pointer',
          opacity:    sending ? 0.7 : 1,
          boxShadow:  '0 2px 10px rgba(37,99,235,0.20)',
          letterSpacing: '-0.01em',
        }}>
        {sending
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending code…</>
          : <><Mail className="w-4 h-4" />Send Verification Code</>
        }
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
        <span className="text-[11px]" style={{ color: '#CBD5E1' }}>or</span>
        <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
      </div>

      <button type="button" onClick={onSkip}
        className="w-full h-10 flex items-center justify-center text-[12.5px] font-semibold rounded-xl transition-all"
        style={{ background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}>
        Skip verification — sign up fresh
      </button>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP 5 — OTP Entry
══════════════════════════════════════════════════════════════════ */

function OtpStep({
  maskedEmail, verifyEmail, onVerified, onBack,
}: {
  maskedEmail: string
  verifyEmail: string
  onVerified:  () => void
  onBack:      () => void
}) {
  const [digits,    setDigits]    = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [resending, setResending] = useState(false)
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null))

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const code = digits.join('')

  const verify = useCallback(async (codeToCheck = code) => {
    if (codeToCheck.length < 6) return
    setVerifying(true)
    const { data: valid, error } = await supabase.rpc('verify_claim_otp', {
      p_email: verifyEmail,
      p_code:  codeToCheck,
    })
    setVerifying(false)
    if (error || !valid) {
      toast.error('Invalid or expired code. Please try again.')
      setDigits(['', '', '', '', '', ''])
      refs[0].current?.focus()
      return
    }
    onVerified()
  }, [code, verifyEmail, onVerified])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[idx]   = digit
    setDigits(next)
    if (digit && idx < 5) refs[idx + 1].current?.focus()
    const filled = next.join('')
    if (filled.length === 6) verify(filled)
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs[idx - 1].current?.focus()
    if (e.key === 'ArrowRight' && idx < 5) refs[idx + 1].current?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    refs[focusIdx].current?.focus()
    if (pasted.length === 6) verify(pasted)
  }

  async function resend() {
    setResending(true)
    try {
      const { error } = await supabase.functions.invoke('send-claim-otp', {
        body: { email: verifyEmail },
      })
      if (error) { toast.error(error.message ?? 'Failed to resend'); return }
      setDigits(['', '', '', '', '', ''])
      setCountdown(60)
      refs[0].current?.focus()
      toast.success('New code sent')
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setResending(false)
    }
  }

  return (
    <motion.div key="otp" {...slideIn}>
      <BackBtn onClick={onBack} label="Back" />

      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#EFF6FF' }}>
        <Mail className="w-5 h-5" style={{ color: '#2563EB' }} />
      </div>

      <h2 className="text-[22px] font-extrabold mb-1"
        style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        Check your inbox
      </h2>
      <p className="text-[13px] mt-1.5 mb-6 leading-relaxed" style={{ color: '#94A3B8' }}>
        Enter the 6-digit code sent to <span className="font-semibold" style={{ color: '#0F172A' }}>{maskedEmail}</span>
      </p>

      {/* OTP boxes */}
      <div className="flex items-center justify-between gap-2 mb-6" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            autoFocus={i === 0}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="flex-1 text-center text-[22px] font-extrabold rounded-2xl outline-none transition-all"
            style={{
              height:      56,
              maxWidth:    52,
              background:  d ? '#EFF6FF' : '#F8FAFC',
              borderWidth:  2,
              borderStyle: 'solid',
              borderColor:  d ? '#2563EB' : '#E2E8F0',
              color:        '#0F172A',
              caretColor:   '#2563EB',
              boxShadow:    d ? '0 0 0 3px rgba(37,99,235,0.10)' : 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10)' }}
            onBlur={e  => { if (!d) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' } }}
          />
        ))}
      </div>

      <button type="button" onClick={() => verify()}
        disabled={code.length < 6 || verifying}
        className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-xl transition-all mb-4"
        style={{
          background: code.length === 6 ? '#2563EB' : '#E2E8F0',
          color:      code.length === 6 ? '#fff'    : '#94A3B8',
          border:     'none',
          cursor:     code.length < 6 || verifying ? 'not-allowed' : 'pointer',
          opacity:    verifying ? 0.7 : 1,
          boxShadow:  code.length === 6 ? '0 2px 10px rgba(37,99,235,0.20)' : 'none',
          transition: 'all 0.2s ease',
          letterSpacing: '-0.01em',
        }}>
        {verifying
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
          : <><ShieldCheck className="w-4 h-4" />Verify &amp; Claim Profile</>
        }
      </button>

      {/* Resend */}
      <div className="flex items-center justify-center gap-2">
        {countdown > 0 ? (
          <p className="text-[12px]" style={{ color: '#CBD5E1' }}>
            Resend code in <span style={{ color: '#64748B', fontWeight: 600 }}>0:{String(countdown).padStart(2, '0')}</span>
          </p>
        ) : (
          <button type="button" onClick={resend} disabled={resending}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
            style={{ color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: resending ? 0.6 : 1 }}>
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   STEP — Generic Signup Form (founder / incubation)
══════════════════════════════════════════════════════════════════ */

function SignupFormStep({
  role, onBack, onGoogle, gLoading,
}: {
  role:     Role
  onBack:   () => void
  onGoogle: () => void
  gLoading: boolean
}) {
  const { register: authRegister } = useAuth()
  const navigate   = useNavigate()
  const [showPw,   setShowPw]   = useState(false)
  const [showCpw,  setShowCpw]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema) as any,
  })
  const pw         = watch('password', '')
  const roleLabel  = role === 'founder' ? 'Founder' : 'Incubation'

  const onSubmit = async (data: SignupFormData & Record<string, unknown>) => {
    setLoading(true)
    try {
      localStorage.setItem('cc:pendingRole', role)
      const result = await authRegister(
        data.email, data.password,
        data.firstName.trim(), (data.lastName ?? '').trim(), '',
      )
      if (result.requiresEmailVerification) {
        navigate('/auth/verify-email', { state: { email: result.email } })
        return
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div key="form" {...slideIn}>
      <BackBtn onClick={onBack} label="Change role" />

      <div className="mb-5">
        <h2 className="text-[22px] font-extrabold" style={{ color: '#0F172A', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Create your account
        </h2>
        <p className="text-[12.5px] mt-1" style={{ color: '#94A3B8' }}>
          Signing up as a <span className="font-semibold" style={{ color: '#2563EB' }}>{roleLabel}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="First name" icon={User} type="text" autoComplete="given-name"
            placeholder="Jane" error={errors.firstName?.message} {...register('firstName')} />
          <Field label="Last name"  icon={User} type="text" autoComplete="family-name"
            placeholder="Doe" {...register('lastName')} />
        </div>
        <Field label="Email" icon={Mail} type="email" autoComplete="email"
          placeholder={role === 'founder' ? 'you@startup.co' : 'admin@org.co'}
          error={errors.email?.message} {...register('email')} />
        <div>
          <Field label="Password" icon={Lock}
            type={showPw ? 'text' : 'password'} autoComplete="new-password"
            placeholder="Min. 8 characters" error={errors.password?.message}
            suffix={
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0 }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')} />
          <PasswordStrength password={pw} />
        </div>
        <Field label="Confirm password" icon={Lock}
          type={showCpw ? 'text' : 'password'} autoComplete="new-password"
          placeholder="Re-enter password" error={errors.confirmPassword?.message}
          suffix={
            <button type="button" onClick={() => setShowCpw(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0 }}>
              {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('confirmPassword')} />

        <button type="submit" disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-xl transition-all mt-1"
          style={{
            background: '#1E3A5F', color: '#fff', border: 'none',
            cursor:     loading ? 'wait' : 'pointer',
            opacity:    loading ? 0.7 : 1,
            boxShadow:  '0 2px 10px rgba(15,23,42,0.12)',
            letterSpacing: '-0.01em',
          }}>
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : `Create ${roleLabel} Account`
          }
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
        <span className="text-[11px]" style={{ color: '#CBD5E1' }}>or</span>
        <div className="flex-1 h-px" style={{ background: '#F1F5F9' }} />
      </div>

      <button type="button" onClick={onGoogle} disabled={gLoading}
        className="w-full h-10 flex items-center justify-center gap-2.5 text-[13px] font-semibold rounded-xl transition-all"
        style={{ background: '#fff', color: '#1E293B', border: '1.5px solid #E2E8F0', cursor: gLoading ? 'wait' : 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.10)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}>
        <GoogleIcon />
        {gLoading ? 'Connecting…' : 'Continue with Google'}
      </button>

      <p className="text-center text-[11.5px] mt-4" style={{ color: '#CBD5E1' }}>
        Already have an account?{' '}
        <Link to="/auth/login" className="font-semibold" style={{ color: '#2563EB', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   MAIN — Signup Page
══════════════════════════════════════════════════════════════════ */

export function SignupPage() {
  const { loginWithGoogle, register: registerUser, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  const [step,          setStep]          = useState<Step>('role')
  const [direction,     setDirection]     = useState<'forward' | 'back'>('forward')
  const [role,          setRole]          = useState<Role | null>(null)
  const [details,       setDetails]       = useState<InvestorDetails | null>(null)
  const [matches,       setMatches]       = useState<DirectoryProfile[]>([])
  const [claimProfile,  setClaimProfile]  = useState<DirectoryProfile | null>(null)
  const [verifyEmail,   setVerifyEmail]   = useState('')
  const [maskedEmail,   setMaskedEmail]   = useState('')
  const [emailMismatch, setEmailMismatch] = useState(false)
  const [gLoading,      setGLoading]      = useState(false)

  // CRO: ?role=founder|investor|incubation pre-selects the role and skips step 1
  const [searchParams] = useSearchParams()
  const didPrefill = useRef(false)
  useEffect(() => {
    if (didPrefill.current) return
    const r = searchParams.get('role')
    if (r === 'founder' || r === 'investor' || r === 'incubation') {
      didPrefill.current = true
      setRole(r)
      setStep(r === 'investor' ? 'investor-details' : 'form')
    }
  }, [searchParams])

  if (!isLoading && isAuthenticated) return <Navigate to="/dashboard" replace />

  const go = (next: Step, dir: 'forward' | 'back' = 'forward') => {
    setDirection(dir)
    setStep(next)
  }

  /* ── Role selected ──────────────────────────────────────────── */
  const handleRoleSelect = (r: Role) => {
    setRole(r)
    go(r === 'investor' ? 'investor-details' : 'form')
  }

  /* ── Investor details submitted → search done ───────────────── */
  const handleSearchResults = (det: InvestorDetails, found: DirectoryProfile[]) => {
    setDetails(det)
    setMatches(found)
    go('investor-matches')
  }

  /* ── User claims a profile ───────────────────────────────────── */
  const handleClaim = (profile: DirectoryProfile) => {
    setClaimProfile(profile)
    if (profile.email) {
      go('email-confirm')
    } else {
      // No directory email — skip OTP, create account + claim directly
      createInvestorAccount(profile, false)
    }
  }

  /* ── Skip claim → create account fresh ──────────────────────── */
  const handleSkipClaim = () => {
    setClaimProfile(null)
    if (details) createInvestorAccount(null, false)
  }

  /* ── OTP sent successfully ───────────────────────────────────── */
  const handleOtpSent = (email: string, masked: string, mismatch: boolean) => {
    setVerifyEmail(email)
    setMaskedEmail(masked)
    setEmailMismatch(mismatch)
    go('otp')
  }

  /* ── OTP verified → create account + claim ───────────────────── */
  const handleOtpVerified = () => {
    if (claimProfile) createInvestorAccount(claimProfile, emailMismatch)
  }

  /* ── Core account creation ───────────────────────────────────── */
  const createInvestorAccount = async (
    profileToClaim: DirectoryProfile | null,
    mismatch: boolean,
  ) => {
    if (!details) return
    try {
      localStorage.setItem('cc:pendingRole', 'investor')
      if (profileToClaim) localStorage.setItem('cc:claimDirectoryId', profileToClaim.id)

      const result = await registerUser(
        details.email, details.password,
        details.firstName, details.lastName ?? '', '',
      )

      if (profileToClaim && !result.requiresEmailVerification) {
        const { error: claimErr } = await supabase.rpc(
          'claim_investor_directory_profile',
          { p_profile_id: profileToClaim.id, p_email_mismatch: mismatch },
        )
        if (!claimErr) toast.success('Investor profile claimed and pre-filled!')
      }

      if (result.requiresEmailVerification) {
        navigate('/auth/verify-email', { state: { email: result.email } })
        return
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  /* ── Google OAuth ────────────────────────────────────────────── */
  const onGoogle = async () => {
    if (!role) return
    setGLoading(true)
    try {
      localStorage.setItem('cc:pendingRole', role)
      await loginWithGoogle()
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Google sign-in failed.'
      if (m !== 'Sign-in cancelled.') toast.error(m)
    } finally { setGLoading(false) }
  }

  /* ── Back handlers ───────────────────────────────────────────── */
  const backMap: Partial<Record<Step, () => void>> = {
    'investor-details': () => { setRole(null); go('role', 'back') },
    'investor-matches': () => go('investor-details', 'back'),
    'email-confirm':    () => go('investor-matches', 'back'),
    'otp':              () => go('email-confirm', 'back'),
    'form':             () => { setRole(null); go('role', 'back') },
  }

  const variants = direction === 'forward' ? slideIn : slideBack
  void variants // used via spread below

  return (
    <>
      <SEO title="Sign Up" path="/auth/signup" noindex />
      <div style={{ width: '100%' }}>
        <AnimatePresence mode="wait" custom={direction}>

          {step === 'role' && (
            <RoleStep key="role" onSelect={handleRoleSelect} />
          )}

          {step === 'investor-details' && (
            <InvestorDetailsStep
              key="investor-details"
              onResults={handleSearchResults}
              onBack={backMap['investor-details']!}
            />
          )}

          {step === 'investor-matches' && details && (
            <InvestorMatchesStep
              key="investor-matches"
              details={details}
              matches={matches}
              onClaim={handleClaim}
              onSkip={handleSkipClaim}
              onBack={backMap['investor-matches']!}
            />
          )}

          {step === 'email-confirm' && claimProfile && details && (
            <EmailConfirmStep
              key="email-confirm"
              profile={claimProfile}
              enteredEmail={details.email}
              onSent={handleOtpSent}
              onSkip={handleSkipClaim}
              onBack={backMap['email-confirm']!}
            />
          )}

          {step === 'otp' && (
            <OtpStep
              key="otp"
              maskedEmail={maskedEmail}
              verifyEmail={verifyEmail}
              onVerified={handleOtpVerified}
              onBack={backMap['otp']!}
            />
          )}

          {step === 'form' && role && role !== 'investor' && (
            <SignupFormStep
              key="form"
              role={role}
              onBack={backMap['form']!}
              onGoogle={onGoogle}
              gLoading={gLoading}
            />
          )}

        </AnimatePresence>
      </div>
    </>
  )
}
