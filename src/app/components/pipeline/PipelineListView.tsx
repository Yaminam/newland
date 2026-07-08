import { DataTable } from '@/app/components/ui/DataTable'
import { Badge } from '@/app/components/ui/Badge'
import type { PipelineDeal, PipelineStage } from '@/app/hooks/usePipeline'

const PRIORITY_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

interface PipelineListViewProps {
  deals: PipelineDeal[]
  stages: PipelineStage[]
  onRowClick: (deal: PipelineDeal) => void
  isLoading: boolean
}

export function PipelineListView({ deals, stages, onRowClick, isLoading }: PipelineListViewProps) {
  const stageMap = Object.fromEntries(stages.map(s => [s.id, s]))

  const columns = [
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (_: any, row: PipelineDeal) => {
        const name = row.startup?.company_name ?? 'Unknown'
        const initial = name[0]?.toUpperCase() ?? '?'
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[var(--r-sm)] flex items-center justify-center shrink-0 text-[12px] font-bold"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{name}</p>
              {row.startup?.sector && (
                <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>{row.startup.sector}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'stage',
      header: 'Stage',
      sortable: true,
      render: (_: any, row: PipelineDeal) => {
        const stage = row.stage_id ? stageMap[row.stage_id] : null
        return (
          <div className="flex items-center gap-1.5">
            {stage && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: stage.color }}
              />
            )}
            <span className="text-[13px]" style={{ color: 'var(--ink)' }}>
              {stage?.name ?? row.pipeline_stage ?? '—'}
            </span>
          </div>
        )
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      width: '100px',
      render: (_: any, row: PipelineDeal) => (
        <Badge variant={PRIORITY_VARIANTS[row.priority] ?? 'default'}>
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (_: any, row: PipelineDeal) =>
        row.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.tags.slice(0, 2).map(t => (
              <Badge key={t} variant="default" className="text-[10px]">{t}</Badge>
            ))}
            {row.tags.length > 2 && (
              <Badge variant="neutral" className="text-[10px]">+{row.tags.length - 2}</Badge>
            )}
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>—</span>
        ),
    },
    {
      key: 'next_action',
      header: 'Next Action',
      render: (_: any, row: PipelineDeal) => (
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          {row.next_action ?? '—'}
        </span>
      ),
    },
    {
      key: 'next_action_date',
      header: 'Due',
      sortable: true,
      width: '100px',
      render: (_: any, row: PipelineDeal) =>
        row.next_action_date ? (
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
            {new Date(row.next_action_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>—</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Added',
      sortable: true,
      width: '100px',
      render: (_: any, row: PipelineDeal) => (
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          {new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
  ]

  // Flatten for DataTable sorting: add the sortable text fields
  const tableData = deals.map(d => ({
    ...d,
    company: d.startup?.company_name ?? '',
    stage: d.stage_id ? stageMap[d.stage_id]?.name ?? '' : d.pipeline_stage ?? '',
  }))

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchable
      searchPlaceholder="Search deals…"
      pagination
      pageSize={20}
      onRowClick={(row) => onRowClick(row as PipelineDeal)}
      emptyMessage="No deals in your pipeline yet"
      loading={isLoading}
    />
  )
}
