import { FileText, Sparkles, Trash2, Share2, EyeOff } from 'lucide-react'
import type { TermSheetTemplate } from '@/app/hooks/useTermSheets'

interface Props {
  template: TermSheetTemplate
  onUse: () => void
  onDelete?: () => void
  onShare?: () => void
  onUnshare?: () => void
}

const ROUND_LABELS: Record<string, string> = {
  equity: 'Equity',
  convertible_note: 'Conv. Note',
  safe: 'SAFE',
  other: 'Other',
}

const FUND_TYPE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  angel: { label: 'Angel', bg: 'var(--warn-bg)', color: 'var(--warn)' },
  vc: { label: 'VC / CCPS', bg: 'var(--blue-bg)', color: 'var(--blue)' },
  family_office: { label: 'Family Office', bg: 'var(--purple-bg, #f3e8ff)', color: 'var(--purple, #7c3aed)' },
  nbfc: { label: 'NBFC / Debt', bg: 'var(--surface-3)', color: 'var(--muted)' },
  cvc: { label: 'CVC', bg: 'var(--pos-bg)', color: 'var(--pos)' },
}

export function TemplateCard({ template, onUse, onDelete, onShare, onUnshare }: Props) {
  const isSystem = template.is_system

  return (
    <div
      className="flex flex-col transition-all"
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="px-4 pt-5 pb-4 sm:px-5 sm:pt-6 sm:pb-5 flex flex-col flex-1">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] flex items-center justify-center shrink-0"
            style={{
              background: isSystem ? 'var(--blue-bg)' : 'var(--surface-3)',
            }}
          >
            {isSystem
              ? <Sparkles className="w-[18px] h-[18px]" style={{ color: 'var(--blue)' }} />
              : <FileText className="w-[18px] h-[18px]" style={{ color: 'var(--muted)' }} />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {template.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
              >
                {ROUND_LABELS[template.round_type] ?? template.round_type}
              </span>
              {template.fund_type && FUND_TYPE_LABELS[template.fund_type] && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: FUND_TYPE_LABELS[template.fund_type].bg,
                    color: FUND_TYPE_LABELS[template.fund_type].color,
                  }}
                >
                  {FUND_TYPE_LABELS[template.fund_type].label}
                </span>
              )}
            </div>
          </div>
        </div>

        {template.description && (
          <p className="text-[12px] leading-[1.5] mb-3 line-clamp-2" style={{ color: 'var(--muted)' }}>
            {template.description}
          </p>
        )}

        {/* Shared indicator */}
        {template.is_shared && (
          <div
            className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-[10px]"
            style={{ background: 'var(--pos-bg)' }}
          >
            <Share2 className="w-3 h-3" style={{ color: 'var(--pos)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--pos)' }}>
              Shared to marketplace
              {template.usage_count > 0 && ` \u00b7 ${template.usage_count} clone${template.usage_count === 1 ? '' : 's'}`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
          <button
            onClick={onUse}
            className="flex-1 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            Use Template
          </button>
          {onShare && (
            <button
              onClick={onShare}
              title="Share to marketplace"
              className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
              style={{ background: 'var(--surface-3)' }}
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
            </button>
          )}
          {onUnshare && (
            <button
              onClick={onUnshare}
              title="Remove from marketplace"
              className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
              style={{ background: 'var(--surface-3)' }}
            >
              <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--warn)' }} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
              style={{ background: 'var(--surface-3)' }}
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
