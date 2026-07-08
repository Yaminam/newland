import { useState, useEffect } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  DollarSign, Briefcase, TrendingUp, PlusCircle,
  Edit2, Trash2, BarChart2, Check, ChevronDown, Plus
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import {
  parseOptionalNumber,
  sanitizeOptionalDate,
  sanitizeOptionalText,
  sanitizeText,
  sanitizeUrl,
} from '@/app/lib/inputSecurity'
import { type Currency, CURRENCIES, formatAmount, formatTotals, sumByCurrency } from '@/app/lib/currency'
import { Modal } from '@/app/components/ui/Modal'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { toast } from 'sonner'

const CHART_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#0891B2', '#EF4444']
const SECTORS = ['AI/ML', 'FinTech', 'HealthTech', 'SaaS', 'CleanTech', 'EdTech', 'AgriTech', 'DeepTech', 'Consumer', 'E-Commerce']
const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth']
const STATUSES = ['Active', 'Exited', 'Written Off', 'IPO']

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:       { bg: 'var(--pos-bg)', color: 'var(--pos)' },
  Exited:       { bg: 'var(--blue-bg)', color: 'var(--blue)' },
  'Written Off': { bg: 'var(--neg-bg)', color: 'var(--neg)' },
  IPO:          { bg: 'var(--warn-bg)', color: 'var(--warn)' },
}

interface PortfolioEntry {
  id: string
  investor_id: string
  external_name: string
  business_url?: string
  external_sector?: string
  stage_at_entry?: string
  invested_amount?: number
  currency?: Currency
  investment_date?: string
  status: string
  notes?: string
  created_at: string
}

interface EntryForm {
  external_name: string
  business_url: string
  external_sector: string
  stage_at_entry: string
  invested_amount: string
  currency: Currency
  investment_date: string
  status: string
  notes: string
}

const emptyForm: EntryForm = {
  external_name: '', business_url: '', external_sector: '', stage_at_entry: '', invested_amount: '',
  currency: 'USD', investment_date: '', status: 'Active', notes: ''
}

function EntryModal({ entry, onClose, onSave, investorId }: {
  entry: PortfolioEntry | null; onClose: () => void; onSave: () => void; investorId: string
}) {
  const [form, setForm] = useState<EntryForm>(entry ? {
    external_name: entry.external_name,
    business_url: entry.business_url ?? '',
    external_sector: entry.external_sector ?? '',
    stage_at_entry: entry.stage_at_entry ?? '',
    invested_amount: entry.invested_amount ? String(entry.invested_amount) : '',
    currency: entry.currency ?? 'USD',
    investment_date: entry.investment_date ?? '',
    status: entry.status,
    notes: entry.notes ?? '',
  } : emptyForm)
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!form.external_name.trim()) { toast.error('Company name is required'); return }
    if (!form.business_url.trim()) { toast.error('Business URL is required'); return }
    if (!form.external_sector || !SECTORS.includes(form.external_sector)) { toast.error('Sector is required'); return }
    if (!form.stage_at_entry || !STAGES.includes(form.stage_at_entry)) { toast.error('Stage is required'); return }
    if (!form.invested_amount.trim()) { toast.error('Investment amount is required'); return }
    if (!form.investment_date.trim()) { toast.error('Investment date is required'); return }
    setSaving(true)
    try {
      const amount = parseOptionalNumber(form.invested_amount)
      if (amount === null || amount <= 0) { toast.error('Enter a valid investment amount'); setSaving(false); return }
      const payload = {
        external_name: sanitizeText(form.external_name, { maxLength: 160, allowEmpty: false }),
        business_url: sanitizeUrl(form.business_url),
        external_sector: form.external_sector,
        stage_at_entry: form.stage_at_entry,
        invested_amount: amount,
        currency: CURRENCIES.includes(form.currency) ? form.currency : 'USD',
        investment_date: sanitizeOptionalDate(form.investment_date),
        status: STATUSES.includes(form.status) ? form.status : 'Active',
        notes: sanitizeOptionalText(form.notes, { maxLength: 2000, multiline: true }),
      }
      if (entry) {
        const { error } = await supabase
          .from('portfolio_items')
          .update(payload)
          .eq('id', entry.id)
          .eq('investor_id', investorId)
          .select('id')
          .single()
        if (error) throw error
        toast.success('Entry updated')
      } else {
        const { error } = await supabase.from('portfolio_items').insert({ investor_id: investorId, ...payload })
        if (error) throw error
        toast.success('Investment added to portfolio')
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--surface-2)',
    border: '1.5px solid var(--line)',
    color: 'var(--ink)',
  }

  const currencySymbol = form.currency === 'INR' ? '₹' : '$'
  const amountHint = form.currency === 'INR'
    ? 'Enter in rupees — e.g. 2,500,000 for ₹25 L'
    : 'Enter in dollars — e.g. 50,000'

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? 'Edit Investment' : 'Add Investment'}
      subtitle={entry ? 'Update the details of your position.' : 'Track a new investment in your portfolio.'}
      size="lg"
      footer={
        <div className="flex items-center gap-2 w-full justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all"
            style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : entry ? 'Update' : 'Add Investment'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Business Details */}
        <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--line-2)' }}>
          <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
            Business Details
          </span>
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Company Name <span style={{ color: 'var(--neg)' }}>*</span>
          </label>
          <input
            type="text"
            value={form.external_name}
            onChange={e => setForm(f => ({ ...f, external_name: e.target.value }))}
            placeholder="e.g. Acme Corp"
            className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Business URL <span style={{ color: 'var(--neg)' }}>*</span>
          </label>
          <input
            type="url"
            value={form.business_url}
            onChange={e => setForm(f => ({ ...f, business_url: e.target.value }))}
            placeholder="acme.com"
            className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              Sector <span style={{ color: 'var(--neg)' }}>*</span>
            </label>
            <div className="relative">
              <select
                value={form.external_sector}
                onChange={e => setForm(f => ({ ...f, external_sector: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none appearance-none transition-all"
                style={{ ...inputStyle, paddingRight: 36 }}
              >
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-2)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              Stage <span style={{ color: 'var(--neg)' }}>*</span>
            </label>
            <div className="relative">
              <select
                value={form.stage_at_entry}
                onChange={e => setForm(f => ({ ...f, stage_at_entry: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none appearance-none transition-all"
                style={{ ...inputStyle, paddingRight: 36 }}
              >
                <option value="">Select stage</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-2)' }} />
            </div>
          </div>
        </div>

        {/* Investment Details */}
        <div className="flex items-center gap-2 pb-2 mt-2" style={{ borderBottom: '1px solid var(--line-2)' }}>
          <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
            Investment Details
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>
              Amount <span style={{ color: 'var(--neg)' }}>*</span>
            </label>
            <div
              className="inline-flex items-center gap-1 p-0.5 rounded-[8px]"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
            >
              {(['USD', 'INR'] as Currency[]).map(c => {
                const selected = form.currency === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, currency: c }))}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] cursor-pointer transition-all"
                    style={{
                      background: selected ? 'var(--blue)' : 'transparent',
                      color: selected ? '#fff' : 'var(--muted-2)',
                    }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="relative">
            <span
              className="absolute left-0 top-0 bottom-0 flex items-center justify-center text-[13px] font-semibold pointer-events-none"
              style={{ color: 'var(--muted-2)', width: 34 }}
            >
              {currencySymbol}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={form.invested_amount}
              onChange={e => setForm(f => ({ ...f, invested_amount: e.target.value }))}
              placeholder={form.currency === 'INR' ? '2,500,000' : '50,000'}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <p className="text-[10px] mt-1" style={{ color: 'var(--muted-2)' }}>{amountHint}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              Date <span style={{ color: 'var(--neg)' }}>*</span>
            </label>
            <input
              type="date"
              value={form.investment_date}
              onChange={e => setForm(f => ({ ...f, investment_date: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none transition-all"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--line)'}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>Status</label>
            <div className="relative">
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none appearance-none transition-all"
                style={{ ...inputStyle, paddingRight: 36 }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-2)' }} />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Notes <span className="text-[10px] font-normal" style={{ color: 'var(--muted-2)' }}>(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Thesis, key contacts, follow-ons…"
            className="w-full px-3.5 py-2.5 rounded-[10px] text-[13px] outline-none resize-none transition-all"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
        </div>
      </div>
    </Modal>
  )
}

export function PortfolioPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<PortfolioEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState<PortfolioEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function fetchEntries() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('investor_id', profile!.id)
        .order('investment_date', { ascending: false })
      if (error) throw error
      setEntries((data as PortfolioEntry[]) ?? [])
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (profile) fetchEntries() }, [profile])

  async function deleteEntry(id: string) {
    try {
      const { error } = await supabase.from('portfolio_items')
        .delete()
        .eq('id', id)
        .eq('investor_id', profile!.id)
        .select('id')
        .single()
      if (error) throw error
      toast.success('Entry removed')
      setDeleteId(null)
      fetchEntries()
    } catch {
      toast.error('Delete failed')
    }
  }

  // KPIs
  const totalsByCurrency = sumByCurrency(entries, e => e.invested_amount, e => e.currency)
  const totalInvestedLabel = formatTotals(totalsByCurrency)
  const activeEntriesByCurrency: Record<Currency, number> = { USD: 0, INR: 0 }
  entries.forEach(e => { activeEntriesByCurrency[e.currency ?? 'USD'] += 1 })
  const avgCheckLabel = entries.length === 0
    ? '—'
    : (totalsByCurrency.USD > 0 && totalsByCurrency.INR > 0)
      ? 'Mixed'
      : totalsByCurrency.INR > 0
        ? formatAmount(totalsByCurrency.INR / activeEntriesByCurrency.INR, 'INR')
        : formatAmount(totalsByCurrency.USD / activeEntriesByCurrency.USD, 'USD')
  const active = entries.filter(e => e.status === 'Active').length

  // Sector breakdown
  const sectorMap: Record<string, number> = {}
  entries.forEach(e => { if (e.external_sector) sectorMap[e.external_sector] = (sectorMap[e.external_sector] ?? 0) + 1 })
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }))

  // Monthly trend
  const monthMap: Record<string, number> = {}
  entries.forEach(e => {
    if (e.investment_date) {
      const key = e.investment_date.slice(0, 7)
      monthMap[key] = (monthMap[key] ?? 0) + 1
    }
  })
  const trendData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: month.slice(5), count }))

  return (
    <>
      <SEO title="Portfolio" path="/dashboard/portfolio" noindex />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroSection
        eyebrow="Portfolio"
        title="Investment Tracker"
        subtitle="Track and manage your investment portfolio across sectors and stages."
        stats={[
          { label: 'Invested', value: totalInvestedLabel },
          { label: 'Companies', value: entries.length },
          { label: 'Active', value: active },
          { label: 'Avg Check', value: avgCheckLabel },
        ]}
      >
        <button
          onClick={() => { setEditEntry(null); setShowModal(true) }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] mt-1"
          style={{ background: 'rgba(255,255,255,0.90)', color: '#1e293b' }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Investment
        </button>
      </HeroSection>

      {/* ── Charts ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5 px-1"
      >
        {/* Activity chart */}
        <div
          className="p-5 sm:p-6"
          style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Investment Activity
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-[12px]" style={{ color: 'var(--muted-2)' }}>
              No data yet
            </div>
          )}
        </div>

        {/* Sector pie */}
        <div
          className="p-5 sm:p-6"
          style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <h3 className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Sector Allocation
          </h3>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {sectorData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: 10 }}>{v}</span>} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-[12px]" style={{ color: 'var(--muted-2)' }}>
              No data yet
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Investment Table ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="px-1"
      >
        <div
          className="overflow-hidden"
          style={{ background: 'var(--surface)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              Investments
              <span
                className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
              >
                {entries.length}
              </span>
            </h3>
            <button
              onClick={() => { setEditEntry(null); setShowModal(true) }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--line-2)' }} />

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={40} />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Briefcase className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No investments yet"
                description='Click "Add Investment" to start tracking'
              />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Company', 'Sector', 'Stage', 'Invested', 'Date', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--muted-2)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const ss = STATUS_STYLE[e.status] ?? STATUS_STYLE.Active
                    return (
                      <tr
                        key={e.id}
                        className="transition-colors hover:bg-[var(--surface-2)]"
                        style={{ borderTop: i > 0 ? '1px solid var(--line-2)' : undefined }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-bold shrink-0"
                              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                            >
                              {e.external_name.charAt(0)}
                            </div>
                            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                              {e.external_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
                          >
                            {e.external_sector ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ color: 'var(--muted)' }}>
                          {e.stage_at_entry ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-semibold" style={{ color: 'var(--pos)' }}>
                          {formatAmount(e.invested_amount, e.currency ?? 'USD')}
                        </td>
                        <td className="px-5 py-3.5 text-[12px]" style={{ color: 'var(--muted-2)' }}>
                          {e.investment_date
                            ? new Date(e.investment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                            : '—'
                          }
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="text-[10px] font-semibold px-2 py-1 rounded-full"
                            style={{ background: ss.bg, color: ss.color }}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditEntry(e); setShowModal(true) }}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--surface-3)]"
                            >
                              <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                            </button>
                            <button
                              onClick={() => setDeleteId(e.id)}
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center cursor-pointer transition-all hover:bg-[var(--neg-bg)]"
                            >
                              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {showModal && (
        <EntryModal
          entry={editEntry}
          onClose={() => { setShowModal(false); setEditEntry(null) }}
          onSave={fetchEntries}
          investorId={profile!.id}
        />
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete entry?"
        subtitle="This action cannot be undone."
        size="sm"
        footer={
          <div className="flex items-center gap-2 w-full justify-end">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer"
              style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && deleteEntry(deleteId)}
              className="px-4 py-2 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{ background: 'var(--neg)', color: '#fff' }}
            >
              Delete
            </button>
          </div>
        }
      >
        <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>
          The investment entry will be removed from your portfolio permanently.
        </p>
      </Modal>
    </>
  )
}
