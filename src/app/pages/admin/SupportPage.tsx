import { useCallback, useEffect, useState } from 'react'
import { LifeBuoy, Bug, MessageCircle, CheckCircle2, PlayCircle, AlertTriangle, Copy, FileText, Plus, Trash2, Save, Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type Tab = 'tickets' | 'bugs' | 'feedback' | 'templates'

// SLA targets in hours. Tickets use a flat 24h target; bugs escalate by severity.
const TICKET_SLA_HOURS = 24
const BUG_SLA_HOURS: Record<string, number> = {
  P0: 4,
  P1: 24,
  P2: 72,
  P3: 168, // 7 days
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function SlaPill({ createdAt, resolvedAt, slaHours, status }: {
  createdAt:  string
  resolvedAt: string | null
  slaHours:   number
  status:     string
}) {
  const created = new Date(createdAt).getTime()
  if (status === 'resolved' && resolvedAt) {
    const delta = new Date(resolvedAt).getTime() - created
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
        style={{ color: 'var(--pos)' }}>
        resolved in {formatDuration(delta)}
      </span>
    )
  }
  const ageMs = Date.now() - created
  const overdue = ageMs > slaHours * 3_600_000
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
      style={{ color: overdue ? 'var(--neg)' : 'var(--muted)' }}>
      {overdue && <AlertTriangle className="w-3 h-3" />}
      {overdue ? `overdue · ${formatDuration(ageMs)} / ${slaHours}h` : `open · ${formatDuration(ageMs)}`}
    </span>
  )
}

export function SupportPage() {
  const [tab, setTab] = useState<Tab>('tickets')

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Support
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Triage support tickets, bug reports, and product feedback.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {(['tickets','bugs','feedback','templates'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors capitalize"
            style={{
              background: tab === t ? 'var(--surface)' : 'transparent',
              color:      tab === t ? 'var(--ink)' : 'var(--muted)',
              boxShadow:  tab === t ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'tickets'   && <TicketsTab />}
      {tab === 'bugs'      && <BugsTab />}
      {tab === 'feedback'  && <FeedbackTab />}
      {tab === 'templates' && <TemplatesTab />}
    </div>
  )
}

interface TicketRow {
  id:          string
  user_id:     string | null
  name:        string | null
  email:       string | null
  subject:     string | null
  message:     string
  status:      string
  created_at:  string
  resolved_at: string | null
}

function TicketsTab() {
  const [rows, setRows]       = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open')
  const [busy, setBusy]       = useState<string | null>(null)
  const [selected, setSelected] = useState<TicketRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('support_tickets')
      .select('id, user_id, name, email, subject, message, status, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(100)
    if (status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as TicketRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])

  async function setTicketStatus(id: string, next: 'open' | 'in_progress' | 'resolved') {
    setBusy(id)
    const { error } = await supabase.from('support_tickets').update({ status: next }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  return (
    <>
      <StatusFilter value={status} onChange={setStatus} />
      {loading ? <Loading /> : rows.length === 0 ? (
        <Empty icon={LifeBuoy} label="No support tickets in this view." />
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>Subject</Th>
                <Th>From</Th>
                <Th>Status</Th>
                <Th>SLA</Th>
                <Th>Received</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td>
                    <button type="button" onClick={() => setSelected(r)}
                      className="font-semibold text-left hover:underline"
                      style={{ color: 'var(--ink)' }}>
                      {r.subject ?? '(no subject)'}
                    </button>
                  </Td>
                  <Td>
                    <p style={{ color: 'var(--ink)' }}>{r.name ?? '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.email ?? '—'}</p>
                  </Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td>
                    <SlaPill
                      createdAt={r.created_at}
                      resolvedAt={r.resolved_at}
                      slaHours={TICKET_SLA_HOURS}
                      status={r.status}
                    />
                  </Td>
                  <Td className="text-xs" >{new Date(r.created_at).toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {r.status !== 'in_progress' && (
                        <SmallBtn label="Claim" icon={PlayCircle}
                          busy={busy === r.id} onClick={() => setTicketStatus(r.id, 'in_progress')} />
                      )}
                      {r.status !== 'resolved' && (
                        <SmallBtn label="Resolve" icon={CheckCircle2} tone="success"
                          busy={busy === r.id} onClick={() => setTicketStatus(r.id, 'resolved')} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <Detail title={selected.subject ?? 'Support ticket'} onClose={() => setSelected(null)}>
        <Section label="From">{selected.name ?? '—'} — {selected.email ?? '—'}</Section>
        <Section label="Received">{new Date(selected.created_at).toLocaleString()}</Section>
        <Section label="Message">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--ink)' }}>{selected.message}</p>
        </Section>
        <Section label="Previous replies">
          <ReplyHistory ticketId={selected.id} />
        </Section>
        <Section label="Reply via email">
          <ReplyComposer ticket={selected} onSent={() => { void load() }} />
        </Section>
        <Section label="Canned responses">
          <CannedResponseList replyTo={selected.name ?? undefined} />
        </Section>
      </Detail>}
    </>
  )
}

interface BugRow {
  id:                 string
  user_id:            string | null
  name:               string | null
  email:              string | null
  title:              string
  description:        string
  severity:           string | null
  steps_to_reproduce: string | null
  expected_behavior:  string | null
  actual_behavior:    string | null
  screenshot_url:     string | null
  status:             string
  created_at:         string
  resolved_at:        string | null
}

function BugsTab() {
  const [rows, setRows]       = useState<BugRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState<'open' | 'in_progress' | 'resolved' | 'all'>('open')
  const [busy, setBusy]       = useState<string | null>(null)
  const [selected, setSelected] = useState<BugRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (status !== 'all') q = q.eq('status', status)
    const { data, error } = await q
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as BugRow[]) ?? [])
    setLoading(false)
  }, [status])

  useEffect(() => { void load() }, [load])

  async function setBugStatus(id: string, next: 'open' | 'in_progress' | 'resolved') {
    setBusy(id)
    const { error } = await supabase.from('bug_reports').update({ status: next }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  return (
    <>
      <StatusFilter value={status} onChange={setStatus} />
      {loading ? <Loading /> : rows.length === 0 ? (
        <Empty icon={Bug} label="No bug reports in this view." />
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>Title</Th>
                <Th>Severity</Th>
                <Th>Reporter</Th>
                <Th>Status</Th>
                <Th>SLA</Th>
                <Th>Filed</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td>
                    <button type="button" onClick={() => setSelected(r)}
                      className="font-semibold text-left hover:underline"
                      style={{ color: 'var(--ink)' }}>
                      {r.title}
                    </button>
                  </Td>
                  <Td><SeverityPill severity={r.severity} /></Td>
                  <Td>
                    <p style={{ color: 'var(--ink)' }}>{r.name ?? '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.email ?? '—'}</p>
                  </Td>
                  <Td><StatusPill status={r.status} /></Td>
                  <Td>
                    <SlaPill
                      createdAt={r.created_at}
                      resolvedAt={r.resolved_at}
                      slaHours={BUG_SLA_HOURS[r.severity ?? 'P2'] ?? BUG_SLA_HOURS.P2}
                      status={r.status}
                    />
                  </Td>
                  <Td className="text-xs">{new Date(r.created_at).toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      {r.status !== 'in_progress' && (
                        <SmallBtn label="Claim" icon={PlayCircle}
                          busy={busy === r.id} onClick={() => setBugStatus(r.id, 'in_progress')} />
                      )}
                      {r.status !== 'resolved' && (
                        <SmallBtn label="Resolve" icon={CheckCircle2} tone="success"
                          busy={busy === r.id} onClick={() => setBugStatus(r.id, 'resolved')} />
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <Detail title={selected.title} onClose={() => setSelected(null)}>
        <Section label="Severity"><SeverityPill severity={selected.severity} /></Section>
        <Section label="Reporter">{selected.name ?? '—'} — {selected.email ?? '—'}</Section>
        <Section label="Description">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--ink)' }}>{selected.description}</p>
        </Section>
        {selected.steps_to_reproduce && (
          <Section label="Steps to reproduce">
            <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--muted)' }}>{selected.steps_to_reproduce}</p>
          </Section>
        )}
        {selected.expected_behavior && (
          <Section label="Expected">
            <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--muted)' }}>{selected.expected_behavior}</p>
          </Section>
        )}
        {selected.actual_behavior && (
          <Section label="Actual">
            <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--muted)' }}>{selected.actual_behavior}</p>
          </Section>
        )}
        {selected.screenshot_url && (
          <Section label="Screenshot">
            <a href={selected.screenshot_url} target="_blank" rel="noreferrer"
              className="text-sm underline" style={{ color: '#6366F1' }}>View screenshot</a>
          </Section>
        )}
      </Detail>}
    </>
  )
}

interface FeedbackRow {
  id:            string
  user_id:       string | null
  feedback_type: string | null
  message:       string | null
  page_url:      string | null
  created_at:    string
}

function FeedbackTab() {
  const [rows, setRows]       = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedback')
      .select('id, user_id, feedback_type, message, page_url, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as FeedbackRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <Loading />
  if (rows.length === 0) return <Empty icon={MessageCircle} label="No feedback submitted yet." />

  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.id} className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 items-center">
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded"
                  style={{ background: 'var(--blue-bg)', color: '#4338CA' }}>
                  {r.feedback_type ?? 'other'}
                </span>
                {r.page_url && (
                  <code className="text-xs" style={{ color: 'var(--muted)' }}>{r.page_url}</code>
                )}
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
                {r.message ?? '(no message)'}
              </p>
            </div>
            <p className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>
              {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusFilter<S extends string>({ value, onChange }: {
  value: S
  onChange: (v: S) => void
}) {
  const options = [
    { v: 'open',        label: 'Open' },
    { v: 'in_progress', label: 'In progress' },
    { v: 'resolved',    label: 'Resolved' },
    { v: 'all',         label: 'All' },
  ]
  return (
    <div className="mb-4 flex gap-1 rounded-xl p-1 w-fit"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v as S)}
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
    open:        { bg: '#FEE2E2', color: '#B91C1C' },
    in_progress: { bg: '#FEF3C7', color: '#B45309' },
    resolved:    { bg: '#DCFCE7', color: 'var(--pos)' },
  }
  const t = tones[status] ?? { bg: 'var(--surface-2)', color: 'var(--muted)' }
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {status.replace('_', ' ')}
    </span>
  )
}

function SeverityPill({ severity }: { severity: string | null }) {
  const tones: Record<string, { bg: string; color: string }> = {
    low:      { bg: '#E0F2FE', color: '#0369A1' },
    medium:   { bg: '#FEF3C7', color: '#B45309' },
    high:     { bg: '#FEE2E2', color: '#B91C1C' },
    critical: { bg: '#7F1D1D', color: 'var(--danger-border)' },
  }
  const t = tones[severity ?? 'medium'] ?? tones.medium
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {severity ?? 'unknown'}
    </span>
  )
}

function SmallBtn({ label, icon: Icon, busy, onClick, tone = 'neutral' }: {
  label:    string
  icon?:    React.ElementType
  busy:     boolean
  onClick:  () => void
  tone?:    'neutral' | 'danger' | 'success'
}) {
  const palette = {
    neutral: { bg: 'var(--surface-2)', color: 'var(--ink)', border: 'var(--line)' },
    danger:  { bg: '#FEE2E2', color: '#B91C1C', border: 'var(--danger-border)' },
    success: { bg: '#DCFCE7', color: 'var(--pos)', border: '#86EFAC' },
  }[tone]
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {busy ? '…' : label}
    </button>
  )
}

function Detail({ title, children, onClose }: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 flex items-start justify-between" style={{ borderBottom: '1px solid var(--line)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            {title}
          </h2>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--muted)' }}>
        {label}
      </h3>
      {typeof children === 'string' ? <p className="text-sm" style={{ color: 'var(--ink)' }}>{children}</p> : children}
    </div>
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
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ''}`}>{children}</td>
}
function Loading() {
  return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading…</div>
}
function Empty({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="rounded-2xl p-8 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
      <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
      {label}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Email reply from ticket drawer
// ────────────────────────────────────────────────────────────────────────────

interface ReplyRow {
  id:       string
  message:  string
  sent_at:  string
  admin_id: string | null
}

function ReplyHistory({ ticketId }: { ticketId: string }) {
  const [rows, setRows]     = useState<ReplyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void (async () => {
      const { data } = await supabase
        .from('admin_ticket_replies')
        .select('id, message, sent_at, admin_id')
        .eq('ticket_id', ticketId)
        .order('sent_at', { ascending: true })
      if (!alive) return
      setRows((data ?? []) as ReplyRow[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [ticketId])

  if (loading) return <p className="text-xs" style={{ color: 'var(--muted-2)' }}>Loading…</p>
  if (rows.length === 0) return <p className="text-xs" style={{ color: 'var(--muted-2)' }}>No replies yet.</p>

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.id} className="rounded-lg p-3 text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {new Date(r.sent_at).toLocaleString()}
            </span>
          </div>
          <p className="whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>{r.message}</p>
        </div>
      ))}
    </div>
  )
}

function ReplyComposer({ ticket, onSent }: {
  ticket: { id: string; email: string | null; name: string | null; subject: string | null }
  onSent: () => void
}) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    if (!message.trim()) { toast.error('Write something first.'); return }
    if (!ticket.email)  { toast.error('No email on this ticket.'); return }
    if (!window.confirm(`Send this reply to ${ticket.email}?`)) return
    setSending(true)
    const { data, error } = await supabase.functions.invoke('admin-send-ticket-reply', {
      body: { ticketId: ticket.id, message: message.trim() },
    })
    setSending(false)
    if (error) {
      // Supabase JS invoke wraps non-2xx into error; try to pull server detail.
      const ctx = (error as { context?: Response }).context
      let detail: string | undefined
      try {
        if (ctx && typeof ctx.json === 'function') {
          const b = (await ctx.json()) as { error?: string; message?: string }
          detail = b.message ?? b.error
        }
      } catch { /* ignore */ }
      toast.error(detail ?? error.message ?? 'Send failed.')
      return
    }
    const resp = data as { success?: boolean } | null
    if (!resp?.success) { toast.error('Send failed.'); return }
    toast.success(`Reply emailed to ${ticket.email}.`)
    setMessage('')
    onSent()
  }

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        Sends to <strong>{ticket.email ?? '—'}</strong>. The ticket auto-moves to <em>in progress</em>.
      </p>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={5}
        placeholder={`Hi ${ticket.name ?? 'there'},\n\n…`}
        className="w-full text-sm outline-0"
        style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
      />
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => void send()} disabled={sending || !ticket.email}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
          style={{ background: 'var(--blue)', color: 'var(--surface)' }}>
          <Send className="w-3.5 h-3.5" />
          {sending ? 'Sending…' : 'Send reply'}
        </button>
        <span className="text-xs" style={{ color: 'var(--muted-2)' }}>
          Use the canned responses below to paste boilerplate text.
        </span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Canned responses
// ────────────────────────────────────────────────────────────────────────────

interface CannedRow {
  id:          string
  title:       string
  body:        string
  sort_order:  number
  usage_count: number
  updated_at:  string
}

function CannedResponseList({ replyTo }: { replyTo?: string }) {
  const [rows, setRows] = useState<CannedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const { data } = await supabase
        .from('support_canned_responses')
        .select('id, title, body, sort_order, usage_count, updated_at')
        .order('sort_order')
        .order('created_at')
      if (!alive) return
      setRows((data ?? []) as CannedRow[])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  async function copy(row: CannedRow) {
    // Do the {{name}} swap inline so the admin doesn't have to hand-edit.
    const filled = replyTo ? row.body.split('{{name}}').join(replyTo) : row.body
    await navigator.clipboard.writeText(filled)
    toast.success(`"${row.title}" copied.`)
    // Best-effort usage counter — ignore failures silently.
    void supabase
      .from('support_canned_responses')
      .update({ usage_count: row.usage_count + 1 })
      .eq('id', row.id)
  }

  if (loading) return <p className="text-xs" style={{ color: 'var(--muted-2)' }}>Loading templates…</p>
  if (rows.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
        No templates yet. Add some in <strong>Templates</strong>.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.id} className="rounded-xl p-3" style={{ border: '1px solid var(--line)', background: 'var(--surface)' }}>
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="text-sm font-semibold text-left flex-1" style={{ color: 'var(--ink)' }}>
              {r.title}
            </button>
            <span className="text-[10px] uppercase tracking-[0.05em]" style={{ color: 'var(--muted-2)' }}>
              used {r.usage_count}×
            </span>
            <button type="button" onClick={() => void copy(r)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          {expanded === r.id && (
            <pre className="text-xs mt-2 whitespace-pre-wrap"
              style={{ color: 'var(--muted)', fontFamily: 'inherit' }}>
              {r.body}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}

function TemplatesTab() {
  const [rows, setRows] = useState<CannedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<CannedRow>>({ title: '', body: '', sort_order: 0 })
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('support_canned_responses')
      .select('id, title, body, sort_order, usage_count, updated_at')
      .order('sort_order')
      .order('created_at')
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data ?? []) as CannedRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function save() {
    if (!form.title?.trim() || !form.body?.trim()) {
      toast.error('Title and body are required.')
      return
    }
    setBusy('__save__')
    if (editingId) {
      const { error } = await supabase
        .from('support_canned_responses')
        .update({ title: form.title, body: form.body, sort_order: form.sort_order ?? 0 })
        .eq('id', editingId)
      if (error) { setBusy(null); toast.error(error.message); return }
      toast.success('Template updated.')
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('support_canned_responses')
        .insert({ title: form.title, body: form.body, sort_order: form.sort_order ?? 0, created_by: user?.id ?? null })
      if (error) { setBusy(null); toast.error(error.message); return }
      toast.success('Template created.')
    }
    setBusy(null)
    setForm({ title: '', body: '', sort_order: 0 })
    setEditingId(null)
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this template?')) return
    setBusy(id)
    const { error } = await supabase.from('support_canned_responses').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    void load()
  }

  function startEdit(r: CannedRow) {
    setEditingId(r.id)
    setForm({ title: r.title, body: r.body, sort_order: r.sort_order })
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6">
      <div>
        {loading ? <Loading /> : rows.length === 0 ? (
          <Empty icon={FileText} label="No templates yet. Add one on the right." />
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--surface-2)' }}>
                <tr>
                  <Th>Title</Th>
                  <Th>Used</Th>
                  <Th>Updated</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <Td>
                      <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.title}</p>
                      <p className="text-xs mt-0.5 truncate max-w-md" style={{ color: 'var(--muted)' }}>
                        {r.body.split('\n')[0]}
                      </p>
                    </Td>
                    <Td className="text-xs">{r.usage_count}</Td>
                    <Td className="text-xs">{new Date(r.updated_at).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => startEdit(r)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
                          Edit
                        </button>
                        <button type="button" onClick={() => void remove(r.id)}
                          disabled={busy === r.id}
                          className="text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1"
                          style={{ background: 'var(--neg-bg)', color: '#B91C1C' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 h-fit"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
          {editingId ? 'Edit template' : 'New template'}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              Title
            </label>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Acknowledge + ETA"
              className="w-full text-sm outline-0"
              style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              Body (use {'{{name}}'} for ticket reporter)
            </label>
            <textarea
              value={form.body ?? ''}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={10}
              className="w-full text-sm outline-0 font-mono"
              style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
              Sort order
            </label>
            <input
              type="number"
              value={form.sort_order ?? 0}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full text-sm outline-0"
              style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void save()} disabled={busy === '__save__'}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: busy === '__save__' ? 0.6 : 1 }}>
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Save changes' : 'Create'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', body: '', sort_order: 0 }) }}
                className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
