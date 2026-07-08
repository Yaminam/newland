import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { KPICard } from '@/app/components/ui/KPICard'
import {
  Handshake, TrendingUp, Clock,
  CheckCircle, XCircle, ArrowUpRight, Search, CalendarDays, RefreshCw
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'
import { Badge, statusBadgeVariant } from '@/app/components/ui/Badge'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { KPIGrid } from '@/app/components/ui/KPIGrid'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnershipRequest {
  id: string
  startup_name: string
  sector: string
  stage: string
  partnership_type: string
  description: string
  founder_name: string
  founder_email?: string
  arr_usd?: number
  requested_at: string
  status: 'pending' | 'active' | 'declined' | 'exploring'
}

const PARTNERSHIP_TYPES = ['All', 'Strategic Partnership', 'Pilot Program', 'Acquisition Target', 'Technology License', 'Joint Venture']
const STATUS_TABS = ['all', 'pending', 'exploring', 'active', 'declined'] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function formatARR(usd?: number): string {
  if (!usd) return '—'
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`
  return `$${usd}`
}

function parseArrText(arr?: string | null): number | undefined {
  if (!arr) return undefined
  const n = parseFloat(arr.replace(/[^0-9.]/g, ''))
  if (isNaN(n)) return undefined
  if (/cr/i.test(arr)) return n * 1e7
  if (/M/i.test(arr)) return n * 1e6
  if (/K/i.test(arr)) return n * 1e3
  return n
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
// KPICard now imported from shared primitive

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, onAction, onSchedule }: {
  req: PartnershipRequest
  onAction: (id: string, action: 'explore' | 'accept' | 'decline') => void
  onSchedule: (req: PartnershipRequest) => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
            {req.startup_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{req.startup_name}</p>
              <Badge variant={statusBadgeVariant(req.status)}>{req.status}</Badge>
            </div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted-2)' }}>
              {req.founder_name}{req.sector ? ` · ${req.sector}` : ''}{req.stage ? ` · ${req.stage}` : ''}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-medium"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706' }}>
                {req.partnership_type}
              </span>
              {req.arr_usd && (
                <span className="text-xs" style={{ color: 'var(--pos)' }}>
                  ARR: {formatARR(req.arr_usd)}
                </span>
              )}
            </div>
            {req.description && (
              <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
                {stripMarkdown(req.description)}
              </p>
            )}
            <p className="text-xs mt-2" style={{ color: 'var(--muted-2)' }}>
              {timeAgo(req.requested_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {req.status === 'pending' && (
            <>
              <button onClick={() => onAction(req.id, 'explore')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(89,203,239,0.1)', color: '#59cbef', border: '1px solid rgba(89,203,239,0.3)' }}>
                <ArrowUpRight className="w-3.5 h-3.5" /> Explore
              </button>
              <button onClick={() => onAction(req.id, 'accept')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--pos)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle className="w-3.5 h-3.5" /> Accept
              </button>
              <button onClick={() => onAction(req.id, 'decline')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <XCircle className="w-3.5 h-3.5" /> Decline
              </button>
            </>
          )}
          {(req.status === 'active' || req.status === 'exploring') && (
            <button onClick={() => onSchedule(req)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <CalendarDays className="w-3.5 h-3.5" /> Schedule Meeting
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────
export function PartnershipIntrosPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>('all')
  const [partnershipFilter, setPartnershipFilter] = useState('All')
  const [search, setSearch] = useState('')

  async function fetchRequests() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data: intros, error: introsErr } = await supabase
        .from('introductions')
        .select('id, status, message, initiated_at, startup_id')
        .eq('investor_id', user.id)
        .order('initiated_at', { ascending: false })
      if (introsErr) throw introsErr

      if (!intros || intros.length === 0) {
        setRequests([])
        return
      }

      // Resolve startup_id → founder_id via startup_applications
      const startupIds = intros.map(i => i.startup_id).filter(Boolean) as string[]
      const { data: startupRows } = await supabase
        .from('startup_applications')
        .select('id, founder_id, company_name, sector, stage')
        .in('id', startupIds)
      const startupMap = Object.fromEntries((startupRows ?? []).map(s => [s.id, s]))

      const founderIds = [...new Set(
        (startupRows ?? []).map(s => s.founder_id).filter(Boolean) as string[]
      )]

      const [fpRes, profilesRes] = await Promise.all([
        founderIds.length ? supabase.from('founder_profiles').select('profile_id, company_name, sector, stage, arr').in('profile_id', founderIds) : Promise.resolve({ data: [] }),
        founderIds.length ? supabase.from('profiles').select('id, first_name, last_name, email').in('id', founderIds) : Promise.resolve({ data: [] }),
      ])

      const fpMap = Object.fromEntries(((fpRes as { data: Array<{ profile_id: string; company_name?: string; sector?: string; stage?: string; arr?: string }> }).data ?? []).map(fp => [fp.profile_id, fp]))
      const pMap  = Object.fromEntries(((profilesRes as { data: Array<{ id: string; first_name?: string; last_name?: string; email?: string }> }).data ?? []).map(p  => [p.id, p]))

      const merged: PartnershipRequest[] = intros.map(intro => {
        const startup = startupMap[intro.startup_id] ?? {}
        const founderId = startup.founder_id ?? ''
        const fp = fpMap[founderId] ?? {}
        const p  = pMap[founderId]  ?? {}
        const dbStatus: string = intro.status ?? 'pending'
        const uiStatus: PartnershipRequest['status'] =
          dbStatus === 'accepted' ? 'active' :
          dbStatus === 'rejected' ? 'declined' : 'pending'

        return {
          id: intro.id,
          startup_name: fp.company_name ?? startup.company_name ?? 'Unknown Startup',
          sector: fp.sector ?? startup.sector ?? '',
          stage: fp.stage ?? startup.stage ?? '',
          partnership_type: 'Strategic Partnership',
          description: intro.message ?? '',
          founder_name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown Founder',
          founder_email: p.email,
          arr_usd: parseArrText(fp.arr),
          requested_at: intro.initiated_at,
          status: uiStatus,
        }
      })

      setRequests(merged)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load requests'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [user?.id])

  async function handleAction(id: string, action: 'explore' | 'accept' | 'decline') {
    if (!user?.id) return
    const dbStatus = action === 'accept' ? 'accepted' : action === 'decline' ? 'rejected' : null
    if (dbStatus) {
      const { error } = await supabase
        .from('introductions')
        .update({ status: dbStatus })
        .eq('id', id)
        .eq('investor_id', user.id)
        .select('id')
        .single()
      if (error) { toast.error('Failed to update request'); return }
    }
    const uiStatus: PartnershipRequest['status'] =
      action === 'explore' ? 'exploring' : action === 'accept' ? 'active' : 'declined'
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: uiStatus } : r))
    toast.success(action === 'accept' ? 'Partnership accepted' : action === 'decline' ? 'Request declined' : 'Exploring partnership')
  }

  function handleSchedule(req: PartnershipRequest) {
    if (req.founder_email) {
      window.location.href = `mailto:${req.founder_email}?subject=Partnership Meeting — ${req.startup_name}`
    } else {
      alert('Meeting scheduling coming soon')
    }
  }

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchTab = statusTab === 'all' || r.status === statusTab
      const matchType = partnershipFilter === 'All' || r.partnership_type === partnershipFilter
      const matchSearch = !search || `${r.startup_name} ${r.sector} ${r.founder_name}`.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchType && matchSearch
    })
  }, [requests, statusTab, partnershipFilter, search])

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    active: requests.filter(r => r.status === 'active' || r.status === 'exploring').length,
    declined: requests.filter(r => r.status === 'declined').length,
    avgARR: Math.round(
      requests.filter(r => r.arr_usd).reduce((s, r) => s + (r.arr_usd ?? 0), 0) /
      (requests.filter(r => r.arr_usd).length || 1)
    ),
  }

  return (
    <div className="pb-6 space-y-6">
      <SEO title="Partnership Intros" path="/dashboard/partnerships" noindex />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <Handshake className="w-4 h-4" style={{ color: '#d97706' }} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>Partnership Intros</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-2)' }}>
            Review and manage startup partnership requests for your CVC portfolio
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard icon={Handshake} label="Total Requests"     value={loading ? '—' : stats.total}           color="#f59e0b" delay={0} />
        <KPICard icon={Clock}     label="Pending Review"     value={loading ? '—' : stats.pending}         color="#f97316" delay={0.05} />
        <KPICard icon={CheckCircle} label="Active / Exploring" value={loading ? '—' : stats.active}        color="#10b981" delay={0.1} />
        <KPICard icon={TrendingUp} label="Avg Startup ARR"   value={loading ? '—' : formatARR(stats.avgARR)} color="#59cbef" delay={0.15} />
      </KPIGrid>

      {/* Filters */}
      <div className="p-4 rounded-2xl space-y-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
          <input type="text" placeholder="Search startups, founders, sectors…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm outline-0"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PARTNERSHIP_TYPES.map(t => (
            <button key={t} onClick={() => setPartnershipFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={partnershipFilter === t
                ? { background: 'var(--warn)', color: 'var(--surface)' }
                : { background: 'var(--surface-2)', color: 'var(--muted-2)', border: '1px solid var(--line)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)', width: 'fit-content' }}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatusTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize"
            style={statusTab === t
              ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: 'var(--muted-2)' }}>
            {t === 'all' ? `All (${stats.total})` : t === 'pending' ? `Pending (${stats.pending})` : t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} height={140} className="rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <p className="font-medium mb-2" style={{ color: 'var(--muted)' }}>Failed to load partnership requests</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-2)' }}>{error}</p>
          <button onClick={fetchRequests}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mx-auto"
            style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Handshake className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
          title={requests.length === 0 ? 'No partnership requests yet' : 'No requests match your filters'}
          description={requests.length === 0
            ? 'When founders request introductions, they\'ll appear here.'
            : 'Try adjusting your search or filter.'}
          className="card"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req, idx) => (
            <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.03 }}>
              <RequestCard req={req} onAction={handleAction} onSchedule={handleSchedule} />
            </motion.div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <p className="text-center text-xs" style={{ color: 'var(--muted-2)' }}>
          Showing {filtered.length} of {requests.length} requests
        </p>
      )}
    </div>
  )
}
