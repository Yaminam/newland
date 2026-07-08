import { memo } from 'react'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { CRM_STAGES, type CRMContact } from '@/app/hooks/useCRM'

interface CRMContactCardProps {
  contact: CRMContact
  onClick: () => void
}

export const CRMContactCard = memo(function CRMContactCard({ contact, onClick }: CRMContactCardProps) {
  const initial = (contact.display_name ?? '?')[0].toUpperCase()
  const stageInfo = CRM_STAGES.find(s => s.key === contact.stage)

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all active:scale-[0.97]"
      style={{
        background: 'var(--surface)',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="px-3.5 py-3">
        {/* Header: avatar + name */}
        <div className="flex items-center gap-2.5">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.display_name}
              className="w-9 h-9 rounded-[10px] shrink-0 object-cover"
              style={{ border: '2px solid var(--line)' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-bold"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {contact.display_name}
            </p>
            {contact.firm_name && (
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>
                {contact.firm_name}
              </p>
            )}
          </div>
          <ChevronRight
            className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity"
            style={{ color: 'var(--muted-2)' }}
          />
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {contact.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-[6px]"
                style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
              >
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer — stage + date */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--line-2)' }}>
          {stageInfo && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${stageInfo.color}12`, color: stageInfo.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageInfo.color }} />
              {stageInfo.label}
            </span>
          )}
          {contact.source !== 'manual' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--muted-2)' }}>
              <Clock className="w-3 h-3" />
              {contact.source.replace('_', ' ')}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-medium ml-auto" style={{ color: 'var(--muted-2)' }}>
            <Calendar className="w-3 h-3" />
            {new Date(contact.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
})
