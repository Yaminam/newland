// -- SUPABASE STORAGE SETUP — run in Supabase Dashboard:
// -- Storage → Buckets → Create bucket:
// --   Name: pitch-decks
// --   Public: false
// --   File size limit: 5MB
// --   Allowed MIME types: application/pdf
// --
// -- RLS POLICIES — run in Supabase Studio:
// -- CREATE POLICY "Authenticated upload pitch decks"
// --   ON storage.objects FOR INSERT TO authenticated
// --   WITH CHECK (bucket_id = 'pitch-decks');
// --
// -- CREATE POLICY "Users read own pitch decks"
// --   ON storage.objects FOR SELECT TO authenticated
// --   USING (bucket_id = 'pitch-decks'
// --     AND auth.uid()::text = (storage.foldername(name))[1]);

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { ProgressRing } from '@/app/components/ui/ProgressRing'
import { normalizeAvatarUrl } from '@/app/lib/avatarUrl'
import {
  Bookmark, MessageSquare, Download, CheckCircle, Lock,
  Upload, Save, Rocket, Star, Clock, X, FileText, Sparkles,
  Globe, Linkedin, Users, Calendar, TrendingUp, DollarSign,
  Target, Briefcase, PenLine, Building2, LogOut, AlertTriangle,
  MapPin, Tag, SendHorizonal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import {
  parseOptionalInteger,
  sanitizeOptionalText,
  sanitizeText,
  sanitizeUrl,
  validateUploadedFile,
  validateFileSignature,
} from '@/app/lib/inputSecurity'
import {
  ACTIVE_STARTUP_STAGES,
  IDEA_STARTUP_STAGES,
  STARTUP_SECTORS,
  normalizeFounderListing,
  normalizeIdeaStage,
  normalizeSector,
  normalizeStartupStage,
} from '@/app/lib/startupListing'
import type { VerificationStatus } from '@/app/lib/types'
import { toast } from 'sonner'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'

const SECTORS = STARTUP_SECTORS
const STAGES = ACTIVE_STARTUP_STAGES

interface FounderProfile {
  id: string
  profile_id: string
  founder_type?: 'active' | 'idea'
  company_name?: string
  sector?: string
  stage?: string
  arr?: string
  mom_growth?: string
  raise_amount?: string
  bio?: string
  pitch_deck_url?: string
  verified: boolean
  verification_status: VerificationStatus
  trust_badges: string[]
  website?: string
  linkedin_url?: string
  problem_statement?: string
  idea_title?: string
  idea_stage?: string
  target_market?: string
  funding_purpose?: string
  team_size?: number
  founded_year?: number
  pending_changes?: Record<string, unknown> | null
}

interface ListingForm {
  company_name: string
  idea_title: string
  idea_stage: string
  sector: string
  stage: string
  website: string
  linkedin_url: string
  team_size: string
  founded_year: string
  raise_amount: string
  arr: string
  mom_growth: string
  funding_purpose: string
  bio: string
  problem_statement: string
  target_market: string
}

// ─── Trust Badges ────────────────────────────────────────────────────────────

interface BadgeDef {
  id: string; label: string; desc: string; hint: string
  isEarned: (fp: FounderProfile | null | undefined) => boolean
}

const TRUST_BADGES: BadgeDef[] = [
  {
    id: 'profile_complete', label: 'Profile Complete',
    desc: 'Company, sector, stage, raise amount, and bio all filled.',
    hint: 'Fill company, sector, stage, raise amount, and bio.',
    isEarned: fp => !!fp?.company_name && !!fp?.sector && !!fp?.stage && !!fp?.raise_amount && !!fp?.bio,
  },
  {
    id: 'pitch_deck_uploaded', label: 'Pitch Deck Uploaded',
    desc: 'Deck available for investors who request it.',
    hint: 'Upload a PDF pitch deck below.',
    isEarned: fp => !!fp?.pitch_deck_url,
  },
  {
    id: 'verified', label: 'Admin Verified',
    desc: 'Verified by FounderCentral team (awarded on application approval).',
    hint: 'Submit your application — admin will review and verify.',
    isEarned: fp => !!fp?.verified,
  },
]

const IDEA_STAGES = IDEA_STARTUP_STAGES

// ─── Shared Styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1.5px solid var(--line)',
  color: 'var(--ink)',
}

// ─── Field Components ────────────────────────────────────────────────────────

function Field({ label, k, form, onChange, type = 'text', placeholder = '', rows, icon: Icon }: {
  label: string; k: keyof ListingForm; form: ListingForm
  onChange: (k: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  type?: string; placeholder?: string; rows?: number; icon?: React.ElementType
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
        {Icon ? <span className="flex items-center gap-1.5"><Icon className="w-3 h-3" />{label}</span> : label}
      </label>
      {rows ? (
        <textarea value={form[k]} onChange={onChange(k)} rows={rows} placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all resize-none"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
      ) : (
        <input type={type} value={form[k]} onChange={onChange(k)} placeholder={placeholder}
          className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
      )}
    </div>
  )
}

function FieldSelect({ label, k, form, onChange, options }: {
  label: string; k: keyof ListingForm; form: ListingForm
  onChange: (k: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>{label}</label>
      <select value={form[k]} onChange={onChange(k)}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = 'var(--blue)'}
        onBlur={e => e.target.style.borderColor = 'var(--line)'}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, action }: {
  title: string; icon?: React.ElementType; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="p-5 sm:p-6 space-y-5"
      style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'var(--blue-bg)' }}>
              <Icon className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            </div>
          )}
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MyListingPage() {
  const { profile, refreshProfile, incubationProfile } = useAuth()
  const navigate = useNavigate()
  const isIdea = profile?.founder_type === 'idea'
  const urlTab = new URLSearchParams(window.location.search).get('tab')
  const validTabs = ['basic', 'fundraising', 'story', 'media', 'incubation'] as const
  const initialTab = validTabs.includes(urlTab as typeof validTabs[number]) ? urlTab as typeof validTabs[number] : 'basic'
  const [tab, setTab] = useState<'basic' | 'fundraising' | 'story' | 'media' | 'incubation'>(initialTab)
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [pitchDeckUrl, setPitchDeckUrl] = useState<string | null>(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [introCount, setIntroCount] = useState(0)
  const [deckDownloadCount, setDeckDownloadCount] = useState(0)
  const [applicationStatus, setApplicationStatus] = useState<
    'none' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  >('none')
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [requestingVerification, setRequestingVerification] = useState(false)
  const [deckEvalStatus, setDeckEvalStatus] = useState<string | null>(null)
  const [deckScores, setDeckScores] = useState<{
    overall: number; deck: number; website: number | null; fit: number | null; report_path: string | null
  } | null>(null)

  const [form, setForm] = useState<ListingForm>({
    company_name: '', idea_title: '', idea_stage: '', sector: '', stage: '', website: '', linkedin_url: '',
    team_size: '', founded_year: '', raise_amount: '', arr: '', mom_growth: '',
    funding_purpose: '', bio: '', problem_statement: '', target_market: '',
  })

  const fetchListing = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('founder_profiles')
        .select('*')
        .eq('profile_id', profile!.id)
        .maybeSingle()
      if (data) {
        const listing = normalizeFounderListing(data as FounderProfile) as FounderProfile
        setFounderProfile(listing)
        setForm({
          company_name: listing.company_name || profile?.company || '',
          idea_title: listing.idea_title ?? '',
          idea_stage: listing.idea_stage ?? '',
          sector: listing.sector ?? '',
          stage: listing.stage ?? '',
          website: listing.website ?? '',
          linkedin_url: listing.linkedin_url ?? '',
          team_size: listing.team_size ? String(listing.team_size) : '',
          founded_year: listing.founded_year ? String(listing.founded_year) : '',
          raise_amount: listing.raise_amount ?? '',
          arr: listing.arr ?? '',
          mom_growth: listing.mom_growth ?? '',
          funding_purpose: listing.funding_purpose ?? '',
          bio: listing.bio ?? '',
          problem_statement: listing.problem_statement ?? '',
          target_market: listing.target_market ?? '',
        })
        if (listing.pitch_deck_url) {
          const { data: signed } = await supabase.storage
            .from('pitch-decks')
            .createSignedUrl(listing.pitch_deck_url, 60 * 60)
          if (signed) setPitchDeckUrl(signed.signedUrl)
        }

        const { data: bookmarkRows } = await supabase
          .from('founder_bookmarks')
          .select('investor_id')
          .eq('founder_profile_id', listing.id)

        setBookmarkCount(new Set((bookmarkRows ?? []).map(row => row.investor_id)).size)
      } else {
        setForm(f => ({ ...f, company_name: profile?.company || '' }))
        setBookmarkCount(0)
      }

      const { data: appRow } = await supabase
        .from('startup_applications')
        .select('id, status, admin_notes')
        .eq('founder_id', profile!.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (appRow) {
        setApplicationId(appRow.id)
        setApplicationStatus(appRow.status as typeof applicationStatus)
        setRejectionReason(appRow.status === 'rejected' ? (appRow.admin_notes ?? null) : null)

        const { data: evalData } = await supabase
          .from('startup_applications')
          .select('deck_evaluation_status, deck_overall_score, deck_pdf_score, deck_website_score, deck_fit_score, deck_report_path')
          .eq('id', appRow.id)
          .maybeSingle()
        if (evalData) {
          setDeckEvalStatus(evalData.deck_evaluation_status)
          if (evalData.deck_overall_score != null) {
            setDeckScores({
              overall: evalData.deck_overall_score,
              deck: evalData.deck_pdf_score ?? 0,
              website: evalData.deck_website_score,
              fit: evalData.deck_fit_score,
              report_path: evalData.deck_report_path,
            })
          }
        }

        const { count: intros } = await supabase
          .from('introductions')
          .select('id', { count: 'exact', head: true })
          .eq('startup_id', appRow.id)
        setIntroCount(intros ?? 0)

        const { data: statsRow } = await supabase
          .from('startup_applications')
          .select('total_deck_downloads')
          .eq('id', appRow.id)
          .maybeSingle()
        setDeckDownloadCount(statsRow?.total_deck_downloads ?? 0)
      } else {
        setApplicationId(null)
        setApplicationStatus('none')
        setIntroCount(0)
        setDeckDownloadCount(0)
      }
    } catch {
      setForm(f => ({ ...f, company_name: profile?.company || '' }))
      setBookmarkCount(0)
      setIntroCount(0)
      setDeckDownloadCount(0)
    } finally {
      setLoading(false)
    }
  }, [profile])

  const requestVerification = useCallback(async () => {
    if (!profile || !founderProfile) return
    if (!founderProfile.company_name || !founderProfile.sector || !founderProfile.stage) {
      toast.error('Fill company name, sector, and stage before requesting verification.')
      return
    }
    setRequestingVerification(true)
    try {
      const payload = {
        founder_id: profile.id,
        company_name: founderProfile.company_name,
        website: founderProfile.website ?? null,
        sector: founderProfile.sector,
        country: 'India',
        founded_year: founderProfile.founded_year ?? null,
        stage: founderProfile.stage,
        description: founderProfile.bio ?? null,
        arr_usd: founderProfile.arr ? Number(founderProfile.arr) : null,
        funding_ask_usd: founderProfile.raise_amount ? Number(founderProfile.raise_amount) : null,
        funding_round: founderProfile.stage,
        use_of_funds: founderProfile.funding_purpose ?? null,
        team_size: founderProfile.team_size ?? null,
        deck_path: founderProfile.pitch_deck_url ?? null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const op = applicationId
        ? supabase.from('startup_applications').update(payload).eq('id', applicationId)
        : supabase.from('startup_applications').insert(payload)
      const { error } = await op
      if (error) throw error
      toast.success('Submitted for verification.')
      await fetchListing()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setRequestingVerification(false)
    }
  }, [profile, founderProfile, applicationId, fetchListing])

  useEffect(() => { void fetchListing() }, [fetchListing])

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('incubation_join_requests')
      .select('id, incubation_id, created_at, incubation_profiles(name, incubation_type)')
      .eq('founder_id', profile.id)
      .eq('status', 'pending')
      .then(({ data }) => setPendingRequests((data as unknown as typeof pendingRequests) ?? []))
  }, [profile?.id])

  useEffect(() => {
    if (isIdea && (tab === 'fundraising' || tab === 'media')) setTab('basic')
  }, [isIdea, tab])

  useEffect(() => {
    if (!applicationId) return
    const channel = supabase
      .channel(`deck-eval-${applicationId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'startup_applications',
        filter: `id=eq.${applicationId}`,
      }, (payload: { new: Record<string, unknown> }) => {
        const row = payload.new
        setDeckEvalStatus(row.deck_evaluation_status as string | null)
        if (row.deck_overall_score != null) {
          setDeckScores({
            overall: row.deck_overall_score as number,
            deck: (row.deck_pdf_score as number) ?? 0,
            website: row.deck_website_score as number | null,
            fit: row.deck_fit_score as number | null,
            report_path: row.deck_report_path as string | null,
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [applicationId])

  const [reportViewUrl, setReportViewUrl] = useState<string | null>(null)
  const [showReportViewer, setShowReportViewer] = useState(false)

  // Pending join requests
  const [pendingRequests, setPendingRequests] = useState<Array<{
    id: string
    incubation_id: string
    created_at: string
    incubation_profiles: { name: string; incubation_type: string } | null
  }>>([])

  // Leave incubation modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveNotes, setLeaveNotes] = useState('')
  const [leaveConfirmed, setLeaveConfirmed] = useState(false)
  const [leaving, setLeaving] = useState(false)

  async function viewReport() {
    if (!deckScores?.report_path) return
    if (reportViewUrl) { setShowReportViewer(true); return }
    const { data } = await supabase.storage.from('reports').createSignedUrl(deckScores.report_path, 60 * 60)
    if (data?.signedUrl) {
      setReportViewUrl(data.signedUrl)
      setShowReportViewer(true)
    } else {
      toast.error('Could not generate report link')
    }
  }

  async function leaveIncubation() {
    if (!profile || !leaveReason || !leaveConfirmed) return
    setLeaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ incubation_id: null })
        .eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      setShowLeaveModal(false)
      setLeaveReason('')
      setLeaveNotes('')
      setLeaveConfirmed(false)
      toast.success('You have left the incubation program.')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to leave incubation')
    } finally {
      setLeaving(false)
    }
  }

  async function saveListing() {
    if (!profile) return
    setSaving(true)
    try {
      const companyName = isIdea
        ? sanitizeOptionalText(form.company_name, { maxLength: 160 })
        : sanitizeText(form.company_name, { maxLength: 160, allowEmpty: false })
      const ideaTitle = isIdea
        ? sanitizeText(form.idea_title, { maxLength: 160, allowEmpty: false })
        : sanitizeOptionalText(form.idea_title, { maxLength: 160 })

      const payload = {
        profile_id: profile.id,
        founder_type: profile.founder_type ?? (isIdea ? 'idea' : 'active'),
        company_name: companyName || null,
        idea_title: ideaTitle || null,
        idea_stage: normalizeIdeaStage(form.idea_stage) || null,
        sector: normalizeSector(form.sector) || null,
        stage: normalizeStartupStage(form.stage) || null,
        website: sanitizeUrl(form.website) || null,
        linkedin_url: sanitizeUrl(form.linkedin_url) || null,
        team_size: parseOptionalInteger(form.team_size),
        founded_year: parseOptionalInteger(form.founded_year),
        raise_amount: sanitizeOptionalText(form.raise_amount, { maxLength: 80 }),
        arr: sanitizeOptionalText(form.arr, { maxLength: 80 }),
        mom_growth: sanitizeOptionalText(form.mom_growth, { maxLength: 40 }),
        funding_purpose: sanitizeOptionalText(form.funding_purpose, { maxLength: 2000, multiline: true }),
        bio: sanitizeOptionalText(form.bio, { maxLength: 2000, multiline: true }),
        problem_statement: sanitizeOptionalText(form.problem_statement, { maxLength: 2000, multiline: true }),
        target_market: sanitizeOptionalText(form.target_market, { maxLength: 2000, multiline: true }),
        updated_at: new Date().toISOString(),
      }


      const isApproved = founderProfile?.verified === true
      if (isApproved) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit these keys from pendingFields
        const { profile_id: _pid, founder_type: _ft, updated_at: _ua, ...pendingFields } = payload
        const { error: pendingErr } = await supabase
          .from('founder_profiles')
          .update({ pending_changes: pendingFields, updated_at: new Date().toISOString() })
          .eq('profile_id', profile.id)
        if (pendingErr) throw pendingErr

        const appPayload = {
          founder_id: profile.id,
          company_name: companyName || founderProfile?.company_name || null,
          website: sanitizeUrl(form.website) || null,
          sector: normalizeSector(form.sector) || null,
          country: 'India',
          founded_year: parseOptionalInteger(form.founded_year),
          stage: normalizeStartupStage(form.stage) || null,
          description: sanitizeOptionalText(form.bio, { maxLength: 2000, multiline: true }),
          arr_usd: form.arr ? Number(form.arr) : null,
          funding_ask_usd: form.raise_amount ? Number(form.raise_amount) : null,
          funding_round: normalizeStartupStage(form.stage) || null,
          use_of_funds: sanitizeOptionalText(form.funding_purpose, { maxLength: 2000, multiline: true }),
          team_size: parseOptionalInteger(form.team_size),
          deck_path: founderProfile?.pitch_deck_url ?? null,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const appOp = applicationId
          ? supabase.from('startup_applications').update(appPayload).eq('id', applicationId)
          : supabase.from('startup_applications').insert(appPayload)
        const { error: appErr } = await appOp
        if (appErr) console.error('[saveListing] application submit failed:', appErr.message)

        setFounderProfile(fp => fp ? { ...fp, pending_changes: pendingFields } : fp)
        setApplicationStatus('submitted')
        toast.success('Changes submitted for review.')
        await fetchListing()
      } else {
        const { data: savedListing, error } = await supabase
          .from('founder_profiles')
          .upsert(payload, { onConflict: 'profile_id' })
          .select('*')
          .single()
        if (error) throw error
        if (savedListing) {
          const listing = normalizeFounderListing(savedListing as FounderProfile) as FounderProfile
          setFounderProfile(listing)
          setForm(current => ({
            ...current,
            company_name: listing.company_name ?? '', idea_title: listing.idea_title ?? '',
            idea_stage: listing.idea_stage ?? '', sector: listing.sector ?? '',
            stage: listing.stage ?? '', website: listing.website ?? '',
            linkedin_url: listing.linkedin_url ?? '', team_size: listing.team_size ? String(listing.team_size) : '',
            founded_year: listing.founded_year ? String(listing.founded_year) : '',
            raise_amount: listing.raise_amount ?? '', arr: listing.arr ?? '',
            mom_growth: listing.mom_growth ?? '', funding_purpose: listing.funding_purpose ?? '',
            bio: listing.bio ?? '', problem_statement: listing.problem_statement ?? '',
            target_market: listing.target_market ?? '',
          }))
        }
        // Sync deck_path to startup_applications if it exists
        if (applicationId && savedListing?.pitch_deck_url) {
          await supabase.from('startup_applications').update({ deck_path: savedListing.pitch_deck_url, updated_at: new Date().toISOString() }).eq('id', applicationId)
        }
        window.dispatchEvent(new CustomEvent('founder-central:founder-listing-updated', { detail: { profileId: profile.id } }))
        toast.success('Listing saved successfully')
        if (!savedListing) await fetchListing()
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function uploadAvatar(file: File) {
    if (!profile) return
    setAvatarUploading(true)
    const toastId = toast.loading('Uploading photo…')
    try {
      validateUploadedFile(file, {
        maxBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })
      await validateFileSignature(file)
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      }
      const ext = mimeToExt[file.type] ?? file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${profile.id}/avatar.${ext}`
      // Remove the existing file first so we only need the INSERT policy (not UPDATE).
      // Ignore errors — the file simply may not exist yet.
      await supabase.storage.from('avatars').remove([path])
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      const { error } = await supabase.from('profiles').update({ avatar_url: bustedUrl }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Photo updated', { id: toastId })
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Upload failed', { id: toastId })
    } finally {
      setAvatarUploading(false)
    }
  }

  const uploadPitchDeck = async (file: File) => {
    if (!file || !profile) return
    setUploading(true)
    const toastId = toast.loading('Uploading pitch deck…')
    try {
      validateUploadedFile(file, { maxBytes: 5 * 1024 * 1024, allowedMimeTypes: ['application/pdf'], allowedExtensions: ['pdf'] })
      await validateFileSignature(file)
      const filePath = `${profile.id}/pitch-deck.pdf`
      const { error: uploadError } = await supabase.storage
        .from('pitch-decks').upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: 'application/pdf' })
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('founder_profiles').update({ pitch_deck_url: filePath }).eq('profile_id', profile.id)
      if (dbError) throw dbError
      if (applicationId) {
        await supabase.from('startup_applications').update({ deck_path: filePath, updated_at: new Date().toISOString() }).eq('id', applicationId)
      }
      // Update local state so subsequent "Submit for Review" picks up the new path
      setFounderProfile(fp => fp ? { ...fp, pitch_deck_url: filePath } : fp)
      const { data: signedData, error: signedError } = await supabase.storage.from('pitch-decks').createSignedUrl(filePath, 60 * 60)
      if (signedError) throw signedError
      toast.success('Pitch deck uploaded successfully', { id: toastId })
      setPitchDeckUrl(signedData.signedUrl)
    } catch (err: unknown) {
      toast.error(`Deck upload failed: ${(err as { message?: string })?.message ?? 'Unknown error'}`, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const setField = (key: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const activeTabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: Briefcase },
    { id: 'fundraising' as const, label: 'Fundraising', icon: DollarSign },
    { id: 'story' as const, label: 'Story', icon: PenLine },
    { id: 'media' as const, label: 'Media', icon: FileText },
    { id: 'incubation' as const, label: 'Incubation', icon: Building2 },
  ]
  const ideaTabs = [
    { id: 'basic' as const, label: 'Idea Basics', icon: Briefcase },
    { id: 'story' as const, label: 'Problem & Market', icon: Target },
    { id: 'incubation' as const, label: 'Incubation', icon: Building2 },
  ]
  const tabs = isIdea ? ideaTabs : activeTabs

  // Profile completeness
  const completenessFields: Array<string | null | undefined | number> = isIdea
    ? [founderProfile?.idea_title, founderProfile?.idea_stage, founderProfile?.sector,
       founderProfile?.problem_statement, founderProfile?.target_market, founderProfile?.bio,
       founderProfile?.linkedin_url, founderProfile?.team_size]
    : [founderProfile?.company_name, founderProfile?.sector, founderProfile?.stage,
       founderProfile?.raise_amount, founderProfile?.bio, founderProfile?.website,
       founderProfile?.linkedin_url, founderProfile?.problem_statement, founderProfile?.team_size,
       founderProfile?.founded_year, founderProfile?.arr, founderProfile?.pitch_deck_url]
  const filledCount = completenessFields.filter(v => v != null && v !== '' && v !== 0).length
  const profileCompleteness = completenessFields.length > 0 ? Math.round((filledCount / completenessFields.length) * 100) : 0
  const completenessLabel = `${filledCount}/${completenessFields.length} fields`

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()
  const scoreColor = (v: number | null) => (v ?? 0) >= 70 ? 'var(--pos)' : (v ?? 0) >= 50 ? 'var(--blue)' : 'var(--warn)'

  if (loading) {
    return (
      <div className="pb-8 space-y-5">
        <SkeletonBlock height={160} className="rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={80} className="rounded-2xl" />)}
        </div>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={120} className="rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="pb-8 space-y-5">
      <SEO title="My Listing" path="/dashboard/my-listing" noindex />

      <HeroSection
        eyebrow={isIdea ? 'Idea Stage' : 'Startup Listing'}
        title={isIdea ? (form.idea_title || 'My Idea Profile') : (form.company_name || 'My Startup Listing')}
        subtitle={isIdea
          ? 'Build your idea profile for mentors and early investors'
          : 'Build your startup profile for investors'
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {form.sector && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999 }}>
              {form.sector}
            </span>
          )}
          {!isIdea && form.stage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999 }}>
              {form.stage}
            </span>
          )}
          {applicationStatus === 'approved' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 999 }}>
              <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
      </HeroSection>

      {/* Pending changes banner */}
      {founderProfile?.pending_changes && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 sm:p-5"
          style={{ background: 'var(--warn-bg)', borderRadius: 14 }}>
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--warn)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Pending changes awaiting review</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
              Your edits are submitted for admin review. Current listing remains visible until approved.
            </p>
          </div>
        </motion.div>
      )}

      {/* Idea Stage banner */}
      {isIdea && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5"
          style={{ background: 'linear-gradient(135deg, var(--blue) 0%, #1D4ED8 100%)', borderRadius: 16 }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Lock className="w-4 h-4" style={{ color: 'white' }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: 'white' }}>You're in Idea Stage</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Focus on the problem, sector, market, and validation stage.
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/browse-investors')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer active:scale-[0.97] shrink-0 transition-all"
            style={{ background: 'white', color: 'var(--blue)' }}>
            <Rocket className="w-3.5 h-3.5" /> Browse Investors
          </button>
        </motion.div>
      )}

      {/* Trust Badges + Verification */}
      <SectionCard title="Trust Badges" icon={Star}
        action={
          <span className="text-[11px] font-medium" style={{ color: 'var(--muted-2)' }}>
            {TRUST_BADGES.filter(b => b.isEarned(founderProfile)).length}/{TRUST_BADGES.length} earned
          </span>
        }
      >
        <div className="flex flex-wrap gap-2">
          {TRUST_BADGES.map(badge => {
            const earned = badge.isEarned(founderProfile)
            return (
              <div key={badge.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px]"
                style={earned
                  ? { background: 'rgba(16,185,129,0.08)', color: 'var(--pos)' }
                  : { background: 'var(--surface-2)', color: 'var(--muted-2)' }
                }
                title={earned ? badge.desc : badge.hint}>
                {earned
                  ? <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--pos)' }} />
                  : <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                }
                <span className="text-[11px] font-semibold">{badge.label}</span>
              </div>
            )
          })}
        </div>

        {!isIdea && (
          <div className="flex items-center justify-between gap-3 flex-wrap pt-4" style={{ borderTop: '1px solid var(--line-2)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>Admin verification</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
                {applicationStatus === 'approved' ? 'Your listing is verified and visible to investors.'
                  : applicationStatus === 'submitted' || applicationStatus === 'under_review' ? 'Submitted — admin is reviewing.'
                  : applicationStatus === 'rejected' ? 'Not approved. Update and resubmit.'
                  : 'Submit for admin review to earn the Verified badge.'}
              </p>
              {applicationStatus === 'rejected' && rejectionReason && (
                <div className="mt-2 rounded-[10px] px-3 py-2 text-[11px]" style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--neg)' }}>
                  <span className="font-semibold">Reason: </span>{rejectionReason}
                </div>
              )}
            </div>
            {applicationStatus === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold"
                style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--pos)' }}>
                <CheckCircle className="w-3.5 h-3.5" /> Verified
              </span>
            ) : applicationStatus === 'submitted' || applicationStatus === 'under_review' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                <Clock className="w-3.5 h-3.5" /> Under review
              </span>
            ) : (
              <button onClick={() => void requestVerification()} disabled={requestingVerification}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer active:scale-[0.97] disabled:opacity-50 transition-all"
                style={{ background: 'var(--blue)', color: '#fff' }}>
                {requestingVerification ? 'Submitting…' : applicationStatus === 'rejected' ? 'Resubmit' : 'Submit for verification'}
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* Editor + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* Left: editor */}
        <div className="space-y-5 min-w-0">

      {/* Form Tabs */}
      <div
        className="inline-flex p-1 gap-1"
        style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] whitespace-nowrap"
              style={{ background: active ? 'var(--blue)' : 'transparent', color: active ? '#fff' : 'var(--muted)' }}>
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Form Content */}
      <div className="p-5 sm:p-6 space-y-5" style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {tab === 'basic' && (
          <>
            {isIdea ? (
              <>
                <Field label="Idea Title" k="idea_title" form={form} onChange={setField} placeholder="What is your idea called?" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldSelect label="Sector" k="sector" form={form} onChange={setField} options={SECTORS} />
                  <FieldSelect label="Idea Stage" k="idea_stage" form={form} onChange={setField} options={IDEA_STAGES} />
                </div>
                <Field label="Website URL" k="website" form={form} onChange={setField} placeholder="landing-page.com" icon={Globe} />
                <Field label="LinkedIn URL" k="linkedin_url" form={form} onChange={setField} placeholder="linkedin.com/in/..." icon={Linkedin} />
              </>
            ) : (
              <>
                <Field label="Company Name" k="company_name" form={form} onChange={setField} placeholder="Your startup name" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldSelect label="Sector" k="sector" form={form} onChange={setField} options={SECTORS} />
                  <FieldSelect label="Stage" k="stage" form={form} onChange={setField} options={STAGES} />
                </div>
                <Field label="Website URL" k="website" form={form} onChange={setField} placeholder="yourcompany.com" icon={Globe} />
                <Field label="LinkedIn URL" k="linkedin_url" form={form} onChange={setField} placeholder="linkedin.com/company/..." icon={Linkedin} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Team Size" k="team_size" form={form} onChange={setField} type="number" placeholder="e.g. 5" icon={Users} />
                  <Field label="Founded Year" k="founded_year" form={form} onChange={setField} type="number" placeholder="e.g. 2023" icon={Calendar} />
                </div>
              </>
            )}
          </>
        )}

        {!isIdea && tab === 'fundraising' && (
          <>
            <Field label="Target Raise Amount" k="raise_amount" form={form} onChange={setField} placeholder="e.g. $500K, ₹2 Cr" icon={DollarSign} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Annual Recurring Revenue (ARR)" k="arr" form={form} onChange={setField} placeholder="e.g. $50K ARR" icon={TrendingUp} />
              <Field label="Month-over-Month Growth" k="mom_growth" form={form} onChange={setField} placeholder="e.g. 15%" icon={TrendingUp} />
            </div>
            <Field label="Use of Funds" k="funding_purpose" form={form} onChange={setField} rows={4} placeholder="How will you use this funding?" />
          </>
        )}

        {tab === 'story' && (
          <>
            <Field label="Pitch / Company Overview" k="bio" form={form} onChange={setField} rows={5}
              placeholder={isIdea ? 'Describe the idea, current insight, and why now...' : 'Describe what your company does and why it matters...'} />
            <Field label="Problem Statement" k="problem_statement" form={form} onChange={setField} rows={4}
              placeholder="What problem are you solving?" />
            <Field label="Target Market" k="target_market" form={form} onChange={setField} rows={3}
              placeholder="Who are your customers? What is the market size?" />
          </>
        )}

        {!isIdea && tab === 'media' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-2)' }}>
                Pitch Deck (PDF)
              </label>
              {pitchDeckUrl ? (
                <div className="flex items-center gap-3 mb-3">
                  <a href={pitchDeckUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--pos)' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Pitch deck on file
                  </a>
                  <label className="cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--blue)' }}>
                    <input type="file" accept=".pdf,application/pdf" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadPitchDeck(e.target.files[0])} />
                    Replace
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input type="file" accept=".pdf,application/pdf" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadPitchDeck(e.target.files[0])} />
                  <div className="flex flex-col items-center justify-center p-8 rounded-[14px] border-2 border-dashed"
                    style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                    {uploading ? (
                      <>
                        <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mb-2" style={{ color: 'var(--muted-2)' }} />
                        <p className="text-[13px] font-semibold" style={{ color: 'var(--muted)' }}>Click to upload pitch deck</p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>PDF up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* Deck Evaluation */}
            {deckEvalStatus === 'processing' && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-[14px]" style={{ background: 'var(--blue-bg)' }}>
                <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Evaluating your deck...</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>AI analysis in progress. Usually 1-2 minutes.</p>
                </div>
              </motion.div>
            )}

            {deckEvalStatus === 'done' && deckScores && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-[14px] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: scoreColor(deckScores.overall) }} />
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>AI Score</span>
                    </div>
                    <span className="text-[24px] font-bold" style={{ color: scoreColor(deckScores.overall) }}>
                      {deckScores.overall}<span className="text-[12px] font-medium" style={{ color: 'var(--muted-2)' }}>/100</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Deck', value: deckScores.deck },
                      { label: 'Website', value: deckScores.website },
                      { label: 'Fit', value: deckScores.fit },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-[10px]" style={{ background: 'var(--surface)' }}>
                        <p className="text-[18px] font-bold" style={{ color: s.value != null ? scoreColor(s.value) : 'var(--muted-2)' }}>
                          {s.value != null ? s.value : 'N/A'}
                        </p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--muted-2)' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 flex items-center justify-center" style={{ borderTop: '1px solid var(--line-2)' }}>
                  <button onClick={viewReport}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer active:scale-[0.97] transition-all"
                    style={{ background: 'var(--blue)', color: '#fff' }}>
                    <Sparkles className="w-3.5 h-3.5" /> View Audit Report
                  </button>
                </div>
              </motion.div>
            )}

            {deckEvalStatus === 'failed' && (
              <div className="p-3 rounded-[14px] text-center" style={{ background: 'rgba(239,68,68,0.06)' }}>
                <p className="text-[12px] font-medium" style={{ color: 'var(--neg)' }}>Evaluation unavailable. We'll retry shortly.</p>
              </div>
            )}

            {!deckEvalStatus && pitchDeckUrl && !form.website && (
              <div className="flex items-center gap-2 p-3.5 rounded-[14px]" style={{ background: 'var(--warn-bg)' }}>
                <Rocket className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />
                <p className="text-[12px] font-medium" style={{ color: 'var(--warn)' }}>Add your website URL to unlock Website & Market Fit scoring</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-[14px]" style={{ background: 'rgba(16,185,129,0.05)' }}>
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--pos)' }} />
              <div>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--pos)' }}>Pro Tip</p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Startups with pitch decks get more investor engagement. Keep it under 15 slides.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Incubation Tab */}
        {tab === 'incubation' && (
          <div className="space-y-5">
            {!profile?.incubation_id || !incubationProfile ? (
              pendingRequests.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SendHorizonal className="w-4 h-4" style={{ color: '#7C3AED' }} />
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                      Pending requests
                    </p>
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                    You've requested to join the following incubation{pendingRequests.length > 1 ? 's' : ''}. Once approved, you'll be linked automatically.
                  </p>
                  {pendingRequests.map(req => (
                    <div key={req.id}
                      className="flex items-center gap-3 p-4 rounded-[12px]"
                      style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.14)' }}>
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[15px] font-black"
                        style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                        {req.incubation_profiles?.name?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                          {req.incubation_profiles?.name ?? 'Incubation Program'}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {req.incubation_profiles?.incubation_type?.replace(/_/g, ' ') ?? ''}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0"
                        style={{ background: 'rgba(245,158,11,0.10)', color: 'var(--warn)' }}>
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.12)' }}>
                  <Building2 className="w-7 h-7" style={{ color: '#7C3AED' }} />
                </div>
                <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  Not part of any incubation
                </p>
                <p className="text-[12px] max-w-xs" style={{ color: 'var(--muted)' }}>
                  You'll see your incubation program details here once you've accepted an invitation from an incubator or accelerator.
                </p>
              </div>
              )
            ) : (
              <>
                {/* Programme card */}
                <div className="rounded-[14px] overflow-hidden"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  {/* Header */}
                  <div className="p-5 flex items-start gap-4">
                    {incubationProfile.logo_url ? (
                      <img src={incubationProfile.logo_url} alt={incubationProfile.name}
                        className="w-14 h-14 rounded-[12px] object-cover shrink-0"
                        style={{ border: '1px solid var(--line)' }} />
                    ) : (
                      <div className="w-14 h-14 rounded-[12px] flex items-center justify-center shrink-0 text-xl font-black"
                        style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.15)' }}>
                        {incubationProfile.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-bold leading-tight mb-1" style={{ color: 'var(--ink)' }}>
                        {incubationProfile.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                        {incubationProfile.incubation_type.replace(/_/g, ' ')}
                      </span>
                      {incubationProfile.is_verified && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--pos)' }}>
                          <CheckCircle className="w-2.5 h-2.5" /> Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 pb-5 space-y-3" style={{ borderTop: '1px solid var(--line-2)' }}>
                    {incubationProfile.description && (
                      <p className="text-[13px] leading-relaxed pt-3" style={{ color: 'var(--muted)' }}>
                        {incubationProfile.description}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(incubationProfile.city || incubationProfile.country) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                          <MapPin className="w-3 h-3" />
                          {[incubationProfile.city, incubationProfile.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {incubationProfile.cohort_size && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                          <Users className="w-3 h-3" />
                          {incubationProfile.cohort_size} per cohort
                        </span>
                      )}
                      {incubationProfile.website_url && (
                        <a href={incubationProfile.website_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--blue)' }}>
                          <Globe className="w-3 h-3" />
                          {incubationProfile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                      {incubationProfile.linkedin_url && (
                        <a href={incubationProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-70"
                          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: '#0A66C2' }}>
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </a>
                      )}
                    </div>

                    {/* Sectors */}
                    {incubationProfile.sectors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Tag className="w-3 h-3 shrink-0" style={{ color: 'var(--muted-2)' }} />
                        {incubationProfile.sectors.map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Membership info */}
                <div className="flex items-center gap-3 p-4 rounded-[12px]"
                  style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--pos)' }} />
                  <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                    You are an active member of{' '}
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{incubationProfile.name}</span>.
                    Your profile is visible to this program's admin.
                  </p>
                </div>

                {/* Leave button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.18)' }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Leave Program
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Save Button — hidden on incubation tab */}
        {tab !== 'incubation' && (
        <div className="pt-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <button onClick={saveListing} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--blue)', color: '#fff' }}>
            {saving
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              : <><Save className="w-3.5 h-3.5" /> Save Changes</>
            }
          </button>
          {founderProfile?.verification_status === 'verified' && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-[10px]"
              style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--pos)' }}>
              <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>
        )}
      </div>
        </div>{/* /editor column (left) */}

        {/* Right: at-a-glance sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-4 self-start">
          {/* Overview */}
          <SectionCard title="Overview" icon={TrendingUp}>
            <div className="flex items-center gap-4">
              <ProgressRing value={profileCompleteness} size={56} thickness={6}
                color="var(--blue)" trackColor="var(--surface-2)" label={`${profileCompleteness}%`} />
              <div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
                  {profileCompleteness >= 100 ? 'Profile complete' : profileCompleteness >= 60 ? 'Almost there' : 'Get started'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{completenessLabel} complete</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid var(--line-2)' }}>
              {[
                { icon: Bookmark, label: 'Saves', value: bookmarkCount, color: '#7C3AED' },
                { icon: MessageSquare, label: 'Intros', value: introCount, color: 'var(--pos)' },
                { icon: Download, label: 'Downloads', value: deckDownloadCount, color: 'var(--warn)' },
              ].map(s => (
                <div key={s.label} className="text-center p-2.5 rounded-[10px]" style={{ background: 'var(--surface-2)' }}>
                  <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                  <p className="text-[16px] font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>{s.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--muted-2)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Profile Photo */}
          <SectionCard title="Profile Photo" icon={Upload}>
            <div className="flex items-center gap-5">
              <div className="relative w-[72px] h-[72px] rounded-[16px] overflow-hidden flex items-center justify-center text-xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--blue), #1D4ED8)', color: '#fff' }}>
                <span className="absolute inset-0 flex items-center justify-center">{initials}</span>
                {normalizeAvatarUrl(profile?.avatar_url) && (
                  <img src={normalizeAvatarUrl(profile?.avatar_url)!} alt="Avatar"
                    className="relative w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px] font-semibold cursor-pointer active:scale-[0.97] transition-all"
                    style={{ background: 'var(--blue)', color: '#fff' }}>
                    <Upload className="w-3.5 h-3.5" />
                    {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                  </span>
                </label>
                <p className="text-[10px]" style={{ color: 'var(--muted-2)' }}>JPG, PNG, WebP. Max 5MB.</p>
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>{/* /editor grid */}

      {/* Leave Incubation Modal */}
      {showLeaveModal && incubationProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowLeaveModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <LogOut className="w-5 h-5" style={{ color: 'var(--neg)' }} />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>Leave Program</h2>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{incubationProfile.name}</p>
                </div>
              </div>
              <button onClick={() => setShowLeaveModal(false)}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-3.5 rounded-[12px]"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--neg)' }} />
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Leaving will remove you from <strong style={{ color: 'var(--ink)' }}>{incubationProfile.name}</strong>.
                  The incubation admin will no longer see you in their founder roster.
                  This action cannot be undone without a new invitation.
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
                  Reason for leaving <span style={{ color: 'var(--neg)' }}>*</span>
                </label>
                <select
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none"
                  style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: leaveReason ? 'var(--ink)' : 'var(--muted-2)' }}
                >
                  <option value="">Select a reason</option>
                  <option>Program completed — cohort ended</option>
                  <option>Found a better fit elsewhere</option>
                  <option>Startup pivoted — no longer relevant</option>
                  <option>Relocating out of the program area</option>
                  <option>Personal reasons</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
                  Additional details <span style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  value={leaveNotes}
                  onChange={e => setLeaveNotes(e.target.value)}
                  rows={3}
                  placeholder="Share any additional context with the incubation admin…"
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none resize-none"
                  style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
                />
              </div>

              {/* Confirm checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={leaveConfirmed}
                  onChange={e => setLeaveConfirmed(e.target.checked)}
                  className="mt-0.5 shrink-0 accent-red-500"
                />
                <span className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  I understand this will remove me from{' '}
                  <strong style={{ color: 'var(--ink)' }}>{incubationProfile.name}</strong>{' '}
                  and cannot be undone without a new invitation.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all active:scale-[0.97]"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void leaveIncubation()}
                  disabled={!leaveReason || !leaveConfirmed || leaving}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all active:scale-[0.97] disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  style={{ background: 'var(--neg)', color: '#fff' }}
                >
                  {leaving
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Leaving…</>
                    : <><LogOut className="w-3.5 h-3.5" /> Leave Program</>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PDF Report Viewer Modal */}
      {showReportViewer && reportViewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowReportViewer(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden"
            style={{ background: 'var(--surface)', borderRadius: 16, height: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: 'none', borderBottom: '1px solid var(--line-2)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Startup Audit Report</span>
              </div>
              <button onClick={() => setShowReportViewer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] cursor-pointer transition-all hover:opacity-70"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              src={`${reportViewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full"
              style={{ height: 'calc(85vh - 52px)', border: 'none' }}
              title="Audit Report"
            />
          </div>
        </div>
      )}
    </div>
  )
}
