import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, ChevronRight,
  Zap, TrendingUp, Building2, Wallet, Home, Briefcase,
  Rocket, Lightbulb, FileText, FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/AuthContext'
import { supabase } from '@/app/lib/supabase'
import {
  parseOptionalInteger,
  parseOptionalNumber,
  sanitizeOptionalText,
  sanitizeStringArray,
  sanitizeText,
  sanitizeUrl,
  validateUploadedFile,
} from '@/app/lib/inputSecurity'
import { INVESTOR_TYPES, FOUNDER_TYPES, SECTORS, STAGES, GEOGRAPHIES, SUPPORT_NEEDED } from '@/app/lib/investorTypes'
import type { InvestorType, FounderType, IncubationType } from '@/app/lib/types'

// Icon map
const IconMap: Record<string, React.ElementType> = {
  Zap, TrendingUp, Building2, Wallet, Home, Briefcase, Rocket, Lightbulb,
}

// ─── Step Progress Indicator ─────────────────────────────────────
function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-center mb-3 px-4">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: i < current
                  ? 'var(--pos)'
                  : i === current
                    ? 'var(--blue)'
                    : 'var(--surface-2)',
                border: `2px solid ${i < current ? 'var(--pos)' : i === current ? 'var(--blue)' : 'var(--line)'}`,
                color: i <= current ? 'white' : 'var(--muted-2)',
                boxShadow: i === current ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
              }}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className="mt-1.5 whitespace-nowrap hidden sm:block text-center"
              style={{
                fontSize: '0.6875rem',
                fontWeight: i === current ? 600 : 400,
                color: i === current ? 'var(--ink)' : 'var(--muted-2)',
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-0.5 transition-all"
              style={{
                width: 40,
                margin: '-20px 4px 0',
                background: i < current ? 'var(--pos)' : 'var(--line)',
                borderRadius: 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Multi-select chip component ─────────────────────────────────
function ChipSelect({
  options,
  selected,
  onChange,
  max,
}: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  max?: number
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val))
    } else if (!max || selected.length < max) {
      onChange([...selected, val])
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: active ? 'var(--blue-bg)' : 'var(--surface)',
              border: `1.5px solid ${active ? 'var(--blue)' : 'var(--line)'}`,
              color: active ? 'var(--blue)' : 'var(--muted)',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── Form field wrapper ───────────────────────────────────────────
function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label
        className="block text-xs font-medium"
        style={{ color: 'var(--muted-2)' }}
      >
        {label}
        {required && <span className="ml-1" style={{ color: 'var(--neg)' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="fc-input"
      style={{
        height: 34,
        borderRadius: 8,
      }}
    />
  )
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={2}
      className="fc-input resize-none"
      style={{
        borderRadius: 8,
      }}
    />
  )
}

// ─── Main Onboarding Page ─────────────────────────────────────────
export function OnboardingPage() {
  const { user, profile, completeOnboarding, completeIncubationOnboarding, onboardingCompleted } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (onboardingCompleted) {
      navigate('/dashboard', { replace: true })
    }
  }, [onboardingCompleted, navigate])

  // Invited founders must always onboard as 'founder' — role is locked.
  // Signal arrives via router state (set by InviteAcceptPage) or as a
  // fallback via profile.incubation_id once the profile row has loaded.
  const fromInvite = !!(location.state as { fromInvite?: boolean } | null)?.fromInvite
    || !!profile?.incubation_id

  // Check if role was pre-selected on signup/login page.
  // Priority: invite flag → localStorage (same device) → user_metadata (cross-device)
  const localRole = typeof window !== 'undefined'
    ? localStorage.getItem('cc:pendingRole') as 'investor' | 'founder' | 'incubation' | null
    : null
  const rawMetaRole = user?.user_metadata?.pendingRole as string | undefined
  const metaRole = (rawMetaRole === 'investor' || rawMetaRole === 'founder' || rawMetaRole === 'incubation')
    ? rawMetaRole as 'investor' | 'founder' | 'incubation'
    : null
  const pendingRole = fromInvite ? 'founder' : (localRole ?? metaRole)
  const hasPendingRole = pendingRole === 'investor' || pendingRole === 'founder' || pendingRole === 'incubation'

  const [step, setStep] = useState(hasPendingRole ? 1 : 0)
  const [role, setRole] = useState<'investor' | 'founder' | 'incubation' | null>(hasPendingRole ? pendingRole : null)
  const [investorType, setInvestorType] = useState<InvestorType | null>(null)
  const [founderType, setFounderType] = useState<FounderType | null>(null)
  const [incubationType, setIncubationType] = useState<IncubationType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If profile loads after mount and reveals incubation_id, lock role to founder.
  useEffect(() => {
    if (profile?.incubation_id && step === 0) {
      setRole('founder')
      setStep(1)
    }
  }, [profile?.incubation_id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear pending role from localStorage once consumed
  useEffect(() => {
    if (hasPendingRole) {
      localStorage.removeItem('cc:pendingRole')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      validateUploadedFile(file, {
        maxBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid avatar file')
      e.target.value = ''
    }
  }

  // Investor data
  const [investorData, setInvestorData] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    title: '',
    fund_name: '',
    fund_size_usd: '',
    bank_name: '',
    nbfc_name: '',
    office_name: '',
    parent_company: '',
    cvc_name: '',
    linkedin_url: '',
    website_url: '',
    location: '',
    bio: '',
    investment_thesis: '',
    sectors: [] as string[],
    stage_preference: [] as string[],
    geography: [] as string[],
    ticket_size_min: '',
    ticket_size_max: '',
    co_investment_interest: '',
    risk_tolerance: '',
    risk_appetite: '',
    active_portfolio_count: '',
    lending_products: [] as string[],
    funding_types: [] as string[],
    innovation_focus: [] as string[],
    partnership_types: [] as string[],
  })

  // Founder data
  const [founderData, setFounderData] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    company_name: profile?.company ?? '',
    linkedin_url: '',
    website_url: '',
    bio: '',
    sector: '',
    stage: '',
    team_size: '',
    founded_year: '',
    arr_usd: '',
    growth_rate_pct: '',
    funding_ask_usd: '',
    use_of_funds: '',
    pitch_overview: '',
    problem_statement: '',
    idea_title: '',
    idea_stage: '',
    target_market: '',
    support_needed: [] as string[],
  })

  // Pitch deck file (active founders only — uploaded on finish)
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null)

  // Incubation org data
  const [incubationData, setIncubationData] = useState({
    name: '',
    description: '',
    website_url: '',
    linkedin_url: '',
    location: '',
    city: '',
    country: '',
    sectors: [] as string[],
    cohort_size: '',
  })
  const updateIncubation = (k: string, v: unknown) =>
    setIncubationData(prev => ({ ...prev, [k]: v }))

  // ─── Partial progress resume ──────────────────────────────────
  type PartialProgress = {
    step: number
    role: 'investor' | 'founder' | 'incubation' | null
    investorType: InvestorType | null
    founderType: FounderType | null
    incubationType: IncubationType | null
    investorData: typeof investorData
    founderData: typeof founderData
    incubationData: typeof incubationData
    savedAt: string
  }
  const [partialProgress, setPartialProgress] = useState<PartialProgress | null>(null)

  const sanitizeSelections = (values: string[], allowed?: string[]) => {
    const sanitized = sanitizeStringArray(values)
    return allowed ? sanitized.filter(value => allowed.includes(value)) : sanitized
  }

  const getSanitizedInvestorData = () => ({
    first_name: sanitizeText(investorData.first_name, { maxLength: 100, allowEmpty: false, fieldName: 'First name' }),
    last_name: sanitizeOptionalText(investorData.last_name, { maxLength: 100 }),
    title: sanitizeOptionalText(investorData.title, { maxLength: 120 }),
    fund_name: sanitizeOptionalText(investorData.fund_name, { maxLength: 160 }),
    fund_size_usd: parseOptionalNumber(investorData.fund_size_usd),
    bank_name: sanitizeOptionalText(investorData.bank_name, { maxLength: 160 }),
    nbfc_name: sanitizeOptionalText(investorData.nbfc_name, { maxLength: 160 }),
    office_name: sanitizeOptionalText(investorData.office_name, { maxLength: 160 }),
    parent_company: sanitizeOptionalText(investorData.parent_company, { maxLength: 160 }),
    cvc_name: sanitizeOptionalText(investorData.cvc_name, { maxLength: 160 }),
    linkedin_url: sanitizeUrl(investorData.linkedin_url),
    website_url: sanitizeUrl(investorData.website_url),
    location: sanitizeOptionalText(investorData.location, { maxLength: 160 }),
    bio: sanitizeOptionalText(investorData.bio, { maxLength: 2000, multiline: true }),
    investment_thesis: sanitizeOptionalText(investorData.investment_thesis, { maxLength: 2000, multiline: true }),
    sectors: sanitizeSelections(investorData.sectors, SECTORS),
    stage_preference: sanitizeSelections(investorData.stage_preference, STAGES),
    geography: sanitizeSelections(investorData.geography, GEOGRAPHIES),
    ticket_size_min: parseOptionalNumber(investorData.ticket_size_min),
    ticket_size_max: parseOptionalNumber(investorData.ticket_size_max),
    co_investment_interest: sanitizeOptionalText(investorData.co_investment_interest, { maxLength: 120 }),
    risk_tolerance: sanitizeOptionalText(investorData.risk_tolerance, { maxLength: 120 }),
    risk_appetite: sanitizeOptionalText(investorData.risk_appetite, { maxLength: 120 }),
    active_portfolio_count: parseOptionalInteger(investorData.active_portfolio_count),
    lending_products: sanitizeSelections(investorData.lending_products),
    funding_types: sanitizeSelections(investorData.funding_types),
    innovation_focus: sanitizeSelections(investorData.innovation_focus),
    partnership_types: sanitizeSelections(investorData.partnership_types),
  })

  const getSanitizedFounderData = () => ({
    first_name: sanitizeText(founderData.first_name, { maxLength: 100, allowEmpty: false, fieldName: 'First name' }),
    last_name: sanitizeOptionalText(founderData.last_name, { maxLength: 100 }),
    company_name: sanitizeOptionalText(founderData.company_name, { maxLength: 160 }),
    linkedin_url: sanitizeUrl(founderData.linkedin_url),
    website_url: sanitizeUrl(founderData.website_url),
    bio: sanitizeOptionalText(founderData.bio, { maxLength: 2000, multiline: true }),
    sector: founderData.sector && SECTORS.includes(founderData.sector) ? founderData.sector : '',
    stage: founderData.stage && STAGES.includes(founderData.stage) ? founderData.stage : '',
    team_size: parseOptionalInteger(founderData.team_size),
    founded_year: parseOptionalInteger(founderData.founded_year),
    arr_usd: parseOptionalNumber(founderData.arr_usd),
    growth_rate_pct: parseOptionalNumber(founderData.growth_rate_pct),
    funding_ask_usd: parseOptionalNumber(founderData.funding_ask_usd),
    use_of_funds: sanitizeOptionalText(founderData.use_of_funds, { maxLength: 2000, multiline: true }),
    pitch_overview: sanitizeOptionalText(founderData.pitch_overview, { maxLength: 2000, multiline: true }),
    problem_statement: sanitizeOptionalText(founderData.problem_statement, { maxLength: 2000, multiline: true }),
    idea_title: sanitizeOptionalText(founderData.idea_title, { maxLength: 160 }),
    idea_stage: sanitizeOptionalText(founderData.idea_stage, { maxLength: 120 }),
    target_market: sanitizeOptionalText(founderData.target_market, { maxLength: 2000, multiline: true }),
    support_needed: sanitizeSelections(founderData.support_needed, SUPPORT_NEEDED),
  })

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('onboarding_partial')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_partial) setPartialProgress(data.onboarding_partial as PartialProgress)
      })
  }, [user])

  // Pre-fill name from signup. Signup writes firstName/lastName into
  // auth.user_metadata; if the user hasn't typed anything here yet, use it.
  useEffect(() => {
    if (!user) return
    const meta = (user.user_metadata ?? {}) as { firstName?: string; first_name?: string; lastName?: string; last_name?: string }
    const first = meta.firstName ?? meta.first_name ?? ''
    const last  = meta.lastName  ?? meta.last_name  ?? ''
    if (!first && !last) return
    setInvestorData(prev => ({
      ...prev,
      first_name: prev.first_name || first,
      last_name:  prev.last_name  || last,
    }))
    setFounderData(prev => ({
      ...prev,
      first_name: prev.first_name || first,
      last_name:  prev.last_name  || last,
    }))
  }, [user])

  function handleContinue() {
    if (!partialProgress) return
    setStep(partialProgress.step)
    setRole(partialProgress.role)
    setInvestorType(partialProgress.investorType)
    setFounderType(partialProgress.founderType)
    setIncubationType(partialProgress.incubationType ?? null)
    setInvestorData(partialProgress.investorData)
    setFounderData(partialProgress.founderData)
    if (partialProgress.incubationData) setIncubationData(partialProgress.incubationData)
    setPartialProgress(null)
  }

  function handleStartFresh() {
    if (!user) return
    supabase.from('profiles').update({ onboarding_partial: null }).eq('id', user.id)
    setPartialProgress(null)
  }

  const saveStep = useCallback(
    async (stepKey: string, data: Record<string, unknown>) => {
      if (!user) return
      const sanitizedPayload = {
        ...data,
        investorData: role === 'investor' ? getSanitizedInvestorData() : undefined,
        founderData: role === 'founder' ? getSanitizedFounderData() : undefined,
      }
      await supabase.from('onboarding_data').upsert(
        {
          user_id: user.id,
          step_key: stepKey,
          step_data: sanitizedPayload,
          completed: true,
        },
        { onConflict: 'user_id,step_key' },
      )
    },
    [founderData, investorData, role, user],
  )

  const updateInvestor = (k: string, v: unknown) =>
    setInvestorData(prev => ({ ...prev, [k]: v }))
  const updateFounder = (k: string, v: unknown) =>
    setFounderData(prev => ({ ...prev, [k]: v }))

  const handleNext = async () => {
    // ── Incubation submit intercept (step 4 → API → step 5) ──────
    if (role === 'incubation' && step === 4) {
      if (!user || !incubationType) return
      setIsSubmitting(true)
      try {
        await completeIncubationOnboarding({
          incubationType,
          name: incubationData.name.trim(),
          description: incubationData.description.trim() || undefined,
          websiteUrl: incubationData.website_url.trim() || undefined,
          linkedinUrl: incubationData.linkedin_url.trim() || undefined,
          location: incubationData.location.trim() || undefined,
          city: incubationData.city.trim() || undefined,
          country: incubationData.country.trim() || undefined,
          sectors: incubationData.sectors,
          cohortSize: incubationData.cohort_size ? parseInt(incubationData.cohort_size, 10) : undefined,
        })
        await supabase.from('profiles').update({ onboarding_partial: null }).eq('id', user.id)
        toast.success('Application submitted! Awaiting verification.')
        setStep(5)
      } catch (err) {
        console.error('[handleNext/incubation-submit] error:', err)
        const msg = err instanceof Error ? err.message : 'Failed to submit. Please try again.'
        toast.error(msg)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    try {
      const nextStep = step + 1
      // Profile fields (first_name etc.) are filled in on step 2 (Profile).
      // Only run strict sanitisation from step 2+ to avoid "First name is
      // required" errors on the Type selection step (step 1).
      const sanitizedInvestorData = step >= 2 && role === 'investor'
        ? getSanitizedInvestorData()
        : investorData
      const sanitizedFounderData = step >= 2 && role === 'founder'
        ? getSanitizedFounderData()
        : founderData
      setStep(nextStep)
      if (user) {
        // Await the partial-save so we don't silently lose progress on a
        // flaky network, and retry once on failure.
        const payload = {
          onboarding_partial: {
            step: nextStep, role, investorType, founderType, incubationType,
            investorData: sanitizedInvestorData,
            founderData: sanitizedFounderData,
            incubationData,
            savedAt: new Date().toISOString(),
          },
        }
        const { error: saveErr } = await supabase.from('profiles').update(payload).eq('id', user.id)
        if (saveErr) {
          console.warn('[onboarding] partial save failed, retrying once:', saveErr.message)
          const { error: retryErr } = await supabase.from('profiles').update(payload).eq('id', user.id)
          if (retryErr) {
            toast.error('Could not save your progress — stay online while onboarding.')
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid onboarding data')
    }
  }
  const handleBack = () => {
    if (fromInvite && step === 1) return
    setStep(s => s - 1)
  }

  // ─── INCUBATION STEPS ─────────────────────────────────────────
  const incubationStepLabels = ['Role', 'Type', 'Your Org', 'Location', 'Submit', 'Done']

  const INCUBATION_TYPES: { id: IncubationType; label: string; desc: string; color: string; bg: string; border: string }[] = [
    { id: 'accelerator',  label: 'Accelerator',       desc: 'Time-bound programme with mentorship & funding',      color: '#7C3AED', bg: '#F5F3FF', border: '#7C3AED' },
    { id: 'incubator',   label: 'Incubator',          desc: 'Nurture early-stage startups with resources & space', color: '#2563EB', bg: '#EFF6FF', border: '#2563EB' },
    { id: 'university',  label: 'University / CIE',   desc: 'Campus-based innovation & entrepreneurship cell',     color: '#16A34A', bg: '#F0FDF4', border: '#16A34A' },
    { id: 'government',  label: 'Government Body',    desc: 'Public-sector initiative or startup scheme',          color: '#B45309', bg: '#FFFBEB', border: '#D97706' },
    { id: 'corporate',   label: 'Corporate Programme', desc: 'Corporate-run innovation hub or CVC programme',      color: '#0891B2', bg: '#F0F9FF', border: '#0891B2' },
  ]

  const renderIncubationStep = () => {
    switch (step) {
      case 1: // Incubation type
        return (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              What type of incubation are you?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              This helps founders understand your programme.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INCUBATION_TYPES.map(type => {
                const active = incubationType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setIncubationType(type.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: active ? type.bg : 'var(--surface)',
                      border: `2px solid ${active ? type.border : 'var(--line)'}`,
                      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <p className="font-semibold mb-0.5 text-sm" style={{ color: active ? type.color : 'var(--ink)' }}>
                      {type.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{type.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 2: // Organization profile
        return (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              About your organisation
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              This is how founders and investors will discover you.
            </p>
            <p className="text-xs mb-6 font-medium" style={{ color: 'var(--neg)' }}>Fields marked with * are required.</p>
            <div className="space-y-3">
              <Field label="Organisation Name" required>
                <Input
                  value={incubationData.name}
                  onChange={e => updateIncubation('name', e.target.value)}
                  placeholder="e.g. IIT Delhi Innovation Hub"
                />
              </Field>
              <Field label="Description" required>
                <Textarea
                  value={incubationData.description}
                  onChange={e => updateIncubation('description', e.target.value)}
                  placeholder="Tell founders about your programme, goals, and what you offer..."
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Website URL">
                  <Input
                    value={incubationData.website_url}
                    onChange={e => updateIncubation('website_url', e.target.value)}
                    placeholder="https://yourprogramme.org"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <Input
                    value={incubationData.linkedin_url}
                    onChange={e => updateIncubation('linkedin_url', e.target.value)}
                    placeholder="linkedin.com/company/..."
                  />
                </Field>
              </div>
              <Field label="Sectors you focus on" required hint="Select all that apply">
                <ChipSelect
                  options={SECTORS}
                  selected={incubationData.sectors}
                  onChange={v => updateIncubation('sectors', v)}
                />
              </Field>
              <Field label="Cohort size (startups per batch)">
                <Input
                  type="number"
                  value={incubationData.cohort_size}
                  onChange={e => updateIncubation('cohort_size', e.target.value)}
                  placeholder="e.g. 20"
                />
              </Field>
            </div>
          </div>
        )

      case 3: // Location
        return (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              Where are you based?
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              Help local founders find your programme.
            </p>
            <div className="space-y-3">
              <Field label="Full Location" required hint="e.g. Bengaluru, Karnataka, India">
                <Input
                  value={incubationData.location}
                  onChange={e => updateIncubation('location', e.target.value)}
                  placeholder="Bengaluru, Karnataka, India"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="City" required>
                  <Input
                    value={incubationData.city}
                    onChange={e => updateIncubation('city', e.target.value)}
                    placeholder="Bengaluru"
                  />
                </Field>
                <Field label="Country" required>
                  <Input
                    value={incubationData.country}
                    onChange={e => updateIncubation('country', e.target.value)}
                    placeholder="India"
                  />
                </Field>
              </div>
            </div>
          </div>
        )

      case 4: // Submit — review & confirm before submission
        return (
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              Review &amp; Submit
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Please confirm your details before submitting your application.
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Organisation</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{incubationData.name || '—'}</p>
                {incubationData.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{incubationData.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Type</p>
                  <p className="text-sm font-medium capitalize" style={{ color: 'var(--ink)' }}>
                    {INCUBATION_TYPES.find(t => t.id === incubationType)?.label ?? incubationType ?? '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Location</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {incubationData.city && incubationData.country ? `${incubationData.city}, ${incubationData.country}` : incubationData.location || '—'}
                  </p>
                </div>
              </div>
              {incubationData.sectors.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sectors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {incubationData.sectors.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 rounded-xl" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <p className="text-xs font-medium" style={{ color: '#92400E' }}>
                  Your profile will be reviewed by the Founder Central team. You'll receive an email once verified — usually within 1–2 business days.
                </p>
              </div>
            </div>
          </div>
        )

      case 5: // Done — waiting for approval (shown after successful submission)
        return (
          <div className="text-center py-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: '#F5F3FF', border: '2px solid #DDD6FE' }}>
              <Building2 className="w-12 h-12" style={{ color: '#7C3AED' }} />
            </div>
            <h2 className="font-bold mb-3"
              style={{ fontSize: '2rem', color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Application submitted!
            </h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Your incubation profile has been sent to the Founder Central team for verification. You'll receive an email once approved — usually within 1–2 business days.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              {[
                { label: 'Founders on platform', value: '1.2K+', color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Active Incubations', value: '40+',  color: 'var(--blue)', bg: 'var(--blue-bg)' },
                { label: 'Avg. Review Time',   value: '24h',  color: 'var(--pos)',  bg: 'var(--pos-bg)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: bg, border: `1px solid ${color}20` }}>
                  <p className="text-2xl font-bold font-numeric" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── INVESTOR STEPS ───────────────────────────────────────────
  const investorStepLabels = ['Role', 'Type', 'Profile', 'Focus', 'Details', 'Done']

  const renderInvestorStep = () => {
    switch (step) {
      case 1: // Investor type selection
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              What type of investor are you?
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              This helps us personalize your discovery experience.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {INVESTOR_TYPES.map(type => {
                const Icon = IconMap[type.icon]
                const active = investorType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setInvestorType(type.id)}
                    className="p-2.5 rounded-xl text-left transition-all"
                    style={{
                      minHeight: 68,
                      background: active ? type.bgColor : 'var(--surface)',
                      border: `2px solid ${active ? type.borderColor : 'var(--line)'}`,
                      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5"
                      style={{ background: active ? type.bgColor : 'var(--bg)' }}
                    >
                      {Icon && (
                        <Icon
                          className="w-5 h-5"
                          style={{ color: active ? type.color : 'var(--muted-2)' }}
                        />
                      )}
                    </div>
                    <p
                      className="font-semibold mb-0.5"
                      style={{ fontSize: '0.75rem', color: active ? type.textColor : 'var(--ink)' }}
                    >
                      {type.label}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {type.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 2: // Profile fields
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              Your profile
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
              Tell us about yourself and your firm.
            </p>
            <p className="text-xs mb-6 font-medium" style={{ color: 'var(--neg)' }}>All fields marked with * are compulsory.</p>
            <div className="space-y-1.5">
              {/* Avatar upload */}
              <div className="flex items-center gap-2">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview"
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid #E2E8F0' }} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '2px solid #BFDBFE' }}>
                    {(investorData.first_name[0] ?? '') + (investorData.last_name[0] ?? '')}
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <span className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--neg)' }}>Required</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="First Name" required>
                  <Input
                    value={investorData.first_name}
                    onChange={e => updateInvestor('first_name', e.target.value)}
                    placeholder="John"
                  />
                </Field>
                <Field label="Last Name" required>
                  <Input
                    value={investorData.last_name}
                    onChange={e => updateInvestor('last_name', e.target.value)}
                    placeholder="Doe"
                  />
                </Field>
              </div>
              <Field label="Title / Role" required>
                <Input
                  value={investorData.title}
                  onChange={e => updateInvestor('title', e.target.value)}
                  placeholder={
                    investorType === 'angel'
                      ? 'Angel Investor, ex-Founder'
                      : 'Partner, Managing Director'
                  }
                />
              </Field>
              {/* LinkedIn and Website — shown for all investor types */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="LinkedIn URL" required>
                  <Input
                    value={investorData.linkedin_url}
                    onChange={e => updateInvestor('linkedin_url', e.target.value)}
                    placeholder="linkedin.com/in/..."
                  />
                </Field>
                <Field label="Website URL">
                  <Input
                    value={investorData.website_url}
                    onChange={e => updateInvestor('website_url', e.target.value)}
                    placeholder="yourfirm.com"
                  />
                </Field>
              </div>
              {/* Type-specific fields */}
              {investorType === 'venture-capital' && (
                <>
                  <Field label="Fund Name">
                    <Input
                      value={investorData.fund_name}
                      onChange={e => updateInvestor('fund_name', e.target.value)}
                      placeholder="Accel India"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Fund Size (USD)">
                      <Input
                        type="number"
                        value={investorData.fund_size_usd}
                        onChange={e => updateInvestor('fund_size_usd', e.target.value)}
                        placeholder="100000000"
                      />
                    </Field>
                    <Field label="Active Portfolio Co.">
                      <Input
                        type="number"
                        value={investorData.active_portfolio_count}
                        onChange={e => updateInvestor('active_portfolio_count', e.target.value)}
                        placeholder="24"
                      />
                    </Field>
                  </div>
                </>
              )}
              {investorType === 'bank' && (
                <Field label="Bank Name">
                  <Input
                    value={investorData.bank_name}
                    onChange={e => updateInvestor('bank_name', e.target.value)}
                    placeholder="HDFC Bank"
                  />
                </Field>
              )}
              {investorType === 'nbfc' && (
                <Field label="NBFC Name">
                  <Input
                    value={investorData.nbfc_name}
                    onChange={e => updateInvestor('nbfc_name', e.target.value)}
                    placeholder="Tata Capital"
                  />
                </Field>
              )}
              {investorType === 'family-office' && (
                <Field label="Family Office Name">
                  <Input
                    value={investorData.office_name}
                    onChange={e => updateInvestor('office_name', e.target.value)}
                    placeholder="Premji Invest"
                  />
                </Field>
              )}
              {investorType === 'corporate-venture' && (
                <>
                  <Field label="Parent Company">
                    <Input
                      value={investorData.parent_company}
                      onChange={e => updateInvestor('parent_company', e.target.value)}
                      placeholder="Reliance Industries"
                    />
                  </Field>
                  <Field label="CVC Name">
                    <Input
                      value={investorData.cvc_name}
                      onChange={e => updateInvestor('cvc_name', e.target.value)}
                      placeholder="Reliance Ventures"
                    />
                  </Field>
                </>
              )}
              <Field label="Location" required>
                <Input
                  value={investorData.location}
                  onChange={e => updateInvestor('location', e.target.value)}
                  placeholder="Mumbai, India"
                />
              </Field>
              <Field label="Short Bio" required>
                <Textarea
                  value={investorData.bio}
                  onChange={e => updateInvestor('bio', e.target.value)}
                  placeholder="Tell founders what makes you a great partner..."
                />
              </Field>
            </div>
          </div>
        )

      case 3: // Investment focus
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              Investment focus
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              Define your thesis to attract the best matching startups.
            </p>
            <div className="space-y-3">
              <Field label="Sectors of interest (select all that apply)" required>
                <ChipSelect
                  options={SECTORS}
                  selected={investorData.sectors}
                  onChange={v => updateInvestor('sectors', v)}
                />
              </Field>
              <Field label="Stage preference" required>
                <ChipSelect
                  options={STAGES}
                  selected={investorData.stage_preference}
                  onChange={v => updateInvestor('stage_preference', v)}
                />
              </Field>
              <Field label="Geography" required>
                <ChipSelect
                  options={GEOGRAPHIES}
                  selected={investorData.geography}
                  onChange={v => updateInvestor('geography', v)}
                />
              </Field>
              <Field label="Investment thesis">
                <Textarea
                  value={investorData.investment_thesis}
                  onChange={e => updateInvestor('investment_thesis', e.target.value)}
                  placeholder="Describe what you look for in a startup, your edge as an investor, and what you bring beyond capital..."
                />
              </Field>
            </div>
          </div>
        )

      case 4: // Ticket size & type-specific details
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              {investorType === 'bank' || investorType === 'nbfc'
                ? 'Financing details'
                : 'Ticket size & preferences'}
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              Almost there — just a few more details.
            </p>
            <div className="space-y-2">
              {(investorType === 'angel' ||
                investorType === 'venture-capital' ||
                investorType === 'family-office' ||
                investorType === 'corporate-venture') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Field label="Min ticket (USD)" required>
                    <Input
                      type="number"
                      value={investorData.ticket_size_min}
                      onChange={e => updateInvestor('ticket_size_min', e.target.value)}
                      placeholder="50000"
                    />
                  </Field>
                  <Field label="Max ticket (USD)" required>
                    <Input
                      type="number"
                      value={investorData.ticket_size_max}
                      onChange={e => updateInvestor('ticket_size_max', e.target.value)}
                      placeholder="500000"
                    />
                  </Field>
                </div>
              )}
              {investorType === 'bank' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Min Amount (USD)">
                      <Input
                        type="number"
                        value={investorData.ticket_size_min}
                        onChange={e => updateInvestor('ticket_size_min', e.target.value)}
                        placeholder="100000"
                      />
                    </Field>
                    <Field label="Max Amount (USD)">
                      <Input
                        type="number"
                        value={investorData.ticket_size_max}
                        onChange={e => updateInvestor('ticket_size_max', e.target.value)}
                        placeholder="10000000"
                      />
                    </Field>
                  </div>
                  <Field label="Lending products">
                    <ChipSelect
                      options={[
                        'Term Loan',
                        'Working Capital',
                        'Venture Debt',
                        'Revenue-based',
                        'Invoice Discounting',
                      ]}
                      selected={investorData.lending_products}
                      onChange={v => updateInvestor('lending_products', v)}
                    />
                  </Field>
                  <Field label="Risk Appetite">
                    <div className="flex gap-3">
                      {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                        <button
                          key={r}
                          onClick={() => updateInvestor('risk_appetite', r)}
                          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: investorData.risk_appetite === r ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                            border: `1px solid ${investorData.risk_appetite === r ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                            color: investorData.risk_appetite === r ? 'var(--blue)' : 'var(--muted)',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
              {investorType === 'nbfc' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Min Amount (USD)">
                      <Input
                        type="number"
                        value={investorData.ticket_size_min}
                        onChange={e => updateInvestor('ticket_size_min', e.target.value)}
                        placeholder="50000"
                      />
                    </Field>
                    <Field label="Max Amount (USD)">
                      <Input
                        type="number"
                        value={investorData.ticket_size_max}
                        onChange={e => updateInvestor('ticket_size_max', e.target.value)}
                        placeholder="5000000"
                      />
                    </Field>
                  </div>
                  <Field label="Funding types">
                    <ChipSelect
                      options={[
                        'Revenue-based Financing',
                        'Equity',
                        'Convertible Notes',
                        'Debt Financing',
                        'Mezzanine',
                      ]}
                      selected={investorData.funding_types}
                      onChange={v => updateInvestor('funding_types', v)}
                    />
                  </Field>
                  <Field label="Risk tolerance">
                    <div className="flex gap-3">
                      {['Low', 'Medium', 'High'].map(r => (
                        <button
                          key={r}
                          onClick={() => updateInvestor('risk_tolerance', r)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: investorData.risk_tolerance === r ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                            border: `1px solid ${investorData.risk_tolerance === r ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                            color: investorData.risk_tolerance === r ? 'var(--blue)' : 'var(--muted)',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
              {investorType === 'family-office' && (
                <>
                  <Field label="Co-investment interest">
                    <div className="flex gap-3">
                      {['Yes', 'No', 'Selectively'].map(v => (
                        <button
                          key={v}
                          onClick={() => updateInvestor('co_investment_interest', v)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: investorData.co_investment_interest === v ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                            border: `1px solid ${investorData.co_investment_interest === v ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                            color: investorData.co_investment_interest === v ? 'var(--blue)' : 'var(--muted)',
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Risk Appetite">
                    <div className="flex gap-3">
                      {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                        <button
                          key={r}
                          onClick={() => updateInvestor('risk_appetite', r)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: investorData.risk_appetite === r ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                            border: `1px solid ${investorData.risk_appetite === r ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                            color: investorData.risk_appetite === r ? 'var(--blue)' : 'var(--muted)',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
              {investorType === 'corporate-venture' && (
                <>
                  <Field label="Innovation focus">
                    <ChipSelect
                      options={[
                        'AI/ML',
                        'DeepTech',
                        'Sustainability',
                        'Digital Transformation',
                        'HealthTech',
                        'FinTech',
                        'Cybersecurity',
                        'IoT',
                        'Web3/Blockchain',
                        'EdTech',
                        'AgriTech',
                        'CleanTech',
                      ]}
                      selected={investorData.innovation_focus}
                      onChange={v => updateInvestor('innovation_focus', v)}
                    />
                  </Field>
                  <Field label="Partnership types">
                    <ChipSelect
                      options={[
                        'Strategic Partnership',
                        'Pilot Program',
                        'Acquisition Target',
                        'Technology License',
                        'Joint Venture',
                      ]}
                      selected={investorData.partnership_types}
                      onChange={v => updateInvestor('partnership_types', v)}
                    />
                  </Field>
                  <Field label="Risk Appetite">
                    <div className="flex gap-3">
                      {['Conservative', 'Moderate', 'Aggressive'].map(r => (
                        <button
                          key={r}
                          onClick={() => updateInvestor('risk_appetite', r)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: investorData.risk_appetite === r ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                            border: `1px solid ${investorData.risk_appetite === r ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                            color: investorData.risk_appetite === r ? 'var(--blue)' : 'var(--muted)',
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
            </div>
          </div>
        )

      case 5: // Ready
        return (
          <div className="text-center py-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'var(--pos-bg)',
                border: '2px solid #BBF7D0',
              }}
            >
              <Check className="w-12 h-12" style={{ color: 'var(--pos)' }} />
            </div>
            <h2
              className="font-bold mb-3"
              style={{
                fontSize: '2rem',
                color: 'var(--ink)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
              }}
            >
              You're all set!
            </h2>
            <p
              className="text-sm mb-8 max-w-sm mx-auto"
              style={{ color: 'var(--muted)', lineHeight: 1.6 }}
            >
              Your investor profile is ready. Browse curated startups that match your thesis.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              {[
                { label: 'Curated Startups', value: '500+', color: 'var(--blue)', bg: 'var(--blue-bg)' },
                { label: 'Active Founders', value: '1.2K', color: 'var(--pos)', bg: 'var(--pos-bg)' },
                { label: 'Sectors Covered', value: '20+', color: 'var(--warn)', bg: 'var(--warn-bg)' },
              ].map(({ label, value, color, bg }) => (
                <div
                  key={label}
                  className="p-4 rounded-xl"
                  style={{ background: bg, border: `1px solid ${color}20` }}
                >
                  <p className="text-2xl font-bold font-numeric" style={{ color }}>
                    {value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── FOUNDER STEPS ───────────────────────────────────────────
  const activeFounderStepLabels = ['Role', 'Type', 'Profile', 'Company', 'Traction', 'Fundraise', 'Story', 'Media', 'Done']
  const ideaFounderStepLabels = ['Role', 'Type', 'Profile', 'Idea', 'Vision', 'Support', 'Done']

  const renderFounderStep = () => {
    switch (step) {
      case 1: // Founder type
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              What stage are you at?
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
              This shapes your dashboard and the investors we connect you with.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FOUNDER_TYPES.map(type => {
                const Icon = IconMap[type.icon]
                const active = founderType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setFounderType(type.id)}
                    className="rounded-xl text-left transition-all flex flex-col"
                    style={{
                      background: active ? type.bgColor : 'var(--surface-2)',
                      border: `2px solid ${active ? type.borderColor : 'var(--line)'}`,
                      padding: '32px 28px',
                      minHeight: 220,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: active ? type.bgColor : 'var(--surface)' }}
                    >
                      {Icon && (
                        <Icon
                          className="w-7 h-7"
                          style={{ color: active ? type.color : 'var(--muted-2)' }}
                        />
                      )}
                    </div>
                    <h3
                      className="text-base font-semibold mb-1"
                      style={{ color: active ? type.textColor : 'var(--ink)' }}
                    >
                      {type.label}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-2)' }}>
                      {type.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 2: // Profile
        return (
          <div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
            >
              Your profile
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              Let investors know who they're talking to.
            </p>
            <p className="text-xs mb-6 font-medium" style={{ color: 'var(--neg)' }}>All fields marked with * are compulsory.</p>
            <div className="space-y-4">
              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview"
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid #E2E8F0' }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: '2px solid #BBF7D0' }}>
                    {(founderData.first_name[0] ?? '') + (founderData.last_name[0] ?? '')}
                  </div>
                )}
                <label className="cursor-pointer flex items-center gap-2">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <span className="px-4 py-2 rounded-lg text-xs font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                    {avatarFile ? 'Change Photo' : 'Upload Photo'}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--neg)' }}>Required</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First Name" required>
                  <Input
                    value={founderData.first_name}
                    onChange={e => updateFounder('first_name', e.target.value)}
                    placeholder="Jane"
                  />
                </Field>
                <Field label="Last Name" required>
                  <Input
                    value={founderData.last_name}
                    onChange={e => updateFounder('last_name', e.target.value)}
                    placeholder="Smith"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="LinkedIn URL" required>
                  <Input
                    value={founderData.linkedin_url}
                    onChange={e => updateFounder('linkedin_url', e.target.value)}
                    placeholder="linkedin.com/in/..."
                  />
                </Field>
                <Field label="Website URL">
                  <Input
                    value={founderData.website_url}
                    onChange={e => updateFounder('website_url', e.target.value)}
                    placeholder="yourstartup.com"
                  />
                </Field>
              </div>
              <Field label="Bio" required>
                <Textarea
                  value={founderData.bio}
                  onChange={e => updateFounder('bio', e.target.value)}
                  placeholder="Tell investors about yourself and your background..."
                />
              </Field>
            </div>
          </div>
        )

      case 3:
        if (founderType === 'active') {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                About your startup
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                Tell us about your company.
              </p>
              <div className="space-y-4">
                <Field label="Company Name" required>
                  <Input
                    value={founderData.company_name}
                    onChange={e => updateFounder('company_name', e.target.value)}
                    placeholder="Acme Inc."
                  />
                </Field>
                <Field label="Sector" required>
                  <select
                    value={founderData.sector}
                    onChange={e => updateFounder('sector', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stage" required>
                  <div className="grid grid-cols-3 gap-2">
                    {STAGES.map(s => (
                      <button
                        key={s}
                        onClick={() => updateFounder('stage', s)}
                        className="py-2 px-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background:
                            founderData.stage === s
                              ? 'rgba(37,99,235,0.2)'
                              : 'var(--surface-2)',
                          border: `1px solid ${founderData.stage === s ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                          color:
                            founderData.stage === s ? 'var(--blue)' : 'var(--muted)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Team Size">
                    <Input
                      type="number"
                      value={founderData.team_size}
                      onChange={e => updateFounder('team_size', e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </Field>
                  <Field label="Founded Year">
                    <Input
                      type="number"
                      value={founderData.founded_year}
                      onChange={e => updateFounder('founded_year', e.target.value)}
                      placeholder="e.g. 2022"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                About your idea
              </h2>
              <div className="space-y-4">
                <Field label="Idea Title" required>
                  <Input
                    value={founderData.idea_title}
                    onChange={e => updateFounder('idea_title', e.target.value)}
                    placeholder="What is your idea called?"
                  />
                </Field>
                <Field label="Sector" required>
                  <select
                    value={founderData.sector}
                    onChange={e => updateFounder('sector', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map(
                      s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="Problem statement" required>
                  <Textarea
                    value={founderData.problem_statement}
                    onChange={e => updateFounder('problem_statement', e.target.value)}
                    placeholder="What problem are you solving and why does it matter?"
                  />
                </Field>
                <Field label="Where are you in your journey?" required>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(['Pre-Idea', 'Ideation', 'Validating', 'MVP Building']).map(s => (
                      <button
                        key={s}
                        onClick={() => updateFounder('idea_stage', s)}
                        className="py-2 px-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: founderData.idea_stage === s ? 'rgba(37,99,235,0.2)' : 'var(--surface-2)',
                          border: `1px solid ${founderData.idea_stage === s ? 'rgba(37,99,235,0.4)' : 'var(--line)'}`,
                          color: founderData.idea_stage === s ? 'var(--blue)' : 'var(--muted)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )
        }

      case 4:
        if (founderType === 'active') {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                Traction metrics
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                Share your current metrics to attract aligned investors.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="ARR (USD)" hint="Annual Recurring Revenue">
                    <Input
                      type="number"
                      value={founderData.arr_usd}
                      onChange={e => updateFounder('arr_usd', e.target.value)}
                      placeholder="120000"
                    />
                  </Field>
                  <Field label="MoM Growth %" hint="Month-over-month growth">
                    <Input
                      type="number"
                      value={founderData.growth_rate_pct}
                      onChange={e => updateFounder('growth_rate_pct', e.target.value)}
                      placeholder="25"
                    />
                  </Field>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                Your vision
              </h2>
              <div className="space-y-4">
                <Field label="Target market" required>
                  <Input
                    value={founderData.target_market}
                    onChange={e => updateFounder('target_market', e.target.value)}
                    placeholder="e.g. SMBs in Southeast Asia"
                  />
                </Field>
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: 'rgba(37,99,235,0.08)',
                    border: '1px solid rgba(37,99,235,0.15)',
                  }}
                >
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--blue)' }}>
                    What idea-stage founders get:
                  </h4>
                  {[
                    'Access to pre-seed investors',
                    'Mentor matching',
                    'Co-founder discovery',
                    'Early community access',
                    'Free office hours',
                  ].map(perk => (
                    <div key={perk} className="flex items-center gap-2 mt-1.5">
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

      case 5:
        if (founderType === 'active') {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                Fundraising
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                How much are you raising and how will you use it?
              </p>
              <div className="space-y-4">
                <Field label="Target Raise Amount (USD)">
                  <Input
                    type="number"
                    value={founderData.funding_ask_usd}
                    onChange={e => updateFounder('funding_ask_usd', e.target.value)}
                    placeholder="1000000"
                  />
                </Field>
                <Field label="Use of Funds">
                  <Textarea
                    value={founderData.use_of_funds}
                    onChange={e => updateFounder('use_of_funds', e.target.value)}
                    placeholder="e.g. 40% product development, 35% sales & marketing, 25% operations..."
                  />
                </Field>
                <div className="p-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <span className="text-xs" style={{ color: 'var(--blue)' }}>
                    <Lightbulb className="w-3.5 h-3.5 inline shrink-0" /> You can always add or modify your data later from My Listing.
                  </span>
                </div>
              </div>
            </div>
          )
        } else {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                What support do you need?
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                Select all that apply. We'll match you accordingly.
              </p>
              <ChipSelect
                options={SUPPORT_NEEDED}
                selected={founderData.support_needed}
                onChange={v => updateFounder('support_needed', v)}
              />
            </div>
          )
        }

      case 6: // Your Story (active) / Done (idea)
        if (founderType === 'active') {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                Your Story
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                Help investors understand your vision and the problem you're solving.
              </p>
              <div className="space-y-4">
                <Field label="Pitch / Company Overview">
                  <Textarea
                    value={founderData.pitch_overview}
                    onChange={e => updateFounder('pitch_overview', e.target.value)}
                    placeholder="We are building [product] for [target market] that solves [problem] by [solution]..."
                  />
                </Field>
                <Field label="Problem Statement">
                  <Textarea
                    value={founderData.problem_statement}
                    onChange={e => updateFounder('problem_statement', e.target.value)}
                    placeholder="What problem are you solving and why does it matter?"
                  />
                </Field>
                <Field label="Target Market">
                  <Input
                    value={founderData.target_market}
                    onChange={e => updateFounder('target_market', e.target.value)}
                    placeholder="e.g. SMBs in Southeast Asia, 2M+ businesses"
                  />
                </Field>
                <div className="p-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <span className="text-xs" style={{ color: 'var(--blue)' }}>
                    <Lightbulb className="w-3.5 h-3.5 inline shrink-0" /> You can always add or modify your data later from My Listing.
                  </span>
                </div>
              </div>
            </div>
          )
        }
        // Idea founder Done
        return (
          <div className="text-center py-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--pos-bg)', border: '2px solid #BBF7D0' }}>
              <Rocket className="w-12 h-12" style={{ color: 'var(--pos)' }} />
            </div>
            <h2 className="font-bold mb-3"
              style={{ fontSize: '2rem', color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              You're ready!
            </h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Welcome! Explore mentors, co-founders, and pre-seed investors from your personalized dashboard.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              {[
                { label: 'Mentors Available', value: '150+', color: 'var(--blue)', bg: 'var(--blue-bg)' },
                { label: 'Events This Month', value: '12', color: 'var(--pos)', bg: 'var(--pos-bg)' },
                { label: 'Co-founder Matches', value: '80+', color: 'var(--warn)', bg: 'var(--warn-bg)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: bg, border: `1px solid ${color}20` }}>
                  <p className="text-2xl font-bold font-numeric" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 7: // Media & Documents (active only)
        if (founderType === 'active') {
          return (
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                Media & Documents
              </h2>
              <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
                Upload your pitch deck so investors can review it.
              </p>
              <div className="space-y-4">
                <div className="p-5 rounded-xl" style={{ background: 'var(--surface-2)', border: '2px dashed var(--line)' }}>
                  <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>Pitch Deck (PDF)</p>
                  {pitchDeckFile ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(37,99,235,0.1)' }}>
                        <FileText className="w-5 h-5" style={{ color: 'var(--blue)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{pitchDeckFile.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted-2)' }}>{(pitchDeckFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button onClick={() => setPitchDeckFile(null)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ color: 'var(--neg)', background: 'rgba(239,68,68,0.1)' }}>Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      <input type="file" accept="application/pdf" className="hidden"
                        onChange={e => {
                          try {
                            const f = e.target.files?.[0]
                            if (!f) return
                            validateUploadedFile(f, {
                              maxBytes: 5 * 1024 * 1024,
                              allowedMimeTypes: ['application/pdf'],
                              allowedExtensions: ['pdf'],
                            })
                            setPitchDeckFile(f)
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : 'Invalid pitch deck')
                            e.target.value = ''
                          }
                        }} />
                      <FolderOpen className="w-8 h-8" style={{ color: 'var(--blue)' }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--blue)' }}>Click to upload PDF</span>
                      <span className="text-xs" style={{ color: 'var(--muted-2)' }}>Max 5MB</span>
                    </label>
                  )}
                </div>
                <div className="p-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <span className="text-xs" style={{ color: 'var(--blue)' }}>
                    💡 You can always upload or replace your pitch deck later from My Listing.
                  </span>
                </div>
              </div>
            </div>
          )
        }
        return null

      case 8: // Ready (active founders)
        return (
          <div className="text-center py-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--pos-bg)', border: '2px solid #BBF7D0' }}
            >
              <Rocket className="w-12 h-12" style={{ color: 'var(--pos)' }} />
            </div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: '2rem', color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              You're ready!
            </h2>
            <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              Your startup profile is set up. Head to your dashboard to review your listing and start connecting with investors.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8 text-center">
              {[
                { label: 'Active Investors', value: '200+', color: 'var(--blue)', bg: 'var(--blue-bg)' },
                { label: 'Avg. Response Time', value: '48h', color: 'var(--pos)', bg: 'var(--pos-bg)' },
                { label: 'Successful Intros', value: '1K+', color: 'var(--warn)', bg: 'var(--warn-bg)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: bg, border: `1px solid ${color}20` }}>
                  <p className="text-2xl font-bold font-numeric" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── Step 0: Role selection ───────────────────────────────────
  const renderRoleSelection = () => (
    <div className="text-center">
      <h2
        className="text-3xl font-bold mb-3"
        style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
      >
        Welcome to FounderCentral
      </h2>
      <p className="text-sm mb-10" style={{ color: 'var(--muted)' }}>
        Tell us how you'll be using the platform.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[
          {
            id: 'investor' as const,
            label: 'I am an Investor',
            desc: 'Angel, VC, Bank, NBFC, Family Office, or CVC',
            icon: TrendingUp,
            color: 'var(--blue)',
            textColor: 'var(--blue-h)',
            bg: 'var(--blue-bg)',
            border: 'var(--blue)',
          },
          {
            id: 'founder' as const,
            label: 'I am a Founder',
            desc: 'Active startup or idea-stage entrepreneur',
            icon: Rocket,
            color: 'var(--pos)',
            textColor: '#15803D',
            bg: 'var(--pos-bg)',
            border: 'var(--pos)',
          },
          {
            id: 'incubation' as const,
            label: 'I run an Incubation',
            desc: 'Accelerator, incubator, or university programme',
            icon: Building2,
            color: '#7C3AED',
            textColor: '#6D28D9',
            bg: '#F5F3FF',
            border: '#7C3AED',
          },
        ].map(opt => {
          const Icon = opt.icon
          const active = role === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => setRole(opt.id)}
              className="p-6 rounded-2xl text-center transition-all"
              style={{
                background: active ? opt.bg : 'var(--surface)',
                border: `2px solid ${active ? opt.border : 'var(--line)'}`,
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: active ? opt.bg : 'var(--bg)' }}
              >
                <Icon
                  className="w-7 h-7"
                  style={{ color: active ? opt.color : 'var(--muted-2)' }}
                />
              </div>
              <h3
                className="font-semibold mb-1.5"
                style={{ fontSize: '0.9rem', color: active ? opt.textColor : 'var(--ink)' }}
              >
                {opt.label}
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {opt.desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ─── Navigation handlers ──────────────────────────────────────
  const maxSteps = role === 'investor' ? 5 : role === 'incubation' ? 5 : founderType === 'active' ? 8 : 6

  const canProceed = (): boolean => {
    if (step === 0) return role !== null
    if (role === 'incubation') {
      if (step === 1) return incubationType !== null
      if (step === 2) {
        return (
          incubationData.name.trim().length > 0 &&
          incubationData.description.trim().length > 0 &&
          incubationData.sectors.length > 0
        )
      }
      if (step === 3) {
        return (
          incubationData.location.trim().length > 0 &&
          incubationData.city.trim().length > 0 &&
          incubationData.country.trim().length > 0
        )
      }
      return true
    }
    if (role === 'investor') {
      if (step === 1) return investorType !== null
      if (step === 2) {
        return (
          investorData.first_name.trim().length > 0 &&
          investorData.last_name.trim().length > 0 &&
          investorData.title.trim().length > 0 &&
          investorData.linkedin_url.trim().length > 0 &&
          investorData.location.trim().length > 0 &&
          investorData.bio.trim().length > 0
        )
      }
      if (step === 3) {
        return (
          investorData.sectors.length > 0 &&
          investorData.stage_preference.length > 0 &&
          investorData.geography.length > 0
        )
      }
      if (step === 4) {
        return (
          investorData.ticket_size_min.length > 0 &&
          investorData.ticket_size_max.length > 0
        )
      }
      return true
    }
    if (role === 'founder') {
      if (step === 1) return founderType !== null
      if (step === 2) {
        return (
          founderData.first_name.trim().length > 0 &&
          founderData.last_name.trim().length > 0 &&
          founderData.linkedin_url.trim().length > 0 &&
          founderData.bio.trim().length > 0
        )
      }
      if (step === 3 && founderType === 'idea') {
        return (
          founderData.idea_stage.length > 0 &&
          founderData.sector.length > 0 &&
          founderData.problem_statement.trim().length > 0
        )
      }
      if (step === 3 && founderType === 'active') {
        return (
          founderData.company_name.trim().length > 0 &&
          founderData.sector.length > 0 &&
          founderData.stage.length > 0
        )
      }
      if (step === 4 && founderType === 'idea') {
        return founderData.target_market.trim().length > 0
      }
      if (step === 5 && founderType === 'idea') {
        return founderData.support_needed.length > 0
      }
      return true
    }
    return true
  }

  const handleFinish = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      // ── Incubation path (step 5 = Done, submission already done in handleNext) ──
      if (role === 'incubation') {
        navigate('/dashboard/under-review')
        return
      }

      const sanitizedInvestorData = role === 'investor' ? getSanitizedInvestorData() : null
      const sanitizedFounderData = role === 'founder' ? getSanitizedFounderData() : null

      // Upload avatar (best-effort — don't block onboarding if it fails)
      let avatarPublicUrl: string | null = null
      if (avatarFile) try {
        validateUploadedFile(avatarFile, {
          maxBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        })
        const ext = avatarFile.type === 'image/jpeg' ? 'jpg' : avatarFile.name.split('.').pop()?.toLowerCase()
        const avatarPath = `${user.id}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(avatarPath, avatarFile, { upsert: true, contentType: avatarFile.type })
        if (uploadErr) {
          console.warn('Avatar upload failed:', uploadErr.message)
          toast.error('Avatar upload failed — you can update it later in Settings.')
        } else {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(avatarPath)
          avatarPublicUrl = publicUrl
          await supabase.from('profiles').update({ avatar_url: avatarPublicUrl }).eq('id', user.id)
        }
      } catch (avatarErr) {
        console.warn('Avatar upload error:', avatarErr)
        toast.error('Avatar upload failed — you can update it later in Settings.')
      }

      const investorProfileData =
        role === 'investor' && sanitizedInvestorData
          ? {
              sectors: sanitizedInvestorData.sectors,
              stage_preference: sanitizedInvestorData.stage_preference,
              geography: sanitizedInvestorData.geography,
              ticket_size_min: sanitizedInvestorData.ticket_size_min,
              ticket_size_max: sanitizedInvestorData.ticket_size_max,
              investment_thesis: sanitizedInvestorData.investment_thesis,
              title: sanitizedInvestorData.title,
              bio: sanitizedInvestorData.bio,
              linkedin_url: sanitizedInvestorData.linkedin_url,
              website_url: sanitizedInvestorData.website_url,
              location: sanitizedInvestorData.location,
              fund_name: sanitizedInvestorData.fund_name,
              fund_size_usd: sanitizedInvestorData.fund_size_usd,
              bank_name: sanitizedInvestorData.bank_name,
              nbfc_name: sanitizedInvestorData.nbfc_name,
              office_name: sanitizedInvestorData.office_name,
              parent_company: sanitizedInvestorData.parent_company,
              cvc_name: sanitizedInvestorData.cvc_name,
              lending_products: sanitizedInvestorData.lending_products,
              funding_types: sanitizedInvestorData.funding_types,
              risk_tolerance: sanitizedInvestorData.risk_tolerance,
              risk_appetite: sanitizedInvestorData.risk_appetite,
              co_investment_interest: sanitizedInvestorData.co_investment_interest,
              innovation_focus: sanitizedInvestorData.innovation_focus,
              partnership_types: sanitizedInvestorData.partnership_types,
              portfolio_count: sanitizedInvestorData.active_portfolio_count ?? undefined,
            }
          : undefined

      await saveStep('complete', { role, investorType, founderType })

      await completeOnboarding({
        role: role!,
        investorType: investorType ?? undefined,
        founderType: founderType ?? undefined,
        investorProfileData,
      })

      // Upsert founder_profiles with onboarding data so the listing is pre-populated
      if (role === 'founder') {
        if (!sanitizedFounderData) throw new Error('Invalid founder data')
        // Sync name + company back to profiles in case the user edited them
        await supabase.from('profiles').update({
          first_name: sanitizedFounderData.first_name || undefined,
          last_name: sanitizedFounderData.last_name || undefined,
          company: sanitizedFounderData.company_name || undefined,
        }).eq('id', user.id)

        const fp: Record<string, unknown> = {
          profile_id: user.id,
          founder_type: founderType ?? 'active',
          sector: sanitizedFounderData.sector || null,
          problem_statement: sanitizedFounderData.problem_statement || null,
          target_market: sanitizedFounderData.target_market || null,
          support_needed: sanitizedFounderData.support_needed,
          linkedin_url: sanitizedFounderData.linkedin_url || null,
          website: sanitizedFounderData.website_url || null,
          bio: sanitizedFounderData.bio || null,
          updated_at: new Date().toISOString(),
        }

        if (founderType === 'active') {
          fp.company_name = sanitizedFounderData.company_name || null
          fp.stage = sanitizedFounderData.stage || null
          fp.arr = sanitizedFounderData.arr_usd ? String(sanitizedFounderData.arr_usd) : null
          fp.mom_growth = sanitizedFounderData.growth_rate_pct ? `${sanitizedFounderData.growth_rate_pct}%` : null
          fp.raise_amount = sanitizedFounderData.funding_ask_usd ? String(sanitizedFounderData.funding_ask_usd) : null
          fp.team_size = sanitizedFounderData.team_size
          fp.founded_year = sanitizedFounderData.founded_year
          fp.funding_purpose = sanitizedFounderData.use_of_funds || null
          fp.bio = sanitizedFounderData.pitch_overview || sanitizedFounderData.bio || null
          fp.problem_statement = sanitizedFounderData.problem_statement || null
          fp.target_market = sanitizedFounderData.target_market || null

          // Upload pitch deck if provided. Store the STORAGE PATH (not a
          // publicUrl) so downstream code can call createSignedUrl() against
          // the private pitch-decks bucket.
          if (pitchDeckFile) {
            validateUploadedFile(pitchDeckFile, {
              maxBytes: 5 * 1024 * 1024,
              allowedMimeTypes: ['application/pdf'],
              allowedExtensions: ['pdf'],
            })
            const deckPath = `${user.id}/pitch-deck-${Date.now()}.pdf`
            const { error: deckErr } = await supabase.storage
              .from('pitch-decks')
              .upload(deckPath, pitchDeckFile, { upsert: true, contentType: 'application/pdf' })
            if (!deckErr) {
              fp.pitch_deck_url = deckPath
            }
          }
        } else {
          fp.idea_title = sanitizedFounderData.idea_title || null
          fp.idea_stage = sanitizedFounderData.idea_stage || null
        }

        const { error: fpError } = await supabase
          .from('founder_profiles')
          .upsert(fp, { onConflict: 'profile_id' })
        if (fpError) {
          // This is the path that used to silently eat errors, land the
          // user on /dashboard with a broken listing, and leave them with
          // no way forward. Fail loud instead.
          throw new Error(`Couldn't save your listing: ${fpError.message}`)
        }

        // Active founders submit a startup_applications row for admin review.
        // "Idea" founders have no company yet and skip this step — they'll
        // create an application later from /dashboard/my-listing.
        if (founderType === 'active' && sanitizedFounderData.company_name) {
          const appPayload = {
            founder_id:      user.id,
            company_name:    sanitizedFounderData.company_name,
            website:         sanitizedFounderData.website_url ?? null,
            sector:          sanitizedFounderData.sector || null,
            country:         'India',
            founded_year:    sanitizedFounderData.founded_year ?? null,
            stage:           sanitizedFounderData.stage || null,
            description:     sanitizedFounderData.pitch_overview ?? sanitizedFounderData.bio ?? null,
            arr_usd:         sanitizedFounderData.arr_usd ?? null,
            growth_rate_pct: sanitizedFounderData.growth_rate_pct ?? null,
            funding_ask_usd: sanitizedFounderData.funding_ask_usd ?? null,
            funding_round:   sanitizedFounderData.stage || null,
            use_of_funds:    sanitizedFounderData.use_of_funds ?? null,
            team_size:       sanitizedFounderData.team_size ?? null,
            deck_path:       pitchDeckFile ? (fp.pitch_deck_url as string | null) : null,
            status:          'submitted',
            submitted_at:    new Date().toISOString(),
            updated_at:      new Date().toISOString(),
          }

          // Re-submit to the same row if the founder is resubmitting after
          // edits; otherwise create a new application for admin review.
          const { data: existing } = await supabase
            .from('startup_applications')
            .select('id')
            .eq('founder_id', user.id)
            .in('status', ['draft', 'submitted', 'under_review'])
            .limit(1)
            .maybeSingle()

          const appOp = existing
            ? supabase.from('startup_applications').update(appPayload).eq('id', existing.id)
            : supabase.from('startup_applications').insert(appPayload)

          const { error: appError } = await appOp
          if (appError) {
            // Surface but don't block: the founder_profiles row is already
            // saved, so the user's listing exists — the admin queue entry
            // is a secondary artifact we can reconcile from My Listing.
            console.error('[onboarding] startup_applications insert failed:', appError.message)
            toast.error(`Listing saved, but admin review entry failed: ${appError.message}. Open Settings → My Listing → Resubmit to retry.`)
          }
        }
      }

      // Submit investor_applications row for admin review (investors)
      if (role === 'investor' && sanitizedInvestorData) {
        const invAppPayload = {
          investor_id:      user.id,
          fund_name:        sanitizedInvestorData.fund_name ?? null,
          title:            sanitizedInvestorData.title ?? null,
          bio:              sanitizedInvestorData.bio ?? null,
          sectors:          sanitizedInvestorData.sectors ?? [],
          stage_preference: sanitizedInvestorData.stage_preference ?? [],
          geography:        sanitizedInvestorData.geography ?? [],
          ticket_size_min:  sanitizedInvestorData.ticket_size_min ?? null,
          ticket_size_max:  sanitizedInvestorData.ticket_size_max ?? null,
          investment_thesis: sanitizedInvestorData.investment_thesis ?? null,
          location:         sanitizedInvestorData.location ?? null,
          linkedin_url:     sanitizedInvestorData.linkedin_url ?? null,
          website_url:      sanitizedInvestorData.website_url ?? null,
          portfolio_count:  sanitizedInvestorData.active_portfolio_count ?? null,
          status:           'submitted',
          submitted_at:     new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        }

        const { data: existingInvApp } = await supabase
          .from('investor_applications')
          .select('id')
          .eq('investor_id', user.id)
          .in('status', ['draft', 'submitted', 'under_review'])
          .limit(1)
          .maybeSingle()

        const invAppOp = existingInvApp
          ? supabase.from('investor_applications').update(invAppPayload).eq('id', existingInvApp.id)
          : supabase.from('investor_applications').insert(invAppPayload)

        const { error: invAppError } = await invAppOp
        if (invAppError) {
          console.error('[onboarding] investor_applications insert failed:', invAppError.message)
          toast.error(`Profile saved, but admin review entry failed: ${invAppError.message}. Please contact support.`)
        }
      }

      // Clear partial progress now that onboarding is complete
      await supabase.from('profiles').update({ onboarding_partial: null }).eq('id', user.id)

      toast.success('Your profile has been submitted for review. You\'ll be notified once approved.')
      navigate('/dashboard/under-review')
    } catch (err) {
      console.error('[handleFinish] error:', err)
      const msg = err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepLabels =
    role === 'investor'
      ? investorStepLabels
      : role === 'incubation'
        ? incubationStepLabels
        : founderType === 'active'
          ? activeFounderStepLabels
          : ideaFounderStepLabels

  const isLastStep = step === maxSteps

  return (
    <div className="marketing-page min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-center py-6 px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="FounderCentral" className="h-7 w-7 object-contain rounded-lg" />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            FounderCentral
          </h1>
        </div>
      </div>

      {/* Resume banner */}
      {partialProgress && step === 0 && (
        <div className="mx-6 mb-4 px-5 py-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: 'var(--blue-bg)', border: '1px solid #BFDBFE' }}
        >
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              You have incomplete onboarding progress
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Saved {new Date(partialProgress.savedAt).toLocaleDateString()} — pick up where you left off.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleContinue}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 6 }}
            >
              Continue
            </button>
            <button
              onClick={handleStartFresh}
              className="px-4 py-1.5 text-xs font-medium transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)', borderRadius: 6 }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      {role && step > 0 && (
        <div className="px-6 mb-5">
          <StepProgress steps={stepLabels} current={step} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-2">
        <div className="w-full max-w-2xl">
          <div
            className="rounded-2xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              padding: '10px 24px 16px 24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${step}-${role}-${founderType}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && renderRoleSelection()}
                {role === 'investor' && step > 0 && renderInvestorStep()}
                {role === 'founder' && step > 0 && renderFounderStep()}
                {role === 'incubation' && step > 0 && renderIncubationStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div
              className="flex items-center justify-between mt-2 pt-2"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <button
                onClick={handleBack}
                disabled={step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)}
                className="flex items-center gap-2 px-4 text-sm font-medium transition-all"
                style={{
                  height: 40,
                  background: (step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)) ? 'transparent' : 'var(--surface)',
                  border: `1.5px solid ${(step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)) ? 'transparent' : 'var(--line)'}`,
                  borderRadius: 8,
                  color: (step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)) ? 'transparent' : 'var(--muted)',
                  cursor: (step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)) ? 'default' : 'pointer',
                  pointerEvents: (step === 0 || (role === 'incubation' && step === 5) || (fromInvite && step === 1)) ? 'none' : 'auto',
                }}
                onMouseEnter={e => {
                  const canGoBack = step > 0 && !(role === 'incubation' && step === 5) && !(fromInvite && step === 1)
                  if (canGoBack) {
                    e.currentTarget.style.borderColor = 'var(--faint)'
                    e.currentTarget.style.color = 'var(--ink)'
                  }
                }}
                onMouseLeave={e => {
                  const canGoBack = step > 0 && !(role === 'incubation' && step === 5) && !(fromInvite && step === 1)
                  if (canGoBack) {
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.color = 'var(--muted)'
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {isLastStep ? (
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 text-sm font-semibold transition-all"
                  style={{
                    height: 44,
                    background: isSubmitting ? 'rgba(37,99,235,0.5)' : 'var(--blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background 150ms ease, transform 150ms ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting) e.currentTarget.style.background = 'var(--blue-h)'
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting) e.currentTarget.style.background = 'var(--blue)'
                  }}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Go to Dashboard'
                  )}
                  {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-6 text-sm font-semibold transition-all"
                  style={{
                    height: 44,
                    background: isSubmitting ? 'rgba(37,99,235,0.5)' : 'var(--blue)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: (!canProceed() || isSubmitting) ? 'not-allowed' : 'pointer',
                    opacity: !canProceed() ? 0.4 : 1,
                    transition: 'background 150ms ease, opacity 150ms ease, transform 150ms ease',
                  }}
                  onMouseEnter={e => {
                    if (canProceed() && !isSubmitting) e.currentTarget.style.background = 'var(--blue-h)'
                  }}
                  onMouseLeave={e => {
                    if (canProceed() && !isSubmitting) e.currentTarget.style.background = 'var(--blue)'
                  }}
                >
                  {isSubmitting && role === 'incubation' && step === 4 ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : role === 'incubation' && step === 4 ? (
                    <>Submit Application <ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
