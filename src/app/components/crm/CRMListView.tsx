import { DataTable } from '@/app/components/ui/DataTable'
import { CRM_STAGES, type CRMContact } from '@/app/hooks/useCRM'

const STAGE_MAP = Object.fromEntries(CRM_STAGES.map(s => [s.key, s]))

interface CRMListViewProps {
  contacts: CRMContact[]
  onRowClick: (contact: CRMContact) => void
  isLoading: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export function CRMListView({ contacts, onRowClick, isLoading, selectedIds, onToggleSelect }: CRMListViewProps) {
  const columns = [
    ...(onToggleSelect ? [{
      key: '_select',
      header: '',
      width: '40px',
      render: (_: any, row: CRMContact) => (
        <input
          type="checkbox"
          checked={selectedIds?.has(row.id) ?? false}
          onChange={e => { e.stopPropagation(); onToggleSelect(row.id) }}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded cursor-pointer accent-[var(--blue)]"
        />
      ),
    }] : []),
    {
      key: 'display_name',
      header: 'Name',
      sortable: true,
      render: (_: any, row: CRMContact) => {
        const initial = (row.display_name ?? '?')[0].toUpperCase()
        return (
          <div className="flex items-center gap-2.5">
            {row.avatar_url ? (
              <img
                src={row.avatar_url}
                alt={row.display_name}
                className="w-8 h-8 rounded-[8px] shrink-0 object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-[12px] font-bold"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {row.display_name}
              </p>
              {row.firm_name && (
                <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                  {row.firm_name}
                </p>
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
      width: '130px',
      render: (_: any, row: CRMContact) => {
        const info = STAGE_MAP[row.stage]
        return info ? (
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full"
            style={{ background: `${info.color}12`, color: info.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: info.color }} />
            {info.label}
          </span>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{row.stage}</span>
        )
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (_: any, row: CRMContact) => (
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          {row.email ?? '\u2014'}
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (_: any, row: CRMContact) =>
        row.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {row.tags.slice(0, 2).map(t => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
              >
                {t}
              </span>
            ))}
            {row.tags.length > 2 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
              >
                +{row.tags.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>{'\u2014'}</span>
        ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      width: '110px',
      render: (_: any, row: CRMContact) => (
        <span className="text-[12px] capitalize" style={{ color: 'var(--muted)' }}>
          {row.source.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '100px',
      render: (_: any, row: CRMContact) => (
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          {new Date(row.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
  ]

  const tableData = contacts.map(c => ({
    ...c,
    stage: STAGE_MAP[c.stage]?.label ?? c.stage,
  }))

  return (
    <DataTable
      columns={columns}
      data={tableData}
      searchable
      searchPlaceholder="Search investors\u2026"
      pagination
      pageSize={20}
      onRowClick={(row) => onRowClick(row as CRMContact)}
      emptyMessage="No investors tracked yet"
      loading={isLoading}
    />
  )
}
