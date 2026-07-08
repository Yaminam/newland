import { useCallback, useEffect, useState } from 'react'
import { FileClock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

interface AuditRow {
  id:         string
  actor_id:   string | null
  acted_on:   string | null
  entity:     string
  action:     string
  before:     Record<string, unknown> | null
  after:      Record<string, unknown> | null
  reason:     string | null
  ip:         string | null
  user_agent: string | null
  created_at: string
  actor?:   { email: string | null; first_name: string | null; last_name: string | null } | null
  subject?: { email: string | null; first_name: string | null; last_name: string | null } | null
}

type EntityFilter = 'all' | 'profile' | 'user_moderation' | 'startup_application' | 'introduction' | 'admin_broadcast' | 'scraper_run'

export function AuditLogPage() {
  const [rows, setRows]       = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [entity, setEntity]   = useState<EntityFilter>('all')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<AuditRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('audit_log')
      .select('id, actor_id, acted_on, entity, action, before, after, reason, ip, user_agent, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (entity !== 'all') q = q.eq('entity', entity)
    if (search.trim()) q = q.ilike('action', `%${search.trim()}%`)
    const { data, error } = await q
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }

    const base = (data as AuditRow[]) ?? []
    // Collect unique profile IDs referenced by actor_id + acted_on and fetch names in one round-trip
    const ids = new Set<string>()
    for (const r of base) {
      if (r.actor_id) ids.add(r.actor_id)
      if (r.acted_on) ids.add(r.acted_on)
    }
    const profileMap = new Map<string, { email: string | null; first_name: string | null; last_name: string | null }>()
    if (ids.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', Array.from(ids))
      for (const p of profiles ?? []) {
        profileMap.set(p.id as string, {
          email:      (p as { email: string | null }).email,
          first_name: (p as { first_name: string | null }).first_name,
          last_name:  (p as { last_name: string | null }).last_name,
        })
      }
    }
    setRows(base.map(r => ({
      ...r,
      actor:   r.actor_id ? profileMap.get(r.actor_id) ?? null : null,
      subject: r.acted_on ? profileMap.get(r.acted_on) ?? null : null,
    })))
    setLoading(false)
  }, [entity, search])

  useEffect(() => { void load() }, [load])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Audit log
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Every admin action is appended here. Read-only.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by action…"
            className="px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
          />
          <select
            value={entity}
            onChange={e => setEntity(e.target.value as EntityFilter)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
          >
            <option value="all">All entities</option>
            <option value="profile">Profile</option>
            <option value="user_moderation">User moderation</option>
            <option value="startup_application">Application</option>
            <option value="introduction">Introduction</option>
            <option value="admin_broadcast">Broadcast</option>
            <option value="scraper_run">Scraper run</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          <FileClock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
          No audit events in this view.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Subject</Th>
                <Th>Reason</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td className="text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </Td>
                  <Td>
                    <p style={{ color: 'var(--ink)' }}>
                      {[r.actor?.first_name, r.actor?.last_name].filter(Boolean).join(' ') || r.actor?.email || r.actor_id?.slice(0, 8) || '—'}
                    </p>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--blue-bg)', color: '#4338CA' }}>
                        {r.entity}
                      </span>
                      <span className="font-mono text-xs" style={{ color: 'var(--ink)' }}>{r.action}</span>
                    </span>
                  </Td>
                  <Td>
                    {r.subject
                      ? <p style={{ color: 'var(--ink)' }}>
                          {[r.subject.first_name, r.subject.last_name].filter(Boolean).join(' ') || r.subject.email || r.acted_on?.slice(0, 8)}
                        </p>
                      : r.acted_on ? <code className="text-xs" style={{ color: 'var(--muted)' }}>{r.acted_on.slice(0, 8)}…</code> : '—'}
                  </Td>
                  <Td>
                    {r.reason ? <span className="text-xs" style={{ color: 'var(--muted)' }}>{r.reason}</span> : '—'}
                  </Td>
                  <Td>
                    <button type="button" onClick={() => setSelected(r)}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--ink)' }}>
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <InspectDrawer row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function InspectDrawer({ row, onClose }: { row: AuditRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto"
        style={{ borderLeft: '1px solid var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                {row.entity} — {row.action}
              </p>
              <h2 className="text-xl font-semibold mt-1" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Audit event
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{new Date(row.created_at).toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <Info label="Actor" value={
            [row.actor?.first_name, row.actor?.last_name].filter(Boolean).join(' ') ||
            row.actor?.email || row.actor_id || '—'
          } />
          <Info label="Subject" value={
            [row.subject?.first_name, row.subject?.last_name].filter(Boolean).join(' ') ||
            row.subject?.email || row.acted_on || '—'
          } />
          {row.reason && <Info label="Reason" value={row.reason} />}
          {row.ip && <Info label="IP" value={row.ip} mono />}
          {row.user_agent && <Info label="User agent" value={row.user_agent} mono />}

          <JsonBlock label="Before" value={row.before} />
          <JsonBlock label="After" value={row.after} />
        </div>
      </div>
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? 'font-mono text-xs break-all' : ''}`} style={{ color: 'var(--ink)' }}>
        {value}
      </p>
    </div>
  )
}

function JsonBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  if (!value) return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-sm mt-0.5" style={{ color: 'var(--muted-2)' }}>—</p>
    </div>
  )
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-1.5" style={{ color: 'var(--muted)' }}>{label}</p>
      <pre className="rounded-lg p-3 text-xs overflow-x-auto"
        style={{ background: 'var(--ink)', color: 'var(--line)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
{JSON.stringify(value, null, 2)}
      </pre>
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
