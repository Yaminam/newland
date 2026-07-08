import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { EmptyState } from '@/app/components/ui/EmptyState'
import {
  TrendingUp, ExternalLink, ChevronDown, ChevronsUpDown,
  DollarSign, Layers, CalendarClock, Trophy, PieChart, Building2,
  Users, MapPin, Calendar,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

interface FundingEvent {
  id: string
  company_name: string
  lead_investor?: string
  amount_usd?: number
  round_type?: string
  sector?: string
  location?: string
  announced_at?: string
  source_url?: string
  source_name?: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────
function timeAgo(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatAmount(amount?: number, currency?: string): string {
  if (!amount) return '—'
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
    return `₹${amount.toLocaleString('en-IN')}`
  }
  if (currency === 'USD') {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount.toLocaleString()}`
  }
  return `${amount.toLocaleString()}`
}

function compactUsd(n: number): string {
  if (!n) return '$0'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n}`
}

const SECTOR_COLORS: Record<string, string> = {
  'AI/ML': 'var(--blue)',
  'FinTech': 'var(--pos)',
  'HealthTech': 'var(--neg)',
  'SaaS': '#3486e8',
  'CleanTech': '#22c55e',
  'EdTech': 'var(--warn)',
  'AgriTech': '#84cc16',
  'DeepTech': '#59cbef',
  'Consumer': '#f97316',
  'Web3': '#a855f7',
  'default': 'var(--blue)',
}

const ROUND_COLORS: Record<string, string> = {
  'Pre-Seed': '#3486e8',
  'Seed': 'var(--blue)',
  'Series A': '#3b82f6',
  'Series B': 'var(--pos)',
  'Series C+': 'var(--warn)',
  'Growth': '#59cbef',
  'Acquisition': 'var(--neg)',
  'default': '#64748b',
}

const ROUND_ORDER = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Acquisition']
const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'All Time']

// Funding-amount brackets (USD). `All` means no amount constraint.
const AMOUNT_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'All',          min: 0,    max: Infinity },
  { label: 'Under $1M',    min: 0,    max: 1e6 },
  { label: '$1M – $10M',   min: 1e6,  max: 1e7 },
  { label: '$10M – $50M',  min: 1e7,  max: 5e7 },
  { label: '$50M – $100M', min: 5e7,  max: 1e8 },
  { label: '$100M+',       min: 1e8,  max: Infinity },
]

function getSectorColor(sector?: string): string {
  if (!sector) return SECTOR_COLORS.default
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.default
}

function getRoundColor(round?: string): string {
  if (!round) return ROUND_COLORS.default
  return ROUND_COLORS[round] ?? ROUND_COLORS.default
}

function roundRank(round?: string): number {
  const i = ROUND_ORDER.indexOf(round ?? '')
  return i === -1 ? 99 : i
}

function getDateCutoff(range: string): Date | null {
  const now = new Date()
  if (range === 'Last 7 days') { const d = new Date(now); d.setDate(d.getDate() - 7); return d }
  if (range === 'Last 30 days') { const d = new Date(now); d.setDate(d.getDate() - 30); return d }
  if (range === 'Last 90 days') { const d = new Date(now); d.setDate(d.getDate() - 90); return d }
  return null
}

// ─── Sorting ─────────────────────────────────────────────────────────
type SortKey = 'company' | 'round' | 'amount' | 'sector' | 'investor' | 'date'

const SORT_OPTIONS: { label: string; key: SortKey; dir: 'asc' | 'desc' }[] = [
  { label: 'Newest',      key: 'date',    dir: 'desc' },
  { label: 'Largest',     key: 'amount',  dir: 'desc' },
  { label: 'Company A–Z', key: 'company', dir: 'asc' },
  { label: 'Round stage', key: 'round',   dir: 'asc' },
]

const PAGE_SIZE = 12

function compareEvents(a: FundingEvent, b: FundingEvent, key: SortKey): number {
  switch (key) {
    case 'company':  return a.company_name.localeCompare(b.company_name)
    case 'round':    return roundRank(a.round_type) - roundRank(b.round_type)
    case 'amount':   return (a.amount_usd ?? 0) - (b.amount_usd ?? 0)
    case 'sector':   return (a.sector ?? '').localeCompare(b.sector ?? '')
    case 'investor': return (a.lead_investor ?? '').localeCompare(b.lead_investor ?? '')
    case 'date': {
      const ta = a.announced_at ? new Date(a.announced_at).getTime() : 0
      const tb = b.announced_at ? new Date(b.announced_at).getTime() : 0
      return ta - tb
    }
  }
}

// ─── Filter dropdown ─────────────────────────────────────────────────
function FilterDropdown({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
        style={{
          background: value !== 'All' ? 'var(--blue-bg)' : 'var(--surface-2)',
          border: `1px solid ${value !== 'All' ? 'rgba(37,99,235,0.25)' : 'var(--line)'}`,
          color: value !== 'All' ? 'var(--blue)' : 'var(--ink)',
        }}
      >
        {value === 'All' ? label : value}
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-30 rounded-xl py-1 min-w-[180px] max-h-72 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          {options.map(opt => {
            const active = value === opt
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: active ? 'var(--blue)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
              >
                {opt === 'All' ? label : opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof DollarSign
  label: string
  value: string | number
  sub: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>{label}</div>
        <div className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>{value}</div>
        <div className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>{sub}</div>
      </div>
    </motion.div>
  )
}

// ─── Chart card wrapper ──────────────────────────────────────────────
function ChartCard({
  icon: Icon, title, subtitle, children,
}: {
  icon: typeof PieChart
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--blue-bg)' }}>
          <Icon className="w-4 h-4" style={{ color: 'var(--blue)' }} />
        </div>
        <div>
          <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>{title}</h3>
          <p className="text-[11.5px]" style={{ color: 'var(--muted-2)' }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Sort control ────────────────────────────────────────────────────
function SortControl({ value, onChange }: { value: string; onChange: (label: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
      >
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-70" />
        <span className="hidden sm:inline" style={{ color: 'var(--muted-2)' }}>Sort:</span> {value}
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 right-0 z-30 rounded-xl py-1 min-w-[160px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          {SORT_OPTIONS.map(o => {
            const active = value === o.label
            return (
              <button
                key={o.label}
                onClick={() => { onChange(o.label); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: active ? 'var(--blue)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Round card ──────────────────────────────────────────────────────
function RoundCard({ e, i }: { e: FundingEvent; i: number }) {
  const roundColor = getRoundColor(e.round_type)
  return (
    <motion.a
      href={e.source_url || undefined}
      target={e.source_url ? '_blank' : undefined}
      rel={e.source_url ? 'noopener noreferrer' : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 11) * 0.03, duration: 0.3 }}
      className="card card-hover-lift rounded-2xl p-4 flex flex-col gap-3 group"
      style={{ textDecoration: 'none', cursor: e.source_url ? 'pointer' : 'default' }}
    >
      {/* Company + round */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors" style={{ color: 'var(--ink)' }}>
          {e.company_name}
        </h3>
        {e.round_type && (
          <span
            className="shrink-0 inline-block rounded-md px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap"
            style={{ background: `${roundColor}15`, color: roundColor, border: `1px solid ${roundColor}30` }}
          >
            {e.round_type}
          </span>
        )}
      </div>

      {/* Amount */}
      <div>
        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>Raised</p>
        <p
          className="text-[22px] font-extrabold leading-none mt-0.5"
          style={{ color: e.amount_usd ? 'var(--blue)' : 'var(--muted-2)', fontFamily: 'var(--font-num)' }}
        >
          {formatAmount(e.amount_usd, 'USD')}
        </p>
      </div>

      {/* Meta — fills the card and aligns the footer across the row */}
      <div className="mt-auto pt-3 space-y-2" style={{ borderTop: '1px solid var(--line-2)' }}>
        {e.lead_investor && (
          <div className="flex items-center gap-1.5 text-[11.5px] min-w-0" style={{ color: 'var(--muted)' }}>
            <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
            <span className="truncate">{e.lead_investor}</span>
          </div>
        )}
        {(e.sector || e.location) && (
          <div className="flex items-center gap-2 flex-wrap">
            {e.sector && (
              <span
                className="inline-block rounded-md px-2 py-0.5 text-[10.5px] font-medium whitespace-nowrap"
                style={{ background: `${getSectorColor(e.sector)}12`, color: getSectorColor(e.sector), border: `1px solid ${getSectorColor(e.sector)}20` }}
              >
                {e.sector}
              </span>
            )}
            {e.location && (
              <span className="flex items-center gap-1 text-[11px] min-w-0" style={{ color: 'var(--muted-2)' }}>
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{e.location}</span>
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--muted-2)' }}>
          <span className="flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3" /> {timeAgo(e.announced_at)}
          </span>
          {e.source_name && (
            <span className="flex items-center gap-1 min-w-0" style={{ color: e.source_url ? 'var(--blue)' : 'var(--muted-2)' }}>
              <span className="truncate">{e.source_name}</span>
              {e.source_url && <ExternalLink className="w-3 h-3 shrink-0" />}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  )
}

// ─── Main Component ───────────────────────────────────────────────────
export function FundingTrackerPage() {
  const [events, setEvents] = useState<FundingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [roundFilter, setRoundFilter] = useState('All')
  const [amountFilter, setAmountFilter] = useState('All')
  const [dateRange, setDateRange] = useState('All Time')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const fetchEvents = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    const { data, error } = await supabase
      .from('funding_rounds')
      .select('*')
      .order('announced_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[FundingTrackerPage] load failed:', error.message)
      setEvents([])
    } else {
      setEvents((data as FundingEvent[]) ?? [])
    }
    if (showLoader) setLoading(false)
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Refresh data when tab regains focus
  useEffect(() => {
    const refresh = () => { fetchEvents(false) }
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchEvents])

  const sectors = useMemo(() => {
    const s = new Set<string>()
    events.forEach(e => { if (e.sector) s.add(e.sector) })
    return ['All', ...Array.from(s).sort()]
  }, [events])

  const rounds = useMemo(() => {
    const s = new Set<string>()
    events.forEach(e => { if (e.round_type) s.add(e.round_type) })
    const arr = Array.from(s).sort((a, b) => roundRank(a) - roundRank(b) || a.localeCompare(b))
    return ['All', ...arr]
  }, [events])

  const filtered = useMemo(() => {
    const cutoff = getDateCutoff(dateRange)
    const amtRange = AMOUNT_RANGES.find(r => r.label === amountFilter) ?? AMOUNT_RANGES[0]
    const q = search.toLowerCase().trim()
    return events.filter(e => {
      const matchesSearch = !q ||
        e.company_name.toLowerCase().includes(q) ||
        (e.lead_investor ?? '').toLowerCase().includes(q) ||
        (e.sector ?? '').toLowerCase().includes(q) ||
        (e.location ?? '').toLowerCase().includes(q)
      const matchesSector = sectorFilter === 'All' || e.sector === sectorFilter
      const matchesRound = roundFilter === 'All' || e.round_type === roundFilter
      const matchesAmount = amountFilter === 'All' ||
        (e.amount_usd != null && e.amount_usd >= amtRange.min && e.amount_usd < amtRange.max)
      const matchesDate = !cutoff || !e.announced_at || new Date(e.announced_at) >= cutoff
      return matchesSearch && matchesSector && matchesRound && matchesAmount && matchesDate
    })
  }, [events, search, sectorFilter, roundFilter, amountFilter, dateRange])

  // Rows: drop near-empty records, then sort by the active column.
  const rows = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return filtered
      .filter(e => {
        const fields = [
          e.amount_usd && e.amount_usd > 0,
          e.lead_investor?.trim(),
          e.sector?.trim(),
          e.location?.trim(),
          e.round_type?.trim(),
          e.announced_at,
          e.source_url,
        ].filter(Boolean).length
        return fields >= 2
      })
      .sort((a, b) => dir * compareEvents(a, b, sort.key))
  }, [filtered, sort])

  // ─── KPI stats ────────────────────────────────────────────────────
  const totalRounds = filtered.length

  const totalCapitalUsd = useMemo(
    () => filtered.reduce((acc, e) => acc + (e.amount_usd ?? 0), 0),
    [filtered],
  )

  const weekCutoff = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d }, [])
  const thisWeekRounds = filtered.filter(e =>
    e.announced_at && new Date(e.announced_at) >= weekCutoff
  ).length

  const largest = useMemo(
    () => filtered.reduce<FundingEvent | undefined>(
      (acc, e) => (e.amount_usd ?? 0) > (acc?.amount_usd ?? 0) ? e : acc, undefined),
    [filtered],
  )

  // ─── Chart data ───────────────────────────────────────────────────
  const roundMix = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach(e => {
      const rt = e.round_type?.trim()
      if (!rt) return // skip rounds with no stage instead of bucketing them as "Unknown"
      counts[rt] = (counts[rt] ?? 0) + 1
    })
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [filtered])
  const roundMixTotal = useMemo(() => roundMix.reduce((s, r) => s + r.count, 0), [roundMix])
  const roundMixMax = useMemo(() => Math.max(1, ...roundMix.map(r => r.count)), [roundMix])

  const sectorCapital = useMemo(() => {
    const sums: Record<string, number> = {}
    filtered.forEach(e => {
      const s = e.sector?.trim()
      if (!s || !e.amount_usd) return
      sums[s] = (sums[s] ?? 0) + e.amount_usd
    })
    return Object.entries(sums)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [filtered])
  const sectorCapitalMax = useMemo(() => Math.max(1, ...sectorCapital.map(s => s.total)), [sectorCapital])

  const currentSortLabel = useMemo(
    () => SORT_OPTIONS.find(o => o.key === sort.key && o.dir === sort.dir)?.label ?? 'Newest',
    [sort],
  )
  function applySort(label: string) {
    const o = SORT_OPTIONS.find(opt => opt.label === label)
    if (o) setSort({ key: o.key, dir: o.dir })
  }

  // Collapse back to the first page whenever the result set changes.
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [search, sectorFilter, roundFilter, amountFilter, dateRange, sort])

  const hasFilters = search !== '' || sectorFilter !== 'All' || roundFilter !== 'All' || amountFilter !== 'All' || dateRange !== 'All Time'
  function clearFilters() {
    setSearch('')
    setSectorFilter('All')
    setRoundFilter('All')
    setAmountFilter('All')
    setDateRange('All Time')
  }

  const kpis = [
    { icon: DollarSign,   label: 'Capital Raised', value: compactUsd(totalCapitalUsd), sub: `across ${totalRounds} round${totalRounds !== 1 ? 's' : ''}`, color: 'var(--blue)' },
    { icon: Layers,       label: 'Total Rounds',   value: totalRounds,                 sub: 'tracked deals',     color: 'var(--pos)' },
    { icon: CalendarClock, label: 'This Week',      value: thisWeekRounds,              sub: 'new in last 7 days', color: 'var(--warn)' },
    { icon: Trophy,       label: 'Largest Round',  value: formatAmount(largest?.amount_usd, 'USD'), sub: largest?.company_name ?? '—', color: '#7c3aed' },
  ]

  return (
    <div className="pb-6 space-y-6">
      <SEO title="Funding Tracker" path="/dashboard/funding-tracker" noindex />
      <HeroSection
        title="Funding Tracker"
        subtitle="Track startup funding rounds across the ecosystem"
      />

      {/* Global filter bar */}
      <div className="card rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by company, investor, sector, location..."
            className="lg:max-w-xs lg:flex-1"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <FilterDropdown label="All Sectors" value={sectorFilter} options={sectors} onChange={setSectorFilter} />
            <FilterDropdown label="All Rounds" value={roundFilter} options={rounds} onChange={setRoundFilter} />
            <FilterDropdown label="All Amounts" value={amountFilter} options={AMOUNT_RANGES.map(r => r.label)} onChange={setAmountFilter} />
            <div className="flex gap-1.5">
              {DATE_RANGES.map(dr => {
                const active = dateRange === dr
                return (
                  <button
                    key={dr}
                    onClick={() => setDateRange(dr)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap"
                    style={active
                      ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                      : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }
                    }
                  >
                    {dr.replace('Last ', '')}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={96} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard icon={PieChart} title="Funding by Round" subtitle="Deal distribution by stage">
          {loading ? (
            <SkeletonBlock height={200} />
          ) : roundMix.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-[12.5px]" style={{ color: 'var(--muted-2)' }}>
              No round data for the selected filters
            </div>
          ) : (
            <div className="space-y-3.5 py-1">
              {roundMix.map(r => {
                const pct = roundMixTotal ? Math.round((r.count / roundMixTotal) * 100) : 0
                const w = Math.max(4, (r.count / roundMixMax) * 100)
                const color = getRoundColor(r.name)
                return (
                  <div key={r.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>{r.name}</span>
                      <span className="text-[11.5px] font-medium" style={{ color: 'var(--muted-2)' }}>
                        {r.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard icon={Building2} title="Top Sectors by Capital" subtitle="Total raised per sector">
          {loading ? (
            <SkeletonBlock height={200} />
          ) : sectorCapital.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-[12.5px]" style={{ color: 'var(--muted-2)' }}>
              No sector capital for the selected filters
            </div>
          ) : (
            <div className="space-y-3.5 py-1">
              {sectorCapital.map(s => {
                const w = Math.max(4, (s.total / sectorCapitalMax) * 100)
                const color = getSectorColor(s.name)
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink)' }}>{s.name}</span>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>
                        {compactUsd(s.total)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${w}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Rounds — refined card grid */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--blue)' }} />
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>Funding Rounds</h3>
            {!loading && (
              <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                {rows.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="text-[12px] font-semibold" style={{ color: 'var(--muted-2)' }}>
                Clear
              </button>
            )}
            {!loading && rows.length > 0 && (
              <SortControl value={currentSortLabel} onChange={applySort} />
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} height={170} />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="card rounded-2xl">
            <EmptyState
              icon={<TrendingUp className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
              title="No funding rounds found"
              description="Try adjusting your filters to find more results"
              action={hasFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {rows.slice(0, visibleCount).map((e, i) => <RoundCard key={e.id} e={e} i={i} />)}
            </div>
            {rows.length > visibleCount && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98]"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                >
                  Show more ({rows.length - visibleCount} more)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
