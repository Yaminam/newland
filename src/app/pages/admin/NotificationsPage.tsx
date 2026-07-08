import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Send, FileEdit, Users, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type Tab = 'compose' | 'history' | 'templates'
type Audience = 'all' | 'founders' | 'investors' | 'plan:free' | 'plan:pro' | 'plan:enterprise'
type Channel = 'inapp' | 'email'

export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('compose')
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Broadcasts &amp; Templates
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Send announcements to segments of users and manage notification copy.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {(['compose','history','templates'] as Tab[]).map(t => (
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

      {tab === 'compose'   && <Compose />}
      {tab === 'history'   && <History />}
      {tab === 'templates' && <Templates />}
    </div>
  )
}

function Compose() {
  const [title, setTitle]     = useState('')
  const [body, setBody]       = useState('')
  const [actionUrl, setUrl]   = useState('')
  const [audience, setAud]    = useState<Audience>('all')
  const [channels, setCh]     = useState<Channel[]>(['inapp'])
  const [preview, setPreview] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledFor, setScheduledFor]       = useState('')

  async function doPreview() {
    setPreview(null)
    const { data, error } = await supabase.functions.invoke('admin-broadcast', {
      body: { title: title || 'preview', body: body || 'preview', audience, channel: channels, dry_run: true },
    })
    if (error) { toast.error(error.message); return }
    const d = data as { preview_count?: number } | null
    setPreview(d?.preview_count ?? 0)
  }

  async function send() {
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required.'); return }
    if (!channels.length) { toast.error('Pick at least one channel.'); return }

    // If scheduling, validate the datetime.
    let scheduledIso: string | undefined
    if (scheduleEnabled) {
      if (!scheduledFor) { toast.error('Pick a send time.'); return }
      const when = new Date(scheduledFor)
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        toast.error('Send time must be in the future.')
        return
      }
      scheduledIso = when.toISOString()
    }

    const confirmText = scheduleEnabled
      ? `Schedule this broadcast for ${new Date(scheduledIso!).toLocaleString()} to the "${audience}" audience via ${channels.join('+')}?`
      : `Send this broadcast to the "${audience}" audience via ${channels.join('+')}?`
    if (!window.confirm(confirmText)) return

    setSending(true)
    const { data, error } = await supabase.functions.invoke('admin-broadcast', {
      body: {
        title: title.trim(),
        body: body.trim(),
        action_url: actionUrl.trim() || undefined,
        audience,
        channel: channels,
        scheduled_for: scheduledIso,
      },
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    const d = data as { recipient_count?: number; sent_inapp?: number; scheduled_for?: string; recipient_preview?: number } | null
    if (scheduleEnabled && d?.scheduled_for) {
      toast.success(`Scheduled for ${new Date(d.scheduled_for).toLocaleString()} (${d.recipient_preview ?? 0} recipients expected).`)
    } else {
      toast.success(`Broadcast sent to ${d?.recipient_count ?? 0} recipients.`)
    }
    setTitle(''); setBody(''); setUrl(''); setPreview(null)
    setScheduleEnabled(false); setScheduledFor('')
  }

  return (
    <div className="rounded-2xl p-6 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <Field label="Title">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Your platform announcement"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
        />
      </Field>
      <Field label="Body">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          placeholder="Keep it short. Users will read this in the notification list."
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
        />
      </Field>
      <Field label="Action URL (optional)">
        <input
          type="url"
          value={actionUrl}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
        />
      </Field>

      <Field label="Audience">
        <select
          value={audience}
          onChange={e => setAud(e.target.value as Audience)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
        >
          <option value="all">All users</option>
          <option value="founders">Founders only</option>
          <option value="investors">Investors only</option>
          <option value="plan:free">Free plan</option>
          <option value="plan:pro">Pro plan</option>
          <option value="plan:enterprise">Enterprise plan</option>
        </select>
      </Field>

      <Field label="Channel">
        <div className="flex gap-4">
          {(['inapp','email'] as Channel[]).map(c => (
            <label key={c} className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={channels.includes(c)}
                onChange={() => setCh(channels.includes(c) ? channels.filter(x => x !== c) : [...channels, c])}
              />
              {c === 'inapp' ? 'In-app notification' : 'Email'}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Schedule">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={() => { setScheduleEnabled(v => !v); if (!scheduleEnabled) setScheduledFor('') }}
            />
            Send later
          </label>
          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={e => setScheduledFor(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
            />
          )}
          {scheduleEnabled && scheduledFor && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Dispatches within 5 minutes of this time.
            </span>
          )}
        </div>
      </Field>

      <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--line-2)' }}>
        <button type="button" onClick={doPreview}
          className="text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-2"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
          <Users className="w-3.5 h-3.5" />
          Preview audience size
        </button>
        {preview !== null && (
          <span className="text-sm" style={{ color: 'var(--ink)' }}>
            <strong>{preview.toLocaleString()}</strong> recipients
          </span>
        )}
        <div className="flex-1" />
        <button type="button" onClick={send} disabled={sending}
          className="text-xs font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-60"
          style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
          {scheduleEnabled ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? (scheduleEnabled ? 'Scheduling…' : 'Sending…') : (scheduleEnabled ? 'Schedule broadcast' : 'Send broadcast')}
        </button>
      </div>

      <div className="rounded-lg p-3 text-xs flex items-start gap-2"
        style={{ background: 'var(--warn-bg)', border: '1px solid #FDE68A', color: '#B45309' }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        Broadcasts are irreversible — banned users are excluded, soft-deleted users are excluded.
      </div>
    </div>
  )
}

interface BroadcastRow {
  id:            string
  title:         string
  body:          string
  audience:      string
  channel:       string[]
  sent_at:       string | null
  sent_count:    number
  created_at:    string
  scheduled_for: string | null
  status:        string
}

function History() {
  const [rows, setRows]     = useState<BroadcastRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('admin_broadcasts')
      .select('id, title, body, audience, channel, sent_at, sent_count, created_at, scheduled_for, status')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as BroadcastRow[]) ?? [])
    setLoading(false)
  }, [])

  async function cancel(id: string) {
    if (!window.confirm('Cancel this scheduled broadcast?')) return
    setBusy(id)
    const { error } = await supabase
      .from('admin_broadcasts')
      .update({ status: 'canceled' })
      .eq('id', id)
      .eq('status', 'scheduled')
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Scheduled broadcast canceled.')
    void load()
  }

  useEffect(() => { void load() }, [load])

  if (loading) return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading…</div>
  if (rows.length === 0) return (
    <div className="rounded-2xl p-8 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
      <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
      No broadcasts sent yet.
    </div>
  )

  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.id} className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.title}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{r.body}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Chip>{r.audience}</Chip>
                {r.channel.map(c => <Chip key={c}>{c}</Chip>)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={r.status} scheduledFor={r.scheduled_for} sentAt={r.sent_at} />
              <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ink)' }}>
                {r.sent_count.toLocaleString()} sent
              </p>
              {r.status === 'scheduled' && (
                <button type="button" onClick={() => void cancel(r.id)} disabled={busy === r.id}
                  className="mt-2 text-xs font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{ background: 'var(--neg-bg)', color: '#B91C1C', opacity: busy === r.id ? 0.6 : 1 }}>
                  <XCircle className="w-3 h-3" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface TemplateRow {
  key:       string
  subject:   string | null
  body:      string | null
  email_html: string | null
  updated_at: string
}

function Templates() {
  const [rows, setRows]       = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit]       = useState<TemplateRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notification_templates')
      .select('key, subject, body, email_html, updated_at')
      .order('key')
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as TemplateRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading…</div>

  return (
    <>
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Key</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Body preview</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} style={{ borderTop: '1px solid var(--line)' }}>
                <td className="px-4 py-3 align-top font-mono text-xs" style={{ color: 'var(--ink)' }}>{r.key}</td>
                <td className="px-4 py-3 align-top" style={{ color: 'var(--ink)' }}>{r.subject ?? '—'}</td>
                <td className="px-4 py-3 align-top" style={{ color: 'var(--muted)' }}>
                  <span className="line-clamp-1">{r.body ?? '—'}</span>
                </td>
                <td className="px-4 py-3 align-top">
                  <button type="button" onClick={() => setEdit(r)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                    <FileEdit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <TemplateEditor row={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); void load() }} />}
    </>
  )
}

function TemplateEditor({ row, onClose, onDone }: {
  row: TemplateRow
  onClose: () => void
  onDone: () => void
}) {
  const [subject, setSubject] = useState(row.subject ?? '')
  const [body, setBody]       = useState(row.body ?? '')
  const [html, setHtml]       = useState(row.email_html ?? '')
  const [saving, setSaving]   = useState(false)

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('notification_templates')
      .update({ subject, body, email_html: html || null, updated_at: new Date().toISOString() })
      .eq('key', row.key)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Template saved.')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>Template</p>
              <h2 className="text-xl font-semibold mt-1 font-mono" style={{ color: 'var(--ink)' }}>{row.key}</h2>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Field label="Subject">
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
            />
          </Field>
          <Field label="Body (supports {{variable}} placeholders)">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
            />
          </Field>
          <Field label="Email HTML (optional)">
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              rows={8}
              placeholder="<p>…</p>"
              className="w-full rounded-lg px-3 py-2 text-xs font-mono"
              style={{ border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)' }}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--line-2)' }}>
            <button type="button" onClick={onClose}
              className="text-xs font-semibold px-3 py-2 rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
              style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
              {saving ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded"
      style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
      {children}
    </span>
  )
}

function StatusBadge({ status, scheduledFor, sentAt }: {
  status: string; scheduledFor: string | null; sentAt: string | null
}) {
  if (status === 'scheduled' && scheduledFor) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold"
        style={{ color: 'var(--blue)' }}>
        <Clock className="w-3 h-3" />
        scheduled · {new Date(scheduledFor).toLocaleString()}
      </span>
    )
  }
  if (status === 'sending') {
    return <span className="text-[11px] font-semibold" style={{ color: '#B45309' }}>sending…</span>
  }
  if (status === 'canceled') {
    return <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>canceled</span>
  }
  if (status === 'failed') {
    return <span className="text-[11px] font-semibold" style={{ color: 'var(--neg)' }}>failed</span>
  }
  if (sentAt) {
    return <span className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(sentAt).toLocaleString()}</span>
  }
  return <span className="text-xs" style={{ color: 'var(--muted-2)' }}>draft</span>
}
