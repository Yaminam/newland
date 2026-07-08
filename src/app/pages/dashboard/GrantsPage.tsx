import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { EmptyState } from '@/app/components/ui/EmptyState'
import {
  Landmark, Star, ChevronDown, ChevronsUpDown,
  CalendarClock, Layers, ArrowUpRight,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'

// ─── Types ────────────────────────────────────────────────────────────
interface Grant {
  id: string
  program_name: string
  program_type: string | null
  provider: string | null
  description: string | null
  eligibility: string | null
  amount_text: string | null
  amount_usd_max: number | null
  sector_focus: string[] | null
  stage_focus: string[] | null
  country: string | null
  government_level: string | null
  state_name: string | null
  deadline: string | null
  apply_url: string | null
  source_name: string | null
  source_url: string | null
  is_active: boolean
  is_featured: boolean
}

// ─── Constants ────────────────────────────────────────────────────────
const PROGRAM_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  grant:       { color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  scheme:      { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  accelerator: { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  fellowship:  { color: '#DB2777', bg: 'rgba(219,39,119,0.10)' },
  default:     { color: 'var(--muted)', bg: 'var(--surface-2)' },
}

const GOV_LEVEL_STYLE: Record<string, { color: string; bg: string }> = {
  central: { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  state:   { color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  global:  { color: '#A855F7', bg: 'rgba(168,85,247,0.10)' },
  private: { color: '#EA580C', bg: 'rgba(234,88,12,0.10)' },
}

const DEADLINE_STYLE: Record<string, { color: string; bg: string }> = {
  open:           { color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  'closing-soon': { color: '#D97706', bg: 'rgba(245,158,11,0.12)' },
  expired:        { color: '#DC2626', bg: 'rgba(239,68,68,0.10)' },
  rolling:        { color: 'var(--muted-2)', bg: 'var(--surface-2)' },
}

const GOV_LEVELS = ['All', 'Central', 'State', 'Global', 'Private']
const DEADLINE_FILTERS = ['All', 'Open', 'Closing Soon', 'Rolling', 'Expired']

type SortKey = 'deadline' | 'amount' | 'featured' | 'name'
const SORT_OPTIONS: { label: string; key: SortKey }[] = [
  { label: 'Deadline (soonest)',   key: 'deadline' },
  { label: 'Amount (high to low)', key: 'amount' },
  { label: 'Featured first',       key: 'featured' },
  { label: 'Name (A–Z)',           key: 'name' },
]

// ─── Deadline Helpers ─────────────────────────────────────────────────
type DeadlineStatus = 'open' | 'closing-soon' | 'rolling' | 'expired'

function getDeadlineStatus(deadline: string | null): DeadlineStatus {
  if (!deadline) return 'rolling'
  const d = new Date(deadline)
  const now = new Date()
  if (d < now) return 'expired'
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) return 'closing-soon'
  return 'open'
}

function getDeadlineLabel(deadline: string | null): string {
  if (!deadline) return 'Rolling · Always open'
  const d = new Date(deadline)
  const now = new Date()
  if (d < now) return 'Closed'
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) return `Closes in ${daysLeft}d`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function typeStyle(t: string | null | undefined) {
  return PROGRAM_TYPE_STYLE[(t ?? 'default').toLowerCase()] ?? PROGRAM_TYPE_STYLE.default
}

// ─── Filter dropdown ──────────────────────────────────────────────────
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

// ─── Sort control ─────────────────────────────────────────────────────
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
          className="absolute top-full mt-1.5 right-0 z-30 rounded-xl py-1 min-w-[180px]"
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

// ─── KPI card ─────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Landmark
  label: string
  value: string | number
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
      </div>
    </motion.div>
  )
}

// ─── Deadline pill ────────────────────────────────────────────────────
function DeadlinePill({ deadline }: { deadline: string | null }) {
  const status = getDeadlineStatus(deadline)
  const s = DEADLINE_STYLE[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}2e` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {getDeadlineLabel(deadline)}
    </span>
  )
}

// ─── Grant Card ───────────────────────────────────────────────────────
function GrantCard({ grant }: { grant: Grant }) {
  const ts = typeStyle(grant.program_type)
  const gov = grant.government_level?.toLowerCase()
  const govStyle = gov ? (GOV_LEVEL_STYLE[gov] ?? GOV_LEVEL_STYLE.central) : null
  const href = grant.apply_url || grant.source_url

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover-lift rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {grant.is_featured && <div style={{ height: 3, background: 'var(--warn)' }} />}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header: badges + deadline */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {grant.program_type && (
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize"
                style={{ background: ts.bg, color: ts.color }}
              >
                {grant.program_type}
              </span>
            )}
            {grant.government_level && govStyle && (
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize"
                style={{ background: govStyle.bg, color: govStyle.color }}
              >
                {grant.government_level}
                {gov === 'state' && grant.state_name ? ` · ${grant.state_name}` : ''}
                {(gov === 'global' || gov === 'private') && grant.country && grant.country !== 'Global' ? ` · ${grant.country}` : ''}
              </span>
            )}
            {grant.is_featured && <Star className="w-3.5 h-3.5" style={{ color: 'var(--warn)', fill: '#F59E0B' }} />}
          </div>
          <DeadlinePill deadline={grant.deadline} />
        </div>

        {/* Title + provider */}
        <div>
          <h4
            className="text-[15px] font-bold leading-snug"
            style={{ color: 'var(--ink)', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {grant.program_name}
          </h4>
          {grant.provider && (
            <p className="text-[12px] mt-1 truncate" style={{ color: 'var(--muted-2)', fontWeight: 500 }}>{grant.provider}</p>
          )}
        </div>

        {/* Description */}
        {grant.description && (
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {stripMarkdown(grant.description.slice(0, 220))}
          </p>
        )}

        {/* Sector tags */}
        {grant.sector_focus && grant.sector_focus.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {grant.sector_focus.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="rounded-md px-2 py-0.5 text-[10.5px] font-medium"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
              >
                {tag}
              </span>
            ))}
            {grant.sector_focus.length > 3 && (
              <span className="text-[10.5px] font-medium px-1" style={{ color: 'var(--muted-2)' }}>
                +{grant.sector_focus.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: amount + apply */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.05em' }}>Funding</p>
            <p className="text-[14px] font-bold truncate" style={{ color: grant.amount_text ? 'var(--blue)' : 'var(--muted-2)' }}>
              {grant.amount_text || 'Not specified'}
            </p>
          </div>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              Apply <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────
export function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [govLevel, setGovLevel] = useState('All')
  const [stateFilter, setStateFilter] = useState('All')
  const [sectorFilter, setSectorFilter] = useState('All')
  const [deadlineFilter, setDeadlineFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('deadline')

  async function fetchGrants() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('grants')
      .select('*')
      .eq('is_active', true)
      .order('deadline', { ascending: true, nullsFirst: false })

    if (error) {
      setError(error.message)
      setGrants([])
    } else {
      setGrants((data as Grant[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchGrants() }, [])

  const uniqueStates = useMemo(() => {
    const s = new Set<string>()
    grants.forEach(g => { if (g.state_name) s.add(g.state_name) })
    return ['All', ...Array.from(s).sort()]
  }, [grants])

  const uniqueSectors = useMemo(() => {
    const s = new Set<string>()
    grants.forEach(g => { if (g.sector_focus) g.sector_focus.forEach(sec => s.add(sec)) })
    return Array.from(s).sort()
  }, [grants])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = grants.filter(g => {
      if (govLevel !== 'All' && (g.government_level ?? '').toLowerCase() !== govLevel.toLowerCase()) return false
      if (stateFilter !== 'All' && g.state_name !== stateFilter) return false
      if (sectorFilter !== 'All' && (!g.sector_focus || !g.sector_focus.includes(sectorFilter))) return false
      if (deadlineFilter !== 'All') {
        const status = getDeadlineStatus(g.deadline)
        const key = deadlineFilter.toLowerCase().replace(/\s+/g, '-')
        if (status !== key) return false
      }
      if (q) {
        const hay = [
          g.program_name, g.provider, g.description, g.eligibility,
          g.country, g.state_name, g.amount_text, g.government_level,
          g.program_type, g.source_name,
          ...(g.sector_focus ?? []), ...(g.stage_focus ?? []),
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    const byDeadline = (a: Grant, b: Grant) => {
      const ta = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const tb = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return ta - tb
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case 'amount':   return (b.amount_usd_max ?? -1) - (a.amount_usd_max ?? -1)
        case 'featured': return (Number(b.is_featured) - Number(a.is_featured)) || byDeadline(a, b)
        case 'name':     return a.program_name.localeCompare(b.program_name)
        default:         return byDeadline(a, b)
      }
    })
    return list
  }, [grants, govLevel, stateFilter, sectorFilter, deadlineFilter, search, sortKey])

  // KPIs
  const now = new Date()
  const monthEnd = new Date(); monthEnd.setMonth(now.getMonth() + 1)
  const totalActive = grants.length
  const closingThisMonth = grants.filter(g => {
    if (!g.deadline) return false
    const d = new Date(g.deadline)
    return d >= now && d <= monthEnd
  }).length
  const featuredCount = grants.filter(g => g.is_featured).length
  const sectorsCovered = uniqueSectors.length

  const hasFilters = govLevel !== 'All' || stateFilter !== 'All' || sectorFilter !== 'All' || deadlineFilter !== 'All' || search !== ''
  function clearFilters() {
    setGovLevel('All'); setStateFilter('All'); setSectorFilter('All'); setDeadlineFilter('All'); setSearch('')
  }
  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Deadline (soonest)'
  function applySort(label: string) {
    const o = SORT_OPTIONS.find(opt => opt.label === label)
    if (o) setSortKey(o.key)
  }

  return (
    <div className="pb-8 space-y-6">
      <SEO title="Grants" path="/dashboard/grants" noindex />

      <HeroSection
        title="Grants & Schemes"
        subtitle="Government grants, accelerators, and fellowships for startups — all in one place."
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={88} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Landmark}     label="Active Grants"   value={totalActive}      color="#2563EB" />
          <KpiCard icon={CalendarClock} label="Closing Soon"    value={closingThisMonth} color="#D97706" />
          <KpiCard icon={Layers}        label="Sectors Covered" value={sectorsCovered}   color="#059669" />
          <KpiCard icon={Star}          label="Featured"        value={featuredCount}    color="#7C3AED" />
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search grants, providers, sectors, eligibility…"
            className="lg:max-w-sm lg:flex-1"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <FilterDropdown label="All Sources" value={govLevel} options={GOV_LEVELS} onChange={(v) => { setGovLevel(v); if (v !== 'State') setStateFilter('All') }} />
            {govLevel === 'State' && uniqueStates.length > 1 && (
              <FilterDropdown label="All States" value={stateFilter} options={uniqueStates} onChange={setStateFilter} />
            )}
            <FilterDropdown label="All Sectors" value={sectorFilter} options={['All', ...uniqueSectors]} onChange={setSectorFilter} />
          </div>
        </div>

        {/* Deadline quick chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {DEADLINE_FILTERS.map(df => {
            const active = deadlineFilter === df
            return (
              <button
                key={df}
                onClick={() => setDeadlineFilter(df)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0"
                style={active
                  ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
                  : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }
                }
              >
                {df === 'All' ? 'All Deadlines' : df}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results header */}
      {!loading && !error && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--blue)' }} />
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>Grants</h3>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="text-[12px] font-semibold" style={{ color: 'var(--muted-2)' }}>Clear</button>
            )}
            {filtered.length > 0 && <SortControl value={currentSortLabel} onChange={applySort} />}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={300} />)}
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card rounded-2xl">
            <EmptyState
              icon={<Landmark size={28} style={{ color: 'var(--neg)' }} />}
              title="Failed to load grants"
              description={error}
              action={{ label: 'Retry', onClick: fetchGrants }}
            />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card rounded-2xl">
            <EmptyState
              icon={<Landmark size={28} color="#2563EB" />}
              title="No grants match your filters"
              description="Try adjusting your filters or search terms. New grants are added regularly."
              action={hasFilters ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(grant => (
              <motion.div
                key={grant.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                className="h-full"
              >
                <GrantCard grant={grant} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
