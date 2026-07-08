import { useCallback, useEffect, useState } from 'react'
import { Plus, ToggleRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { invalidateFeatureFlagCache } from '@/app/hooks/useFeatureFlag'

interface FlagRow {
  key:         string
  enabled:     boolean
  description: string | null
  updated_by:  string | null
  updated_at:  string
  created_at:  string
}

export function FlagsPage() {
  const [rows, setRows]         = useState<FlagRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [busy, setBusy]         = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey]     = useState('')
  const [newDesc, setNewDesc]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled, description, updated_by, updated_at, created_at')
      .order('key')
    if (error) { toast.error(error.message); setLoading(false); return }
    setRows((data ?? []) as FlagRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggle(key: string, next: boolean) {
    setBusy(key)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: next, updated_by: user?.id ?? null })
      .eq('key', key)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    invalidateFeatureFlagCache(key)
    toast.success(`${key} ${next ? 'enabled' : 'disabled'}.`)
    void load()
  }

  async function create() {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, '_')
    if (!/^[a-z0-9_]{3,64}$/.test(key)) {
      toast.error('Key must be 3–64 chars, lowercase letters, digits, and underscores.')
      return
    }
    setBusy('__create__')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('feature_flags')
      .insert({
        key,
        enabled: false,
        description: newDesc.trim() || null,
        updated_by: user?.id ?? null,
      })
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success(`Flag "${key}" created (disabled by default).`)
    setNewKey(''); setNewDesc(''); setCreating(false)
    void load()
  }

  async function remove(key: string) {
    if (!window.confirm(`Delete flag "${key}"? Any code reading this flag will fall back to its default.`)) return
    setBusy(key)
    const { error } = await supabase.from('feature_flags').delete().eq('key', key)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    invalidateFeatureFlagCache(key)
    toast.success('Deleted.')
    void load()
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Feature flags
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Toggle features on or off without shipping a release.
            Code reads flags via <code className="text-xs px-1 rounded" style={{ background: 'var(--surface-2)' }}>useFeatureFlag(key)</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(v => !v)}
          className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--ink)', color: 'var(--surface)' }}
        >
          <Plus className="w-4 h-4" />
          New flag
        </button>
      </header>

      {creating && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Key
              </label>
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="some_new_feature"
                className="w-full text-sm outline-0 font-mono"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="What does this gate?"
                className="w-full text-sm outline-0"
                style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
              />
            </div>
            <button
              type="button"
              onClick={() => void create()}
              disabled={busy === '__create__'}
              className="text-sm font-semibold px-4 rounded-lg transition-colors"
              style={{ height: 38, background: 'var(--blue)', color: 'var(--surface)', opacity: busy === '__create__' ? 0.6 : 1 }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl text-center py-12" style={{ background: 'var(--surface)', border: '1px dashed var(--line)' }}>
          <ToggleRight className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-2)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No flags yet. Create one above.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Key</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Description</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Updated</th>
                <th className="text-center font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>State</th>
                <th className="text-right font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} style={{ borderTop: '1px solid var(--line)' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ink)' }}>{r.key}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{r.description ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-2)' }}>
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      on={r.enabled}
                      busy={busy === r.key}
                      onChange={v => void toggle(r.key, v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void remove(r.key)}
                      disabled={busy === r.key}
                      className="text-xs transition-colors"
                      style={{ color: 'var(--muted-2)' }}
                      title="Delete flag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, busy, onChange }: { on: boolean; busy: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="relative inline-flex items-center rounded-full transition-colors"
      style={{
        width: 40, height: 22,
        background: on ? 'var(--pos)' : 'var(--faint)',
        opacity: busy ? 0.6 : 1,
        cursor: busy ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform"
        style={{ width: 16, height: 16, transform: `translateX(${on ? 20 : 3}px)`, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
      />
    </button>
  )
}
