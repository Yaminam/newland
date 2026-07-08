import { Upload, UserPlus, UserMinus, Eye, Download, Trash2, FolderPlus } from 'lucide-react'
import type { DealRoomActivity } from '@/app/hooks/useDealRooms'

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  room_created:        { icon: FolderPlus, color: '#3B82F6', label: 'Room created' },
  member_invited:      { icon: UserPlus,   color: '#059669', label: 'Member invited' },
  member_revoked:      { icon: UserMinus,  color: '#DC2626', label: 'Access revoked' },
  document_uploaded:   { icon: Upload,     color: '#3B82F6', label: 'Document uploaded' },
  document_viewed:     { icon: Eye,        color: '#94A3B8', label: 'Document viewed' },
  document_downloaded: { icon: Download,   color: '#D97706', label: 'Document downloaded' },
  document_deleted:    { icon: Trash2,     color: '#DC2626', label: 'Document deleted' },
}

interface Props {
  activity: DealRoomActivity[]
}

/** Dedupe key — same action on the same target collapses into one row. */
function groupKey(item: DealRoomActivity): string {
  const meta = item.metadata ?? {}
  return `${item.action}|${meta.file_name ?? meta.member_name ?? item.target_id ?? ''}|${item.user_id}`
}

export function ActivityLog({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No activity yet</p>
      </div>
    )
  }

  // Collapse consecutive identical events (activity is newest-first) into one
  // row with a count + the most recent timestamp.
  const groups: { item: DealRoomActivity; count: number }[] = []
  for (const item of activity) {
    const last = groups[groups.length - 1]
    if (last && groupKey(last.item) === groupKey(item)) last.count++
    else groups.push({ item, count: 1 })
  }

  return (
    <div className="flex flex-col max-h-[460px] overflow-y-auto pr-1">
      {groups.map((g, idx) => {
        const item = g.item
        const config = ACTION_CONFIG[item.action] ?? ACTION_CONFIG.room_created
        const Icon = config.icon
        const isLast = idx === groups.length - 1

        return (
          <div key={item.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: config.color + '15', border: `1px solid ${config.color}30` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              {!isLast && <div className="w-px flex-1 mt-1" style={{ background: 'var(--line)' }} />}
            </div>

            {/* Content */}
            <div className={`flex-1 min-w-0 ${isLast ? 'pb-1' : 'pb-3'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                    {getDescription(item, config.label)}
                  </p>
                  {g.count > 1 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: config.color + '15', color: config.color }}
                    >
                      ×{g.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px] shrink-0" style={{ color: 'var(--muted-2)' }}>
                  {formatTimeAgo(item.created_at)}
                </span>
              </div>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                {item.user?.full_name ?? 'Unknown user'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function getDescription(item: DealRoomActivity, fallback: string): string {
  const meta = item.metadata ?? {}
  switch (item.action) {
    case 'document_uploaded':
    case 'document_viewed':
    case 'document_downloaded':
    case 'document_deleted':
      return meta.file_name ? `${fallback}: ${meta.file_name}` : fallback
    case 'member_invited':
    case 'member_revoked':
      return meta.member_name ? `${fallback}: ${meta.member_name}` : fallback
    default:
      return fallback
  }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
