import { useEffect, useState, useCallback } from 'react'
import { Check, X, Search, RefreshCw, Download, Eye, Mail, ExternalLink, CheckSquare, Square, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// ── Types ──────────────────────────────────────────────────────────────────────

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
}

const TABS: { key: DirectoryStatus; label: string; color: string; text: string }[] = [
  { key: 'pending_review', label: 'Pending',  color: '#FEF3C7', text: '#D97706' },
  { key: 'approved',       label: 'Approved', color: '#D1FAE5', text: '#059669' },
  { key: 'rejected',       label: 'Rejected', color: '#FEE2E2', text: '#DC2626' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminInvestorDirectoryPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab]     = useState<DirectoryStatus>('pending_review')
  const [rows, setRows]               = useState<DirectoryEntry[]>([])
  const [counts, setCounts]           = useState<Record<DirectoryStatus, number>>({ pending_review: 0, approved: 0, rejected: 0 })
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState<DirectoryEntry | null>(null)
  const [working, setWorking]         = useState<string | null>(null)
  const [rejectNote, setRejectNote]   = useState('')
  const [checkedIds, setCheckedIds]   = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRows = useCallback(async () => {
    setLoading(true)
    setCheckedIds(new Set())
    const { data, error } = await supabase
      .from('investor_directory')
      .select('*')
      .eq('status', activeTab)
      .order('imported_at', { ascending: false })
    if (error) { toast.error('Failed to load entries'); setLoading(false); return }
    setRows(data ?? [])
    setLoading(false)
  }, [activeTab])

  const fetchCounts = useCallback(async () => {
    const statuses: DirectoryStatus[] = ['pending_review', 'approved', 'rejected']
    const results = await Promise.all(
      statuses.map(s => supabase.from('investor_directory').select('id', { count: 'exact', head: true }).eq('status', s))
    )
    const next = { pending_review: 0, approved: 0, rejected: 0 } as Record<DirectoryStatus, number>
    statuses.forEach((s, i) => { next[s] = results[i].count ?? 0 })
    setCounts(next)
  }, [])

  useEffect(() => { fetchRows() },   [fetchRows])
  useEffect(() => { fetchCounts() }, [fetchCounts])

  // ── Single action ─────────────────────────────────────────────────────────
  async function act(entry: DirectoryEntry, newStatus: DirectoryStatus, reason?: string) {
    if (newStatus === 'rejected' && !reason?.trim()) { toast.error('Enter a rejection reason'); return }
    setWorking(entry.id + newStatus)
    const { error } = await supabase.from('investor_directory').update({
      status:           newStatus,
      reviewed_by:      profile!.id,
      reviewed_at:      new Date().toISOString(),
      rejection_reason: reason?.trim() || null,
    }).eq('id', entry.id)
    setWorking(null)
    if (error) { toast.error(error.message); return }
    toast.success(`${newStatus === 'approved' ? 'Approved' : 'Rejected'}: ${entry.first_name} ${entry.last_name ?? ''}`)
    setSelected(null)
    setRejectNote('')
    fetchRows()
    fetchCounts()
  }

  // ── Bulk approve ──────────────────────────────────────────────────────────
  async function bulkApprove(ids: string[]) {
    if (!ids.length) return
    setBulkWorking(true)
    const { error } = await supabase.from('investor_directory').update({
      status:      'approved',
      reviewed_by: profile!.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    }).in('id', ids)
    setBulkWorking(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Approved ${ids.length} investor${ids.length !== 1 ? 's' : ''}`)
    setCheckedIds(new Set())
    fetchRows()
    fetchCounts()
  }

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const filteredIds  = filtered().map(r => r.id)
  const allChecked   = filteredIds.length > 0 && filteredIds.every(id => checkedIds.has(id))
  const someChecked  = filteredIds.some(id => checkedIds.has(id))

  function toggleAll() {
    if (allChecked) {
      setCheckedIds(prev => { const next = new Set(prev); filteredIds.forEach(id => next.delete(id)); return next })
    } else {
      setCheckedIds(prev => new Set([...prev, ...filteredIds]))
    }
  }

  function toggleOne(id: string) {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  function filtered() {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      [r.first_name, r.last_name, r.firm_name, r.email, r.location_country]
        .some(v => (v ?? '').toLowerCase().includes(q))
    )
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const f = filtered()
    const headers = ['Name','Firm','Title','Email','LinkedIn','Location','Focus','Stages','Status']
    const csvRows = [
      headers.join(','),
      ...f.map(r => [
        `"${r.first_name} ${r.last_name ?? ''}"`,
        `"${r.firm_name ?? ''}"`,
        `"${r.title ?? ''}"`,
        `"${r.email ?? ''}"`,
        `"${r.linkedin_url ?? ''}"`,
        `"${[r.location_city, r.location_country].filter(Boolean).join(', ')}"`,
        `"${r.firm_focus ?? ''}"`,
        `"${r.firm_stages ?? ''}"`,
        `"${r.status}"`,
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `investor_directory_${activeTab}_${Date.now()}.csv`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const isPending      = activeTab === 'pending_review'
  const checkedList    = [...checkedIds].filter(id => filteredIds.includes(id))
  const checkedCount   = checkedList.length
  const filteredData   = filtered()

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
            Investor Directory
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Review scraped investor profiles. Approve to make them visible to founders &amp; incubators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchRows(); fetchCounts() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: 'var(--surface-2)' }}>
        {TABS.map(({ key, label, color, text }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSearch(''); setCheckedIds(new Set()) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === key ? 'var(--surface)' : 'transparent',
              color:      activeTab === key ? 'var(--ink)'     : 'var(--muted)',
              boxShadow:  activeTab === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{
                background: activeTab === key ? color : 'transparent',
                color:      activeTab === key ? text  : 'var(--muted)',
              }}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar: search + bulk actions ─────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative" style={{ width: 280 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, firm, email…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>

        {/* Bulk action bar — only on pending tab */}
        {isPending && (
          <div className="flex items-center gap-2 flex-1">

            {/* Approve All (all pending rows) */}
            <button
              onClick={() => bulkApprove(filteredData.map(r => r.id))}
              disabled={bulkWorking || filteredData.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: '#059669', color: '#fff', boxShadow: '0 1px 4px rgba(5,150,105,0.2)' }}
            >
              {bulkWorking && checkedCount === 0
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
              Approve All ({filteredData.length})
            </button>

            {/* Approve Selected — shown when any checked */}
            {checkedCount > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
                <button
                  onClick={() => bulkApprove(checkedList)}
                  disabled={bulkWorking}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}
                >
                  {bulkWorking
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckSquare className="w-3.5 h-3.5" />
                  }
                  Approve Selected ({checkedCount})
                </button>
                <button
                  onClick={() => setCheckedIds(new Set())}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                >
                  <X className="w-3 h-3" />Deselect
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--line)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}>
              {/* Checkbox col — pending only */}
              {isPending && (
                <th className="px-4 py-3" style={{ width: 44 }}>
                  <button
                    onClick={toggleAll}
                    className="flex items-center justify-center"
                    style={{ color: allChecked ? '#059669' : someChecked ? '#D97706' : 'var(--muted)' }}
                    title={allChecked ? 'Deselect all' : 'Select all'}
                  >
                    {allChecked
                      ? <CheckSquare className="w-4 h-4" />
                      : someChecked
                        ? <CheckSquare className="w-4 h-4" style={{ opacity: 0.5 }} />
                        : <Square className="w-4 h-4" />
                    }
                  </button>
                </th>
              )}
              <th className="px-3 py-3 font-semibold text-left" style={{ color: 'var(--muted)', width: 48 }}></th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Investor</th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Firm</th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Email</th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Focus</th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Location</th>
              <th className="px-4 py-3 font-semibold text-left" style={{ color: 'var(--muted)' }}>Imported</th>
              <th className="px-4 py-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={isPending ? 9 : 8} className="text-center py-14" style={{ color: 'var(--muted)' }}>
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filteredData.length === 0 && (
              <tr>
                <td colSpan={isPending ? 9 : 8} className="text-center py-14" style={{ color: 'var(--muted)' }}>
                  {search ? 'No results match your search.' : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} entries.`}
                </td>
              </tr>
            )}
            {!loading && filteredData.map((entry, i) => {
              const isChecked = checkedIds.has(entry.id)
              return (
                <tr
                  key={entry.id}
                  style={{
                    background:   isChecked ? '#F0FDF4' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)',
                    borderBottom: '1px solid var(--line)',
                    transition:   'background 120ms',
                  }}
                >
                  {/* Checkbox */}
                  {isPending && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleOne(entry.id)}
                        style={{ color: isChecked ? '#059669' : 'var(--muted)', display: 'flex' }}
                      >
                        {isChecked
                          ? <CheckSquare className="w-4 h-4" />
                          : <Square className="w-4 h-4" />
                        }
                      </button>
                    </td>
                  )}

                  {/* Avatar */}
                  <td className="px-3 py-3">
                    {entry.photo_url ? (
                      <img
                        src={entry.photo_url} alt=""
                        className="w-8 h-8 rounded-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                        {(entry.first_name[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </td>

                  {/* Name + title */}
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: 'var(--ink)' }}>
                      {entry.first_name} {entry.last_name ?? ''}
                    </p>
                    {entry.title && (
                      <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--muted)' }}>{entry.title}</p>
                    )}
                  </td>

                  {/* Firm */}
                  <td className="px-4 py-3">
                    <p style={{ color: 'var(--ink)' }}>{entry.firm_name ?? '—'}</p>
                    {entry.firm_stages && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{entry.firm_stages.split(',').slice(0,2).join(', ')}</p>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    {entry.email ? (
                      <a href={`mailto:${entry.email}`}
                        className="flex items-center gap-1 text-xs hover:underline"
                        style={{ color: '#1A56DB' }}>
                        <Mail className="w-3 h-3" />{entry.email}
                      </a>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#94A3B8' }}>
                        No email
                      </span>
                    )}
                  </td>

                  {/* Focus */}
                  <td className="px-4 py-3 max-w-[140px]">
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {entry.firm_focus?.split(',').slice(0,2).join(', ') ?? '—'}
                    </p>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {[entry.location_city, entry.location_country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(entry.imported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => { setSelected(entry); setRejectNote('') }}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => act(entry, 'approved')}
                            disabled={working === entry.id + 'approved'}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: '#D1FAE5', color: '#059669' }}
                          >
                            {working === entry.id + 'approved'
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Check className="w-3 h-3" />
                            }
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelected(entry); setRejectNote('') }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}
                          >
                            <X className="w-3 h-3" />Reject
                          </button>
                        </>
                      )}

                      {activeTab === 'approved' && (
                        <button
                          onClick={() => act(entry, 'rejected', 'Reverted by admin')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}
                        >
                          <X className="w-3 h-3" />Revoke
                        </button>
                      )}

                      {activeTab === 'rejected' && (
                        <button
                          onClick={() => act(entry, 'approved')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: '#D1FAE5', color: '#059669' }}
                        >
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

      {/* Row count */}
      <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
        {filteredData.length} of {rows.length} entries
        {checkedCount > 0 && <span style={{ color: '#059669', fontWeight: 600 }}> · {checkedCount} selected</span>}
      </p>

      {/* ── Detail drawer ─────────────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end"
          style={{ background: 'rgba(15,23,42,0.45)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
              style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Profile Detail</h2>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt="" className="w-14 h-14 rounded-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
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

              {/* Status + claimed */}
              <div className="flex items-center gap-2">
                {(() => {
                  const tab = TABS.find(t => t.key === selected.status)
                  return (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: tab?.color, color: tab?.text }}>
                      {tab?.label}
                    </span>
                  )
                })()}
                {selected.claimed_by && (
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                    Claimed
                  </span>
                )}
              </div>

              {/* Fields */}
              {([
                ['Email',    selected.email],
                ['Firm',     selected.firm_name],
                ['Type',     selected.investor_type],
                ['Website',  selected.firm_website],
                ['Location', [selected.location_city, selected.location_country].filter(Boolean).join(', ')],
                ['Focus',    selected.firm_focus],
                ['Stages',   selected.firm_stages],
              ] as [string, string | null | undefined][]).map(([label, val]) => val ? (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
                  <p className="text-sm" style={{ color: 'var(--ink)' }}>{val}</p>
                </div>
              ) : null)}

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

              {/* Drawer actions */}
              {selected.status === 'pending_review' && (
                <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
                  <button
                    onClick={() => act(selected, 'approved')}
                    disabled={!!working}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: '#059669', color: '#fff' }}
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </button>

                  <div className="space-y-2">
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="Rejection reason (required)…"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm border resize-none outline-none"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
                    />
                    <button
                      onClick={() => act(selected, 'rejected', rejectNote)}
                      disabled={!rejectNote.trim() || !!working}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                      style={{ background: '#DC2626', color: '#fff' }}
                    >
                      <X className="w-4 h-4" />Reject
                    </button>
                  </div>
                </div>
              )}

              {selected.status === 'approved' && (
                <button
                  onClick={() => act(selected, 'rejected', 'Reverted by admin')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  <X className="w-4 h-4" />Revoke Approval
                </button>
              )}

              {selected.status === 'rejected' && (
                <button
                  onClick={() => act(selected, 'approved')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#059669', color: '#fff' }}
                >
                  <Check className="w-4 h-4" />Re-approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
