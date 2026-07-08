import { ClipboardList, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { DD_CATEGORIES, type DDTemplate } from '@/app/hooks/useDDChecklists'

interface Props {
  template: DDTemplate
  onUse: () => void
  onDelete?: () => void
}

export function DDTemplateCard({ template, onUse, onDelete }: Props) {
  const items = template.items ?? []
  const categoryCount = new Map<string, number>()
  for (const item of items) {
    categoryCount.set(item.category, (categoryCount.get(item.category) ?? 0) + 1)
  }
  const isSystem = template.is_system

  return (
    <div
      className="card-hover-lift"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        boxShadow: 'var(--sh-1)',
        overflow: 'hidden',
      }}
    >
      {/* Accent strip */}
      <div
        className="h-[3px] w-full"
        style={{ background: isSystem ? 'var(--blue)' : 'var(--line)' }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{
              background: isSystem ? 'var(--blue-bg)' : 'var(--surface-3)',
              border: `1px solid ${isSystem ? 'rgba(37,99,235,0.12)' : 'var(--line)'}`,
            }}
          >
            {isSystem
              ? <Sparkles className="w-[18px] h-[18px]" style={{ color: 'var(--blue)' }} />
              : <ClipboardList className="w-[18px] h-[18px]" style={{ color: 'var(--muted)' }} />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {template.name}
            </p>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {template.description && (
          <p className="text-[12px] leading-[1.5] mb-3 line-clamp-2" style={{ color: 'var(--muted)' }}>
            {template.description}
          </p>
        )}

        {/* Category breakdown */}
        {categoryCount.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from(categoryCount.entries()).map(([cat, count]) => {
              const c = DD_CATEGORIES.find(cc => cc.value === cat)
              return (
                <span
                  key={cat}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] inline-flex items-center gap-1"
                  style={{
                    background: `${c?.color ?? 'var(--muted)'}12`,
                    color: c?.color ?? 'var(--muted)',
                    border: `1px solid ${c?.color ?? 'var(--muted)'}25`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c?.color ?? 'var(--muted)' }} />
                  {c?.label ?? cat} ({count})
                </span>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center gap-2 pt-3"
          style={{ borderTop: '1px solid var(--line-2)' }}
        >
          <Button variant="primary" size="sm" onClick={onUse} className="flex-1">
            Use Template
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
