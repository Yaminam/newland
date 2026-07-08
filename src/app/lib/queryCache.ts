// Lightweight in-memory stale-while-revalidate cache for Supabase queries.
//
// Why: every page mount fires full network fetches from scratch. This cache
// lets any hook serve the last-known result immediately (zero spinner on
// revisit) while re-fetching fresh data silently in the background.
//
// TTL is 2 minutes by default — short enough to stay fresh, long enough to
// make tab-switching and back-navigation feel instant.
//
// The store is module-level (singleton) so it persists across React renders
// but is cleared on logout via cacheClear().

const store = new Map<string, { data: unknown; ts: number }>()

export const CACHE_TTL = 2 * 60 * 1000  // 2 minutes

/** Return cached value or undefined if the key has never been set. */
export function cacheGet<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined
}

/** Write a value into the cache with the current timestamp. */
export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, ts: Date.now() })
}

/**
 * Returns true when there is no cached value, or the cached value is older
 * than ttlMs. A stale entry is still returned by cacheGet — the caller
 * should show it immediately and re-fetch in the background.
 */
export function cacheIsStale(key: string, ttlMs = CACHE_TTL): boolean {
  const entry = store.get(key)
  if (!entry) return true
  return Date.now() - entry.ts > ttlMs
}

/**
 * Delete cached entries.
 * - No argument: clear everything (call on logout).
 * - With a prefix string: delete only matching keys (e.g. 'pipeline:').
 */
export function cacheClear(prefix?: string): void {
  if (!prefix) { store.clear(); return }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}
