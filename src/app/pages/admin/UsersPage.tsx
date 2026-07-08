import { useCallback, useEffect, useState } from 'react'
import { Search, ShieldCheck, Ban, AlertTriangle, UserMinus, KeyRound, Trash2, RefreshCw, Download, X, Eye, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { downloadCSV, timestampedFilename, useRowSelection } from '@/app/lib/adminBulk'
import { SavedViews } from '@/app/components/SavedViews'

type RoleFilter = 'all' | 'founder' | 'investor' | 'admin'
type ModFilter  = 'all' | 'active' | 'warned' | 'suspended' | 'banned' | 'deleted'

interface UserRow {
  id:              string
  email:           string | null
  first_name:      string | null
  last_name:       string | null
  role:            string | null
  access_role:     string | null
  created_at:      string | null
  deleted_at:      string | null
  moderation:      { status: string; suspend_until: string | null; reason: string | null } | null
}

interface OverviewPayload {
  profile:         Record<string, unknown>
  moderation:      Record<string, unknown> | null
  intros_sent:     number
  intros_received: number
  reports_against: number
  blocks_against:  number
  plan:            string
  subscription:    Record<string, unknown> | null
  error?:          string
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole]     = useState<RoleFilter>('all')
  const [mod,  setMod]      = useState<ModFilter>('all')
  const [rows, setRows]     = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const selection = useRowSelection(rows)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select(`
        id, email, first_name, last_name, role, access_role, created_at, deleted_at,
        moderation:user_moderation!user_id ( status, suspend_until, reason )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (role !== 'all') query = query.eq('role', role)
    if (mod === 'deleted') query = query.not('deleted_at', 'is', null)
    if (search.trim()) {
      const s = search.trim()
      query = query.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`)
    }

    const { data, error } = await query
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    let out = (data as unknown as UserRow[]) ?? []
    if (mod !== 'all' && mod !== 'deleted') {
      out = out.filter(u => (u.moderation?.status ?? 'active') === mod)
    }
    setRows(out)
    setLoading(false)
  }, [role, mod, search])

  useEffect(() => { void load() }, [load])

  async function bulkModerate(action: 'warn' | 'suspend' | 'ban') {
    if (selection.count === 0) return
    const reason = window.prompt(`Reason for bulk ${action} on ${selection.count} user${selection.count === 1 ? '' : 's'}?`)
    if (!reason) return
    if (!window.confirm(`Apply "${action}" to ${selection.count} user${selection.count === 1 ? '' : 's'}? This is audit-logged per user.`)) return

    setBulkBusy(action)
    let ok = 0, failed = 0
    for (const u of selection.selectedRows) {
      const body: Record<string, unknown> = { userId: u.id, action, reason }
      if (action === 'suspend') body.days = 7
      const { error } = await supabase.functions.invoke('admin-user-action', { body })
      if (error) failed++; else ok++
    }
    setBulkBusy(null)
    toast[failed === 0 ? 'success' : 'error'](`Bulk ${action}: ${ok} succeeded, ${failed} failed.`)
    selection.clear()
    void load()
  }

  async function bulkDelete() {
    if (selection.count === 0) return
    const reason = window.prompt(`Reason for permanently deleting ${selection.count} user${selection.count === 1 ? '' : 's'}? All data will be erased.`)
    if (!reason) return
    if (!window.confirm(`PERMANENTLY DELETE ${selection.count} user${selection.count === 1 ? '' : 's'}? This cannot be undone. All their data will be removed.`)) return

    setBulkBusy('delete')
    let ok = 0, failed = 0
    for (const u of selection.selectedRows) {
      const { error } = await supabase.functions.invoke('admin-delete-user', { body: { userId: u.id, reason } })
      if (error) failed++; else ok++
    }
    setBulkBusy(null)
    toast[failed === 0 ? 'success' : 'error'](`Bulk delete: ${ok} deleted, ${failed} failed.`)
    selection.clear()
    void load()
  }

  function exportCSV() {
    downloadCSV(rows, [
      { header: 'id',              accessor: r => r.id },
      { header: 'email',           accessor: r => r.email },
      { header: 'first_name',      accessor: r => r.first_name },
      { header: 'last_name',       accessor: r => r.last_name },
      { header: 'role',            accessor: r => r.role },
      { header: 'access_role',     accessor: r => r.access_role },
      { header: 'moderation',      accessor: r => r.moderation?.status ?? 'active' },
      { header: 'suspend_until',   accessor: r => r.moderation?.suspend_until },
      { header: 'joined',          accessor: r => r.created_at },
      { header: 'deleted_at',      accessor: r => r.deleted_at },
    ], timestampedFilename('users'))
    toast.success(`Exported ${rows.length} users.`)
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Users
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Search and moderate platform users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-2)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search email or name…"
              className="pl-9 pr-3 py-2 text-sm rounded-xl outline-0 min-w-[260px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            />
          </div>
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

      {selection.count > 0 && (
        <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--ink)', color: 'var(--ink)' }}>
          <span className="text-sm">
            <strong>{selection.count}</strong> selected
          </span>
          <div className="flex items-center gap-2">
            <BulkBtn onClick={() => void bulkModerate('warn')}     disabled={!!bulkBusy} busy={bulkBusy === 'warn'}     label="Warn"       tone="warn"   />
            <BulkBtn onClick={() => void bulkModerate('suspend')}  disabled={!!bulkBusy} busy={bulkBusy === 'suspend'}  label="Suspend 7d" tone="warn"   />
            <BulkBtn onClick={() => void bulkModerate('ban')}      disabled={!!bulkBusy} busy={bulkBusy === 'ban'}      label="Ban"        tone="danger" />
            <BulkBtn onClick={() => void bulkDelete()}             disabled={!!bulkBusy} busy={bulkBusy === 'delete'}   label="Delete"     tone="delete" />
            <button onClick={selection.clear} className="ml-1 flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--muted-2)' }}>
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <Pills<RoleFilter> label="Role" value={role} onChange={setRole}
          options={[['all','All'],['founder','Founders'],['investor','Investors'],['admin','Admins']]} />
        <Pills<ModFilter> label="Status" value={mod} onChange={setMod}
          options={[['all','All'],['active','Active'],['warned','Warned'],['suspended','Suspended'],['banned','Banned'],['deleted','Deleted']]} />
      </div>

      <div className="mb-4">
        <SavedViews<{ role: RoleFilter; mod: ModFilter; search: string }>
          scope="users"
          current={{ role, mod, search }}
          onApply={f => {
            if (f.role !== undefined)   setRole(f.role as RoleFilter)
            if (f.mod !== undefined)    setMod(f.mod as ModFilter)
            if (f.search !== undefined) setSearch(String(f.search ?? ''))
          }}
        />
      </div>

      <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full min-w-[720px] text-sm">
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
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Moderation</Th>
              <Th>Joined</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No users match.</td></tr>
            ) : rows.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selection.isSelected(u.id)}
                    onChange={() => selection.toggle(u.id)}
                    aria-label={`Select ${u.email ?? u.id}`}
                  />
                </Td>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || u.id.slice(0, 8)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{u.email ?? '—'}</p>
                </Td>
                <Td>
                  <p style={{ color: 'var(--ink)' }}>{u.role ?? '—'}</p>
                  {u.access_role && u.access_role !== 'user' && (
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: '#6366F1' }}>
                      {u.access_role.toUpperCase()}
                    </p>
                  )}
                </Td>
                <Td>
                  {u.deleted_at ? <ModPill status="deleted" /> : <ModPill status={u.moderation?.status ?? 'active'} />}
                  {u.moderation?.suspend_until && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      until {new Date(u.moderation.suspend_until).toLocaleDateString()}
                    </p>
                  )}
                </Td>
                <Td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</Td>
                <Td>
                  <button type="button" onClick={() => setSelected(u)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
                    Open
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load() }}
        />
      )}
    </div>
  )
}

function Pills<T extends string>({ label, value, onChange, options }: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.06em] mb-1.5" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {options.map(([v, lbl]) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: value === v ? 'var(--surface)' : 'transparent',
              color:      value === v ? 'var(--ink)' : 'var(--muted)',
            }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string }> = {
    active:    { bg: '#DCFCE7', color: 'var(--pos)' },
    warned:    { bg: '#FEF3C7', color: '#B45309' },
    suspended: { bg: '#FFEDD5', color: '#C2410C' },
    banned:    { bg: '#FEE2E2', color: '#B91C1C' },
    deleted:   { bg: 'var(--surface-2)', color: 'var(--muted)' },
  }
  const t = tones[status] ?? tones.active
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

function UserDrawer({ user, onClose, onDone }: {
  user: UserRow
  onClose: () => void
  onDone: () => void
}) {
  const [overview, setOverview] = useState<OverviewPayload | null>(null)
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase.rpc('admin_user_overview', { p_user_id: user.id })
      if (!mounted) return
      if (error) { toast.error(error.message); setLoading(false); return }
      setOverview(data as OverviewPayload)
      setLoading(false)
    }
    void load()
    return () => { mounted = false }
  }, [user.id])

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (['suspend', 'ban', 'soft_delete'].includes(action)) {
      const ok = window.confirm(`Confirm "${action}" on ${user.email}? This is audit-logged.`)
      if (!ok) return
    }
    setWorking(action)
    const { error } = await supabase.functions.invoke('admin-user-action', {
      body: { userId: user.id, action, ...extra },
    })
    setWorking(null)
    if (error) {
      const ctx = (error as { context?: Response }).context
      let serverMsg: string | undefined
      try {
        if (ctx && typeof ctx.json === 'function') {
          const body = (await ctx.json()) as { error?: string; message?: string }
          serverMsg = body.message ?? body.error
        }
      } catch { /* ignore */ }
      toast.error(serverMsg ?? `Failed: ${action}`)
      return
    }
    toast.success(`${action.replace('_', ' ')} applied.`)
    onDone()
  }

  const currentStatus = overview?.moderation && typeof overview.moderation === 'object'
    ? ((overview.moderation as { status?: string }).status ?? 'active')
    : 'active'

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="w-full sm:max-w-xl bg-white h-full overflow-y-auto" onClick={e => e.stopPropagation()}
        style={{ borderLeft: '1px solid var(--line)' }}>
        <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || user.id.slice(0, 8)}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{user.email}</p>
            </div>
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading overview…</div>
        ) : !overview || overview.error ? (
          <div className="p-8 text-center" style={{ color: '#B91C1C' }}>Failed to load.</div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Intros sent"     value={overview.intros_sent} />
              <Stat label="Intros received" value={overview.intros_received} />
              <Stat label="Reports"         value={overview.reports_against} />
              <Stat label="Blocks"          value={overview.blocks_against} />
            </div>

            <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>Moderation</p>
              <div className="flex items-center gap-2 mt-1.5">
                <ModPill status={user.deleted_at ? 'deleted' : currentStatus} />
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  Plan: {overview.plan}
                </span>
              </div>
              {user.moderation?.reason && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  Reason: {user.moderation.reason}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--muted)' }}>
                Moderation actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ActBtn icon={AlertTriangle} label="Warn" tone="warn"
                  disabled={!!working} loading={working === 'warn'}
                  onClick={() => {
                    const reason = window.prompt('Reason for warning?')
                    if (!reason) return
                    void act('warn', { reason })
                  }}
                />
                <ActBtn icon={UserMinus} label="Suspend 7d" tone="warn"
                  disabled={!!working || currentStatus === 'suspended'}
                  loading={working === 'suspend'}
                  onClick={() => {
                    const reason = window.prompt('Reason for suspension?')
                    if (!reason) return
                    void act('suspend', { reason, days: 7 })
                  }}
                />
                <ActBtn icon={ShieldCheck} label="Unsuspend / Unban" tone="neutral"
                  disabled={!!working || (currentStatus !== 'suspended' && currentStatus !== 'banned')}
                  loading={working === 'unsuspend' || working === 'unban'}
                  onClick={() => void act(currentStatus === 'banned' ? 'unban' : 'unsuspend')}
                />
                <ActBtn icon={Ban} label="Ban" tone="danger"
                  disabled={!!working || currentStatus === 'banned'}
                  loading={working === 'ban'}
                  onClick={() => {
                    const reason = window.prompt('Reason for ban (permanent)?')
                    if (!reason) return
                    void act('ban', { reason })
                  }}
                />
                <ActBtn icon={KeyRound} label="Send reset email" tone="neutral"
                  disabled={!!working}
                  loading={working === 'reset_password'}
                  onClick={() => void act('reset_password')}
                />
                <ActBtn icon={UserMinus} label="Soft delete (hide)" tone="danger"
                  disabled={!!working || !!user.deleted_at}
                  loading={working === 'soft_delete'}
                  onClick={() => {
                    const reason = window.prompt('Reason for soft-delete? (hides user but keeps data)')
                    if (!reason) return
                    void act('soft_delete', { reason })
                  }}
                />
                <ActBtn icon={Trash2} label="Delete account (permanent)" tone="delete"
                  disabled={!!working}
                  loading={working === 'hard_delete'}
                  onClick={async () => {
                    const reason = window.prompt('Reason for PERMANENT deletion? All data will be erased and the user can re-register fresh.')
                    if (!reason) return
                    if (!window.confirm(`PERMANENTLY DELETE ${user.email}? This cannot be undone.`)) return
                    setWorking('hard_delete')
                    const { error } = await supabase.functions.invoke('admin-delete-user', {
                      body: { userId: user.id, reason },
                    })
                    setWorking(null)
                    if (error) { toast.error(error.message || 'Delete failed'); return }
                    toast.success('User permanently deleted.')
                    onDone()
                  }}
                />
                <ActBtn icon={FileDown} label="Export user data (GDPR)" tone="neutral"
                  disabled={!!working}
                  loading={working === 'export'}
                  onClick={async () => {
                    const reason = window.prompt('Reason for the export (ticket #, user request, etc.)?')
                    if (!reason) return
                    setWorking('export')
                    try {
                      const { data: { session } } = await supabase.auth.getSession()
                      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-user`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
                          'Authorization': `Bearer ${session?.access_token ?? ''}`,
                        },
                        body: JSON.stringify({ userId: user.id, reason }),
                      })
                      if (!resp.ok) {
                        const msg = await resp.text().catch(() => resp.statusText)
                        toast.error(`Export failed: ${msg}`)
                        return
                      }
                      const blob = await resp.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `cc-user-export-${user.id}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                      toast.success('User data exported.')
                    } finally {
                      setWorking(null)
                    }
                  }}
                />
                <ActBtn icon={Eye} label="Log in as user" tone="neutral"
                  disabled={!!working || !!user.deleted_at || user.access_role === 'admin'}
                  loading={working === 'impersonate'}
                  onClick={async () => {
                    const reason = window.prompt('Reason for logging in as this user (support ticket #, bug repro, etc.)?')
                    if (!reason) return
                    setWorking('impersonate')
                    // One-time nonce stored in localStorage so the impersonation
                    // banner can verify the link was generated by a real admin
                    // action — not spoofed via ?impersonation=1 in the URL.
                    const nonce = crypto.randomUUID()
                    localStorage.setItem('cc:imp:nonce', nonce)
                    const redirectTo = `${window.location.origin}/dashboard?impersonation=1&_n=${nonce}`
                    const { data, error } = await supabase.functions.invoke('admin-impersonate', {
                      body: { userId: user.id, reason, redirectTo },
                    })
                    setWorking(null)
                    if (error) {
                      localStorage.removeItem('cc:imp:nonce')
                      toast.error(error.message || 'Impersonation failed.')
                      return
                    }
                    const resp = data as { success?: boolean; actionLink?: string; error?: string }
                    if (!resp?.success || !resp.actionLink) {
                      localStorage.removeItem('cc:imp:nonce')
                      toast.error(resp?.error ?? 'Impersonation failed.')
                      return
                    }
                    window.open(resp.actionLink, '_blank', 'noopener,noreferrer')
                    toast.success('Signed in as user in a new tab. Close that tab to end.')
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>{value}</p>
    </div>
  )
}

function BulkBtn({ label, tone, onClick, disabled, busy }: {
  label: string; tone: 'warn' | 'danger' | 'delete'; onClick: () => void; disabled: boolean; busy: boolean
}) {
  const tones = {
    warn:   { bg: 'var(--warn)', text: 'var(--surface)' },
    danger: { bg: 'var(--neg)', text: 'var(--surface)' },
    delete: { bg: '#7f1d1d', text: '#fff' },
  } as const
  const t = tones[tone]
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity"
      style={{ background: t.bg, color: t.text, opacity: disabled || busy ? 0.6 : 1 }}>
      {busy ? 'Working…' : label}
    </button>
  )
}

function ActBtn({ icon: Icon, label, tone, onClick, disabled, loading }: {
  icon: React.ElementType
  label: string
  tone: 'warn' | 'danger' | 'neutral' | 'delete'
  onClick: () => void
  disabled: boolean
  loading: boolean
}) {
  const tones = {
    warn:    { bg: 'var(--warn-bg)', color: '#B45309', border: 'var(--warning-border)' },
    danger:  { bg: 'var(--neg-bg)', color: '#B91C1C', border: 'var(--danger-border)' },
    neutral: { bg: 'var(--surface)', color: 'var(--ink)', border: 'var(--line)' },
    delete:  { bg: '#fef2f2', color: '#7f1d1d', border: '#fca5a5' },
  } as const
  const t = tones[tone]
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-opacity"
      style={{
        background: t.bg, color: t.color, border: `1px solid ${t.border}`,
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      <Icon className="w-4 h-4" />
      {loading ? 'Working…' : label}
    </button>
  )
}
