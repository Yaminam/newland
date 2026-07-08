import { useCallback, useEffect, useState } from 'react'
import { Clock, X, Check, Send, Trash2, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type Status = 'pending' | 'accepted' | 'declined' | 'expired' | 'completed' | 'all'

interface IntroRow {
  id:              string
  status:          string
  message:         string | null
  connector_name:  string | null
  connector_role:  string | null
  connection_type: string | null
  decline_reason:  string | null
  initiated_at:    string | null
  responded_at:    string | null
  expires_at:      string | null
  initiated_by:    string | null
  investor_id:     string | null
  startup_id:      string | null
  startup?:  { id: string; company_name: string | null; founder_id: string | null } | null
  investor?: { id: string; first_name: string | null; last_name: string | null; email: string | null } | null
}

export function IntrosPage() {
  const [status, setStatus]     = useState<Status>('pending')
  const [rows, setRows]         = useState<IntroRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<IntroRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('introductions')
      .select(`
        id, status, message, connector_name, connector_role, connection_type,
        decline_reason, initiated_at, responded_at, expires_at, initiated_by,
        investor_id, startup_id,
        startup:startup_applications!introductions_startup_id_fkey ( id, company_name, founder_id ),
        investor:profiles!introductions_investor_id_fkey ( id, first_name, last_name, email )
      `)
      .order('initiated_at', { ascending: false, nullsFirst: false })
      .limit(200)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as IntroRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])

  // Stuck pending (initiated_at < now-7d, still pending) highlight count
  const stuckCount = rows.filter(r =>
    r.status === 'pending' &&
    r.initiated_at &&
    Date.now() - new Date(r.initiated_at).getTime() > 7 * 86_400_000,
  ).length

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Intros
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Monitor introduction requests, unstick lingering ones, and fix edge cases.
            {stuckCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded"
                style={{ background: 'var(--warn-bg)', color: '#B45309' }}>
                <Clock className="w-3 h-3" /> {stuckCount} stuck &gt; 7d
              </span>
            )}
          </p>
        </div>
        <StatusFilter value={status} onChange={setStatus} />
      </header>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>Startup</Th>
              <Th>Investor</Th>
              <Th>Initiated</Th>
              <Th>Status</Th>
              <Th>Sent</Th>
              <Th>Expires</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No introductions in this view.</td></tr>
            ) : rows.map(r => {
              const stuck =
                r.status === 'pending' &&
                r.initiated_at &&
                Date.now() - new Date(r.initiated_at).getTime() > 7 * 86_400_000
              return (
                <tr key={r.id} style={{
                  borderTop: '1px solid var(--line)',
                  background: stuck ? 'var(--warn-bg)' : undefined,
                }}>
                  <Td>
                    <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                      {r.startup?.company_name ?? '—'}
                    </p>
                  </Td>
                  <Td>
                    <p style={{ color: 'var(--ink)' }}>
                      {[r.investor?.first_name, r.investor?.last_name].filter(Boolean).join(' ') || '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.investor?.email ?? '—'}</p>
                  </Td>
                  <Td>
                    <InitiatorPill who={r.initiated_by} />
                  </Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td>{r.initiated_at ? new Date(r.initiated_at).toLocaleDateString() : '—'}</Td>
                  <Td>{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : '—'}</Td>
                  <Td>
                    <button type="button" onClick={() => setSelected(r)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
                      Manage
                    </button>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <ManageDrawer
          intro={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load() }}
        />
      )}
    </div>
  )
}

function ManageDrawer({ intro, onClose, onDone }: {
  intro: IntroRow
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason]   = useState(intro.decline_reason ?? '')
  const [days, setDays]       = useState(7)
  const [working, setWorking] = useState<string | null>(null)

  async function act(action: 'force_expire' | 'force_accept' | 'force_decline' | 'extend' | 'resend_email' | 'delete') {
    if (action === 'delete') {
      if (!window.confirm('Delete this introduction permanently? This cannot be undone.')) return
    }
    setWorking(action)
    const { error } = await supabase.functions.invoke('admin-intro-action', {
      body: {
        introId: intro.id,
        action,
        reason: reason.trim() || undefined,
        days,
      },
    })
    setWorking(null)
    if (error) {
      toast.error(error.message || `Failed to ${action}`)
      return
    }
    toast.success(`Intro ${action.replace('_', ' ')} — done.`)
    onDone()
  }

  const pending = intro.status === 'pending'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {intro.startup?.company_name ?? 'Introduction'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {[intro.investor?.first_name, intro.investor?.last_name].filter(Boolean).join(' ') || intro.investor?.email || '—'}
              </p>
              <div className="mt-3 flex gap-2">
                <StatusPill status={intro.status} />
                <InitiatorPill who={intro.initiated_by} />
              </div>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Timeline">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Initiated" value={intro.initiated_at ? new Date(intro.initiated_at).toLocaleString() : '—'} />
              <Field label="Responded" value={intro.responded_at ? new Date(intro.responded_at).toLocaleString() : '—'} />
              <Field label="Expires"   value={intro.expires_at   ? new Date(intro.expires_at).toLocaleString()   : '—'} />
              <Field label="Connection" value={intro.connection_type ?? '—'} />
            </dl>
          </Section>

          {intro.message && (
            <Section title="Message">
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{intro.message}</p>
            </Section>
          )}

          {(intro.connector_name || intro.connector_role) && (
            <Section title="Connector">
              <p className="text-sm" style={{ color: 'var(--ink)' }}>
                {intro.connector_name ?? '—'}
                {intro.connector_role ? ` — ${intro.connector_role}` : ''}
              </p>
            </Section>
          )}

          {intro.decline_reason && (
            <Section title="Decline reason">
              <p className="text-sm" style={{ color: '#B91C1C' }}>{intro.decline_reason}</p>
            </Section>
          )}

          <Section title="Admin notes (sent with force actions)">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. founder is responsive by email but hasn't logged in"
              rows={3}
              className="w-full rounded-lg p-3 text-sm"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
            />
          </Section>

          {pending && (
            <Section title="Actions">
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <ActionBtn
                    label="Force accept"
                    icon={Check}
                    tone="success"
                    busy={working === 'force_accept'}
                    onClick={() => act('force_accept')}
                  />
                  <ActionBtn
                    label="Force decline"
                    icon={X}
                    tone="danger"
                    busy={working === 'force_decline'}
                    onClick={() => act('force_decline')}
                  />
                  <ActionBtn
                    label="Force expire"
                    icon={Clock}
                    tone="warn"
                    busy={working === 'force_expire'}
                    onClick={() => act('force_expire')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={e => setDays(Number(e.target.value) || 7)}
                    className="w-20 px-2 py-1.5 rounded-lg text-sm"
                    style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
                  />
                  <ActionBtn
                    label={`Extend ${days}d`}
                    icon={Timer}
                    tone="neutral"
                    busy={working === 'extend'}
                    onClick={() => act('extend')}
                  />
                  <ActionBtn
                    label="Resend email"
                    icon={Send}
                    tone="neutral"
                    busy={working === 'resend_email'}
                    onClick={() => act('resend_email')}
                  />
                </div>
              </div>
            </Section>
          )}

          <Section title="Danger zone">
            <ActionBtn
              label="Delete intro"
              icon={Trash2}
              tone="danger"
              busy={working === 'delete'}
              onClick={() => act('delete')}
            />
          </Section>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ label, icon: Icon, tone, busy, onClick }: {
  label: string
  icon: React.ElementType
  tone: 'success' | 'danger' | 'warn' | 'neutral'
  busy: boolean
  onClick: () => void
}) {
  const palette: Record<string, { bg: string; color: string; border: string }> = {
    success: { bg: '#DCFCE7', color: 'var(--pos)', border: '#86EFAC' },
    danger:  { bg: '#FEE2E2', color: '#B91C1C', border: 'var(--danger-border)' },
    warn:    { bg: '#FEF3C7', color: '#B45309', border: 'var(--warning-border)' },
    neutral: { bg: 'var(--surface-2)', color: 'var(--ink)', border: 'var(--line)' },
  }
  const p = palette[tone]
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
      style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}
    >
      <Icon className="w-3.5 h-3.5" />
      {busy ? 'Working…' : label}
    </button>
  )
}

function StatusFilter({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const options: { v: Status; label: string }[] = [
    { v: 'pending',   label: 'Pending' },
    { v: 'accepted',  label: 'Accepted' },
    { v: 'declined',  label: 'Declined' },
    { v: 'expired',   label: 'Expired' },
    { v: 'completed', label: 'Completed' },
    { v: 'all',       label: 'All' },
  ]
  return (
    <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: value === o.v ? 'var(--surface)' : 'transparent',
            color:      value === o.v ? 'var(--ink)' : 'var(--muted)',
            boxShadow:  value === o.v ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
          }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#FEF3C7', color: '#B45309' },
    accepted:  { bg: '#DCFCE7', color: 'var(--pos)' },
    declined:  { bg: '#FEE2E2', color: '#B91C1C' },
    expired:   { bg: 'var(--line)', color: 'var(--muted)' },
    completed: { bg: '#DBEAFE', color: 'var(--blue-h)' },
  }
  const t = tones[status] ?? { bg: 'var(--surface-2)', color: 'var(--muted)' }
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {status}
    </span>
  )
}

function InitiatorPill({ who }: { who: string | null }) {
  if (!who) return <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: 'var(--blue-bg)', color: '#4338CA' }}>
      by {who}
    </span>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em]"
      style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  )
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs" style={{ color: 'var(--muted)' }}>{label}</dt>
      <dd className="text-sm mt-0.5" style={{ color: 'var(--ink)' }}>{value}</dd>
    </div>
  )
}
