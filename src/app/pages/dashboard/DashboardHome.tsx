import { memo, useCallback, useEffect, useState } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from 'recharts'
import {
  TrendingUp, Bookmark, MessageSquare, Download, Zap,
  Users, DollarSign, Target, ArrowUpRight, Flame, Calendar,
  Building2, Rocket, Lightbulb, Star, FileText, Landmark,
  BarChart2, Clock, CheckCircle, Eye, Sparkles, RefreshCw, Bell,
  Briefcase, Activity, Globe, Award, ChevronRight, Info, Newspaper, GraduationCap,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'
import { useAuth } from '@/app/context/AuthContext'
import { type Currency, formatAmount, formatTotals, sumByCurrency } from '@/app/lib/currency'
import { HeroNumber } from '@/app/components/ui/HeroNumber'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { ConnectionMark } from '@/app/components/ui/ConnectionMark'
import { SmoothLineChart } from '@/app/components/ui/SmoothLineChart'
import { PillBarChart } from '@/app/components/ui/PillBarChart'
import { Badge } from '@/app/components/ui/Badge'
import { ProgressRing } from '@/app/components/ui/ProgressRing'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { NewsFeedWidget } from '@/app/components/ui/NewsFeedWidget'
import { toast } from 'sonner'

// ─── Design tokens ───────────────────────────────────────────────
const cardStyle = {
  background: 'var(--surface)',
  borderRadius: 16,
  border: '1px solid var(--line)',
  boxShadow: 'var(--sh-2)',
}

// ─── Animated count-up for numeric KPIs ──────────────────────────
function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce || !Number.isFinite(value)) { setN(value); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setN(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduce])
  return <>{n.toLocaleString()}</>
}

// ─── StatPill ────────────────────────────────────────────────────
const StatPill = memo(function StatPill({ icon: Icon, label, value, color, delay = 0 }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -5, boxShadow: '0 16px 34px rgba(13,27,42,0.13), 0 4px 10px rgba(13,27,42,0.06)' }}
      className="group relative flex flex-col p-5 overflow-hidden"
      style={cardStyle}
    >
      {/* Clean tinted icon tile */}
      <div
        className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
        style={{ background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}1f` }}
      >
        <Icon className="w-[22px] h-[22px]" style={{ color }} />
      </div>
      <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </p>
      <p className="text-[12px] font-medium mt-2" style={{ color: 'var(--muted)' }}>{label}</p>
      {/* Accent line — sweeps across on hover (scaleX is reliable on every card) */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
      />
    </motion.div>
  )
})

// ─── SectionCard wrapper ─────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, iconColor, children, action, delay = 0 }: {
  title?: string
  subtitle?: string
  icon?: React.ElementType
  iconColor?: string
  children: React.ReactNode
  action?: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ boxShadow: '0 10px 30px rgba(13,27,42,0.08), 0 2px 8px rgba(13,27,42,0.04)' }}
      className="p-4 sm:p-5"
      style={cardStyle}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${iconColor ?? 'var(--blue)'}26, ${iconColor ?? 'var(--blue)'}0d)` }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: iconColor ?? 'var(--blue)' }} />
              </div>
            )}
            <div>
              {title && (
                <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  )
}

// ─── News mini card ──────────────────────────────────────────────
const NewsMini = memo(function NewsMini({ article }: { article: { title: string; source_name: string; category: string; published_at: string; url: string; is_featured: boolean } }) {
  const catColors: Record<string, string> = {
    Funding: 'var(--pos)', 'AI/ML': '#3486e8', FinTech: '#59cbef', Markets: 'var(--blue)',
    HealthTech: 'var(--warn)', CleanTech: 'var(--pos)', Policy: '#94a3b8', General: '#64748b',
  }
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 py-3 group transition-all active:scale-[0.99]"
      style={{ borderBottom: '1px solid var(--line)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-semibold px-2 py-0.5 rounded-[6px]"
            style={{ fontSize: 10, background: `${catColors[article.category] ?? '#64748b'}15`, color: catColors[article.category] ?? '#64748b' }}
          >
            {article.category}
          </span>
          {article.is_featured && <Flame className="w-3 h-3" style={{ color: 'var(--neg)' }} />}
        </div>
        <p className="text-[12px] font-medium line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ color: 'var(--ink)' }}>
          {article.title}
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>
          {article.source_name} · {new Date(article.published_at).toLocaleDateString()}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-2)' }} />
    </a>
  )
})

// ─── Trending startup mini card ──────────────────────────────────
const TrendingMini = memo(function TrendingMini({ item, rank }: {
  item: { startup_id: string; rank: number; trend_signal: string; is_hot: boolean; weekly_views: number; startup: { company_name: string; sector: string; stage: string; arr_usd: number } }
  rank: number
}) {
  return (
    <div className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid var(--line)' }}>
      <div
        className="w-7 h-7 flex items-center justify-center font-bold rounded-[8px] shrink-0"
        style={{ background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 11 }}
      >
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {item.startup?.company_name}
          </p>
          {item.is_hot && <Flame className="w-3 h-3 shrink-0" style={{ color: 'var(--neg)' }} />}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
          {item.startup?.sector} · {item.trend_signal}
        </p>
      </div>
      <span
        className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold shrink-0"
        style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
      >
        {item.weekly_views} views
      </span>
    </div>
  )
})

// ─── Segmented Tab Selector ──────────────────────────────────────
function SegmentedTabs<T extends string>({ value, options, onChange }: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div
      className="inline-flex p-1 gap-1"
      style={{ background: 'var(--surface-2)', borderRadius: 10 }}
    >
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
            style={{
              background: active ? 'var(--blue)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Angel / VC Dashboard ────────────────────────────────────────
type TrendRisk = 'high' | 'medium' | 'low'

function AngelVCDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ newStartups: 0, activeRaises: 0, introPending: 0, discoveries: 0 })
  const [introBreakdown, setIntroBreakdown] = useState({ pending: 0, accepted: 0, declined: 0, expired: 0 })
  const [news, setNews] = useState<Array<{ id: string; title: string; source_name: string; category: string; published_at: string; url: string; is_featured: boolean }>>([])
  const [trending, setTrending] = useState<Array<{ startup_id: string; rank: number; trend_signal: string; is_hot: boolean; weekly_views: number; startup: { company_name: string; sector: string; stage: string; arr_usd: number } }>>([])
  const [funding, setFunding] = useState<Array<{ id: string; company_name: string; amount_usd: number; stage: string; sector: string; lead_investor: string; announced_at: string }>>([])
  const [trendRisk, setTrendRisk] = useState<TrendRisk>('high')
  const [loading, setLoading] = useState(true)

  const userId = user?.id ?? ''

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [invProfileRes, startupsRes, introsAllRes, newsRes, trendingRes, fundingRes] = await Promise.all([
          supabase.from('investor_profiles').select('sectors').eq('user_id', userId).maybeSingle(),
          supabase.from('startup_applications').select('id', { count: 'exact' }).eq('status', 'approved'),
          supabase.from('introductions').select('status').eq('investor_id', userId),
          supabase.from('news_articles').select('*').eq('category', 'Funding').order('published_at', { ascending: false }).limit(3),
          supabase.from('trending_startups').select('*, startup:startup_applications(company_name, sector, stage, arr_usd)').order('rank').limit(5),
          supabase.from('funding_rounds').select('*').order('announced_at', { ascending: false }).limit(5),
        ])

        const sectors = (invProfileRes.data?.sectors as string[] | null) ?? []
        const discoveriesRes = sectors.length > 0
          ? await supabase.from('startup_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved').in('sector', sectors)
          : { count: 0 }

        const introsData = (introsAllRes.data ?? []) as Array<{ status: string }>
        const breakdown = { pending: 0, accepted: 0, declined: 0, expired: 0 }
        for (const row of introsData) {
          if (row.status in breakdown) breakdown[row.status as keyof typeof breakdown]++
        }
        setIntroBreakdown(breakdown)

        const totalApproved = startupsRes.count ?? 0
        const discoveryCount = sectors.length > 0 ? (discoveriesRes.count ?? 0) : totalApproved

        setStats({
          newStartups: totalApproved,
          activeRaises: totalApproved,
          introPending: breakdown.pending,
          discoveries: discoveryCount,
        })
        setNews((newsRes.data as typeof news) ?? [])
        setFunding((fundingRes.data as typeof funding) ?? [])

        const trendingRows = (trendingRes.data as typeof trending) ?? []
        if (trendingRows.length > 0) {
          setTrending(trendingRows)
        } else {
          const { data: fallback } = await supabase
            .from('startup_applications')
            .select('id, company_name, sector, stage, arr_usd, total_views, total_bookmarks, total_intros')
            .eq('status', 'approved')
            .order('total_intros', { ascending: false })
            .order('total_bookmarks', { ascending: false })
            .order('total_views', { ascending: false })
            .limit(5)
          const mapped = (fallback ?? []).map((s, i) => {
            const intros = s.total_intros ?? 0
            const bookmarks = s.total_bookmarks ?? 0
            const views = s.total_views ?? 0
            let trend_signal = 'Recently approved'
            if (intros >= 3) trend_signal = 'High investor interest'
            else if (bookmarks >= 5) trend_signal = 'Heavily bookmarked'
            else if (views >= 20) trend_signal = 'Gaining traction'
            return {
              startup_id: s.id,
              rank: i + 1,
              trend_signal,
              is_hot: intros >= 3 || bookmarks >= 10,
              weekly_views: views,
              startup: {
                company_name: s.company_name,
                sector: s.sector,
                stage: s.stage,
                arr_usd: s.arr_usd,
              },
            }
          })
          setTrending(mapped as typeof trending)
        }
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()

    const channel = supabase.channel('investor-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'introductions', filter: `investor_id=eq.${userId}` }, () => loadDashboard())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'startup_applications' }, () => loadDashboard())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonBlock height={288} />
        <SkeletonBlock height={256} />
        <SkeletonBlock height={224} />
      </div>
    )
  }

  const riskFilter = (amount: number) => {
    const m = amount / 1_000_000
    if (trendRisk === 'high') return m >= 10
    if (trendRisk === 'medium') return m >= 1 && m < 10
    return m < 1
  }
  const trendSorted = [...funding]
    .filter(r => r.amount_usd ? riskFilter(r.amount_usd) : trendRisk === 'low')
    .sort((a, b) => new Date(a.announced_at).getTime() - new Date(b.announced_at).getTime())
  const trendData = trendSorted.slice(-12).map(r => ({
    label: new Date(r.announced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    primary:   r.amount_usd ? Math.round(r.amount_usd / 1_000_000) : 0,
    secondary: r.amount_usd ? Math.round((r.amount_usd / 1_000_000) * 0.65) : 0,
  }))
  const topTrendPoint = trendData.reduce((best, cur) => cur.primary > (best?.primary ?? 0) ? cur : best, trendData[0])

  const introTotal = introBreakdown.pending + introBreakdown.accepted + introBreakdown.declined + introBreakdown.expired
  const pipelineDonut = [
    { name: 'Pending',  value: introBreakdown.pending,  color: 'var(--blue)' },
    { name: 'Accepted', value: introBreakdown.accepted, color: 'var(--pos)' },
    { name: 'Declined', value: introBreakdown.declined, color: 'var(--neg)' },
    { name: 'Expired',  value: introBreakdown.expired,  color: 'var(--muted-2)' },
  ].filter(slice => slice.value > 0)
  const acceptanceRate = introTotal > 0
    ? Math.round((introBreakdown.accepted / introTotal) * 100)
    : 0

  const RISK_OPTIONS = [
    { value: 'high',   label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low',    label: 'Low' },
  ] as const

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatPill icon={Building2} label="Approved Startups" value={stats.newStartups} color="var(--blue)" delay={0} />
        <StatPill icon={Star} label="Discoveries" value={stats.discoveries} color="#0891B2" delay={0.05} />
        <StatPill icon={TrendingUp} label="Active Raises" value={stats.activeRaises} color="var(--pos)" delay={0.1} />
        <StatPill icon={MessageSquare} label="Active Intros" value={introBreakdown.pending + introBreakdown.accepted} color="#f59e0b" delay={0.15} />
      </div>

      {/* Trend card */}
      <SectionCard
        title="Trend"
        subtitle="Deal-size momentum (USD M)"
        icon={Activity}
        iconColor="var(--blue)"
        delay={0.2}
        action={
          <SegmentedTabs<TrendRisk>
            value={trendRisk}
            options={RISK_OPTIONS}
            onChange={setTrendRisk}
          />
        }
      >
        {trendData.length > 0 ? (
          <SmoothLineChart
            data={trendData}
            xKey="label"
            series={[
              { key: 'primary',   color: 'var(--blue)', fill: true },
              { key: 'secondary', color: 'var(--pos)', fill: false },
            ]}
            height={180}
            highlight={topTrendPoint ? { xValue: topTrendPoint.label, title: 'Peak', value: `$${topTrendPoint.primary}M` } : undefined}
          />
        ) : (
          <p className="py-8 text-center text-[12px]" style={{ color: 'var(--muted-2)' }}>No trend data yet</p>
        )}
      </SectionCard>

      {/* Intro pipeline */}
      <SectionCard
        title="Intro Pipeline"
        subtitle="Status of every introduction you've initiated"
        icon={Users}
        iconColor="var(--pos)"
        delay={0.25}
        action={<Badge variant="info">All time</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 items-center">
          <div className="flex items-center gap-4">
            <ConnectionMark size={80} />
            <div>
              <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--muted-2)' }}>Total intros</p>
              <HeroNumber value={introTotal} size="1.75rem" />
              <p className="text-[10px] font-medium mt-3 mb-0.5" style={{ color: 'var(--muted-2)' }}>Acceptance rate</p>
              <p className="font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                {acceptanceRate}<span style={{ color: 'var(--muted-2)', fontWeight: 600 }}>%</span>
              </p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted-2)' }}>
                {introBreakdown.pending} pending · {introBreakdown.accepted} accepted · {introBreakdown.declined} declined
              </p>
            </div>
          </div>

          {pipelineDonut.length > 0 ? (
            <div className="relative mx-auto" style={{ width: '100%', maxWidth: 170, height: 170, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={170} minWidth={0}>
                <PieChart>
                  <Pie
                    data={pipelineDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={pipelineDonut.length > 1 ? 3 : 0}
                    stroke="none"
                  >
                    {pipelineDonut.map((slice, i) => (
                      <Cell key={i} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-3)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--ink)', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[9px] uppercase tracking-wider font-medium" style={{ color: 'var(--muted-2)' }}>Accepted</p>
                <p className="font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                  {acceptanceRate}%
                </p>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-[13px]" style={{ color: 'var(--muted-2)' }}>
              No intros yet — send your first request from the marketplace
            </p>
          )}
        </div>

        {pipelineDonut.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {pipelineDonut.map(slice => (
              <span key={slice.name} className="inline-flex items-center gap-1.5 text-[12px]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: slice.color }} />
                <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{slice.name}</span>
                <span style={{ color: 'var(--muted-2)' }}>{slice.value}</span>
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Trending · Funding — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Trending Startups" subtitle="Most active this week" icon={Flame} iconColor="var(--neg)" delay={0.3}>
          {trending.map((item, i) => <TrendingMini key={item.startup_id} item={item as typeof trending[0]} rank={i + 1} />)}
          {trending.length === 0 && (
            <p className="text-center py-6 text-[12px]" style={{ color: 'var(--muted-2)' }}>No trending data yet</p>
          )}
        </SectionCard>

        <SectionCard title="Recent Funding" subtitle="Latest announcements" icon={DollarSign} iconColor="var(--pos)" delay={0.35}>
          {funding.map(round => (
            <div key={round.id} className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{round.company_name}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>{round.lead_investor} · {round.stage}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--pos)' }}>
                  {round.amount_usd ? formatAmount(round.amount_usd, 'USD') : 'N/A'}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{round.sector}</p>
              </div>
            </div>
          ))}
          {funding.length === 0 && (
            <p className="text-center py-6 text-[12px]" style={{ color: 'var(--muted-2)' }}>No funding data yet</p>
          )}
        </SectionCard>
      </div>

      {/* News carousel — full width, 2 articles per slide */}
      <NewsFeedWidget delay={0.4} twoUp />
    </div>
  )
}

// ─── VC Dashboard ────────────────────────────────
function VCDashboard() {
  const { user } = useAuth()
  const [vcStats, setVcStats] = useState({ approvedStartups: 0, portfolioCompanies: 0, deployedLabel: '$0', activeIntros: 0 })

  const loadVcStats = useCallback(async () => {
    const [startupsRes, portfolioRes, introRes] = await Promise.all([
      supabase.from('startup_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('portfolio_items').select('invested_amount, currency').eq('investor_id', user?.id ?? ''),
      supabase.from('introductions').select('id, status').eq('investor_id', user?.id ?? '').in('status', ['pending', 'accepted']),
    ])

    const totals = sumByCurrency(
      (portfolioRes.data ?? []) as Array<{ invested_amount: number | null; currency: Currency | null }>,
      row => row.invested_amount,
      row => row.currency,
    )
    setVcStats({
      approvedStartups: startupsRes.count ?? 0,
      portfolioCompanies: portfolioRes.data?.length ?? 0,
      deployedLabel: formatTotals(totals),
      activeIntros: introRes.data?.length ?? 0,
    })
  }, [user?.id])

  useEffect(() => {
    loadVcStats()

    const channel = supabase.channel('vc-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'introductions', filter: `investor_id=eq.${user?.id}` }, () => loadVcStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_items', filter: `investor_id=eq.${user?.id}` }, () => loadVcStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadVcStats])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatPill icon={DollarSign} label="Capital Deployed" value={vcStats.deployedLabel} color="var(--blue)" delay={0} />
        <StatPill icon={Building2} label="Approved Startups" value={vcStats.approvedStartups} color="var(--pos)" delay={0.05} />
        <StatPill icon={Users} label="Portfolio Companies" value={vcStats.portfolioCompanies} color="#3486e8" delay={0.1} />
        <StatPill icon={MessageSquare} label="Active Intros" value={vcStats.activeIntros} color="#f59e0b" delay={0.15} />
      </div>

      <AngelVCDashboard />
    </div>
  )
}

// ─── Bank / NBFC Dashboard ──────────────────────────────────────
function BankNBFCDashboard() {
  const [bankKpis, setBankKpis] = useState({ total: 0, underReview: 0, approved: 0 })
  const [bankKpisLoading, setBankKpisLoading] = useState(true)
  const [sectorData, setSectorData] = useState<Array<{ name: string; value: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Run three lightweight count queries in parallel instead of fetching
      // the entire table — avoids a full sequential scan on large datasets.
      const [totalRes, underReviewRes, approvedRes, sectorRes] = await Promise.all([
        supabase.from('startup_applications').select('*', { count: 'exact', head: true }),
        supabase.from('startup_applications').select('*', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('startup_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('startup_applications').select('sector').limit(500),
      ])

      setBankKpis({
        total:       totalRes.count ?? 0,
        underReview: underReviewRes.count ?? 0,
        approved:    approvedRes.count ?? 0,
      })

      const counts: Record<string, number> = {}
      for (const row of sectorRes.data ?? []) {
        const s = row.sector ?? 'Other'
        counts[s] = (counts[s] ?? 0) + 1
      }
      setSectorData(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })))

      setBankKpisLoading(false)
      setLoading(false)
    }
    load()
  }, [])

  const CHART_COLORS = ['var(--blue)', 'var(--pos)', 'var(--warn)', '#7C3AED', '#0891B2', '#f59e0b']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {bankKpisLoading
          ? [...Array(4)].map((_, i) => <SkeletonBlock key={i} height={80} />)
          : <>
              <StatPill icon={FileText} label="Total Applications" value={bankKpis.total} color="var(--blue)" delay={0} />
              <StatPill icon={Clock} label="Under Review" value={bankKpis.underReview} color="#f59e0b" delay={0.05} />
              <StatPill icon={CheckCircle} label="Approved" value={bankKpis.approved} color="var(--pos)" delay={0.1} />
              <StatPill icon={DollarSign} label="Avg Deal Size" value="—" color="#59cbef" delay={0.15} />
            </>
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Applications by Sector" subtitle="Sector distribution" icon={BarChart2} iconColor="var(--blue)" delay={0.2}>
          {loading ? <SkeletonBlock height={192} /> : (
            <ResponsiveContainer width="100%" height={200} minWidth={0}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {sectorData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--line)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Recent Applications" subtitle="Latest startup funding requests" icon={Briefcase} iconColor="var(--pos)" delay={0.25}>
          {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <SkeletonBlock key={i} height={48} />)}</div> : (
            <div className="py-8 text-center">
              <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>Applications will appear here as startups submit funding requests.</p>
            </div>
          )}
        </SectionCard>
      </div>

      <NewsFeedWidget delay={0.35} />
    </div>
  )
}

// ─── Family Office Dashboard ─────────────────────────────────────
function FamilyOfficeDashboard() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState<Array<{ id: string; external_name: string; external_sector: string; invested_amount: number; current_value: number; moic: number; status: string; currency: Currency }>>([])
  const [stats, setStats] = useState({ companies: 0, deployedLabel: '$0', avgMoic: 0, coInvest: 0 })
  const [loading, setLoading] = useState(true)

  const loadFOStats = useCallback(async () => {
    const [portfolioRes, coInvestRes] = await Promise.all([
      supabase.from('portfolio_items').select('*').eq('investor_id', user?.id ?? '').order('created_at', { ascending: false }),
      supabase.from('introductions').select('id', { count: 'exact', head: true }).eq('investor_id', user?.id ?? '').eq('status', 'accepted'),
    ])

    const items = portfolioRes.data ?? []
    const totals = sumByCurrency(
      items as Array<{ invested_amount: number | null; currency: Currency | null }>,
      row => row.invested_amount,
      row => row.currency,
    )
    const avgMoic = items.length ? items.reduce((sum, p) => sum + (p.moic ?? 1), 0) / items.length : 0

    setPortfolio(items as typeof portfolio)
    setStats({ companies: items.length, deployedLabel: formatTotals(totals), avgMoic: parseFloat(avgMoic.toFixed(2)), coInvest: coInvestRes.count ?? 0 })
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadFOStats()

    const channel = supabase.channel('fo-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_items', filter: `investor_id=eq.${user?.id}` }, () => loadFOStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'introductions', filter: `investor_id=eq.${user?.id}` }, () => loadFOStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadFOStats])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatPill icon={DollarSign} label="AUM Deployed" value={stats.deployedLabel} color="var(--blue)" delay={0} />
        <StatPill icon={Building2} label="Portfolio Companies" value={stats.companies} color="var(--pos)" delay={0.05} />
        <StatPill icon={TrendingUp} label="Avg MOIC" value={`${stats.avgMoic}x`} color="#3486e8" delay={0.1} />
        <StatPill icon={Users} label="Co-invest Opps" value={stats.coInvest} color="#f59e0b" delay={0.15} />
      </div>

      <SectionCard title="Portfolio Performance" subtitle="Current holdings" icon={TrendingUp} iconColor="var(--pos)" delay={0.2}>
        {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <SkeletonBlock key={i} height={48} />)}</div> : portfolio.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
            <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No portfolio items yet. Add your first investment from the Portfolio page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full">
              <thead>
                <tr>{['Company', 'Sector', 'Invested', 'Current Value', 'MOIC', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 pr-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--muted-2)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {portfolio.slice(0, 5).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="py-3 pr-3 text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{item.external_name}</td>
                    <td className="py-3 pr-3 text-[12px]" style={{ color: 'var(--muted-2)' }}>{item.external_sector}</td>
                    <td className="py-3 pr-3 text-[13px] tabular-nums" style={{ color: 'var(--ink)' }}>{formatAmount(item.invested_amount, item.currency ?? 'USD')}</td>
                    <td className="py-3 pr-3 text-[13px] tabular-nums" style={{ color: 'var(--pos)' }}>{formatAmount(item.current_value, item.currency ?? 'USD')}</td>
                    <td className="py-3 pr-3 text-[13px] font-semibold tabular-nums" style={{ color: item.moic >= 1 ? 'var(--pos)' : 'var(--neg)' }}>{item.moic}x</td>
                    <td className="py-3">
                      <Badge variant={item.status === 'Active' ? 'success' : 'info'}>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <NewsFeedWidget delay={0.35} />
    </div>
  )
}

// ─── CVC Dashboard ───────────────────────────────────────────────
function CVCDashboard() {
  const { user } = useAuth()
  const [cvcKpis, setCvcKpis] = useState({ strategicTargets: 0, partnershipProposals: 0, successRate: 0, trackedSectors: 0 })
  const [cvcKpisLoading, setCvcKpisLoading] = useState(true)
  const [sectorData, setSectorData] = useState<Array<{ name: string; count: number }>>([])
  const [loading, setLoading] = useState(true)

  const loadCvcStats = useCallback(async () => {
    const [appsRes, introsRes, secRes] = await Promise.all([
      supabase.from('startup_applications').select('id', { count: 'exact', head: true }),
      supabase.from('introductions').select('status').eq('investor_id', user?.id ?? ''),
      supabase.from('startup_applications').select('sector').eq('status', 'approved'),
    ])

    const strategicTargets = appsRes.count ?? 0
    const allIntros = introsRes.data ?? []
    const partnershipProposals = allIntros.filter(r => r.status === 'pending').length
    const accepted = allIntros.filter(r => r.status === 'accepted').length
    const successRate = allIntros.length > 0 ? Math.round((accepted / allIntros.length) * 100) : 0

    const counts: Record<string, number> = {}
    ;(secRes.data ?? []).forEach(s => { counts[s.sector ?? 'Other'] = (counts[s.sector ?? 'Other'] ?? 0) + 1 })
    setSectorData(Object.entries(counts).map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 6))
    setCvcKpis({
      strategicTargets,
      partnershipProposals,
      successRate,
      trackedSectors: Object.keys(counts).length,
    })
    setCvcKpisLoading(false)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    loadCvcStats()

    const channel = supabase.channel('cvc-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'introductions', filter: `investor_id=eq.${user?.id}` }, () => loadCvcStats())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'startup_applications' }, () => loadCvcStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadCvcStats])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cvcKpisLoading
          ? [...Array(4)].map((_, i) => <SkeletonBlock key={i} height={80} />)
          : <>
              <StatPill icon={Target} label="Strategic Targets" value={cvcKpis.strategicTargets} color="var(--blue)" delay={0} />
              <StatPill icon={MessageSquare} label="Partnership Proposals" value={cvcKpis.partnershipProposals} color="var(--pos)" delay={0.05} />
              <StatPill icon={BarChart2} label="Success Rate" value={`${cvcKpis.successRate}%`} color="#3486e8" delay={0.1} />
              <StatPill icon={Building2} label="Tracked Sectors" value={cvcKpis.trackedSectors} color="#f59e0b" delay={0.15} />
            </>
        }
      </div>

      <SectionCard title="Strategic Sectors" subtitle="Startup activity by sector" icon={Target} iconColor="var(--blue)" delay={0.2}>
        {loading ? <SkeletonBlock height={192} /> : (
          <PillBarChart
            data={sectorData}
            xKey="name"
            yKey="count"
            height={240}
            color="var(--blue)"
            accentColor="#10B981"
            accentIndexes={sectorData.length > 0 ? [sectorData.reduce((bi, r, i, arr) => r.count > arr[bi].count ? i : bi, 0)] : []}
          />
        )}
      </SectionCard>

      <NewsFeedWidget delay={0.35} />
    </div>
  )
}

// ─── Idea Stage Founder Dashboard ────────────────────────────────
function IdeaFounderDashboard() {
  const [events, setEvents] = useState<Array<{ id: string; title: string; event_type: string; host: string; starts_at: string; is_virtual: boolean; audience: string }>>([])
  const [news, setNews] = useState<Array<{ id: string; title: string; source_name: string; category: string; published_at: string; url: string; is_featured: boolean }>>([])
  const [grants, setGrants] = useState<Array<{ id: string; program_name: string; provider: string | null; amount_text: string | null; government_level: string | null; state_name: string | null; deadline: string | null; apply_url: string | null; source_url: string | null }>>([])

  useEffect(() => {
    async function load() {
      const [eventsRes, newsRes, grantsRes] = await Promise.all([
        supabase.from('events').select('*').gt('starts_at', new Date().toISOString()).order('starts_at').limit(4),
        supabase.from('news_articles').select('*').order('published_at', { ascending: false }).limit(4),
        supabase.from('grants').select('id, program_name, provider, amount_text, government_level, state_name, deadline, apply_url, source_url').eq('is_active', true).order('deadline', { ascending: true, nullsFirst: false }).limit(4),
      ])
      let eventRows = (eventsRes.data ?? []) as typeof events
      if (eventRows.length === 0) {
        const { data: recent } = await supabase
          .from('events')
          .select('*')
          .order('starts_at', { ascending: false })
          .limit(4)
        eventRows = (recent ?? []) as typeof events
      }
      setEvents(eventRows)
      setNews((newsRes.data ?? []) as typeof news)
      setGrants((grantsRes.data ?? []) as typeof grants)
    }
    load()
  }, [])

  const { profile } = useAuth()

  return (
    <div className="space-y-4">
      {/* Grants highlight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(37,99,235,0.06) 100%)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ background: 'rgba(22,163,74,0.15)' }}
            >
              <Landmark className="w-5 h-5" style={{ color: 'var(--pos)' }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>Govt Grants & Schemes</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{grants.length > 0 ? `${grants.length}+ active programs for startups` : 'Discover funding from central & state governments'}</p>
            </div>
          </div>
          <a
            href="/dashboard/grants"
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all active:scale-[0.97]"
            style={{ background: 'var(--pos)', color: 'white' }}
          >
            Explore All
          </a>
        </div>
        {grants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {grants.slice(0, 4).map(g => (
              <a key={g.id} href={g.apply_url || g.source_url || '/dashboard/grants'} target="_blank" rel="noopener noreferrer"
                className="p-3.5 flex items-start gap-3 transition-all active:scale-[0.98]"
                style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{g.program_name}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                    {g.provider}{g.government_level === 'state' && g.state_name ? ` · ${g.state_name}` : ''}
                  </p>
                </div>
                {g.amount_text && (
                  <span
                    className="font-semibold shrink-0 px-2 py-0.5 rounded-[6px] text-[11px]"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                  >
                    {g.amount_text}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </motion.div>

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(52,134,232,0.05) 100%)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--blue-bg)' }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: 'var(--blue)' }} />
          </div>
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Welcome, {profile?.first_name}!
          </h2>
        </div>
        <p className="text-[13px] mb-4" style={{ color: 'var(--muted)' }}>
          You're at the idea stage. Here's how to get started on FounderCentral.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Connect with Mentors', icon: Users, color: '#3486e8' },
            { label: 'Find Co-founders', icon: Users, color: 'var(--pos)' },
            { label: 'Pre-seed Investors', icon: DollarSign, color: 'var(--warn)' },
            { label: 'Join Community', icon: Star, color: '#59cbef' },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label}
              className="p-3.5 text-center cursor-pointer transition-all active:scale-[0.97] rounded-[12px]"
              style={{ background: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div
                className="w-9 h-9 rounded-[8px] flex items-center justify-center mx-auto mb-2"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Upcoming Events" subtitle="Don't miss these opportunities" icon={Calendar} iconColor="var(--blue)" delay={0.2}>
          {events.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No upcoming events</p>
            </div>
          ) : events.map(event => (
            <div key={event.id} className="flex items-start gap-3 py-3"
              style={{ borderBottom: '1px solid var(--line)' }}>
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0 rounded-[8px]"
                style={{ background: 'var(--blue-bg)' }}
              >
                <Calendar className="w-4 h-4" style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{event.title}</p>
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                  {event.host} · {new Date(event.starts_at).toLocaleDateString()} · {event.is_virtual ? 'Virtual' : event.audience}
                </p>
              </div>
            </div>
          ))}
        </SectionCard>

        <NewsFeedWidget delay={0.25} />
      </div>
    </div>
  )
}

// ─── Active Founder Dashboard ────────────────────────────────────
type InvestorMatch = {
  investor_id: string
  score: number
  reasons: string[]
  first_name: string | null
  last_name: string | null
  company: string | null
  avatar_url: string | null
  investor_type: string | null
  fund_name: string | null
  title: string | null
  computed_at: string | null
}

const MATCH_STALE_MS = 24 * 60 * 60 * 1000

function formatInvestorName(m: InvestorMatch): string {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ').trim()
  if (full) return full
  return m.fund_name || m.company || 'Investor'
}

function formatInvestorType(t: string | null): string {
  if (!t) return ''
  return t.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

// ─── Fit-score explainer (click-to-open info popover) ────────────
const FIT_PARAMS: { icon: React.ElementType; label: string; desc: string; color: string }[] = [
  { icon: Target,     label: 'Sector',     desc: 'your industry vs. their focus sectors',  color: 'var(--blue)' },
  { icon: TrendingUp, label: 'Stage',      desc: 'your stage vs. their investment stages', color: '#8b5cf6' },
  { icon: Globe,      label: 'Geography',  desc: 'your region vs. their geographic focus', color: '#0891B2' },
  { icon: DollarSign, label: 'Check size', desc: 'your ask vs. their typical cheque',      color: 'var(--pos)' },
]

function FitScoreInfo() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0 inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="How the fit score is calculated"
        aria-expanded={open}
        className={`flex items-center justify-center cursor-pointer transition-colors ${open ? 'text-[var(--blue)]' : 'text-[var(--muted-2)] hover:text-[var(--blue)]'}`}
      >
        <Info className="w-4 h-4" />
      </button>
      {open && (
        <>
          {/* click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            className="absolute left-0 top-full mt-2 w-80 max-w-[80vw] z-50 rounded-[14px] overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-pop)' }}
          >
            <div
              className="px-3.5 py-2.5"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(37,99,235,0.06))', borderBottom: '1px solid var(--line)' }}
            >
              <p className="text-[12px] font-bold" style={{ color: 'var(--ink)' }}>How the fit score works</p>
              <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: 'var(--muted-2)' }}>
                Each score (0–100) shows how closely your listing matches an investor's stated preferences.
              </p>
            </div>
            <ul className="px-3.5 py-2.5 space-y-2">
              {FIT_PARAMS.map(({ icon: I, label, desc, color }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
                    <I className="w-3 h-3" style={{ color }} />
                  </span>
                  <p className="text-[11px] leading-snug min-w-0">
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
                    <span style={{ color: 'var(--muted-2)' }}> — {desc}</span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="px-3.5 pb-2.5">
              <p className="text-[10px] leading-snug px-2.5 py-1.5 rounded-[7px]" style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
                The ✓ points on each card explain that investor's specific match.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ActiveFounderDashboard() {
  const { user, profile, incubationProfile } = useAuth()
  const [startup, setStartup] = useState<{ id: string; status: string; total_intros: number; total_deck_downloads: number; total_views: number } | null>(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [pendingDeckRequests, setPendingDeckRequests] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [deckScores, setDeckScores] = useState<{
    status: string | null; overall: number; deck: number; website: number | null; fit: number | null; report_path: string | null
  } | null>(null)
  const [events, setEvents] = useState<Array<{ id: string; title: string; event_type: string | null; start_date: string | null; start_date_text: string | null; is_online: boolean; city: string | null; country: string | null; organizer: string | null; registration_url: string | null; source_url: string }>>([])
  const [grants, setGrants] = useState<Array<{ id: string; program_name: string; provider: string | null; amount_text: string | null; government_level: string | null; state_name: string | null; deadline: string | null; apply_url: string | null; source_url: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<InvestorMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [matchesRefreshing, setMatchesRefreshing] = useState(false)
  const [incubationNews, setIncubationNews] = useState<Array<{ id: string; title: string; source_name: string; category: string; published_at: string; url: string; is_featured: boolean }>>([])
  const [incubationEvents, setIncubationEvents] = useState<Array<{ id: string; title: string; event_type: string | null; start_date: string | null; start_date_text: string | null; is_online: boolean; city: string | null; country: string | null; organizer: string | null; registration_url: string | null; source_url: string }>>([])

  useEffect(() => {
    async function load() {
      const uid = user?.id ?? ''

      // Fire ALL independent queries in parallel
      const [startupRowsRes, evalRowsRes, founderProfileRes, deckReqRes, notifRes, eventsRes, grantsRes] = await Promise.all([
        supabase.from('startup_applications').select('id, status, total_intros, total_deck_downloads, total_views').eq('founder_id', uid).order('reviewed_at', { ascending: false, nullsFirst: false }).order('submitted_at', { ascending: false, nullsFirst: false }).limit(5),
        supabase.from('startup_applications').select('deck_evaluation_status, deck_overall_score, deck_pdf_score, deck_website_score, deck_fit_score, deck_report_path').eq('founder_id', uid).not('deck_overall_score', 'is', null).order('deck_overall_score', { ascending: false }).limit(1),
        supabase.from('founder_profiles').select('id').eq('profile_id', uid).maybeSingle(),
        supabase.from('deck_access_requests').select('id', { count: 'exact', head: true }).eq('founder_id', uid).eq('status', 'pending'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('read', false),
        supabase.from('scraped_events').select('id, title, event_type, start_date, start_date_text, is_online, city, country, organizer, registration_url, source_url').eq('is_active', true).gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(4),
        supabase.from('grants').select('id, program_name, provider, amount_text, government_level, state_name, deadline, apply_url, source_url').eq('is_active', true).order('deadline', { ascending: true, nullsFirst: false }).limit(3),
      ])

      const startupRows = startupRowsRes.data
      const STATUS_RANK: Record<string, number> = { approved: 4, under_review: 3, submitted: 2, draft: 1, rejected: 0 }
      const startupData = (startupRows ?? []).sort((a, b) => (STATUS_RANK[b.status] ?? 0) - (STATUS_RANK[a.status] ?? 0))[0] ?? null
      setStartup(startupData)

      const evalRow = evalRowsRes.data?.[0] ?? null
      if (evalRow?.deck_overall_score != null) {
        setDeckScores({
          status: evalRow.deck_evaluation_status,
          overall: evalRow.deck_overall_score,
          deck: evalRow.deck_pdf_score ?? 0,
          website: evalRow.deck_website_score,
          fit: evalRow.deck_fit_score,
          report_path: evalRow.deck_report_path,
        })
      }

      // Bookmark count needs founderProfile.id — one dependent query
      if (founderProfileRes.data?.id) {
        const { data: bookmarkRows } = await supabase
          .from('founder_bookmarks')
          .select('investor_id')
          .eq('founder_profile_id', founderProfileRes.data.id)
        setBookmarkCount(new Set((bookmarkRows ?? []).map(row => row.investor_id)).size)
      }

      setPendingDeckRequests(deckReqRes.count ?? 0)
      setUnreadNotifications(notifRes.count ?? 0)
      let eventRows = (eventsRes.data ?? []) as typeof events
      if (eventRows.length === 0) {
        const { data: recent } = await supabase
          .from('scraped_events')
          .select('id, title, event_type, start_date, start_date_text, is_online, city, country, organizer, registration_url, source_url')
          .eq('is_active', true)
          .order('start_date', { ascending: false })
          .limit(4)
        eventRows = (recent ?? []) as typeof events
      }
      setEvents(eventRows)
      setGrants((grantsRes.data ?? []) as typeof grants)
      setLoading(false)
    }
    load()
  }, [user?.id])

  const loadMatches = async () => {
    if (!user?.id) return
    const { data: matchRows } = await supabase
      .from('matches')
      .select('investor_id, score, match_reasons, computed_at')
      .eq('founder_id', user.id)
      .eq('is_active', true)
      .order('score', { ascending: false })
      .limit(5)

    const ids = (matchRows ?? []).map(m => m.investor_id)
    let profs: Array<{ id: string; first_name: string | null; last_name: string | null; company: string | null; avatar_url: string | null; investor_type: string | null }> = []
    let invProfs: Array<{ user_id: string; fund_name: string | null; title: string | null }> = []
    if (ids.length) {
      const [p, ip] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, company, avatar_url, investor_type').in('id', ids),
        supabase.from('investor_profiles').select('user_id, fund_name, title').in('user_id', ids),
      ])
      profs = (p.data ?? []) as typeof profs
      invProfs = (ip.data ?? []) as typeof invProfs
    }
    const profById = Object.fromEntries(profs.map(p => [p.id, p]))
    const invById = Object.fromEntries(invProfs.map(p => [p.user_id, p]))

    const view: InvestorMatch[] = (matchRows ?? []).map(m => ({
      investor_id: m.investor_id,
      score: Number(m.score),
      reasons: (m.match_reasons ?? []) as string[],
      first_name: profById[m.investor_id]?.first_name ?? null,
      last_name: profById[m.investor_id]?.last_name ?? null,
      company: profById[m.investor_id]?.company ?? null,
      avatar_url: profById[m.investor_id]?.avatar_url ?? null,
      investor_type: profById[m.investor_id]?.investor_type ?? null,
      fund_name: invById[m.investor_id]?.fund_name ?? null,
      title: invById[m.investor_id]?.title ?? null,
      computed_at: m.computed_at,
    }))
    setMatches(view)
    setMatchesLoading(false)

    const newest = view[0]?.computed_at
    const isStale = view.length === 0 || (newest && Date.now() - new Date(newest).getTime() > MATCH_STALE_MS)
    if (isStale) refreshMatches({ silent: true })
  }

  const refreshMatches = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setMatchesRefreshing(true)
    try {
      const { data, error } = await supabase.functions.invoke('compute-matches', { body: {} })
      if (error) throw error
      const fresh = (data?.matches ?? []) as Array<{
        investor_id: string
        score: number
        reasons: string[]
        investor: {
          first_name: string | null
          last_name: string | null
          company: string | null
          avatar_url: string | null
          investor_type: string | null
          fund_name: string | null
          title: string | null
        }
      }>
      const view: InvestorMatch[] = fresh.slice(0, 5).map(m => ({
        investor_id: m.investor_id,
        score: m.score,
        reasons: m.reasons ?? [],
        first_name: m.investor?.first_name ?? null,
        last_name: m.investor?.last_name ?? null,
        company: m.investor?.company ?? null,
        avatar_url: m.investor?.avatar_url ?? null,
        investor_type: m.investor?.investor_type ?? null,
        fund_name: m.investor?.fund_name ?? null,
        title: m.investor?.title ?? null,
        computed_at: new Date().toISOString(),
      }))
      setMatches(view)
      if (!silent && view.length > 0) toast.success('Matches updated')
      if (!silent && view.length === 0) toast.message('No matches yet — add more detail to your listing.')
    } catch {
      if (!silent) toast.error('Could not refresh matches')
    } finally {
      if (!silent) setMatchesRefreshing(false)
    }
  }

  useEffect(() => { if (user?.id) loadMatches() }, [user?.id])

  useEffect(() => {
    const ownerId = incubationProfile?.owner_id
    if (!ownerId) return
    Promise.all([
      supabase.from('news_articles').select('id, title, source_name, category, published_at, url, is_featured').eq('created_by', ownerId).order('published_at', { ascending: false }).limit(4),
      supabase.from('scraped_events').select('id, title, event_type, start_date, start_date_text, is_online, city, country, organizer, registration_url, source_url').eq('created_by', ownerId).order('start_date', { ascending: true }).limit(4),
    ]).then(([newsRes, eventsRes]) => {
      setIncubationNews((newsRes.data ?? []) as typeof incubationNews)
      setIncubationEvents((eventsRes.data ?? []) as typeof incubationEvents)
    })
  }, [incubationProfile?.owner_id])

  const isDraft = !loading && (!startup || startup.status === 'draft')
  const isPendingReview = !loading && startup && (startup.status === 'submitted' || startup.status === 'under_review')
  const isRejected = !loading && startup && startup.status === 'rejected'

  return (
    <div className="space-y-4">
      {/* Status banners */}
      {isDraft && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, var(--blue) 0%, #1D4ED8 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(37,99,235,0.12)',
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Rocket className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: 'white' }}>Complete your startup application</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Get approved to appear on the investor marketplace.</p>
          </div>
          <a href="/dashboard/my-listing"
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all active:scale-[0.97]"
            style={{ background: 'white', color: 'var(--blue)' }}>
            Apply Now
          </a>
        </motion.div>
      )}
      {isPendingReview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Clock className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: 'white' }}>Application under review</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Your application has been submitted and is being reviewed by our team.</p>
          </div>
          <a href="/dashboard/my-listing"
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all active:scale-[0.97]"
            style={{ background: 'white', color: '#D97706' }}>
            View Status
          </a>
        </motion.div>
      )}
      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(239,68,68,0.12)',
          }}
        >
          <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-[10px]"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Rocket className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: 'white' }}>Application needs updates</p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Your application was not approved. Update your listing and resubmit.</p>
          </div>
          <a href="/dashboard/my-listing"
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold whitespace-nowrap transition-all active:scale-[0.97]"
            style={{ background: 'white', color: '#DC2626' }}>
            Update & Resubmit
          </a>
        </motion.div>
      )}

      {/* KPI grid — balanced 6-up */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatPill icon={MessageSquare} label="Intro Requests" value={startup?.total_intros ?? 0} color="var(--blue)" delay={0} />
        <StatPill icon={Eye} label="Profile Visits" value={startup?.total_views ?? 0} color="#8b5cf6" delay={0.05} />
        <StatPill icon={Bookmark} label="Bookmarked By" value={bookmarkCount} color="#3486e8" delay={0.1} />
        <StatPill icon={Download} label="Deck Downloads" value={startup?.total_deck_downloads ?? 0} color="#f59e0b" delay={0.15} />
        <StatPill icon={Bell} label="Unread Notifications" value={unreadNotifications} color="var(--neg)" delay={0.2} />
        <StatPill icon={FileText} label="Pending Deck Requests" value={pendingDeckRequests} color="var(--warn)" delay={0.25} />
      </div>

      {/* Deck Evaluation Scores */}
      {deckScores && (
        <SectionCard
          title="Pitch Deck AI Score"
          subtitle="14-dimension evaluation by AI"
          icon={Sparkles}
          iconColor="var(--blue)"
          delay={0.3}
          action={
            deckScores.report_path ? (
              <a
                href="/dashboard/my-listing"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold transition-all active:scale-[0.97]"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
              >
                View Report <ArrowUpRight className="w-3 h-3" />
              </a>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Overall', value: deckScores.overall, color: deckScores.overall >= 70 ? 'var(--pos)' : deckScores.overall >= 50 ? 'var(--blue)' : 'var(--warn)' },
              { label: 'Deck', value: deckScores.deck, color: deckScores.deck >= 70 ? 'var(--pos)' : deckScores.deck >= 50 ? 'var(--blue)' : 'var(--warn)' },
              { label: 'Website', value: deckScores.website, color: (deckScores.website ?? 0) >= 70 ? 'var(--pos)' : (deckScores.website ?? 0) >= 50 ? 'var(--blue)' : 'var(--warn)' },
              { label: 'Fit', value: deckScores.fit, color: (deckScores.fit ?? 0) >= 70 ? 'var(--pos)' : (deckScores.fit ?? 0) >= 50 ? 'var(--blue)' : 'var(--warn)' },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3.5 rounded-[12px]"
                style={{ background: 'var(--surface-2)' }}
              >
                <ProgressRing
                  value={item.value ?? 0}
                  size={44}
                  thickness={5}
                  color={item.color}
                  trackColor="var(--line)"
                  label={item.value != null ? `${item.value}` : '—'}
                />
                <div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--muted-2)' }}>{item.label}</p>
                  <p className="text-[15px] font-bold" style={{ color: item.value != null ? item.color : 'var(--muted-2)' }}>
                    {item.value != null ? `${item.value}/100` : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Matched Investors */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="relative"
        style={cardStyle}
      >
        {/* Gradient header */}
        <div
          className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-t-[15px]"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.13) 0%, rgba(37,99,235,0.07) 55%, transparent 100%)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 6px 16px rgba(139,92,246,0.35)' }}
            >
              <Award className="w-[22px] h-[22px]" style={{ color: '#fff' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[15px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>Best Matched Investors</p>
                <FitScoreInfo />
              </div>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted-2)' }}>
                AI-scored fit between your listing and investor preferences
              </p>
            </div>
          </div>
          <button
            onClick={() => refreshMatches()}
            disabled={matchesRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-60 shrink-0"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${matchesRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{matchesRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {matchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} height={92} />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="py-10 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>No matches yet</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--muted-2)' }}>
                Complete your listing with sector, stage, and funding ask to unlock matches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map((m, idx) => {
                const name = formatInvestorName(m)
                const subtitle = [m.title, m.fund_name].filter(Boolean).join(' · ') || formatInvestorType(m.investor_type) || 'Investor'
                const initials = (name.split(' ').map(n => n[0]).join('').slice(0, 2) || '?').toUpperCase()
                const scoreColor = m.score >= 75 ? 'var(--pos)' : m.score >= 50 ? 'var(--blue)' : 'var(--warn)'
                return (
                  <motion.div key={m.investor_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.3 }}
                    whileHover={{ y: -3, boxShadow: '0 12px 26px rgba(13,27,42,0.10), 0 3px 8px rgba(13,27,42,0.05)' }}
                    className="group relative p-4 pl-5 h-full flex flex-col rounded-[14px] overflow-hidden"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                    {/* Score accent stripe */}
                    <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]"
                      style={{ background: `linear-gradient(180deg, ${scoreColor}, ${scoreColor}55)` }} />
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={name}
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                          style={{ border: `2px solid ${scoreColor}` }} />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-[13px]"
                          style={{ background: `${scoreColor}1a`, color: scoreColor, border: `2px solid ${scoreColor}55` }}>
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>{subtitle}</p>
                      </div>
                      <div className="shrink-0">
                        <ProgressRing
                          value={m.score}
                          size={46}
                          thickness={5}
                          color={scoreColor}
                          trackColor="var(--line)"
                          label={`${m.score}`}
                        />
                      </div>
                    </div>
                    {m.reasons.length > 0 && (
                      <ul className="mt-3 space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                        {m.reasons.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 leading-snug text-[11px]" style={{ color: 'var(--muted)' }}>
                            <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: 'var(--pos)' }} />
                            <span>{stripMarkdown(r)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Upcoming Events"
          subtitle="Conferences, demo days & meetups"
          icon={Calendar}
          iconColor="var(--blue)"
          delay={0.4}
          action={
            <a href="/dashboard/events"
              className="px-3 py-1 rounded-[8px] text-[11px] font-semibold transition-all active:scale-[0.97]"
              style={{ color: 'var(--blue)', background: 'var(--blue-bg)' }}>
              View All
            </a>
          }
        >
          {events.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No upcoming events</p>
            </div>
          ) : events.map((event, i) => {
            const d = event.start_date ? new Date(event.start_date) : null
            const valid = d && !Number.isNaN(d.getTime())
            const month = valid ? d!.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '—'
            const day = valid ? String(d!.getDate()).padStart(2, '0') : '—'
            const loc = event.is_online ? 'Online' : (event.city || event.country || 'Location TBA')
            return (
              <a key={event.id} href={event.registration_url || event.source_url || '/dashboard/events'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-[10px] group transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderBottom: i < events.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div
                  className="w-10 h-11 flex flex-col items-center justify-center shrink-0 rounded-[10px]"
                  style={{ background: 'var(--blue-bg)' }}
                >
                  <span className="text-[9px] font-bold leading-none" style={{ color: 'var(--blue)' }}>{month}</span>
                  <span className="text-[15px] font-bold leading-tight" style={{ color: 'var(--blue)' }}>{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold truncate group-hover:underline" style={{ color: 'var(--ink)' }}>{event.title}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                    {[event.event_type, loc].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--blue)' }} />
              </a>
            )
          })}
        </SectionCard>

        <SectionCard
          title="Govt Grants & Schemes"
          icon={Landmark}
          iconColor="var(--pos)"
          delay={0.45}
          action={
            <a href="/dashboard/grants"
              className="px-3 py-1 rounded-[8px] text-[11px] font-semibold transition-all active:scale-[0.97]"
              style={{ color: 'var(--blue)', background: 'var(--blue-bg)' }}>
              View All
            </a>
          }
        >
          {grants.length === 0 ? (
            <div className="text-center py-6">
              <Landmark className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No active grants right now</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>Check back soon — new schemes are added regularly.</p>
            </div>
          ) : grants.map((g, i) => (
            <a key={g.id} href={g.apply_url || g.source_url || '/dashboard/grants'} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-[10px] group transition-all active:scale-[0.99] hover:bg-[var(--surface-2)]"
              style={{ borderBottom: i < grants.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div
                className="w-8 h-8 flex items-center justify-center shrink-0 rounded-[8px]"
                style={{ background: g.government_level === 'state' ? 'rgba(22,163,74,0.12)' : 'var(--blue-bg)' }}
              >
                <Landmark className="w-4 h-4" style={{ color: g.government_level === 'state' ? 'var(--pos)' : 'var(--blue)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate group-hover:underline" style={{ color: 'var(--ink)' }}>{g.program_name}</p>
                <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                  {g.provider}{g.state_name ? ` · ${g.state_name}` : ''}{g.amount_text ? ` · ${g.amount_text}` : ''}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--blue)' }} />
            </a>
          ))}
        </SectionCard>
      </div>

      <NewsFeedWidget delay={0.45} />

      {/* Incubation News & Events — only visible when founder is in an incubation */}
      {profile?.incubation_id && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="From Your Incubation — News"
            subtitle={incubationProfile?.name ?? 'Your Program'}
            icon={Newspaper}
            iconColor="#8b5cf6"
            delay={0.5}
          >
            {incubationNews.length === 0 ? (
              <div className="text-center py-6">
                <Newspaper className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
                <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No news articles yet</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>Your incubation admin will post updates here.</p>
              </div>
            ) : incubationNews.map(article => (
              <NewsMini key={article.id} article={article} />
            ))}
          </SectionCard>

          <SectionCard
            title="From Your Incubation — Events"
            subtitle={incubationProfile?.name ?? 'Your Program'}
            icon={GraduationCap}
            iconColor="#059669"
            delay={0.55}
          >
            {incubationEvents.length === 0 ? (
              <div className="text-center py-6">
                <GraduationCap className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
                <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No upcoming events</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>Your incubation admin will post events here.</p>
              </div>
            ) : incubationEvents.map((event, i) => {
              const d = event.start_date ? new Date(event.start_date) : null
              const valid = d && !Number.isNaN(d.getTime())
              const month = valid ? d!.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '—'
              const day = valid ? String(d!.getDate()).padStart(2, '0') : '—'
              const loc = event.is_online ? 'Online' : (event.city || event.country || 'Location TBA')
              return (
                <a key={event.id} href={event.registration_url || event.source_url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-[10px] group transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderBottom: i < incubationEvents.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div
                    className="w-10 h-11 flex flex-col items-center justify-center shrink-0 rounded-[10px]"
                    style={{ background: 'rgba(5,150,105,0.1)' }}
                  >
                    <span className="text-[9px] font-bold leading-none" style={{ color: '#059669' }}>{month}</span>
                    <span className="text-[15px] font-bold leading-tight" style={{ color: '#059669' }}>{day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold truncate group-hover:underline" style={{ color: 'var(--ink)' }}>{event.title}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                      {[event.event_type, loc].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#059669' }} />
                </a>
              )
            })}
          </SectionCard>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Router ───────────────────────────────────────
export function DashboardHome() {
  const { profile } = useAuth()

  const getTitle = () => {
    if (profile?.role === 'investor') {
      const typeLabels: Record<string, string> = {
        angel: 'Angel Investor', 'venture-capital': 'Venture Capital', bank: 'Bank',
        nbfc: 'NBFC', 'family-office': 'Family Office', 'corporate-venture': 'Corporate VC',
      }
      return typeLabels[profile.investor_type ?? ''] ?? 'Investor'
    }
    return profile?.founder_type === 'active' ? 'Startup Founder' : 'Idea Stage'
  }

  const renderDashboard = () => {
    if (profile?.role === 'investor') {
      switch (profile.investor_type) {
        case 'venture-capital': return <VCDashboard />
        case 'bank': return <BankNBFCDashboard />
        case 'nbfc': return <BankNBFCDashboard />
        case 'family-office': return <FamilyOfficeDashboard />
        case 'corporate-venture': return <CVCDashboard />
        default: return <AngelVCDashboard />
      }
    }
    if (profile?.role === 'founder') {
      return profile.founder_type === 'idea' ? <IdeaFounderDashboard /> : <ActiveFounderDashboard />
    }
    return null
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const role = getTitle()

  return (
    <div>
      <SEO title="Dashboard" path="/dashboard" noindex />

      <HeroSection
        eyebrow={`Welcome back, ${profile?.first_name ?? 'there'}`}
        title={`${role} Dashboard`}
        subtitle="Here's what's happening across your ecosystem today."
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 font-semibold"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              fontSize: 12,
            }}
          >
            <Calendar className="w-3.5 h-3.5" />
            {today}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-1 font-semibold"
            style={{
              background: 'rgba(96,165,250,0.2)',
              color: '#93C5FD',
              borderRadius: 999,
              fontSize: 11,
            }}
          >
            {role}
          </span>
        </div>
      </HeroSection>

      {renderDashboard()}
    </div>
  )
}
