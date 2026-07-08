import { useCallback, useEffect, useState } from 'react'
import { Flag, Check, UserMinus, Ban, AlertTriangle, RefreshCw, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { downloadCSV, timestampedFilename, useRowSelection } from '@/app/lib/adminBulk'
import { SavedViews } from '@/app/components/SavedViews'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'

type StatusFilter = 'open' | 'reviewing' | 'actioned' | 'dismissed' | 'all'

interface ReportRow {
  id:          string
  reporter_id: string
  reported_id: string
  reason:      string
  detail:      string | null
  status:      string
  created_at:  string
  reviewed_at: string | null
  reviewer_id: string | null
  reporter?:   { email: string | null; first_name: string | null; last_name: string | null } | null
  reported?:   { email: string | null; first_name: string | null; last_name: string | null; role: string | null } | null
}

const REASON_LABEL: Record<string, string> = {
  spam:              'Spam / scam',
  harassment:        'Harassment',
  misrepresentation: 'Misrepresentation',
  inappropriate:     'Inappropriate',
  other:             'Other',
}

export function ReportsPage() {
  const [status, setStatus] = useState<StatusFilter>('open')
  const [rows, setRows]     = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const selection = useRowSelection(rows)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('user_reports')
      .select('id, reporter_id, reported_id, reason, detail, status, created_at, reviewed_at, reviewer_id')
      .order('created_at', { ascending: false })
      .limit(200)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }

    // user_reports FKs point at auth.users, not profiles, so PostgREST can't
    // embed the profile rows directly. Hydrate them in a second query.
    const base = (data ?? []) as ReportRow[]
    const ids = Array.from(new Set(base.flatMap(r => [r.reporter_id, r.reported_id]).filter(Boolean)))

    if (ids.length === 0) {
      setRows(base)
      setLoading(false)
      return
    }

    const { data: profs } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role')
      .in('id', ids)

    const byId = new Map<string, { email: string | null; first_name: string | null; last_name: string | null; role: string | null }>()
    for (const p of (profs ?? []) as Array<{ id: string; email: string | null; first_name: string | null; last_name: string | null; role: string | null }>) {
      byId.set(p.id, { email: p.email, first_name: p.first_name, last_name: p.last_name, role: p.role })
    }

    setRows(base.map(r => ({
      ...r,
      reporter: byId.get(r.reporter_id) ?? null,
      reported: byId.get(r.reported_id) ?? null,
    })))
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['user_reports'], () => void load())

  async function updateStatus(id: string, next: 'reviewing' | 'dismissed' | 'actioned') {
    const { data: { user } } = await supabase.auth.getUser()
    const patch: Record<string, unknown> = {
      status: next,
      reviewed_at: new Date().toISOString(),
      reviewer_id: user?.id,
    }
    const { error } = await supabase.from('user_reports').update(patch).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Report ${next}.`)
    void load()
  }

  async function bulkUpdate(next: 'reviewing' | 'dismissed' | 'actioned') {
    if (selection.count === 0) return
    if (!window.confirm(`Mark ${selection.count} report${selection.count === 1 ? '' : 's'} as "${next}"?`)) return
    setBulkBusy(next)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('user_reports')
      .update({
        status: next,
        reviewed_at: new Date().toISOString(),
        reviewer_id: user?.id,
      })
      .in('id', selection.selectedIds)
    setBulkBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${selection.count} report${selection.count === 1 ? '' : 's'} marked "${next}".`)
    selection.clear()
    void load()
  }

  function exportCSV() {
    downloadCSV(rows, [
      { header: 'id',            accessor: r => r.id },
      { header: 'reason',        accessor: r => r.reason },
      { header: 'detail',        accessor: r => r.detail },
      { header: 'status',        accessor: r => r.status },
      { header: 'submitted_at',  accessor: r => r.created_at },
      { header: 'reviewed_at',   accessor: r => r.reviewed_at },
      { header: 'reporter_id',   accessor: r => r.reporter_id },
      { header: 'reporter_email',accessor: r => r.reporter?.email },
      { header: 'reported_id',   accessor: r => r.reported_id },
      { header: 'reported_email',accessor: r => r.reported?.email },
      { header: 'reported_role', accessor: r => r.reported?.role },
    ], timestampedFilename('reports'))
    toast.success(`Exported ${rows.length} reports.`)
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Reports
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            User-submitted moderation reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusFilterBar value={status} onChange={setStatus} />
          <button type="button" onClick={exportCSV} disabled={rows.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: rows.length === 0 ? 'var(--faint)' : 'var(--ink)',
                     cursor: rows.length === 0 ? 'not-allowed' : 'pointer' }}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button type="button" onClick={() => void load()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="mb-4">
        <SavedViews<{ status: StatusFilter }>
          scope="reports"
          current={{ status }}
          onApply={f => { if (f.status !== undefined) setStatus(f.status as StatusFilter) }}
        />
      </div>

      {selection.count > 0 && (
        <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--ink)', color: 'var(--ink)' }}>
          <span className="text-sm"><strong>{selection.count}</strong> selected</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void bulkUpdate('reviewing')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--warn)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'reviewing' ? '…' : 'Mark reviewing'}
            </button>
            <button type="button" onClick={() => void bulkUpdate('dismissed')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--muted)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'dismissed' ? '…' : 'Dismiss'}
            </button>
            <button onClick={selection.clear} className="ml-1 flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--muted-2)' }}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full min-w-[780px] text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>
                <input
                  type="checkbox"
                  checked={selection.allSelected}
                  ref={el => { if (el) el.indeterminate = selection.someSelected }}
                  onChange={selection.toggleAll}
                  aria-label="Select all"
                />
              </Th>
              <Th>Reporter</Th>
              <Th>Reported user</Th>
              <Th>Reason</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center" style={{ color: 'var(--muted)' }}>
                <Flag className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
                No reports in this view.
              </td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selection.isSelected(r.id)}
                    onChange={() => selection.toggle(r.id)}
                    aria-label={`Select report ${r.id}`}
                  />
                </Td>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>
                    {[r.reporter?.first_name, r.reporter?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.reporter?.email ?? 'removed'}</p>
                </Td>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                    {[r.reported?.first_name, r.reported?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.reported?.email ?? '—'}</p>
                </Td>
                <Td>
                  <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                    {REASON_LABEL[r.reason] ?? r.reason}
                  </span>
                </Td>
                <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td>
                  <button type="button" onClick={() => setSelected(r)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
                    Review
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(next) => { void updateStatus(selected.id, next); setSelected(null) }}
          onActioned={() => { void updateStatus(selected.id, 'actioned'); setSelected(null) }}
        />
      )}
    </div>
  )
}

function StatusFilterBar({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const options: { v: StatusFilter; label: string }[] = [
    { v: 'open',      label: 'Open' },
    { v: 'reviewing', label: 'Reviewing' },
    { v: 'actioned',  label: 'Actioned' },
    { v: 'dismissed', label: 'Dismissed' },
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
          }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string }> = {
    open:      { bg: '#FEE2E2', color: '#B91C1C' },
    reviewing: { bg: '#FEF3C7', color: '#B45309' },
    actioned:  { bg: '#DCFCE7', color: 'var(--pos)' },
    dismissed: { bg: 'var(--surface-2)', color: 'var(--muted)' },
  }
  const t = tones[status] ?? tones.open
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {status}
    </span>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em]"
    style={{ color: 'var(--muted)' }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}

function ReportDrawer({ report, onClose, onStatusChange, onActioned }: {
  report: ReportRow
  onClose: () => void
  onStatusChange: (next: 'reviewing' | 'dismissed') => void
  onActioned: () => void
}) {
  const [priorCount, setPriorCount] = useState<number | null>(null)
  const [blocksCount, setBlocksCount] = useState<number | null>(null)
  const [working, setWorking] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadContext() {
      const [priorsRes, blocksRes] = await Promise.all([
        supabase.from('user_reports')
          .select('id', { count: 'exact', head: true })
          .eq('reported_id', report.reported_id)
          .neq('id', report.id),
        supabase.from('user_blocks')
          .select('blocker_id', { count: 'exact', head: true })
          .eq('blocked_id', report.reported_id),
      ])
      if (!mounted) return
      setPriorCount(priorsRes.count ?? 0)
      setBlocksCount(blocksRes.count ?? 0)
    }
    void loadContext()
    return () => { mounted = false }
  }, [report.id, report.reported_id])

  async function moderate(action: 'warn' | 'suspend' | 'ban') {
    const reason = window.prompt(`Reason for ${action}?`, report.detail ?? REASON_LABEL[report.reason] ?? report.reason)
    if (!reason) return
    setWorking(action)
    const extra: Record<string, unknown> = { reason }
    if (action === 'suspend') extra.days = 7
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { userId: report.reported_id, action, ...extra },
    })
    setWorking(null)
    if (error) {
      toast.error(error.message || `Failed to ${action}`)
      return
    }
    toast.success(`${action} applied, report marked actioned.`)
    onActioned()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto" onClick={e => e.stopPropagation()}
        style={{ borderLeft: '1px solid var(--line)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Report against {[report.reported?.first_name, report.reported?.last_name].filter(Boolean).join(' ') || report.reported?.email || 'user'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Submitted {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Prior reports</p>
              <p className="text-2xl font-semibold mt-0.5" style={{ color: priorCount && priorCount > 0 ? '#B91C1C' : 'var(--ink)' }}>
                {priorCount ?? '…'}
              </p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Times blocked</p>
              <p className="text-2xl font-semibold mt-0.5" style={{ color: 'var(--ink)' }}>{blocksCount ?? '…'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>Reason</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{REASON_LABEL[report.reason] ?? report.reason}</p>
          </div>

          {report.detail && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>Reporter detail</p>
              <div className="rounded-xl p-3 text-sm whitespace-pre-wrap"
                style={{ background: 'var(--warn-bg)', border: '1px solid #FDE68A', color: '#78350F' }}>
                {report.detail}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>Parties</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Reporter</span>
                <span style={{ color: 'var(--ink)' }}>{report.reporter?.email ?? 'removed'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Reported</span>
                <span style={{ color: 'var(--ink)' }}>
                  {report.reported?.email ?? '—'} <span style={{ color: 'var(--muted-2)' }}>({report.reported?.role ?? '—'})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>Resolve</p>
            <div className="flex gap-2">
              {report.status === 'open' && (
                <button type="button" onClick={() => onStatusChange('reviewing')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl"
                  style={{ background: 'var(--warn-bg)', color: '#B45309', border: '1px solid #FDE68A' }}>
                  <AlertTriangle className="w-4 h-4" /> Claim (reviewing)
                </button>
              )}
              <button type="button" onClick={() => onStatusChange('dismissed')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
                <Check className="w-4 h-4" /> Dismiss
              </button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>
              Moderate the reported user
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button type="button" disabled={!!working} onClick={() => void moderate('warn')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl"
                style={{ background: 'var(--warn-bg)', color: '#B45309', border: '1px solid #FDE68A', opacity: working ? 0.5 : 1 }}>
                <AlertTriangle className="w-4 h-4" /> {working === 'warn' ? '…' : 'Warn'}
              </button>
              <button type="button" disabled={!!working} onClick={() => void moderate('suspend')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl"
                style={{ background: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA', opacity: working ? 0.5 : 1 }}>
                <UserMinus className="w-4 h-4" /> {working === 'suspend' ? '…' : 'Suspend 7d'}
              </button>
              <button type="button" disabled={!!working} onClick={() => void moderate('ban')}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl"
                style={{ background: 'var(--neg-bg)', color: '#B91C1C', border: '1px solid #FECACA', opacity: working ? 0.5 : 1 }}>
                <Ban className="w-4 h-4" /> {working === 'ban' ? '…' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
