import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, MessageSquareWarning, FileText, ExternalLink, Download, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { downloadCSV, timestampedFilename, useRowSelection } from '@/app/lib/adminBulk'
import { SavedViews } from '@/app/components/SavedViews'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'
import { compactNumber } from '@/app/lib/utils'

type Status = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'all'

interface AppRow {
  id:              string
  company_name:    string
  sector:          string | null
  stage:           string | null
  funding_ask_usd: number | null
  status:          string
  submitted_at:    string | null
  founder_id:      string | null
  description:     string | null
  tagline:         string | null
  deck_path:       string | null
  pitch_video_url: string | null
  admin_notes:     string | null
  trust_badge:     string | null
  founder?: { email: string | null; first_name: string | null; last_name: string | null } | null
}

type AppType = 'founders' | 'investors' | 'incubation'

interface IncubationAppRow {
  id:               string
  owner_id:         string | null
  name:             string
  incubation_type:  string | null
  description:      string | null
  website_url:      string | null
  linkedin_url:     string | null
  location:         string | null
  city:             string | null
  country:          string | null
  sectors:          string[] | null
  cohort_size:      number | null
  is_verified:      boolean
  status:           string
  admin_notes:      string | null
  created_at:       string | null
  owner?: { email: string | null; first_name: string | null; last_name: string | null } | null
}

interface InvestorAppRow {
  id:               string
  fund_name:        string | null
  title:            string | null
  bio:              string | null
  sectors:          string[] | null
  stage_preference: string[] | null
  geography:        string[] | null
  ticket_size_min:  number | null
  ticket_size_max:  number | null
  investment_thesis: string | null
  location:         string | null
  linkedin_url:     string | null
  website_url:      string | null
  portfolio_count:  number | null
  status:           string
  admin_notes:      string | null
  submitted_at:     string | null
  investor_id:      string | null
  investor?: { email: string | null; first_name: string | null; last_name: string | null } | null
}

export function ApplicationsPage() {
  const [appType, setAppType] = useState<AppType>('founders')

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Applications
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Review founder, investor, and incubation applications.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {([
          ['founders',   'Founder Applications'],
          ['investors',  'Investor Applications'],
          ['incubation', 'Incubation Applications'],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setAppType(key)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: appType === key ? 'var(--surface)' : 'transparent',
              color:      appType === key ? 'var(--ink)' : 'var(--muted)',
              boxShadow:  appType === key ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {appType === 'founders'   && <FounderApplicationsTab />}
      {appType === 'investors'  && <InvestorApplicationsTab />}
      {appType === 'incubation' && <IncubationApplicationsTab />}
    </div>
  )
}

// ─── Investor Applications Tab ─────────────────────────────────────

function InvestorApplicationsTab() {
  const [status, setStatus]     = useState<Status>('submitted')
  const [rows, setRows]         = useState<InvestorAppRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<InvestorAppRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('investor_applications')
      .select(`
        id, fund_name, title, bio, sectors, stage_preference, geography,
        ticket_size_min, ticket_size_max, investment_thesis, location,
        linkedin_url, website_url, portfolio_count, status, admin_notes, submitted_at, investor_id,
        investor:profiles!investor_applications_investor_id_fkey ( email, first_name, last_name )
      `)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(200)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as InvestorAppRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['investor_applications'], () => void load())

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <StatusFilter value={status} onChange={setStatus} />
      </div>

      <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full min-w-[760px] text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>Fund / Investor</Th>
              <Th>Email</Th>
              <Th>Sectors</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No investor applications in this view.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.fund_name ?? r.title ?? '(no name)'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {[r.investor?.first_name, r.investor?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                </Td>
                <Td>{r.investor?.email ?? '—'}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(r.sectors ?? []).slice(0, 3).map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{s}</span>
                    ))}
                    {r.sectors && r.sectors.length > 3 && (
                      <span className="text-xs" style={{ color: 'var(--muted-2)' }}>+{r.sectors.length - 3}</span>
                    )}
                  </div>
                </Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</Td>
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
        <InvestorReviewDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load() }}
        />
      )}
    </>
  )
}

function InvestorReviewDrawer({ app, onClose, onDone }: {
  app: InvestorAppRow
  onClose: () => void
  onDone: () => void
}) {
  const [notes, setNotes]     = useState(app.admin_notes ?? '')
  const [working, setWorking] = useState<null | 'approve' | 'reject' | 'request_info'>(null)

  async function act(action: 'approve' | 'reject' | 'request_info') {
    if ((action === 'reject' || action === 'request_info') && !notes.trim()) {
      toast.error('Please provide notes explaining the decision.')
      return
    }
    setWorking(action)
    const { error } = await supabase.functions.invoke('admin-review-investor', {
      body: { applicationId: app.id, action, notes: notes.trim() || undefined },
    })
    setWorking(null)
    if (error) {
      toast.error(error.message || `Failed to ${action}`)
      return
    }
    toast.success(action === 'approve' ? 'Investor approved.' : action === 'reject' ? 'Investor rejected.' : 'More info requested.')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div
        className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {app.fund_name ?? app.title ?? 'Investor Application'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                {[app.investor?.first_name, app.investor?.last_name].filter(Boolean).join(' ') || app.investor?.email || '—'}
              </p>
              <div className="mt-3"><StatusPill status={app.status} /></div>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Investor Info">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Title"     value={app.title ?? '—'} />
              <Field label="Location"  value={app.location ?? '—'} />
              <Field label="Min Check" value={app.ticket_size_min ? `$${Number(app.ticket_size_min).toLocaleString()}` : '—'} />
              <Field label="Max Check" value={app.ticket_size_max ? `$${Number(app.ticket_size_max).toLocaleString()}` : '—'} />
              <Field label="Portfolio" value={app.portfolio_count ? String(app.portfolio_count) : '—'} />
            </dl>
          </Section>

          <Section title="Sectors">
            <div className="flex flex-wrap gap-1.5">
              {(app.sectors ?? []).length > 0
                ? app.sectors!.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{s}</span>
                  ))
                : <span style={{ color: 'var(--muted-2)' }}>—</span>
              }
            </div>
          </Section>

          <Section title="Stage Preference">
            <div className="flex flex-wrap gap-1.5">
              {(app.stage_preference ?? []).length > 0
                ? app.stage_preference!.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{s}</span>
                  ))
                : <span style={{ color: 'var(--muted-2)' }}>—</span>
              }
            </div>
          </Section>

          <Section title="Investment Thesis">
            <p className="text-sm whitespace-pre-wrap leading-6" style={{ color: 'var(--muted)' }}>
              {app.investment_thesis ?? '—'}
            </p>
          </Section>

          <Section title="Bio">
            <p className="text-sm whitespace-pre-wrap leading-6" style={{ color: 'var(--muted)' }}>
              {app.bio ?? '—'}
            </p>
          </Section>

          {(app.linkedin_url || app.website_url) && (
            <Section title="Links">
              <div className="flex flex-col gap-1 text-sm">
                {app.linkedin_url && (
                  <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--blue)' }}>
                    LinkedIn
                  </a>
                )}
                {app.website_url && (
                  <a href={app.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--blue)' }}>
                    Website
                  </a>
                )}
              </div>
            </Section>
          )}

          <Section title="Admin notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Why was this approved/rejected? Required for reject or re-request."
              className="w-full rounded-xl px-3 py-2 text-sm outline-0 resize-none"
              style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </Section>

          <div className="flex gap-2 pt-2">
            <ActionButton label="Approve" icon={CheckCircle}
              tone="success" disabled={!!working} loading={working === 'approve'}
              onClick={() => act('approve')} />
            <ActionButton label="Reject" icon={XCircle}
              tone="danger" disabled={!!working} loading={working === 'reject'}
              onClick={() => act('reject')} />
            <ActionButton label="Request info" icon={MessageSquareWarning}
              tone="warn" disabled={!!working} loading={working === 'request_info'}
              onClick={() => act('request_info')} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Incubation Applications Tab ──────────────────────────────────

function IncubationApplicationsTab() {
  const [status, setStatus]     = useState<Status>('submitted')
  const [rows, setRows]         = useState<IncubationAppRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<IncubationAppRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const selection = useRowSelection(rows)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('incubation_profiles')
      .select(`
        id, owner_id, name, incubation_type, description, website_url, linkedin_url,
        location, city, country, sectors, cohort_size, is_verified, status, admin_notes, created_at,
        owner:profiles!incubation_profiles_owner_id_fkey ( email, first_name, last_name )
      `)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(200)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as IncubationAppRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['incubation_profiles'], () => void load())

  async function bulkReview(action: 'approve' | 'reject') {
    if (selection.count === 0) return
    let notes: string | null = null
    if (action === 'reject') {
      notes = window.prompt(`Rejection reason for ${selection.count} incubation(s)?`)
      if (!notes) return
    }
    if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} ${selection.count} incubation${selection.count === 1 ? '' : 's'}?`)) return

    setBulkBusy(action)
    let ok = 0, failed = 0
    for (const row of selection.selectedRows) {
      const updates: Record<string, unknown> = action === 'approve'
        ? { status: 'approved', is_verified: true, verified_at: new Date().toISOString(), admin_notes: notes ?? undefined }
        : { status: 'rejected', admin_notes: notes ?? undefined }
      const { error } = await supabase.from('incubation_profiles').update(updates).eq('id', row.id)
      if (error) { failed++; continue }
      if (action === 'approve' && row.owner_id) {
        await supabase.from('profiles').update({ profile_approved: true }).eq('id', row.owner_id)
      }
      ok++
    }
    setBulkBusy(null)
    toast[failed === 0 ? 'success' : 'error'](`Bulk ${action}: ${ok} succeeded, ${failed} failed.`)
    selection.clear()
    void load()
  }

  function exportCSV() {
    downloadCSV(rows, [
      { header: 'id',              accessor: r => r.id },
      { header: 'name',            accessor: r => r.name },
      { header: 'incubation_type', accessor: r => r.incubation_type },
      { header: 'city',            accessor: r => r.city },
      { header: 'country',         accessor: r => r.country },
      { header: 'sectors',         accessor: r => (r.sectors ?? []).join(', ') },
      { header: 'cohort_size',     accessor: r => r.cohort_size },
      { header: 'status',          accessor: r => r.status },
      { header: 'created_at',      accessor: r => r.created_at },
      { header: 'owner_email',     accessor: r => r.owner?.email },
      { header: 'owner_name',      accessor: r => [r.owner?.first_name, r.owner?.last_name].filter(Boolean).join(' ') },
      { header: 'admin_notes',     accessor: r => r.admin_notes },
    ], timestampedFilename('incubation-applications'))
    toast.success(`Exported ${rows.length} incubation applications.`)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <StatusFilter value={status} onChange={setStatus} />
          <button type="button" onClick={exportCSV} disabled={rows.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)',
                     color: rows.length === 0 ? 'var(--faint)' : 'var(--ink)',
                     cursor: rows.length === 0 ? 'not-allowed' : 'pointer' }}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {selection.count > 0 && (
        <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--ink)', color: 'var(--ink)' }}>
          <span className="text-sm text-white"><strong>{selection.count}</strong> selected</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void bulkReview('approve')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--pos)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'approve' ? 'Approving…' : 'Approve all'}
            </button>
            <button type="button" onClick={() => void bulkReview('reject')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--neg)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'reject' ? 'Rejecting…' : 'Reject all'}
            </button>
            <button onClick={selection.clear} className="ml-1 flex items-center gap-1 text-xs font-semibold text-white"
              style={{ color: 'var(--muted-2)' }}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full min-w-[860px] text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>
                <input type="checkbox" checked={selection.allSelected}
                  ref={el => { if (el) el.indeterminate = selection.someSelected }}
                  onChange={selection.toggleAll} aria-label="Select all" />
              </Th>
              <Th>Organisation</Th>
              <Th>Owner</Th>
              <Th>Type / Location</Th>
              <Th>Sectors</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No incubation applications in this view.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <input type="checkbox" checked={selection.isSelected(r.id)}
                    onChange={() => selection.toggle(r.id)} aria-label={`Select ${r.name}`} />
                </Td>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>{r.description ?? '—'}</p>
                </Td>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>
                    {[r.owner?.first_name, r.owner?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.owner?.email ?? '—'}</p>
                </Td>
                <Td>
                  <p className="capitalize" style={{ color: 'var(--ink)' }}>{r.incubation_type ?? '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {[r.city, r.country].filter(Boolean).join(', ') || r.location || '—'}
                  </p>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(r.sectors ?? []).slice(0, 2).map(s => (
                      <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{s}</span>
                    ))}
                    {r.sectors && r.sectors.length > 2 && (
                      <span className="text-xs" style={{ color: 'var(--muted-2)' }}>+{r.sectors.length - 2}</span>
                    )}
                  </div>
                </Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</Td>
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
        <IncubationReviewDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load() }}
        />
      )}
    </>
  )
}

function IncubationReviewDrawer({ app, onClose, onDone }: {
  app:     IncubationAppRow
  onClose: () => void
  onDone:  () => void
}) {
  const [notes, setNotes]     = useState(app.admin_notes ?? '')
  const [working, setWorking] = useState<null | 'approve' | 'reject' | 'request_info'>(null)

  async function act(action: 'approve' | 'reject' | 'request_info') {
    if ((action === 'reject' || action === 'request_info') && !notes.trim()) {
      toast.error('Please provide notes explaining the decision.')
      return
    }
    setWorking(action)
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('incubation_profiles')
          .update({ status: 'approved', is_verified: true, verified_at: new Date().toISOString(), admin_notes: notes.trim() || null })
          .eq('id', app.id)
        if (error) throw error
        if (app.owner_id) {
          await supabase.from('profiles').update({ profile_approved: true }).eq('id', app.owner_id)
        }
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('incubation_profiles')
          .update({ status: 'rejected', is_verified: false, admin_notes: notes.trim() || null })
          .eq('id', app.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('incubation_profiles')
          .update({ status: 'under_review', admin_notes: notes.trim() || null })
          .eq('id', app.id)
        if (error) throw error
      }
      toast.success(
        action === 'approve'      ? 'Incubation approved & verified.' :
        action === 'reject'       ? 'Incubation rejected.'            :
                                    'More info requested.'
      )
      onDone()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`)
    } finally {
      setWorking(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div
        className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {app.name}
              </h2>
              <p className="text-sm mt-0.5 capitalize" style={{ color: 'var(--muted)' }}>
                {app.incubation_type ?? 'Incubation'}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                {[app.owner?.first_name, app.owner?.last_name].filter(Boolean).join(' ') || app.owner?.email || '—'}
              </p>
              <div className="mt-3"><StatusPill status={app.status} /></div>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Owner">
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              {[app.owner?.first_name, app.owner?.last_name].filter(Boolean).join(' ') || '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{app.owner?.email ?? '—'}</p>
          </Section>

          <Section title="Organisation">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Type"        value={app.incubation_type ?? '—'} />
              <Field label="Cohort size" value={app.cohort_size ? String(app.cohort_size) : '—'} />
              <Field label="City"        value={app.city ?? '—'} />
              <Field label="Country"     value={app.country ?? '—'} />
              {app.location && <Field label="Full location" value={app.location} />}
            </dl>
          </Section>

          <Section title="Description">
            <p className="text-sm whitespace-pre-wrap leading-6" style={{ color: 'var(--muted)' }}>
              {app.description ?? '—'}
            </p>
          </Section>

          <Section title="Sectors">
            <div className="flex flex-wrap gap-1.5">
              {(app.sectors ?? []).length > 0
                ? app.sectors!.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>{s}</span>
                  ))
                : <span style={{ color: 'var(--muted-2)' }}>—</span>
              }
            </div>
          </Section>

          {(app.website_url || app.linkedin_url) && (
            <Section title="Links">
              <div className="flex flex-col gap-1 text-sm">
                {app.linkedin_url && (
                  <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--blue)' }}>
                    <ExternalLink className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {app.website_url && (
                  <a href={app.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--blue)' }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </Section>
          )}

          <Section title="Admin notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Why was this approved/rejected? Required for reject or request info."
              className="w-full rounded-xl px-3 py-2 text-sm outline-0 resize-none"
              style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </Section>

          <div className="flex gap-2 pt-2">
            <ActionButton label="Approve" icon={CheckCircle}
              tone="success" disabled={!!working} loading={working === 'approve'}
              onClick={() => act('approve')} />
            <ActionButton label="Reject" icon={XCircle}
              tone="danger" disabled={!!working} loading={working === 'reject'}
              onClick={() => act('reject')} />
            <ActionButton label="Request info" icon={MessageSquareWarning}
              tone="warn" disabled={!!working} loading={working === 'request_info'}
              onClick={() => act('request_info')} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Founder Applications Tab ──────────────────────────────────────

function FounderApplicationsTab() {
  const [status, setStatus]     = useState<Status>('submitted')
  const [rows, setRows]         = useState<AppRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<AppRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const selection = useRowSelection(rows)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('startup_applications')
      .select(`
        id, company_name, sector, stage, funding_ask_usd, status, submitted_at,
        founder_id, description, tagline, deck_path, pitch_video_url, admin_notes, trust_badge,
        founder:profiles!startup_applications_founder_id_fkey ( email, first_name, last_name )
      `)
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(200)

    if (status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as AppRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['startup_applications'], () => void load())

  async function bulkReview(action: 'approve' | 'reject') {
    if (selection.count === 0) return
    let notes: string | null = null
    if (action === 'reject') {
      notes = window.prompt(`Rejection reason for ${selection.count} applications?`)
      if (!notes) return
    }
    if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Reject'} ${selection.count} application${selection.count === 1 ? '' : 's'}? Audit-logged per application.`)) return

    setBulkBusy(action)
    let ok = 0, failed = 0
    for (const app of selection.selectedRows) {
      const { error } = await supabase.functions.invoke('admin-review-application', {
        body: { applicationId: app.id, action, notes: notes ?? undefined },
      })
      if (error) failed++; else ok++
    }
    setBulkBusy(null)
    toast[failed === 0 ? 'success' : 'error'](`Bulk ${action}: ${ok} succeeded, ${failed} failed.`)
    selection.clear()
    void load()
  }

  function exportCSV() {
    downloadCSV(rows, [
      { header: 'id',              accessor: r => r.id },
      { header: 'company_name',    accessor: r => r.company_name },
      { header: 'sector',          accessor: r => r.sector },
      { header: 'stage',           accessor: r => r.stage },
      { header: 'funding_ask_usd', accessor: r => r.funding_ask_usd },
      { header: 'status',          accessor: r => r.status },
      { header: 'submitted_at',    accessor: r => r.submitted_at },
      { header: 'founder_email',   accessor: r => r.founder?.email },
      { header: 'founder_name',    accessor: r => [r.founder?.first_name, r.founder?.last_name].filter(Boolean).join(' ') },
      { header: 'trust_badge',     accessor: r => r.trust_badge },
      { header: 'admin_notes',     accessor: r => r.admin_notes },
    ], timestampedFilename('applications'))
    toast.success(`Exported ${rows.length} applications.`)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <StatusFilter value={status} onChange={setStatus} />
          <button type="button" onClick={exportCSV} disabled={rows.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: rows.length === 0 ? 'var(--faint)' : 'var(--ink)',
                     cursor: rows.length === 0 ? 'not-allowed' : 'pointer' }}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SavedViews<{ status: Status }>
          scope="applications"
          current={{ status }}
          onApply={f => { if (f.status !== undefined) setStatus(f.status as Status) }}
        />
      </div>

      {selection.count > 0 && (
        <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--ink)', color: 'var(--ink)' }}>
          <span className="text-sm"><strong>{selection.count}</strong> selected</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void bulkReview('approve')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--pos)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'approve' ? 'Approving…' : 'Approve all'}
            </button>
            <button type="button" onClick={() => void bulkReview('reject')} disabled={!!bulkBusy}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--neg)', color: 'var(--surface)', opacity: bulkBusy ? 0.6 : 1 }}>
              {bulkBusy === 'reject' ? 'Rejecting…' : 'Reject all'}
            </button>
            <button onClick={selection.clear} className="ml-1 flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--muted-2)' }}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full min-w-[860px] text-sm">
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
              <Th>Company</Th>
              <Th>Founder</Th>
              <Th>Sector / Stage</Th>
              <Th>Ask</Th>
              <Th>Status</Th>
              <Th>Submitted</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No applications in this view.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selection.isSelected(r.id)}
                    onChange={() => selection.toggle(r.id)}
                    aria-label={`Select ${r.company_name}`}
                  />
                </Td>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.company_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.tagline ?? '—'}</p>
                </Td>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>
                    {[r.founder?.first_name, r.founder?.last_name].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.founder?.email ?? '—'}</p>
                </Td>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>{r.sector ?? '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.stage ?? '—'}</p>
                </Td>
                <Td>{r.funding_ask_usd ? compactNumber(r.funding_ask_usd) : '—'}</Td>
                <Td><StatusPill status={r.status} /></Td>
                <Td>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</Td>
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
        <ReviewDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load() }}
        />
      )}
    </>
  )
}

function StatusFilter({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const options: { v: Status; label: string }[] = [
    { v: 'submitted',    label: 'Submitted' },
    { v: 'under_review', label: 'Under review' },
    { v: 'approved',     label: 'Approved' },
    { v: 'rejected',     label: 'Rejected' },
    { v: 'all',          label: 'All' },
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
    draft:        { bg: 'var(--surface-2)', color: 'var(--muted)' },
    submitted:    { bg: '#DBEAFE', color: 'var(--blue-h)' },
    under_review: { bg: '#FEF3C7', color: '#B45309' },
    approved:     { bg: '#DCFCE7', color: 'var(--pos)' },
    rejected:     { bg: '#FEE2E2', color: '#B91C1C' },
  }
  const t = tones[status] ?? tones.draft
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {status.replace('_', ' ')}
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

function ReviewDrawer({ app, onClose, onDone }: {
  app: AppRow
  onClose: () => void
  onDone: () => void
}) {
  const [notes, setNotes]       = useState(app.admin_notes ?? '')
  const [working, setWorking]   = useState<null | 'approve' | 'reject' | 'request_info'>(null)
  const [deckUrl, setDeckUrl]   = useState<string | null>(null)
  const [deckEvalBusy, setDeckEvalBusy] = useState(false)
  const deckRef = app.deck_path ?? null

  useEffect(() => {
    let mounted = true
    async function signDeck() {
      if (!deckRef) {
        if (mounted) setDeckUrl(null)
        return
      }

      if (/^https?:\/\//i.test(deckRef)) {
        if (mounted) setDeckUrl(deckRef)
        return
      }

      for (const bucket of ['pitch-decks', 'decks'] as const) {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(deckRef, 3600)
        if (!error && data?.signedUrl) {
          if (mounted) setDeckUrl(data.signedUrl)
          return
        }
      }

      if (mounted) setDeckUrl(null)
    }
    void signDeck()
    return () => { mounted = false }
  }, [deckRef])

  async function act(action: 'approve' | 'reject' | 'request_info') {
    if ((action === 'reject' || action === 'request_info') && !notes.trim()) {
      toast.error('Please provide notes explaining the decision.')
      return
    }
    setWorking(action)
    const { error } = await supabase.functions.invoke('admin-review-application', {
      body: { applicationId: app.id, action, notes: notes.trim() || undefined },
    })
    setWorking(null)
    if (error) {
      toast.error(error.message || `Failed to ${action}`)
      return
    }
    toast.success(action === 'approve' ? 'Application approved.' : action === 'reject' ? 'Application rejected.' : 'More info requested.')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div
        className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {app.company_name}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{app.tagline ?? '—'}</p>
              <div className="mt-3"><StatusPill status={app.status} /></div>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Founder">
            <p className="text-sm" style={{ color: 'var(--ink)' }}>
              {[app.founder?.first_name, app.founder?.last_name].filter(Boolean).join(' ') || '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{app.founder?.email ?? '—'}</p>
          </Section>

          <Section title="Overview">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Sector"   value={app.sector ?? '—'} />
              <Field label="Stage"    value={app.stage ?? '—'} />
              <Field label="Ask"      value={app.funding_ask_usd ? compactNumber(app.funding_ask_usd) : '—'} />
              <Field label="Badge"    value={app.trust_badge ?? '—'} />
            </dl>
          </Section>

          <Section title="Description">
            <p className="text-sm whitespace-pre-wrap leading-6" style={{ color: 'var(--muted)' }}>
              {app.description ?? '—'}
            </p>
          </Section>

          <Section title="Materials">
            <div className="flex flex-col gap-2 text-sm">
              {deckUrl ? (
                <a href={deckUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium"
                  style={{ color: 'var(--blue)' }}>
                  <Download className="w-4 h-4" /> Download pitch deck
                </a>
              ) : deckRef ? (
                <span style={{ color: 'var(--muted)' }}><FileText className="w-4 h-4 inline mr-1" />Deck attached (signing…)</span>
              ) : (
                <span style={{ color: 'var(--muted-2)' }}>No deck uploaded.</span>
              )}
              {app.pitch_video_url && (
                <a href={app.pitch_video_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium"
                  style={{ color: 'var(--blue)' }}>
                  <ExternalLink className="w-4 h-4" /> Pitch video
                </a>
              )}
            </div>
          </Section>

          <Section title="Admin notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              placeholder="Why was this approved/rejected? Required for reject or re-request."
              className="w-full rounded-xl px-3 py-2 text-sm outline-0 resize-none"
              style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </Section>

          <div className="flex gap-2 pt-2">
            <ActionButton label="Approve" icon={CheckCircle}
              tone="success" disabled={!!working} loading={working === 'approve'}
              onClick={() => act('approve')} />
            <ActionButton label="Reject" icon={XCircle}
              tone="danger" disabled={!!working} loading={working === 'reject'}
              onClick={() => act('reject')} />
            <ActionButton label="Request info" icon={MessageSquareWarning}
              tone="warn" disabled={!!working} loading={working === 'request_info'}
              onClick={() => act('request_info')} />
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              disabled={deckEvalBusy || !app.deck_path}
              onClick={async () => {
                setDeckEvalBusy(true)
                try {
                  const { data, error } = await supabase.functions.invoke('admin-run-job', {
                    body: { job: 're-evaluate-deck', user_id: app.founder_id },
                  })
                  if (error) {
                    toast.error(error.message || 'Failed to trigger deck evaluation')
                    return
                  }
                  if (data?.status === 'failed') {
                    toast.error(data.error || 'Deck evaluation failed')
                    return
                  }
                  toast.success('Deck evaluation triggered. The founder will receive an email with results.')
                } catch (e: any) {
                  console.error('[Re-evaluate] unexpected error:', e)
                  toast.error(e?.message || 'Unexpected error')
                } finally {
                  setDeckEvalBusy(false)
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-opacity"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: app.deck_path ? 'var(--ink)' : 'var(--muted)', opacity: (deckEvalBusy || !app.deck_path) ? 0.6 : 1 }}
            >
              <RefreshCw className={`w-4 h-4${deckEvalBusy ? ' animate-spin' : ''}`} />
              {deckEvalBusy ? 'Evaluating deck…' : app.deck_path ? 'Re-evaluate Deck' : 'No deck uploaded'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>{title}</p>
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

function ActionButton({ label, icon: Icon, tone, onClick, disabled, loading }: {
  label:    string
  icon:     React.ElementType
  tone:     'success' | 'danger' | 'warn'
  onClick:  () => void
  disabled: boolean
  loading:  boolean
}) {
  const tones = {
    success: { bg: 'var(--pos)', color: 'var(--surface)' },
    danger:  { bg: 'var(--neg)', color: 'var(--surface)' },
    warn:    { bg: 'var(--warn)', color: 'var(--surface)' },
  } as const
  const t = tones[tone]
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-opacity"
      style={{ background: t.bg, color: t.color, opacity: disabled ? 0.6 : 1 }}>
      <Icon className="w-4 h-4" />
      {loading ? 'Working…' : label}
    </button>
  )
}
