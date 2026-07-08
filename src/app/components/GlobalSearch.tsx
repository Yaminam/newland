import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, Building2, User, Newspaper,
  ArrowRight, Bell, Landmark, DollarSign, ExternalLink,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// Only allow http/https external URLs — block javascript:, data:, etc.
function isSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  section?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

type ResultKind = 'nav' | 'startup' | 'investor' | 'news' | 'event' | 'grant' | 'funding'

interface SearchResult {
  id: string
  kind: ResultKind
  label: string
  sublabel?: string
  to: string       // internal fallback route (navigate)
  href?: string    // external URL — opens in new tab when present
  icon?: React.ElementType
}

const KIND_LABELS: Record<ResultKind, string> = {
  nav:      'Navigation',
  startup:  'Startups',
  investor: 'Investors',
  news:     'News',
  event:    'Events',
  grant:    'Grants',
  funding:  'Funding Rounds',
}

// Order sections show up in the results list
const KIND_ORDER: ResultKind[] = ['nav', 'startup', 'investor', 'news', 'event', 'grant', 'funding']

// ─── Props ───────────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
  navItems: NavSection[]
  role?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose, navItems, role }: GlobalSearchProps) {
  const [query, setQuery]           = useState('')
  const [dataResults, setDataResults] = useState<SearchResult[]>([])
  const [loading, setLoading]       = useState(false)
  const [activeIdx, setActiveIdx]   = useState(0)

  const navigate    = useNavigate()
  const inputRef    = useRef<HTMLInputElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)
  const searchIdRef = useRef(0)

  // ── Nav items (flat) ───────────────────────────────────────────────────────
  const allNavItems = useMemo(
    () => navItems.flatMap(s => s.items.map(item => ({ ...item, section: s.title }))),
    [navItems],
  )

  // Synchronous nav match — no debounce needed
  const navMatches = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase()
    const src = q
      ? allNavItems.filter(i => i.label.toLowerCase().includes(q))
      : allNavItems.slice(0, 7)
    return src.map(item => ({
      id: `nav:${item.to}`,
      kind: 'nav' as ResultKind,
      label: item.label,
      sublabel: item.section,
      to: item.to,
      icon: item.icon,
    }))
  }, [query, allNavItems])

  // ── Combine + group ────────────────────────────────────────────────────────
  const { orderedGroups, flatList } = useMemo(() => {
    const all = [...navMatches, ...dataResults]
    const grouped = new Map<ResultKind, SearchResult[]>()
    for (const r of all) {
      if (!grouped.has(r.kind)) grouped.set(r.kind, [])
      grouped.get(r.kind)!.push(r)
    }
    const groups: Array<{ kind: ResultKind; items: SearchResult[] }> = []
    const flat: SearchResult[] = []
    for (const k of KIND_ORDER) {
      const items = grouped.get(k)
      if (items) {
        groups.push({ kind: k, items })
        flat.push(...items)
      }
    }
    return { orderedGroups: groups, flatList: flat }
  }, [navMatches, dataResults])

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setQuery('')
    setDataResults([])
    setActiveIdx(0)
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => { setActiveIdx(0) }, [flatList.length])

  // ── Async data search ──────────────────────────────────────────────────────
  const runDataSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed || trimmed.length < 2) {
      setDataResults([])
      setLoading(false)
      return
    }

    const myId = ++searchIdRef.current
    setLoading(true)

    // Supabase query builder returns PromiseLike, not Promise — wrap to satisfy TS2345
    const p = <T,>(q: PromiseLike<T>): Promise<T> => Promise.resolve(q)

    const tasks: Promise<SearchResult[]>[] = []

    // Startups — investors only
    if (role === 'investor') {
      tasks.push(
        p(supabase
          .from('founder_profiles')
          .select('id, company_name, sector')
          .not('company_name', 'is', null)
          .ilike('company_name', `%${trimmed}%`)
          .limit(5)
          .then(({ data }) =>
            (data ?? []).map(r => ({
              id: `startup:${r.id}`,
              kind: 'startup' as ResultKind,
              label: r.company_name,
              sublabel: r.sector ?? 'Startup',
              to: '/dashboard/marketplace',
              icon: Building2,
            })),
          )),
      )
    }

    // Investors — founders only
    if (role === 'founder') {
      tasks.push(
        p(supabase
          .from('scraped_investors')
          .select('id, name, institution, title')
          .or(`name.ilike.%${trimmed}%,institution.ilike.%${trimmed}%`)
          .limit(5)
          .then(({ data }) =>
            (data ?? []).map(r => ({
              id: `investor:${r.id}`,
              kind: 'investor' as ResultKind,
              label: r.name,
              sublabel: r.institution ?? r.title ?? 'Investor',
              to: '/dashboard/browse-investors',
              icon: User,
            })),
          )),
      )
    }

    // News — all roles
    tasks.push(
      p(supabase
        .from('news_articles')
        .select('id, title, category')
        .ilike('title', `%${trimmed}%`)
        .limit(3)
        .then(({ data }) =>
          (data ?? []).map(r => ({
            id: `news:${r.id}`,
            kind: 'news' as ResultKind,
            label: r.title,
            sublabel: r.category ?? 'News',
            to: '/dashboard/news-feed',
            icon: Newspaper,
          })),
        )),
    )

    // Events — founders only (uses scraped_events, same source as EventsPage)
    if (role === 'founder') {
      tasks.push(
        p(supabase
          .from('scraped_events')
          .select('id, title, event_type, organizer, registration_url, source_url')
          .eq('is_active', true)
          .ilike('title', `%${trimmed}%`)
          .limit(3)
          .then(({ data }) =>
            (data ?? []).map(r => ({
              id: `event:${r.id}`,
              kind: 'event' as ResultKind,
              label: r.title,
              sublabel: r.event_type ?? r.organizer ?? 'Event',
              to: '/dashboard/events',
              href: isSafeUrl(r.registration_url) ?? isSafeUrl(r.source_url),
              icon: Bell,
            })),
          )),
      )
    }

    // Grants — founders only
    if (role === 'founder') {
      tasks.push(
        p(supabase
          .from('grants')
          .select('id, program_name, provider, apply_url, source_url')
          .ilike('program_name', `%${trimmed}%`)
          .limit(3)
          .then(({ data }) =>
            (data ?? []).map(r => ({
              id: `grant:${r.id}`,
              kind: 'grant' as ResultKind,
              label: r.program_name,
              sublabel: r.provider ?? 'Grant',
              to: '/dashboard/grants',
              href: isSafeUrl(r.apply_url) ?? isSafeUrl(r.source_url),
              icon: Landmark,
            })),
          )),
      )
    }

    // Funding rounds — all roles
    tasks.push(
      p(supabase
        .from('funding_rounds')
        .select('id, company_name, sector, round_type, source_url')
        .ilike('company_name', `%${trimmed}%`)
        .limit(3)
        .then(({ data }) =>
          (data ?? []).map(r => ({
            id: `funding:${r.id}`,
            kind: 'funding' as ResultKind,
            label: r.company_name,
            sublabel: r.round_type
              ? `${r.round_type}${r.sector ? ` · ${r.sector}` : ''}`
              : (r.sector ?? 'Funding Round'),
            to: '/dashboard/funding-tracker',
            href: isSafeUrl(r.source_url),
            icon: DollarSign,
          })),
        )),
    )

    const results = (await Promise.all(tasks)).flat()
    if (myId !== searchIdRef.current) return // stale — a newer search superseded this one
    setDataResults(results)
    setLoading(false)
  }, [role])

  useEffect(() => {
    const t = setTimeout(() => runDataSearch(query), 200)
    return () => clearTimeout(t)
  }, [query, runDataSearch])

  // ── Scroll active item into view ───────────────────────────────────────────
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  // External URLs open in a new tab; internal routes use the router.
  const openResult = useCallback((r: SearchResult) => {
    if (r.href) {
      window.open(r.href, '_blank', 'noopener,noreferrer')
    } else {
      navigate(r.to)
    }
  }, [navigate])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, flatList.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const r = flatList[activeIdx]
        if (r) { openResult(r); onClose() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, flatList, activeIdx, openResult, onClose])

  const handleSelect = (r: SearchResult) => { openResult(r); onClose() }

  const showEmpty   = query.length >= 2 && !loading && flatList.length === 0
  const showResults = flatList.length > 0

  // ─────────────────────────────────────────────────────────────────────────
  // Render via portal so `position:fixed` is always relative to the viewport
  // even when a Framer Motion parent applies a CSS transform.
  // ─────────────────────────────────────────────────────────────────────────
  const palette = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.40)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
          />

          {/* Centering shell — fills viewport, uses flex to centre the card */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '10vh',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: 560,
                maxHeight: '68vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--sh-4)',
                pointerEvents: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Input row ─────────────────────────────────────────── */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0 16px', height: 56, flexShrink: 0,
                  borderBottom: '1px solid var(--line)',
                }}
              >
                {loading ? (
                  <div
                    className="animate-spin"
                    style={{
                      width: 16, height: 16, borderRadius: '50%',
                      border: '2px solid var(--blue)',
                      borderTopColor: 'transparent',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Search style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--muted)' }} />
                )}

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages, startups, investors, news, events…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    outline: 'none', fontSize: 15, color: 'var(--ink)',
                    fontFamily: 'inherit',
                  }}
                />

                {query ? (
                  <button
                    onMouseDown={e => { e.preventDefault(); setQuery('') }}
                    style={{
                      flexShrink: 0, width: 24, height: 24, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: 'var(--r-md)', border: 'none',
                      background: 'var(--surface-2)', cursor: 'pointer',
                      color: 'var(--muted)',
                    }}
                  >
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                ) : (
                  <kbd style={{
                    flexShrink: 0, padding: '2px 6px', fontSize: 10,
                    fontWeight: 600, borderRadius: 6,
                    border: '1px solid var(--line)',
                    color: 'var(--muted-2)', background: 'var(--surface-2)',
                    fontFamily: 'inherit',
                  }}>
                    ESC
                  </kbd>
                )}
              </div>

              {/* ── Results list ──────────────────────────────────────── */}
              {showResults && (
                <div
                  ref={listRef}
                  style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}
                  className="cc-no-scrollbar"
                >
                  {!query && (
                    <p style={{
                      padding: '8px 16px 4px',
                      fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'var(--muted-2)',
                    }}>
                      Quick links
                    </p>
                  )}

                  {orderedGroups.map(({ kind, items }, groupIdx) => {
                    const startIdx = orderedGroups
                      .slice(0, groupIdx)
                      .reduce((acc, g) => acc + g.items.length, 0)

                    return (
                      <div key={kind}>
                        {query && (
                          <p style={{
                            padding: '10px 16px 4px',
                            fontSize: 10, fontWeight: 600,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: 'var(--muted-2)',
                          }}>
                            {KIND_LABELS[kind]}
                          </p>
                        )}

                        {items.map((r, i) => {
                          const idx      = startIdx + i
                          const isActive = idx === activeIdx
                          const Icon     = r.icon
                          return (
                            <button
                              key={r.id}
                              data-idx={idx}
                              onMouseEnter={() => setActiveIdx(idx)}
                              onClick={() => handleSelect(r)}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                gap: 12, padding: '10px 16px', textAlign: 'left',
                                background: isActive ? 'var(--blue-bg)' : 'transparent',
                                border: 'none', cursor: 'pointer', transition: 'background 0.1s',
                              }}
                            >
                              {Icon && (
                                <div style={{
                                  width: 30, height: 30, flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  borderRadius: 'var(--r-md)',
                                  background: isActive
                                    ? 'color-mix(in srgb, var(--blue) 14%, transparent)'
                                    : 'var(--surface-2)',
                                  color: isActive ? 'var(--blue)' : 'var(--muted)',
                                }}>
                                  <Icon style={{ width: 14, height: 14 }} />
                                </div>
                              )}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  margin: 0, fontSize: 14, fontWeight: 500,
                                  color: isActive ? 'var(--blue)' : 'var(--ink)',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {r.label}
                                </p>
                                {r.sublabel && (
                                  <p style={{
                                    margin: 0, fontSize: 11,
                                    color: isActive
                                      ? 'color-mix(in srgb, var(--blue) 65%, transparent)'
                                      : 'var(--muted)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {r.sublabel}
                                  </p>
                                )}
                              </div>

                              {r.href ? (
                                <ExternalLink style={{
                                  width: 12, height: 12, flexShrink: 0,
                                  color: isActive ? 'var(--blue)' : 'var(--muted-2)',
                                  transition: 'color 0.1s',
                                }} />
                              ) : (
                                <ArrowRight style={{
                                  width: 14, height: 14, flexShrink: 0,
                                  color: 'var(--blue)',
                                  opacity: isActive ? 1 : 0,
                                  transition: 'opacity 0.1s',
                                }} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Empty state ───────────────────────────────────────── */}
              {showEmpty && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '40px 16px',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--surface-2)', marginBottom: 12,
                  }}>
                    <Search style={{ width: 20, height: 20, color: 'var(--muted-2)' }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                    No results
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                    Try a different search term
                  </p>
                </div>
              )}

              {/* ── Footer ───────────────────────────────────────────── */}
              {(showResults || showEmpty) && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '8px 16px', flexShrink: 0,
                  borderTop: '1px solid var(--line)',
                  color: 'var(--muted-2)', fontSize: 10,
                }}>
                  {([['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']] as [string, string][]).map(([key, label]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <kbd style={{
                      fontSize: 9, padding: '1px 4px', borderRadius: 4,
                      border: '1px solid var(--line)', background: 'var(--surface-2)',
                      fontFamily: 'monospace',
                    }}>
                      {key}
                    </kbd>
                    {label}
                  </span>
                ))}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(palette, document.body)
}
