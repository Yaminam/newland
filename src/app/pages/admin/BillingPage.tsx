import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CreditCard, AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingUp, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { downloadCSV, timestampedFilename } from '@/app/lib/adminBulk'

// Approximate monthly price per plan, used to estimate MRR when Stripe price
// metadata isn't available on the local subscriptions row. Update this if you
// ship new plans.
const PLAN_PRICE_USD: Record<string, number> = {
  free:       0,
  starter:    19,
  pro:        49,
  enterprise: 299,
}

interface SubRow {
  id:                      string
  user_id:                 string | null
  stripe_customer_id:      string | null
  stripe_subscription_id:  string | null
  plan:                    string
  role:                    string | null
  status:                  string
  current_period_end:      string | null
  failed_payment_attempts: number | null
  suspended_at:            string | null
  created_at:              string
  updated_at:              string
}

interface ProfileLite {
  id:         string
  email:      string | null
  first_name: string | null
  last_name:  string | null
}

export function BillingPage() {
  const [rows, setRows]       = useState<SubRow[]>([])
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_customer_id, stripe_subscription_id, plan, role, status, current_period_end, failed_payment_attempts, suspended_at, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(500)
    if (error) { toast.error(error.message); setLoading(false); setRefreshing(false); return }
    const subs = (data ?? []) as SubRow[]
    setRows(subs)

    const uids = [...new Set(subs.map(r => r.user_id).filter((x): x is string => !!x))]
    if (uids.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', uids)
      const map = new Map<string, ProfileLite>()
      for (const p of (profs ?? []) as ProfileLite[]) map.set(p.id, p)
      setProfiles(map)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const stats = useMemo(() => computeStats(rows), [rows])

  const paymentIssueRows = useMemo(
    () =>
      rows
        .filter(r => (r.failed_payment_attempts ?? 0) > 0 || r.status === 'past_due' || r.suspended_at)
        .sort((a, b) => (b.failed_payment_attempts ?? 0) - (a.failed_payment_attempts ?? 0)),
    [rows],
  )

  const canceledRows = useMemo(
    () => rows.filter(r => r.status === 'canceled').slice(0, 20),
    [rows],
  )

  function exportCSV() {
    downloadCSV(rows, [
      { header: 'id',                     accessor: r => r.id },
      { header: 'user_email',             accessor: r => profiles.get(r.user_id ?? '')?.email },
      { header: 'user_name',              accessor: r => {
        const p = profiles.get(r.user_id ?? '')
        return p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : ''
      } },
      { header: 'plan',                   accessor: r => r.plan },
      { header: 'role',                   accessor: r => r.role },
      { header: 'status',                 accessor: r => r.status },
      { header: 'mrr_usd',                accessor: r => (r.status === 'active' || r.status === 'trialing') ? (PLAN_PRICE_USD[r.plan] ?? 0) : 0 },
      { header: 'failed_payment_attempts', accessor: r => r.failed_payment_attempts },
      { header: 'current_period_end',     accessor: r => r.current_period_end },
      { header: 'suspended_at',           accessor: r => r.suspended_at },
      { header: 'stripe_subscription_id', accessor: r => r.stripe_subscription_id },
      { header: 'created_at',             accessor: r => r.created_at },
      { header: 'updated_at',             accessor: r => r.updated_at },
    ], timestampedFilename('subscriptions'))
    toast.success(`Exported ${rows.length} subscriptions.`)
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Billing
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Subscription health snapshot. Revenue figures are approximations
            computed from plan price × active subscription — pull real numbers
            from Stripe for accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportCSV} disabled={rows.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: rows.length === 0 ? 'var(--faint)' : 'var(--ink)' }}>
            Export CSV
          </button>
          <button type="button" onClick={() => void load()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl text-center py-12" style={{ background: 'var(--surface)', border: '1px dashed var(--line)' }}>
          <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-2)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No subscription rows yet.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Est. MRR"
              value={`$${stats.mrr.toLocaleString()}`}
              hint={`${stats.mrrSources} paying subscriptions`}
              tone="accent"
              icon={TrendingUp}
            />
            <StatCard
              label="Active"
              value={stats.active}
              hint={`+ ${stats.trialing} trialing`}
              tone="good"
              icon={CheckCircle2}
            />
            <StatCard
              label="Payment issues"
              value={stats.paymentIssues}
              hint={stats.paymentIssues > 0 ? 'Needs follow-up' : 'All clear'}
              tone={stats.paymentIssues > 0 ? 'bad' : 'neutral'}
              icon={AlertTriangle}
            />
            <StatCard
              label="Canceled (30d)"
              value={stats.canceled30d}
              hint={`${stats.churnRate30d}% monthly churn`}
              tone={stats.canceled30d > 0 ? 'bad' : 'neutral'}
              icon={XCircle}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MiniCount label="Free"       n={stats.byPlan.free ?? 0} />
            <MiniCount label="Starter"    n={stats.byPlan.starter ?? 0} />
            <MiniCount label="Pro"        n={stats.byPlan.pro ?? 0} />
            <MiniCount label="Enterprise" n={stats.byPlan.enterprise ?? 0} />
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
              Payment issues
            </h2>
            {paymentIssueRows.length === 0 ? (
              <div className="rounded-2xl p-6 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                No failed payments or past-due subscriptions.
              </div>
            ) : (
              <SubTable rows={paymentIssueRows} profiles={profiles} highlight />
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
              Recent cancellations
            </h2>
            {canceledRows.length === 0 ? (
              <div className="rounded-2xl p-6 text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
                No canceled subscriptions yet.
              </div>
            ) : (
              <SubTable rows={canceledRows} profiles={profiles} />
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
              All subscriptions ({rows.length})
            </h2>
            <SubTable rows={rows} profiles={profiles} />
          </section>
        </>
      )}
    </div>
  )
}

function computeStats(rows: SubRow[]) {
  const now = Date.now()
  const DAY = 86_400_000
  const start30d = now - 30 * DAY

  let mrr = 0
  let mrrSources = 0
  let active = 0
  let trialing = 0
  let paymentIssues = 0
  let canceled30d = 0
  let totalExposed = 0 // active + canceled30d — denominator for churn
  const byPlan: Record<string, number> = {}

  for (const r of rows) {
    byPlan[r.plan] = (byPlan[r.plan] ?? 0) + 1

    if (r.status === 'active') {
      active++
      const price = PLAN_PRICE_USD[r.plan] ?? 0
      if (price > 0) { mrr += price; mrrSources++ }
    }
    if (r.status === 'trialing') {
      trialing++
      const price = PLAN_PRICE_USD[r.plan] ?? 0
      // Count trialing in MRR as a "potential" — optional, but useful for
      // direction. Comment out the next two lines to exclude trials.
      if (price > 0) { mrr += price; mrrSources++ }
    }
    if ((r.failed_payment_attempts ?? 0) > 0 || r.status === 'past_due' || r.suspended_at) {
      paymentIssues++
    }
    if (r.status === 'canceled' && new Date(r.updated_at).getTime() >= start30d) {
      canceled30d++
    }
  }

  totalExposed = active + canceled30d
  const churnRate30d = totalExposed > 0 ? Math.round((canceled30d / totalExposed) * 100) : 0

  return { mrr, mrrSources, active, trialing, paymentIssues, canceled30d, byPlan, churnRate30d }
}

function SubTable({ rows, profiles, highlight = false }: {
  rows: SubRow[]; profiles: Map<string, ProfileLite>; highlight?: boolean
}) {
  return (
    <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <table className="w-full min-w-[760px] text-sm">
        <thead style={{ background: 'var(--surface-2)' }}>
          <tr>
            <Th>User</Th>
            <Th>Plan</Th>
            <Th>Status</Th>
            <Th>Fails</Th>
            <Th>Current period end</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const p = r.user_id ? profiles.get(r.user_id) : undefined
            const rowBg = highlight ? 'var(--neg-bg)' : 'var(--surface)'
            return (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)', background: rowBg }}>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>
                    {p ? ([p.first_name, p.last_name].filter(Boolean).join(' ') || p.email) : '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{p?.email ?? r.user_id ?? '—'}</p>
                </Td>
                <Td>
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{ background: 'var(--blue-bg)', color: '#4338CA' }}>
                    {r.plan}
                  </span>
                </Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td>
                  {(r.failed_payment_attempts ?? 0) > 0 ? (
                    <span className="text-xs font-semibold" style={{ color: 'var(--neg)' }}>
                      {r.failed_payment_attempts}
                    </span>
                  ) : <span className="text-xs" style={{ color: 'var(--muted-2)' }}>0</span>}
                </Td>
                <Td className="text-xs" >{r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : '—'}</Td>
                <Td className="text-xs" >{new Date(r.updated_at).toLocaleDateString()}</Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
    active:       { bg: '#DCFCE7', color: 'var(--pos)', Icon: CheckCircle2 },
    trialing:     { bg: '#DBEAFE', color: 'var(--blue-h)', Icon: Clock },
    past_due:     { bg: '#FEF3C7', color: '#B45309', Icon: AlertTriangle },
    canceled:     { bg: 'var(--surface-2)', color: 'var(--muted)', Icon: XCircle },
    unpaid:       { bg: '#FEE2E2', color: '#B91C1C', Icon: XCircle },
    incomplete:   { bg: '#FEF3C7', color: '#B45309', Icon: Clock },
  }
  const t = tones[status] ?? { bg: 'var(--surface-2)', color: 'var(--muted)', Icon: Clock }
  const Icon = t.Icon
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: t.bg, color: t.color }}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
    </span>
  )
}

function StatCard({ label, value, hint, tone, icon: Icon }: {
  label: string; value: string | number; hint?: string;
  tone: 'neutral' | 'good' | 'bad' | 'accent';
  icon: React.ElementType
}) {
  const color = tone === 'good' ? 'var(--pos)' : tone === 'bad' ? 'var(--neg)' : tone === 'accent' ? 'var(--blue)' : 'var(--ink)'
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.1em] font-semibold" style={{ color: 'var(--muted)' }}>{label}</p>
        <Icon className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />
      </div>
      <p className="text-2xl font-semibold mt-2" style={{ color, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--muted-2)' }}>{hint}</p>}
    </div>
  )
}

function MiniCount({ label, n }: { label: string; n: number }) {
  return (
    <div className="rounded-xl p-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <p className="text-xs uppercase tracking-[0.1em] font-semibold" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-lg font-bold mt-1" style={{ color: 'var(--ink)' }}>{n}</p>
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.05em]"
      style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  )
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}
