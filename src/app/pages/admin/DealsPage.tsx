import { useCallback, useEffect, useState } from 'react'
import { Layers, Search } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useTableRealtime } from '@/app/hooks/useTableRealtime'
import { PageHeader } from '@/app/components/ui/PageHeader'

interface DealRow {
  id: string
  investor_id: string
  startup_id: string
  pipeline_stage: string | null
  amount: string | null
  priority: string | null
  created_at: string
  startup?: { company_name: string } | null
  investor?: { first_name: string | null; last_name: string | null; email: string | null } | null
  checklist_count: number
}

const STAGES = ['all', 'sourced', 'screening', 'due_diligence', 'negotiation', 'closed', 'passed'] as const
type Stage = typeof STAGES[number]

export function AdminDealsPage() {
  const [rows, setRows] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<Stage>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deals')
      .select(`
        id, investor_id, startup_id, pipeline_stage, amount, priority, created_at,
        startup:startup_applications ( company_name ),
        investor:profiles!deals_investor_id_fkey ( first_name, last_name, email )
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (data) {
      // Count checklists per deal in a single query
      const dealIds = data.map((d: any) => d.id)
      const { data: checklists } = await supabase
        .from('dd_checklists')
        .select('deal_id')
        .in('deal_id', dealIds)

      const checklistMap = new Map<string, number>()
      for (const c of checklists ?? []) {
        checklistMap.set(c.deal_id, (checklistMap.get(c.deal_id) ?? 0) + 1)
      }

      setRows((data as any[]).map(d => ({
        ...d,
        checklist_count: checklistMap.get(d.id) ?? 0,
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])
  useTableRealtime(['deals', 'dd_checklists'], () => void load())

  const filtered = rows.filter(r => {
    if (stage !== 'all' && r.pipeline_stage !== stage) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const company = r.startup?.company_name?.toLowerCase() ?? ''
      const investor = [r.investor?.first_name, r.investor?.last_name].filter(Boolean).join(' ').toLowerCase()
      if (!company.includes(q) && !investor.includes(q)) return false
    }
    return true
  })

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <PageHeader
        title="Deals"
        subtitle={`${rows.length} total deals across all investors`}
        icon={<Layers className="w-5 h-5" />}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 rounded-xl p-1"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {STAGES.map(s => (
            <button key={s} type="button" onClick={() => setStage(s)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize"
              style={{
                background: stage === s ? 'var(--surface)' : 'transparent',
                color: stage === s ? 'var(--ink)' : 'var(--muted)',
                boxShadow: stage === s ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
              }}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-2)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or investor..."
            className="pl-9 pr-3 py-2 text-sm rounded-xl border w-64 focus:outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl p-6 text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          Loading deals…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-6 text-sm text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          No deals found.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <Th>Company</Th>
                <Th>Investor</Th>
                <Th>Stage</Th>
                <Th>Priority</Th>
                <Th>DD</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors"
                  style={{ borderBottom: '1px solid var(--line-2)' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ink)' }}>
                    {row.startup?.company_name ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                    {[row.investor?.first_name, row.investor?.last_name].filter(Boolean).join(' ') || row.investor?.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={row.pipeline_stage} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityDot priority={row.priority} />
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                    {row.checklist_count > 0 ? `${row.checklist_count} checklist${row.checklist_count > 1 ? 's' : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted-2)' }}>
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3"
      style={{ color: 'var(--muted-2)' }}>
      {children}
    </th>
  )
}

function StageBadge({ stage }: { stage: string | null }) {
  if (!stage) return <span style={{ color: 'var(--muted-2)' }}>—</span>
  const colors: Record<string, string> = {
    sourced: '#6366F1',
    screening: '#8B5CF6',
    due_diligence: '#D97706',
    negotiation: '#0891B2',
    closed: '#059669',
    passed: '#6B7280',
  }
  const color = colors[stage] ?? 'var(--muted)'
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-md capitalize"
      style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}>
      {stage.replace('_', ' ')}
    </span>
  )
}

function PriorityDot({ priority }: { priority: string | null }) {
  if (!priority) return <span style={{ color: 'var(--muted-2)' }}>—</span>
  const colors: Record<string, string> = { high: '#DC2626', medium: '#D97706', low: '#059669' }
  const color = colors[priority] ?? 'var(--muted)'
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium capitalize" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {priority}
    </span>
  )
}
