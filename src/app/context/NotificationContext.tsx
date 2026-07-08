import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from './AuthContext'

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  action_url: string | null
  read: boolean
  created_at: string
  payload: Record<string, unknown> | null
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  refreshing: boolean
  refresh: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

function isAppNotification(x: unknown): x is AppNotification {
  return (
    typeof x === 'object' && x !== null &&
    typeof (x as Record<string, unknown>).id === 'string' &&
    typeof (x as Record<string, unknown>).user_id === 'string' &&
    typeof (x as Record<string, unknown>).title === 'string'
  );
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, action_url, payload, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data as unknown as AppNotification[])
  }, [user])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try { await fetchNotifications() } finally { setRefreshing(false) }
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (isAppNotification(payload.new)) {
          setNotifications(prev => [payload.new as AppNotification, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchNotifications])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user!.id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const contextValue = useMemo(() => ({
    notifications, unreadCount, refreshing, refresh, markAsRead, markAllRead,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [notifications, unreadCount, refreshing])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
