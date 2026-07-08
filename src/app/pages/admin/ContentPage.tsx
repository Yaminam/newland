import { useCallback, useEffect, useState } from 'react'
import { Flame, Trash2, RefreshCw, Newspaper, TrendingUp, PlayCircle, Zap, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { BlogTab } from './blog/BlogTab'

type Tab = 'blog' | 'news' | 'trending' | 'scraped' | 'jobs'

const TAB_LABELS: Record<Tab, string> = {
  blog:     'Blog',
  news:     'News',
  trending: 'Trending (engagement)',
  scraped:  'Public startups',
  jobs:     'Scraper jobs',
}

export function ContentPage() {
  const [tab, setTab] = useState<Tab>('blog')
  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Content
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Manage blog posts, curate news articles, engagement-based trending, the public-startup feed, and trigger scraper jobs.
        </p>
      </header>

      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {(['blog','news','trending','scraped','jobs'] as Tab[]).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: tab === t ? 'var(--surface)' : 'transparent',
              color:      tab === t ? 'var(--ink)' : 'var(--muted)',
              boxShadow:  tab === t ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'blog'     && <BlogTab />}
      {tab === 'news'     && <NewsTab />}
      {tab === 'trending' && <TrendingTab />}
      {tab === 'scraped'  && <ScrapedTab />}
      {tab === 'jobs'     && <JobsTab />}
    </div>
  )
}

interface NewsRow {
  id:           string
  title:        string
  summary:      string | null
  source_name:  string | null
  source_url:   string | null
  category:     string | null
  is_hot:       boolean
  published_at: string | null
}

function NewsTab() {
  const [rows, setRows]       = useState<NewsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title, summary, source_name, source_url, category, is_hot, published_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(100)
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as NewsRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleHot(id: string, value: boolean) {
    setBusy(id)
    const { error } = await supabase.from('news_articles').update({ is_hot: value }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this article?')) return
    setBusy(id)
    const { error } = await supabase.from('news_articles').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    void load()
  }

  if (loading) return <Loading />
  if (rows.length === 0) return <Empty icon={Newspaper} label="No news articles ingested." />

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <table className="w-full text-sm">
        <thead style={{ background: 'var(--surface-2)' }}>
          <tr>
            <Th>Title</Th>
            <Th>Source</Th>
            <Th>Category</Th>
            <Th>Published</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
              <Td>
                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.title}</p>
                {r.source_url && (
                  <a href={r.source_url} target="_blank" rel="noreferrer"
                    className="text-xs mt-0.5 underline" style={{ color: '#6366F1' }}>
                    View article
                  </a>
                )}
              </Td>
              <Td>{r.source_name ?? '—'}</Td>
              <Td>
                <span className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                  {r.category ?? 'General'}
                </span>
              </Td>
              <Td>{r.published_at ? new Date(r.published_at).toLocaleDateString() : '—'}</Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  <SmallBtn
                    label={r.is_hot ? 'Unhot' : 'Hot'}
                    icon={Flame}
                    tone={r.is_hot ? 'warn' : 'neutral'}
                    busy={busy === r.id}
                    onClick={() => toggleHot(r.id, !r.is_hot)}
                  />
                  <SmallBtn
                    label="Delete"
                    icon={Trash2}
                    tone="danger"
                    busy={busy === r.id}
                    onClick={() => remove(r.id)}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface TrendingRow {
  id:           string
  startup_id:   string | null
  rank:         number
  trend_signal: string | null
  is_hot:       boolean
  weekly_views: number
  computed_at:  string | null
  startup?: { company_name: string | null; sector: string | null } | null
}

function TrendingTab() {
  const [rows, setRows]       = useState<TrendingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trending_startups')
      .select(`
        id, startup_id, rank, trend_signal, is_hot, weekly_views, computed_at,
        startup:startup_applications!trending_startups_startup_id_fkey ( company_name, sector )
      `)
      .order('rank')
      .limit(100)
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as TrendingRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleHot(id: string, value: boolean) {
    setBusy(id)
    const { error } = await supabase.from('trending_startups').update({ is_hot: value }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Remove from trending list?')) return
    setBusy(id)
    const { error } = await supabase.from('trending_startups').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Removed.')
    void load()
  }

  if (loading) return <Loading />
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl px-6 py-10 text-center"
        style={{ background: 'var(--surface)', border: '1px dashed var(--line)' }}>
        <TrendingUp className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted-2)' }} />
        <h3 className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>
          Engagement-based ranking is idle
        </h3>
        <p className="text-sm max-w-xl mx-auto mb-1" style={{ color: 'var(--muted)' }}>
          This list is scored from real user activity — profile views, bookmarks,
          intro requests, and deck downloads. It will fill in automatically once
          the platform has traffic.
        </p>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
          For the startups your investors see in the marketplace today, open the{' '}
          <strong style={{ color: 'var(--ink)' }}>Scraped startups</strong> tab.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <table className="w-full text-sm">
        <thead style={{ background: 'var(--surface-2)' }}>
          <tr>
            <Th>Rank</Th>
            <Th>Company</Th>
            <Th>Sector</Th>
            <Th>Signal</Th>
            <Th>Views</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
              <Td><strong style={{ color: 'var(--ink)' }}>#{r.rank}</strong></Td>
              <Td>{r.startup?.company_name ?? '—'}</Td>
              <Td>{r.startup?.sector ?? '—'}</Td>
              <Td>{r.trend_signal ?? '—'}</Td>
              <Td>{r.weekly_views.toLocaleString()}</Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  <SmallBtn
                    label={r.is_hot ? 'Unhot' : 'Hot'}
                    icon={Flame}
                    tone={r.is_hot ? 'warn' : 'neutral'}
                    busy={busy === r.id}
                    onClick={() => toggleHot(r.id, !r.is_hot)}
                  />
                  <SmallBtn
                    label="Remove"
                    icon={Trash2}
                    tone="danger"
                    busy={busy === r.id}
                    onClick={() => remove(r.id)}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ScrapedRow {
  id:             string
  company_name:   string
  sector:         string | null
  city:           string | null
  stage:          string | null
  funding_amount: string | null
  funding_round:  string | null
  investor_name:  string | null
  source_name:    string | null
  source_url:     string | null
  announced_date: string | null
  is_hot:         boolean
  rank:           number | null
  updated_at:     string | null
}

function ScrapedTab() {
  const [rows, setRows]       = useState<ScrapedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('public_startups')
      .select('id, company_name, sector, city, stage, funding_amount, funding_round, investor_name, source_name, source_url, announced_date, is_hot, rank, updated_at')
      .order('rank', { ascending: true, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(500)
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as ScrapedRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleHot(id: string, value: boolean) {
    setBusy(id)
    const { error } = await supabase.from('public_startups').update({ is_hot: value }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this public startup entry?')) return
    setBusy(id)
    const { error } = await supabase.from('public_startups').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    void load()
  }

  const filtered = search.trim()
    ? rows.filter(r => {
        const s = search.trim().toLowerCase()
        return (
          r.company_name.toLowerCase().includes(s) ||
          (r.sector ?? '').toLowerCase().includes(s) ||
          (r.city ?? '').toLowerCase().includes(s) ||
          (r.investor_name ?? '').toLowerCase().includes(s)
        )
      })
    : rows

  if (loading) return <Loading />

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search company, sector, city, investor…"
          className="text-sm outline-0"
          style={{
            flex: 1,
            maxWidth: 480,
            height: 36,
            padding: '0 12px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            color: 'var(--ink)',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {filtered.length} of {rows.length} startups
        </span>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={TrendingUp} label={rows.length === 0 ? 'No public startups in the feed yet.' : 'No matches.'} />
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>Company</Th>
                <Th>Sector / Stage</Th>
                <Th>Funding</Th>
                <Th>Investor</Th>
                <Th>City</Th>
                <Th>Source</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td>
                    <strong style={{ color: 'var(--ink)' }}>{r.company_name}</strong>
                    {r.is_hot && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ background: 'var(--warn-bg)', color: '#B45309' }}>
                        <Flame className="w-2.5 h-2.5" /> HOT
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div>{r.sector ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{r.stage ?? '—'}</div>
                  </Td>
                  <Td>
                    <div>{r.funding_amount ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{r.funding_round ?? ''}</div>
                  </Td>
                  <Td>{r.investor_name ?? '—'}</Td>
                  <Td>{r.city ?? '—'}</Td>
                  <Td>
                    {r.source_url ? (
                      <a href={r.source_url} target="_blank" rel="noreferrer"
                        className="text-xs font-medium" style={{ color: 'var(--blue)' }}>
                        {r.source_name ?? 'link'}
                      </a>
                    ) : (r.source_name ?? '—')}
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      <SmallBtn
                        label={r.is_hot ? 'Unhot' : 'Hot'}
                        icon={Flame}
                        tone={r.is_hot ? 'warn' : 'neutral'}
                        busy={busy === r.id}
                        onClick={() => toggleHot(r.id, !r.is_hot)}
                      />
                      <SmallBtn
                        label="Delete"
                        icon={Trash2}
                        tone="danger"
                        busy={busy === r.id}
                        onClick={() => remove(r.id)}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scraper jobs tab
// ---------------------------------------------------------------------------

interface ScraperDef {
  key:         Job
  title:       string
  description: string
  cadence:     string      // human-readable schedule
}

type Job =
  | 'scrape-news'
  | 'scrape-funding'
  | 'scrape-events'
  | 'scrape-grants'
  | 'scrape-investors'
  | 'scrape-public-startups'
  | 'refresh-trending'

const SCRAPERS: ScraperDef[] = [
  { key: 'scrape-news',             title: 'News',             description: 'Pull 5 India startup RSS feeds, LLM-classify + categorize, upsert news_articles.',        cadence: 'every 4 hours' },
  { key: 'scrape-funding',          title: 'Funding rounds',   description: 'Enrich Funding-category news into structured funding_rounds via gpt-4o-mini.',          cadence: 'every 6 hours' },
  { key: 'scrape-public-startups',  title: 'Public startups',  description: 'Project distinct companies from funding_rounds into the Browse Startups feed.',         cadence: 'daily 04:30 UTC' },
  { key: 'scrape-events',           title: 'Events',           description: 'Scrape Devfolio / 10times / AllEvents / Startup India, LLM-extract events.',            cadence: 'daily 03:00 UTC' },
  { key: 'scrape-grants',           title: 'Grants',           description: 'Crawl Startup India + accelerator programs, LLM-extract open application windows.',      cadence: 'weekly Sun 04:00' },
  { key: 'scrape-investors',        title: 'Investors',        description: 'Crawl top 10 India VC firm team pages, LLM-extract partner profiles.',                   cadence: 'weekly Mon 05:00' },
  { key: 'refresh-trending',        title: 'Refresh trending', description: 'Recompute engagement-based trending from views, bookmarks, intros, deck downloads.',     cadence: 'on demand' },
]

interface RunRow {
  id:            string
  job:           string
  status:        string
  items_in:      number | null
  items_written: number | null
  error:         string | null
  started_at:    string
  finished_at:   string | null
}

function JobsTab() {
  const [runs, setRuns]       = useState<RunRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('scraper_runs')
      .select('id, job, status, items_in, items_written, error, started_at, finished_at')
      .order('started_at', { ascending: false })
      .limit(60)
    if (error) { toast.error(error.message); setRuns([]); setLoading(false); return }
    setRuns((data as RunRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function run(job: Job) {
    setBusy(job)
    const { data, error } = await supabase.functions.invoke('admin-run-job', { body: { job } })
    setBusy(null)
    if (error) { toast.error(error.message); return }
    const d = data as { status?: string; error?: string | null; items_written?: number | null } | null
    if (d?.status === 'succeeded') {
      toast.success(`${job} completed — ${d.items_written ?? 0} rows written.`)
    } else {
      toast.error(`${job} failed: ${d?.error ?? 'unknown error'}`)
    }
    void load()
  }

  const lastRunByJob = new Map<string, RunRow>()
  for (const r of runs) {
    if (!lastRunByJob.has(r.job)) lastRunByJob.set(r.job, r)
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {SCRAPERS.map(s => (
          <JobCard
            key={s.key}
            scraper={s}
            lastRun={lastRunByJob.get(s.key)}
            busy={busy === s.key}
            onRun={() => run(s.key)}
          />
        ))}
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>
        Recent runs
      </h3>

      {loading ? <Loading /> : runs.length === 0 ? (
        <Empty icon={RefreshCw} label="No scraper runs logged yet. Trigger one above to populate." />
      ) : (
        <div className="rounded-2xl overflow-x-auto cc-scroll-hint-x"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full min-w-[720px] text-sm">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Items</Th>
                <Th>Started</Th>
                <Th>Duration</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => {
                const duration = r.finished_at
                  ? Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)
                  : null
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <Td><span className="font-mono text-xs">{r.job}</span></Td>
                    <Td><StatusPill status={r.status} /></Td>
                    <Td>
                      {r.items_in != null || r.items_written != null
                        ? <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            {r.items_in ?? '—'} in / {r.items_written ?? '—'} written
                          </span>
                        : '—'}
                    </Td>
                    <Td className="text-xs">{new Date(r.started_at).toLocaleString()}</Td>
                    <Td>{duration != null ? `${duration}s` : '—'}</Td>
                    <Td>
                      {r.error ? <span className="text-xs" style={{ color: '#B91C1C' }}>{r.error}</span> : '—'}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function JobCard({ scraper, lastRun, busy, onRun }: {
  scraper: ScraperDef
  lastRun?: RunRow
  busy:    boolean
  onRun:   () => void
}) {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold" style={{ color: 'var(--ink)' }}>{scraper.title}</p>
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded"
          style={{ background: '#DBEAFE', color: 'var(--blue-h)' }}>
          <Zap className="w-2.5 h-2.5" /> edge fn
        </span>
      </div>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{scraper.description}</p>
      <p className="text-[11px] mt-1 font-mono" style={{ color: 'var(--muted-2)' }}>{scraper.cadence}</p>

      {lastRun ? (
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          <StatusPill status={lastRun.status} />
          <span style={{ color: 'var(--muted-2)' }}>
            {new Date(lastRun.started_at).toLocaleString()}
          </span>
          {lastRun.items_written != null && (
            <span style={{ color: 'var(--muted)' }}>· {lastRun.items_written} written</span>
          )}
        </div>
      ) : (
        <div className="mt-3 text-xs" style={{ color: 'var(--muted-2)' }}>No runs yet.</div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onRun} disabled={busy}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
          style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
          <PlayCircle className="w-3.5 h-3.5" />
          {busy ? 'Running…' : 'Run now'}
        </button>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string }> = {
    started:   { bg: '#DBEAFE', color: 'var(--blue-h)' },
    succeeded: { bg: '#DCFCE7', color: 'var(--pos)' },
    failed:    { bg: '#FEE2E2', color: '#B91C1C' },
  }
  const t = tones[status] ?? { bg: 'var(--surface-2)', color: 'var(--muted)' }
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
      style={{ background: t.bg, color: t.color }}>
      {status}
    </span>
  )
}

function SmallBtn({ label, icon: Icon, busy, onClick, tone = 'neutral' }: {
  label:    string
  icon?:    React.ElementType
  busy:     boolean
  onClick:  () => void
  tone?:    'neutral' | 'danger' | 'warn'
}) {
  const palette = {
    neutral: { bg: 'var(--surface-2)', color: 'var(--ink)', border: 'var(--line)' },
    danger:  { bg: '#FEE2E2', color: '#B91C1C', border: 'var(--danger-border)' },
    warn:    { bg: '#FEF3C7', color: '#B45309', border: 'var(--warning-border)' },
  }[tone]
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      style={{ background: palette.bg, color: palette.color, border: `1px solid ${palette.border}` }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {busy ? '…' : label}
    </button>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em]"
      style={{ color: 'var(--muted)' }}>
      {children}
    </th>
  )
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className ?? ''}`}>{children}</td>
}

function Loading() {
  return <div className="text-center py-8" style={{ color: 'var(--muted)' }}>Loading…</div>
}
function Empty({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="rounded-2xl p-8 text-center"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
      <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
      {label}
    </div>
  )
}
