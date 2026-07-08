import { useState, useEffect } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { normalizeAvatarUrl } from '@/app/lib/avatarUrl'
import {
  User, Save, Upload, Check, Sparkles, Clock, Briefcase, Globe,
  Linkedin, Target, DollarSign, MapPin, Layers,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import {
  parseOptionalInteger,
  parseOptionalNumber,
  sanitizeOptionalText,
  sanitizeStringArray,
  sanitizeText,
  sanitizeUrl,
  validateUploadedFile,
} from '@/app/lib/inputSecurity'
import { toast } from 'sonner'

const SECTORS = ['AI/ML', 'FinTech', 'HealthTech', 'SaaS', 'CleanTech', 'EdTech', 'AgriTech', 'DeepTech', 'Consumer', 'E-Commerce', 'Web3/Crypto', 'Cybersecurity', 'Logistics', 'HRTech', 'LegalTech', 'PropTech', 'SpaceTech', 'BioTech', 'Gaming', 'Media']
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth']
const GEOGRAPHIES = ['India', 'Southeast Asia', 'USA', 'Europe', 'Middle East', 'Africa', 'Latin America', 'Global', 'APAC']

interface InvestorPrefs {
  user_id: string
  sectors: string[]
  stage_preference: string[]
  geography: string[]
  ticket_size_min?: string
  ticket_size_max?: string
  investment_thesis?: string
  fund_name?: string
  title?: string
  portfolio_count?: number
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1.5px solid var(--line)',
  color: 'var(--ink)',
}

// ─── ChipSelect ──────────────────────────────────────────────────────────────

function ChipSelect({ options, selected, onChange, label, icon: Icon }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void; label: string; icon?: React.ElementType
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />}
          <label
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--muted-2)' }}
          >
            {label}
          </label>
        </div>
        <span className="text-[11px] font-medium" style={{ color: 'var(--muted-2)' }}>
          {selected.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
              className="px-3 py-1.5 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: active ? 'var(--blue)' : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--muted)',
                border: `1.5px solid ${active ? 'var(--blue)' : 'var(--line)'}`,
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string; icon?: React.ElementType; children: React.ReactNode
}) {
  return (
    <div
      className="p-5 sm:p-6 space-y-5"
      style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--blue-bg)' }}
          >
            <Icon className="w-4 h-4" style={{ color: 'var(--blue)' }} />
          </div>
        )}
        <h3 className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function InvestorProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [tab, setTab] = useState<'profile' | 'preferences'>('profile')

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [company, setCompany] = useState(profile?.company ?? '')
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [prefs, setPrefs] = useState<InvestorPrefs>({
    user_id: profile?.id ?? '',
    sectors: [], stage_preference: [], geography: [],
    ticket_size_min: '', ticket_size_max: '', investment_thesis: '', fund_name: '', title: '', portfolio_count: 0,
  })
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name)
      setLastName(profile.last_name)
      setCompany(profile.company ?? '')
      fetchPrefs()
    }
  }, [profile])

  async function fetchPrefs() {
    setLoadingPrefs(true)
    try {
      const { data } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', profile!.id)
        .maybeSingle()
      if (data) {
        setPrefs({ ...data })
        setBio(data.bio ?? '')
        setLinkedin(data.linkedin_url ?? '')
        setWebsite(data.website_url ?? '')
        setIsVerified(data.is_verified ?? false)
        setPendingChanges(data.pending_changes ?? null)
      }
    } catch {
      // No prefs yet is fine
    } finally {
      setLoadingPrefs(false)
    }
  }

  async function saveProfile() {
    if (!profile) return
    setSavingProfile(true)
    try {
      const sanitizedFirstName = sanitizeText(firstName, { maxLength: 100, allowEmpty: false })
      const sanitizedLastName = sanitizeText(lastName, { maxLength: 100, allowEmpty: false })
      const sanitizedCompany = sanitizeOptionalText(company, { maxLength: 160 })
      const sanitizedBio = sanitizeOptionalText(bio, { maxLength: 2000, multiline: true })
      const sanitizedLinkedin = sanitizeUrl(linkedin)
      const sanitizedWebsite = sanitizeUrl(website)

      if (isVerified) {
        const changes = {
          first_name: sanitizedFirstName, last_name: sanitizedLastName,
          company: sanitizedCompany, bio: sanitizedBio,
          linkedin_url: sanitizedLinkedin, website_url: sanitizedWebsite,
        }
        const { error: pendingErr } = await supabase
          .from('investor_profiles')
          .update({ pending_changes: changes, updated_at: new Date().toISOString() })
          .eq('user_id', profile.id)
        if (pendingErr) throw pendingErr

        const appPayload = {
          investor_id: profile.id,
          fund_name: prefs.fund_name ?? null, title: prefs.title ?? null,
          bio: sanitizedBio, sectors: prefs.sectors ?? [],
          stage_preference: prefs.stage_preference ?? [], geography: prefs.geography ?? [],
          ticket_size_min: prefs.ticket_size_min ? Number(prefs.ticket_size_min) : null,
          ticket_size_max: prefs.ticket_size_max ? Number(prefs.ticket_size_max) : null,
          investment_thesis: prefs.investment_thesis ?? null,
          linkedin_url: sanitizedLinkedin, website_url: sanitizedWebsite,
          status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }

        const { data: existing } = await supabase
          .from('investor_applications').select('id')
          .eq('investor_id', profile.id).in('status', ['draft', 'submitted', 'under_review'])
          .limit(1).maybeSingle()

        const appOp = existing
          ? supabase.from('investor_applications').update(appPayload).eq('id', existing.id)
          : supabase.from('investor_applications').insert(appPayload)
        await appOp

        setPendingChanges(changes)
        toast.success('Changes submitted for review.')
      } else {
        const { error } = await supabase.from('profiles').update({
          first_name: sanitizedFirstName, last_name: sanitizedLastName,
          company: sanitizedCompany, bio: sanitizedBio, updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
        if (error) throw error

        const { error: prefErr } = await supabase.from('investor_profiles').upsert({
          user_id: profile.id, bio: sanitizedBio,
          linkedin_url: sanitizedLinkedin, website_url: sanitizedWebsite,
        }, { onConflict: 'user_id' })
        if (prefErr) throw prefErr
        toast.success('Profile updated')
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function uploadAvatar(file: File) {
    if (!profile) return
    setAvatarUploading(true)
    try {
      validateUploadedFile(file, {
        maxBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
      const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      }
      const fileExt = extensionMap[file.type] ?? file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const storagePath = `${profile.id}/avatar.${fileExt}`
      // Remove the existing file first so we only need the INSERT policy (not UPDATE).
      // Ignore errors — the file simply may not exist yet.
      await supabase.storage.from('avatars').remove([storagePath])
      const { error: uploadErr } = await supabase.storage
        .from('avatars').upload(storagePath, file, { contentType: file.type })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(storagePath)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      const { error } = await supabase.from('profiles').update({ avatar_url: bustedUrl }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Avatar updated')
    } catch {
      toast.error('Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  async function savePrefs() {
    if (!profile) return
    setSavingPrefs(true)
    try {
      const sanitizedPrefs = {
        user_id: profile.id,
        sectors: sanitizeStringArray(prefs.sectors.filter(value => SECTORS.includes(value))),
        stage_preference: sanitizeStringArray(prefs.stage_preference.filter(value => STAGES.includes(value))),
        geography: sanitizeStringArray(prefs.geography.filter(value => GEOGRAPHIES.includes(value))),
        ticket_size_min: parseOptionalNumber(prefs.ticket_size_min),
        ticket_size_max: parseOptionalNumber(prefs.ticket_size_max),
        investment_thesis: sanitizeOptionalText(prefs.investment_thesis, { maxLength: 2000, multiline: true }),
        fund_name: sanitizeOptionalText(prefs.fund_name, { maxLength: 160 }),
        title: sanitizeOptionalText(prefs.title, { maxLength: 120 }),
        portfolio_count: parseOptionalInteger(prefs.portfolio_count ?? null) ?? 0,
      }

      if (isVerified) {
        const { user_id: _uid, ...prefsChanges } = sanitizedPrefs
        const existingPending = pendingChanges ?? {}
        const mergedChanges = { ...existingPending, ...prefsChanges }

        const { error: pendingErr } = await supabase
          .from('investor_profiles')
          .update({ pending_changes: mergedChanges, updated_at: new Date().toISOString() })
          .eq('user_id', profile.id)
        if (pendingErr) throw pendingErr

        const appPayload = {
          investor_id: profile.id, fund_name: sanitizedPrefs.fund_name, title: sanitizedPrefs.title,
          bio: bio || null, sectors: sanitizedPrefs.sectors,
          stage_preference: sanitizedPrefs.stage_preference, geography: sanitizedPrefs.geography,
          ticket_size_min: sanitizedPrefs.ticket_size_min, ticket_size_max: sanitizedPrefs.ticket_size_max,
          investment_thesis: sanitizedPrefs.investment_thesis,
          linkedin_url: linkedin || null, website_url: website || null,
          portfolio_count: sanitizedPrefs.portfolio_count,
          status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }

        const { data: existing } = await supabase
          .from('investor_applications').select('id')
          .eq('investor_id', profile.id).in('status', ['draft', 'submitted', 'under_review'])
          .limit(1).maybeSingle()

        const appOp = existing
          ? supabase.from('investor_applications').update(appPayload).eq('id', existing.id)
          : supabase.from('investor_applications').insert(appPayload)
        await appOp

        setPendingChanges(mergedChanges)
        toast.success('Changes submitted for review.')
      } else {
        const { error } = await supabase.from('investor_profiles').upsert(sanitizedPrefs, { onConflict: 'user_id' })
        if (error) throw error
        toast.success('Preferences saved')
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed')
    } finally {
      setSavingPrefs(false)
    }
  }

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()
  const tabs = [
    { value: 'profile' as const, label: 'Public Profile' },
    { value: 'preferences' as const, label: 'Investment Preferences' },
  ]

  return (
    <div className="pb-8 space-y-5">
      <SEO title="Investor Profile" path="/dashboard/investor" noindex />

      <HeroSection
        eyebrow="Your Profile"
        title="Investor Profile"
        subtitle="Manage your public profile and investment preferences"
      >
        <div className="flex items-center gap-2">
          {prefs.fund_name && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999,
              }}
            >
              <Briefcase className="w-3.5 h-3.5" />
              {prefs.fund_name}
            </span>
          )}
          {isVerified && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: 'rgba(16,185,129,0.15)', color: '#6EE7B7',
                border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999,
              }}
            >
              <Check className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>
      </HeroSection>

      {/* Pending changes banner */}
      {pendingChanges && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 sm:p-5"
          style={{ background: 'var(--warn-bg)', borderRadius: 14 }}
        >
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--warn)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Pending changes awaiting review</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
              Your edits are submitted for admin review. Current profile remains visible until approved.
            </p>
          </div>
        </motion.div>
      )}

      {/* Segmented Tabs */}
      <div
        className="inline-flex p-1 gap-1"
        style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {tabs.map(t => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="px-4 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: active ? 'var(--blue)' : 'transparent',
                color: active ? '#fff' : 'var(--muted)',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          {/* Avatar Card */}
          <SectionCard title="Profile Photo" icon={User}>
            <div className="flex items-center gap-5">
              <div
                className="relative w-[72px] h-[72px] rounded-[16px] overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--blue), #1D4ED8)', color: '#fff' }}
              >
                <span className="absolute inset-0 flex items-center justify-center">{initials}</span>
                {normalizeAvatarUrl(profile?.avatar_url) && (
                  <img
                    src={normalizeAvatarUrl(profile?.avatar_url)!}
                    alt="Avatar"
                    className="relative w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                  <span
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                    style={{ background: 'var(--blue)', color: '#fff' }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                  </span>
                </label>
                <p className="text-[10px]" style={{ color: 'var(--muted-2)' }}>JPG, PNG, WebP. Max 5MB.</p>
              </div>
            </div>
          </SectionCard>

          {/* Basic Info Card */}
          <SectionCard title="Basic Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>First Name</label>
                <input
                  value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Last Name</label>
                <input
                  value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Fund / Company</label>
              <input
                value={company} onChange={e => setCompany(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Bio</label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)} rows={3}
                placeholder="Tell founders about yourself and your investment philosophy..."
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all resize-none"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
                  <span className="flex items-center gap-1.5"><Linkedin className="w-3 h-3" /> LinkedIn URL</span>
                </label>
                <input
                  value={linkedin} onChange={e => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
                  <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Website URL</span>
                </label>
                <input
                  value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="yourfirm.com"
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line)'}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: 'var(--blue)', color: '#fff' }}
              >
                {savingProfile
                  ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : <><Save className="w-3.5 h-3.5" /> Save Profile</>
                }
              </button>
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* ── Preferences Tab ── */}
      {tab === 'preferences' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          {loadingPrefs ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={120} className="rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Fund Details */}
              <SectionCard title="Fund Details" icon={Briefcase}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Fund Name</label>
                    <input
                      value={prefs.fund_name ?? ''} onChange={e => setPrefs(p => ({ ...p, fund_name: e.target.value }))}
                      placeholder="e.g. Accel India"
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Title / Role</label>
                    <input
                      value={prefs.title ?? ''} onChange={e => setPrefs(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Partner"
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Portfolio Count</label>
                  <input
                    type="number" value={prefs.portfolio_count ?? ''} onChange={e => setPrefs(p => ({ ...p, portfolio_count: Number(e.target.value) || 0 }))}
                    placeholder="e.g. 25"
                    className="w-full sm:w-48 px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>
              </SectionCard>

              {/* Focus Areas */}
              <SectionCard title="Focus Areas" icon={Target}>
                <ChipSelect label="Sectors" icon={Layers} options={SECTORS} selected={prefs.sectors}
                  onChange={v => setPrefs(p => ({ ...p, sectors: v }))} />
                <ChipSelect label="Investment Stages" icon={Target} options={STAGES} selected={prefs.stage_preference}
                  onChange={v => setPrefs(p => ({ ...p, stage_preference: v }))} />
                <ChipSelect label="Geographies" icon={MapPin} options={GEOGRAPHIES} selected={prefs.geography}
                  onChange={v => setPrefs(p => ({ ...p, geography: v }))} />
              </SectionCard>

              {/* Check Size & Thesis */}
              <SectionCard title="Check Size & Thesis" icon={DollarSign}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Min Check Size</label>
                    <input
                      value={prefs.ticket_size_min ?? ''} onChange={e => setPrefs(p => ({ ...p, ticket_size_min: e.target.value }))}
                      placeholder="e.g. $25K"
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Max Check Size</label>
                    <input
                      value={prefs.ticket_size_max ?? ''} onChange={e => setPrefs(p => ({ ...p, ticket_size_max: e.target.value }))}
                      placeholder="e.g. $500K"
                      className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                      onBlur={e => e.target.style.borderColor = 'var(--line)'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>Investment Thesis</label>
                  <textarea
                    value={prefs.investment_thesis ?? ''} onChange={e => setPrefs(p => ({ ...p, investment_thesis: e.target.value }))}
                    rows={4} placeholder="Describe your investment philosophy and what you look for in startups..."
                    className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all resize-none"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                    onBlur={e => e.target.style.borderColor = 'var(--line)'}
                  />
                </div>
              </SectionCard>

              {/* AI Info Box */}
              <div
                className="flex items-start gap-3 p-4 sm:p-5"
                style={{ background: 'var(--blue-bg)', borderRadius: 14 }}
              >
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(37,99,235,0.12)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--blue)' }}>AI-powered matching</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Your preferences help our AI match you with relevant startups. More detail means better matches.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={savePrefs}
                  disabled={savingPrefs}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{ background: 'var(--blue)', color: '#fff' }}
                >
                  {savingPrefs
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    : <><Check className="w-3.5 h-3.5" /> Save Preferences</>
                  }
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
