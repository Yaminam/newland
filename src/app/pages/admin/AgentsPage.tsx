import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bot, Brain, PenTool, Linkedin, Instagram, Mail,
  Repeat, Palette, Upload, BarChart3, CalendarClock,
  Play, Pause, RefreshCw, Clock, Zap, DollarSign,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Eye,
  ChevronRight, ArrowUpRight, ArrowDownRight, Minus, X,
  Search, Filter, Activity, TrendingUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/app/lib/supabase'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'
import { Tabs, TabsContent } from '@/app/components/ui/Tabs'
import { Badge } from '@/app/components/ui/Badge'
import { DataTable } from '@/app/components/ui/DataTable'
import { SmoothLineChart } from '@/app/components/ui/SmoothLineChart'
import { PillBarChart } from '@/app/components/ui/PillBarChart'
import { Sparkline } from '@/app/components/ui/Sparkline'

/* ── Light theme tokens ─────────────────────────────────────── */
const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  statBg: '#F8FAFC',
  statBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
}

/* ── Agent Registry ─────────────────────────────────────────── */
const AGENTS = [
  {
    key: 'orchestrator',
    label: 'Orchestrator',
    desc: 'Dispatching weekly content tasks to all agents',
    icon: Brain,
    color: '#6366F1',
    letter: 'O',
    systems: ['Supabase', 'OpenAI', 'ZeptoMail'],
  },
  {
    key: 'blog_writer',
    label: 'Blog Writer',
    desc: 'Generating SEO-optimized long-form articles',
    icon: PenTool,
    color: '#2563EB',
    letter: 'B',
    systems: ['OpenAI', 'Supabase'],
  },
  {
    key: 'linkedin_writer',
    label: 'LinkedIn Writer',
    desc: 'Creating engaging LinkedIn posts for founders',
    icon: Linkedin,
    color: '#0077B5',
    letter: 'Li',
    systems: ['OpenAI', 'Buffer'],
  },
  {
    key: 'instagram_copy',
    label: 'Instagram Copy',
    desc: 'Writing carousel, reel & story content',
    icon: Instagram,
    color: '#E1306C',
    letter: 'Ig',
    systems: ['OpenAI', 'Buffer'],
  },
  {
    key: 'newsletter',
    label: 'Newsletter',
    desc: 'Compiling weekly Capital Intelligence Brief',
    icon: Mail,
    color: '#FF6719',
    letter: 'N',
    systems: ['OpenAI', 'ZeptoMail'],
  },
  {
    key: 'repurpose',
    label: 'Repurpose',
    desc: 'Converting blog articles into multi-channel content',
    icon: Repeat,
    color: '#0891B2',
    letter: 'R',
    systems: ['OpenAI', 'Supabase'],
  },
  {
    key: 'creative',
    label: 'Creative',
    desc: 'Generating visual assets with AI + brand compositing',
    icon: Palette,
    color: '#D946EF',
    letter: 'C',
    systems: ['OpenAI', 'HCTI', 'Storage'],
  },
  {
    key: 'publisher',
    label: 'Publisher',
    desc: 'Publishing approved content to all channels',
    icon: Upload,
    color: '#16A34A',
    letter: 'P',
    systems: ['Buffer', 'ZeptoMail', 'Supabase'],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    desc: 'Generating weekly performance reports',
    icon: BarChart3,
    color: '#D97706',
    letter: 'A',
    systems: ['Buffer', 'Supabase', 'ZeptoMail'],
  },
  {
    key: 'scheduler',
    label: 'Scheduler',
    desc: 'Tracking deadlines and sending daily digest',
    icon: CalendarClock,
    color: '#64748B',
    letter: 'S',
    systems: ['Supabase', 'ZeptoMail'],
  },
] as const

type AgentKey = typeof AGENTS[number]['key']

interface AgentRun {
  id: string; agent: string; status: string; triggered_by: string
  tasks_dispatched: number; tasks_completed: number
  tokens_in: number; tokens_out: number; cost_usd: number
  error: string | null; started_at: string; finished_at: string | null; created_at: string
}
interface AgentStep {
  id: string; run_id: string; step_number: number; action: string; detail: string
  tokens_in: number; tokens_out: number; duration_ms: number; created_at: string
}
interface ContentDraft {
  id: string; brief_id: string | null; agent: string; channel: string
  title: string; body: string; status: string; self_review_score: number | null
  image_urls: string[] | null; hashtags: string[] | null
  carousel_slides: { text: string }[] | null
  created_at: string
}
interface CostEntry { date: string; agent: string; cost_usd: number; tokens_in: number; tokens_out: number }

/* ── Helpers ─────────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function statusIcon(s: string) {
  if (s === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#16A34A' }} />
  if (s === 'done')    return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
  if (s === 'failed')  return <XCircle className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
  if (s === 'waiting') return <Clock className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
  return <Minus className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
}

function actionIcon(a: string) {
  if (a === 'generate')    return <Zap className="w-3.5 h-3.5" style={{ color: '#2563EB' }} />
  if (a === 'tool_call')   return <Play className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
  if (a === 'self_review') return <Eye className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
  if (a === 'error')       return <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
  if (a === 'notify')      return <Mail className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
  return <ChevronRight className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
}

function getStatusConfig(status: string | undefined) {
  if (status === 'running') return { label: 'Active',     bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' }
  if (status === 'failed')  return { label: 'Failed',     bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' }
  if (status === 'waiting') return { label: 'Processing', bg: '#FEF3C7', color: '#92400E', dot: '#D97706' }
  if (status === 'done')    return { label: 'Idle',       bg: '#E0F2FE', color: '#0369A1', dot: '#0891B2' }
  return                           { label: 'Offline',    bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' }
}

/* ── Agent Card ──────────────────────────────────────────────── */
function AgentCard({
  agent, lastRun, allRuns, isSelected, onClick,
}: {
  agent: typeof AGENTS[number]; lastRun: AgentRun | null; allRuns: AgentRun[]
  isSelected: boolean; onClick: () => void
}) {
  const status = getStatusConfig(lastRun?.status)
  const isRunning = lastRun?.status === 'running'

  const tasksCompleted = useMemo(() => allRuns.reduce((s, r) => s + (r.tasks_completed || 0), 0), [allRuns])
  const successRate = useMemo(() => {
    if (!allRuns.length) return 0
    return Math.round((allRuns.filter(r => r.status === 'done').length / allRuns.length) * 100)
  }, [allRuns])
  const totalTokens = useMemo(() => allRuns.reduce((s, r) => s + (r.tokens_in || 0) + (r.tokens_out || 0), 0), [allRuns])
  const progress = useMemo(() => {
    if (!lastRun || lastRun.status !== 'running' || lastRun.tasks_dispatched === 0) return null
    return Math.round((lastRun.tasks_completed / lastRun.tasks_dispatched) * 100)
  }, [lastRun])

  return (
    <motion.button
      onClick={onClick}
      className="text-left w-full h-full"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        className="relative rounded-xl p-5 pb-4 h-full flex flex-col transition-all duration-200"
        style={{
          background: T.card,
          border: isSelected ? `2px solid ${agent.color}` : `1px solid ${T.border}`,
          boxShadow: isSelected
            ? `0 0 0 3px ${agent.color}15, 0 4px 12px rgba(0,0,0,0.08)`
            : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {/* Status pill — top right */}
        <div className="flex justify-end mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: status.dot, animation: isRunning ? 'pulse 2s infinite' : undefined }}
            />
            {status.label}
          </span>
        </div>

        {/* Agent identity */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: `${agent.color}12`, color: agent.color }}
          >
            {agent.letter}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: T.text }}>{agent.label}</h3>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: T.textSecondary }}>{agent.desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: T.textSecondary }}>Progress</span>
              <span className="text-xs font-medium" style={{ color: agent.color }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.borderLight }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: agent.color }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-lg px-3 py-2.5" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
            <p className="text-xs mb-0.5" style={{ color: T.textMuted }}>Tasks Done</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold" style={{ color: T.text }}>{tasksCompleted}</span>
              {allRuns.length > 1 && (
                <span className="text-xs font-medium" style={{ color: '#16A34A' }}>
                  <ArrowUpRight className="w-3 h-3 inline" />{allRuns.length}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
            <p className="text-xs mb-0.5" style={{ color: T.textMuted }}>{totalTokens > 0 ? 'Efficiency' : 'Status'}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold" style={{ color: T.text }}>
                {totalTokens > 0 ? `${successRate}%` : 'Ready'}
              </span>
              {successRate > 80 && totalTokens > 0 && (
                <span className="text-xs font-medium" style={{ color: '#16A34A' }}><ArrowUpRight className="w-3 h-3 inline" /></span>
              )}
            </div>
          </div>
        </div>

        {/* Connected Systems */}
        <div className="mb-4">
          <p className="text-xs mb-2 font-medium" style={{ color: T.textMuted }}>Connected Systems</p>
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {agent.systems.map(sys => (
              <span key={sys} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap"
                style={{ background: `${agent.color}08`, color: T.textSecondary, border: `1px solid ${agent.color}20` }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: agent.color }} />{sys}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: T.textMuted }} />
            <span className="text-xs truncate" style={{ color: T.textMuted }}>{lastRun ? timeAgo(lastRun.created_at) : 'No runs yet'}</span>
          </div>
          {lastRun && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Activity className="w-3 h-3" style={{ color: agent.color }} />
              <span className="text-xs font-medium whitespace-nowrap" style={{ color: T.textSecondary }}>{lastRun.tasks_completed} tasks</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}

/* ── Agent Detail Panel ──────────────────────────────────────── */
function AgentDetailPanel({
  agent, runs, steps, costTrend, onClose,
}: {
  agent: typeof AGENTS[number]; runs: AgentRun[]; steps: AgentStep[]; costTrend: number[]; onClose: () => void
}) {
  const totalTokens = useMemo(() => runs.reduce((s, r) => s + (r.tokens_in || 0) + (r.tokens_out || 0), 0), [runs])
  const totalCost = useMemo(() => runs.reduce((s, r) => s + (r.cost_usd || 0), 0), [runs])
  const avgDuration = useMemo(() => {
    const finished = runs.filter(r => r.started_at && r.finished_at)
    if (!finished.length) return 0
    const total = finished.reduce((s, r) => s + (new Date(r.finished_at!).getTime() - new Date(r.started_at).getTime()), 0)
    return Math.round(total / finished.length / 1000)
  }, [runs])
  const successRate = useMemo(() => {
    if (!runs.length) return 0
    return Math.round((runs.filter(r => r.status === 'done').length / runs.length) * 100)
  }, [runs])

  const statItems = [
    { label: 'Total Runs', value: runs.length },
    { label: 'Success Rate', value: `${successRate}%` },
    { label: 'Avg Duration', value: `${avgDuration}s` },
    { label: 'Total Tokens', value: `${(totalTokens / 1000).toFixed(1)}k` },
    { label: 'Total Cost', value: `$${totalCost.toFixed(3)}` },
  ]

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
      <div className="rounded-xl p-6" style={{ background: T.card, border: `1px solid ${agent.color}30`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: `${agent.color}12`, color: agent.color }}>
              {agent.letter}
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: T.text }}>{agent.label}</h3>
              <p className="text-sm" style={{ color: T.textSecondary }}>{agent.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100" style={{ background: T.statBg, color: T.textSecondary }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {statItems.map(s => (
            <div key={s.label} className="rounded-lg px-4 py-3" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
              <p className="text-xs mb-1" style={{ color: T.textMuted }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: T.text }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg p-4" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
            <h4 className="text-sm font-medium mb-3" style={{ color: T.text }}>Cost Trend (8 weeks)</h4>
            {costTrend.length > 1 ? (
              <Sparkline data={costTrend} color={agent.color} height={60} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: T.textMuted }}>Not enough data</p>
            )}
          </div>

          <div className="rounded-lg p-4" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
            <h4 className="text-sm font-medium mb-3" style={{ color: T.text }}>Latest Run Steps</h4>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {steps.length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: T.textMuted }}>No steps recorded</p>
              ) : steps.map(step => (
                <div key={step.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded text-xs" style={{ color: T.textSecondary }}>
                  {actionIcon(step.action)}
                  <span className="flex-1 truncate">{step.detail}</span>
                  <span style={{ color: T.textMuted }}>{timeAgo(step.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {runs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3" style={{ color: T.text }}>Run History</h4>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {runs.slice(0, 10).map(run => (
                <div key={run.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
                  {statusIcon(run.status)}
                  <span className="text-sm capitalize flex-1" style={{ color: T.text }}>{run.status}</span>
                  <span className="text-xs" style={{ color: T.textMuted }}>{run.tasks_completed}/{run.tasks_dispatched} tasks</span>
                  <span className="text-xs" style={{ color: T.textMuted }}>{((run.tokens_in + run.tokens_out) / 1000).toFixed(1)}k tokens</span>
                  <span className="text-xs" style={{ color: T.textMuted }}>${(run.cost_usd || 0).toFixed(4)}</span>
                  <span className="text-xs" style={{ color: T.textMuted }}>{timeAgo(run.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ── Main Page ───────────────────────────────────────────────── */
export function AgentsPage() {
  const [runs, setRuns]         = useState<AgentRun[]>([])
  const [steps, setSteps]       = useState<AgentStep[]>([])
  const [drafts, setDrafts]     = useState<ContentDraft[]>([])
  const [costs, setCosts]       = useState<CostEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab]           = useState('agents')
  const [selectedAgent, setSelectedAgent] = useState<AgentKey | null>(null)
  const [viewDraftId, setViewDraftId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contentChannel, setContentChannel] = useState<string>('all')
  const [contentStatus, setContentStatus] = useState<string>('all')
  const [editingDraft, setEditingDraft] = useState<{ id: string; title: string; body: string } | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [runsRes, stepsRes, draftsRes, costsRes] = await Promise.all([
        supabase.from('agent_runs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('agent_steps').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('content_drafts').select('id, brief_id, agent, channel, title, body, status, self_review_score, image_urls, hashtags, carousel_slides, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('api_usage').select('date, agent, cost_usd, tokens_in, tokens_out').order('date', { ascending: false }).limit(90),
      ])
      setRuns(runsRes.data ?? [])
      setSteps(stepsRes.data ?? [])
      setDrafts(draftsRes.data ?? [])
      setCosts(costsRes.data ?? [])
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['agent_runs', 'agent_steps', 'content_drafts', 'api_usage'], () => void load())

  /* ── Derived ─────────────────────────────────────────────── */
  const lastRunByAgent = useMemo(() => {
    const map: Record<string, AgentRun> = {}
    for (const r of runs) { if (!map[r.agent]) map[r.agent] = r }
    return map
  }, [runs])
  const runsByAgent = useMemo(() => {
    const map: Record<string, AgentRun[]> = {}
    for (const r of runs) { if (!map[r.agent]) map[r.agent] = []; map[r.agent].push(r) }
    return map
  }, [runs])

  const runningCount    = useMemo(() => runs.filter(r => r.status === 'running').length, [runs])
  const processingCount = useMemo(() => runs.filter(r => r.status === 'waiting').length, [runs])
  const deployedCount   = useMemo(() => new Set(runs.map(r => r.agent)).size, [runs])
  const totalCompleted  = useMemo(() => runs.reduce((s, r) => s + (r.tasks_completed || 0), 0), [runs])
  const efficiency      = useMemo(() => { const d = runs.filter(r => r.status === 'done').length; return runs.length ? Math.round((d / runs.length) * 100) : 0 }, [runs])
  const weekDrafts      = useMemo(() => { const w = new Date(Date.now() - 7 * 86_400_000).toISOString(); return runs.filter(r => r.created_at >= w).reduce((s, r) => s + (r.tasks_completed || 0), 0) }, [runs])
  const monthCost       = useMemo(() => { const s = new Date(); s.setDate(1); const st = s.toISOString().slice(0, 10); return costs.filter(c => c.date >= st).reduce((a, c) => a + c.cost_usd, 0) }, [costs])

  const dailyCostData = useMemo(() => {
    const byDate: Record<string, number> = {}
    for (const c of costs) byDate[c.date] = (byDate[c.date] || 0) + c.cost_usd
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, cost]) => ({ date, cost: +cost.toFixed(4) }))
  }, [costs])
  const costByAgent = useMemo(() => {
    const byA: Record<string, number> = {}
    for (const c of costs) byA[c.agent] = (byA[c.agent] || 0) + c.cost_usd
    return Object.entries(byA).map(([category, count]) => ({ category, count: +count.toFixed(4) })).sort((a, b) => b.count - a.count)
  }, [costs])

  const selectedAgentRuns = useMemo(() => selectedAgent ? runs.filter(r => r.agent === selectedAgent) : [], [runs, selectedAgent])
  const selectedAgentSteps = useMemo(() => {
    if (!selectedAgentRuns.length) return []
    return steps.filter(s => s.run_id === selectedAgentRuns[0]?.id).sort((a, b) => a.step_number - b.step_number)
  }, [selectedAgentRuns, steps])
  const selectedAgentCostTrend = useMemo(() => {
    if (!selectedAgent) return []
    const byDate: Record<string, number> = {}
    for (const c of costs.filter(c => c.agent === selectedAgent)) byDate[c.date] = (byDate[c.date] || 0) + c.cost_usd
    return Object.values(byDate).slice(-8)
  }, [costs, selectedAgent])
  const selectedAgentMeta = selectedAgent ? AGENTS.find(a => a.key === selectedAgent) : null

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return AGENTS
    const q = searchQuery.toLowerCase()
    return AGENTS.filter(a => a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.key.includes(q))
  }, [searchQuery])

  async function approveDraft(id: string) { await supabase.from('content_drafts').update({ status: 'approved' }).eq('id', id); void load(true) }
  async function rejectDraft(id: string) {
    const feedback = prompt('Rejection feedback for the agent:')
    if (!feedback) return
    await supabase.from('content_drafts').update({ status: 'rejected', reviewer_feedback: feedback, reviewed_at: new Date().toISOString() }).eq('id', id)
    void load(true)
  }

  function openEditor(draft: ContentDraft) {
    setEditingDraft({ id: draft.id, title: draft.title, body: draft.body })
    setEditTitle(draft.title)
    setEditBody(draft.body)
  }

  async function saveEditor() {
    if (!editingDraft) return
    setSaving(true)
    await supabase.from('content_drafts').update({ title: editTitle, body: editBody }).eq('id', editingDraft.id)
    setSaving(false)
    setEditingDraft(null)
    void load(true)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto space-y-6" style={{ background: T.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>AI Agent Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: T.textSecondary }}>Monitor and manage your autonomous AI workforce</p>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
          style={{ background: '#0891B2', color: '#fff', opacity: refreshing ? 0.7 : 1 }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { dot: '#16A34A', label: 'Active', value: runningCount > 0 ? runningCount : deployedCount, sub: runningCount > 0 ? 'Running tasks' : `${deployedCount} deployed`, subColor: runningCount > 0 ? '#16A34A' : T.textMuted },
          { dot: '#D97706', label: 'Processing', value: processingCount, sub: processingCount > 0 ? 'Running tasks' : 'Idle', subColor: processingCount > 0 ? '#D97706' : T.textMuted },
          { dot: '#2563EB', label: 'Completed', value: totalCompleted, sub: `${weekDrafts} this week`, subColor: T.textMuted },
          { dot: '#0891B2', label: 'Efficiency', value: `${efficiency}%`, sub: `$${monthCost.toFixed(2)} this month`, subColor: efficiency > 80 ? '#16A34A' : T.textMuted },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-xl px-5 py-4" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: kpi.dot }} />
              <span className="text-xs font-medium" style={{ color: T.textSecondary }}>{kpi.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: T.text }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: kpi.subColor }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'agents',   label: `AI Agents (${AGENTS.length})` },
          { value: 'activity', label: 'Activity' },
          { value: 'cost',     label: 'Analytics' },
          { value: 'content',  label: `Content (${drafts.length})` },
        ]}
        value={tab}
        onValueChange={setTab}
      >
        {/* ── Agents ─────────────────────────────────────── */}
        <TabsContent value="agents">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}` }}>
              <Search className="w-4 h-4" style={{ color: T.textMuted }} />
              <input type="text" placeholder="Search agents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1" style={{ color: T.text }} />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSecondary }}>
              <Filter className="w-4 h-4" />Filter
            </button>
          </div>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredAgents.map(agent => (
              <AgentCard key={agent.key} agent={agent} lastRun={lastRunByAgent[agent.key] ?? null} allRuns={runsByAgent[agent.key] ?? []}
                isSelected={selectedAgent === agent.key} onClick={() => setSelectedAgent(prev => prev === agent.key ? null : agent.key)} />
            ))}
          </div>

          <AnimatePresence>
            {selectedAgent && selectedAgentMeta && (
              <div className="mt-6">
                <AgentDetailPanel key={selectedAgent} agent={selectedAgentMeta} runs={selectedAgentRuns} steps={selectedAgentSteps}
                  costTrend={selectedAgentCostTrend} onClose={() => setSelectedAgent(null)} />
              </div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ── Activity ───────────────────────────────────── */}
        <TabsContent value="activity">
          <div className="rounded-xl p-4 max-h-[600px] overflow-y-auto" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            {steps.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: T.textMuted }}>No activity yet. Run the orchestrator to start generating content.</p>
            ) : (
              <div className="space-y-1">
                {steps.slice(0, 100).map(step => {
                  const agentMeta = AGENTS.find(a => { const run = runs.find(r => r.id === step.run_id); return run && a.key === run.agent })
                  return (
                    <div key={step.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50">
                      <div className="mt-0.5">{actionIcon(step.action)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: T.text }}>{step.detail}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {agentMeta && <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: agentMeta.color + '10', color: agentMeta.color }}>{agentMeta.label}</span>}
                          {step.tokens_in > 0 && <span className="text-xs" style={{ color: T.textMuted }}>{step.tokens_in + step.tokens_out} tokens</span>}
                          {step.duration_ms > 0 && <span className="text-xs" style={{ color: T.textMuted }}>{step.duration_ms}ms</span>}
                        </div>
                      </div>
                      <span className="text-xs whitespace-nowrap" style={{ color: T.textMuted }}>{timeAgo(step.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: T.text }}>Run History</h3>
            <DataTable
              columns={[
                { key: 'agent', header: 'Agent', sortable: true, width: '160px', render: (val: string) => { const m = AGENTS.find(a => a.key === val); return (<span className="flex items-center gap-2">{m && <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold" style={{ background: `${m.color}12`, color: m.color }}>{m.letter}</span>}<span className="text-sm font-medium">{m?.label ?? val}</span></span>) } },
                { key: 'status', header: 'Status', sortable: true, width: '110px', render: (val: string) => { const sc = getStatusConfig(val); return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />{sc.label}</span>) } },
                { key: 'tasks_dispatched', header: 'Dispatched', sortable: true, width: '100px' },
                { key: 'tasks_completed', header: 'Completed', sortable: true, width: '100px' },
                { key: 'tokens_in', header: 'Tokens', width: '120px', render: (_: number, row: AgentRun) => `${((row.tokens_in + row.tokens_out) / 1000).toFixed(1)}k` },
                { key: 'cost_usd', header: 'Cost', sortable: true, width: '80px', render: (val: number) => `$${(val || 0).toFixed(4)}` },
                { key: 'created_at', header: 'Time', sortable: true, width: '120px', render: (val: string) => timeAgo(val) },
              ]}
              data={runs}
              searchable
              searchPlaceholder="Search runs..."
              pagination
              pageSize={15}
              loading={loading}
            />
          </div>
        </TabsContent>

        {/* ── Analytics ──────────────────────────────────── */}
        <TabsContent value="cost">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Daily API Cost (30 days)</h3>
              {dailyCostData.length > 0
                ? <SmoothLineChart data={dailyCostData} xKey="date" series={[{ key: 'cost', color: '#0891B2', fill: true, label: 'Cost ($)' }]} height={220} />
                : <p className="text-sm py-8 text-center" style={{ color: T.textMuted }}>No cost data yet</p>}
            </div>
            <div className="rounded-xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Cost by Agent</h3>
              {costByAgent.length > 0
                ? <PillBarChart data={costByAgent} xKey="category" yKey="count" color="#0891B2" height={220} />
                : <p className="text-sm py-8 text-center" style={{ color: T.textMuted }}>No cost data yet</p>}
            </div>
          </div>
          <div className="rounded-xl p-5 mt-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: T.text }}>Monthly Budget</span>
              <span className="text-sm font-semibold" style={{ color: '#0891B2' }}>${monthCost.toFixed(2)} / $100.00</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: T.borderLight }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (monthCost / 100) * 100)}%`, background: monthCost > 80 ? '#DC2626' : monthCost > 50 ? '#D97706' : '#0891B2' }} />
            </div>
          </div>
        </TabsContent>

        {/* ── Content Browser ──────────────────────────────── */}
        <TabsContent value="content">
          {(() => {
            const channels = [
              { key: 'all',        label: 'All',        icon: Bot,           color: '#6366F1' },
              { key: 'blog',       label: 'Blog',       icon: PenTool,       color: '#2563EB' },
              { key: 'linkedin',   label: 'LinkedIn',   icon: Linkedin,      color: '#0077B5' },
              { key: 'instagram',  label: 'Instagram',  icon: Instagram,     color: '#E1306C' },
              { key: 'newsletter', label: 'Newsletter', icon: Mail,          color: '#FF6719' },
            ]
            const statuses = [
              { key: 'all',       label: 'All Statuses', color: '#6366F1' },
              { key: 'review',    label: 'In Review',    color: '#D97706' },
              { key: 'approved',  label: 'Approved',     color: '#16A34A' },
              { key: 'designed',  label: 'Designed',     color: '#D946EF' },
              { key: 'published', label: 'Published',    color: '#0891B2' },
              { key: 'rejected',  label: 'Rejected',     color: '#DC2626' },
            ]
            const statusColors: Record<string, { bg: string; color: string }> = {
              draft:     { bg: '#F1F5F9', color: '#64748B' },
              review:    { bg: '#FEF3C7', color: '#92400E' },
              approved:  { bg: '#DCFCE7', color: '#15803D' },
              edited:    { bg: '#DBEAFE', color: '#1E40AF' },
              designed:  { bg: '#F3E8FF', color: '#7C3AED' },
              published: { bg: '#CCFBF1', color: '#0F766E' },
              rejected:  { bg: '#FEE2E2', color: '#991B1B' },
            }
            const filtered = drafts.filter(d => {
              if (contentChannel !== 'all' && d.channel !== contentChannel) return false
              if (contentStatus !== 'all' && d.status !== contentStatus) return false
              return true
            })
            const channelCounts = drafts.reduce<Record<string, number>>((acc, d) => { acc[d.channel] = (acc[d.channel] || 0) + 1; return acc }, {})

            return (
              <div className="space-y-5">
                {/* Channel filter pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {channels.map(ch => {
                    const count = ch.key === 'all' ? drafts.length : (channelCounts[ch.key] || 0)
                    const active = contentChannel === ch.key
                    return (
                      <button key={ch.key} onClick={() => setContentChannel(ch.key)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active ? `${ch.color}10` : T.card,
                          border: active ? `2px solid ${ch.color}` : `1px solid ${T.border}`,
                          color: active ? ch.color : T.textSecondary,
                        }}>
                        <ch.icon className="w-4 h-4" />
                        {ch.label}
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: active ? `${ch.color}15` : T.statBg, color: active ? ch.color : T.textMuted }}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  {statuses.map(st => {
                    const count = drafts.filter(d => (contentChannel === 'all' || d.channel === contentChannel) && (st.key === 'all' || d.status === st.key)).length
                    const active = contentStatus === st.key
                    return (
                      <button key={st.key} onClick={() => setContentStatus(st.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: active ? `${st.color}15` : T.statBg,
                          border: active ? `1px solid ${st.color}50` : `1px solid ${T.border}`,
                          color: active ? st.color : T.textMuted,
                        }}>
                        {st.label} ({count})
                      </button>
                    )
                  })}
                </div>

                {/* Content cards */}
                {filtered.length === 0 ? (
                  <div className="rounded-xl p-8 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <p className="text-sm font-medium" style={{ color: T.text }}>No content found</p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>Adjust your filters or run the orchestrator to generate content</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map(draft => {
                      const agentMeta = AGENTS.find(a => a.key === draft.agent)
                      const images = draft.image_urls || []
                      const hashtags = draft.hashtags || []
                      const slides = draft.carousel_slides || []
                      const sc = statusColors[draft.status] || statusColors.draft
                      const isExpanded = viewDraftId === draft.id

                      return (
                        <div key={draft.id} className="rounded-xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                          {/* Card header */}
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant={draft.channel === 'blog' ? 'info' : draft.channel === 'linkedin' ? 'default' : draft.channel === 'instagram' ? 'warning' : 'neutral'}>{draft.channel}</Badge>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>{draft.status}</span>
                                  {agentMeta && <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: agentMeta.color + '10', color: agentMeta.color }}>{agentMeta.label}</span>}
                                  {draft.self_review_score != null && <span className="text-xs" style={{ color: T.textMuted }}>Score: {draft.self_review_score}/10</span>}
                                  {images.length > 0 && <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: '#D946EF10', color: '#D946EF' }}>{images.length} image{images.length > 1 ? 's' : ''}</span>}
                                </div>
                                <h4 className="text-sm font-semibold" style={{ color: T.text }}>{draft.title}</h4>
                                <p className="text-xs mt-1 line-clamp-2" style={{ color: T.textSecondary }}>{(draft.body || '').slice(0, 250)}</p>
                                {hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {hashtags.slice(0, 8).map((h, i) => (
                                      <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#DBEAFE', color: '#1E40AF' }}>{h}</span>
                                    ))}
                                    {hashtags.length > 8 && <span className="text-xs" style={{ color: T.textMuted }}>+{hashtags.length - 8} more</span>}
                                  </div>
                                )}
                                <span className="text-xs mt-2 inline-block" style={{ color: T.textMuted }}>{timeAgo(draft.created_at)}</span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                <button onClick={() => setViewDraftId(isExpanded ? null : draft.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                  style={{ background: '#6366F110', color: '#6366F1' }}>
                                  <Eye className="w-3.5 h-3.5" />{isExpanded ? 'Collapse' : 'Expand'}
                                </button>
                                <button onClick={() => openEditor(draft)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                  style={{ background: '#2563EB10', color: '#2563EB' }}>
                                  <PenTool className="w-3.5 h-3.5" />Edit
                                </button>
                                {(draft.status === 'review' || draft.status === 'draft') && (
                                  <>
                                    <button onClick={() => approveDraft(draft.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                      style={{ background: '#16A34A10', color: '#16A34A' }}>
                                      <CheckCircle2 className="w-3.5 h-3.5" />Approve
                                    </button>
                                    <button onClick={() => rejectDraft(draft.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                      style={{ background: '#DC262610', color: '#DC2626' }}>
                                      <XCircle className="w-3.5 h-3.5" />Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Image gallery (always visible if images exist) */}
                          {images.length > 0 && (
                            <div className="px-5 pb-3">
                              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                                {images.map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                    <img
                                      src={url}
                                      alt={`${draft.channel} slide ${i + 1}`}
                                      className="rounded-lg object-cover transition-transform hover:scale-105"
                                      style={{ width: slides.length > 1 ? '140px' : '200px', height: slides.length > 1 ? '140px' : '200px', border: `1px solid ${T.border}` }}
                                    />
                                  </a>
                                ))}
                              </div>
                              {slides.length > 0 && (
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>{slides.length}-slide carousel</p>
                              )}
                            </div>
                          )}

                          {/* Expanded: full body + carousel text */}
                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${T.border}` }}>
                              {/* Carousel slide texts */}
                              {slides.length > 0 && (
                                <div className="pt-4">
                                  <h5 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: T.textMuted }}>Carousel Slides</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    {slides.map((slide, i) => (
                                      <div key={i} className="rounded-lg p-3 text-center" style={{ background: T.statBg, border: `1px solid ${T.statBorder}` }}>
                                        <span className="text-xs font-bold block mb-1" style={{ color: '#6366F1' }}>Slide {i + 1}</span>
                                        <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>{slide.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Full body */}
                              <div className="pt-4">
                                <h5 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: T.textMuted }}>Full Content</h5>
                                <div className="p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed"
                                  style={{ background: T.statBg, border: `1px solid ${T.statBorder}`, color: T.textSecondary, maxHeight: '400px', overflowY: 'auto' }}>
                                  {draft.body || 'No content'}
                                </div>
                              </div>

                              {/* All hashtags */}
                              {hashtags.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: T.textMuted }}>Hashtags ({hashtags.length})</h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {hashtags.map((h, i) => (
                                      <span key={i} className="text-xs px-2 py-1 rounded-md" style={{ background: '#DBEAFE', color: '#1E40AF' }}>{h}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* ── Draft Editor Modal ─────────────────────────────── */}
      <AnimatePresence>
        {editingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditingDraft(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
              style={{ background: T.card, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563EB10' }}>
                    <PenTool className="w-4 h-4" style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: T.text }}>Edit Draft</h3>
                    <p className="text-xs" style={{ color: T.textMuted }}>Make changes to the content below</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingDraft(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                    style={{ color: T.textSecondary, border: `1px solid ${T.border}` }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditor}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: '#2563EB', opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Title Field */}
              <div className="px-6 pt-4 pb-2">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: T.textMuted }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium outline-none transition-all"
                  style={{
                    background: T.statBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                  }}
                />
              </div>

              {/* Body Editor */}
              <div className="px-6 pt-2 pb-4 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: T.textMuted }}>Content</label>
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    {editBody.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={editBody}
                  onChange={e => setEditBody(e.target.value)}
                  className="w-full flex-1 min-h-[400px] px-5 py-4 rounded-lg text-sm leading-relaxed outline-none resize-none transition-all"
                  style={{
                    background: T.statBg,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '15px',
                    lineHeight: '1.8',
                  }}
                  placeholder="Write your content here..."
                />
              </div>

              {/* Editor Footer */}
              <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: `1px solid ${T.border}`, background: T.statBg }}>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    {editBody.length} characters
                  </span>
                  <span className="text-xs" style={{ color: T.textMuted }}>
                    ~{Math.ceil(editBody.split(/\s+/).filter(Boolean).length / 200)} min read
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditTitle(editingDraft.title); setEditBody(editingDraft.body) }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                    style={{ color: T.textMuted }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
