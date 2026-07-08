import { useCallback, useEffect, useState } from 'react'
import { Copy, Plus, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'

interface AdminRow {
  id:          string
  email:       string | null
  first_name:  string | null
  last_name:   string | null
  created_at:  string
  last_seen_at: string | null
}

export function AdminsPage() {
  const { user } = useAuth()
  const [rows, setRows]       = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm]       = useState({ email: '', firstName: '', lastName: '' })
  const [tempCred, setTempCred] = useState<{ email: string; password: string; created: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, created_at, last_seen_at')
      .eq('access_role', 'admin')
      .order('created_at', { ascending: true })
    if (error) { toast.error(error.message); setLoading(false); return }
    setRows((data ?? []) as AdminRow[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function invite() {
    if (!form.email.trim()) { toast.error('Email required.'); return }
    setBusy('__invite__')
    const { data, error } = await supabase.functions.invoke('admin-manage-admins', {
      body: {
        action: 'invite',
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
      },
    })
    setBusy(null)
    if (error) { toast.error(error.message || 'Failed to invite admin.'); return }
    const resp = data as { success?: boolean; action?: string; email?: string; temporaryPassword?: string; error?: string }
    if (!resp?.success) { toast.error(resp?.error ?? 'Invite failed.'); return }
    setTempCred({
      email: resp.email ?? form.email,
      password: resp.temporaryPassword ?? '',
      created: resp.action === 'created',
    })
    setForm({ email: '', firstName: '', lastName: '' })
    setCreating(false)
    void load()
  }

  async function revoke(profileId: string) {
    if (!window.confirm('Revoke admin access for this user? They will lose access to /admin/* immediately.')) return
    setBusy(profileId)
    const { data, error } = await supabase.functions.invoke('admin-manage-admins', {
      body: { action: 'revoke', profileId },
    })
    setBusy(null)
    if (error) { toast.error(error.message || 'Failed to revoke.'); return }
    const resp = data as { success?: boolean; error?: string }
    if (!resp?.success) { toast.error(resp?.error ?? 'Revoke failed.'); return }
    toast.success('Admin access revoked.')
    void load()
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text)
    toast.success('Copied.')
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <header className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Admin team
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Accounts with <code className="text-xs px-1 rounded" style={{ background: 'var(--surface-2)' }}>access_role = admin</code>.
            They have full platform access and cannot sign in on mobile.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(v => !v)}
          className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--ink)', color: 'var(--surface)' }}
        >
          <Plus className="w-4 h-4" />
          Invite admin
        </button>
      </header>

      {creating && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div className="grid md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
            <Field label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="person@foundercentral.in" />
            <Field label="First name" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Field label="Last name"  value={form.lastName}  onChange={v => setForm(f => ({ ...f, lastName: v }))} />
            <button
              type="button"
              onClick={() => void invite()}
              disabled={busy === '__invite__'}
              className="text-sm font-semibold px-4 rounded-lg transition-colors flex items-center gap-1.5"
              style={{ height: 38, background: 'var(--blue)', color: 'var(--surface)', opacity: busy === '__invite__' ? 0.6 : 1 }}
            >
              <UserPlus className="w-4 h-4" />
              {busy === '__invite__' ? 'Inviting…' : 'Invite'}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted-2)' }}>
            A strong temporary password will be generated. Share it with the invitee out-of-band — they can change it after signing in.
          </p>
        </div>
      )}

      {tempCred && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--warn-bg)', border: '1px solid #FCD34D' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>
            {tempCred.created ? 'Admin account created' : 'Password reset — existing user promoted to admin'}
          </p>
          <p className="text-xs mb-3" style={{ color: '#78350F' }}>
            Copy these credentials now. This banner disappears when you dismiss it — the password cannot be retrieved later.
          </p>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <CredRow label="Email"    value={tempCred.email}    onCopy={() => copy(tempCred.email)} />
            <CredRow label="Password" value={tempCred.password} onCopy={() => copy(tempCred.password)} mono />
          </div>
          <button
            type="button"
            onClick={() => setTempCred(null)}
            className="mt-3 text-xs font-semibold"
            style={{ color: '#92400E' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Admin</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Email</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Created</th>
                <th className="text-left font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}>Last seen</th>
                <th className="text-right font-semibold px-4 py-2.5 text-xs uppercase tracking-[0.05em]" style={{ color: 'var(--muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const isMe = r.id === user?.id
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" style={{ color: 'var(--pos)' }} />
                        <span style={{ color: 'var(--ink)' }}>
                          {[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: '#DBEAFE', color: 'var(--blue-h)' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--muted)' }}>{r.email ?? '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-2)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-2)' }}>
                      {r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void revoke(r.id)}
                        disabled={busy === r.id || isMe}
                        className="text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                        style={{
                          color:   isMe ? 'var(--faint)' : 'var(--neg)',
                          cursor:  isMe ? 'not-allowed' : 'pointer',
                          opacity: busy === r.id ? 0.6 : 1,
                        }}
                        title={isMe ? 'You cannot revoke your own admin access' : 'Revoke admin'}
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-2)' }}>
                    No admins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.05em] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm outline-0"
        style={{ height: 38, padding: '0 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}
      />
    </div>
  )
}

function CredRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid #FCD34D' }}>
      <span className="text-xs font-semibold uppercase tracking-[0.05em]" style={{ color: '#92400E' }}>{label}</span>
      <span className={`flex-1 truncate ${mono ? 'font-mono text-xs' : 'text-sm'}`} style={{ color: 'var(--ink)' }}>{value}</span>
      <button type="button" onClick={onCopy} className="shrink-0" title="Copy">
        <Copy className="w-3.5 h-3.5" style={{ color: '#92400E' }} />
      </button>
    </div>
  )
}
