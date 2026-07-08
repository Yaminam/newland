import { useEffect, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'

let channelCounter = 0

// Subscribe to postgres_changes on one or more tables and fire the callback
// when a row arrives or changes. Debounced so a burst of updates causes a
// single reload instead of N back-to-back queries.
export function useTableRealtime(
  tables: string[],
  onChange: () => void,
  options: { debounceMs?: number; events?: Array<'INSERT' | 'UPDATE' | 'DELETE'> } = {},
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cbRef = useRef(onChange)
  useEffect(() => { cbRef.current = onChange }, [onChange])

  useEffect(() => {
    const debounceMs = options.debounceMs ?? 400
    const events = options.events ?? ['INSERT', 'UPDATE']
    const channels = tables.map(table => {
      const ch = supabase.channel(`rt-${table}-${++channelCounter}`)
      for (const evt of events) {
        ch.on(
          'postgres_changes',
          { event: evt, schema: 'public', table },
          () => {
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => {
              cbRef.current()
            }, debounceMs)
          },
        )
      }
      ch.subscribe()
      return ch
    })
    return () => {
      if (timer.current) clearTimeout(timer.current)
      for (const c of channels) void supabase.removeChannel(c)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join('|')])
}
