import { useState, useEffect } from 'react'
import { Calendar, RefreshCw, Unlink, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/Button'
import type { CalendarConnection, CalendarEvent } from '@/app/hooks/useCRM'

interface Props {
  connections: CalendarConnection[]
  events: CalendarEvent[]
  onConnect: (provider: 'google' | 'outlook') => Promise<any>
  onDisconnect: (provider: 'google' | 'outlook') => Promise<void>
  onSync: (provider: 'google' | 'outlook') => Promise<any>
  onLoadEvents: (contactId?: string) => Promise<void>
}

const PROVIDERS = [
  {
    key: 'google' as const,
    label: 'Google Calendar',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.1a7.12 7.12 0 010-4.2V7.06H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.06l3.66-2.84V14.1z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: '#4285F4',
  },
  {
    key: 'outlook' as const,
    label: 'Outlook Calendar',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583a.793.793 0 01-.583.238h-8.508v-12.5h8.508c.23 0 .424.08.583.238.159.159.238.353.238.583zM7.96 5.89a4.49 4.49 0 013.18 1.317A4.49 4.49 0 0112.46 10.4a4.49 4.49 0 01-1.317 3.192A4.49 4.49 0 017.96 14.91a4.49 4.49 0 01-3.192-1.317A4.49 4.49 0 013.46 10.4a4.49 4.49 0 011.308-3.192A4.49 4.49 0 017.96 5.89zM0 7.387c0-.23.08-.424.238-.583A.793.793 0 01.821 6.566H5.37v12.5H.821a.793.793 0 01-.583-.238A.793.793 0 010 18.245z"/>
      </svg>
    ),
    color: '#0078D4',
  },
]

export function CalendarSettings({ connections, events, onConnect, onDisconnect, onSync, onLoadEvents }: Props) {
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    onLoadEvents()

    // Listen for OAuth popup completion
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'calendar-connected') {
        toast.success(`${e.data.provider === 'google' ? 'Google' : 'Outlook'} Calendar connected!`)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleSync = async (provider: 'google' | 'outlook') => {
    setSyncing(provider)
    const result = await onSync(provider)
    setSyncing(null)
    if (result?.synced != null) {
      toast.success(`Synced ${result.synced} events from ${provider === 'google' ? 'Google' : 'Outlook'}`)
    } else if (result?.error) {
      toast.error(result.error)
    }
  }

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    if (!confirm(`Disconnect ${provider === 'google' ? 'Google' : 'Outlook'} Calendar?`)) return
    await onDisconnect(provider)
    toast.success('Calendar disconnected')
  }

  const connectedProviders = new Set(connections.map(c => c.provider))

  return (
    <div className="space-y-4">
      {/* Connection cards */}
      <div className="space-y-3">
        {PROVIDERS.map(p => {
          const conn = connections.find(c => c.provider === p.key)
          const isConnected = !!conn

          return (
            <div
              key={p.key}
              className="flex items-center gap-3 p-3.5 rounded-[var(--r-md)]"
              style={{
                background: isConnected ? `${p.color}08` : 'var(--surface-2)',
                border: `1px solid ${isConnected ? `${p.color}30` : 'var(--line)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center shrink-0"
                style={{ background: isConnected ? `${p.color}15` : 'var(--bg-soft)' }}
              >
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {p.label}
                </p>
                {isConnected ? (
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {conn.calendar_email ?? 'Connected'}
                    {conn.last_synced_at && (
                      <> &middot; Synced {new Date(conn.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </p>
                ) : (
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    Not connected
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={RefreshCw}
                      onClick={() => handleSync(p.key)}
                      disabled={syncing === p.key}
                    >
                      {syncing === p.key ? 'Syncing...' : 'Sync'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={Unlink}
                      onClick={() => handleDisconnect(p.key)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onConnect(p.key)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent calendar events */}
      {events.length > 0 && (
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: 'var(--muted-2)' }}
          >
            Recent Calendar Events
          </p>
          <div className="space-y-1.5">
            {events.slice(0, 10).map(evt => (
              <div
                key={evt.id}
                className="flex items-center gap-2.5 p-2.5 rounded-[var(--r-sm)]"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                    {evt.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {new Date(evt.start_time).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    {evt.contact_id && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--pos-bg, #dcfce7)', color: 'var(--pos)' }}
                      >
                        Linked
                      </span>
                    )}
                    {evt.is_logged && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                      >
                        Logged
                      </span>
                    )}
                  </div>
                </div>
                {evt.meeting_link && (
                  <a
                    href={evt.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {connections.length > 0 && events.length === 0 && (
        <div className="text-center py-6">
          <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
            No events synced yet. Click "Sync" to fetch your calendar events.
          </p>
        </div>
      )}
    </div>
  )
}
