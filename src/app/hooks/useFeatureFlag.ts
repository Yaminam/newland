import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

// Client-side cache so multiple components reading the same flag on the same
// page don't each fire their own query.
const cache = new Map<string, boolean>()
const inflight = new Map<string, Promise<boolean>>()

async function fetchFlag(key: string): Promise<boolean> {
  if (cache.has(key)) return cache.get(key)!
  if (inflight.has(key)) return inflight.get(key)!
  const p: Promise<boolean> = (async () => {
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle()
    const enabled = Boolean(data?.enabled)
    cache.set(key, enabled)
    inflight.delete(key)
    return enabled
  })()
  inflight.set(key, p)
  return p
}

export function useFeatureFlag(key: string, fallback = false): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => cache.get(key) ?? fallback)
  useEffect(() => {
    let alive = true
    void fetchFlag(key).then(v => { if (alive) setEnabled(v) })
    return () => { alive = false }
  }, [key])
  return enabled
}

export function invalidateFeatureFlagCache(key?: string) {
  if (key) cache.delete(key)
  else cache.clear()
}
