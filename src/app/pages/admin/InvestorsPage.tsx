import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle, Pause, Play, Search, Trash2, Shield, ShieldOff,
  X, Check, AlertTriangle, RefreshCw, Download, Eye, Mail,
  ExternalLink, CheckSquare, Square, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

// ── Top-level tab ─────────────────────────────────────────────────────────────

type TopTab = 'platform' | 'directory' | 'scraped'

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'platform',  label: 'Platform Members' },
  { id: 'directory', label: 'Directory'         },
  { id: 'scraped',   label: 'Scraped (Legacy)'  },
]

export function InvestorsPage() {
  const [tab, setTab] = useState<TopTab>('platform')

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold"
          style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Investors
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Manage platform investors, review the scraped directory pipeline, and curate legacy scraped data.
        </p>
      </header>

      {/* Top-level tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
        {TOP_TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: tab === t.id ? 'var(--surface)' : 'transparent',
              color:      tab === t.id ? 'var(--ink)'     : 'var(--muted)',
              boxShadow:  tab === t.id ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'platform'  && <PlatformTab />}
      {tab === 'directory' && <DirectoryTab />}
      {tab === 'scraped'   && <ScrapedTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Platform Members  (investor_profiles)
// ══════════════════════════════════════════════════════════════════════════════

interface PlatformInvestor {
  id:                 string
  user_id:            string | null
  fund_name:          string | null
  title:              string | null
  location:           string | null
  is_verified:        boolean
  deal_flow_paused:   boolean
  actively_investing: boolean
  response_rate:      string | null
  portfolio_count:    number | null
  sectors:            string[] | null
  profile?: { email: string | null; first_name: string | null; last_name: string | null } | null
}

function PlatformTab() {
  const [rows,    setRows]    = useState<PlatformInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [busy,    setBusy]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('investor_profiles')
      .select(`
        id, user_id, fund_name, title, location, is_verified, deal_flow_paused,
        actively_investing, response_rate, portfolio_count, sectors,
        profile:profiles!investor_profiles_user_id_fkey ( email, first_name, last_name )
      `)
      .order('is_verified', { ascending: false })
      .limit(200)
    if (search.trim()) q = q.ilike('fund_name', `%${search.trim()}%`)
    const { data, error } = await q
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as PlatformInvestor[]) ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { void load() }, [load])

  async function toggle(id: string, field: 'is_verified' | 'deal_flow_paused' | 'actively_investing', value: boolean) {
    setBusy(id + field)
    const { error } = await supabase.from('investor_profiles').update({ [field]: value }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Updated.')
    void load()
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search fund name…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }} />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>Fund / Investor</Th><Th>Location</Th><Th>Sectors</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No platform investors.</td></tr>
            ) : rows.map(r => {
              const name = [r.profile?.first_name, r.profile?.last_name].filter(Boolean).join(' ') || r.profile?.email || '—'
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td>
                    <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.fund_name ?? '(no fund name)'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{name}</p>
                  </Td>
                  <Td>{r.location ?? '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {(r.sectors ?? []).slice(0, 3).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>{s}</span>
                      ))}
                      {(r.sectors?.length ?? 0) > 3 && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>+{(r.sectors?.length ?? 0) - 3}</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {r.is_verified        && <Pill tone="success">Verified</Pill>}
                      {r.deal_flow_paused   && <Pill tone="warn">Paused</Pill>}
                      {!r.actively_investing && <Pill tone="neutral">Inactive</Pill>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex gap-1 flex-wrap">
                      <SmallBtn label={r.is_verified ? 'Unverify' : 'Verify'}
                        icon={r.is_verified ? ShieldOff : Shield}
                        busy={busy === r.id + 'is_verified'}
                        onClick={() => toggle(r.id, 'is_verified', !r.is_verified)} />
                      <SmallBtn label={r.deal_flow_paused ? 'Resume' : 'Pause'}
                        icon={r.deal_flow_paused ? Play : Pause}
                        busy={busy === r.id + 'deal_flow_paused'}
                        onClick={() => toggle(r.id, 'deal_flow_paused', !r.deal_flow_paused)} />
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Directory  (investor_directory — approval pipeline)
// ══════════════════════════════════════════════════════════════════════════════

type DirectoryStatus = 'pending_review' | 'approved' | 'rejected'

interface DirectoryEntry {
  id:               string
  first_name:       string
  last_name:        string | null
  firm_name:        string | null
  title:            string | null
  investor_type:    string | null
  email:            string | null
  linkedin_url:     string | null
  photo_url:        string | null
  location_city:    string | null
  location_country: string | null
  firm_stages:      string | null
  firm_focus:       string | null
  firm_description: string | null
  firm_website:     string | null
  status:           DirectoryStatus
  reviewed_at:      string | null
  rejection_reason: string | null
  imported_at:      string
  claimed_by:       string | null
  email_mismatch:   boolean
}

const DIR_STATUS_LABELS: Record<DirectoryStatus, string> = {
  pending_review: 'Pending',
  approved:       'Approved',
  rejected:       'Rejected',
}

const DIR_STATUS_COLORS: Record<DirectoryStatus, { bg: string; text: string }> = {
  pending_review: { bg: '#FEF3C7', text: '#D97706' },
  approved:       { bg: '#D1FAE5', text: '#059669' },
  rejected:       { bg: '#FEE2E2', text: '#DC2626' },
}

function DirectoryTab() {
  const [activeStatus, setActiveStatus] = useState<DirectoryStatus>('pending_review')
  const [rows,         setRows]         = useState<DirectoryEntry[]>([])
  const [counts,       setCounts]       = useState<Record<DirectoryStatus, number>>({
    pending_review: 0, approved: 0, rejected: 0,
  })
  const [loading,      setLoading]     = useState(false)
  const [search,       setSearch]      = useState('')
  const [selected,     setSelected]    = useState<DirectoryEntry | null>(null)
  const [working,      setWorking]     = useState<string | null>(null)
  const [rejectNote,   setRejectNote]  = useState('')
  const [checkedIds,   setCheckedIds]  = useState<Set<string>>(new Set())
  const [bulkWorking,  setBulkWorking] = useState(false)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setCheckedIds(new Set())
    const { data, error } = await supabase
      .from('investor_directory')
      .select('*')
      .eq('status', activeStatus)
      .order('imported_at', { ascending: false })
    if (error) { toast.error('Failed to load entries'); setLoading(false); return }
    setRows(data ?? [])
    setLoading(false)
  }, [activeStatus])

  const fetchCounts = useCallback(async () => {
    const statuses: DirectoryStatus[] = ['pending_review', 'approved', 'rejected']
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('investor_directory').select('id', { count: 'exact', head: true }).eq('status', s)
      )
    )
    const next = { pending_review: 0, approved: 0, rejected: 0 } as Record<DirectoryStatus, number>
    statuses.forEach((s, i) => { next[s] = results[i].count ?? 0 })
    setCounts(next)
  }, [])

  useEffect(() => { fetchRows() },   [fetchRows])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  async function act(entry: DirectoryEntry, newStatus: DirectoryStatus, reason?: string) {
    if (newStatus === 'rejected' && !reason?.trim()) {
      toast.error('Please enter a reason for rejection.')
      return
    }
    setWorking(entry.id + newStatus)
    const { error } = await supabase
      .from('investor_directory')
      .update({
        status:           newStatus,
        reviewed_at:      new Date().toISOString(),
        rejection_reason: reason?.trim() || null,
      })
      .eq('id', entry.id)
    setWorking(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${newStatus === 'approved' ? 'Approved' : 'Rejected'}: ${entry.first_name} ${entry.last_name ?? ''}`)
    setSelected(null)
    setRejectNote('')
    fetchRows()
    fetchCounts()
  }

  async function bulkApprove(ids: string[]) {
    if (!ids.length) return
    setBulkWorking(true)
    const { error } = await supabase.from('investor_directory')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), rejection_reason: null })
      .in('id', ids)
    setBulkWorking(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Approved ${ids.length} investor${ids.length !== 1 ? 's' : ''}`)
    setCheckedIds(new Set())
    fetchRows()
    fetchCounts()
  }

  function exportCSV() {
    const headers = ['Name','Firm','Title','Email','LinkedIn','Location','Focus','Stages','Status','Email Mismatch']
    const csvRows = [
      headers.join(','),
      ...filtered.map(r => [
        `"${r.first_name} ${r.last_name ?? ''}"`,
        `"${r.firm_name ?? ''}"`,
        `"${r.title ?? ''}"`,
        `"${r.email ?? ''}"`,
        `"${r.linkedin_url ?? ''}"`,
        `"${[r.location_city, r.location_country].filter(Boolean).join(', ')}"`,
        `"${r.firm_focus ?? ''}"`,
        `"${r.firm_stages ?? ''}"`,
        `"${r.status}"`,
        `"${r.email_mismatch ? 'Yes' : 'No'}"`,
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `investor_directory_${activeStatus}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const q          = search.toLowerCase()
  const filtered   = rows.filter(r =>
    !q || [r.first_name, r.last_name, r.firm_name, r.email, r.location_country]
      .some(v => (v ?? '').toLowerCase().includes(q))
  )
  const isPending    = activeStatus === 'pending_review'
  const filteredIds  = filtered.map(r => r.id)
  const allChecked   = filteredIds.length > 0 && filteredIds.every(id => checkedIds.has(id))
  const someChecked  = filteredIds.some(id => checkedIds.has(id))
  const checkedList  = filteredIds.filter(id => checkedIds.has(id))
  const checkedCount = checkedList.length

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(prev => { const n = new Set(prev); filteredIds.forEach(id => n.delete(id)); return n })
    } else {
      setCheckedIds(prev => new Set([...prev, ...filteredIds]))
    }
  }
  function toggleOne(id: string) {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <>
      {/* Sub-tabs row */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {(Object.keys(DIR_STATUS_LABELS) as DirectoryStatus[]).map(s => (
            <button key={s} type="button"
              onClick={() => { setActiveStatus(s); setSearch(''); setCheckedIds(new Set()) }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: activeStatus === s ? 'var(--surface)' : 'transparent',
                color:      activeStatus === s ? 'var(--ink)'     : 'var(--muted)',
                boxShadow:  activeStatus === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              {DIR_STATUS_LABELS[s]}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: activeStatus === s ? DIR_STATUS_COLORS[s].bg : 'var(--surface-2)',
                  color:      activeStatus === s ? DIR_STATUS_COLORS[s].text : 'var(--muted)',
                }}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { fetchRows(); fetchCounts() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <button type="button" onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        </div>
      </div>

      {/* Search + bulk actions row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative" style={{ width: 280 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, firm, email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)', outline: 'none' }} />
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            {/* Approve All visible */}
            <button
              type="button"
              onClick={() => bulkApprove(filteredIds)}
              disabled={bulkWorking || filtered.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: '#059669', color: '#fff', boxShadow: '0 1px 4px rgba(5,150,105,0.2)' }}>
              {bulkWorking && checkedCount === 0
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />}
              Approve All ({filtered.length})
            </button>

            {/* Approve Selected */}
            {checkedCount > 0 && (
              <>
                <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
                <button
                  type="button"
                  onClick={() => bulkApprove(checkedList)}
                  disabled={bulkWorking}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}>
                  {bulkWorking
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckSquare className="w-3.5 h-3.5" />}
                  Approve Selected ({checkedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCheckedIds(new Set())}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
                  <X className="w-3 h-3" />Deselect
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              {/* Checkbox header — pending only */}
              {isPending && (
                <th className="px-3 py-3" style={{ width: 44 }}>
                  <button type="button" onClick={toggleAll}
                    className="flex items-center justify-center"
                    style={{ color: allChecked ? '#059669' : someChecked ? '#D97706' : 'var(--muted)' }}
                    title={allChecked ? 'Deselect all' : 'Select all'}>
                    {allChecked
                      ? <CheckSquare className="w-4 h-4" />
                      : someChecked
                        ? <CheckSquare className="w-4 h-4" style={{ opacity: 0.5 }} />
                        : <Square className="w-4 h-4" />}
                  </button>
                </th>
              )}
              <Th></Th>
              <Th>Investor</Th>
              <Th>Firm</Th>
              <Th>Email</Th>
              <Th>Focus</Th>
              <Th>Location</Th>
              <Th>Imported</Th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={isPending ? 9 : 8} className="text-center py-12" style={{ color: 'var(--muted)' }}>
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading…
              </td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={isPending ? 9 : 8} className="text-center py-12" style={{ color: 'var(--muted)' }}>
                {search ? 'No results.' : `No ${DIR_STATUS_LABELS[activeStatus].toLowerCase()} entries.`}
              </td></tr>
            )}
            {!loading && filtered.map((entry, i) => {
              const isChecked = checkedIds.has(entry.id)
              return (
                <tr key={entry.id}
                  style={{
                    background:   isChecked ? '#F0FDF4' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                    transition:   'background 120ms',
                  }}>
                  {/* Checkbox */}
                  {isPending && (
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => toggleOne(entry.id)}
                        style={{ color: isChecked ? '#059669' : 'var(--muted)', display: 'flex' }}>
                        {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                  )}
                  <Td>
                    {entry.photo_url ? (
                      <img src={entry.photo_url} alt="" className="w-8 h-8 rounded-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                        {(entry.first_name[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                        {entry.first_name} {entry.last_name ?? ''}
                      </p>
                      {entry.email_mismatch && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: '#FEF3C7', color: '#D97706' }}>Email ≠</span>
                      )}
                      {entry.claimed_by && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: '#EDE9FE', color: '#7C3AED' }}>Claimed</span>
                      )}
                    </div>
                    {entry.title && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{entry.title}</p>}
                  </Td>
                  <Td>
                    <p style={{ color: 'var(--ink)' }}>{entry.firm_name ?? '—'}</p>
                    {entry.firm_stages && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{entry.firm_stages}</p>}
                  </Td>
                  <Td>
                    {entry.email ? (
                      <a href={`mailto:${entry.email}`} className="flex items-center gap-1 text-xs hover:underline" style={{ color: '#1A56DB' }}>
                        <Mail className="w-3 h-3" />{entry.email}
                      </a>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>No email</span>
                    )}
                  </Td>
                  <Td><p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>{entry.firm_focus ?? '—'}</p></Td>
                  <Td><p className="text-xs" style={{ color: 'var(--muted)' }}>{[entry.location_city, entry.location_country].filter(Boolean).join(', ') || '—'}</p></Td>
                  <Td><p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(entry.imported_at).toLocaleDateString()}</p></Td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => { setSelected(entry); setRejectNote('') }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }} title="View details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {isPending && (
                        <>
                          <button onClick={() => act(entry, 'approved')}
                            disabled={working === entry.id + 'approved'}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: '#D1FAE5', color: '#059669' }}>
                            {working === entry.id + 'approved'
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button onClick={() => { setSelected(entry); setRejectNote('') }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}>
                            <X className="w-3 h-3" />Reject
                          </button>
                        </>
                      )}
                      {activeStatus === 'approved' && (
                        <button onClick={() => act(entry, 'rejected', 'Reverted by admin')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}>
                          <X className="w-3 h-3" />Revoke
                        </button>
                      )}
                      {activeStatus === 'rejected' && (
                        <button onClick={() => act(entry, 'approved')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: '#D1FAE5', color: '#059669' }}>
                          <Check className="w-3 h-3" />Re-approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        {filtered.length} of {rows.length} entries
        {checkedCount > 0 && <span style={{ color: '#059669', fontWeight: 600 }}> · {checkedCount} selected</span>}
      </p>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>

            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Profile Detail</h2>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                    {(selected.first_name[0] ?? '?').toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                    {selected.first_name} {selected.last_name ?? ''}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{selected.title ?? '—'}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: DIR_STATUS_COLORS[selected.status].bg, color: DIR_STATUS_COLORS[selected.status].text }}>
                  {DIR_STATUS_LABELS[selected.status]}
                </span>
                {selected.claimed_by && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>Claimed</span>
                )}
                {selected.email_mismatch && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>Email mismatch</span>
                )}
              </div>

              {/* Fields */}
              {([
                ['Email',       selected.email],
                ['Firm',        selected.firm_name],
                ['Type',        selected.investor_type],
                ['Website',     selected.firm_website],
                ['Location',    [selected.location_city, selected.location_country].filter(Boolean).join(', ')],
                ['Focus',       selected.firm_focus],
                ['Stages',      selected.firm_stages],
              ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                  <p className="text-sm" style={{ color: 'var(--ink)' }}>{val}</p>
                </div>
              ))}

              {selected.firm_description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Description</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>{selected.firm_description}</p>
                </div>
              )}

              {selected.linkedin_url && (
                <a href={selected.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium" style={{ color: '#1A56DB' }}>
                  <ExternalLink className="w-4 h-4" />View LinkedIn Profile
                </a>
              )}

              {selected.rejection_reason && (
                <div className="rounded-lg p-3" style={{ background: '#FEE2E2' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#DC2626' }}>Rejection reason</p>
                  <p className="text-sm" style={{ color: '#7F1D1D' }}>{selected.rejection_reason}</p>
                </div>
              )}

              {/* Actions inside drawer */}
              {selected.status === 'pending_review' && (
                <div className="space-y-3 pt-2">
                  <button onClick={() => act(selected, 'approved')} disabled={!!working}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#059669', color: '#fff' }}>
                    <Check className="w-4 h-4" />Approve — Make visible to founders
                  </button>
                  <div className="space-y-2">
                    <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                      placeholder="Rejection reason (required)…" rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm border resize-none outline-none"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }} />
                    <button onClick={() => act(selected, 'rejected', rejectNote)}
                      disabled={!rejectNote.trim() || !!working}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                      style={{ background: '#DC2626', color: '#fff' }}>
                      <X className="w-4 h-4" />Reject
                    </button>
                  </div>
                </div>
              )}
              {selected.status === 'approved' && (
                <button onClick={() => act(selected, 'rejected', 'Reverted by admin')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <X className="w-4 h-4" />Revoke Approval
                </button>
              )}
              {selected.status === 'rejected' && (
                <button onClick={() => act(selected, 'approved')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#059669', color: '#fff' }}>
                  <Check className="w-4 h-4" />Re-approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Scraped Legacy  (scraped_investors)
// ══════════════════════════════════════════════════════════════════════════════

interface ScrapedInvestor {
  id:                 string
  name:               string
  institution:        string | null
  title:              string | null
  location:           string | null
  sectors:            string[]
  stages:             string[]
  verified:           boolean
  actively_investing: boolean
  is_new:             boolean
  date_added:         string
  source_url:         string
  email:              string | null
  website:            string | null
  linkedin_url:       string | null
}

function ScrapedTab() {
  const [rows,    setRows]    = useState<ScrapedInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'all' | 'new' | 'unverified'>('all')
  const [busy,    setBusy]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('scraped_investors')
      .select('id, name, institution, title, location, sectors, stages, verified, actively_investing, is_new, date_added, source_url, email, website, linkedin_url')
      .order('date_added', { ascending: false })
      .limit(200)
    if (filter === 'new')        q = q.eq('is_new',   true)
    if (filter === 'unverified') q = q.eq('verified', false)
    if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,institution.ilike.%${search.trim()}%`)
    const { data, error } = await q
    if (error) { toast.error(error.message); setRows([]); setLoading(false); return }
    setRows((data as unknown as ScrapedInvestor[]) ?? [])
    setLoading(false)
  }, [search, filter])

  useEffect(() => { void load() }, [load])

  async function toggle(id: string, field: 'verified' | 'actively_investing' | 'is_new', value: boolean) {
    setBusy(id + field)
    const { error } = await supabase.from('scraped_investors').update({ [field]: value }).eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    void load()
  }

  async function remove(id: string) {
    if (!window.confirm('Permanently delete this scraped investor record?')) return
    setBusy(id + 'delete')
    const { error } = await supabase.from('scraped_investors').delete().eq('id', id)
    setBusy(null)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted.')
    void load()
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Name or institution…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }} />
        </div>
        <div className="flex gap-1 rounded-xl p-1"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {(['all','new','unverified'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize"
              style={{
                background: filter === f ? 'var(--surface)' : 'transparent',
                color:      filter === f ? 'var(--ink)'     : 'var(--muted)',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-2)' }}>
            <tr>
              <Th>Name</Th><Th>Institution</Th><Th>Location</Th><Th>Added</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center" style={{ color: 'var(--muted)' }}>No scraped investors.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--line)' }}>
                <Td>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{r.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{r.title ?? '—'}</p>
                </Td>
                <Td>{r.institution ?? '—'}</Td>
                <Td>{r.location ?? '—'}</Td>
                <Td>{new Date(r.date_added).toLocaleDateString()}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {r.verified           && <Pill tone="success">Verified</Pill>}
                    {r.is_new             && <Pill tone="accent">New</Pill>}
                    {!r.actively_investing && <Pill tone="neutral">Inactive</Pill>}
                  </div>
                </Td>
                <Td>
                  <div className="flex gap-1 flex-wrap">
                    <SmallBtn label={r.verified ? 'Unverify' : 'Verify'}
                      icon={r.verified ? ShieldOff : CheckCircle}
                      busy={busy === r.id + 'verified'}
                      onClick={() => toggle(r.id, 'verified', !r.verified)} />
                    {r.is_new && (
                      <SmallBtn label="Dismiss" busy={busy === r.id + 'is_new'}
                        onClick={() => toggle(r.id, 'is_new', false)} />
                    )}
                    <SmallBtn label="Delete" icon={Trash2} tone="danger"
                      busy={busy === r.id + 'delete'}
                      onClick={() => remove(r.id)} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Shared primitives
// ══════════════════════════════════════════════════════════════════════════════

function SmallBtn({ label, icon: Icon, busy, onClick, tone = 'neutral' }: {
  label:   string
  icon?:   React.ElementType
  busy:    boolean
  onClick: () => void
  tone?:   'neutral' | 'danger'
}) {
  const p = tone === 'danger'
    ? { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' }
    : { bg: 'var(--surface-2)', color: 'var(--ink)', border: 'var(--line)' }
  return (
    <button type="button" disabled={busy} onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {busy ? '…' : label}
    </button>
  )
}

function Pill({ tone, children }: { tone: 'success' | 'warn' | 'neutral' | 'accent'; children: React.ReactNode }) {
  const p = {
    success: { bg: '#DCFCE7', color: 'var(--pos)'   },
    warn:    { bg: '#FEF3C7', color: '#B45309'       },
    neutral: { bg: 'var(--line)', color: 'var(--muted)' },
    accent:  { bg: '#DBEAFE', color: 'var(--blue-h)' },
  }[tone]
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
      style={{ background: p.bg, color: p.color }}>
      {children}
    </span>
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
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>
}
