import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper, ExternalLink, Clock, Search, RefreshCw,
  Zap, Tag, AlertCircle, X, Rss,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: string
  title: string
  url: string
  summary: string | null
  image_url: string | null
  source_name: string
  source_url: string
  published_at: string | null
  fetched_at: string
  category: string
  sector_tags: string[]
  is_featured: boolean
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  'All', 'AI', 'SaaS', 'Fintech', 'Healthtech', 'Deeptech', 'EV', 'Cleantech',
  'Climate', 'Edtech', 'Agritech', 'Ecommerce', 'Logistics', 'Biotech',
  'Blockchain', 'Cybersecurity', 'Proptech', 'Traveltech', 'HRtech',
  'Legaltech', 'FoodTech', 'Gaming', 'Defence', 'AdTech', 'B2B',
] as const

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  Funding:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  Acquisition: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  IPO:         { color: '#1d71ef', bg: 'rgba(124,58,237,0.12)' },
  People:      { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  Policy:      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  Technology:  { color: '#3486e8', bg: 'rgba(52,134,232,0.12)' },
  News:        { color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

// Source brand colours — deterministic, not random
const SOURCE_COLORS: Record<string, string> = {
  'Inc42':            '#3b82f6',
  'YourStory':        '#3486e8',
  'Economic Times':   '#10b981',
  'The Ken':          '#7c3aed',
  'Mint Startups':    '#59cbef',
  'Moneycontrol':     '#ef4444',
  'Hindu Business':   '#f59e0b',
  'Google News':      '#64748b',
}

function sourceColor(name: string): string {
  return SOURCE_COLORS[name] ?? '#94a3b8'
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date'
  const diff = Date.now() - new Date(dateStr).getTime()
  if (isNaN(diff)) return 'Unknown date'
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function lastUpdatedLabel(date: Date | null): string {
  if (!date) return ''
  const diff = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (diff < 1)  return 'Updated just now'
  if (diff < 60) return `Updated ${diff}m ago`
  return `Updated ${Math.floor(diff / 60)}h ago`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.News
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg }}>
      {category}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  const color = sourceColor(source)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {source}
    </span>
  )
}

function SectorTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  const visible = tags.slice(0, 3)
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(tag => (
        <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
          #{tag}
        </span>
      ))}
    </div>
  )
}

function Thumbnail({ url, source, size = 'sm' }: { url: string | null; source: string; size?: 'sm' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const color = sourceColor(source)
  const initial = source.charAt(0).toUpperCase()

  const dims = size === 'lg'
    ? 'w-full h-48 rounded-xl'
    : 'w-16 h-16 rounded-xl flex-shrink-0'

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className={`${dims} object-cover`}
      />
    )
  }

  return (
    <div className={`${dims} flex items-center justify-center text-lg font-bold`}
      style={{ background: `${color}20`, color }}>
      {initial}
    </div>
  )
}

// ─── Featured Card ────────────────────────────────────────────────────────────

function FeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden transition-all hover:shadow-lg group"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-muted)' }}
    >
      {/* Image banner */}
      {article.image_url ? (
        <div className="relative w-full overflow-hidden" style={{ maxHeight: 280 }}>
          <img
            src={article.image_url}
            alt=""
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ height: 280 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(8,13,26,0.9) 0%, rgba(8,13,26,0.3) 50%, transparent 100%)' }} />
          {/* Featured badge — overlaid on image */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: '#2563EB', color: 'white' }}>
              <Zap className="w-3 h-3" /> Featured
            </span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-36 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.05))' }}>
          <Newspaper className="w-12 h-12 opacity-20" style={{ color: 'var(--blue)' }} />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: '#2563EB', color: 'white' }}>
              <Zap className="w-3 h-3" /> Featured
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CategoryBadge category={article.category} />
          <SourceBadge source={article.source_name} />
          <span className="text-xs ml-auto flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" />
            {timeAgo(article.published_at)}
          </span>
        </div>

        <h2 className="text-base font-bold mb-2 leading-snug"
          style={{ color: 'var(--text-primary)' }}>
          {article.title}
        </h2>

        {article.summary && (
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between">
          <SectorTags tags={article.sector_tags} />
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold ml-auto"
            style={{ color: 'var(--blue)' }}>
            Read Full Article <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.a>
  )
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 p-4 rounded-2xl transition-all group"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        transition: 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#CBD5E1'
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--border-subtle)'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
      }}
    >
      <Thumbnail url={article.image_url} source={article.source_name} size="sm" />

      <div className="flex-1 min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <CategoryBadge category={article.category} />
          <SourceBadge source={article.source_name} />
          <span className="text-[11px] ml-auto flex-shrink-0 flex items-center gap-0.5"
            style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" />
            {timeAgo(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold mb-1.5 line-clamp-2 leading-snug"
          style={{ color: 'var(--text-primary)' }}>
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-xs mb-2 line-clamp-2 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}>
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <SectorTags tags={article.sector_tags} />
          <span className="inline-flex items-center gap-1 text-[11px] font-medium flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--blue)' }}>
            Read More <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </motion.a>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="w-full h-52" style={{ background: 'var(--bg-elevated)' }} />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-5 w-24 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
        </div>
        <div className="h-5 w-3/4 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-full rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-5/6 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4 rounded-2xl animate-pulse"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="w-16 h-16 rounded-xl flex-shrink-0" style={{ background: 'var(--bg-elevated)' }} />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
          <div className="h-4 w-20 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
        </div>
        <div className="h-4 w-full rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-4/5 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-3 w-3/5 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function NewsFeedPage() {
  const [articles, setArticles]           = useState<NewsArticle[]>([])
  const [featuredArticle, setFeatured]    = useState<NewsArticle | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null)

  // Filter state
  const [activeSector, setActiveSector]     = useState('All')
  const [searchQuery, setSearchQuery]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input — 300 ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  // Fetch from Supabase whenever filters change
  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50)

      if (activeSector !== 'All') {
        query = query.contains('sector_tags', [activeSector])
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('title', `%${debouncedSearch.trim()}%`)
      }

      const { data, error: sbError } = await query
      if (sbError) throw sbError

      const rows = (data ?? []) as NewsArticle[]
      setArticles(rows)

      // Featured: first article with is_featured=true; fallback to first article
      const featured = rows.find(a => a.is_featured) ?? null
      setFeatured(featured)

      setLastUpdated(new Date())
    } catch (err: unknown) {
      console.error('News fetch error:', err)
      setError('Failed to load news. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [activeSector, debouncedSearch])

  useEffect(() => { fetchNews() }, [fetchNews])

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Non-featured articles for the grid
  const gridArticles = featuredArticle
    ? articles.filter(a => a.id !== featuredArticle.id)
    : articles

  const hasActiveFilters = activeSector !== 'All' || searchQuery !== ''

  function clearFilters() {
    setActiveSector('All')
    setSearchQuery('')
    setDebouncedSearch('')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            News Feed
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            India startup &amp; VC ecosystem — refreshed every 6 hours
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              {lastUpdatedLabel(lastUpdated)}
            </span>
          )}
          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              opacity: loading ? 0.6 : 1,
            }}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search articles…"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sector filter */}
        <select
          value={activeSector}
          onChange={e => setActiveSector(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none shrink-0"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}>
          {SECTORS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>)}
        </select>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {/* Loading state */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <SkeletonFeatured />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {!loading && error && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="py-14 flex flex-col items-center gap-4 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Failed to load news</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{error}</p>
            </div>
            <button
              onClick={fetchNews}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#2563EB', color: 'white' }}>
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !error && articles.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="py-16 flex flex-col items-center gap-4 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(37,99,235,0.1)' }}>
              <Rss className="w-6 h-6" style={{ color: 'var(--blue)' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No articles found</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {hasActiveFilters
                  ? 'No articles match your current filters.'
                  : 'The news pipeline hasn\'t run yet, or there are no recent articles.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
          </motion.div>
        )}

        {/* Articles */}
        {!loading && !error && articles.length > 0 && (
          <motion.div key="articles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-4">

            {/* Featured card */}
            {featuredArticle && <FeaturedCard article={featuredArticle} />}

            {/* Grid */}
            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gridArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            )}

            {/* Source attribution footer */}
            <div className="flex items-center gap-2 pt-2 pb-1 flex-wrap">
              <Tag className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Sources: YourStory · Inc42 · Economic Times · VCCircle · Entrackr · Livemint · Business Standard · Google News
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
