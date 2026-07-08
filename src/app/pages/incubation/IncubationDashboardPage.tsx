import { memo, useEffect, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, Newspaper, CalendarDays, Calendar, Globe,
  ChevronRight, Flame, ArrowUpRight, Clock, CheckCircle,
  MessageSquare, Send, PlusCircle, UserCheck, ShieldCheck,
  MapPin, Inbox,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SEO } from '@/app/components/SEO'
import { NewsFeedWidget } from '@/app/components/ui/NewsFeedWidget'

// ─── Tokens ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 16,
  border: '1px solid var(--line)',
  boxShadow: 'var(--sh-2)',
}

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce || !Number.isFinite(value)) { setN(value); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setN(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduce])
  return <>{n.toLocaleString()}</>
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard = memo(function KPICard({ icon: Icon, label, value, sub, color, delay = 0, onClick }: {
  icon: React.ElementType; label: string; value: number; sub?: string
  color: string; delay?: number; onClick?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(13,27,42,0.12)' }}
      onClick={onClick}
      className="relative flex flex-col p-5 overflow-hidden group"
      style={{ ...card, cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4"
        style={{ background: `${color}14`, boxShadow: `inset 0 0 0 1px ${color}22` }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} />
      </div>
      <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
        <CountUp value={value} />
      </p>
      <p className="text-[12px] font-semibold mt-1.5" style={{ color: 'var(--muted)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>{sub}</p>}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
    </motion.div>
  )
})

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon: Icon, iconColor, children, action, delay = 0 }: {
  title?: string; subtitle?: string; icon?: React.ElementType; iconColor?: string
  children: React.ReactNode; action?: React.ReactNode; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-4 sm:p-5 flex flex-col" style={card}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: `${iconColor ?? 'var(--blue)'}18` }}>
                <Icon className="w-[18px] h-[18px]" style={{ color: iconColor ?? 'var(--blue)' }} />
              </div>
            )}
            <div>
              {title && <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</p>}
              {subtitle && <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="w-7 h-7 mb-2" style={{ color: 'var(--muted-2)' }} />
      <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>{text}</p>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FounderRow {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  avatar_url: string | null
  email: string
  created_at: string
}

interface RequestRow {
  id: string
  founder_id: string
  message: string | null
  created_at: string
  profiles: { first_name: string | null; last_name: string | null; company: string | null; email: string } | null
}

interface NewsRow {
  id: string; title: string; source_name: string; category: string
  published_at: string; url: string; is_featured: boolean
}

interface EventRow {
  id: string; title: string; event_type: string; host: string
  starts_at: string; is_virtual: boolean; location: string | null
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function IncubationDashboardPage() {
  const { profile, incubationProfile } = useAuth()
  const navigate = useNavigate()

  const [founders,      setFounders]      = useState<FounderRow[]>([])
  const [requests,      setRequests]      = useState<RequestRow[]>([])
  const [founderCount,  setFounderCount]  = useState(0)
  const [pendingCount,  setPendingCount]  = useState(0)
  const [introCount,    setIntroCount]    = useState(0)
  const [newsPosted,    setNewsPosted]    = useState<NewsRow[]>([])
  const [eventsPosted,  setEventsPosted]  = useState<EventRow[]>([])
  const [platformEvents,setPlatformEvents]= useState<EventRow[]>([])

  const load = useCallback(async () => {
    if (!incubationProfile?.id || !profile?.id) return

    const incId  = incubationProfile.id
    const userId = profile.id

    const [
      foundersRes,
      founderCountRes,
      requestsRes,
      pendingCountRes,
      newsRes,
      eventsRes,
      platformEvRes,
    ] = await Promise.all([
      // Latest 5 founders
      supabase.from('profiles')
        .select('id, first_name, last_name, company, avatar_url, email, created_at')
        .eq('incubation_id', incId)
        .order('created_at', { ascending: false })
        .limit(5),
      // Total founder count
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('incubation_id', incId),
      // Latest 4 pending join requests
      supabase.from('incubation_join_requests')
        .select('id, founder_id, message, created_at, profiles(first_name, last_name, company, email)')
        .eq('incubation_id', incId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(4),
      // Pending count
      supabase.from('incubation_join_requests')
        .select('id', { count: 'exact', head: true })
        .eq('incubation_id', incId)
        .eq('status', 'pending'),
      // My posted news
      supabase.from('news_articles')
        .select('id, title, source_name, category, published_at, url, is_featured')
        .eq('created_by', userId)
        .order('published_at', { ascending: false })
        .limit(4),
      // My posted events
      supabase.from('scraped_events')
        .select('id, title, event_type, host, starts_at, is_virtual, location')
        .eq('created_by', userId)
        .order('starts_at', { ascending: false })
        .limit(4),
      // Upcoming platform events (not mine)
      supabase.from('scraped_events')
        .select('id, title, event_type, host, starts_at, is_virtual, location')
        .gt('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(4),
    ])

    setFounders((foundersRes.data ?? []) as FounderRow[])
    setFounderCount(founderCountRes.count ?? 0)
    setRequests((requestsRes.data ?? []) as unknown as RequestRow[])
    setPendingCount(pendingCountRes.count ?? 0)
    setNewsPosted((newsRes.data ?? []) as NewsRow[])
    setEventsPosted((eventsRes.data ?? []) as EventRow[])
    setPlatformEvents((platformEvRes.data ?? []) as EventRow[])

    // Introductions for founders in this cohort
    if (foundersRes.data && foundersRes.data.length > 0) {
      const allFounderIds = foundersRes.data.map((f: { id: string }) => f.id)
      const { count } = await supabase.from('introductions')
        .select('id', { count: 'exact', head: true })
        .in('founder_id', allFounderIds)
      setIntroCount(count ?? 0)
    }
  }, [incubationProfile?.id, profile?.id])

  useEffect(() => { void load() }, [load])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })

  const kpis = [
    {
      icon: Users, label: 'Cohort Founders', value: founderCount,
      sub: `${incubationProfile?.cohort_size ? `of ${incubationProfile.cohort_size} capacity` : 'active members'}`,
      color: '#7C3AED', delay: 0, onClick: () => navigate('/incubation/founders'),
    },
    {
      icon: Inbox, label: 'Pending Requests', value: pendingCount,
      sub: 'awaiting your review',
      color: '#D97706', delay: 0.05, onClick: () => navigate('/incubation/founders'),
    },
    {
      icon: MessageSquare, label: 'Introductions', value: introCount,
      sub: 'across your cohort',
      color: '#2563EB', delay: 0.1, onClick: () => navigate('/incubation/introductions'),
    },
    {
      icon: Newspaper, label: 'Content Posted', value: newsPosted.length + eventsPosted.length,
      sub: `${newsPosted.length} articles · ${eventsPosted.length} events`,
      color: '#16A34A', delay: 0.15, onClick: () => navigate('/incubation/news-events'),
    },
  ]

  return (
    <div>
      <SEO title="Incubation Dashboard" path="/incubation" noindex />

      <HeroSection
        eyebrow={`Welcome back, ${profile?.first_name ?? 'there'}`}
        title={incubationProfile?.name ?? 'Incubation Dashboard'}
        subtitle="Manage your cohort, review join requests, and connect founders with investors."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 font-semibold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, fontSize: 12 }}>
            <Calendar className="w-3.5 h-3.5" />{today}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 font-semibold capitalize"
            style={{ background: 'rgba(167,139,250,0.25)', color: '#C4B5FD', borderRadius: 999, fontSize: 11 }}>
            {incubationProfile?.incubation_type?.replace(/_/g, ' ') ?? 'Incubation'}
          </span>
          {incubationProfile?.is_verified ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-semibold"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7', borderRadius: 999, fontSize: 11 }}>
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-semibold"
              style={{ background: 'rgba(251,191,36,0.2)', color: '#FDE68A', borderRadius: 999, fontSize: 11 }}>
              <ShieldCheck className="w-3 h-3" /> Awaiting verification
            </span>
          )}
        </div>
      </HeroSection>

      <div className="px-4 sm:px-6 pb-8 space-y-6 max-w-7xl mx-auto">

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map(k => <KPICard key={k.label} {...k} />)}
        </div>

        {/* Row 2: Cohort founders + Pending requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Cohort founders */}
          <SectionCard title="Cohort Members" subtitle="Founders currently in your program"
            icon={UserCheck} iconColor="#7C3AED" delay={0.2}
            action={
              <button onClick={() => navigate('/incubation/founders')}
                className="flex items-center gap-1 text-[12px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: 'var(--blue)' }}>
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {founders.length === 0 ? (
              <Empty icon={Users} text="No founders in your cohort yet. Invite founders to get started." />
            ) : (
              <div className="space-y-0">
                {founders.map((f, i) => {
                  const name = [f.first_name, f.last_name].filter(Boolean).join(' ') || f.email
                  const initials = `${f.first_name?.[0] ?? ''}${f.last_name?.[0] ?? ''}`.toUpperCase() || '?'
                  return (
                    <div key={f.id} className="flex items-center gap-3 py-3"
                      style={{ borderBottom: i < founders.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)', color: 'white' }}>
                        {f.avatar_url
                          ? <img src={f.avatar_url} alt={name} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                          {f.company ?? f.email}
                        </p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: 'var(--muted-2)' }}>
                        {new Date(f.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Pending join requests */}
          <SectionCard title="Join Requests" subtitle="Founders requesting to join your program"
            icon={Inbox} iconColor="#D97706" delay={0.25}
            action={
              pendingCount > 0 ? (
                <button onClick={() => navigate('/incubation/founders')}
                  className="flex items-center gap-1 text-[12px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--blue)' }}>
                  Review all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          >
            {requests.length === 0 ? (
              <Empty icon={Inbox} text="No pending join requests right now." />
            ) : (
              <div className="space-y-0">
                {requests.map((req, i) => {
                  const p = req.profiles
                  const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.email || 'Unknown'
                  const initials = `${p?.first_name?.[0] ?? ''}${p?.last_name?.[0] ?? ''}`.toUpperCase() || '?'
                  return (
                    <div key={req.id} className="flex items-start gap-3 py-3"
                      style={{ borderBottom: i < requests.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold"
                        style={{ background: 'rgba(217,119,6,0.10)', color: '#D97706' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{name}</p>
                        <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                          {p?.company ?? p?.email}
                        </p>
                        {req.message && (
                          <p className="text-[11px] mt-0.5 line-clamp-1 italic" style={{ color: 'var(--muted)' }}>
                            "{req.message}"
                          </p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: 'rgba(245,158,11,0.10)', color: '#D97706' }}>
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Row 3: My posted news + Upcoming platform events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* My news articles */}
          <SectionCard title="My News Articles" subtitle="Articles you've published to the platform"
            icon={Newspaper} iconColor="#2563EB" delay={0.3}
            action={
              <button onClick={() => navigate('/incubation/news-events')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                style={{ background: 'var(--blue)', color: '#fff' }}>
                <PlusCircle className="w-3 h-3" /> Post
              </button>
            }
          >
            {newsPosted.length === 0 ? (
              <Empty icon={Newspaper} text="You haven't posted any news articles yet." />
            ) : newsPosted.map((a, i) => {
              const catColors: Record<string, string> = {
                Funding: '#16A34A', 'AI/ML': '#3486e8', FinTech: '#59cbef',
                Markets: '#2563EB', HealthTech: '#D97706', CleanTech: '#16A34A',
                Policy: '#94a3b8', General: '#64748b',
              }
              const c = catColors[a.category] ?? '#64748b'
              return (
                <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 py-3 group"
                  style={{ borderBottom: i < newsPosted.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold"
                        style={{ background: `${c}15`, color: c }}>{a.category}</span>
                      {a.is_featured && <Flame className="w-3 h-3" style={{ color: 'var(--neg)' }} />}
                    </div>
                    <p className="text-[12px] font-medium line-clamp-2 group-hover:text-blue-600 transition-colors" style={{ color: 'var(--ink)' }}>
                      {a.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
                      {new Date(a.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-2)' }} />
                </a>
              )
            })}
          </SectionCard>

          {/* Upcoming platform events */}
          <SectionCard title="Upcoming Events" subtitle="Events happening in the ecosystem"
            icon={CalendarDays} iconColor="#16A34A" delay={0.35}
            action={
              <button onClick={() => navigate('/incubation/news-events')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
                <PlusCircle className="w-3 h-3" /> Add
              </button>
            }
          >
            {platformEvents.length === 0 ? (
              <Empty icon={CalendarDays} text="No upcoming events right now." />
            ) : platformEvents.map((ev, i) => (
              <div key={ev.id} className="flex items-start gap-3 py-3"
                style={{ borderBottom: i < platformEvents.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(22,163,74,0.08)' }}>
                  <CalendarDays className="w-4 h-4" style={{ color: '#16A34A' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold line-clamp-1" style={{ color: 'var(--ink)' }}>{ev.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
                    {ev.host} · {new Date(ev.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ev.is_virtual ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        <Globe className="w-2.5 h-2.5 inline mr-0.5" />Virtual
                      </span>
                    ) : ev.location ? (
                      <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>
                        <MapPin className="w-2.5 h-2.5 inline mr-0.5" />{ev.location}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        </div>

        {/* Row 4: Organisation card + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Organisation profile */}
          <SectionCard title="Your Organisation" subtitle="Incubation profile snapshot"
            icon={Building2} iconColor="#7C3AED" delay={0.4}
          >
            <dl className="space-y-0">
              {[
                { label: 'Type',     value: incubationProfile?.incubation_type?.replace(/_/g, ' ') ?? '—' },
                { label: 'Location', value: [incubationProfile?.city, incubationProfile?.country].filter(Boolean).join(', ') || incubationProfile?.location || '—' },
                { label: 'Capacity', value: incubationProfile?.cohort_size ? `${incubationProfile.cohort_size} startups per batch` : '—' },
                { label: 'Verified', value: incubationProfile?.is_verified ? 'Yes' : 'Pending' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: '1px solid var(--line)' }}>
                  <dt className="text-[12px]" style={{ color: 'var(--muted)' }}>{label}</dt>
                  <dd className="text-[12px] font-semibold capitalize" style={{ color: 'var(--ink)' }}>{value}</dd>
                </div>
              ))}
            </dl>

            {(incubationProfile?.sectors ?? []).length > 0 && (
              <div className="pt-3">
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--muted-2)' }}>Focus Sectors</p>
                <div className="flex flex-wrap gap-1.5">
                  {incubationProfile!.sectors.slice(0, 6).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}>{s}</span>
                  ))}
                  {incubationProfile!.sectors.length > 6 && (
                    <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                      +{incubationProfile!.sectors.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {(incubationProfile?.website_url || incubationProfile?.linkedin_url) && (
              <div className="flex gap-4 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
                {incubationProfile?.website_url && (
                  <a href={incubationProfile.website_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--blue)' }}>
                    <Globe className="w-3.5 h-3.5" /> Website <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
                {incubationProfile?.linkedin_url && (
                  <a href={incubationProfile.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium transition-opacity hover:opacity-70"
                    style={{ color: '#0A66C2' }}>
                    LinkedIn <ArrowUpRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </SectionCard>

          {/* Quick actions */}
          <SectionCard title="Quick Actions" subtitle="Jump to common tasks"
            icon={Send} iconColor="#2563EB" delay={0.45}
          >
            {[
              { icon: Users,         color: '#7C3AED', label: 'Manage Cohort',      desc: 'View, verify and manage founders in your program.', to: '/incubation/founders' },
              { icon: Inbox,         color: '#D97706', label: 'Review Requests',    desc: `${pendingCount} pending join request${pendingCount !== 1 ? 's' : ''} awaiting your response.`, to: '/incubation/founders' },
              { icon: Newspaper,     color: '#2563EB', label: 'Post News & Events', desc: 'Share updates, articles and events with the community.', to: '/incubation/news-events' },
              { icon: MessageSquare, color: '#16A34A', label: 'Introductions',      desc: 'Connect your cohort founders with relevant investors.', to: '/incubation/introductions' },
            ].map(a => {
              const Icon = a.icon
              return (
                <button key={a.label} onClick={() => navigate(a.to)}
                  className="w-full flex items-start gap-3 py-3 text-left group transition-all active:scale-[0.99]"
                  style={{ borderBottom: '1px solid var(--line)' }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${a.color}14` }}>
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>{a.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>{a.desc}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted-2)' }} />
                </button>
              )
            })}
          </SectionCard>
        </div>
      </div>

      <NewsFeedWidget moreHref="/incubation/news-events" delay={0.45} />
    </div>
  )
}
