import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  id: string
  name: string
  isTyping: boolean
  lastSeen: string
}

/**
 * Hook for Supabase Realtime Presence in a specific room/channel.
 * Tracks who's online and typing status.
 */
export function usePresence(roomId: string | null) {
  const { user, profile } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const displayName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : null

  useEffect(() => {
    if (!roomId || !user) return

    const channel = supabase.channel(`presence:${roomId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()

        const users: PresenceUser[] = []
        for (const [_key, presences] of Object.entries(state)) {
          for (const p of presences as any[]) {
            if (p.id !== user.id) {
              users.push({
                id: p.id,
                name: p.name ?? 'Unknown',
                isTyping: p.is_typing ?? false,
                lastSeen: p.last_seen ?? new Date().toISOString(),
              })
            }
          }
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: displayName || user.email || 'Unknown',
            is_typing: false,
            last_seen: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomId, user?.id])

  const setTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user) return

    const name = displayName || user.email || 'Unknown'

    channelRef.current.track({
      id: user.id,
      name,
      is_typing: isTyping,
      last_seen: new Date().toISOString(),
    })

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.track({
          id: user.id,
          name,
          is_typing: false,
          last_seen: new Date().toISOString(),
        })
      }, 3000)
    }
  }, [user, displayName])

  return { onlineUsers, setTyping }
}
