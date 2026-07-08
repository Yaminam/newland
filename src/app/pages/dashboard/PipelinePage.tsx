import { useState, useMemo } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Kanban, Download, BarChart3, TrendingUp, Clock, Target,
  Bell, DollarSign, ArrowRight, ChevronDown, Filter, X, Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePipeline, type PipelineDeal } from '@/app/hooks/usePipeline'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { PillTabs } from '@/app/components/ui/PillTabs'
import { Button } from '@/app/components/ui/Button'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { KanbanBoard } from '@/app/components/pipeline/KanbanBoard'
import { PipelineListView } from '@/app/components/pipeline/PipelineListView'
import { DealDetailDrawer } from '@/app/components/pipeline/DealDetailDrawer'
import { AlertsPanel } from '@/app/components/pipeline/AlertsPanel'
import { AddToPipelineModal } from '@/app/components/pipeline/AddToPipelineModal'
import { formatCurrency } from '@/app/lib/utils'

type ViewMode = 'kanban' | 'list' | 'analytics' | 'alerts'

export function PipelinePage() {
  const {
    stages,
    deals,
    grouped,
    alerts,
    unreadAlertCount,
    isLoading,
    moveDeal,
    addDeal,
    updateDeal,
    removeDeal,
    markAlertRead,
    markAllAlertsRead,
    dismissAlert,
    exportCSV,
    setReminder,
    clearReminder,
    loadActivity,
  } = usePipeline()

  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<PipelineDeal | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const existingStartupIds = useMemo(() => new Set(deals.map(d => d.startup_id)), [deals])

  const hasActiveFilters = !!filterStage || !!filterPriority

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      const q = search.toLowerCase()
      if (q) {
        const name = d.startup?.company_name?.toLowerCase() ?? ''
        const sector = d.startup?.sector?.toLowerCase() ?? ''
        const tags = (d.tags ?? []).join(' ').toLowerCase()
        if (!name.includes(q) && !sector.includes(q) && !tags.includes(q)) return false
      }
      if (filterStage && d.stage_id !== filterStage) return false
      if (filterPriority && d.priority !== filterPriority) return false
      return true
    })
  }, [deals, search, filterStage, filterPriority])

  // Group filtered deals for kanban
  const filteredGrouped = useMemo(() => {
    const map: Record<string, PipelineDeal[]> = {}
    for (const s of stages) map[s.id] = []
    for (const d of filteredDeals) {
      const key = d.stage_id ?? 'unassigned'
      if (!map[key]) map[key] = []
      map[key].push(d)
    }
    return map
  }, [stages, filteredDeals])

  // KPI computations
  const kpis = useMemo(() => {
    const totalDeals = deals.length
    const totalValue = deals.reduce((sum, d) => sum + (d.amount_usd ?? 0), 0)
    const terminalStages = stages.filter(s => s.is_terminal)
    const closedDeals = deals.filter(d => terminalStages.some(s => s.id === d.stage_id))
    const now = Date.now()
    const avgDaysInPipeline = totalDeals > 0
      ? Math.round(deals.reduce((sum, d) => sum + (now - new Date(d.created_at).getTime()), 0) / totalDeals / 86400000)
      : 0
    const highPriority = deals.filter(d => d.priority === 'high').length
    return { totalDeals, totalValue, closedDeals: closedDeals.length, avgDaysInPipeline, highPriority }
  }, [deals, stages])

  // Analytics (full)
  const analytics = useMemo(() => {
    const stageBreakdown = stages.map(s => {
      const stageDeals = deals.filter(d => d.stage_id === s.id)
      return {
        name: s.name, color: s.color, count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount_usd ?? 0), 0),
      }
    })

    const orderedStages = [...stages].sort((a, b) => a.position - b.position)
    const conversionRates: { from: string; to: string; rate: number }[] = []
    for (let i = 0; i < orderedStages.length - 1; i++) {
      const current = orderedStages[i]
      const next = orderedStages[i + 1]
      const currentCount = deals.filter(d => d.stage_id === current.id).length
      const nextCount = deals.filter(d => d.stage_id === next.id).length
      const rate = currentCount > 0 ? Math.round((nextCount / currentCount) * 100) : 0
      conversionRates.push({ from: current.name, to: next.name, rate })
    }

    const sectorMap: Record<string, number> = {}
    for (const d of deals) {
      const sector = d.startup?.sector ?? 'Unknown'
      sectorMap[sector] = (sectorMap[sector] ?? 0) + 1
    }
    const topSectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

    const priorityCounts = { high: 0, medium: 0, low: 0 }
    for (const d of deals) priorityCounts[d.priority ?? 'low']++

    return { stageBreakdown, conversionRates, topSectors, priorityCounts }
  }, [deals, stages])

  const handleCardClick = (deal: PipelineDeal) => {
    setSelectedDeal(deal)
    setDrawerOpen(true)
  }

  const handleExport = () => {
    exportCSV()
    toast.success('Pipeline exported as CSV')
  }

  const clearFilters = () => {
    setFilterStage('')
    setFilterPriority('')
  }

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={40} className="mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} height={88} />)}
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <SkeletonBlock key={i} width={280} height={400} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Deal Pipeline" />

      <PageHeader
        title="Deal Pipeline"
        subtitle={`${deals.length} deal${deals.length === 1 ? '' : 's'} across ${stages.length} stages`}
        icon={<Kanban className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => setAddModalOpen(true)}>
              Add Startup
            </Button>
            <Button variant="secondary" size="sm" iconLeft={Download} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      {deals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03, duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5"
        >
          {[
            {
              label: 'Pipeline Value',
              value: formatCurrency(kpis.totalValue),
              icon: DollarSign,
              color: 'var(--pos)',
            },
            {
              label: 'Active Deals',
              value: kpis.totalDeals,
              icon: Kanban,
              color: 'var(--blue)',
            },
            {
              label: 'Avg. Days',
              value: `${kpis.avgDaysInPipeline}d`,
              icon: Clock,
              color: 'var(--warn)',
            },
            {
              label: 'Closed',
              value: kpis.closedDeals,
              icon: Target,
              color: '#10B981',
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + i * 0.04, duration: 0.25 }}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                boxShadow: 'var(--sh-1)',
              }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}18` }}
              >
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold tracking-[0.06em] uppercase"
                  style={{ color: 'var(--muted-2)' }}
                >
                  {kpi.label}
                </p>
                <p
                  className="text-[20px] font-bold leading-tight"
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-num)',
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {kpi.value}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Stage Funnel Bar */}
      {deals.length > 0 && stages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.3 }}
          className="mb-5"
        >
          <div
            className="flex items-center h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--surface-3)' }}
          >
            {stages
              .sort((a, b) => a.position - b.position)
              .map(stage => {
                const count = (grouped[stage.id] ?? []).length
                const pct = deals.length > 0 ? (count / deals.length) * 100 : 0
                if (pct === 0) return null
                return (
                  <div
                    key={stage.id}
                    className="h-full transition-all duration-500 relative group"
                    style={{
                      width: `${pct}%`,
                      background: stage.color,
                      minWidth: pct > 0 ? 4 : 0,
                    }}
                    title={`${stage.name}: ${count} deal${count === 1 ? '' : 's'}`}
                  />
                )
              })}
          </div>
          <div className="flex items-center gap-4 mt-2">
            {stages
              .sort((a, b) => a.position - b.position)
              .map(stage => {
                const count = (grouped[stage.id] ?? []).length
                if (count === 0) return null
                return (
                  <div key={stage.id} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                      {stage.name}
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}
                    >
                      {count}
                    </span>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex items-center gap-3 mb-5 flex-wrap"
      >
        <PillTabs
          value={view}
          options={[
            { value: 'kanban' as ViewMode, label: 'Board' },
            { value: 'list' as ViewMode, label: 'List' },
            { value: 'analytics' as ViewMode, label: 'Analytics' },
            { value: 'alerts' as ViewMode, label: `Alerts${unreadAlertCount > 0 ? ` (${unreadAlertCount})` : ''}` },
          ]}
          onChange={setView}
        />

        {(view === 'kanban' || view === 'list') && (
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by startup, sector, or tag..."
              className="w-72"
              resultCount={search ? filteredDeals.length : undefined}
            />

            <div className="flex items-center gap-2">
              <select
                value={filterStage}
                onChange={e => setFilterStage(e.target.value)}
                className="h-9 px-3 text-[12px] font-medium rounded-[10px] outline-0 cursor-pointer appearance-none"
                style={{
                  background: filterStage ? 'var(--blue-bg)' : 'var(--surface)',
                  border: `1px solid ${filterStage ? 'rgba(37,99,235,0.2)' : 'var(--line)'}`,
                  color: filterStage ? 'var(--blue)' : 'var(--muted)',
                  paddingRight: 28,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%238A93AE' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="">All Stages</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="h-9 px-3 text-[12px] font-medium rounded-[10px] outline-0 cursor-pointer appearance-none"
                style={{
                  background: filterPriority ? 'var(--blue-bg)' : 'var(--surface)',
                  border: `1px solid ${filterPriority ? 'rgba(37,99,235,0.2)' : 'var(--line)'}`,
                  color: filterPriority ? 'var(--blue)' : 'var(--muted)',
                  paddingRight: 28,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%238A93AE' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="h-9 px-2.5 rounded-[10px] flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--surface-3)] cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {deals.length === 0 ? (
          <EmptyState
            icon={<Kanban className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
            title="No deals yet"
            description="Start tracking startups by adding them to your pipeline. Add any startup you're interested in, or browse the marketplace."
            action={{
              label: 'Add Startup',
              onClick: () => setAddModalOpen(true),
            }}
          />
        ) : view === 'kanban' ? (
          <KanbanBoard
            stages={stages}
            grouped={filteredGrouped}
            onMoveDeal={moveDeal}
            onCardClick={handleCardClick}
          />
        ) : view === 'list' ? (
          <PipelineListView
            deals={filteredDeals}
            stages={stages}
            onRowClick={handleCardClick}
            isLoading={isLoading}
          />
        ) : view === 'analytics' ? (
          <div className="flex flex-col gap-5">
            {/* Stage Breakdown */}
            <div
              className="p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--sh-1)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                  Stage Breakdown
                </p>
              </div>
              <div className="flex flex-col gap-3.5">
                {analytics.stageBreakdown.map(s => {
                  const pct = kpis.totalDeals > 0 ? Math.round((s.count / kpis.totalDeals) * 100) : 0
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                          <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                            {s.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.value > 0 && (
                            <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                              {formatCurrency(s.value)}
                            </span>
                          )}
                          <span className="text-[12px] font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>
                            {s.count}
                          </span>
                          <span className="text-[10px] font-medium w-8 text-right" style={{ color: 'var(--muted-2)' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: s.color, boxShadow: `0 0 6px ${s.color}30` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conversion Rates */}
            {analytics.conversionRates.length > 0 && (
              <div
                className="p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--sh-1)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--pos)' }} />
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                    Conversion Rates
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {analytics.conversionRates.map(cr => (
                    <div key={`${cr.from}-${cr.to}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                          {cr.from}
                          <ArrowRight className="w-3 h-3 inline mx-1.5" style={{ color: 'var(--muted-2)' }} />
                          {cr.to}
                        </span>
                        <span
                          className="text-[12px] font-semibold"
                          style={{
                            color: cr.rate >= 50 ? 'var(--pos)' : cr.rate >= 25 ? 'var(--warn)' : 'var(--neg)',
                            fontFamily: 'var(--font-num)',
                          }}
                        >
                          {cr.rate}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(cr.rate, 100)}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{
                            background: cr.rate >= 50 ? 'var(--pos)' : cr.rate >= 25 ? 'var(--warn)' : 'var(--neg)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom row: sectors + priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Sectors */}
              <div
                className="p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--sh-1)' }}
              >
                <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                  Top Sectors
                </p>
                {analytics.topSectors.length === 0 ? (
                  <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>No sector data</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {analytics.topSectors.map(([sector, count], i) => {
                      const pct = kpis.totalDeals > 0 ? Math.round((count / kpis.totalDeals) * 100) : 0
                      return (
                        <div key={sector}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[13px]" style={{ color: 'var(--ink)' }}>{sector}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                              >
                                {count}
                              </span>
                              <span className="text-[10px] w-7 text-right" style={{ color: 'var(--muted-2)' }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.05 * i }}
                              className="h-full rounded-full"
                              style={{ background: 'var(--blue)', opacity: 1 - i * 0.12 }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Priority Distribution */}
              <div
                className="p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--sh-1)' }}
              >
                <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                  Priority Distribution
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'high', label: 'High Priority', color: 'var(--neg)', bg: 'var(--neg-bg)' },
                    { key: 'medium', label: 'Medium Priority', color: 'var(--warn)', bg: 'var(--warn-bg)' },
                    { key: 'low', label: 'Low Priority', color: 'var(--pos)', bg: 'var(--pos-bg)' },
                  ].map(p => {
                    const count = analytics.priorityCounts[p.key as keyof typeof analytics.priorityCounts]
                    const pct = kpis.totalDeals > 0 ? Math.round((count / kpis.totalDeals) * 100) : 0
                    return (
                      <div key={p.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{p.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-[6px]"
                              style={{ background: p.bg, color: p.color }}
                            >
                              {count}
                            </span>
                            <span className="text-[10px] w-7 text-right" style={{ color: 'var(--muted-2)' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: p.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : view === 'alerts' ? (
          <div
            className="max-w-2xl mx-auto p-5 rounded-[var(--r-lg)]"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4" style={{ color: 'var(--blue)' }} />
              <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                Smart Alerts
              </p>
            </div>
            <AlertsPanel
              alerts={alerts}
              onMarkRead={markAlertRead}
              onMarkAllRead={markAllAlertsRead}
              onDismiss={dismissAlert}
            />
          </div>
        ) : null}
      </motion.div>

      {/* Add to pipeline modal */}
      <AddToPipelineModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addDeal}
        existingStartupIds={existingStartupIds}
      />

      {/* Detail drawer */}
      <DealDetailDrawer
        deal={selectedDeal}
        stages={stages}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={updateDeal}
        onRemove={removeDeal}
        onMoveDeal={moveDeal}
        onSetReminder={setReminder}
        onClearReminder={clearReminder}
        onLoadActivity={loadActivity}
      />
    </>
  )
}
