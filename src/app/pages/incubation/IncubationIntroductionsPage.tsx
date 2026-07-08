import { useState, useEffect, useCallback } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import {
  MessageSquare, CheckCircle, XCircle, Clock,
  TrendingUp, Mail, RefreshCw, Linkedin, Copy, Sparkles,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'

interface IntroRow {
  id: string
  investor_id: string
  founder_id: string
  startup_id?: string
  initiated_by?: 'founder' | 'investor'
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired'
  message?: string
  initiated_at: string
  responded_at?: string
  investor?: {
    first_name: string
    last_name: string
    company?: string
    investor_type?: string
    avatar_url?: string
  }
}

interface ContactDetails {
  other_user_id: string
  display_name: string | null
  email: string | null
  linkedin_url: string | null
  company: string | null
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:   { bg: 'var(--warn-bg)', color: 'var(--warn)' },
  accepted:  { bg: 'var(--pos-bg)',  color: 'var(--pos)' },
  completed: { bg: 'var(--pos-bg)',  color: 'var(--pos)' },
  declined:  { bg: 'var(--neg-bg)',  color: 'var(--neg)' },
  expired:   { bg: 'var(--surface-3)', color: 'var(--muted-2)' },
}

function KpiCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3.5 p-4 sm:p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
          {label}
        </div>
        <div className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>
          {value}
        </div>
      </div>
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] ?? STATUS_STYLE.pending
  const Icon = status === 'pending' ? Clock
    : (status === 'accepted' || status === 'completed') ? CheckCircle
    : status === 'declined' ? XCircle
    : Clock
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-[3px] rounded-full"
      style={{ background: st.bg, color: st.color, letterSpacing: '0.03em' }}
    >
      <Icon className="w-2.5 h-2.5" />
      {status}
    </span>
  )
}

export function IncubationIntroductionsPage() {
  const { profile } = useAuth()
  const [intros, setIntros] = useState<IntroRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'accepted' | 'all'>('pending')
  const [responding, setResponding] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Record<string, ContactDetails | null | undefined>>({})

  async function fetchIntros() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data: introData, error } = await supabase
        .from('introductions')
        .select('id, investor_id, founder_id, startup_id, initiated_by, status, message, initiated_at, responded_at')
        .eq('founder_id', profile.id)
        .order('initiated_at', { ascending: false })
      if (error) throw error

      const enriched = await Promise.all((introData ?? []).map(async (intro) => {
        const { data: investor } = await supabase
          .from('profiles')
          .select('first_name, last_name, company, investor_type, avatar_url')
          .eq('id', intro.investor_id)
          .maybeSingle()
        return { ...intro, investor: investor ?? undefined }
      }))
      setIntros(enriched as IntroRow[])
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load introductions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchIntros() }, [profile?.id])

  const loadContactsForAccepted = useCallback(async (rows: IntroRow[]) => {
    const needed = rows.filter(r =>
      (r.status === 'accepted' || r.status === 'completed') && contacts[r.id] === undefined,
    )
    if (needed.length === 0) return
    const entries = await Promise.all(needed.map(async (r) => {
      const { data, error } = await supabase.rpc('get_intro_contact', { p_intro_id: r.id })
      if (error || !data || data.length === 0) return [r.id, null] as const
      return [r.id, data[0] as ContactDetails] as const
    }))
    setContacts(prev => {
      const next = { ...prev }
      for (const [id, c] of entries) next[id] = c
      return next
    })
  }, [contacts])

  useEffect(() => { void loadContactsForAccepted(intros) }, [intros])

  async function respond(introId: string, action: 'accept' | 'reject') {
    if (!profile?.id) return
    setResponding(introId)
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'declined'
      const { error } = await supabase
        .from('introductions')
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq('id', introId)
      if (error) throw error

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('type', 'intro_request')
        .eq('read', false)

      toast.success(action === 'accept'
        ? 'Intro accepted — contact details unlocked.'
        : 'Intro request declined')
      fetchIntros()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to respond')
    } finally {
      setResponding(null)
    }
  }

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied.`),
      () => toast.error('Clipboard blocked by browser'),
    )
  }

  const filtered = intros.filter(i => {
    if (tab === 'pending') return i.status === 'pending'
    if (tab === 'accepted') return i.status === 'accepted' || i.status === 'completed'
    return true
  })

  const stats = {
    total: intros.length,
    pending: intros.filter(i => i.status === 'pending').length,
    accepted: intros.filter(i => i.status === 'accepted' || i.status === 'completed').length,
    rate: intros.filter(i => i.status !== 'pending').length > 0
      ? Math.round(
          (intros.filter(i => i.status === 'accepted').length /
           intros.filter(i => i.status !== 'pending').length) * 100,
        )
      : 0,
  }

  const tabs = [
    { key: 'pending'  as const, label: 'Pending',  count: stats.pending  },
    { key: 'accepted' as const, label: 'Accepted', count: stats.accepted },
    { key: 'all'      as const, label: 'All',      count: stats.total    },
  ]

  return (
    <div>
      <SEO title="Introductions" path="/incubation/introductions" noindex />

      <HeroSection
        title="Introductions"
        subtitle="Track and manage investor introductions for your programme"
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={84} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KpiCard icon={MessageSquare} label="Total"         value={stats.total}         color="#2563EB" />
          <KpiCard icon={Clock}         label="Pending"       value={stats.pending}       color="#D97706" />
          <KpiCard icon={CheckCircle}   label="Accepted"      value={stats.accepted}      color="#059669" />
          <KpiCard icon={TrendingUp}    label="Response Rate" value={`${stats.rate}%`}    color="#7C3AED" />
        </div>
      )}

      {/* Tabs + Refresh */}
      <div className="flex items-center justify-between gap-3 mt-6 mb-6 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative px-3.5 py-1.5 rounded-[10px] text-xs whitespace-nowrap transition-colors shrink-0"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  color: active ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {active && (
                  <motion.span
                    layoutId="incubIntroTabPill"
                    className="absolute inset-0 rounded-[10px]"
                    style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.18)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-[1] inline-flex items-center gap-1.5">
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-[1px] rounded-full"
                      style={{
                        background: active ? 'var(--blue)' : 'var(--surface-3)',
                        color: active ? 'white' : 'var(--muted-2)',
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={fetchIntros}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all shrink-0 active:scale-[0.97]"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Intro list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} height={120} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
            title="No introductions found"
            description="Investor introduction requests sent to your programme will appear here"
          />
        ) : filtered.map((intro, idx) => {
          const iInitiated = intro.initiated_by === 'founder'
          const isRecipient = intro.status === 'pending' && !iInitiated
          const contact = contacts[intro.id]

          const investorName = `${intro.investor?.first_name ?? ''} ${intro.investor?.last_name ?? ''}`.trim() || 'Investor'
          const investorSub = [
            intro.investor?.company,
            intro.investor?.investor_type?.replace(/-/g, ' '),
          ].filter(Boolean).join(' · ')

          const avatarUrl = intro.investor?.avatar_url
          const st = STATUS_STYLE[intro.status] ?? STATUS_STYLE.pending

          return (
            <motion.div
              key={intro.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              className="card-hover-lift"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderLeft: `3px solid ${st.color}`,
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="px-4 py-5 sm:px-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Avatar */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={investorName}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] object-cover shrink-0"
                      style={{ border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center text-[13px] sm:text-[14px] font-bold shrink-0"
                      style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.15)' }}
                    >
                      {investorName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[13px] sm:text-[14px] font-semibold"
                        style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                      >
                        {investorName}
                      </span>
                      <StatusBadge status={intro.status} />
                      {intro.initiated_by && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-[2px] rounded-full inline-flex items-center gap-1"
                          style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
                        >
                          {iInitiated
                            ? <><ArrowUpRight className="w-[10px] h-[10px]" /> Sent</>
                            : <><ArrowDownLeft className="w-[10px] h-[10px]" /> Received</>}
                        </span>
                      )}
                    </div>

                    {/* Subtitle */}
                    {investorSub && (
                      <p className="text-[11px] sm:text-[12px] mt-1 capitalize" style={{ color: 'var(--muted)' }}>
                        {investorSub}
                      </p>
                    )}

                    {/* Message */}
                    {intro.message && (
                      <p
                        className="text-[11px] sm:text-[12px] mt-2.5 pl-3 line-clamp-2 italic leading-relaxed"
                        style={{ color: 'var(--muted)', borderLeft: '2px solid rgba(37,99,235,0.30)' }}
                      >
                        {intro.message}
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-[10px] mt-2" style={{ color: 'var(--muted-2)' }}>
                      {iInitiated ? 'Sent' : 'Received'} {timeAgo(intro.initiated_at)}
                      {intro.responded_at && ` · Responded ${timeAgo(intro.responded_at)}`}
                    </p>
                  </div>

                  {/* Accept / Decline — only when we're the recipient and status is pending */}
                  {isRecipient && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => respond(intro.id, 'reject')}
                        disabled={responding === intro.id}
                        className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                        style={{ background: 'var(--neg-bg)', color: 'var(--neg)', border: 'none' }}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{responding === intro.id ? '…' : 'Decline'}</span>
                      </button>
                      <button
                        onClick={() => respond(intro.id, 'accept')}
                        disabled={responding === intro.id}
                        className="h-[34px] sm:h-[36px] px-3 sm:px-4 rounded-[10px] text-[12px] font-medium flex items-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
                        style={{ background: 'var(--pos)', color: '#fff', border: 'none' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{responding === intro.id ? '…' : 'Accept'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact details — unlocked after accepted / completed */}
                {(intro.status === 'accepted' || intro.status === 'completed') && (
                  <div className="mt-4 pt-3 sm:pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                      <span
                        className="text-[11px] font-bold uppercase"
                        style={{ color: 'var(--pos)', letterSpacing: '0.04em' }}
                      >
                        Connected · contact unlocked
                      </span>
                    </div>

                    {contact === undefined ? (
                      <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Loading contact details…</p>
                    ) : !contact ? (
                      <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Contact details unavailable.</p>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {contact.email ? (
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-[10px] flex-1 min-w-0"
                            style={{ background: 'var(--surface-3)' }}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-[11px] sm:text-[12px] font-medium truncate"
                              style={{ color: 'var(--ink)' }}
                            >
                              {contact.email}
                            </a>
                            <button
                              onClick={() => copyToClipboard(contact.email!, 'Email')}
                              className="ml-auto w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 transition-all hover:bg-white/50"
                              style={{ color: 'var(--muted-2)' }}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-[10px] flex-1"
                            style={{ background: 'var(--surface-3)' }}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                            <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>No email on file</span>
                          </div>
                        )}

                        {contact.linkedin_url ? (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-[10px] transition-all hover:opacity-80"
                            style={{ background: 'var(--surface-3)' }}
                          >
                            <Linkedin className="w-3.5 h-3.5 shrink-0" style={{ color: '#0A66C2' }} />
                            <span className="text-[11px] sm:text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                              LinkedIn
                            </span>
                          </a>
                        ) : (
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                            style={{ background: 'var(--surface-3)' }}
                          >
                            <Linkedin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                            <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>No LinkedIn</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--muted-2)' }}>
          Showing {filtered.length} of {intros.length} introductions
        </p>
      )}
    </div>
  )
}
