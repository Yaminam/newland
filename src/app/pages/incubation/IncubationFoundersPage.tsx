import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Mail, Inbox, Plus, X, Loader2, Check,
  Building2, Calendar, RefreshCw, Send, Clock, AlertCircle,
  ChevronRight, UserX, Briefcase, Eye, MessageSquare,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FounderRow {
  id: string
  email: string | null
  first_name: string
  last_name: string
  company: string | null
  role: string
  created_at: string
  incubation_id: string | null
}

interface StartupInfo {
  id: string
  status: string
  sector: string | null
  stage: string | null
  funding_ask_usd: number | null
  total_intros: number
  total_views: number
  total_deck_downloads: number
}

interface InvitationRow {
  id: string
  incubation_id: string
  founder_email: string
  company_name: string | null
  founder_name: string | null
  status: string
  created_at: string
  expires_at: string | null
}

interface JoinRequestRow {
  id: string
  incubation_id: string
  founder_id: string
  message: string | null
  status: string
  created_at: string
  founder: {
    first_name: string
    last_name: string
    company: string | null
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  boxShadow: 'var(--sh-1)',
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

// ─── Shared small components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', ...props.style }}
    />
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}
    >
      {role}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pending:  { bg: 'rgba(217,119,6,0.10)',  color: '#D97706' },
    accepted: { bg: 'rgba(22,163,74,0.10)',  color: '#16A34A' },
    expired:  { bg: 'rgba(100,116,139,0.10)',color: '#64748B' },
    rejected: { bg: 'rgba(220,38,38,0.10)',  color: '#DC2626' },
    revoked:  { bg: 'rgba(100,116,139,0.10)',color: '#64748B' },
  }
  const s = styles[status] ?? styles.pending
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

function StartupStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    approved:     { bg: 'rgba(22,163,74,0.10)',   color: '#16A34A', label: 'Approved' },
    under_review: { bg: 'rgba(124,58,237,0.10)',  color: '#7C3AED', label: 'Under Review' },
    submitted:    { bg: 'rgba(37,99,235,0.10)',   color: '#2563EB', label: 'Submitted' },
    draft:        { bg: 'rgba(100,116,139,0.10)', color: '#64748B', label: 'Draft' },
    rejected:     { bg: 'rgba(220,38,38,0.10)',   color: '#DC2626', label: 'Rejected' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-[15px] font-bold mt-0.5" style={{ color: 'var(--ink)' }}>{value}</p>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptySlate({
  icon: Icon, title, desc, cta, onCta,
}: {
  icon: React.ElementType; title: string; desc: string; cta?: string; onCta?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.08)' }}>
        <Icon className="w-7 h-7" style={{ color: '#7C3AED' }} />
      </div>
      <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
      <p className="text-[13px] mb-4 max-w-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
      {cta && onCta && (
        <button onClick={onCta} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#7C3AED' }}>
          <Plus className="w-4 h-4" /> {cta}
        </button>
      )}
    </div>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
          initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]">
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Invite Form ──────────────────────────────────────────────────────────────

function InviteForm({
  incubationId, prefill, onSuccess, onCancel,
}: {
  incubationId: string
  prefill?: { email: string; company: string; name: string }
  onSuccess: () => void
  onCancel: () => void
}) {
  const [companyName, setCompanyName] = useState(prefill?.company ?? '')
  const [founderEmail, setFounderEmail] = useState(prefill?.email ?? '')
  const [founderName, setFounderName] = useState(prefill?.name ?? '')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!companyName.trim()) { toast.error('Company name is required'); return }
    if (!founderEmail.trim()) { toast.error('Founder email is required'); return }
    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-founder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          company_name: companyName.trim(),
          founder_email: founderEmail.trim().toLowerCase(),
          founder_name: founderName.trim() || undefined,
          incubation_id: incubationId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send invite')
      toast.success(`Invite sent to ${founderEmail.trim()}`)
      onSuccess()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to send invite')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Company Name *</Label>
        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Tech" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Founder Email *</Label>
        <Input type="email" value={founderEmail} onChange={e => setFounderEmail(e.target.value)} placeholder="founder@startup.com"
          readOnly={!!prefill?.email} style={prefill?.email ? { opacity: 0.7 } : undefined} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Founder Name <span style={{ color: 'var(--muted-2)', fontWeight: 400 }}>(optional)</span></Label>
        <Input value={founderName} onChange={e => setFounderName(e.target.value)} placeholder="e.g. Jane Doe" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
          Cancel
        </button>
        <button onClick={submit} disabled={submitting}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7C3AED' }}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? 'Sending…' : 'Send Invite'}
        </button>
      </div>
    </div>
  )
}

// ─── Founder Card (grid tile, clickable) ──────────────────────────────────────

function FounderCard({ founder, onClick }: { founder: FounderRow; onClick: () => void }) {
  const name = `${founder.first_name} ${founder.last_name}`.trim()

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(13,27,42,0.10), 0 3px 8px rgba(13,27,42,0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left w-full group relative overflow-hidden"
      style={{ ...cardStyle, cursor: 'pointer' }}
    >
      {/* Active indicator dot */}
      <span
        className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full ring-2 ring-white"
        style={{ background: '#16A34A' }}
      />

      {/* Top: avatar + name + company */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 text-[14px] font-bold"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))', color: '#7C3AED' }}
        >
          {initials(founder.first_name, founder.last_name)}
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{name || '—'}</p>
          {founder.company ? (
            <p className="text-[11px] mt-0.5 truncate flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <Building2 className="w-3 h-3 shrink-0" /> {founder.company}
            </p>
          ) : (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>No company set</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--line)', margin: '0 16px' }} />

      {/* Footer: role + joined date + arrow */}
      <div className="flex items-center gap-2 px-4 py-3">
        <RoleBadge role={founder.role} />
        <span className="text-[11px] flex items-center gap-1 ml-auto" style={{ color: 'var(--muted-2)' }}>
          <Calendar className="w-3 h-3" />
          {fmtDate(founder.created_at)}
        </span>
        <ChevronRight
          className="w-3.5 h-3.5 shrink-0 translate-x-0 group-hover:translate-x-0.5 transition-transform"
          style={{ color: 'var(--muted-2)' }}
        />
      </div>
    </motion.button>
  )
}

// ─── Founder Detail Drawer ────────────────────────────────────────────────────

function FounderDetailDrawer({
  founder, onClose, onRemoved,
}: {
  founder: FounderRow
  onClose: () => void
  onRemoved: () => void
}) {
  const [startup, setStartup] = useState<StartupInfo | null>(null)
  const [loadingStartup, setLoadingStartup] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchStartup = async () => {
      setLoadingStartup(true)
      const { data } = await supabase
        .from('startup_applications')
        .select('id, status, sector, stage, funding_ask_usd, total_intros, total_views, total_deck_downloads')
        .eq('founder_id', founder.id)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()
      if (mounted) {
        setStartup(data as StartupInfo | null)
        setLoadingStartup(false)
      }
    }
    void fetchStartup()
    return () => { mounted = false }
  }, [founder.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleRemove = async () => {
    setRemoving(true)
    try {
      const { error } = await supabase.rpc('remove_founder_from_incubation', { p_founder_id: founder.id })
      if (error) throw error
      toast.success(`${founder.first_name} has been removed from the incubation.`)
      onRemoved()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to remove founder')
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  const name = `${founder.first_name} ${founder.last_name}`.trim()

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 16, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
          style={{ background: 'var(--surface)', boxShadow: '0 24px 64px rgba(13,27,42,0.18), 0 4px 16px rgba(13,27,42,0.08)', border: '1px solid var(--line)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Drawer header ── */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Large avatar */}
                <div
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center text-xl font-bold shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
                    color: '#7C3AED',
                    boxShadow: 'inset 0 0 0 1px rgba(124,58,237,0.15)',
                  }}
                >
                  {initials(founder.first_name, founder.last_name)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>{name}</h2>
                  {founder.email && (
                    <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{founder.email}</p>
                  )}
                  {founder.company && (
                    <p className="text-[12px] mt-0.5 flex items-center gap-1 truncate" style={{ color: 'var(--muted-2)' }}>
                      <Building2 className="w-3 h-3 shrink-0" /> {founder.company}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <RoleBadge role={founder.role} />
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Active Member
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5 space-y-5">

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Joined Program" value={fmtDate(founder.created_at)} />
              <StatBox label="Investor Intros" value={loadingStartup ? '—' : (startup?.total_intros ?? 0)} />
            </div>

            {/* Startup listing */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2.5" style={{ color: 'var(--muted)' }}>
                Startup Listing
              </p>
              {loadingStartup ? (
                <SkeletonBlock height={110} />
              ) : startup ? (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--line)' }}>
                  {/* Status header */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}
                  >
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                      {founder.company ?? 'Startup'}
                    </span>
                    <StartupStatusBadge status={startup.status} />
                  </div>

                  {/* Details */}
                  <div className="px-4 py-3 space-y-2.5">
                    {(startup.sector || startup.stage) && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted-2)' }} />
                        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
                          {[startup.sector, startup.stage].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                    {startup.funding_ask_usd != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>Funding ask:</span>
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency', currency: 'USD', maximumFractionDigits: 0,
                          }).format(startup.funding_ask_usd)}
                        </span>
                      </div>
                    )}

                    {/* Activity metrics */}
                    <div className="flex items-center gap-4 pt-1" style={{ borderTop: '1px solid var(--line)' }}>
                      <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--muted-2)' }}>
                        <Eye className="w-3.5 h-3.5" /> {startup.total_views ?? 0} views
                      </span>
                      <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--muted-2)' }}>
                        <MessageSquare className="w-3.5 h-3.5" /> {startup.total_intros ?? 0} intros
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-8 rounded-xl text-center"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                >
                  <Briefcase className="w-6 h-6 mb-2" style={{ color: 'var(--muted-2)' }} />
                  <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>No startup listing yet</p>
                </div>
              )}
            </div>

            {/* Contact info */}
            {founder.email && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2.5" style={{ color: 'var(--muted)' }}>
                  Contact
                </p>
                <a
                  href={`mailto:${founder.email}`}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                  style={{ border: '1px solid var(--line)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--blue-bg)' }}>
                    <Mail className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                  </div>
                  <span className="text-[13px] truncate" style={{ color: 'var(--blue)' }}>{founder.email}</span>
                </a>
              </div>
            )}
          </div>

          {/* ── Drawer footer: Remove action ── */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
            <AnimatePresence mode="wait">
              {!confirmRemove ? (
                <motion.button
                  key="remove-btn"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setConfirmRemove(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
                  style={{
                    background: 'rgba(220,38,38,0.07)',
                    color: '#DC2626',
                    border: '1px solid rgba(220,38,38,0.18)',
                  }}
                >
                  <UserX className="w-4 h-4" />
                  Remove from Incubation
                </motion.button>
              ) : (
                <motion.div
                  key="confirm-panel"
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}
                >
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#DC2626' }}>
                    Remove {founder.first_name}?
                  </p>
                  <p className="text-[12px] mb-3.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                    They will be removed from your cohort. You can re-invite them later.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRemove(false)}
                      className="flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                      style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity"
                      style={{ background: '#DC2626', opacity: removing ? 0.7 : 1 }}
                    >
                      {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                      {removing ? 'Removing…' : 'Confirm Remove'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Invitation Card ──────────────────────────────────────────────────────────

function InvitationCard({
  invite, onResend, resending,
}: {
  invite: InvitationRow; onResend: () => void; resending: boolean
}) {
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4" style={cardStyle}
    >
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'rgba(217,119,6,0.10)' }}>
        <Mail className="w-5 h-5" style={{ color: '#D97706' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
            {invite.company_name || invite.founder_email}
          </span>
          <StatusBadge status={invite.status} />
        </div>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{invite.founder_email}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--muted-2)' }}>
            <Send className="w-3 h-3" /> Sent {fmtDate(invite.created_at)}
          </span>
          {invite.expires_at && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--muted-2)' }}>
              <Clock className="w-3 h-3" /> Expires {fmtDate(invite.expires_at)}
            </span>
          )}
        </div>
      </div>
      {invite.status !== 'accepted' && (
        <button
          onClick={onResend} disabled={resending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0"
          style={{ background: 'rgba(124,58,237,0.08)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Resend
        </button>
      )}
    </motion.div>
  )
}

// ─── Join Request Card ────────────────────────────────────────────────────────

function JoinRequestCard({
  req, onApprove, onReject, approving,
}: {
  req: JoinRequestRow; onApprove: () => void; onReject: (note: string) => void; approving: boolean
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const name = req.founder
    ? `${req.founder.first_name} ${req.founder.last_name}`.trim()
    : 'Unknown Founder'

  const handleReject = async () => {
    setRejecting(true)
    try { await onReject(rejectNote.trim()) } finally { setRejecting(false) }
  }

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-4" style={{ ...cardStyle, borderLeft: '3px solid #7C3AED' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-bold"
          style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
          {req.founder ? initials(req.founder.first_name, req.founder.last_name) : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>{name}</p>
          {req.founder?.company && (
            <p className="text-[12px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <Building2 className="w-3 h-3" /> {req.founder.company}
            </p>
          )}
          <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--muted-2)' }}>
            <Calendar className="w-3 h-3" /> Submitted {fmtDate(req.created_at)}
          </p>
          {req.message && (
            <p className="text-[12px] mt-2.5 pl-3 italic leading-relaxed"
              style={{ color: 'var(--muted)', borderLeft: '2px solid rgba(124,58,237,0.3)' }}>
              {req.message}
            </p>
          )}
        </div>
      </div>

      {showRejectInput && (
        <div className="mt-3 flex flex-col gap-2">
          <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Optional note to the founder…" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowRejectInput(false); setRejectNote('') }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
              Cancel
            </button>
            <button onClick={handleReject} disabled={rejecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: '#DC2626' }}>
              {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Confirm Reject
            </button>
          </div>
        </div>
      )}

      {!showRejectInput && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={() => setShowRejectInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}>
            <X className="w-3.5 h-3.5" /> Reject
          </button>
          <button onClick={onApprove} disabled={approving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: '#7C3AED' }}>
            {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'founders' | 'invited' | 'join_requests'

export function IncubationFoundersPage() {
  const { incubationProfile } = useAuth()
  const incubationId = incubationProfile?.id ?? null

  const [tab, setTab] = useState<Tab>('founders')
  const [founders, setFounders] = useState<FounderRow[]>([])
  const [invitations, setInvitations] = useState<InvitationRow[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [resendInvite, setResendInvite] = useState<InvitationRow | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [selectedFounder, setSelectedFounder] = useState<FounderRow | null>(null)

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!incubationId) return
    setLoading(true)
    try {
      const [{ data: fData }, { data: iData }, { data: jData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, first_name, last_name, company, role, created_at, incubation_id')
          .eq('incubation_id', incubationId)
          .eq('role', 'founder'),
        supabase
          .from('incubation_invitations')
          .select('*')
          .eq('incubation_id', incubationId)
          .order('created_at', { ascending: false }),
        supabase
          .from('incubation_join_requests')
          .select('*, founder:profiles!founder_id(first_name, last_name, company)')
          .eq('incubation_id', incubationId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ])
      setFounders((fData ?? []) as FounderRow[])
      setInvitations((iData ?? []) as InvitationRow[])
      setJoinRequests((jData ?? []) as JoinRequestRow[])
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [incubationId])

  useEffect(() => { void fetchAll() }, [fetchAll])

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleApprove = async (requestId: string) => {
    setApprovingId(requestId)
    try {
      const { error } = await supabase.rpc('approve_join_request', { request_id: requestId, p_note: null })
      if (error) throw error
      toast.success('Join request approved')
      void fetchAll()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to approve request')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (requestId: string, note: string) => {
    try {
      const { error } = await supabase.rpc('reject_join_request', { request_id: requestId, p_note: note || null })
      if (error) throw error
      toast.success('Join request rejected')
      void fetchAll()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to reject request')
    }
  }

  // ─── Guard ────────────────────────────────────────────────────────────────────

  if (!incubationId) {
    return (
      <div className="flex flex-col items-center justify-center py-24" style={{ color: 'var(--muted)' }}>
        <AlertCircle className="w-8 h-8 mb-3" />
        <p className="text-sm">No incubation profile found.</p>
      </div>
    )
  }

  const pendingJoinCount = joinRequests.length

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO title="Founders | Incubation" noindex />

      <HeroSection
        title="Founders"
        subtitle="Manage your cohort founders and review join requests."
        eyebrow={incubationProfile?.name}
      />

      <div className="px-6 pb-10">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-2)' }}>
            {([
              ['founders',      Users,  'Founders',      founders.length,       false],
              ['invited',       Mail,   'Invited',        invitations.length,    false],
              ['join_requests', Inbox,  'Join Requests',  pendingJoinCount,      true],
            ] as const).map(([key, Icon, label, count, accent]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === key ? 'var(--surface)' : 'transparent',
                  color: tab === key ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: tab === key ? 'var(--sh-1)' : 'none',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
                {(count > 0 || !accent) && (
                  <span
                    className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: accent && count > 0 ? '#7C3AED' : tab === key ? 'rgba(124,58,237,0.12)' : 'var(--line)',
                      color: accent && count > 0 ? 'white' : tab === key ? '#7C3AED' : 'var(--muted-2)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Invite button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
            style={{ background: '#7C3AED' }}
          >
            <Plus className="w-4 h-4" />
            Invite Startup
          </button>
        </div>

        {/* ── Tab content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonBlock key={i} height={100} />)}
          </div>
        ) : tab === 'founders' ? (
          founders.length === 0 ? (
            <EmptySlate
              icon={Users}
              title="No founders yet"
              desc="Invite startups to join your incubation program. They'll appear here once they accept."
              cta="Invite Startup"
              onCta={() => setShowInviteModal(true)}
            />
          ) : (
            <>
              <p className="text-[12px] mb-3" style={{ color: 'var(--muted)' }}>
                {founders.length} active {founders.length === 1 ? 'founder' : 'founders'} · click a card to view details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {founders.map(f => (
                    <FounderCard key={f.id} founder={f} onClick={() => setSelectedFounder(f)} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )
        ) : tab === 'invited' ? (
          invitations.length === 0 ? (
            <EmptySlate
              icon={Mail}
              title="No invitations sent yet"
              desc="Invite startups to join your program — they'll appear here while the invite is pending."
              cta="Invite Startup"
              onCta={() => setShowInviteModal(true)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {invitations.map(invite => (
                  <InvitationCard
                    key={invite.id}
                    invite={invite}
                    onResend={() => setResendInvite(invite)}
                    resending={false}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : (
          // Join Requests tab
          joinRequests.length === 0 ? (
            <EmptySlate
              icon={Inbox}
              title="No pending join requests"
              desc="When founders request to join your incubation directly, their requests will appear here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {joinRequests.map(req => (
                  <JoinRequestCard
                    key={req.id}
                    req={req}
                    onApprove={() => handleApprove(req.id)}
                    onReject={(note) => handleReject(req.id, note)}
                    approving={approvingId === req.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}
      </div>

      {/* ── Founder Detail Drawer ── */}
      {selectedFounder && (
        <FounderDetailDrawer
          founder={selectedFounder}
          onClose={() => setSelectedFounder(null)}
          onRemoved={() => {
            setSelectedFounder(null)
            void fetchAll()
          }}
        />
      )}

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <Modal title="Invite Startup" onClose={() => setShowInviteModal(false)}>
          <InviteForm
            incubationId={incubationId}
            onSuccess={() => { setShowInviteModal(false); void fetchAll() }}
            onCancel={() => setShowInviteModal(false)}
          />
        </Modal>
      )}

      {/* ── Resend Modal ── */}
      {resendInvite && (
        <Modal title="Resend Invitation" onClose={() => setResendInvite(null)}>
          <InviteForm
            incubationId={incubationId}
            prefill={{
              email: resendInvite.founder_email,
              company: resendInvite.company_name ?? '',
              name: resendInvite.founder_name ?? '',
            }}
            onSuccess={() => { setResendInvite(null); void fetchAll() }}
            onCancel={() => setResendInvite(null)}
          />
        </Modal>
      )}
    </>
  )
}
