import { useState, useEffect, useCallback } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import {
  MessageSquare, CheckCircle, XCircle, Clock,
  TrendingUp, Mail, RefreshCw, Linkedin, Copy, FileText, Sparkles,
  ArrowUpRight, ArrowDownLeft, Kanban, Building2,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { usePipeline } from '@/app/hooks/usePipeline'
import { compactNumber } from '@/app/lib/utils'
import { toast } from 'sonner'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'

interface IntroRow {
  id: string
  investor_id: string
  founder_id?: string
  startup_id?: string
  initiated_by?: 'founder' | 'investor'
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired'
  message?: string
  initiated_at: string
  responded_at?: string
  investor?: { first_name: string; last_name: string; company?: string; investor_type?: string; avatar_url?: string }
  startup?: {
    company_name?: string; sector?: string; stage?: string; funding_ask_usd?: number;
    profile?: { first_name: string; last_name: string; avatar_url?: string } | null
  } | null
  incubation?: { name: string; incubation_type?: string; city?: string; logo_url?: string } | null
}

interface ContactDetails {
  other_user_id: string
  display_name: string | null
  email: string | null
  linkedin_url: string | null
  company: string | null
}

interface DeckAccessRow {
  id: string
  investor_id: string
  founder_id: string
  startup_id: string
  status: 'pending' | 'approved' | 'declined'
  message?: string
  requested_at: string
  responded_at?: string
  investor?: { first_name: string; last_name: string; company?: string; avatar_url?: string }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'var(--warn-bg)', color: 'var(--warn)' },
  accepted:  { bg: 'var(--pos-bg)',  color: 'var(--pos)' },
  completed: { bg: 'var(--pos-bg)',  color: 'var(--pos)' },
  declined:  { bg: 'var(--neg-bg)',  color: 'var(--neg)' },
  expired:   { bg: 'var(--surface-3)', color: 'var(--muted-2)' },
  approved:  { bg: 'var(--pos-bg)',  color: 'var(--pos)' },
}

// ─── KPI card ─────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3.5 p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>{label}</div>
        <div className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>{value}</div>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  const Icon = status === 'pending' ? Clock
    : (status === 'accepted' || status === 'completed' || status === 'approved') ? CheckCircle
    : status === 'declined' ? XCircle
    : Clock
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-[3px] rounded-full"
      style={{ background: st.bg, color: st.color, letterSpacing: '0.03em' }}>
      <Icon className="w-2.5 h-2.5" />
      {status}
    </span>
  )
}

export function WarmIntroductionsPage() {
  const { profile } = useAuth()
  const [intros, setIntros] = useState<IntroRow[]>([])
  const [loading, setLoading] = useState(true)

  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t === 'deck-requests') return 'deck-requests' as const
    return 'pending' as const
  })()
  const [tab, setTab] = useState<'pending' | 'accepted' | 'all' | 'deck-requests'>(initialTab)
  const [responding, setResponding] = useState<string | null>(null)
  const [deckRequests, setDeckRequests] = useState<DeckAccessRow[]>([])
  const [respondingDeck, setRespondingDeck] = useState<string | null>(null)

  const isInvestor = profile?.role === 'investor'
  const { addDeal, deals: pipelineDeals } = usePipeline()
  const pipelineStartupIds = new Set(pipelineDeals.map(d => d.startup_id))
  const [addingToPipeline, setAddingToPipeline] = useState<string | null>(null)

  async function fetchIntros() {
    setLoading(true)
    try {
      if (isInvestor) {
        const { data: introData, error } = await supabase
          .from('introductions')
          .select('id, investor_id, founder_id, startup_id, initiated_by, status, message, initiated_at, responded_at')
          .eq('investor_id', profile!.id)
          .order('initiated_at', { ascending: false })
        if (error) throw error

        const rows = introData ?? []

        // Collect unique IDs for batch lookups
        const startupIds = [...new Set(rows.map(r => r.startup_id).filter(Boolean) as string[])]
        const senderIds  = [...new Set(rows.map(r => r.founder_id).filter(Boolean) as string[])]

        // Batch: startup applications + sender profiles
        const [startupsRes, senderProfilesRes] = await Promise.all([
          startupIds.length > 0
            ? supabase.from('startup_applications')
                .select('id, company_name, sector, stage, funding_ask_usd, founder_id')
                .in('id', startupIds)
            : Promise.resolve({ data: [] as { id: string; company_name?: string; sector?: string; stage?: string; funding_ask_usd?: number; founder_id?: string }[] }),
          senderIds.length > 0
            ? supabase.from('profiles')
                .select('id, first_name, last_name, avatar_url, access_role')
                .in('id', senderIds)
            : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string; avatar_url?: string; access_role?: string }[] }),
        ])

        const startupMap      = new Map((startupsRes.data ?? []).map(s => [s.id, s]))
        const senderProfileMap = new Map((senderProfilesRes.data ?? []).map(p => [p.id, p]))

        // Identify incubation admin senders
        const incubAdminIds = senderIds.filter(id => senderProfileMap.get(id)?.access_role === 'incubation_admin')

        // IDs of startup-application founders we need
        const startupFounderIds = [...new Set(
          (startupsRes.data ?? []).map(s => s.founder_id).filter(Boolean) as string[]
        )]

        // Batch: startup founder profiles + incubation profiles
        const [startupFounderRes, incubProfilesRes] = await Promise.all([
          startupFounderIds.length > 0
            ? supabase.from('profiles')
                .select('id, first_name, last_name, avatar_url')
                .in('id', startupFounderIds)
            : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string; avatar_url?: string }[] }),
          incubAdminIds.length > 0
            ? supabase.from('incubation_profiles')
                .select('owner_id, name, incubation_type, city, logo_url')
                .in('owner_id', incubAdminIds)
            : Promise.resolve({ data: [] as { owner_id: string; name: string; incubation_type?: string; city?: string; logo_url?: string }[] }),
        ])

        const startupFounderMap = new Map((startupFounderRes.data ?? []).map(p => [p.id, p]))
        const incubMap          = new Map((incubProfilesRes.data ?? []).map(ip => [ip.owner_id, ip]))

        const enriched = rows.map(intro => {
          const startup         = intro.startup_id ? (startupMap.get(intro.startup_id) ?? null) : null
          const startupFounder  = startup?.founder_id ? (startupFounderMap.get(startup.founder_id) ?? null) : null
          const senderProfile   = intro.founder_id ? senderProfileMap.get(intro.founder_id) : null
          const incubation      = senderProfile?.access_role === 'incubation_admin' && intro.founder_id
            ? (incubMap.get(intro.founder_id) ?? null)
            : null
          return {
            ...intro,
            startup:    startup ? { ...startup, profile: startupFounder } : null,
            incubation,
          }
        })

        setIntros(enriched as IntroRow[])
      } else {
        // Fetch startup IDs owned by this founder so we can also catch legacy
        // intros where founder_id was NULL before the backfill migration ran.
        const { data: myStartups } = await supabase
          .from('startup_applications')
          .select('id')
          .eq('founder_id', profile!.id)

        const myStartupIds = (myStartups ?? []).map(s => s.id)

        const orFilter = myStartupIds.length > 0
          ? `founder_id.eq.${profile!.id},startup_id.in.(${myStartupIds.join(',')})`
          : `founder_id.eq.${profile!.id}`

        const { data: introData, error } = await supabase
          .from('introductions')
          .select('id, investor_id, founder_id, startup_id, initiated_by, status, message, initiated_at, responded_at')
          .or(orFilter)
          .order('initiated_at', { ascending: false })
        if (error) throw error

        const rows = introData ?? []

        // Batch: collect unique investor IDs and fetch all at once (avoids N+1)
        const investorIds = [...new Set(rows.map(r => r.investor_id).filter(Boolean) as string[])]
        const { data: investorProfiles } = investorIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, first_name, last_name, company, investor_type, avatar_url')
              .in('id', investorIds)
          : { data: [] as { id: string; first_name: string; last_name: string; company?: string; investor_type?: string; avatar_url?: string }[] }

        const investorMap = new Map((investorProfiles ?? []).map(p => [p.id, p]))

        const enriched = rows.map(intro => ({
          ...intro,
          investor: intro.investor_id ? (investorMap.get(intro.investor_id) ?? null) : null,
        }))
        setIntros(enriched as IntroRow[])
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load introductions')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDeckRequests() {
    if (!profile || isInvestor) return
    try {
      const { data: reqData, error } = await supabase
        .from('deck_access_requests')
        .select('id, investor_id, founder_id, startup_id, status, message, requested_at, responded_at')
        .eq('founder_id', profile.id)
        .order('requested_at', { ascending: false })
      if (error) throw error

      const reqs = reqData ?? []

      // Batch: fetch all investor profiles at once (avoids N+1)
      const deckInvestorIds = [...new Set(reqs.map(r => r.investor_id).filter(Boolean) as string[])]
      const { data: deckInvestorProfiles } = deckInvestorIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, company, avatar_url')
            .in('id', deckInvestorIds)
        : { data: [] as { id: string; first_name: string; last_name: string; company?: string; avatar_url?: string }[] }

      const deckInvestorMap = new Map((deckInvestorProfiles ?? []).map(p => [p.id, p]))

      const enriched = reqs.map(req => ({
        ...req,
        investor: req.investor_id ? (deckInvestorMap.get(req.investor_id) ?? null) : null,
      }))
      setDeckRequests(enriched as DeckAccessRow[])
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load deck requests')
    }
  }

  async function respondDeck(requestId: string, action: 'approve' | 'decline') {
    if (!profile?.id) return
    setRespondingDeck(requestId)
    try {
      const { error: fnError } = await supabase.functions.invoke('respond-deck-access', {
        body: { requestId, status: action === 'approve' ? 'approved' : 'declined' },
      })
      if (fnError) throw fnError
      toast.success(action === 'approve' ? 'Deck access approved — investor will be notified.' : 'Deck access declined')
      fetchDeckRequests()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to respond')
    } finally {
      setRespondingDeck(null)
    }
  }

  useEffect(() => { if (profile) { fetchIntros(); fetchDeckRequests(); } }, [profile])

  const [contacts, setContacts] = useState<Record<string, ContactDetails | null>>({})

  const loadContactsForAccepted = useCallback(async (rows: IntroRow[]) => {
    const needed = rows.filter(r =>
      (r.status === 'accepted' || r.status === 'completed') && contacts[r.id] === undefined,
    )
    if (needed.length === 0) return
    const entries = await Promise.all(needed.map(async (r) => {
      const { data, error } = await supabase.rpc('get_intro_contact', { p_intro_id: r.id })
      if (error || !data || data.length === 0) return [r.id, null] as const
      return [r.id, data[0] as ContactDetails] as const
    }))
    setContacts(prev => {
      const next = { ...prev }
      for (const [id, c] of entries) next[id] = c
      return next
    })
  }, [contacts])

  useEffect(() => { void loadContactsForAccepted(intros) }, [intros, loadContactsForAccepted])

  async function respond(introId: string, action: 'accept' | 'reject') {
    if (!profile?.id) return
    setResponding(introId)
    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    // Optimistic update — update local state immediately so the UI
    // responds at click speed instead of waiting for the round-trip.
    const prev = intros
    setIntros(cur => cur.map(r => r.id === introId
      ? { ...r, status: newStatus, responded_at: new Date().toISOString() }
      : r
    ))

    try {
      const { error } = await supabase
        .from('introductions')
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq('id', introId)
      if (error) throw error

      void supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('type', 'intro_request')
        .eq('read', false)

      toast.success(action === 'accept' ? 'Intro accepted — contact details unlocked.' : 'Intro request declined')
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setIntros(prev)
      toast.error((err as Error).message ?? 'Failed to respond')
    } finally {
      setResponding(null)
    }
  }

  async function handleAddToPipeline(startupId: string, companyName: string) {
    setAddingToPipeline(startupId)
    try {
      const result = await addDeal(startupId)
      if (result && '_duplicate' in result && (result as { _duplicate?: boolean })._duplicate) {
        toast.info(`${companyName} is already in your pipeline`)
      } else if (result) {
        toast.success(`${companyName} added to pipeline`)
      }
    } catch {
      toast.error('Failed to add to pipeline')
    } finally {
      setAddingToPipeline(null)
    }
  }

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied.`),
      () => toast.error('Clipboard blocked by browser'),
    )
  }

  const filtered = intros.filter(i => {
    if (tab === 'pending') return i.status === 'pending'
    if (tab === 'accepted') return i.status === 'accepted' || i.status === 'completed'
    return true
  })

  const stats = {
    total: intros.length,
    pending: intros.filter(i => i.status === 'pending').length,
    accepted: intros.filter(i => i.status === 'accepted' || i.status === 'completed').length,
    rate: intros.filter(i => i.status !== 'pending').length > 0
      ? Math.round((intros.filter(i => i.status === 'accepted').length / intros.filter(i => i.status !== 'pending').length) * 100)
      : 0,
  }

  const pendingDeckCount = deckRequests.filter(r => r.status === 'pending').length

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: stats.pending },
    { key: 'accepted' as const, label: 'Accepted', count: stats.accepted },
    { key: 'all' as const, label: 'All', count: stats.total },
    ...(!isInvestor ? [{ key: 'deck-requests' as const, label: 'Deck Requests', count: pendingDeckCount }] : []),
  ]

  return (
    <div>
      <SEO title="Introductions" path="/dashboard/introductions" noindex />

      <HeroSection
        title={isInvestor ? 'Intro Requests' : 'My Introductions'}
        subtitle={isInvestor ? 'Review and respond to founder introduction requests' : 'Track your outreach to investors'}
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={84} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KpiCard icon={MessageSquare} label={isInvestor ? 'Requests' : 'Total'} value={stats.total} color="#2563EB" />
          <KpiCard icon={Clock} label="Pending" value={stats.pending} color="#D97706" />
          <KpiCard icon={CheckCircle} label="Accepted" value={stats.accepted} color="#059669" />
          <KpiCard icon={TrendingUp} label="Response Rate" value={`${stats.rate}%`} color="#7C3AED" />
        </div>
      )}

      {/* Tabs + Refresh */}
      <div className="flex items-center justify-between gap-3 mt-6 mb-6 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative px-3.5 py-1.5 rounded-[10px] text-xs whitespace-nowrap transition-colors shrink-0"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  color: active ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {active && (
                  <motion.span
                    layoutId="introTabPill"
                    className="absolute inset-0 rounded-[10px]"
                    style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.18)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-[1] inline-flex items-center">
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className="ml-1.5 text-[10px] font-semibold px-1.5 py-[1px] rounded-full"
                      style={{
                        background: active ? 'var(--blue)' : 'var(--surface-3)',
                        color: active ? 'white' : 'var(--muted-2)',
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
        <button
          onClick={fetchIntros}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all shrink-0 active:scale-[0.97]"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Deck Requests Tab */}
      {tab === 'deck-requests' && !isInvestor && (
        <div className="space-y-3">
          {deckRequests.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
              title="No deck access requests"
              description="When investors request access to your pitch deck, they'll appear here"
            />
          ) : deckRequests.map((req, idx) => {
            const investorName = `${req.investor?.first_name ?? ''} ${req.investor?.last_name ?? ''}`.trim() || 'Investor'
            const avatarUrl = req.investor?.avatar_url
            const st = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="group card-hover-lift"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${st.color}`,
                  borderRadius: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div className="px-4 py-5 sm:px-5 sm:py-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={investorName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] object-cover shrink-0" style={{ border: '1px solid var(--line)' }} />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center text-[13px] sm:text-[14px] font-bold shrink-0"
                        style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.15)' }}>
                        {investorName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] sm:text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                          {investorName}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-[11px] sm:text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
                        {req.investor?.company ?? 'Investor'} · Wants to view your pitch deck
                      </p>
                      {req.message && (
                        <p className="text-[11px] sm:text-[12px] mt-2.5 pl-3 line-clamp-2 italic" style={{ color: 'var(--muted)', borderLeft: '2px solid rgba(37,99,235,0.30)' }}>
                          {req.message}
                        </p>
                      )}
                      <p className="text-[10px] mt-2" style={{ color: 'var(--muted-2)' }}>
                        {timeAgo(req.requested_at)}
                        {req.responded_at && ` · Responded ${timeAgo(req.responded_at)}`}
                      </p>
                    </div>

                    {/* Actions */}
                    {req.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => respondDeck(req.id, 'decline')}
                          disabled={respondingDeck === req.id}
                          className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{ background: 'var(--neg-bg)', color: 'var(--neg)', border: 'none' }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{respondingDeck === req.id ? '...' : 'Decline'}</span>
                        </button>
                        <button
                          onClick={() => respondDeck(req.id, 'approve')}
                          disabled={respondingDeck === req.id}
                          className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{ background: 'var(--pos)', color: '#fff', border: 'none' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{respondingDeck === req.id ? '...' : 'Approve'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Intro List */}
      {tab !== 'deck-requests' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonBlock key={i} height={120} />
            ))
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
              title="No introductions found"
              description={isInvestor ? 'Founders will send you intro requests here' : 'Browse investors and send intro requests'}
            />
          ) : filtered.map((intro, idx) => {
            const iInitiated =
              (intro.initiated_by === 'investor' && isInvestor) ||
              (intro.initiated_by === 'founder'  && !isInvestor)
            const isRecipient = intro.status === 'pending' && !iInitiated
            const contact = contacts[intro.id] ?? null

            const isIncubation = isInvestor && !!intro.incubation

            const otherName = isInvestor
              ? isIncubation
                ? intro.incubation!.name
                : `${intro.startup?.profile?.first_name ?? ''} ${intro.startup?.profile?.last_name ?? ''}`.trim()
                    || intro.startup?.company_name || 'Founder'
              : `${intro.investor?.first_name ?? ''} ${intro.investor?.last_name ?? ''}`.trim() || 'Investor'

            const subline = isInvestor
              ? isIncubation
                ? [
                    intro.incubation!.incubation_type?.replace(/_/g, ' '),
                    intro.incubation!.city,
                  ].filter(Boolean).join(' · ')
                : `${intro.startup?.company_name ?? 'Startup'} · ${intro.startup?.sector ?? '—'} · ${intro.startup?.stage ?? '—'}`
              : `${intro.investor?.company ?? 'Investor'} · ${intro.investor?.investor_type?.replace(/-/g, ' ') ?? ''}`

            const avatarUrl = isInvestor
              ? isIncubation
                ? intro.incubation!.logo_url ?? null
                : intro.startup?.profile?.avatar_url ?? null
              : intro.investor?.avatar_url ?? null

            const avatarName = isInvestor
              ? isIncubation
                ? intro.incubation!.name
                : intro.startup?.profile?.first_name ?? intro.startup?.company_name ?? 'S'
              : intro.investor?.first_name ?? 'I'

            const st = STATUS_STYLE[intro.status] ?? STATUS_STYLE.pending

            return (
              <motion.div
                key={intro.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="card-hover-lift"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${st.color}`,
                  borderRadius: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div className="px-4 py-5 sm:px-5 sm:py-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={otherName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] object-cover shrink-0" style={{ border: '1px solid var(--line)' }} />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center text-[13px] sm:text-[14px] font-bold shrink-0"
                        style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.15)' }}>
                        {avatarName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Name + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] sm:text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                          {otherName}
                        </span>
                        <StatusBadge status={intro.status} />
                        {isIncubation && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-[2px] rounded-full inline-flex items-center gap-1 uppercase"
                            style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED', letterSpacing: '0.03em' }}
                          >
                            <Building2 className="w-[10px] h-[10px]" /> Incubation
                          </span>
                        )}
                        {intro.initiated_by && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-[2px] rounded-full inline-flex items-center gap-1"
                            style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
                          >
                            {iInitiated
                              ? <><ArrowUpRight className="w-[10px] h-[10px]" /> Sent</>
                              : <><ArrowDownLeft className="w-[10px] h-[10px]" /> Received</>}
                          </span>
                        )}
                      </div>

                      {/* Subtitle */}
                      <p className="text-[11px] sm:text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
                        {subline}
                      </p>

                      {/* Raising amount */}
                      {isInvestor && intro.startup?.funding_ask_usd != null && intro.startup.funding_ask_usd > 0 && (
                        <span
                          className="inline-block text-[11px] font-bold mt-1.5"
                          style={{ color: 'var(--pos)', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          Raising {compactNumber(intro.startup.funding_ask_usd)}
                        </span>
                      )}

                      {/* Message */}
                      {intro.message && (
                        <p className="text-[11px] sm:text-[12px] mt-2.5 pl-3 line-clamp-2 italic leading-relaxed" style={{ color: 'var(--muted)', borderLeft: '2px solid rgba(37,99,235,0.30)' }}>
                          {intro.message}
                        </p>
                      )}

                      {/* Time */}
                      <p className="text-[10px] mt-2" style={{ color: 'var(--muted-2)' }}>
                        {iInitiated ? 'Sent' : 'Received'} {timeAgo(intro.initiated_at)}
                        {intro.responded_at && ` · Responded ${timeAgo(intro.responded_at)}`}
                      </p>
                    </div>

                    {/* Accept / Decline buttons */}
                    {isRecipient && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => respond(intro.id, 'reject')}
                          disabled={responding === intro.id}
                          className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{ background: 'var(--neg-bg)', color: 'var(--neg)', border: 'none' }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{responding === intro.id ? '...' : 'Decline'}</span>
                        </button>
                        <button
                          onClick={() => respond(intro.id, 'accept')}
                          disabled={responding === intro.id}
                          className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{ background: 'var(--pos)', color: '#fff', border: 'none' }}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{responding === intro.id ? '...' : 'Accept'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contact details + Pipeline button — unlocked on accepted/completed */}
                  {(intro.status === 'accepted' || intro.status === 'completed') && (
                    <div className="mt-4 pt-3 sm:pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                        <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--pos)', letterSpacing: '0.04em' }}>
                          You're connected · contact unlocked
                        </span>
                      </div>
                      {contact === undefined ? (
                        <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Loading contact details…</p>
                      ) : !contact ? (
                        <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Contact details unavailable.</p>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          {contact.email ? (
                            <div
                              className="flex items-center gap-2 px-3 py-2 rounded-[10px] flex-1 min-w-0"
                              style={{ background: 'var(--surface-3)' }}
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                              <a href={`mailto:${contact.email}`} className="text-[11px] sm:text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                                {contact.email}
                              </a>
                              <button
                                onClick={() => copyToClipboard(contact.email!, 'Email')}
                                className="ml-auto w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 transition-all hover:bg-white/50"
                                style={{ color: 'var(--muted-2)' }}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] flex-1" style={{ background: 'var(--surface-3)' }}>
                              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                              <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>No email on file</span>
                            </div>
                          )}
                          {contact.linkedin_url ? (
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-[10px] transition-all hover:opacity-80"
                              style={{ background: 'var(--surface-3)' }}
                            >
                              <Linkedin className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A66C2' }} />
                              <span className="text-[11px] sm:text-[12px] font-medium" style={{ color: 'var(--ink)' }}>LinkedIn</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--surface-3)' }}>
                              <Linkedin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                              <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>No LinkedIn</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add to Pipeline button (investor only) */}
                      {isInvestor && intro.startup_id && (
                        <div className="mt-3">
                          {pipelineStartupIds.has(intro.startup_id) ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                              style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              In Pipeline
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddToPipeline(intro.startup_id!, intro.startup?.company_name ?? 'Startup')}
                              disabled={addingToPipeline === intro.startup_id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
                              style={{ background: 'var(--blue)', color: 'white' }}
                            >
                              <Kanban className="w-3.5 h-3.5" />
                              {addingToPipeline === intro.startup_id ? 'Adding...' : 'Add to Pipeline'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {!loading && tab !== 'deck-requests' && filtered.length > 0 && (
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--muted-2)' }}>
          Showing {filtered.length} of {intros.length} introductions
        </p>
      )}
    </div>
  )
}
