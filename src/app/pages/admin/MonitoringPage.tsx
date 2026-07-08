import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Database,
  LineChart,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'

type Tab = 'health' | 'traffic' | 'errors'

const TAB_LABELS: Record<Tab, { label: string; icon: React.ElementType }> = {
  health:  { label: 'Platform health', icon: Activity },
  traffic: { label: 'Traffic',         icon: LineChart },
  errors:  { label: 'Errors',          icon: AlertOctagon },
}

export function MonitoringPage() {
  const [tab, setTab] = useState<Tab>('health')

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Monitoring
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Platform health, user traffic, and error signals.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {(['health','traffic','errors'] as Tab[]).map(t => {
          const Icon = TAB_LABELS[t].icon
          return (
            <button key={t} type="button" onClick={() => setTab(t)}
              className="text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              style={{
                background: tab === t ? 'var(--surface)' : 'transparent',
                color:      tab === t ? 'var(--ink)' : 'var(--muted)',
                boxShadow:  tab === t ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {TAB_LABELS[t].label}
            </button>
          )
        })}
      </div>

      {tab === 'health'  && <HealthTab />}
      {tab === 'traffic' && <TrafficTab />}
      {tab === 'errors'  && <ErrorsTab />}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ────────────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, hint, tone = 'neutral' }: {
  label: string; value: string | number; hint?: string; tone?: 'neutral' | 'good' | 'bad'
}) {
  const valueColor = tone === 'good' ? 'var(--pos)' : tone === 'bad' ? 'var(--neg)' : 'var(--ink)'
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.1em] font-semibold mb-2" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-2xl font-semibold" style={{ color: valueColor, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--muted-2)' }}>{hint}</p>}
    </Card>
  )
}

function Sparkline({ values, width = 160, height = 36, color = 'var(--blue)' }: {
  values: number[]; width?: number; height?: number; color?: string
}) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const path = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - (v / max) * height).toFixed(1)}`)
    .join(' ')
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={path} stroke={color} strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ────────────────────────────────────────────────────────────────────────────
// Health tab
// ────────────────────────────────────────────────────────────────────────────

interface ScraperRun {
  id:            string
  job:           string
  status:        string
  items_in:      number | null
  items_written: number | null
  error:         string | null
  started_at:    string
  finished_at:   string | null
}

interface TableCount {
  name:  string
  count: number
}

function HealthTab() {
  const [runs, setRuns]             = useState<ScraperRun[]>([])
  const [counts, setCounts]         = useState<TableCount[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    const MONITOR_TABLES = [
      'profiles', 'startup_applications', 'founder_profiles', 'investor_profiles',
      'introductions', 'user_reports', 'scraped_investors', 'public_startups',
      'news_articles', 'scraper_runs', 'audit_log', 'security_events',
    ]

    const [runRes, ...countsRes] = await Promise.all([
      supabase.from('scraper_runs')
        .select('id, job, status, items_in, items_written, error, started_at, finished_at')
        .order('started_at', { ascending: false })
        .limit(20),
      ...MONITOR_TABLES.map(t =>
        supabase.from(t).select('id', { count: 'exact', head: true }),
      ),
    ])

    setRuns(((runRes.data ?? []) as ScraperRun[]))
    setCounts(MONITOR_TABLES.map((name, i) => ({
      name,
      count: countsRes[i].count ?? 0,
    })))
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['scraper_runs'], () => void load())

  const lastRunByJob = useMemo(() => {
    const map = new Map<string, ScraperRun>()
    for (const r of runs) {
      if (!map.has(r.job)) map.set(r.job, r)
    }
    return map
  }, [runs])

  const recentFailures = useMemo(
    () => runs.filter(r => r.status === 'failed').slice(0, 5),
    [runs],
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      {/* Scraper / cron job status */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
            Scraper / cron jobs
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="text-xs font-medium flex items-center gap-1.5 transition-colors"
            style={{ color: refreshing ? 'var(--muted-2)' : 'var(--blue)' }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...lastRunByJob.entries()].map(([job, r]) => (
            <JobStatusCard key={job} job={job} run={r} />
          ))}
          {lastRunByJob.size === 0 && (
            <Card>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No scraper runs logged yet.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Recent failures strip */}
      {recentFailures.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
            Recent failures
          </h2>
          <Card>
            <ul className="space-y-2">
              {recentFailures.map(r => (
                <li key={r.id} className="flex items-start gap-3 text-sm">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--neg)' }} />
                  <div className="min-w-0 flex-1">
                    <p>
                      <strong style={{ color: 'var(--ink)' }}>{r.job}</strong>
                      <span className="ml-2" style={{ color: 'var(--muted-2)' }}>{timeAgo(r.started_at)}</span>
                    </p>
                    {r.error && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{r.error}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Table row counts */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Table sizes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {counts.map(c => (
            <Card key={c.name} className="py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{c.name}</p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {c.count.toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function JobStatusCard({ job, run }: { job: string; run: ScraperRun }) {
  const ok = run.status === 'succeeded'
  const running = run.status === 'started' || run.status === 'running'
  const Icon = ok ? CheckCircle2 : running ? Clock : XCircle
  const tone = ok ? 'var(--pos)' : running ? 'var(--blue)' : 'var(--neg)'
  const duration = run.finished_at
    ? formatDuration(new Date(run.finished_at).getTime() - new Date(run.started_at).getTime())
    : null
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <strong style={{ color: 'var(--ink)' }}>{job}</strong>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
          style={{ background: `${tone}14`, color: tone }}
        >
          <Icon className="w-3 h-3" />
          {run.status}
        </span>
      </div>
      <div className="text-xs space-y-0.5" style={{ color: 'var(--muted)' }}>
        <p>Ran {timeAgo(run.started_at)}{duration ? ` · ${duration}` : ''}</p>
        {run.items_written != null && (
          <p>{run.items_in ?? '?'} in / {run.items_written} written</p>
        )}
        {run.error && (
          <p className="truncate" style={{ color: 'var(--neg)' }} title={run.error}>{run.error}</p>
        )}
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Traffic tab
// ────────────────────────────────────────────────────────────────────────────

function TrafficTab() {
  const [loading, setLoading] = useState(true)
  const [dau, setDau]         = useState(0)
  const [wau, setWau]         = useState(0)
  const [mau, setMau]         = useState(0)
  const [signupSeries, setSignupSeries] = useState<number[]>([])
  const [introSeries,  setIntroSeries]  = useState<number[]>([])
  const [approvalSeries, setApprovalSeries] = useState<number[]>([])
  const [signups7d, setSignups7d] = useState(0)
  const [intros7d,  setIntros7d]  = useState(0)
  const [approvals7d, setApprovals7d] = useState(0)

  const load = useCallback(async () => {
    const now   = Date.now()
    const DAY   = 86_400_000
    const day1  = new Date(now - 1  * DAY).toISOString()
    const day7  = new Date(now - 7  * DAY).toISOString()
    const day30 = new Date(now - 30 * DAY).toISOString()

    const [
      dauRes, wauRes, mauRes,
      signupsRes, introsRes, approvalsRes,
      signupsCount, introsCount, approvalsCount,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', day1),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', day7),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', day30),
      supabase.from('profiles').select('created_at').gte('created_at', day30).order('created_at', { ascending: true }).limit(2000),
      supabase.from('introductions').select('initiated_at').gte('initiated_at', day30).order('initiated_at', { ascending: true }).limit(2000),
      supabase.from('startup_applications').select('reviewed_at').eq('status', 'approved').gte('reviewed_at', day30).order('reviewed_at', { ascending: true }).limit(2000),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', day7),
      supabase.from('introductions').select('id', { count: 'exact', head: true }).gte('initiated_at', day7),
      supabase.from('startup_applications').select('id', { count: 'exact', head: true }).eq('status','approved').gte('reviewed_at', day7),
    ])

    setDau(dauRes.count ?? 0)
    setWau(wauRes.count ?? 0)
    setMau(mauRes.count ?? 0)
    setSignups7d(signupsCount.count ?? 0)
    setIntros7d(introsCount.count ?? 0)
    setApprovals7d(approvalsCount.count ?? 0)

    const bucket = (rows: Array<{ [k: string]: string | null | undefined }>, field: string) => {
      const counts = new Array(30).fill(0) as number[]
      for (const r of rows) {
        const v = r[field]
        if (!v) continue
        const daysAgo = Math.floor((now - new Date(v).getTime()) / DAY)
        const slot = 29 - daysAgo
        if (slot >= 0 && slot < 30) counts[slot]++
      }
      return counts
    }

    setSignupSeries(bucket(signupsRes.data ?? [], 'created_at'))
    setIntroSeries(bucket(introsRes.data ?? [], 'initiated_at'))
    setApprovalSeries(bucket(approvalsRes.data ?? [], 'reviewed_at'))
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Active users (based on last_seen_at)
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          <StatCard label="DAU"  value={dau.toLocaleString()} hint="active in last 24h" />
          <StatCard label="WAU"  value={wau.toLocaleString()} hint="active in last 7d" />
          <StatCard label="MAU"  value={mau.toLocaleString()} hint="active in last 30d" />
        </div>
        {dau === 0 && wau === 0 && mau === 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted-2)' }}>
            last_seen_at isn't being written yet — these will populate once the auth layer updates the column on sign-in.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Last 30 days
        </h2>
        <div className="grid md:grid-cols-3 gap-3">
          <TrafficCard title="Signups"           total={signups7d}   series={signupSeries}   color="#2563EB" />
          <TrafficCard title="Intros initiated"  total={intros7d}    series={introSeries}    color="#16A34A" />
          <TrafficCard title="Apps approved"     total={approvals7d} series={approvalSeries} color="#9333EA" />
        </div>
      </div>
    </div>
  )
}

function TrafficCard({ title, total, series, color }: { title: string; total: number; series: number[]; color: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] font-semibold" style={{ color: 'var(--muted)' }}>{title}</p>
          <p className="text-2xl font-semibold mt-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            {total.toLocaleString()}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>last 7 days</p>
        </div>
        <Sparkline values={series} color={color} />
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Errors tab
// ────────────────────────────────────────────────────────────────────────────

interface SecurityEvent {
  id:              string
  event_type:      string
  severity:        string | null
  route:           string | null
  user_id:         string | null
  identifier_hash: string | null
  ip_hash:         string | null
  user_agent:      string | null
  metadata:        Record<string, unknown> | null
  created_at:      string
}

const EVENT_TYPE_GROUPS: Record<string, { color: string; label: string }> = {
  auth_login_failure:              { color: 'var(--neg)', label: 'Auth failure' },
  auth_signup_failure:             { color: 'var(--neg)', label: 'Signup failure' },
  auth_password_reset_failure:     { color: 'var(--neg)', label: 'Reset failure' },
  api_error:                       { color: 'var(--warn)', label: 'API error' },
  frontend_error:                  { color: 'var(--warn)', label: 'Frontend error' },
  unhandled_rejection:             { color: 'var(--warn)', label: 'Promise rejection' },
}

function ErrorsTab() {
  const [events, setEvents]   = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('security_events')
      .select('id, event_type, severity, route, user_id, identifier_hash, ip_hash, user_agent, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (typeFilter !== 'all') q = q.eq('event_type', typeFilter)
    const { data } = await q
    setEvents((data ?? []) as SecurityEvent[])
    setLoading(false)
  }, [typeFilter])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['security_events'], () => void load(), { events: ['INSERT'] })

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of events) map.set(e.event_type, (map.get(e.event_type) ?? 0) + 1)
    return map
  }, [events])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TypePill active={typeFilter === 'all'} label={`All (${events.length})`} onClick={() => setTypeFilter('all')} />
        {[...counts.entries()].map(([type, n]) => (
          <TypePill
            key={type}
            active={typeFilter === type}
            label={`${EVENT_TYPE_GROUPS[type]?.label ?? type} (${n})`}
            color={EVENT_TYPE_GROUPS[type]?.color}
            onClick={() => setTypeFilter(type)}
          />
        ))}
      </div>

      {loading ? <Loading /> : events.length === 0 ? (
        <Card className="text-center py-10">
          <AlertOctagon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No security events logged in the selected range.</p>
        </Card>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>When</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Event</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Route</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Severity</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => {
                const meta = e.metadata ?? {}
                const group = EVENT_TYPE_GROUPS[e.event_type]
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(e.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                        style={{ background: `${group?.color ?? 'var(--muted)'}14`, color: group?.color ?? 'var(--muted)' }}
                      >
                        {group?.label ?? e.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--muted)' }}>{e.route ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>{e.severity ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-mono truncate max-w-[320px]" style={{ color: 'var(--muted)' }} title={JSON.stringify(meta)}>
                      {Object.keys(meta).length > 0 ? JSON.stringify(meta) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TypePill({ label, active, color, onClick }: {
  label: string; active: boolean; color?: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
      style={{
        background: active ? 'var(--ink)' : 'var(--surface)',
        color:      active ? 'var(--surface)' : color ?? 'var(--muted)',
        border:     `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
      }}
    >
      {label}
    </button>
  )
}
