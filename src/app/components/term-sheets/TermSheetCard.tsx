import { memo } from 'react'
import { FileText, Calendar, Sparkles, PenTool, ChevronRight } from 'lucide-react'
import type { TermSheet } from '@/app/hooks/useTermSheets'

interface Props {
  sheet: TermSheet
  onClick: () => void
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  draft:    { bg: 'var(--warn-bg)',   text: 'var(--warn)',    label: 'Draft' },
  final:    { bg: 'var(--pos-bg)',    text: 'var(--pos)',     label: 'Final' },
  archived: { bg: 'var(--surface-3)', text: 'var(--muted-2)', label: 'Archived' },
}

const ROUND_LABELS: Record<string, string> = {
  equity: 'Equity',
  convertible_note: 'Conv. Note',
  safe: 'SAFE',
  other: 'Other',
}

const SIGNATURE_CONFIG: Record<string, { color: string; label: string }> = {
  fully_signed:     { color: 'var(--pos)',  label: 'Signed' },
  partially_signed: { color: 'var(--warn)', label: 'Partial' },
  pending:          { color: 'var(--blue)', label: 'Pending' },
}

export const TermSheetCard = memo(function TermSheetCard({ sheet, onClick }: Props) {
  const status = STATUS_STYLE[sheet.status] ?? STATUS_STYLE.draft
  const sigConfig = sheet.signature_status && sheet.signature_status !== 'unsigned'
    ? SIGNATURE_CONFIG[sheet.signature_status]
    : null

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all active:scale-[0.97]"
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--blue-bg)' }}
          >
            <FileText className="w-[18px] h-[18px]" style={{ color: 'var(--blue)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {sheet.name}
            </p>
            {sheet.startup?.company_name && (
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                {sheet.startup.company_name}
              </p>
            )}
          </div>
          {/* Status pill */}
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Meta pills row */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
          >
            {ROUND_LABELS[sheet.round_type] ?? sheet.round_type}
          </span>
          {sheet.investor?.full_name && (
            <span
              className="text-[11px] font-medium truncate max-w-[140px]"
              style={{ color: 'var(--muted)' }}
            >
              {sheet.investor.full_name}
            </span>
          )}
          {sheet.ai_generated && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              <Sparkles className="w-3 h-3" /> AI
            </span>
          )}
          {sigConfig && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${sigConfig.color}12`, color: sigConfig.color }}
            >
              <PenTool className="w-3 h-3" />
              {sigConfig.label}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium ml-auto" style={{ color: 'var(--muted-2)' }}>
            <Calendar className="w-3 h-3" />
            {new Date(sheet.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          <ChevronRight
            className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
            style={{ color: 'var(--muted-2)' }}
          />
        </div>
      </div>
    </div>
  )
})
