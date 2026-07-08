import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { EmptyState } from '@/app/components/ui/EmptyState'
import {
  Calendar, CalendarClock, Clock, Globe, MapPin, Users,
  ArrowUpRight, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, X, Check,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'

// ─── Types ────────────────────────────────────────────────────────────
interface ScrapedEvent {
  id: string
  title: string
  description: string | null
  short_description: string | null
  event_type: string | null
  organizer: string | null
  source_url: string
  registration_url: string | null
  image_url: string | null
  location: string | null
  city: string | null
  country: string | null
  is_online: boolean
  start_date: string | null
  end_date: string | null
  start_date_text: string | null
  sector_tags: string[] | null
  is_free: boolean
  ticket_price_text: string | null
  source_domain: string | null
  is_active: boolean
}

// ─── Constants ────────────────────────────────────────────────────────
const EVENT_TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  conference: { color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
  summit:     { color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)' },
  webinar:    { color: '#059669', bg: 'rgba(16,185,129,0.10)' },
  workshop:   { color: '#D97706', bg: 'rgba(245,158,11,0.12)' },
  networking: { color: '#0891B2', bg: 'rgba(8,145,178,0.10)' },
  'demo day': { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  hackathon:  { color: '#DC2626', bg: 'rgba(239,68,68,0.10)' },
  meetup:     { color: '#DB2777', bg: 'rgba(219,39,119,0.10)' },
  default:    { color: 'var(--muted)', bg: 'var(--surface-2)' },
}

const EVENT_TYPES = [
  'Conference', 'Meetup', 'Workshop', 'Hackathon',
  'Summit', 'Demo Day', 'Networking', 'Webinar',
]

type SortKey = 'date' | 'name'
const SORT_OPTIONS: { label: string; key: SortKey }[] = [
  { label: 'Date (soonest)', key: 'date' },
  { label: 'Name (A–Z)',     key: 'name' },
]

function typeStyle(t: string | null | undefined) {
  return EVENT_TYPE_STYLE[(t ?? 'default').toLowerCase()] ?? EVENT_TYPE_STYLE.default
}

function isFreeEvent(e: ScrapedEvent): boolean {
  return e.is_free || (e.ticket_price_text ?? '').toLowerCase() === 'free'
}

function formatEventDate(isoOrRaw: string | null, fallback: string | null): { day: string; month: string; full: string } {
  const toDisplay = (d: Date) => ({
    day:   String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    full:  d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }),
  })
  if (isoOrRaw) {
    const d = new Date(isoOrRaw)
    if (!Number.isNaN(d.getTime())) return toDisplay(d)
  }
  return { day: '–', month: 'TBA', full: fallback ?? 'Date TBA' }
}

// ─── Filter dropdown ──────────────────────────────────────────────────
function FilterDropdown({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
        style={{
          background: value !== 'All' ? 'var(--blue-bg)' : 'var(--surface-2)',
          border: `1px solid ${value !== 'All' ? 'rgba(37,99,235,0.25)' : 'var(--line)'}`,
          color: value !== 'All' ? 'var(--blue)' : 'var(--ink)',
        }}
      >
        {value === 'All' ? label : value}
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 left-0 z-30 rounded-xl py-1 min-w-[180px] max-h-72 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          {options.map(opt => {
            const active = value === opt
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: active ? 'var(--blue)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
              >
                {opt === 'All' ? label : opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sort control ─────────────────────────────────────────────────────
function SortControl({ value, onChange }: { value: string; onChange: (label: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
      >
        <ChevronsUpDown className="w-3.5 h-3.5 opacity-70" />
        <span className="hidden sm:inline" style={{ color: 'var(--muted-2)' }}>Sort:</span> {value}
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1.5 right-0 z-30 rounded-xl py-1 min-w-[170px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-4)' }}
        >
          {SORT_OPTIONS.map(o => {
            const active = value === o.label
            return (
              <button
                key={o.label}
                onClick={() => { onChange(o.label); setOpen(false) }}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: active ? 'var(--blue)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, color,
}: {
  icon: typeof Calendar
  label: string
  value: string | number
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card rounded-2xl p-4 sm:p-5 flex items-center gap-3.5"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}26` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>{label}</div>
        <div className="text-[22px] font-extrabold leading-tight" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)' }}>{value}</div>
      </div>
    </motion.div>
  )
}

// ─── Toggle chip ──────────────────────────────────────────────────────
function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0"
      style={active
        ? { background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }
        : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }
      }
    >
      {children}
    </button>
  )
}

// ─── Location filter dialog (country → city) ──────────────────────────
function LocationFilterDialog({
  open, onClose, countries, getCities, country, city, onApply,
}: {
  open: boolean
  onClose: () => void
  countries: string[]
  getCities: (c: string) => string[]
  country: string
  city: string
  onApply: (country: string, city: string) => void
}) {
  const [step, setStep] = useState<'country' | 'city'>('country')
  const [tempCountry, setTempCountry] = useState(country)

  // Seed from the applied selection each time the dialog opens.
  useEffect(() => {
    if (open) {
      setTempCountry(country)
      setStep(country !== 'All' ? 'city' : 'country')
    }
  }, [open, country])

  // Escape to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const cities = getCities(tempCountry)

  function pickCountry(c: string) {
    if (c === 'All') { onApply('All', 'All'); onClose(); return }
    setTempCountry(c)
    if (getCities(c).length > 1) setStep('city')
    else { onApply(c, 'All'); onClose() }
  }

  function pickCity(ci: string) {
    onApply(tempCountry, ci)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: 'rgba(13,27,42,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="card rounded-2xl w-full"
            style={{ maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-pop)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2.5">
                {step === 'city' && (
                  <button onClick={() => setStep('country')} aria-label="Back"
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                    <ChevronLeft className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </button>
                )}
                <div>
                  <h3 className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
                    {step === 'country' ? 'Select country' : 'Select city'}
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                    {step === 'country' ? 'Step 1 of 2' : `${tempCountry} · Step 2 of 2`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close"
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface-2)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto py-1" style={{ minHeight: 0 }}>
              {step === 'country'
                ? countries.map(c => {
                    const active = c === country
                    return (
                      <button key={c} onClick={() => pickCountry(c)}
                        className="w-full flex items-center justify-between gap-2 px-5 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]">
                        <span className="text-[13.5px]" style={{ color: active ? 'var(--blue)' : 'var(--ink)', fontWeight: active ? 600 : 400 }}>
                          {c === 'All' ? 'All Countries' : c}
                        </span>
                        {c !== 'All' && <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />}
                      </button>
                    )
                  })
                : cities.map(ci => {
                    const active = ci === city
                    return (
                      <button key={ci} onClick={() => pickCity(ci)}
                        className="w-full flex items-center justify-between gap-2 px-5 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]">
                        <span className="text-[13.5px]" style={{ color: active ? 'var(--blue)' : 'var(--ink)', fontWeight: active ? 600 : 400 }}>
                          {ci === 'All' ? 'All Cities' : ci}
                        </span>
                        {active && <Check className="w-4 h-4" style={{ color: 'var(--blue)' }} />}
                      </button>
                    )
                  })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--line)' }}>
              <button onClick={() => { onApply('All', 'All'); onClose() }} className="text-[12.5px] font-semibold" style={{ color: 'var(--muted-2)' }}>
                Clear
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12.5px] font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Event Card (no banner — date tile instead) ───────────────────────
function EventCard({ event }: { event: ScrapedEvent }) {
  const ts = typeStyle(event.event_type)
  const { day, month, full } = formatEventDate(event.start_date, event.start_date_text)
  const href = event.registration_url || event.source_url
  const free = isFreeEvent(event)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-hover-lift rounded-2xl flex flex-col h-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header: date tile + badges + title */}
        <div className="flex items-start gap-3">
          {/* Date tile (replaces the banner image) */}
          <div
            className="flex flex-col items-center justify-center shrink-0 rounded-xl"
            style={{ width: 52, height: 56, background: ts.bg, border: '1px solid var(--line)' }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: ts.color, letterSpacing: 0.5 }}>{month}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', lineHeight: 1, fontFamily: 'var(--font-num)' }}>{day}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {event.event_type && (
                <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize" style={{ background: ts.bg, color: ts.color }}>
                  {event.event_type}
                </span>
              )}
              {event.is_online && (
                <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: 'rgba(37,99,235,0.10)', color: 'var(--blue)' }}>
                  Online
                </span>
              )}
              {free && (
                <span className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}>
                  Free
                </span>
              )}
            </div>
            <h4
              className="text-[15px] font-bold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {event.title}
            </h4>
          </div>
        </div>

        {/* Description */}
        {(event.short_description || event.description) && (
          <p
            className="text-[12.5px] leading-relaxed"
            style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {stripMarkdown(event.short_description ?? (event.description ? event.description.slice(0, 140) : ''))}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-[12px]" style={{ color: 'var(--muted-2)' }}>
          {event.organizer && (
            <span className="flex items-center gap-1.5 min-w-0">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.organizer}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 min-w-0">
            {event.is_online ? <Globe className="w-3.5 h-3.5 shrink-0" /> : <MapPin className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{event.is_online ? 'Online event' : (event.location || event.city || 'Location TBA')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {full}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--line-2)' }}>
          {event.ticket_price_text && !free ? (
            <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{event.ticket_price_text}</span>
          ) : (
            <span className="text-[12.5px] font-semibold" style={{ color: '#059669' }}>{free ? 'Free entry' : ''}</span>
          )}
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold transition-all active:scale-[0.97]"
              style={{ background: 'var(--blue)', color: '#fff' }}
            >
              Register <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────
export function EventsPage() {
  const [events, setEvents] = useState<ScrapedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [onlyOnline, setOnlyOnline] = useState(false)
  const [onlyFree, setOnlyFree] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [locDialogOpen, setLocDialogOpen] = useState(false)

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('scraped_events')
      .select('*')
      .eq('is_active', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      setError(error.message)
      setEvents([])
    } else {
      setEvents((data as ScrapedEvent[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const uniqueCountries = useMemo(() => {
    const s = new Set<string>()
    events.forEach(e => { if (e.country) s.add(e.country) })
    return ['All', ...Array.from(s).sort()]
  }, [events])

  // Cities available for a given country — used by the location dialog.
  const getCities = useCallback((c: string) => {
    const s = new Set<string>()
    events.forEach(e => {
      if (!e.city || e.city === 'Online') return
      if (c !== 'All' && e.country !== c) return
      s.add(e.city)
    })
    return ['All', ...Array.from(s).sort()]
  }, [events])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = events.filter(e => {
      if (onlyOnline && !e.is_online) return false
      if (onlyFree && !isFreeEvent(e)) return false
      if (cityFilter !== 'All' && e.city !== cityFilter) return false
      if (countryFilter !== 'All' && e.country !== countryFilter) return false
      if (typeFilter !== 'All' && (e.event_type ?? '').toLowerCase() !== typeFilter.toLowerCase()) return false
      if (q) {
        const hay = [e.title, e.organizer, e.location, e.city, e.country, e.description]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    list.sort((a, b) => {
      if (sortKey === 'name') return a.title.localeCompare(b.title)
      const ta = a.start_date ? new Date(a.start_date).getTime() : Infinity
      const tb = b.start_date ? new Date(b.start_date).getTime() : Infinity
      return ta - tb
    })
    return list
  }, [events, onlyOnline, onlyFree, cityFilter, countryFilter, typeFilter, search, sortKey])

  // KPIs
  const now = new Date()
  const weekEnd = new Date(); weekEnd.setDate(now.getDate() + 7)
  const monthEnd = new Date(); monthEnd.setMonth(now.getMonth() + 1)
  const upcomingCount = events.length
  const thisWeekCount = events.filter(e => e.start_date && new Date(e.start_date) <= weekEnd).length
  const thisMonthCount = events.filter(e => e.start_date && new Date(e.start_date) <= monthEnd).length
  const onlineCount = events.filter(e => e.is_online).length

  const hasFilters = typeFilter !== 'All' || cityFilter !== 'All' || countryFilter !== 'All' || onlyOnline || onlyFree || search !== ''
  function clearFilters() {
    setTypeFilter('All'); setCityFilter('All'); setCountryFilter('All')
    setOnlyOnline(false); setOnlyFree(false); setSearch('')
  }
  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sortKey)?.label ?? 'Date (soonest)'
  function applySort(label: string) {
    const o = SORT_OPTIONS.find(opt => opt.label === label)
    if (o) setSortKey(o.key)
  }

  const locActive = countryFilter !== 'All' || cityFilter !== 'All'
  const locLabel = countryFilter === 'All'
    ? 'All Locations'
    : (cityFilter !== 'All' ? `${countryFilter} · ${cityFilter}` : countryFilter)

  return (
    <div className="pb-8 space-y-6">
      <SEO title="Events" path="/dashboard/events" noindex />

      <HeroSection
        title="Events"
        subtitle="Conferences, demo days, hackathons, workshops, and meetups across the startup ecosystem."
      />

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={88} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Calendar}      label="Upcoming"   value={upcomingCount}  color="#2563EB" />
          <KpiCard icon={Clock}         label="This Week"  value={thisWeekCount}  color="#D97706" />
          <KpiCard icon={CalendarClock} label="This Month" value={thisMonthCount} color="#059669" />
          <KpiCard icon={Globe}         label="Online"     value={onlineCount}    color="#7C3AED" />
        </div>
      )}

      {/* Filter toolbar */}
      <div className="card rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title, organizer, or location…"
            className="lg:max-w-sm lg:flex-1"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <button
              onClick={() => setLocDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors"
              style={{
                background: locActive ? 'var(--blue-bg)' : 'var(--surface-2)',
                border: `1px solid ${locActive ? 'rgba(37,99,235,0.25)' : 'var(--line)'}`,
                color: locActive ? 'var(--blue)' : 'var(--ink)',
              }}
            >
              <MapPin className="w-3.5 h-3.5 opacity-80" />
              {locLabel}
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            <FilterDropdown label="All Types" value={typeFilter} options={['All', ...EVENT_TYPES]} onChange={setTypeFilter} />
          </div>
        </div>

        {/* Quick toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          <ToggleChip active={onlyOnline} onClick={() => setOnlyOnline(v => !v)}>
            <Globe className="w-3.5 h-3.5" /> Online only
          </ToggleChip>
          <ToggleChip active={onlyFree} onClick={() => setOnlyFree(v => !v)}>
            Free only
          </ToggleChip>
        </div>
      </div>

      {/* Results header */}
      {!loading && !error && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--blue)' }} />
            <h3 className="text-[15px] font-bold" style={{ color: 'var(--ink)' }}>Upcoming Events</h3>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button onClick={clearFilters} className="text-[12px] font-semibold" style={{ color: 'var(--muted-2)' }}>Clear</button>
            )}
            {filtered.length > 0 && <SortControl value={currentSortLabel} onChange={applySort} />}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={250} />)}
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card rounded-2xl">
            <EmptyState
              icon={<Calendar size={28} style={{ color: 'var(--neg)' }} />}
              title="Failed to load events"
              description={error}
              action={{ label: 'Retry', onClick: fetchEvents }}
            />
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card rounded-2xl">
            <EmptyState
              icon={<Calendar size={28} color="#2563EB" />}
              title="No upcoming events found"
              description="Try different filters, or check back soon — new events are added regularly."
              action={hasFilters ? { label: 'Clear all filters', onClick: clearFilters } : undefined}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(event => (
              <motion.div
                key={event.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                className="h-full"
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <LocationFilterDialog
        open={locDialogOpen}
        onClose={() => setLocDialogOpen(false)}
        countries={uniqueCountries}
        getCities={getCities}
        country={countryFilter}
        city={cityFilter}
        onApply={(c, ci) => { setCountryFilter(c); setCityFilter(ci) }}
      />
    </div>
  )
}
