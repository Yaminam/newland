import { useState, useRef, useEffect } from 'react'
import { Bell, Check, MessageCircle, TrendingUp, Eye, Bookmark, Download, Star, Info, X, RefreshCw, FileText, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotifIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: React.ElementType; color: string }> = {
    intro_request: { icon: MessageCircle, color: 'var(--blue)' },
    intro_accepted: { icon: Check, color: 'var(--pos)' },
    intro_declined: { icon: X, color: 'var(--neg)' },
    startup_viewed: { icon: Eye, color: '#59cbef' },
    startup_bookmarked: { icon: Bookmark, color: 'var(--warn)' },
    deck_downloaded: { icon: Download, color: '#3486e8' },
    deck_request: { icon: Lock, color: 'var(--warn)' },
    deck_approved: { icon: FileText, color: 'var(--pos)' },
    deck_declined: { icon: X, color: 'var(--neg)' },
    deck_evaluated: { icon: FileText, color: 'var(--blue)' },
    trust_badge_upgrade: { icon: Star, color: 'var(--warn)' },
    application_status: { icon: TrendingUp, color: 'var(--pos)' },
    new_funding_round: { icon: TrendingUp, color: 'var(--blue)' },
    event_reminder: { icon: Bell, color: 'var(--warn)' },
    system: { icon: Info, color: '#94a3b8' },
  }
  const cfg = icons[type] ?? icons.system
  const Icon = cfg.icon
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `${cfg.color}20` }}>
      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
    </div>
  )
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, refreshing, refresh, markAsRead, markAllRead } = useNotifications()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = async (notif: typeof notifications[0]) => {
    if (!notif.read) await markAsRead(notif.id)
    // Fall back to the full notifications page when no target is set so the
    // row is always clickable and users can see the full overview.
    navigate(notif.action_url ?? '/dashboard/notifications')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          color: 'var(--muted)',
        }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--neg)', color: 'white', border: '2px solid var(--surface)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--line)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Notifications</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { void refresh() }}
                  disabled={refreshing}
                  aria-label="Refresh notifications"
                  className="transition-opacity"
                  style={{ color: 'var(--muted-2)', opacity: refreshing ? 0.5 : 1 }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--blue)' }}>
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted-2)' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <button key={notif.id} onClick={() => handleNotifClick(notif)}
                    className="w-full flex items-start gap-3 p-4 transition-colors text-left"
                    style={{
                      background: notif.read ? 'transparent' : 'rgba(37,99,235,0.05)',
                      borderBottom: '1px solid var(--line)',
                    }}>
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
                          {notif.body}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: 'var(--muted-2)' }}>
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: 'var(--blue)' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
