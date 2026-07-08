import { useState, useEffect, useMemo, useCallback } from 'react'
import { SEO } from '@/app/components/SEO'
import { supabase } from '@/app/lib/supabase'
import { TrendingUp, BarChart2, Sparkles, FileText, ArrowUpRight, Flame, Building2 } from 'lucide-react'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { compactNumber } from '@/app/lib/utils'
import { motion } from 'framer-motion'

const stripHtml = (html: string | null): string => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface PublicStartup {
  id: string
  company_name: string
  tagline: string | null
  sector: string | null
  city: string | null
  country: string
  stage: string | null
  funding_amount: string | null
  funding_amount_usd: number | null
  funding_round: string | null
  currency: string | null
  investor_name: string | null
  description: string | null
  source_url: string | null
  source_name: string | null
  announced_date: string | null
  is_hot: boolean
  trend_signal: string | null
  rank: number | null
  updated_at: string
}

interface SectorStat {
  name: string
  count: number
  totalUsd: number
  topCompanies: string[]
}

const SIGNAL_CONFIG: Record<string, { bg: string; color: string; icon: typeof Flame }> = {
  'Hot Deal':       { bg: 'rgba(239,68,68,0.08)', color: '#DC2626', icon: Flame },
  'Strong Growth':  { bg: 'rgba(16,185,129,0.08)', color: '#059669', icon: TrendingUp },
}

function TrendingCard({ startup, idx }: { startup: PublicStartup; idx: number }) {
  const round = startup.funding_round || startup.stage

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ delay: Math.min(idx, 10) * 0.025, duration: 0.2 }}
      className="group cursor-pointer relative overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
      onClick={() => { if (startup.source_url) window.open(startup.source_url, '_blank', 'noopener,noreferrer') }}
    >
      <div className="flex items-center gap-3 p-3.5">
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[14px] font-bold truncate" style={{ color: 'var(--ink)' }}>
              {startup.company_name}
            </span>
            {startup.is_hot && <Flame className="w-3 h-3 shrink-0" style={{ color: '#EF4444' }} />}
          </div>
          {startup.description && (
            <p className="text-[11.5px] leading-snug mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
              {stripHtml(startup.description)}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            {round && (
              <span className="text-[9px] font-semibold px-1.5 py-px rounded" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>{round}</span>
            )}
            {startup.sector && (
              <span className="text-[9px] font-medium px-1.5 py-px rounded" style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}>{startup.sector}</span>
            )}
            {startup.investor_name && (
              <span className="text-[10px] truncate" style={{ color: 'var(--muted-2)' }}>· {startup.investor_name}</span>
            )}
          </div>
        </div>

        {/* Funding */}
        {startup.funding_amount && (
          <div className="text-right shrink-0">
            <p className="text-[16px] font-extrabold leading-none" style={{ color: 'var(--blue)', fontFamily: 'var(--font-num)' }}>
              {compactNumber(startup.funding_amount)}
            </p>
            <p className="text-[8px] font-bold uppercase mt-0.5" style={{ color: 'var(--muted-2)' }}>Raised</p>
          </div>
        )}

        {startup.source_url && (
          <ArrowUpRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--blue)' }} />
        )}
      </div>
    </motion.div>
  )
}

export function TrendingFeedPage() {
  const [startups, setStartups] = useState<PublicStartup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSector, setActiveSector] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const PAGE_SIZE = 8

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('public_startups')
        .select('*')
        .order('rank', { ascending: true })
        .limit(100)
      if (err) throw err
      setStartups(data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const refresh = () => { fetchData(false) }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchData])

  const totalFunded = startups.length
  const totalRaisingUsd = startups.reduce((sum, s) => sum + (s.funding_amount_usd || 0), 0)
  const hotDeals = startups.filter(s => s.is_hot).length

  const sectorMap = startups.reduce((acc, s) => {
    if (!s.sector) return acc
    if (!acc[s.sector]) acc[s.sector] = { count: 0, totalUsd: 0, companies: [] }
    acc[s.sector].count++
    acc[s.sector].totalUsd += s.funding_amount_usd || 0
    if (acc[s.sector].companies.length < 3) acc[s.sector].companies.push(s.company_name)
    return acc
  }, {} as Record<string, { count: number; totalUsd: number; companies: string[] }>)

  const sectorStats: SectorStat[] = Object.entries(sectorMap)
    .map(([name, d]) => ({ name, count: d.count, totalUsd: d.totalUsd, topCompanies: d.companies }))
    .sort((a, b) => b.count - a.count)

  const hotSectorsCount = sectorStats.length
  const topSector = sectorStats[0]?.name ?? ''
  const largestRaise = [...startups].sort((a, b) => (b.funding_amount_usd || 0) - (a.funding_amount_usd || 0))[0]

  const filteredStartups = startups
    .filter(s => {
      if (activeSector !== 'All' && s.sector !== activeSector) return false
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const hay = [s.company_name, s.sector, s.description, s.tagline, s.city, s.stage, s.investor_name]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => (a.rank || 99) - (b.rank || 99))

  const visibleStartups = showAll ? filteredStartups : filteredStartups.slice(0, PAGE_SIZE)

  const sectorChips = useMemo(() => {
    const sectorsWithData = sectorStats
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .map(s => s.name)
    return ['All', ...sectorsWithData]
  }, [sectorStats])

  useEffect(() => {
    if (activeSector !== 'All' && !sectorChips.includes(activeSector)) {
      setActiveSector('All')
    }
  }, [sectorChips])

  return (
    <div>
      <SEO title="Trending" path="/dashboard/trending" noindex />

      <HeroSection
        title="Trending"
        subtitle="Real-time intelligence from the Indian startup ecosystem"
        stats={!loading ? [
          { label: 'FUNDED', value: totalFunded },
          { label: 'TOTAL RAISED', value: `$${compactNumber(totalRaisingUsd)}` },
          { label: 'SECTORS', value: hotSectorsCount },
          { label: 'HOT DEALS', value: hotDeals },
        ] : undefined}
      />

      {/* Spotlight ticker */}
      {!loading && startups.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 mt-6 mb-6"
        >
          {[
            largestRaise ? { icon: TrendingUp, label: 'Largest Raise', value: largestRaise.company_name, sub: compactNumber(largestRaise.funding_amount) } : null,
            topSector ? { icon: BarChart2, label: 'Top Sector', value: topSector, sub: `${sectorMap[topSector]?.count} startups` } : null,
            hotDeals > 0 ? { icon: Flame, label: 'Hot Deals', value: `${hotDeals}`, sub: 'this week' } : null,
          ].filter(Boolean).map((item, i) => {
            const I = item!.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="shrink-0 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  minWidth: 180,
                }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.12)' }}
                >
                  <I className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-[0.05em] block" style={{ color: 'var(--muted-2)' }}>{item!.label}</span>
                  <span className="text-[13px] font-semibold block truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{item!.value}</span>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{item!.sub}</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Filters */}
      {!loading && (
        <div className="space-y-3 mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setShowAll(false) }}
            placeholder="Search startups, sectors, investors..."
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            {sectorChips.map(chip => (
              <button
                key={chip}
                onClick={() => { setActiveSector(chip); setShowAll(false) }}
                className="px-3 py-1.5 rounded-[10px] text-xs font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  background: activeSector === chip ? 'var(--blue-bg)' : 'var(--surface-2)',
                  border: `1px solid ${activeSector === chip ? 'rgba(37,99,235,0.18)' : 'var(--line)'}`,
                  color: activeSector === chip ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: activeSector === chip ? 600 : 500,
                }}
              >
                {chip === 'All' ? 'All Sectors' : chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBlock key={i} height={120} />
          ))}
        </div>
      )}

      {error && (
        <EmptyState
          icon={<FileText className="w-6 h-6" style={{ color: 'var(--neg)' }} />}
          title="Failed to load startup data"
          description="Please try again or contact support if the problem persists"
          action={{ label: 'Retry', onClick: fetchData }}
        />
      )}

      {!loading && !error && filteredStartups.length === 0 && (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
          title="No startups found"
          description={
            activeSector === 'All'
              ? 'Nothing in the feed right now — check back soon.'
              : `No ${activeSector} startups in the last 7 days`
          }
        />
      )}

      {!loading && !error && visibleStartups.length > 0 && (
        <div className="space-y-3">
          {visibleStartups.map((startup, idx) => (
            <TrendingCard key={startup.id} startup={startup} idx={idx} />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && !error && !showAll && filteredStartups.length > PAGE_SIZE && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-6 py-3 rounded-[12px] text-[13px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
          }}
        >
          View all {filteredStartups.length} startups
        </button>
      )}

      {!loading && (
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--muted-2)' }}>
          Showing {visibleStartups.length} of {filteredStartups.length} startups
        </p>
      )}
    </div>
  )
}
