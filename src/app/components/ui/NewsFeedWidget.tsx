import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, ArrowRight, Rss, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/app/lib/supabase'

interface NewsItem {
  id: string
  title: string
  url: string
  source_name: string
  category: string
  published_at: string | null
  is_featured: boolean
  image_url?: string | null
  summary?: string | null
}

// ─── Category palettes ────────────────────────────────────────────────────────
const CAT_GRADIENT: Record<string, string> = {
  Funding:    'linear-gradient(135deg,#064e3b 0%,#065f46 60%,#047857 100%)',
  'AI/ML':    'linear-gradient(135deg,#1e3a8a 0%,#1e40af 60%,#2563eb 100%)',
  FinTech:    'linear-gradient(135deg,#0c4a6e 0%,#075985 60%,#0284c7 100%)',
  Markets:    'linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4338ca 100%)',
  HealthTech: 'linear-gradient(135deg,#78350f 0%,#92400e 60%,#b45309 100%)',
  CleanTech:  'linear-gradient(135deg,#052e16 0%,#064e3b 60%,#065f46 100%)',
  Policy:     'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#334155 100%)',
  General:    'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#334155 100%)',
}

const CAT_BADGE: Record<string, string> = {
  Funding:    '#10b981',
  'AI/ML':    '#3b82f6',
  FinTech:    '#06b6d4',
  Markets:    '#6366f1',
  HealthTech: '#f59e0b',
  CleanTech:  '#22c55e',
  Policy:     '#94a3b8',
  General:    '#94a3b8',
}

function timeAgo(d: string | null): string {
  if (!d) return ''
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CarouselSkeleton({ twoUp }: { twoUp: boolean }) {
  return (
    <div className={`grid gap-4 ${twoUp ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {Array.from({ length: twoUp ? 2 : 1 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[14px] overflow-hidden" style={{ border: '1px solid var(--line)' }}>
          <div style={{ height: 200, background: 'var(--surface-3)' }} />
          <div className="p-3 space-y-2" style={{ background: 'var(--surface)' }}>
            <div style={{ height: 10, width: '35%', background: 'var(--surface-3)', borderRadius: 5 }} />
            <div style={{ height: 14, width: '90%', background: 'var(--surface-3)', borderRadius: 5 }} />
            <div style={{ height: 14, width: '70%', background: 'var(--surface-3)', borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Single article card ──────────────────────────────────────────────────────
function ArticleCard({ item, height = 200 }: { item: NewsItem; height?: number }) {
  const gradient = CAT_GRADIENT[item.category] ?? CAT_GRADIENT.General
  const badge    = CAT_BADGE[item.category]    ?? '#94a3b8'

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-[14px] overflow-hidden transition-all active:scale-[0.99]"
      style={{ border: '1px solid var(--line)', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Image / gradient area */}
      <div className="relative overflow-hidden" style={{ height, background: gradient }}>
        {item.image_url && (
          <img src={item.image_url} alt="" aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{
          background: item.image_url
            ? 'linear-gradient(to bottom,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.28) 40%,rgba(0,0,0,0.72) 100%)'
            : 'linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0.30) 100%)',
        }} />
        {/* Dot grid on solid gradients */}
        {!item.image_url && (
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.9) 1px,transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0"
            style={{ background: `${badge}cc`, color: 'white', backdropFilter: 'blur(8px)', boxShadow: `0 2px 6px ${badge}55` }}>
            {item.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.is_featured && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.9)', color: 'white', backdropFilter: 'blur(4px)' }}>
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
            <ExternalLink className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
          </div>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[13.5px] font-bold leading-snug line-clamp-2"
            style={{ color: 'rgba(255,255,255,0.97)', textShadow: '0 1px 4px rgba(0,0,0,0.5)', letterSpacing: '-0.01em' }}>
            {item.title}
          </p>
          <p className="text-[11px] mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {item.source_name}{item.published_at && ` · ${timeAgo(item.published_at)}`}
          </p>
        </div>
      </div>

      {/* Summary strip */}
      {item.summary && (
        <div className="px-3 py-2.5" style={{ background: 'var(--surface)' }}>
          <p className="text-[11.5px] leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
            {item.summary}
          </p>
        </div>
      )}
    </a>
  )
}

// ─── Two-up carousel (2 visible, slides 1 at a time) ──────────────────────────
function TwoUpCarousel({ items, moreHref }: { items: NewsItem[]; moreHref: string }) {
  const [index, setIndex]     = useState(0)       // left-most visible article
  const [dir, setDir]         = useState(1)
  const [paused, setPaused]   = useState(false)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)
  const maxIndex              = Math.max(0, items.length - 2)  // last valid left index

  const go = useCallback((d: 1 | -1) => {
    setDir(d)
    setIndex(i => Math.max(0, Math.min(i + d, maxIndex)))
  }, [maxIndex])

  // Auto-advance every 4 s
  useEffect(() => {
    if (items.length <= 2 || paused) return
    timerRef.current = setInterval(() => {
      setDir(1)
      setIndex(i => i >= maxIndex ? 0 : i + 1)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [items.length, paused, maxIndex])

  const canPrev = index > 0
  const canNext = index < maxIndex

  // Key for AnimatePresence — changes whenever index or dir changes
  const slideKey = `${index}-${dir}`

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide area */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slideKey}
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: dir > 0 ? 48 : -48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? -48 : 48 }}
            transition={{ duration: 0.30, ease: [0.4, 0, 0.2, 1] }}
          >
            {[items[index], items[index + 1]].filter(Boolean).map(item => (
              <ArticleCard key={item.id} item={item} height={210} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-3">
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setDir(i > index ? 1 : -1); setIndex(i) }}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all"
              style={{
                width:  i === index ? 20 : 6,
                height: 6,
                background: i === index ? 'var(--blue)' : 'var(--line)',
              }}
            />
          ))}
        </div>

        {/* Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => go(-1)}
            disabled={!canPrev}
            aria-label="Previous"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            onMouseEnter={e => { if (canPrev) { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--blue)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--line)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={!canNext}
            aria-label="Next"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 active:scale-90"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            onMouseEnter={e => { if (canNext) { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--blue)' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--line)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!paused && items.length > 2 && (
        <div className="mt-2 overflow-hidden rounded-full" style={{ height: 2, background: 'var(--line)' }}>
          <motion.div
            key={`progress-${index}`}
            className="h-full rounded-full"
            style={{ background: 'var(--blue)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </div>
      )}

      {/* View all */}
      <div className="mt-3">
        <Link
          to={moreHref}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] text-[12.5px] font-semibold transition-all active:scale-[0.97]"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.28)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Rss className="w-3.5 h-3.5" />
          View all news
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Single carousel (default for other dashboards) ───────────────────────────
function SingleCarousel({ items, moreHref }: { items: NewsItem[]; moreHref: string }) {
  const [current, setCurrent] = useState(0)
  const [dir, setDir]         = useState(1)
  const [paused, setPaused]   = useState(false)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((d: 1 | -1) => {
    setDir(d)
    setCurrent(c => (c + d + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (items.length <= 1 || paused) return
    timerRef.current = setInterval(() => go(1), 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [items.length, paused, go])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-[14px]" style={{ border: '1px solid var(--line)' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${current}-${dir}`}
            initial={{ opacity: 0, x: dir > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir > 0 ? -60 : 60 }}
            transition={{ duration: 0.30, ease: [0.4, 0, 0.2, 1] }}
          >
            <ArticleCard item={items[current]} height={220} />
          </motion.div>
        </AnimatePresence>

        {/* Arrow overlays */}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous"
              className="absolute left-2 top-[calc(110px-18px)] z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-[0.92]"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'white', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.72)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => go(1)} aria-label="Next"
              className="absolute right-2 top-[calc(110px-18px)] z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-[0.92]"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'white', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.72)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Dots + progress */}
      {items.length > 1 && (
        <>
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {items.map((_, i) => (
              <button key={i} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i) }}
                aria-label={`Go to article ${i + 1}`}
                className="rounded-full transition-all"
                style={{ width: i === current ? 20 : 6, height: 6, background: i === current ? 'var(--blue)' : 'var(--line)' }} />
            ))}
          </div>
          {!paused && (
            <div className="mt-2 overflow-hidden rounded-full" style={{ height: 2, background: 'var(--line)' }}>
              <motion.div key={current} className="h-full rounded-full" style={{ background: 'var(--blue)' }}
                initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 4, ease: 'linear' }} />
            </div>
          )}
        </>
      )}

      <div className="mt-3">
        <Link
          to={moreHref}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[12px] text-[12.5px] font-semibold transition-all active:scale-[0.97]"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.28)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Rss className="w-3.5 h-3.5" />
          View all news
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Widget shell ─────────────────────────────────────────────────────────────

interface NewsFeedWidgetProps {
  moreHref?: string
  delay?: number
  /** Show 2 articles side-by-side, sliding 1 at a time (for full-width placements) */
  twoUp?: boolean
}

export function NewsFeedWidget({ moreHref = '/dashboard/news-feed', delay = 0, twoUp = false }: NewsFeedWidgetProps) {
  const [items, setItems]   = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('news_articles')
      .select('id, title, url, source_name, category, published_at, is_featured, image_url, summary')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(twoUp ? 10 : 8)
      .then(({ data }) => { setItems((data ?? []) as NewsItem[]); setLoading(false) })
  }, [twoUp])

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{
        background: 'var(--surface)',
        borderRadius: 18,
        border: '1px solid var(--line)',
        boxShadow: 'var(--sh-2)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3.5"
        style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <Rss className="w-4 h-4" style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>Latest News</p>
            <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Top stories in startup &amp; VC</p>
          </div>
        </div>
        <Link
          to={moreHref}
          className="flex items-center gap-1 text-[11.5px] font-semibold shrink-0 px-3 py-1.5 rounded-[8px] transition-all"
          style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.18)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = 'white' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--blue-bg)'; e.currentTarget.style.color = 'var(--blue)' }}
        >
          More <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <CarouselSkeleton twoUp={twoUp} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
              <Rss className="w-6 h-6" style={{ color: 'var(--muted-2)' }} />
            </div>
            <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No news articles yet</p>
          </div>
        ) : twoUp ? (
          <TwoUpCarousel items={items} moreHref={moreHref} />
        ) : (
          <SingleCarousel items={items} moreHref={moreHref} />
        )}
      </div>
    </motion.div>
  )
}
