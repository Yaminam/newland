import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'
import {
  Newspaper, CalendarDays, Plus, Edit2, Trash2, X,
  ExternalLink, Clock, MapPin, Globe, Tag, Loader2,
  Image as ImageIcon, AlertCircle, Check,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OwnNewsArticle {
  id: string
  title: string
  summary: string | null
  category: string | null
  image_url: string | null
  published_at: string | null
  source_name: string | null
  sector_tags: string[]
  url: string
}

interface OwnEvent {
  id: string
  title: string
  description: string | null
  event_type: string | null
  start_date: string | null
  end_date: string | null
  start_date_text: string | null
  location: string | null
  city: string | null
  is_online: boolean
  registration_url: string | null
  organizer: string | null
  sector_tags: string[]
  source_url: string
  is_free: boolean
}

interface NewsFormState {
  title: string
  summary: string
  category: string
  image_url: string
  article_url: string
  sector_tags: string
}

interface EventFormState {
  title: string
  description: string
  event_type: string
  start_date: string
  end_date: string
  location: string
  city: string
  is_online: boolean
  is_free: boolean
  registration_url: string
  sector_tags: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NEWS_CATEGORIES = [
  'Funding', 'Technology', 'News', 'Policy', 'General',
  'AI/ML', 'FinTech', 'HealthTech', 'CleanTech', 'Markets',
]

const EVENT_TYPES = [
  'Demo Day', 'Office Hours', 'Hackathon', 'Webinar', 'Networking', 'Workshop',
]

const CATEGORY_STYLE: Record<string, { color: string; bg: string }> = {
  Funding:   { color: 'var(--pos)', bg: 'rgba(16,185,129,0.10)' },
  Technology: { color: '#3486e8', bg: 'rgba(52,134,232,0.10)' },
  News:      { color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
  Policy:    { color: 'var(--neg)', bg: 'rgba(239,68,68,0.10)' },
  General:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  'AI/ML':   { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
  FinTech:   { color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
  HealthTech: { color: '#059669', bg: 'rgba(5,150,105,0.10)' },
  CleanTech: { color: '#16a34a', bg: 'rgba(22,163,74,0.10)' },
  Markets:   { color: '#d97706', bg: 'rgba(245,158,11,0.10)' },
}

const EVENT_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  'Demo Day':    { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  'Office Hours': { color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  Hackathon:     { color: '#DC2626', bg: 'rgba(239,68,68,0.10)' },
  Webinar:       { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  Networking:    { color: '#0891B2', bg: 'rgba(8,145,178,0.10)' },
  Workshop:      { color: '#D97706', bg: 'rgba(245,158,11,0.12)' },
}

const BLANK_NEWS: NewsFormState = {
  title: '', summary: '', category: 'News', image_url: '', article_url: '', sector_tags: '',
}

const BLANK_EVENT: EventFormState = {
  title: '', description: '', event_type: 'Demo Day',
  start_date: '', end_date: '', location: '', city: '',
  is_online: false, is_free: true, registration_url: '', sector_tags: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null, fallback?: string | null): string {
  const raw = iso ?? fallback
  if (!raw) return 'TBA'
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseTags(raw: string): string[] {
  return raw.split(',').map(t => t.trim()).filter(Boolean)
}

function localToIso(local: string): string {
  if (!local) return ''
  return new Date(local).toISOString()
}

function isoToLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Card styles ─────────────────────────────────────────────────────────────

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  boxShadow: 'var(--sh-1)',
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
      style={style}
    >
      {label}
    </span>
  )
}

// ─── News Card ────────────────────────────────────────────────────────────────

function NewsCard({
  article,
  onEdit,
  onDelete,
}: {
  article: OwnNewsArticle
  onEdit: () => void
  onDelete: () => void
}) {
  const cat = CATEGORY_STYLE[article.category ?? 'News'] ?? CATEGORY_STYLE.News
  const realUrl = article.url && !article.url.startsWith('incubation:') ? article.url : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col overflow-hidden"
      style={card}
    >
      {/* Thumbnail — clickable if URL exists */}
      {realUrl ? (
        <a href={realUrl} target="_blank" rel="noopener noreferrer" className="block">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              className="w-full h-36 object-cover hover:opacity-90 transition-opacity"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-24 flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: 'var(--surface-2)' }}>
              <ImageIcon className="w-8 h-8" style={{ color: 'var(--muted-2)' }} />
            </div>
          )}
        </a>
      ) : article.image_url ? (
        <img
          src={article.image_url}
          alt=""
          className="w-full h-36 object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-full h-24 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
          <ImageIcon className="w-8 h-8" style={{ color: 'var(--muted-2)' }} />
        </div>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill label={article.category ?? 'News'} style={{ color: cat.color, background: cat.bg }} />
          {article.sector_tags?.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}>
              #{t}
            </span>
          ))}
        </div>

        {/* Title — clickable link if URL exists */}
        {realUrl ? (
          <a
            href={realUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold leading-snug line-clamp-2 hover:underline"
            style={{ color: 'var(--ink)' }}
          >
            {article.title}
          </a>
        ) : (
          <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--ink)' }}>
            {article.title}
          </p>
        )}

        {article.summary && (
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--muted)' }}>
            {article.summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2" style={{ borderTop: '1px solid var(--line)' }}>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-2)' }}>
            <Clock className="w-3 h-3" />
            {formatDate(article.published_at)}
          </span>
          {realUrl && (
            <a
              href={realUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--blue)' }}
            >
              <ExternalLink className="w-3 h-3" /> Read
            </a>
          )}
          <span className="flex-1" />
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({
  ev,
  onEdit,
  onDelete,
}: {
  ev: OwnEvent
  onEdit: () => void
  onDelete: () => void
}) {
  const s = EVENT_TYPE_STYLE[ev.event_type ?? ''] ?? { color: 'var(--muted)', bg: 'var(--surface-2)' }
  const date = formatDate(ev.start_date)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col"
      style={card}
    >
      {/* Date banner */}
      <div className="flex items-stretch gap-0 p-4 pb-0">
        <div
          className="flex flex-col items-center justify-center rounded-xl w-14 h-14 mr-4 shrink-0"
          style={{ background: s.bg, border: `1px solid ${s.color}22` }}
        >
          <span className="text-xl font-bold leading-none" style={{ color: s.color }}>
            {ev.start_date ? new Date(ev.start_date).getDate() : '–'}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.color }}>
            {ev.start_date ? new Date(ev.start_date).toLocaleDateString('en-US', { month: 'short' }) : 'TBA'}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
          <Pill label={ev.event_type ?? 'Event'} style={{ color: s.color, background: s.bg, alignSelf: 'flex-start' }} />
          <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--ink)' }}>
            {ev.title}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 flex flex-col gap-2">
        {ev.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
            {ev.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {ev.is_online ? (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-2)' }}>
              <Globe className="w-3 h-3" /> Online
            </span>
          ) : ev.location ? (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted-2)' }}>
              <MapPin className="w-3 h-3" /> {ev.city ?? ev.location}
            </span>
          ) : null}
          {ev.is_free && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'rgba(16,185,129,0.10)', color: 'var(--pos)' }}>
              Free
            </span>
          )}
          {ev.sector_tags?.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}>
              #{t}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
          {ev.registration_url && (
            <a
              href={ev.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: 'var(--blue)' }}
            >
              <ExternalLink className="w-3 h-3" /> Register
            </a>
          )}
          <span className="flex-1" />
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>{children}</label>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        color: 'var(--ink)',
        ...props.style,
      }}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        color: 'var(--ink)',
        minHeight: 80,
        ...props.style,
      }}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  const { options, ...rest } = props
  return (
    <select
      {...rest}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        color: 'var(--ink)',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: checked ? '#7C3AED' : 'var(--line)' }}
      >
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform bg-white"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
      <span className="text-sm" style={{ color: 'var(--ink)' }}>{label}</span>
    </label>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          ref={ref}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            >
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirm({
  label,
  onConfirm,
  onCancel,
  loading,
}: {
  label: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <Modal title="Delete?" onClose={onCancel}>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Are you sure you want to delete <strong style={{ color: 'var(--ink)' }}>{label}</strong>? This cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#DC2626' }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </Modal>
  )
}

// ─── News Form ────────────────────────────────────────────────────────────────

function NewsForm({
  initial,
  programName,
  onSave,
  onCancel,
}: {
  initial: NewsFormState
  programName: string
  onSave: (data: NewsFormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<NewsFormState>(initial)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof NewsFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error('Title and summary are required')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Title *</Label>
        <Input value={form.title} onChange={set('title')} placeholder="e.g. Our cohort closes Series A" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Summary *</Label>
        <Textarea value={form.summary} onChange={set('summary')} placeholder="Brief description of the news…" rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onChange={set('category')} options={NEWS_CATEGORIES} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Source (your program)</Label>
          <Input value={programName} readOnly style={{ opacity: 0.6 }} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Article URL <span style={{ color: 'var(--muted-2)' }}>(optional — readers will be redirected here)</span></Label>
        <Input value={form.article_url} onChange={set('article_url')} placeholder="https://…" type="url" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Image URL <span style={{ color: 'var(--muted-2)' }}>(optional)</span></Label>
        <Input value={form.image_url} onChange={set('image_url')} placeholder="https://…" type="url" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Sector Tags <span style={{ color: 'var(--muted-2)' }}>(comma-separated)</span></Label>
        <Input value={form.sector_tags} onChange={set('sector_tags')} placeholder="AI, FinTech, SaaS" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7C3AED' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Article'}
        </button>
      </div>
    </div>
  )
}

// ─── Event Form ───────────────────────────────────────────────────────────────

function EventForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: EventFormState
  onSave: (data: EventFormState) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<EventFormState>(initial)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof EventFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.start_date) {
      toast.error('Title, description and start date are required')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Event Title *</Label>
        <Input value={form.title} onChange={set('title')} placeholder="e.g. Spring Cohort Demo Day 2026" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description *</Label>
        <Textarea value={form.description} onChange={set('description')} placeholder="What's the event about?" rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Event Type *</Label>
          <Select value={form.event_type} onChange={set('event_type')} options={EVENT_TYPES} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>City / Region</Label>
          <Input value={form.city} onChange={set('city')} placeholder="Bangalore, Mumbai…" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Start Date & Time *</Label>
          <Input type="datetime-local" value={form.start_date} onChange={set('start_date')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>End Date & Time <span style={{ color: 'var(--muted-2)' }}>(optional)</span></Label>
          <Input type="datetime-local" value={form.end_date} onChange={set('end_date')} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Venue / Location <span style={{ color: 'var(--muted-2)' }}>(if in-person)</span></Label>
        <Input value={form.location} onChange={set('location')} placeholder="Building name, address…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Toggle checked={form.is_online} onChange={v => setForm(f => ({ ...f, is_online: v }))} label="Online Event" />
        <Toggle checked={form.is_free} onChange={v => setForm(f => ({ ...f, is_free: v }))} label="Free Event" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Registration URL <span style={{ color: 'var(--muted-2)' }}>(optional)</span></Label>
        <Input type="url" value={form.registration_url} onChange={set('registration_url')} placeholder="https://…" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Sector Tags <span style={{ color: 'var(--muted-2)' }}>(comma-separated)</span></Label>
        <Input value={form.sector_tags} onChange={set('sector_tags')} placeholder="AI, HealthTech, B2B" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7C3AED' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Event'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'news' | 'events'

export function IncubationNewsEventsPage() {
  const { user, incubationProfile } = useAuth()
  const programName = incubationProfile?.name ?? 'My Program'

  const [tab, setTab] = useState<Tab>('news')
  const [news, setNews] = useState<OwnNewsArticle[]>([])
  const [events, setEvents] = useState<OwnEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [newsModal, setNewsModal] = useState<{ mode: 'create' | 'edit'; article?: OwnNewsArticle } | null>(null)
  const [eventModal, setEventModal] = useState<{ mode: 'create' | 'edit'; ev?: OwnEvent } | null>(null)
  const [deleteNews, setDeleteNews] = useState<OwnNewsArticle | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<OwnEvent | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: nData }, { data: eData }] = await Promise.all([
        supabase
          .from('news_articles')
          .select('id, title, summary, category, image_url, published_at, source_name, sector_tags, url')
          .eq('created_by', user.id)
          .order('published_at', { ascending: false }),
        supabase
          .from('scraped_events')
          .select('id, title, description, event_type, start_date, end_date, start_date_text, location, city, is_online, registration_url, organizer, sector_tags, source_url, is_free')
          .eq('created_by', user.id)
          .order('start_date', { ascending: true }),
      ])
      setNews((nData ?? []) as OwnNewsArticle[])
      setEvents((eData ?? []) as OwnEvent[])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── News CRUD ──────────────────────────────────────────────────────────────

  const saveNews = async (form: NewsFormState) => {
    const tags = parseTags(form.sector_tags)
    const base = {
      title: form.title.trim(),
      summary: form.summary.trim() || null,
      category: form.category,
      image_url: form.image_url.trim() || null,
      sector_tags: tags,
      source_name: programName,
      created_by: user!.id,
    }

    const articleUrl = form.article_url.trim() || `incubation:${crypto.randomUUID()}`

    if (newsModal?.mode === 'edit' && newsModal.article) {
      const { error } = await supabase
        .from('news_articles')
        .update({ ...base, url: articleUrl, published_at: newsModal.article.published_at })
        .eq('id', newsModal.article.id)
      if (error) { toast.error(error.message); return }
      toast.success('Article updated')
    } else {
      const { error } = await supabase
        .from('news_articles')
        .insert({
          ...base,
          url: articleUrl,
          published_at: new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          is_featured: false,
        })
      if (error) { toast.error(error.message); return }
      toast.success('Article published')
    }

    setNewsModal(null)
    fetchAll()
  }

  const deleteNewsArticle = async () => {
    if (!deleteNews) return
    setDeleting(true)
    const { error } = await supabase.from('news_articles').delete().eq('id', deleteNews.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Article deleted')
    setDeleteNews(null)
    fetchAll()
  }

  // ─── Events CRUD ────────────────────────────────────────────────────────────

  const saveEvent = async (form: EventFormState) => {
    const tags = parseTags(form.sector_tags)
    const startIso = localToIso(form.start_date)
    const endIso   = form.end_date ? localToIso(form.end_date) : null

    const base = {
      title:            form.title.trim(),
      description:      form.description.trim() || null,
      event_type:       form.event_type,
      start_date:       startIso || null,
      end_date:         endIso,
      location:         form.location.trim() || null,
      city:             form.city.trim() || null,
      is_online:        form.is_online,
      is_free:          form.is_free,
      registration_url: form.registration_url.trim() || null,
      sector_tags:      tags,
      organizer:        programName,
      created_by:       user!.id,
      is_active:        true,
    }

    if (eventModal?.mode === 'edit' && eventModal.ev) {
      const { error } = await supabase
        .from('scraped_events')
        .update(base)
        .eq('id', eventModal.ev.id)
      if (error) { toast.error(error.message); return }
      toast.success('Event updated')
    } else {
      const uid = crypto.randomUUID()
      const { error } = await supabase
        .from('scraped_events')
        .insert({
          ...base,
          source_url:    `https://capitalconnect.app/incubation/event/${uid}`,
          dedup_hash:    uid,
          source_domain: 'capitalconnect.app',
        })
      if (error) { toast.error(error.message); return }
      toast.success('Event published')
    }

    setEventModal(null)
    fetchAll()
  }

  const deleteEventRow = async () => {
    if (!deleteEvent) return
    setDeleting(true)
    const { error } = await supabase.from('scraped_events').delete().eq('id', deleteEvent.id)
    setDeleting(false)
    if (error) { toast.error(error.message); return }
    toast.success('Event deleted')
    setDeleteEvent(null)
    fetchAll()
  }

  // ─── Derived form state ──────────────────────────────────────────────────────

  const newsInitial: NewsFormState = newsModal?.article
    ? {
        title: newsModal.article.title,
        summary: newsModal.article.summary ?? '',
        category: newsModal.article.category ?? 'News',
        image_url: newsModal.article.image_url ?? '',
        article_url: newsModal.article.url.startsWith('incubation:') ? '' : newsModal.article.url,
        sector_tags: (newsModal.article.sector_tags ?? []).join(', '),
      }
    : BLANK_NEWS

  const eventInitial: EventFormState = eventModal?.ev
    ? {
        title: eventModal.ev.title,
        description: eventModal.ev.description ?? '',
        event_type: eventModal.ev.event_type ?? 'Demo Day',
        start_date: isoToLocal(eventModal.ev.start_date),
        end_date: isoToLocal(eventModal.ev.end_date),
        location: eventModal.ev.location ?? '',
        city: eventModal.ev.city ?? '',
        is_online: eventModal.ev.is_online,
        is_free: eventModal.ev.is_free,
        registration_url: eventModal.ev.registration_url ?? '',
        sector_tags: (eventModal.ev.sector_tags ?? []).join(', '),
      }
    : BLANK_EVENT

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO title="News & Events | Incubation" />

      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>News & Events</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Publish updates and events for your cohort — visible to all founders and investors.
            </p>
          </div>
          <button
            onClick={() => tab === 'news' ? setNewsModal({ mode: 'create' }) : setEventModal({ mode: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
            style={{ background: '#7C3AED' }}
          >
            <Plus className="w-4 h-4" />
            {tab === 'news' ? 'Add Article' : 'Add Event'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-6" style={{ background: 'var(--surface-2)' }}>
          {([['news', Newspaper, 'News Articles'], ['events', CalendarDays, 'Events']] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === key ? 'var(--surface)' : 'transparent',
                color: tab === key ? 'var(--ink)' : 'var(--muted)',
                boxShadow: tab === key ? 'var(--sh-1)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: tab === key ? 'rgba(124,58,237,0.12)' : 'var(--line)',
                  color: tab === key ? '#7C3AED' : 'var(--muted-2)',
                }}
              >
                {key === 'news' ? news.length : events.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7C3AED' }} />
          </div>
        ) : tab === 'news' ? (
          news.length === 0 ? (
            <EmptyContent
              icon={Newspaper}
              title="No articles yet"
              desc="Publish news, announcements, or updates for your cohort."
              cta="Add First Article"
              onCta={() => setNewsModal({ mode: 'create' })}
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {news.map(a => (
                  <NewsCard
                    key={a.id}
                    article={a}
                    onEdit={() => setNewsModal({ mode: 'edit', article: a })}
                    onDelete={() => setDeleteNews(a)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        ) : (
          events.length === 0 ? (
            <EmptyContent
              icon={CalendarDays}
              title="No events yet"
              desc="Create Demo Days, workshops, office hours or any cohort event."
              cta="Add First Event"
              onCta={() => setEventModal({ mode: 'create' })}
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {events.map(e => (
                  <EventCard
                    key={e.id}
                    ev={e}
                    onEdit={() => setEventModal({ mode: 'edit', ev: e })}
                    onDelete={() => setDeleteEvent(e)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}
      </div>

      {/* News Modal */}
      {newsModal && (
        <Modal
          title={newsModal.mode === 'create' ? 'Publish News Article' : 'Edit Article'}
          onClose={() => setNewsModal(null)}
        >
          <NewsForm
            initial={newsInitial}
            programName={programName}
            onSave={saveNews}
            onCancel={() => setNewsModal(null)}
          />
        </Modal>
      )}

      {/* Event Modal */}
      {eventModal && (
        <Modal
          title={eventModal.mode === 'create' ? 'Create Event' : 'Edit Event'}
          onClose={() => setEventModal(null)}
        >
          <EventForm
            initial={eventInitial}
            onSave={saveEvent}
            onCancel={() => setEventModal(null)}
          />
        </Modal>
      )}

      {/* Delete news */}
      {deleteNews && (
        <DeleteConfirm
          label={deleteNews.title}
          onConfirm={deleteNewsArticle}
          onCancel={() => setDeleteNews(null)}
          loading={deleting}
        />
      )}

      {/* Delete event */}
      {deleteEvent && (
        <DeleteConfirm
          label={deleteEvent.title}
          onConfirm={deleteEventRow}
          onCancel={() => setDeleteEvent(null)}
          loading={deleting}
        />
      )}
    </>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyContent({
  icon: Icon,
  title,
  desc,
  cta,
  onCta,
}: {
  icon: React.ElementType
  title: string
  desc: string
  cta: string
  onCta: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.08)' }}>
        <Icon className="w-8 h-8" style={{ color: '#7C3AED' }} />
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>{desc}</p>
      <button
        onClick={onCta}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#7C3AED' }}
      >
        <Plus className="w-4 h-4" />
        {cta}
      </button>
    </div>
  )
}
