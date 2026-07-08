import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { EmptyState } from '@/app/components/ui/EmptyState'
import {
  Newspaper, ExternalLink, Clock,
  Zap, Tag, AlertCircle, Rss, Search, X, ArrowRight,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'

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

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  Funding:     { color: 'var(--pos)', bg: 'rgba(16,185,129,0.10)' },
  Acquisition: { color: 'var(--warn)', bg: 'rgba(245,158,11,0.10)' },
  IPO:         { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
  People:      { color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
  Policy:      { color: 'var(--neg)', bg: 'rgba(239,68,68,0.10)' },
  Technology:  { color: '#3486e8', bg: 'rgba(52,134,232,0.10)' },
  News:        { color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

const SOURCE_COLORS: Record<string, string> = {
  'Inc42':            '#3b82f6',
  'YourStory':        '#3486e8',
  'Economic Times':   'var(--pos)',
  'The Ken':          '#7c3aed',
  'Mint Startups':    '#59cbef',
  'Moneycontrol':     'var(--neg)',
  'Hindu Business':   'var(--warn)',
  'Google News':      '#64748b',
}

function sourceColor(name: string): string {
  return SOURCE_COLORS[name] ?? '#94a3b8'
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null, fallback?: string | null): string {
  const primary = dateStr ?? fallback ?? null
  if (!primary) return 'Recently added'
  const diff = Date.now() - new Date(primary).getTime()
  if (isNaN(diff)) return 'Recently added'
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  return new Date(primary).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FALLBACK_THUMB = 'https://media.istockphoto.com/id/2225051149/video/colorful-gradient-abstract-background-screensaver-wallpaper.jpg?s=640x640&k=20&c=jQv1DYEhI9bskEHLqcy4wE9bBVJeMRggHIfK3-Lx74I='

const TODAY_LABEL = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const PAGE_SIZE = 20

// ─── Sub-components ──────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: string }) {
  const s = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.News
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: s.color, background: s.bg, letterSpacing: '0.04em' }}
    >
      {category}
    </span>
  )
}

function SourcePill({ source }: { source: string }) {
  const color = sourceColor(source)
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {source}
    </span>
  )
}

function SectorTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map(tag => (
        <span
          key={tag}
          className="px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}
        >
          #{tag}
        </span>
      ))}
    </div>
  )
}

// Section-divider heading used between editorial blocks.
function SectionHeading({ title, count, total }: { title: string; count?: number; total?: number }) {
  const showTotal = typeof count === 'number' && typeof total === 'number' && count < total
  return (
    <div className="flex items-center gap-3">
      <span className="w-1 h-5 rounded-full shrink-0" style={{ background: 'var(--blue)' }} />
      <h2 className="text-[14px] font-extrabold uppercase shrink-0" style={{ color: 'var(--ink)', letterSpacing: '0.06em' }}>
        {title}
      </h2>
      {typeof count === 'number' && (
        <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--muted-2)' }}>
          {showTotal ? `${count} of ${total}` : count}
        </span>
      )}
      <span className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}

// ─── Thumbnail with fallback ─────────────────────────────────────────────────

function ArticleThumb({ url, size = 'card' }: { url: string | null; size?: 'card' | 'lg' }) {
  const [failed, setFailed] = useState(false)
  const showImage = url && !failed
  const h = size === 'lg' ? 300 : 168
  const src = showImage ? url : FALLBACK_THUMB

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: h, background: 'var(--surface-2)' }}
    >
      {/* Blurred fill so wide/tall images aren't cropped — they sit fully inside */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
        referrerPolicy="no-referrer"
      />
      {/* object-contain keeps the full image visible & centered — the blurred
          copy above fills any letterbox space so nothing looks cropped. */}
      <img
        src={src}
        alt=""
        onError={() => { if (showImage) /* fall back */ setFailed?.(true) }}
        className="relative w-full h-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

// Small square thumbnail for the "Just In" rail.
function RailThumb({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const src = url && !failed ? url : FALLBACK_THUMB
  return (
    <div className="w-16 h-16 rounded-[10px] overflow-hidden shrink-0" style={{ background: 'var(--surface-2)' }}>
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

// ─── Featured (lead) Card ───────────────────────────────────────────────────

function FeaturedCard({ article }: { article: NewsArticle }) {
  const cat = CATEGORY_STYLES[article.category] ?? CATEGORY_STYLES.News
  return (
    <motion.a
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col overflow-hidden transition-all group active:scale-[0.99] hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: 'var(--sh-2)', border: '1px solid var(--line)' }}
    >
      <div className="relative w-full overflow-hidden">
        <ArticleThumb url={article.image_url} size="lg" />
        {/* Bottom-up scrim so the headline reads on any photo; fades to clear at the top */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 32%, rgba(0,0,0,0.1) 65%, transparent 100%)' }}
        />
        <div className="absolute top-3.5 left-3.5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase"
            style={{ background: 'var(--blue)', color: '#fff', letterSpacing: '0.06em', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
          >
            <Zap className="w-3 h-3" /> Lead Story
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 sm:px-6 sm:pb-6">
          {/* High-contrast meta that stays legible over the photo */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase"
              style={{ background: cat.color, color: '#fff', letterSpacing: '0.06em' }}
            >
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#fff' }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sourceColor(article.source_name) }} />
              {article.source_name}
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
              <Clock className="w-2.5 h-2.5" />
              {timeAgo(article.published_at, article.fetched_at)}
            </span>
          </div>
          <h2
            className="text-[20px] sm:text-[26px] font-extrabold leading-[1.14] line-clamp-3"
            style={{ color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', textShadow: '0 1px 14px rgba(0,0,0,0.45)' }}
          >
            {article.title}
          </h2>
        </div>
      </div>

      <div className="p-5 sm:px-6 sm:py-5">
        {article.summary && (
          <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
            {stripMarkdown(article.summary)}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mt-3.5 pt-3.5" style={{ borderTop: '1px solid var(--line-2)' }}>
          <SectorTags tags={article.sector_tags} />
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-bold shrink-0"
            style={{ color: 'var(--blue)' }}
          >
            Read full story <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.35 }}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col overflow-hidden transition-all group active:scale-[0.98] cursor-pointer hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}
    >
      <ArticleThumb url={article.image_url} size="card" />

      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-5">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <CategoryPill category={article.category} />
          <SourcePill source={article.source_name} />
          <span className="text-[10px] flex items-center gap-1 ml-auto shrink-0" style={{ color: 'var(--muted-2)' }}>
            <Clock className="w-2.5 h-2.5" />
            {timeAgo(article.published_at, article.fetched_at)}
          </span>
        </div>

        <h3
          className="text-[14px] font-bold mb-1.5 line-clamp-3 leading-snug group-hover:text-[var(--blue)] transition-colors"
          style={{ color: 'var(--ink)', letterSpacing: '-0.01em', fontFamily: 'var(--font-display)' }}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p className="text-[11.5px] mb-auto line-clamp-2 leading-relaxed" style={{ color: 'var(--muted-2)' }}>
            {stripMarkdown(article.summary)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <SectorTags tags={article.sector_tags} />
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--blue)' }}
          >
            Read <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.a>
  )
}

// ─── "Just In" rail ───────────────────────────────────────────────────────────

function JustInRail({ items }: { items: NewsArticle[] }) {
  return (
    <div className="flex flex-col" style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}>
      <div className="px-4 pt-4 pb-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--line-2)' }}>
        <span className="w-1 h-4 rounded-full" style={{ background: 'var(--blue)' }} />
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink)', letterSpacing: '0.06em' }}>Just In</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: 'var(--neg)', letterSpacing: '0.05em' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--neg)' }} />
          Live
        </span>
      </div>
      {items.map((a, i) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
          style={i < items.length - 1 ? { borderBottom: '1px solid var(--line-2)' } : undefined}
        >
          <RailThumb url={a.image_url} />
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-[12.5px] font-semibold leading-snug line-clamp-2 group-hover:text-[var(--blue)] transition-colors" style={{ color: 'var(--ink)' }}>
              {a.title}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <SourcePill source={a.source_name} />
              <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>{timeAgo(a.published_at, a.fetched_at)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SkeletonFeatured() {
  return (
    <div className="overflow-hidden animate-pulse" style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)' }}>
      <div className="w-full" style={{ height: 300, background: 'var(--surface-2)' }} />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full" style={{ background: 'var(--surface-2)' }} />
          <div className="h-4 w-20 rounded-full" style={{ background: 'var(--surface-2)' }} />
        </div>
        <div className="h-5 w-3/4 rounded-lg" style={{ background: 'var(--surface-2)' }} />
        <div className="h-3 w-full rounded-lg" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}

function SkeletonRail() {
  return (
    <div className="overflow-hidden animate-pulse" style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)' }}>
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--line-2)' }}>
        <div className="h-3.5 w-20 rounded" style={{ background: 'var(--surface-2)' }} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--line-2)' }}>
          <div className="w-16 h-16 rounded-[10px] shrink-0" style={{ background: 'var(--surface-2)' }} />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-full rounded" style={{ background: 'var(--surface-2)' }} />
            <div className="h-3 w-4/5 rounded" style={{ background: 'var(--surface-2)' }} />
            <div className="h-2.5 w-2/5 rounded" style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden animate-pulse" style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)' }}>
      <div className="w-full" style={{ height: 160, background: 'var(--surface-2)' }} />
      <div className="p-5 space-y-2.5">
        <div className="flex gap-2">
          <div className="h-3.5 w-14 rounded-full" style={{ background: 'var(--surface-2)' }} />
          <div className="h-3.5 w-18 rounded-full" style={{ background: 'var(--surface-2)' }} />
        </div>
        <div className="h-4 w-full rounded-lg" style={{ background: 'var(--surface-2)' }} />
        <div className="h-3 w-4/5 rounded-lg" style={{ background: 'var(--surface-2)' }} />
        <div className="h-3 w-2/5 rounded-lg" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function NewsFeedPage() {
  const [allArticles, setAllArticles]         = useState<NewsArticle[]>([])
  const [totalDbCount, setTotalDbCount]       = useState(0)
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [visibleCount, setVisibleCount]       = useState(PAGE_SIZE)

  const [activeCategory, setActiveCategory]   = useState('All')
  const [activeSector, setActiveSector]       = useState('All')
  const [searchQuery, setSearchQuery]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef  = useRef<HTMLDivElement>(null)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  // Fetch articles + total count in parallel. Filtering is client-side so the
  // chips/sections always reflect what's actually in the loaded data.
  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [articlesResult, countResult] = await Promise.all([
        supabase
          .from('news_articles')
          .select('*')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('fetched_at',   { ascending: false })
          .limit(100),
        supabase
          .from('news_articles')
          .select('*', { count: 'exact', head: true }),
      ])
      if (articlesResult.error) throw articlesResult.error
      setAllArticles((articlesResult.data ?? []) as NewsArticle[])
      setTotalDbCount(countResult.count ?? 0)
    } catch (err: unknown) {
      console.error('News fetch error:', err)
      setError('Failed to load news. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNews() }, [fetchNews])
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Reset to first page whenever filters change so stale pages don't leak.
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [activeCategory, activeSector, debouncedSearch])

  // Section nav built from the categories actually present, most common first.
  const categoryNav = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of allArticles) {
      if (a.category) counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)
    return ['All', ...ordered]
  }, [allArticles])

  // Sector chips, also derived from the data so every chip yields results.
  const sectorChips = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of allArticles) {
      for (const t of a.sector_tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s)
    return ['All', ...ordered]
  }, [allArticles])

  // Drop a selected chip if a refetch removed its underlying data.
  useEffect(() => {
    if (activeCategory !== 'All' && !categoryNav.includes(activeCategory)) setActiveCategory('All')
  }, [categoryNav, activeCategory])
  useEffect(() => {
    if (activeSector !== 'All' && !sectorChips.includes(activeSector)) setActiveSector('All')
  }, [sectorChips, activeSector])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return allArticles.filter(a => {
      if (activeCategory !== 'All' && a.category !== activeCategory) return false
      if (activeSector !== 'All' && !(a.sector_tags ?? []).includes(activeSector)) return false
      if (q) {
        const hay = [a.title, a.summary, a.source_name, ...(a.sector_tags ?? [])]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allArticles, activeCategory, activeSector, debouncedSearch])

  const hasActiveFilters = activeCategory !== 'All' || activeSector !== 'All' || searchQuery !== ''
  const hasMore = visibleCount < filtered.length

  // Slice filtered down to what we actually render right now.
  const visibleFiltered = filtered.slice(0, visibleCount)
  const lead = visibleFiltered.find(a => a.is_featured) ?? visibleFiltered[0]
  const rest = visibleFiltered.filter(a => a.id !== lead?.id)
  const rail = rest.slice(0, 5)
  const grid = rest.slice(5)
  // Total grid articles available across all pages (for the section heading).
  const totalGridCount = Math.max(0, filtered.length - 1 - Math.min(5, Math.max(0, filtered.length - 1)))

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE)
  }, [])

  // Trigger next page when the sentinel div scrolls into view.
  // The dashboard scrolls inside an overflow-y:auto <main> element, not the
  // window, so we walk up the DOM to find that container and pass it as root.
  // Without this, IntersectionObserver fires against the browser viewport and
  // never detects the sentinel inside the custom scroll container.
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    let scrollRoot: Element | null = sentinel.parentElement
    while (scrollRoot && scrollRoot !== document.documentElement) {
      const oy = getComputedStyle(scrollRoot).overflowY
      if (oy === 'auto' || oy === 'scroll') break
      scrollRoot = scrollRoot.parentElement
    }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      {
        root: scrollRoot !== document.documentElement ? scrollRoot : null,
        rootMargin: '400px',
      }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  function clearFilters() {
    setActiveCategory('All')
    setActiveSector('All')
    setSearchQuery('')
    setDebouncedSearch('')
  }

  const catLabel = (c: string) => (c === 'All' ? 'Top Stories' : c)
  const heroCount = totalDbCount > 0 ? totalDbCount : allArticles.length

  return (
    <div className="pb-8 space-y-5">
      <SEO title="News Feed" path="/dashboard/news-feed" noindex />

      <HeroSection
        eyebrow={TODAY_LABEL}
        title="News Feed"
        subtitle="Stay updated with the latest from the startup ecosystem"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
            }}
          >
            <Newspaper className="w-3.5 h-3.5" />
            {heroCount} Article{heroCount !== 1 ? 's' : ''}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase"
            style={{
              background: 'rgba(239,68,68,0.18)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              letterSpacing: '0.05em',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#fff' }} />
            Live
          </span>
        </div>
      </HeroSection>

      {/* ── Section nav (newspaper sections, derived from data) ── */}
      {categoryNav.length > 1 && (
        <div className="overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="flex items-center gap-1 min-w-max">
            {categoryNav.map(c => {
              const active = activeCategory === c
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className="relative px-3.5 py-2.5 text-[12.5px] font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer capitalize"
                  style={{ color: active ? 'var(--ink)' : 'var(--muted-2)', letterSpacing: '-0.01em' }}
                >
                  {catLabel(c)}
                  {active && (
                    <motion.span
                      layoutId="news-section-underline"
                      className="absolute left-2.5 right-2.5 -bottom-px h-[2.5px] rounded-full"
                      style={{ background: 'var(--blue)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Search Bar ── */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 sm:px-5"
        style={{ background: 'var(--surface)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--muted-2)' }} />
        <input
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search articles..."
          className="flex-1 bg-transparent text-[13px] outline-none min-w-0"
          style={{ color: 'var(--ink)' }}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setDebouncedSearch('') }}
            className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shrink-0"
            style={{ background: 'var(--surface-2)' }}
          >
            <X className="w-3 h-3" style={{ color: 'var(--muted-2)' }} />
          </button>
        )}
      </div>

      {/* ── Sector Filters (derived from data) ── */}
      {sectorChips.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
          {sectorChips.map(s => {
            const active = activeSector === s
            return (
              <button
                key={s}
                onClick={() => setActiveSector(s)}
                className="px-3.5 py-2 rounded-[10px] text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] shrink-0"
                style={{
                  background: active ? 'var(--blue)' : 'var(--surface)',
                  color: active ? '#fff' : 'var(--muted)',
                  boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                  border: active ? '1px solid var(--blue)' : '1px solid var(--line)',
                }}
              >
                {s === 'All' ? 'All Sectors' : s}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">

        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 lg:gap-5">
              <SkeletonFeatured />
              <SkeletonRail />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <EmptyState
              icon={<AlertCircle className="w-6 h-6" style={{ color: 'var(--neg)' }} />}
              title="Failed to load news"
              description={error}
              action={{ label: 'Retry', onClick: fetchNews }}
            />
          </motion.div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <EmptyState
              icon={<Rss className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
              title="No articles found"
              description={hasActiveFilters
                ? 'No articles match your current filters.'
                : "The news pipeline hasn't run yet, or there are no recent articles."}
              action={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
            />
          </motion.div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <motion.div key="articles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6">

            {/* Above the fold: lead story + Just In rail */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 lg:gap-5 items-start">
              {lead && <FeaturedCard article={lead} />}
              {rail.length > 0 && <JustInRail items={rail} />}
            </div>

            {grid.length > 0 && (
              <div className="space-y-4">
                <SectionHeading
                  title="Latest News"
                  count={grid.length}
                  total={totalGridCount}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grid.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))}
                </div>

                {/* Sentinel: IntersectionObserver fires loadMore when entering view */}
                {hasMore && (
                  <div ref={sentinelRef} className="flex flex-col items-center gap-3 pt-2 pb-4">
                    {/* Invisible tripwire for auto-scroll */}
                    <div className="w-full h-1" />
                    {/* Visible fallback — user can always tap this if observer misfires */}
                    <button
                      onClick={loadMore}
                      className="px-5 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all active:scale-[0.97] cursor-pointer"
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--blue)',
                        border: '1px solid var(--line)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      Load more articles
                    </button>
                  </div>
                )}

                {/* End of list */}
                {!hasMore && totalGridCount > 0 && (
                  <p className="text-center text-[12px] py-2" style={{ color: 'var(--muted-2)' }}>
                    All {filtered.length} article{filtered.length !== 1 ? 's' : ''} loaded
                  </p>
                )}
              </div>
            )}

            {/* Source attribution */}
            <div
              className="flex items-center gap-2.5 px-4 py-3.5 sm:px-5 flex-wrap"
              style={{ background: 'var(--surface)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid var(--line)' }}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                Sources: YourStory · Inc42 · Economic Times · VCCircle · Entrackr · Livemint · Business Standard · Google News
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
