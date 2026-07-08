import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { KPICard } from '@/app/components/ui/KPICard'
import {
  Coins, Building2, TrendingUp, Users, Star,
  Search, Filter, ChevronDown, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'
import { compactNumber } from '@/app/lib/utils'
import { useAuth } from '@/app/context/AuthContext'
import { Badge, statusBadgeVariant } from '@/app/components/ui/Badge'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { KPIGrid } from '@/app/components/ui/KPIGrid'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoInvestOpportunity {
  id: string
  company_name: string
  sector: string
  stage: string
  arr?: string
  mom_growth?: string
  problem_statement?: string
  profile_id: string
  created_at: string
  is_featured: boolean
  status: 'open' | 'closing' | 'closed'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deriveStatus(createdAt: string): 'open' | 'closing' | 'closed' {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000
  if (days < 30) return 'open'
  if (days < 60) return 'closing'
  return 'closed'
}

const STATUS_LABELS: Record<CoInvestOpportunity['status'], string> = {
  open: 'Open',
  closing: 'Closing Soon',
  closed: 'Closed',
}

const SECTORS = ['All', 'AI/ML', 'FinTech', 'HealthTech', 'SaaS', 'CleanTech', 'EdTech', 'AgriTech', 'DeepTech', 'Consumer']
const STAGES  = ['All', 'Seed', 'Series A', 'Series B']

// ─── KPI Card ─────────────────────────────────────────────────────────────────
// KPICard imported from shared primitive

// ─── Opportunity Card ─────────────────────────────────────────────────────────
function OpportunityCard({ opp, expressed, onInterest }: {
  opp: CoInvestOpportunity
  expressed: boolean
  onInterest: (opp: CoInvestOpportunity) => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5"
      style={opp.is_featured ? { border: '1px solid rgba(16,185,129,0.4)' } : undefined}>
      {opp.is_featured && (
        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--pos)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--pos)' }}>Featured Opportunity</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: 'rgba(16,185,129,0.15)', color: '#059669' }}>
            {opp.company_name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            {/* Name + status badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>{opp.company_name}</p>
              <Badge variant={statusBadgeVariant(opp.status)}>{STATUS_LABELS[opp.status]}</Badge>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--muted-2)' }}>
              {opp.sector} · {opp.stage}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <p className="text-xs" style={{ color: 'var(--muted-2)' }}>Stage</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{opp.stage}</p>
              </div>
              {opp.arr && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-2)' }}>ARR</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--pos)' }}>{compactNumber(opp.arr)}</p>
                </div>
              )}
              {opp.mom_growth && (
                <div className="p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted-2)' }}>MoM Growth</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--pos)' }}>{compactNumber(opp.mom_growth)}</p>
                </div>
              )}
            </div>

            {opp.problem_statement && (
              <p className="text-sm line-clamp-2" style={{ color: 'var(--muted)' }}>
                {stripMarkdown(opp.problem_statement)}
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onInterest(opp)}
            disabled={opp.status === 'closed' || expressed}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={
              expressed
                ? { background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.4)' }
                : opp.status === 'closed'
                  ? { background: 'var(--surface-2)', color: 'var(--muted-2)' }
                  : { background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)' }
            }>
            <Coins className="w-4 h-4" />
            {expressed ? <><CheckCircle className="w-3.5 h-3.5" /> Interested</> : opp.status === 'closed' ? 'Closed' : 'Express Interest'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CoInvestPage() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<CoInvestOpportunity[]>([])
  const [expressedIds, setExpressedIds]   = useState<Set<string>>(new Set())
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [sectorFilter, setSectorFilter]   = useState('All')
  const [stageFilter, setStageFilter]     = useState('All')
  const [search, setSearch]               = useState('')
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [expressingId, setExpressingId]   = useState<string | null>(null)

  useEffect(() => { fetchOpportunities() }, [])

  async function fetchOpportunities() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [appRes, bookmarkRes] = await Promise.all([
        supabase
          .from('startup_applications')
          .select('id, company_name, sector, stage, arr, mom_growth, problem_statement, profile_id, created_at')
          .eq('verified', true)
          .in('stage', ['Seed', 'Series A', 'Series B'])
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('bookmarks')
          .select('founder_id')
          .eq('investor_id', user.id),
      ])

      if (appRes.error) throw appRes.error
      if (bookmarkRes.error) throw bookmarkRes.error

      const bookedSet = new Set((bookmarkRes.data ?? []).map(b => b.founder_id as string))
      setExpressedIds(bookedSet)

      const mapped: CoInvestOpportunity[] = (appRes.data ?? []).map((row, idx) => ({
        id:                row.id,
        company_name:      row.company_name ?? 'Unnamed',
        sector:            row.sector ?? 'Other',
        stage:             row.stage ?? 'Seed',
        arr:               row.arr ?? undefined,
        mom_growth:        row.mom_growth ?? undefined,
        problem_statement: row.problem_statement ?? undefined,
        profile_id:        row.profile_id,
        created_at:        row.created_at,
        is_featured:       idx < 2,
        status:            deriveStatus(row.created_at),
      }))

      setOpportunities(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  async function handleInterest(opp: CoInvestOpportunity) {
    if (!user || expressingId) return
    setExpressingId(opp.id)
    try {
      const { error: upsertErr } = await supabase
        .from('bookmarks')
        .upsert(
          { investor_id: user.id, founder_id: opp.profile_id },
          { onConflict: 'investor_id,founder_id' }
        )
      if (upsertErr) throw upsertErr
      setExpressedIds(prev => new Set([...prev, opp.profile_id]))
    } catch (err) {
      console.error('Express interest failed:', err)
    } finally {
      setExpressingId(null)
    }
  }

  const filtered = useMemo(() => {
    return opportunities.filter(o => {
      const matchSector = sectorFilter === 'All' || o.sector === sectorFilter
      const matchStage  = stageFilter  === 'All' || o.stage  === stageFilter
      const matchSearch = !search || `${o.company_name} ${o.sector}`.toLowerCase().includes(search.toLowerCase())
      return matchSector && matchStage && matchSearch
    })
  }, [opportunities, sectorFilter, stageFilter, search])

  const openCount    = opportunities.filter(o => o.status === 'open').length
  const closingCount = opportunities.filter(o => o.status === 'closing').length

  return (
    <div className="pb-6 space-y-6">
      <SEO title="Co-Invest" path="/dashboard/co-invest" noindex />
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Coins className="w-4 h-4" style={{ color: '#059669' }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>Co-Invest Opportunities</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted-2)' }}>
          Curated co-investment opportunities from verified startups
        </p>
      </motion.div>

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard icon={Coins}     label="Total Opportunities" value={opportunities.length} color="#10b981" delay={0}    />
        <KPICard icon={TrendingUp} label="Open Rounds"        value={openCount}            color="#059669" delay={0.05} />
        <KPICard icon={Building2} label="Closing Soon"        value={closingCount}         color="#f59e0b" delay={0.1}  />
        <KPICard icon={Users}     label="Expressed Interest"  value={expressedIds.size}    color="#2563EB" delay={0.15} />
      </KPIGrid>

      {/* Filters */}
      <div className="p-4 rounded-2xl space-y-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
          <input type="text" placeholder="Search startups or sectors…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm outline-0"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sector pills */}
          <div className="flex flex-wrap gap-2">
            {SECTORS.slice(0, 6).map(s => (
              <button key={s} onClick={() => setSectorFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={sectorFilter === s
                  ? { background: 'var(--pos)', color: 'var(--surface)' }
                  : { background: 'var(--surface-2)', color: 'var(--muted-2)', border: '1px solid var(--line)' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Stage dropdown */}
          <div className="relative">
            <button onClick={() => setShowStageDropdown(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{
                background: 'var(--surface-2)',
                border: stageFilter !== 'All' ? '1px solid rgba(37,99,235,0.5)' : '1px solid var(--line)',
                color: 'var(--ink)',
              }}>
              <Filter className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
              {stageFilter === 'All' ? 'All Stages' : stageFilter}
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
            </button>
            {showStageDropdown && (
              <div className="absolute top-full mt-1 left-0 z-20 rounded-xl py-1 min-w-[140px] shadow-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                {STAGES.map(s => (
                  <button key={s} onClick={() => { setStageFilter(s); setShowStageDropdown(false) }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 transition-colors"
                    style={{ color: stageFilter === s ? '#059669' : 'var(--muted)' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} height={160} className="rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--neg)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--muted)' }}>Failed to load opportunities</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-2)' }}>{error}</p>
          <button onClick={fetchOpportunities}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--blue)', color: 'var(--surface)' }}>
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
          title="No opportunities match your filters"
          description="Try adjusting your sector or stage filters"
          className="card"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((opp, idx) => (
            <motion.div key={opp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.04 }}>
              <OpportunityCard
                opp={opp}
                expressed={expressedIds.has(opp.profile_id)}
                onInterest={handleInterest}
              />
            </motion.div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className="text-center text-xs" style={{ color: 'var(--muted-2)' }}>
          Showing {filtered.length} of {opportunities.length} opportunities
        </p>
      )}
    </div>
  )
}
