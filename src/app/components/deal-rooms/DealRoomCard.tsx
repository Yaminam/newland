import { memo } from 'react'
import { FolderLock, Users, FileText, Calendar, ChevronRight, Archive, Lock } from 'lucide-react'
import type { DealRoom } from '@/app/hooks/useDealRooms'

interface Props {
  room: DealRoom
  onClick: () => void
}

export const DealRoomCard = memo(function DealRoomCard({ room, onClick }: Props) {
  const docs = room.document_count ?? 0
  const memberCount = room.member_count ?? 0
  const isArchived = room.status === 'archived'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className="group relative cursor-pointer overflow-hidden card card-hover-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      style={{ borderRadius: 16 }}
    >
      {/* Accent strip — sweeps in on hover (active rooms only) */}
      {!isArchived && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
          style={{ background: 'linear-gradient(90deg, var(--blue), #60A5FA)' }}
        />
      )}

      <div className="px-4 pt-5 pb-4 sm:px-5 sm:pt-5 sm:pb-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={
              isArchived
                ? { background: 'var(--surface-3)' }
                : { background: 'linear-gradient(135deg, #2563EB, #60A5FA)', boxShadow: '0 6px 16px rgba(37,99,235,0.28)' }
            }
          >
            {isArchived ? (
              <Archive className="w-[18px] h-[18px]" style={{ color: 'var(--muted-2)' }} />
            ) : (
              <FolderLock className="w-[20px] h-[20px]" style={{ color: '#fff' }} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className="text-[14px] font-bold truncate"
                style={{ color: isArchived ? 'var(--muted)' : 'var(--ink)', letterSpacing: '-0.01em' }}
              >
                {room.name}
              </p>
              {room.has_pin && !isArchived && (
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'var(--warn-bg, #FFFBEB)', color: 'var(--warn, #D97706)' }}
                >
                  <Lock className="w-2.5 h-2.5" />
                  PIN
                </span>
              )}
            </div>
            {room.startup?.company_name && (
              <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted-2)' }}>
                {room.startup.company_name}
              </p>
            )}
          </div>

          {isArchived ? (
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
              style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
            >
              Archived
            </span>
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
              style={{ background: 'var(--blue-bg)' }}
            >
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-[12px] leading-[1.5] mt-3 line-clamp-2" style={{ color: 'var(--muted)' }}>
            {room.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
          >
            <FileText className="w-3 h-3" />
            {docs} doc{docs === 1 ? '' : 's'}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg"
            style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
          >
            <Users className="w-3 h-3" />
            {memberCount} member{memberCount === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium ml-auto" style={{ color: 'var(--muted-2)' }}>
            <Calendar className="w-3 h-3" />
            {new Date(room.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
    </div>
  )
})
