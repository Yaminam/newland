import { memo } from 'react'
import { Calendar, GripVertical, DollarSign, ArrowRight, Clock } from 'lucide-react'
import type { PipelineDeal } from '@/app/hooks/usePipeline'
import { compactNumber } from '@/app/lib/utils'

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high:   { color: 'var(--neg)',  bg: 'var(--neg-bg)',  label: 'High' },
  medium: { color: 'var(--warn)', bg: 'var(--warn-bg)', label: 'Medium' },
  low:    { color: 'var(--pos)',  bg: 'var(--pos-bg)',  label: 'Low' },
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

interface PipelineCardProps {
  deal: PipelineDeal
  onClick: () => void
  isDragging?: boolean
}

export const PipelineCard = memo(function PipelineCard({ deal, onClick, isDragging }: PipelineCardProps) {
  const startup = deal.startup
  const founder = startup?.founder
  const founderInitial = (founder?.full_name ?? '?')[0].toUpperCase()
  const priority = PRIORITY_CONFIG[deal.priority] ?? PRIORITY_CONFIG.low
  const days = daysAgo(deal.updated_at || deal.created_at)
  const hasAmount = deal.amount_usd != null && deal.amount_usd > 0
  const hasFundingAsk = startup?.funding_ask_usd != null && startup.funding_ask_usd > 0

  return (
    <div
      onClick={onClick}
      className="group card card-hover-lift cursor-pointer"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        opacity: isDragging ? 0.92 : 1,
        boxShadow: isDragging ? 'var(--sh-3)' : 'var(--sh-1)',
      }}
    >
      <div className="p-3.5">
        {/* Top row: avatar + name + founder + priority */}
        <div className="flex items-center gap-2.5">
          <div className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab shrink-0">
            <GripVertical className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
          </div>
          {founder?.avatar_url ? (
            <img
              src={founder.avatar_url}
              alt=""
              className="w-9 h-9 rounded-[10px] object-cover shrink-0"
              style={{ border: '1px solid rgba(37,99,235,0.12)' }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-bold"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.12)' }}
            >
              {founderInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {startup?.company_name ?? 'Unknown'}
            </p>
            {founder?.full_name && (
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                {founder.full_name}
              </p>
            )}
          </div>
          {/* Priority pill */}
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-[6px] shrink-0"
            style={{ background: priority.bg, color: priority.color }}
          >
            {priority.label}
          </span>
        </div>

        {/* Tags */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5 ml-[46px]">
            {deal.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)', border: '1px solid var(--line)' }}
              >
                {tag}
              </span>
            ))}
            {deal.tags.length > 3 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted-2)', border: '1px dashed var(--line)' }}
              >
                +{deal.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: meta row */}
        <div
          className="flex items-center gap-2.5 mt-2.5 pt-2.5 ml-[46px]"
          style={{ borderTop: '1px solid var(--line-2)' }}
        >
          {/* Days in stage */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium"
            style={{ color: days > 30 ? 'var(--warn)' : 'var(--muted-2)' }}
          >
            <Clock className="w-3 h-3" />
            {days}d
          </span>

          {/* Next action date */}
          {deal.next_action_date && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
              <Calendar className="w-3 h-3" style={{ color: 'var(--muted-2)' }} />
              {new Date(deal.next_action_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}

          {/* Amount or funding ask */}
          {(hasAmount || hasFundingAsk) && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold ml-auto" style={{ color: 'var(--blue)', fontFamily: 'var(--font-num)' }}>
              <DollarSign className="w-3 h-3" />
              {compactNumber(hasAmount ? deal.amount_usd : startup?.funding_ask_usd)}
            </span>
          )}

          <ArrowRight
            className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: 'var(--muted-2)' }}
          />
        </div>
      </div>
    </div>
  )
})
