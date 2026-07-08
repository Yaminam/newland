import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/app/lib/supabase'
import type { AccessRole, IncubationProfile, IncubationType, Profile } from '@/app/lib/types'
import { normalizeAvatarUrl } from '@/app/lib/avatarUrl'
import {
  SESSION_IDLE_TIMEOUT_MS,
  assertLoginAllowed,
  assertSignupAllowed,
  clearLoginFailures,
  clearSignupAttempts,
  isEmailVerified,
  normalizeEmail,
  recordLoginFailure,
  recordSignupAttempt,
} from '@/app/lib/authSecurity'
import { logSecurityEvent } from '@/app/lib/securityEvents'
import { cacheClear } from '@/app/lib/queryCache'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  accessRole: AccessRole
  isIncubationAdmin: boolean
  incubationProfile: IncubationProfile | null
  pendingVerificationEmail: string | null
  isAuthenticated: boolean
  onboardingCompleted: boolean
  profileApproved: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  sendOtp: (email: string, allowCreate?: boolean) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string, company: string) => Promise<{
    requiresEmailVerification: boolean
    email: string
  }>
  logout: () => Promise<void>
  completeOnboarding: (data: {
    role: 'investor' | 'founder'
    investorType?: string
    founderType?: string
    investorProfileData?: Record<string, unknown>
  }) => Promise<void>
  completeIncubationOnboarding: (data: {
    incubationType: IncubationType
    name: string
    description?: string
    websiteUrl?: string
    linkedinUrl?: string
    location?: string
    city?: string
    country?: string
    sectors: string[]
    cohortSize?: number
  }) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accessRole, setAccessRole] = useState<AccessRole>('user')
  const [incubationProfile, setIncubationProfile] = useState<IncubationProfile | null>(null)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const ensuredProfileIdsRef = useRef<Set<string>>(new Set())
  const failedEnsureProfileIdsRef = useRef<Set<string>>(new Set())

  const deriveProfileSeed = useCallback((nextUser: User) => {
    const metadata = nextUser.user_metadata ?? {}
    const fullName = typeof metadata.full_name === 'string'
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string'
        ? metadata.name.trim()
        : ''
    const nameParts = fullName ? fullName.split(/\s+/) : []
    const firstName = typeof metadata.first_name === 'string'
      ? metadata.first_name.trim()
      : nameParts[0] ?? ''
    const lastName = typeof metadata.last_name === 'string'
      ? metadata.last_name.trim()
      : nameParts.slice(1).join(' ')

    return {
      email: nextUser.email ?? '',
      first_name: firstName,
      last_name: lastName,
      company: typeof metadata.company === 'string' ? metadata.company.trim() : null,
      avatar_url:
        typeof metadata.avatar_url === 'string' ? metadata.avatar_url :
        typeof metadata.picture === 'string' ? metadata.picture :
        typeof metadata.avatar === 'string' ? metadata.avatar :
        null,
    }
  }, [])

  const ensureProfile = useCallback(async (nextUser: User) => {
    if (ensuredProfileIdsRef.current.has(nextUser.id) || failedEnsureProfileIdsRef.current.has(nextUser.id)) {
      return
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', nextUser.id)
      .maybeSingle()

    if (existingProfileError) {
      failedEnsureProfileIdsRef.current.add(nextUser.id)
      console.error('[AuthProvider] Failed to check existing profile row for OAuth/session user', {
        userId: nextUser.id,
        message: existingProfileError.message,
      })
      return
    }

    if (existingProfile?.id) {
      ensuredProfileIdsRef.current.add(nextUser.id)
      failedEnsureProfileIdsRef.current.delete(nextUser.id)
      return
    }

    const profileSeed = deriveProfileSeed(nextUser)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: nextUser.id,
        email: profileSeed.email,
        first_name: profileSeed.first_name,
        last_name: profileSeed.last_name,
        company: profileSeed.company,
        avatar_url: profileSeed.avatar_url,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (error) {
      failedEnsureProfileIdsRef.current.add(nextUser.id)
      console.error('[AuthProvider] Failed to ensure profile row for OAuth/session user', {
        userId: nextUser.id,
        message: error.message,
      })
      return
    }

    ensuredProfileIdsRef.current.add(nextUser.id)
    failedEnsureProfileIdsRef.current.delete(nextUser.id)
  }, [deriveProfileSeed])

  const fetchIncubationProfile = useCallback(async (incubationId: string) => {
    const { data } = await supabase
      .from('incubation_profiles')
      .select('id, owner_id, name, incubation_type, description, website_url, linkedin_url, location, city, country, logo_url, sectors, cohort_size, total_startups, is_verified, verified_at, created_at, updated_at')
      .eq('id', incubationId)
      .maybeSingle()
    setIncubationProfile(data as IncubationProfile | null)
  }, [])

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, company, role, access_role, investor_type, founder_type, incubation_id, onboarding_completed, profile_approved, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      // Normalize legacy avatar URLs at the source so every consumer of
      // profile.avatar_url gets a browser-loadable URL (fixes /object/avatars/
      // and /object/public/avatars/avatars/ legacy shapes).
      const nextProfile = {
        ...(data as Profile),
        avatar_url: normalizeAvatarUrl((data as Profile).avatar_url ?? null) ?? undefined,
      } as Profile
      setProfile(nextProfile)
      setAccessRole(nextProfile.access_role ?? 'user')
      if (nextProfile.incubation_id) {
        // Fire without awaiting — incubation data is display-only and
        // doesn't block routing decisions, so we can load it in parallel.
        void fetchIncubationProfile(nextProfile.incubation_id)
      } else {
        setIncubationProfile(null)
      }
    } else {
      setProfile(null)
      setAccessRole('user')
      setIncubationProfile(null)
    }
    return data as Profile | null
  }, [fetchIncubationProfile])

  useEffect(() => {
    async function applySession(session: { user: User } | null) {
      const nextUser = session?.user ?? null

      if (nextUser && !isEmailVerified(nextUser)) {
        setPendingVerificationEmail(nextUser.email ?? null)
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setAccessRole('user')
        setIsLoading(false)
        return
      }

      if (nextUser) {
        setPendingVerificationEmail(null)
        // Fetch profile first. For returning users (the common case) this is
        // all we need — skips the extra ensureProfile SELECT round-trip.
        // Only fall back to ensureProfile when the profile row is missing
        // (e.g. first-time OAuth sign-in where the trigger hasn't run yet).
        const existingProfile = await fetchProfile(nextUser.id)
        if (!existingProfile) {
          await ensureProfile(nextUser)
          await fetchProfile(nextUser.id)
        }
        // Set user AFTER profile is loaded to avoid a flash where
        // ProtectedRoute sees user but no profile/onboarding status.
        setUser(nextUser)
      } else {
        setUser(null)
        setProfile(null)
        setAccessRole('user')
        ensuredProfileIdsRef.current.clear()
        failedEnsureProfileIdsRef.current.clear()
      }
      setIsLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session as { user: User } | null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // When the user clicks a password-reset link, Supabase fires a
      // PASSWORD_RECOVERY event. If the redirect URL wasn't in the
      // allowed list the user may have landed on "/" or "/auth/login"
      // instead of "/auth/reset-password". Redirect them immediately
      // so they see the "set new password" form instead of being
      // bounced to the dashboard as an authenticated user.
      if (event === 'PASSWORD_RECOVERY') {
        const onResetPage = window.location.pathname === '/auth/reset-password'
        if (!onResetPage) {
          window.location.replace('/auth/reset-password')
          return           // skip applySession — full page load handles it
        }
      }
      void applySession(session as { user: User } | null)
    })

    return () => subscription.unsubscribe()
  }, [ensureProfile, fetchProfile])

  const login = async (email: string, password: string) => {
    const normalizedEmail = normalizeEmail(email)
    logSecurityEvent({ type: 'auth_login_attempt', email: normalizedEmail })
    assertLoginAllowed(normalizedEmail)

    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    if (error) {
      recordLoginFailure(normalizedEmail)
      logSecurityEvent({ type: 'auth_login_failure', outcome: 'failure', email: normalizedEmail, message: error.message })
      throw new Error('Invalid email or password.')
    }

    if (!isEmailVerified(data.user)) {
      await supabase.auth.signOut()
      logSecurityEvent({ type: 'auth_login_failure', outcome: 'failure', email: normalizedEmail, userId: data.user?.id, message: 'Email not verified' })
      throw new Error('Please verify your email before signing in.')
    }

    clearLoginFailures(normalizedEmail)
    logSecurityEvent({ type: 'auth_login_success', outcome: 'success', email: normalizedEmail, userId: data.user.id })

    // Eagerly load the profile so the caller can navigate immediately
    // without waiting for the onAuthStateChange listener.
    await ensureProfile(data.user)
    await fetchProfile(data.user.id)
    setUser(data.user)
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, company: string) => {
    const normalizedEmail = normalizeEmail(email)
    logSecurityEvent({ type: 'auth_signup_attempt', email: normalizedEmail })
    assertSignupAllowed(normalizedEmail)
    recordSignupAttempt(normalizedEmail)
    const appUrl = import.meta.env.VITE_APP_URL as string | undefined
    if (!appUrl && import.meta.env.PROD) {
      throw new Error('VITE_APP_URL must be set in production')
    }
    const redirectBase = appUrl ?? window.location.origin
    // Store pendingRole in user_metadata so onboarding can read it even
    // if the user verifies email on a different device/browser where
    // localStorage won't have cc:pendingRole.
    const pendingRole = typeof window !== 'undefined'
      ? localStorage.getItem('cc:pendingRole')
      : null
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { firstName, lastName, company, ...(pendingRole ? { pendingRole } : {}) },
        emailRedirectTo: `${redirectBase}/dashboard`,
      },
    })
    if (error) {
      logSecurityEvent({ type: 'auth_signup_failure', outcome: 'failure', email: normalizedEmail, message: error.message })
      throw error
    }
    clearSignupAttempts(normalizedEmail)
    const requiresEmailVerification = !isEmailVerified(data.user)
    if (requiresEmailVerification) {
      setPendingVerificationEmail(normalizedEmail)
    }
    logSecurityEvent({ type: 'auth_signup_success', outcome: 'success', email: normalizedEmail, userId: data.user?.id ?? undefined })
    return {
      requiresEmailVerification,
      email: normalizedEmail,
    }
  }

  const sendOtp = async (email: string, allowCreate = false) => {
    const normalizedEmail = normalizeEmail(email)
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: allowCreate },
    })
    if (error) throw new Error(error.message || 'Failed to send verification code.')
  }

  const verifyOtp = async (email: string, token: string) => {
    const normalizedEmail = normalizeEmail(email)
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    })
    if (error) throw new Error(error.message || 'Invalid verification code.')

    if (data.user) {
      await ensureProfile(data.user)
      await fetchProfile(data.user.id)
      setUser(data.user)
    }
  }

  const loginWithGoogle = async () => {
    const appUrl = import.meta.env.VITE_APP_URL as string | undefined
    const redirectBase = appUrl ?? window.location.origin

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectBase}/dashboard`,
      },
    })

    if (error) {
      throw new Error(error.message || 'Google sign-in failed.')
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setIncubationProfile(null)
    setPendingVerificationEmail(null)
    ensuredProfileIdsRef.current.clear()
    failedEnsureProfileIdsRef.current.clear()
    sessionStorage.clear()
    cacheClear()   // wipe all query cache so next user gets fresh data
  }

  useEffect(() => {
    if (!user) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const resetIdleTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        void supabase.auth.signOut()
      }, SESSION_IDLE_TIMEOUT_MS)
    }

    const activityEvents: Array<keyof WindowEventMap> = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach(eventName => window.addEventListener(eventName, resetIdleTimer, { passive: true }))
    resetIdleTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      activityEvents.forEach(eventName => window.removeEventListener(eventName, resetIdleTimer))
    }
  }, [user])

  const completeOnboarding = async (data: {
    role: 'investor' | 'founder'
    investorType?: string
    founderType?: string
    investorProfileData?: Record<string, unknown>
  }) => {
    if (!user) throw new Error('User session not found. Please log in again.')

    // 1. Update the profile row (upsert handles the rare case where the trigger-created row is missing)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        role: data.role,
        investor_type: data.investorType ?? null,
        founder_type: data.founderType ?? null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      throw new Error('Failed to save profile. Please try again.')
    }

    // 2. Upsert investor profile data (non-fatal if it fails)
    if (data.role === 'investor' && data.investorProfileData) {
      // Allowlist prevents arbitrary column injection from client-supplied
      // data. Must match the ACTUAL column names on public.investor_profiles
      // — an earlier version of this list used a planned-but-never-shipped
      // rename (investment_stages / geographies / check_min / check_max / ...)
      // which silently stripped every onboarding payload, so the Investor
      // Profile page always rendered empty after signup.
      const ALLOWED_INVESTOR_FIELDS = [
        'title', 'bio', 'linkedin_url', 'website_url', 'location',
        'fund_name', 'bank_name', 'nbfc_name', 'office_name',
        'parent_company', 'cvc_name',
        'sectors', 'stage_preference', 'geography',
        'ticket_size_min', 'ticket_size_max', 'investment_thesis',
        'lending_products', 'funding_types', 'risk_tolerance', 'risk_appetite',
        'co_investment_interest', 'innovation_focus', 'partnership_types',
        'portfolio_count', 'fund_size_usd',
      ] as const

      const safeInvestorData = Object.fromEntries(
        Object.entries(data.investorProfileData).filter(([k]) =>
          (ALLOWED_INVESTOR_FIELDS as readonly string[]).includes(k)
        )
      )

      const { error: invError } = await supabase
        .from('investor_profiles')
        .upsert({
          user_id: user.id,
          ...safeInvestorData,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (invError) {
        // Do not surface internal DB error details to the user
        console.warn('[completeOnboarding] investor_profiles upsert failed')
      }
    }

    // 3. Refresh the in-memory profile so ProtectedRoute unlocks
    await fetchProfile(user.id)

    // 4. Fire welcome email (fire-and-forget — never blocks UI)
    void supabase.functions.invoke('notify-self', {
      body: { type: 'welcome' },
    }).catch(err => console.warn('[completeOnboarding] welcome email skipped:', err))
  }

  const completeIncubationOnboarding = async (data: {
    incubationType: IncubationType
    name: string
    description?: string
    websiteUrl?: string
    linkedinUrl?: string
    location?: string
    city?: string
    country?: string
    sectors: string[]
    cohortSize?: number
  }) => {
    if (!user) throw new Error('User session not found. Please log in again.')

    // Single atomic RPC: inserts incubation_profiles AND elevates the
    // profile role/access_role in one transaction (SECURITY DEFINER).
    const { error: rpcError } = await supabase.rpc(
      'complete_incubation_onboarding',
      {
        p_incubation_type: data.incubationType,
        p_name:            data.name.trim(),
        p_description:     data.description?.trim() ?? null,
        p_website_url:     data.websiteUrl?.trim() ?? null,
        p_linkedin_url:    data.linkedinUrl?.trim() ?? null,
        p_location:        data.location?.trim() ?? null,
        p_city:            data.city?.trim() ?? null,
        p_country:         data.country?.trim() ?? null,
        p_sectors:         data.sectors,
        p_cohort_size:     data.cohortSize ?? null,
      }
    )

    if (rpcError) {
      console.error('[completeIncubationOnboarding] error:', rpcError)
      throw new Error(`Failed to save profile. Please try again. (${rpcError.code})`)
    }

    // Refresh in-memory profile
    await fetchProfile(user.id)

    // Welcome email (fire-and-forget)
    void supabase.functions.invoke('notify-self', {
      body: { type: 'welcome' },
    }).catch(err => console.warn('[completeIncubationOnboarding] welcome email skipped:', err))
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    // Allowlist prevents client from writing privileged columns such as `role`
    const ALLOWED_PROFILE_FIELDS: (keyof Profile)[] = [
      'first_name', 'last_name', 'company', 'avatar_url',
    ]
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) =>
        ALLOWED_PROFILE_FIELDS.includes(k as keyof Profile)
      )
    )

    const { error } = await supabase
      .from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (error) throw error
    await fetchProfile(user.id)
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const contextValue = useMemo(() => ({
    user,
    profile,
    accessRole,
    isIncubationAdmin: accessRole === 'incubation_admin',
    incubationProfile,
    pendingVerificationEmail,
    isAuthenticated: !!user && isEmailVerified(user),
    onboardingCompleted: profile?.onboarding_completed ?? false,
    profileApproved: profile?.profile_approved ?? false,
    isLoading,
    login,
    loginWithGoogle,
    sendOtp,
    verifyOtp,
    register,
    logout,
    completeOnboarding,
    completeIncubationOnboarding,
    updateProfile,
    refreshProfile,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, accessRole, incubationProfile, pendingVerificationEmail, isLoading])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
