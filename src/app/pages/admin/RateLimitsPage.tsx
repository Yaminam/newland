import { useCallback, useEffect, useState } from 'react'
import { Gauge, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type Scope = 'per_user' | 'per_ip' | 'global'

interface RuleRow {
  id:             string
  route:          string
  scope:          Scope
  window_seconds: number
  max_requests:   number
  enabled:        boolean
  description:    string | null
  updated_at:     string
}

interface RuleForm {
  route:          string
  scope:          Scope
  window_seconds: number
  max_requests:   number
  description:    string
  enabled:        boolean
}

const BLANK_FORM: RuleForm = {
  route: '', scope: 'per_user', window_seconds: 60, max_requests: 30,
  description: '', enabled: true,
}

export function RateLimitsPage() {
  const [rows, setRows]     = useState<RuleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]     = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm]     = useState<RuleForm>(BLANK_FORM)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rate_limit_rules')
      .select('id, route, scope, window_seconds, max_requests, enabled, description, updated_at')
      .order('route')
      .order('scope')
    if (error) { toast.error(error.message); setLoading(false); return }
    setRows((data ?? []) as RuleRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function save() {
    if (!form.route.trim()) { toast.error('Route is required.'); return }
    if (form.window_seconds < 5) { toast.error('Window must be ≥ 5 seconds.'); return }
    if (form.max_requests  < 1) { toast.error('Max requests must be ≥ 1.'); return }
    setBusy('__save__')
    const { data: { user } } = await supabase.auth.getUser()
    if (editing) {
      const { error } = await supabase
        .from('rate_limit_rules')
        .update({
          route:          form.route.trim(),
          scope:          form.scope,
          window_seconds: form.window_seconds,
          max_requests:   form.max_requests,
          description:    form.description.trim() || null,
          enabled:        form.enabled,
        })
        .eq('id', editing)
      if (error) { setBusy(null); toast.error(error.message); return }
      toast.success('Rule updated.')
    } else {
      const { error } = await supabase
        .from('rate_limit_rules')
        .insert({
          route:          form.route.trim(),
          scope:          form.scope,
          window_seconds: form.window_seconds,
          max_requests:   form.max_requests,
          description:    form.description.trim() || null,
          enabled:        form.enabled,
          created_by:     user?.id ?? null,
        })
      if (error) { setBusy(null); toast.error(error.message); return }
      toast.success('Rule created.')
    }
    setBusy(null)
    setEditing(null)
    setCreating(false)
    setForm(BLANK_FORM)
    void load()
  }

  async function toggle(r: RuleRow) {
    setBusy(r.id)
    const { error } = await supabase
      .from('rate_limit_rules')
      .update({ enabled: !r.enabled })
      .eq('id', r.id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this rule?')) return
    setBusy(id)
    const { error } = await supabase.from('rate_limit_rules').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    void load()
  }

  function startEdit(r: RuleRow) {
    setEditing(r.id)
    setCreating(true)
    setForm({
      route:          r.route,
      scope:          r.scope,
      window_seconds: r.window_seconds,
      max_requests:   r.max_requests,
      description:    r.description ?? '',
      enabled:        r.enabled,
    })
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Rate limits
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Per-route request caps enforced by edge functions via the shared
            <code className="mx-1 text-xs px-1 rounded" style={{ background: 'var(--surface-2)' }}>enforceRateLimit()</code>
            helper. Functions only check limits once the call pattern is wired —
            new rules take effect on deploys, not on save.
          </p>
        </div>
        <button type="button" onClick={() => { setCreating(v => !v); setEditing(null); setForm(BLANK_FORM) }}
          className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
          <Plus className="w-4 h-4" />
          New rule
        </button>
      </header>

      {creating && (
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
            {editing ? 'Edit rule' : 'New rule'}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <FormField label="Route (edge function name)">
              <input
                type="text"
                value={form.route}
                onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                placeholder="send-intro"
                className="w-full text-sm outline-0 font-mono"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </FormField>
            <FormField label="Scope">
              <select
                value={form.scope}
                onChange={e => setForm(f => ({ ...f, scope: e.target.value as Scope }))}
                className="w-full text-sm outline-0"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              >
                <option value="per_user">Per user</option>
                <option value="per_ip">Per IP</option>
                <option value="global">Global (all callers)</option>
              </select>
            </FormField>
            <FormField label="Window (seconds)">
              <input
                type="number"
                min={5}
                value={form.window_seconds}
                onChange={e => setForm(f => ({ ...f, window_seconds: Number(e.target.value) }))}
                className="w-full text-sm outline-0"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </FormField>
            <FormField label="Max requests / window">
              <input
                type="number"
                min={1}
                value={form.max_requests}
                onChange={e => setForm(f => ({ ...f, max_requests: Number(e.target.value) }))}
                className="w-full text-sm outline-0"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </FormField>
            <FormField label="Description (optional)" span={2}>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this limit defending against?"
                className="w-full text-sm outline-0"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </FormField>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
              />
              Enabled
            </label>
            <div className="flex-1" />
            <button type="button" onClick={() => { setCreating(false); setEditing(null); setForm(BLANK_FORM) }}
              className="text-sm font-semibold px-3 py-2 rounded-lg"
              style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
              Cancel
            </button>
            <button type="button" onClick={() => void save()} disabled={busy === '__save__'}
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: busy === '__save__' ? 0.6 : 1 }}>
              {editing ? 'Save changes' : 'Create rule'}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted-2)' }}>
            Combine rules: e.g. a per-user rule AND a per-IP rule on the same route — the strictest wins.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl text-center py-12" style={{ background: 'var(--surface)', border: '1px dashed var(--line)' }}>
          <Gauge className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-2)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No rules yet. Add one above.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full min-w-[780px] text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>Route</Th>
                <Th>Scope</Th>
                <Th>Window</Th>
                <Th>Max / window</Th>
                <Th>Description</Th>
                <Th>Enabled</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td><code className="font-mono text-xs" style={{ color: 'var(--ink)' }}>{r.route}</code></Td>
                  <Td>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: 'var(--blue-bg)', color: '#4338CA' }}>
                      {r.scope.replace('_', ' ')}
                    </span>
                  </Td>
                  <Td>{r.window_seconds}s</Td>
                  <Td>{r.max_requests}</Td>
                  <Td>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {r.description ?? '—'}
                    </span>
                  </Td>
                  <Td>
                    <button type="button" onClick={() => void toggle(r)} disabled={busy === r.id}
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: r.enabled ? '#DCFCE7' : 'var(--surface-2)',
                        color: r.enabled ? '#15803D' : 'var(--muted)',
                      }}>
                      {r.enabled ? 'enabled' : 'disabled'}
                    </button>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(r)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(r.id)} disabled={busy === r.id}
                        className="text-xs font-semibold px-2 py-1 rounded-lg flex items-center"
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
  )
}

function FormField({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
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
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>
}
