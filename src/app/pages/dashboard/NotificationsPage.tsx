import { useCallback, useEffect, useState } from 'react'
import { SEO } from '@/app/components/SEO'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { EmptyState } from '@/app/components/ui/EmptyState'

interface NotifRow {
  id:         string
  type:       string
  title:      string
  body:       string | null
  action_url: string | null
  read:       boolean
  payload:    Record<string, unknown> | null
  created_at: string
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [rows, setRows]       = useState<NotifRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    let q = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter === 'unread') q = q.eq('read', false)
    const { data } = await q
    setRows((data ?? []) as NotifRow[])
    setLoading(false)
  }, [user, filter])

  useEffect(() => { void load() }, [load])

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    void load()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <SEO title="Notifications" path="/dashboard/notifications" noindex />
      <PageHeader
        title="Notifications"
        subtitle="Intros, system updates, application status changes, and admin alerts — all in one place."
        icon={<Bell className="w-5 h-5" />}
        action={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              {(['all','unread'] as const).map(v => (
                <button key={v} onClick={() => setFilter(v)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg capitalize"
                  style={{
                    background: filter === v ? 'var(--surface)' : 'transparent',
                    color:      filter === v ? 'var(--ink)' : 'var(--muted)',
                  }}>
                  {v}
                </button>
              ))}
            </div>
            <button onClick={() => void load()}
              className="card w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ color: 'var(--muted)' }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => void markAllRead()}
              className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-7 h-7 text-[var(--muted-2)]" />}
          title={filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
          description={filter === 'unread' ? 'All your notifications have been read.' : 'New notifications will appear here.'}
        />
      ) : (
        <ul className="space-y-2">
          {rows.map(n => {
            const body = (
              <div className="flex items-start gap-3 p-4">
                <span className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: n.read ? 'var(--faint)' : 'var(--blue)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{n.title}</p>
                  {n.body && (
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{n.body}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-2)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )
            const cardClass = 'block card rounded-2xl card-hover-lift'
            if (n.action_url) {
              return (
                <li key={n.id}>
                  <Link to={n.action_url} className={cardClass}
                    onClick={async () => {
                      if (!n.read) await supabase.from('notifications').update({ read: true }).eq('id', n.id)
                    }}>
                    {body}
                  </Link>
                </li>
              )
            }
            return (
              <li key={n.id} className={cardClass}>
                {body}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
