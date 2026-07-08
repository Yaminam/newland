import { useEffect, useState, useCallback } from 'react'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SEO } from '@/app/components/SEO'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal } from '@/app/components/ui/Modal'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import {
  Users,
  X, Send, ExternalLink, MessageSquare, Shield, CheckCircle, Lock, Clock, FileText,
  PlusCircle,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'
import { compactNumber } from '@/app/lib/utils'
import { useAuth } from '@/app/context/AuthContext'
import { ReportBlockMenu } from '@/app/components/ReportBlockMenu'
import type { FounderProfile } from '@/app/lib/types'
import {
  MARKETPLACE_STAGES,
  STARTUP_SECTORS,
  normalizeFounderListing,
  resolveStartupDisplayName,
  resolveStartupDisplayStage,
  resolveStartupSummary,
} from '@/app/lib/startupListing'
import { normalizeAvatarUrl } from '@/app/lib/avatarUrl'
import { toast } from 'sonner'

const SECTORS = ['All', ...STARTUP_SECTORS]
const STAGES = MARKETPLACE_STAGES

function sectorColor(sector: string | null | undefined): string {
  const colors: Record<string, string> = {
    'AI': '#3486e8', 'Fintech': 'var(--pos)', 'Healthtech': 'var(--neg)',
    'SaaS': 'var(--blue)', 'Cleantech': '#22c55e', 'Edtech': 'var(--warn)',
    'Deeptech': '#59cbef', 'Agritech': '#84cc16', 'EV': '#8b5cf6',
  }
  return colors[sector ?? ''] ?? 'var(--blue)'
}

function founderName(fp: FounderProfile): string {
  if (!fp.profile) return 'Founder'
  return [fp.profile.first_name, fp.profile.last_name].filter(Boolean).join(' ')
}

function normalizeStartupProfile(startup: FounderProfile) {
  return normalizeFounderListing(startup) as FounderProfile
}

function StartupCard({
  startup, canRequestIntro, introAlreadySent, onViewDetails
}: {
  startup: FounderProfile
  canRequestIntro: boolean
  introAlreadySent: boolean
  onViewDetails: (s: FounderProfile) => void
}) {
  const sc = sectorColor(startup.sector)
  const isVerified = startup.verification_status === 'verified' || startup.trust_badges?.includes('verified')
  const displayName = resolveStartupDisplayName(startup)
  const displayStage = resolveStartupDisplayStage(startup)
  const summary = resolveStartupSummary(startup)
  const avatarUrl = normalizeAvatarUrl(startup.profile?.avatar_url)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="group card-hover-lift cursor-pointer flex flex-col"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        height: '100%',
      }}
      onClick={() => onViewDetails(startup)}
    >
      {/* Card body — single seamless surface */}
      <div className="px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5 flex flex-col flex-1">
        {/* Header: avatar + name */}
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 object-cover"
              style={{ borderRadius: 10, border: '1px solid var(--line)' }}
              onError={e => {
                const el = e.currentTarget as HTMLImageElement
                el.style.display = 'none'
                if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center text-[13px] sm:text-[14px] font-bold"
            style={{
              borderRadius: 10,
              background: `${sc}14`,
              color: sc,
              border: `1px solid ${sc}20`,
              display: avatarUrl ? 'none' : 'flex',
            }}
          >
            {((displayName || '?')[0] || '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] sm:text-[14px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {displayName}
              </span>
              {isVerified && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />}
            </div>
            {summary && (
              <p className="text-[11px] sm:text-[11.5px] truncate mt-1 leading-snug" style={{ color: 'var(--muted)' }}>
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3 sm:mt-4" style={{ minHeight: 22 }}>
          {displayStage && (
            <span
              className="text-[10px] sm:text-[10.5px] font-medium px-2 sm:px-2.5 py-[3px] rounded-full whitespace-nowrap"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              {displayStage}
            </span>
          )}
          {startup.sector && (
            <span
              className="text-[10px] sm:text-[10.5px] font-medium px-2 sm:px-2.5 py-[3px] rounded-full inline-flex items-center gap-1"
              style={{ background: `${sc}0a`, color: sc }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: sc, opacity: 0.7 }} />
              {startup.sector}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 sm:my-4" style={{ height: 1, background: 'var(--line)', opacity: 0.5 }} />

        {/* Metrics row */}
        <div className="flex items-center gap-4 sm:gap-6" style={{ minHeight: 38 }}>
          {startup.arr ? (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.05em] block mb-1" style={{ color: 'var(--muted-2)' }}>ARR</span>
              <p className="text-[13px] sm:text-[14px] font-bold" style={{ color: 'var(--pos)', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {compactNumber(startup.arr)}
              </p>
            </div>
          ) : null}
          {startup.mom_growth ? (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.05em] block mb-1" style={{ color: 'var(--muted-2)' }}>Growth</span>
              <p className="text-[13px] sm:text-[14px] font-bold" style={{ color: '#0891B2', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {compactNumber(startup.mom_growth)}
              </p>
            </div>
          ) : null}
          {startup.raise_amount ? (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-[0.05em] block mb-1" style={{ color: 'var(--muted-2)' }}>Raising</span>
              <p className="text-[13px] sm:text-[14px] font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {compactNumber(startup.raise_amount)}
              </p>
            </div>
          ) : null}
          {!startup.arr && !startup.mom_growth && !startup.raise_amount && (
            <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>No metrics available</span>
          )}
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1 min-h-4 sm:min-h-5" />

        {/* Actions — seamless, no separator */}
        <div className="flex items-center gap-2">
          <button
            className="flex-1 h-[36px] sm:h-[36px] rounded-[10px] text-[12px] font-medium transition-all active:scale-[0.97]"
            style={{ background: 'var(--surface-3)', color: 'var(--ink)', border: 'none' }}
            onClick={e => { e.stopPropagation(); onViewDetails(startup) }}
          >
            View Details
          </button>
          {canRequestIntro && (
            introAlreadySent ? (
              <button
                className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all"
                style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: 'none' }}
                disabled
                onClick={e => e.stopPropagation()}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Requested</span>
                <span className="xs:hidden">Sent</span>
              </button>
            ) : (
              <button
                className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'var(--blue)', color: 'white', border: 'none' }}
                onClick={e => { e.stopPropagation(); onViewDetails(startup) }}
              >
                <Send className="w-3.5 h-3.5" />
                Intro
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StartupDrawer({ startup, onClose, onIntroSent }: {
  startup: FounderProfile | null
  onClose: () => void
  onIntroSent?: (profileId: string) => void
}) {
  const { user, profile } = useAuth()
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [introMsg, setIntroMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [introAlreadySent, setIntroAlreadySent] = useState(false)
  const [deckAccessStatus, setDeckAccessStatus] = useState<'none' | 'pending' | 'approved' | 'declined'>('none')
  const [requestingDeck, setRequestingDeck] = useState(false)
  const [deckUrl, setDeckUrl] = useState<string | null>(null)
  const [inPipeline, setInPipeline] = useState(false)
  const [addingToPipeline, setAddingToPipeline] = useState(false)

  // Check if an intro request was already sent and if startup is already in pipeline
  useEffect(() => {
    let alive = true
    async function checkExistingStatus() {
      if (!startup || !user || startup.id.startsWith('public_')) {
        setIntroAlreadySent(false)
        setInPipeline(false)
        return
      }
      try {
        const { data: app } = await supabase
          .from('startup_applications')
          .select('id')
          .eq('founder_id', startup.profile_id)
          .eq('status', 'approved')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!app?.id || !alive) return

        const [introRes, pipelineRes] = await Promise.all([
          supabase
            .from('introductions')
            .select('id')
            .eq('startup_id', app.id)
            .eq('investor_id', user.id)
            .limit(1)
            .maybeSingle(),
          supabase
            .from('deals')
            .select('id')
            .eq('startup_id', app.id)
            .eq('investor_id', user.id)
            .limit(1)
            .maybeSingle(),
        ])
        if (alive) {
          setIntroAlreadySent(!!introRes.data)
          setInPipeline(!!pipelineRes.data)
        }
      } catch {
        // Silent — best-effort check
      }
    }
    void checkExistingStatus()
    return () => { alive = false }
  }, [startup?.id, startup?.profile_id, user])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (showIntroModal) { setShowIntroModal(false); return }
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showIntroModal, onClose])

  // Check deck access status and only sign URL when approved
  useEffect(() => {
    let alive = true
    async function checkDeckAccess() {
      setDeckUrl(null)
      setDeckAccessStatus('none')
      if (!startup || !user || startup.id.startsWith('public_')) return

      try {
        const { data: app } = await supabase
          .from('startup_applications')
          .select('id')
          .eq('founder_id', startup.profile_id)
          .eq('status', 'approved')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (!app?.id || !alive) return

        const { data: existingReq } = await supabase
          .from('deck_access_requests')
          .select('status')
          .eq('investor_id', user.id)
          .eq('startup_id', app.id)
          .maybeSingle()

        if (!alive) return
        if (existingReq) {
          setDeckAccessStatus(existingReq.status as 'pending' | 'approved' | 'declined')
          // If approved, generate signed URL
          if (existingReq.status === 'approved' && startup.pitch_deck_url) {
            const path = startup.pitch_deck_url.replace(/^.*\/pitch-decks\//, '')
            const { data: signedData } = await supabase.storage
              .from('pitch-decks')
              .createSignedUrl(path, 60 * 60)
            if (alive) setDeckUrl(signedData?.signedUrl ?? null)
          }
        }
      } catch {
        // Silent — best-effort check
      }
    }
    void checkDeckAccess()
    return () => { alive = false }
  }, [startup?.id, startup?.profile_id, startup?.pitch_deck_url, user])

  const handleAddToPipeline = async () => {
    if (!startup || !user) return
    setAddingToPipeline(true)
    try {
      const { data: app } = await supabase
        .from('startup_applications')
        .select('id')
        .eq('founder_id', startup.profile_id)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!app?.id) {
        toast.error("This startup's application isn't approved yet.")
        return
      }
      // Ensure default pipeline stages exist, then grab first stage
      const { data: stages } = await supabase.rpc('ensure_default_pipeline_stages')
      const firstStageId = (stages as { id: string }[])?.[0]?.id ?? null

      const { error: err } = await supabase
        .from('deals')
        .upsert(
          {
            investor_id: user.id,
            startup_id: app.id,
            stage_id: firstStageId,
            pipeline_stage: (stages as { name: string }[])?.[0]?.name ?? 'Watching',
          },
          { onConflict: 'investor_id,startup_id' },
        )
      if (err) {
        toast.error(`Failed to add to pipeline: ${err.message}`)
        return
      }
      toast.success(`${resolveStartupDisplayName(startup)} added to your pipeline!`)
      setInPipeline(true)
    } catch (err) {
      console.error('[pipeline] add error:', err)
      toast.error('Failed to add to pipeline.')
    } finally {
      setAddingToPipeline(false)
    }
  }

  const handleRequestDeckAccess = async () => {
    if (!startup || !user) return
    if (deckAccessStatus === 'pending') {
      toast.info('Your deck access request is pending approval.')
      return
    }
    setRequestingDeck(true)
    try {
      const { data: application } = await supabase
        .from('startup_applications')
        .select('id')
        .eq('founder_id', startup.profile_id)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!application?.id) {
        toast.error("This startup's application isn't approved yet.")
        return
      }

      const { error: fnError } = await supabase.functions.invoke('request-deck-access', {
        body: { startupId: application.id },
      })
      if (fnError) {
        const ctx = (fnError as { context?: Response }).context
        let status: number | undefined
        let serverMsg: string | undefined
        try {
          if (ctx && typeof ctx.json === 'function') {
            status = ctx.status
            const body = (await ctx.json()) as { error?: string; message?: string }
            serverMsg = body.message ?? body.error
          }
        } catch { /* ignore */ }
        if (status === 409) {
          toast.error('You already requested access to this pitch deck.')
          setDeckAccessStatus('pending')
          return
        }
        if (status === 429) {
          toast.error(serverMsg ?? 'Too many requests. Try again later.')
          return
        }
        toast.error(serverMsg ?? 'Failed to request deck access.')
        return
      }
      toast.success('Deck access request sent! The founder will be notified.')
      setDeckAccessStatus('pending')
    } catch (err) {
      console.error('[deck-access] unexpected error:', err)
      toast.error('Failed to request deck access.')
    } finally {
      setRequestingDeck(false)
    }
  }

  const handleSendIntro = async () => {
    if (!startup || !user) return
    setSending(true)
    try {
      // send-intro expects a startup_applications.id, but the marketplace lists founder_profiles.
      // Look up the founder's approved application to bridge the two tables.
      const { data: application, error: appErr } = await supabase
        .from('startup_applications')
        .select('id')
        .eq('founder_id', startup.profile_id)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (appErr || !application) {
        toast.error("This startup's application isn't approved yet. Try again later.")
        return
      }

      const { error: fnError } = await supabase.functions.invoke('send-intro', {
        body: { startupId: application.id, message: introMsg },
      })

      if (fnError) {
        const ctx = (fnError as { context?: Response }).context
        let status: number | undefined
        let serverCode: string | undefined
        let serverMsg: string | undefined
        try {
          if (ctx && typeof ctx.json === 'function') {
            status = ctx.status
            const body = (await ctx.json()) as { error?: string; message?: string }
            serverCode = body.error
            serverMsg = body.message ?? body.error
          }
        } catch { /* ignore */ }

        if (status === 429 || serverCode === 'quota_exceeded') {
          toast.error(serverMsg ?? "You've hit today's intro limit. Upgrade to Pro for more.")
          return
        }
        if (status === 409) {
          toast.error('You already sent an intro request to this startup.')
          setIntroAlreadySent(true)
          setShowIntroModal(false)
          return
        }
        console.warn('[intro] send-intro failed:', { status, serverCode, serverMsg })
        toast.error(serverMsg ?? 'Failed to send intro request')
        return
      }

      toast.success('Intro request sent!')
      setShowIntroModal(false)
      setIntroMsg('')
      setIntroAlreadySent(true)
      if (onIntroSent && startup?.profile_id) onIntroSent(startup.profile_id)
    } catch (err) {
      console.error('[intro] unexpected error:', err)
      toast.error('Failed to send intro request')
    } finally {
      setSending(false)
    }
  }

  if (!startup) return null
  const sc = sectorColor(startup.sector)
  const isVerified = startup.verification_status === 'verified' || startup.trust_badges?.includes('verified')
  const displayName = resolveStartupDisplayName(startup)
  const displayStage = resolveStartupDisplayStage(startup)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end modal-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 480 }}
          animate={{ x: 0 }}
          exit={{ x: 480 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg h-full overflow-y-auto"
          style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {normalizeAvatarUrl(startup.profile?.avatar_url) ? (
                  <img
                    src={normalizeAvatarUrl(startup.profile?.avatar_url)!}
                    alt={displayName}
                    className="w-12 h-12 rounded-xl object-cover"
                    onError={e => {
                      const el = e.currentTarget as HTMLImageElement
                      el.style.display = 'none'
                      if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-semibold"
                  style={{
                    background: `${sc}20`, color: sc,
                    display: normalizeAvatarUrl(startup.profile?.avatar_url) ? 'none' : 'flex',
                  }}>
                  {((displayName || '?')[0] || '?').toUpperCase()}
                </div>
                <div>
                  <h2 className="h4" style={{ color: 'var(--ink)' }}>
                    {displayName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {startup.sector && (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${sc}20`, color: sc }}>{startup.sector}</span>
                    )}
                    {displayStage && (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--surface)', color: 'var(--muted-2)' }}>{displayStage}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!startup.id.startsWith('public_') && (
                  <ReportBlockMenu
                    reportedId={startup.profile_id}
                    reportedName={displayName || 'this founder'}
                    onBlocked={onClose}
                  />
                )}
                <button onClick={onClose}
                  aria-label="Close startup details"
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Founder */}
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--blue)' }}>
                {(startup.profile?.first_name ?? 'F')[0]}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{founderName(startup)}</p>
              </div>
              {isVerified && (
                <div className="ml-auto flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" style={{ color: '#2563eb' }} />
                  <span className="text-xs font-medium" style={{ color: '#2563eb' }}>Verified</span>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'ARR', value: compactNumber(startup.arr), color: 'var(--pos)' },
                { label: 'MoM Growth', value: compactNumber(startup.mom_growth), color: '#3486e8' },
                { label: 'Raising', value: compactNumber(startup.raise_amount), color: 'var(--blue)' },
                { label: 'Team Size', value: startup.team_size ? `${startup.team_size} people` : '—', color: 'var(--warn)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-4 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="text-base font-semibold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>{label}</p>
                </div>
              ))}
            </div>

            {/* About */}
            {startup.bio && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>About</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{stripMarkdown(startup.bio)}</p>
              </div>
            )}

            {/* Problem */}
            {startup.problem_statement && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Problem</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{stripMarkdown(startup.problem_statement)}</p>
              </div>
            )}

            {/* Target Market */}
            {startup.target_market && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Target Market</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{startup.target_market}</p>
              </div>
            )}

            {/* Use of Funds */}
            {startup.funding_purpose && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Use of Funds</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{startup.funding_purpose}</p>
              </div>
            )}

            {/* Pitch deck — gated access for investors */}
            {startup.pitch_deck_url && profile?.role === 'investor' && !startup.id.startsWith('public_') && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Pitch Deck</h3>
                {deckAccessStatus === 'approved' && deckUrl ? (
                  <a
                    href={deckUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--blue)' }}
                  >
                    <FileText className="w-4 h-4" />
                    View pitch deck (PDF)
                  </a>
                ) : deckAccessStatus === 'pending' ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted-2)' }}>
                    <Clock className="w-4 h-4" />
                    Deck access pending approval
                  </div>
                ) : (
                  <button
                    onClick={handleRequestDeckAccess}
                    disabled={requestingDeck}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      cursor: requestingDeck ? 'wait' : 'pointer',
                    }}
                  >
                    <Lock className="w-4 h-4" />
                    {requestingDeck ? 'Requesting...' : 'Request deck access'}
                  </button>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-2 mb-6">
              {startup.founded_year && (
                <div className="flex gap-3">
                  <span className="text-xs font-medium w-28 shrink-0" style={{ color: 'var(--muted-2)' }}>Founded</span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{startup.founded_year}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {profile?.role === 'investor' && !startup.id.startsWith('public_') && (
              <div className="space-y-3">
                {/* Pipeline + Website row */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToPipeline}
                    disabled={inPipeline || addingToPipeline}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                    style={{
                      background: inPipeline ? 'var(--surface-2)' : 'var(--ink)',
                      color: inPipeline ? 'var(--muted)' : 'white',
                      border: inPipeline ? '1px solid var(--line)' : 'none',
                      cursor: inPipeline ? 'default' : addingToPipeline ? 'wait' : 'pointer',
                    }}>
                    {inPipeline ? (
                      <><CheckCircle className="w-4 h-4" /> In Pipeline</>
                    ) : addingToPipeline ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</>
                    ) : (
                      <><PlusCircle className="w-4 h-4" /> Add to Pipeline</>
                    )}
                  </button>
                  {startup.website && (
                    <a href={startup.website} target="_blank" rel="noopener noreferrer"
                      aria-label={`Visit ${displayName} website`}
                      className="w-12 flex items-center justify-center rounded-xl"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                      <ExternalLink className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />
                    </a>
                  )}
                </div>
                {/* Intro request row */}
                <button
                  onClick={() => !introAlreadySent && setShowIntroModal(true)}
                  disabled={introAlreadySent}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: introAlreadySent ? 'var(--surface-2)' : 'var(--blue)',
                    color: introAlreadySent ? 'var(--muted)' : 'white',
                    border: introAlreadySent ? '1px solid var(--line)' : 'none',
                    cursor: introAlreadySent ? 'default' : 'pointer',
                  }}>
                  {introAlreadySent ? (
                    <><CheckCircle className="w-4 h-4" /> Intro Requested</>
                  ) : (
                    <><MessageSquare className="w-4 h-4" /> Send Intro Request</>
                  )}
                </button>
              </div>
            )}

            {/* Scraped startups — not on FounderCentral yet; show a note + website */}
            {startup.id.startsWith('public_') && (
              <div className="flex items-center gap-3">
                <p className="text-xs flex-1" style={{ color: 'var(--muted-2)' }}>
                  Not yet on FounderCentral. Source link below for more details.
                </p>
                {startup.website && (
                  <a href={startup.website} target="_blank" rel="noopener noreferrer"
                    aria-label={`Visit ${displayName} website`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open source
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Intro Modal */}
      <Modal
        open={showIntroModal}
        onClose={() => setShowIntroModal(false)}
        title="Send Intro Request"
        subtitle={`Introduce yourself to ${displayName}'s team.`}
        size="md"
        footer={
          <>
            <button onClick={() => setShowIntroModal(false)} className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
              Cancel
            </button>
            <button onClick={handleSendIntro} disabled={!introMsg.trim() || sending}
              className="px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
              style={{ background: !introMsg.trim() || sending ? 'rgba(37,99,235,0.4)' : 'var(--blue)', color: 'white' }}>
              {sending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Send className="w-4 h-4" />Send</>
              }
            </button>
          </>
        }
      >
        <textarea
          value={introMsg}
          onChange={e => setIntroMsg(e.target.value)}
          rows={4}
          placeholder="Hi, I'm interested in your startup because..."
          className="w-full px-4 py-3 text-sm rounded-xl resize-none outline-0"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
        />
      </Modal>
    </AnimatePresence>
  )
}

export function StartupMarketplacePage() {
  const { user, profile } = useAuth()
  const [startups, setStartups] = useState<FounderProfile[]>([])
  const [filtered, setFiltered] = useState<FounderProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [selectedStartup, setSelectedStartup] = useState<FounderProfile | null>(null)
  const [introSentIds, setIntroSentIds] = useState<Set<string>>(new Set())

  // Record a profile view when an investor opens a startup detail
  const handleViewStartup = useCallback(async (startup: FounderProfile) => {
    setSelectedStartup(startup)

    // Only record views for real platform startups (not scraped), and only by investors
    if (!startup.profile_id || startup.id?.startsWith('public_') || profile?.role !== 'investor') return

    try {
      // Look up the startup_application ID from the founder's profile_id
      const { data: app } = await supabase
        .from('startup_applications')
        .select('id')
        .eq('founder_id', startup.profile_id)
        .maybeSingle()

      if (!app?.id) return

      await supabase.from('profile_views').insert({
        viewer_id: profile.id,
        startup_id: app.id,
      })
    } catch {
      // Silent — view tracking is best-effort
    }
  }, [profile])

  const loadStartups = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      // Two sources: platform-onboarded founders (founder_profiles + profiles)
      // and scraped public companies (public_startups). Platform rows go first
      // so real signups always lead; scraped rows fill the rest of the feed.
      const [platformRes, publicRes] = await Promise.all([
        supabase
          .from('founder_profiles')
          .select('*, profile:profiles(first_name, last_name, avatar_url)')
          .order('updated_at', { ascending: false }),
        supabase
          .from('public_startups')
          .select('id, company_name, tagline, sector, city, country, stage, funding_amount, funding_amount_usd, description, source_url, source_name, announced_date, investor_name, updated_at')
          .order('updated_at', { ascending: false })
          .limit(500),
      ])

      if (platformRes.error) throw platformRes.error

      const platform = ((platformRes.data ?? []) as unknown as FounderProfile[]).map(normalizeStartupProfile)

      const scraped: FounderProfile[] = (publicRes.data ?? []).map(r => {
        const syntheticId = `public_${r.id}`
        // Scraped rows don't have a 1:1 shape with FounderProfile (some
        // fields are absent; Supabase selects type several as `any`). Build
        // a Partial and cast through unknown per the compiler's hint.
        const shaped: Partial<FounderProfile> = {
          id:                  syntheticId,
          profile_id:          syntheticId,
          founder_type:        'active',
          company_name:        r.company_name ?? null,
          sector:              r.sector ?? null,
          stage:               r.stage ?? null,
          raise_amount:        r.funding_amount ?? null,
          idea_title:          r.tagline ?? null,
          bio:                 r.description ?? null,
          website:             r.source_url ?? null,
          linkedin_url:        null,
          support_needed:      [] as string[],
          verified:            false,
          verification_status: 'pending',
          trust_badges:        [] as string[],
          views_count:         0,
          created_at:          r.updated_at ?? new Date().toISOString(),
          updated_at:          r.updated_at ?? new Date().toISOString(),
          profile:             null,
        }
        return normalizeStartupProfile(shaped as unknown as FounderProfile)
      })

      setStartups([...platform, ...scraped])
    } catch (error) {
      console.error('[StartupMarketplacePage] failed to load marketplace data', error)
      toast.error('Failed to load startups. Please refresh.')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStartups()
  }, [loadStartups])

  // Batch-load which startups the investor already sent intros to
  useEffect(() => {
    if (!user || profile?.role !== 'investor' || startups.length === 0) return
    let alive = true
    async function loadIntroStatuses() {
      try {
        // Get all founder profile IDs from platform startups
        const founderIds = startups
          .filter(s => !s.id.startsWith('public_') && s.profile_id)
          .map(s => s.profile_id)
        if (founderIds.length === 0) return

        // Get all startup application IDs for these founders
        const { data: apps } = await supabase
          .from('startup_applications')
          .select('id, founder_id')
          .in('founder_id', founderIds)
          .eq('status', 'approved')
        if (!apps?.length || !alive) return

        const appIds = apps.map(a => a.id)
        const founderToApp = new Map(apps.map(a => [a.founder_id, a.id]))

        // Check which of these have existing intros from this investor
        const { data: intros } = await supabase
          .from('introductions')
          .select('startup_id')
          .eq('investor_id', user!.id)
          .in('startup_id', appIds)
        if (!alive) return

        // Build a set of founder profile_ids that have intros
        const introStartupIds = new Set((intros ?? []).map(i => i.startup_id))
        const sentFounderIds = new Set<string>()
        for (const [founderId, appId] of founderToApp) {
          if (introStartupIds.has(appId)) sentFounderIds.add(founderId)
        }
        if (alive) setIntroSentIds(sentFounderIds)
      } catch {
        // Silent — best-effort
      }
    }
    void loadIntroStatuses()
    return () => { alive = false }
  }, [user, profile?.role, startups])

  useEffect(() => {
    const refresh = () => { void loadStartups(false) }
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('founder-central:founder-listing-updated', refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      window.removeEventListener('founder-central:founder-listing-updated', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [loadStartups])

  const applyFilters = useCallback(() => {
    let result = [...startups]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        resolveStartupDisplayName(s).toLowerCase().includes(q) ||
        (s.sector ?? '').toLowerCase().includes(q) ||
        resolveStartupSummary(s).toLowerCase().includes(q)
      )
    }
    if (stageFilter !== 'All') result = result.filter(s => resolveStartupDisplayStage(s) === stageFilter)
    if (sectorFilter !== 'All') result = result.filter(s => s.sector === sectorFilter)
    result = result.filter(s => resolveStartupDisplayName(s) !== 'Unnamed Startup')
    setFiltered(result)
  }, [startups, search, stageFilter, sectorFilter])

  useEffect(() => { applyFilters() }, [applyFilters])

  return (
    <div>
      <SEO title="Marketplace" path="/dashboard/marketplace" noindex />
      {/* Hero */}
      <HeroSection
        title="Startup Marketplace"
        subtitle={`${filtered.length} startup${filtered.length !== 1 ? 's' : ''} available`}
      />

      {/* Filters */}
      <div className="space-y-3 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search startups by name, sector, or description..."
          className="w-full sm:max-w-md"
          globalShortcut
          resultCount={search ? filtered.length : undefined}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            {STAGES.map(stage => (
              <button key={stage} onClick={() => setStageFilter(stage)}
                className="px-3 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-all"
                style={{
                  background: stageFilter === stage ? 'var(--blue-bg)' : 'var(--surface-2)',
                  border: `1px solid ${stageFilter === stage ? 'rgba(37,99,235,0.18)' : 'var(--line)'}`,
                  color: stageFilter === stage ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: stageFilter === stage ? 600 : 500,
                }}>
                {stage}
              </button>
            ))}
          </div>

          <div className="relative">
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium rounded-[10px] outline-0 transition-all cursor-pointer"
              style={{
                background: sectorFilter !== 'All' ? 'var(--blue-bg)' : 'var(--surface-2)',
                border: `1px solid ${sectorFilter !== 'All' ? 'rgba(37,99,235,0.18)' : 'var(--line)'}`,
                color: sectorFilter !== 'All' ? 'var(--blue)' : 'var(--muted)',
                fontWeight: sectorFilter !== 'All' ? 600 : 500,
              }}>
              {SECTORS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: sectorFilter !== 'All' ? 'var(--blue)' : 'var(--muted)' }} />
            </svg>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonBlock key={i} height={260} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No startups found"
          description="Try adjusting your filters."
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {filtered.map(startup => (
              <StartupCard
                key={startup.id}
                startup={startup}
                canRequestIntro={profile?.role === 'investor' && !startup.id.startsWith('public_')}
                introAlreadySent={introSentIds.has(startup.profile_id)}
                onViewDetails={handleViewStartup}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <StartupDrawer
        startup={selectedStartup}
        onClose={() => setSelectedStartup(null)}
        onIntroSent={(profileId) => setIntroSentIds(prev => new Set([...prev, profileId]))}
      />
    </div>
  )
}
