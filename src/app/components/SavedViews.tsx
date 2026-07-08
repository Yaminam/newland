import { useCallback, useEffect, useState } from 'react'
import { Bookmark, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

interface SavedView {
  id:      string
  scope:   string
  name:    string
  filters: Record<string, unknown>
}

// Shared pill row for "Saved views" on admin pages. Callers pass the current
// filter state; clicking a view fires `onApply(filters)` so the page can
// restore them.
export function SavedViews<T extends Record<string, unknown>>({ scope, current, onApply }: {
  scope:   string
  current: T
  onApply: (filters: T) => void
}) {
  const [views, setViews]     = useState<SavedView[]>([])
  const [naming, setNaming]   = useState(false)
  const [name, setName]       = useState('')
  const [busy, setBusy]       = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('admin_saved_views')
      .select('id, scope, name, filters')
      .eq('scope', scope)
      .eq('owner_id', user.id)
      .order('sort_order')
      .order('name')
    if (error) { console.warn('saved views load:', error.message); return }
    setViews((data ?? []) as SavedView[])
  }, [scope])

  useEffect(() => { void load() }, [load])

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('Name required.'); return }
    setBusy('__save__')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(null); return }
    const { error } = await supabase
      .from('admin_saved_views')
      .upsert({
        owner_id: user.id,
        scope,
        name: trimmed,
        filters: current,
      }, { onConflict: 'owner_id,scope,name' })
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success(`Saved "${trimmed}".`)
    setName(''); setNaming(false)
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this saved view?')) return
    setBusy(id)
    const { error } = await supabase.from('admin_saved_views').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Bookmark className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-2)' }}>
        Saved views
      </span>
      {views.length === 0 && !naming && (
        <span className="text-xs" style={{ color: 'var(--muted-2)' }}>none yet —</span>
      )}
      {views.map(v => (
        <span key={v.id} className="inline-flex items-center gap-1 rounded-full pl-3 pr-1 py-1 text-xs font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>
          <button type="button" onClick={() => onApply(v.filters as T)}>{v.name}</button>
          <button type="button" onClick={() => void remove(v.id)} disabled={busy === v.id}
            className="ml-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ color: 'var(--muted-2)' }}
            title="Delete">
            <Trash2 className="w-3 h-3" />
          </button>
        </span>
      ))}
      {naming ? (
        <span className="inline-flex items-center gap-1 rounded-full px-1 py-1 text-xs"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void save(); if (e.key === 'Escape') { setNaming(false); setName('') } }}
            placeholder="View name…"
            className="text-xs px-2 outline-0"
            style={{ height: 22, width: 140, color: 'var(--ink)' }}
          />
          <button type="button" onClick={() => void save()} disabled={busy === '__save__'}
            className="text-xs font-semibold px-2 rounded-full" style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
            Save
          </button>
          <button type="button" onClick={() => { setNaming(false); setName('') }}
            className="w-5 h-5 rounded-full flex items-center justify-center" style={{ color: 'var(--muted)' }}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setNaming(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: 'var(--blue)' }}>
          <Plus className="w-3 h-3" />
          Save current
        </button>
      )}
    </div>
  )
}
