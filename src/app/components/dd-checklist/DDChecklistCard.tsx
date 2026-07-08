import { memo } from 'react'
import { ClipboardCheck, Calendar, ChevronRight } from 'lucide-react'
import { DDProgressBar } from './DDProgressBar'
import type { DDChecklist } from '@/app/hooks/useDDChecklists'

interface Props {
  checklist: DDChecklist
  onClick: () => void
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'var(--blue-bg)',   text: 'var(--blue)',    label: 'Active' },
  completed: { bg: 'var(--pos-bg)',    text: 'var(--pos)',     label: 'Completed' },
  archived:  { bg: 'var(--surface-3)', text: 'var(--muted-2)', label: 'Archived' },
}

export const DDChecklistCard = memo(function DDChecklistCard({ checklist, onClick }: Props) {
  const status = STATUS_STYLE[checklist.status] ?? STATUS_STYLE.active
  const total = checklist.total_items ?? 0
  const completed = checklist.completed_items ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isDone = checklist.status === 'completed'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className="group relative cursor-pointer overflow-hidden card card-hover-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      style={{ borderRadius: 16 }}
    >
      {/* Progress strip at top */}
      <div className="h-[3px] w-full" style={{ background: 'var(--line-2)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct === 100 ? 'var(--pos)' : 'linear-gradient(90deg, var(--blue), #60A5FA)' }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={
              isDone
                ? { background: 'linear-gradient(135deg, #16A34A, #22C55E)', boxShadow: '0 6px 16px rgba(22,163,74,0.28)' }
                : { background: 'linear-gradient(135deg, #2563EB, #60A5FA)', boxShadow: '0 6px 16px rgba(37,99,235,0.28)' }
            }
          >
            <ClipboardCheck className="w-5 h-5" style={{ color: '#fff' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {checklist.name}
            </p>
            {checklist.startup?.company_name && (
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted-2)' }}>
                {checklist.startup.company_name}
              </p>
            )}
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-[6px] shrink-0"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>Progress</span>
            <span
              className="text-[12px] font-bold tabular-nums"
              style={{ color: pct === 100 ? 'var(--pos)' : 'var(--blue)', fontFamily: 'var(--font-num)' }}
            >
              {pct}%
            </span>
          </div>
          <DDProgressBar completed={completed} total={total} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-3.5 pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <span
            className="text-[11px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
          >
            {completed}/{total} items
          </span>
          {checklist.deal?.pipeline_stage && (
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-lg truncate max-w-[110px]"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              {checklist.deal.pipeline_stage}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium ml-auto" style={{ color: 'var(--muted-2)' }}>
            <Calendar className="w-3.5 h-3.5" />
            {new Date(checklist.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
            style={{ background: 'var(--blue-bg)' }}
          >
            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
          </div>
        </div>
      </div>
    </div>
  )
})
