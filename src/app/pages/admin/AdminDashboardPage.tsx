import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, AlertTriangle, Users, FileCheck, Send, Flag, LifeBuoy,
  TrendingUp, TrendingDown, Minus, LayoutDashboard,
  UserPlus, FileText, CheckCircle2, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'
import { PageHeader } from '@/app/components/ui/PageHeader'

type RangeDays = 7 | 14 | 30 | 90

interface RangedCounts {
  signups:        number
  appsApproved:   number
  introsSent:     number
  introsAccepted: number
}

interface KPIs {
  // Snapshot totals — not time-bounded
  totalUsers:       number
  totalFounders:    number
  totalInvestors:   number
  appsPending:      number
  reportsOpen:      number
  reportsReviewing: number
  introsStuck:      number
  suspendedUsers:   number
  bannedUsers:      number
  supportOpen:      number
  bugsOpen:         number
  activeSubs:       number
  // Feature counts
  totalDeals:       number
  totalChecklists:  number
  totalTermSheets:  number
  totalDealRooms:   number
  totalCRMContacts: number
  // Time-bounded
  current: RangedCounts
  prior:   RangedCounts
}

const EMPTY_RANGED: RangedCounts = {
  signups: 0, appsApproved: 0, introsSent: 0, introsAccepted: 0,
}

const EMPTY_KPIS: KPIs = {
  totalUsers: 0, totalFounders: 0, totalInvestors: 0,
  appsPending: 0, reportsOpen: 0, reportsReviewing: 0, introsStuck: 0,
  suspendedUsers: 0, bannedUsers: 0, supportOpen: 0, bugsOpen: 0, activeSubs: 0,
  totalDeals: 0, totalChecklists: 0, totalTermSheets: 0, totalDealRooms: 0, totalCRMContacts: 0,
  current: EMPTY_RANGED, prior: EMPTY_RANGED,
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

async function loadRangedCounts(startISO: string, endISO: string | null): Promise<RangedCounts> {
  const mk = <T,>(b: PromiseLike<T>): Promise<T> => Promise.resolve(b)

  const signups =
    endISO == null
      ? supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startISO)
      : supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startISO).lt('created_at', endISO)

  const approvals =
    endISO == null
      ? supabase.from('startup_applications').select('id', { count: 'exact', head: true }).eq('status','approved').gte('reviewed_at', startISO)
      : supabase.from('startup_applications').select('id', { count: 'exact', head: true }).eq('status','approved').gte('reviewed_at', startISO).lt('reviewed_at', endISO)

  const introsSent =
    endISO == null
      ? supabase.from('introductions').select('id', { count: 'exact', head: true }).gte('initiated_at', startISO)
      : supabase.from('introductions').select('id', { count: 'exact', head: true }).gte('initiated_at', startISO).lt('initiated_at', endISO)

  const introsAccepted =
    endISO == null
      ? supabase.from('introductions').select('id', { count: 'exact', head: true }).eq('status','accepted').gte('responded_at', startISO)
      : supabase.from('introductions').select('id', { count: 'exact', head: true }).eq('status','accepted').gte('responded_at', startISO).lt('responded_at', endISO)

  const [s, a, is, ia] = await Promise.all([
    mk(signups), mk(approvals), mk(introsSent), mk(introsAccepted),
  ])
  return {
    signups:        s.count ?? 0,
    appsApproved:   a.count ?? 0,
    introsSent:     is.count ?? 0,
    introsAccepted: ia.count ?? 0,
  }
}

export function AdminDashboardPage() {
  const [range, setRange]     = useState<RangeDays>(7)
  const [kpis, setKpis]       = useState<KPIs>(EMPTY_KPIS)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const now = new Date()
      const currentStart = new Date(now.getTime() - range * 86_400_000).toISOString()
      const priorStart   = new Date(now.getTime() - 2 * range * 86_400_000).toISOString()
      const priorEnd     = currentStart
      const introStuckCutoff = isoDaysAgo(7)

      const [
        totalUsersRes, foundersRes, investorsRes,
        appsPendingRes, reportsOpenRes, reportsReviewingRes,
        introsStuckRes, suspendedRes, bannedRes,
        supportOpenRes, bugsOpenRes, activeSubsRes,
        dealsRes, checklistsRes, termSheetsRes, dealRoomsRes, crmContactsRes,
        current, prior,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'founder'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'investor'),
        supabase.from('startup_applications').select('id', { count: 'exact', head: true }).in('status', ['submitted','under_review']),
        supabase.from('user_reports').select('id', { count: 'exact', head: true }).eq('status','open'),
        supabase.from('user_reports').select('id', { count: 'exact', head: true }).eq('status','reviewing'),
        supabase.from('introductions').select('id', { count: 'exact', head: true }).eq('status','pending').lt('initiated_at', introStuckCutoff),
        supabase.from('user_moderation').select('user_id', { count: 'exact', head: true }).eq('status','suspended'),
        supabase.from('user_moderation').select('user_id', { count: 'exact', head: true }).eq('status','banned'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status','open'),
        supabase.from('bug_reports').select('id', { count: 'exact', head: true }).eq('status','open'),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).in('status', ['active','trialing']),
        supabase.from('deals').select('id', { count: 'exact', head: true }),
        supabase.from('dd_checklists').select('id', { count: 'exact', head: true }),
        supabase.from('term_sheets').select('id', { count: 'exact', head: true }),
        supabase.from('deal_rooms').select('id', { count: 'exact', head: true }),
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }),
        loadRangedCounts(currentStart, null),
        loadRangedCounts(priorStart, priorEnd),
      ])

      setKpis({
        totalUsers:       totalUsersRes.count ?? 0,
        totalFounders:    foundersRes.count ?? 0,
        totalInvestors:   investorsRes.count ?? 0,
        appsPending:      appsPendingRes.count ?? 0,
        reportsOpen:      reportsOpenRes.count ?? 0,
        reportsReviewing: reportsReviewingRes.count ?? 0,
        introsStuck:      introsStuckRes.count ?? 0,
        suspendedUsers:   suspendedRes.count ?? 0,
        bannedUsers:      bannedRes.count ?? 0,
        supportOpen:      supportOpenRes.count ?? 0,
        bugsOpen:         bugsOpenRes.count ?? 0,
        activeSubs:       activeSubsRes.count ?? 0,
        totalDeals:       dealsRes.count ?? 0,
        totalChecklists:  checklistsRes.count ?? 0,
        totalTermSheets:  termSheetsRes.count ?? 0,
        totalDealRooms:   dealRoomsRes.count ?? 0,
        totalCRMContacts: crmContactsRes.count ?? 0,
        current, prior,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin KPIs')
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { void load() }, [load])

  const acceptanceRate = kpis.current.introsSent > 0
    ? Math.round((kpis.current.introsAccepted / kpis.current.introsSent) * 100)
    : 0
  const priorAcceptanceRate = kpis.prior.introsSent > 0
    ? Math.round((kpis.prior.introsAccepted / kpis.prior.introsSent) * 100)
    : 0

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle={`Platform health over the last ${range} days · comparing to the previous ${range}-day window.`}
        icon={<LayoutDashboard className="w-5 h-5" />}
        action={<RangePicker value={range} onChange={setRange} />}
      />

      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'var(--neg-bg)', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Couldn't load all KPIs</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Top KPI row */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Users
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KPI label="Total users"    value={kpis.totalUsers}    loading={loading} />
          <KPI label="Founders"       value={kpis.totalFounders} loading={loading} />
          <KPI label="Investors"      value={kpis.totalInvestors} loading={loading} />
          <KPI
            label={`Signups ${range}d`}
            value={kpis.current.signups}
            prior={kpis.prior.signups}
            loading={loading}
            tone="accent"
          />
        </div>
      </section>

      {/* Queues row — the stuff admins actually need to act on */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Action queues
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            icon={FileCheck}
            label="Applications pending"
            value={kpis.appsPending}
            tone={kpis.appsPending > 0 ? 'warn' : 'neutral'}
            to="/internal/garagecollective/controlpanel/applications"
            loading={loading}
          />
          <ActionCard
            icon={Flag}
            label="Reports open"
            value={kpis.reportsOpen + kpis.reportsReviewing}
            tone={kpis.reportsOpen > 0 ? 'danger' : 'neutral'}
            to="/internal/garagecollective/controlpanel/reports"
            loading={loading}
          />
          <ActionCard
            icon={Users}
            label="Suspended / banned"
            value={kpis.suspendedUsers + kpis.bannedUsers}
            tone="neutral"
            to="/internal/garagecollective/controlpanel/users"
            loading={loading}
          />
          <ActionCard
            icon={LifeBuoy}
            label="Support + bugs open"
            value={kpis.supportOpen + kpis.bugsOpen}
            tone={kpis.supportOpen + kpis.bugsOpen > 0 ? 'warn' : 'neutral'}
            to="/internal/garagecollective/controlpanel/support"
            loading={loading}
          />
        </div>
      </section>

      {/* Intros */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Intros ({range}d)
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KPI label="Sent"             value={kpis.current.introsSent}     prior={kpis.prior.introsSent}     loading={loading} icon={Send} />
          <KPI label="Accepted"         value={kpis.current.introsAccepted} prior={kpis.prior.introsAccepted} loading={loading} tone="success" />
          <KPI label="Acceptance rate"  value={`${acceptanceRate}%`}        priorNumeric={priorAcceptanceRate} currentNumeric={acceptanceRate} loading={loading} />
          <KPI label="Stuck > 7d"       value={kpis.introsStuck}            loading={loading} tone={kpis.introsStuck > 0 ? 'warn' : 'neutral'} />
        </div>
      </section>

      {/* Platform */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Platform
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <KPI label="Active subscriptions"         value={kpis.activeSubs}            loading={loading} />
          <KPI label={`Apps approved ${range}d`}    value={kpis.current.appsApproved}  prior={kpis.prior.appsApproved} loading={loading} tone="success" />
          <KPI label="Reports reviewing"            value={kpis.reportsReviewing}      loading={loading} />
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
          Features
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <KPI label="Pipeline deals"   value={kpis.totalDeals}       loading={loading} />
          <KPI label="DD Checklists"     value={kpis.totalChecklists}  loading={loading} />
          {/* <KPI label="Term Sheets"       value={kpis.totalTermSheets}  loading={loading} /> */}{/* Term Sheets: DISABLED */}
          <KPI label="Deal Rooms"        value={kpis.totalDealRooms}   loading={loading} />
          <KPI label="CRM Contacts"      value={kpis.totalCRMContacts} loading={loading} />
        </div>
      </section>

      <ActivityFeed />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Activity feed — last 24h of notable events across the platform
// ────────────────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id:    string
  kind:  'signup' | 'app_submitted' | 'app_approved' | 'intro' | 'report' | 'scraper'
  when:  string
  title: string
  sub?:  string
  to?:   string
}

function ActivityFeed() {
  const [events, setEvents]   = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    const since = new Date(Date.now() - 86_400_000).toISOString()
    const [sign, apps, intros, reps, scrap] = await Promise.all([
      supabase.from('profiles')
        .select('id, email, first_name, last_name, created_at')
        .gte('created_at', since).order('created_at', { ascending: false }).limit(25),
      supabase.from('startup_applications')
        .select('id, company_name, status, submitted_at, reviewed_at')
        .or(`submitted_at.gte.${since},reviewed_at.gte.${since}`)
        .limit(50),
      supabase.from('introductions')
        .select('id, status, initiated_at, responded_at')
        .gte('initiated_at', since).order('initiated_at', { ascending: false }).limit(25),
      supabase.from('user_reports')
        .select('id, reason, created_at')
        .gte('created_at', since).order('created_at', { ascending: false }).limit(25),
      supabase.from('scraper_runs')
        .select('id, job, status, started_at, finished_at, error')
        .gte('started_at', since).order('started_at', { ascending: false }).limit(25),
    ])

    const out: ActivityEvent[] = []

    for (const p of (sign.data ?? []) as unknown as Array<{ id: string; email: string | null; first_name: string | null; last_name: string | null; created_at: string }>) {
      out.push({
        id: `signup-${p.id}`,
        kind: 'signup',
        when: p.created_at,
        title: `New signup: ${[p.first_name, p.last_name].filter(Boolean).join(' ') || p.email || p.id.slice(0, 8)}`,
        sub: p.email ?? undefined,
        to: '/internal/garagecollective/controlpanel/users',
      })
    }
    for (const a of (apps.data ?? []) as unknown as Array<{ id: string; company_name: string; status: string; submitted_at: string | null; reviewed_at: string | null }>) {
      if (a.submitted_at && a.submitted_at >= since) {
        out.push({
          id: `app-sub-${a.id}`,
          kind: 'app_submitted',
          when: a.submitted_at,
          title: `Application submitted: ${a.company_name}`,
          sub: a.status,
          to: '/internal/garagecollective/controlpanel/applications',
        })
      }
      if (a.reviewed_at && a.reviewed_at >= since && a.status === 'approved') {
        out.push({
          id: `app-app-${a.id}`,
          kind: 'app_approved',
          when: a.reviewed_at,
          title: `Application approved: ${a.company_name}`,
          to: '/internal/garagecollective/controlpanel/applications',
        })
      }
    }
    for (const i of (intros.data ?? []) as unknown as Array<{ id: string; status: string; initiated_at: string }>) {
      out.push({
        id: `intro-${i.id}`,
        kind: 'intro',
        when: i.initiated_at,
        title: `Intro ${i.status}`,
        sub: `id ${i.id.slice(0, 8)}…`,
        to: '/internal/garagecollective/controlpanel/intros',
      })
    }
    for (const r of (reps.data ?? []) as unknown as Array<{ id: string; reason: string; created_at: string }>) {
      out.push({
        id: `rep-${r.id}`,
        kind: 'report',
        when: r.created_at,
        title: `Report filed: ${r.reason}`,
        to: '/internal/garagecollective/controlpanel/reports',
      })
    }
    for (const s of (scrap.data ?? []) as unknown as Array<{ id: string; job: string; status: string; started_at: string; error: string | null }>) {
      out.push({
        id: `scr-${s.id}`,
        kind: 'scraper',
        when: s.started_at,
        title: `${s.job} ${s.status}`,
        sub: s.error ?? undefined,
        to: '/internal/garagecollective/controlpanel/monitoring',
      })
    }

    out.sort((a, b) => b.when.localeCompare(a.when))
    setEvents(out.slice(0, 50))
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { void load() }, [load])
  useTableRealtime(
    ['profiles', 'startup_applications', 'introductions', 'user_reports', 'scraper_runs'],
    () => void load(),
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
          Activity · last 24h
        </h2>
        <button type="button" onClick={() => void load()} disabled={refreshing}
          className="text-xs font-medium flex items-center gap-1.5 transition-colors"
          style={{ color: refreshing ? 'var(--muted-2)' : 'var(--blue)' }}>
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl p-6 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          Loading…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-6 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          Nothing has happened in the last 24 hours.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden divide-y"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderColor: 'var(--line)' }}>
          {events.map(e => <ActivityRow key={e.id} event={e} />)}
        </div>
      )}
    </section>
  )
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const meta = ACTIVITY_META[event.kind]
  const Icon = meta.icon
  const content = (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
      style={{ borderTop: '1px solid var(--line-2)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: meta.bg, color: meta.color }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: 'var(--ink)' }}>{event.title}</p>
        {event.sub && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{event.sub}</p>}
      </div>
      <p className="text-xs shrink-0" style={{ color: 'var(--muted-2)' }}>
        {relativeTime(event.when)}
      </p>
    </div>
  )
  return event.to ? <Link to={event.to}>{content}</Link> : content
}

const ACTIVITY_META: Record<ActivityEvent['kind'], { icon: React.ElementType; bg: string; color: string }> = {
  signup:         { icon: UserPlus,      bg: '#DBEAFE', color: 'var(--blue-h)' },
  app_submitted:  { icon: FileText,      bg: '#FEF3C7', color: '#B45309' },
  app_approved:   { icon: CheckCircle2,  bg: '#DCFCE7', color: 'var(--pos)' },
  intro:          { icon: Send,          bg: '#EDE9FE', color: '#6D28D9' },
  report:         { icon: Flag,          bg: '#FEE2E2', color: '#B91C1C' },
  scraper:        { icon: RefreshCw,     bg: 'var(--surface-2)', color: 'var(--muted)' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function RangePicker({ value, onChange }: { value: RangeDays; onChange: (v: RangeDays) => void }) {
  const options: RangeDays[] = [7, 14, 30, 90]
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      {options.map(d => (
        <button key={d} type="button" onClick={() => onChange(d)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: value === d ? 'var(--surface)' : 'transparent',
            color:      value === d ? 'var(--ink)' : 'var(--muted)',
            boxShadow:  value === d ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
          }}>
          {d}d
        </button>
      ))}
    </div>
  )
}

function KPI({
  label, value, prior, priorNumeric, currentNumeric, loading, tone = 'neutral', icon: Icon,
}: {
  label:           string
  value:           number | string
  prior?:          number
  // For composite metrics (like acceptance rate %) the display value is already
  // a formatted string; in that case we pass the numeric form separately so we
  // can still compute a delta.
  priorNumeric?:   number
  currentNumeric?: number
  loading:         boolean
  tone?:           'neutral' | 'accent' | 'success' | 'warn' | 'danger'
  icon?:           React.ElementType
}) {
  const tones: Record<string, string> = {
    neutral: 'var(--ink)',
    accent:  'var(--blue)',
    success: 'var(--pos)',
    warn:    '#B45309',
    danger:  '#B91C1C',
  }

  const current = currentNumeric ?? (typeof value === 'number' ? value : undefined)
  const previous = priorNumeric ?? prior
  const hasDelta = !loading && current != null && previous != null

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{label}</p>
        {Icon && <Icon className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />}
      </div>
      <p className="text-3xl font-bold mt-2" style={{ color: tones[tone], fontFamily: 'var(--font-display)' }}>
        {loading ? '…' : value}
      </p>
      {hasDelta && <DeltaPill current={current!} prior={previous!} />}
    </div>
  )
}

function DeltaPill({ current, prior }: { current: number; prior: number }) {
  if (prior === 0 && current === 0) {
    return (
      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold"
        style={{ color: 'var(--muted-2)' }}>
        <Minus className="w-3 h-3" /> no change · prior 0
      </span>
    )
  }
  const delta = prior === 0 ? 100 : Math.round(((current - prior) / prior) * 100)
  const sign = current > prior ? 'up' : current < prior ? 'down' : 'flat'
  const color = sign === 'up' ? 'var(--pos)' : sign === 'down' ? 'var(--neg)' : 'var(--muted-2)'
  const Icon  = sign === 'up' ? TrendingUp : sign === 'down' ? TrendingDown : Minus
  const label = prior === 0 ? `from 0` : `${delta > 0 ? '+' : ''}${delta}% vs prior`
  return (
    <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold"
      style={{ color }}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

function ActionCard({
  icon: Icon, label, value, tone, to, loading,
}: {
  icon: React.ElementType
  label: string
  value: number
  tone: 'neutral' | 'warn' | 'danger'
  to: string
  loading: boolean
}) {
  const toneBg: Record<string, string> = {
    neutral: '#F8FAFC',
    warn:    'var(--warn-bg)',
    danger:  'var(--neg-bg)',
  }
  const toneBorder: Record<string, string> = {
    neutral: 'var(--line)',
    warn:    'var(--warning-border)',
    danger:  'var(--danger-border)',
  }
  const toneColor: Record<string, string> = {
    neutral: 'var(--ink)',
    warn:    '#B45309',
    danger:  '#B91C1C',
  }
  return (
    <Link to={to}
      className="rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
      style={{ background: toneBg[tone], border: `1px solid ${toneBorder[tone]}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--surface)', border: `1px solid ${toneBorder[tone]}`, color: toneColor[tone] }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: toneColor[tone], fontFamily: 'var(--font-display)' }}>
          {loading ? '…' : value}
        </p>
      </div>
      <ArrowRight className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />
    </Link>
  )
}
