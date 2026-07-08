import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, SkipForward, Play } from 'lucide-react'
import {
  MILESTONE_STAGES,
  type DealRoomMilestone,
  type MilestoneStatus,
} from '@/app/hooks/useDealRooms'

interface Props {
  milestones: DealRoomMilestone[]
  roomId: string
  isOwner: boolean
  onUpdate: (milestoneId: string, roomId: string, updates: Partial<Pick<DealRoomMilestone, 'status' | 'notes'>>) => Promise<boolean>
}

const STATUS_CONFIG: Record<MilestoneStatus, { color: string; bg: string; label: string }> = {
  pending:     { color: 'var(--muted-2)', bg: 'var(--surface-2)', label: 'Pending' },
  in_progress: { color: 'var(--blue)',    bg: 'var(--blue-bg)',   label: 'In Progress' },
  completed:   { color: 'var(--pos)',     bg: 'var(--pos-bg)',    label: 'Completed' },
  skipped:     { color: 'var(--muted)',   bg: 'var(--surface-2)', label: 'Skipped' },
}

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
  skipped: 'pending',
}

export function MilestoneTracker({ milestones, roomId, isOwner, onUpdate }: Props) {
  const [updating, setUpdating] = useState<string | null>(null)

  const sorted = [...milestones].sort((a, b) => a.position - b.position)

  // Calculate progress
  const completedCount = sorted.filter(m => m.status === 'completed').length
  const totalCount = sorted.filter(m => m.status !== 'skipped').length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleCycle = async (m: DealRoomMilestone) => {
    if (!isOwner) return
    setUpdating(m.id)
    await onUpdate(m.id, roomId, { status: NEXT_STATUS[m.status] })
    setUpdating(null)
  }

  const handleSkip = async (m: DealRoomMilestone) => {
    if (!isOwner) return
    setUpdating(m.id)
    await onUpdate(m.id, roomId, { status: 'skipped' })
    setUpdating(null)
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No milestones available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
          Deal Progress
        </p>
        <span
          className="text-[12px] font-semibold"
          style={{ color: progressPct === 100 ? 'var(--pos)' : 'var(--ink)' }}
        >
          {progressPct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: progressPct === 100 ? 'var(--pos)' : 'var(--blue)',
          }}
        />
      </div>

      {/* Milestone steps */}
      <div className="flex flex-col">
        {sorted.map((m, idx) => {
          const stageInfo = MILESTONE_STAGES.find(s => s.value === m.stage)
          const config = STATUS_CONFIG[m.status]
          const isLast = idx === sorted.length - 1
          const isUpdating = updating === m.id

          return (
            <div key={m.id} className="flex gap-3">
              {/* Timeline node */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleCycle(m)}
                  disabled={!isOwner || isUpdating}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: config.bg,
                    border: `2px solid ${config.color}`,
                    cursor: isOwner ? 'pointer' : 'default',
                    opacity: m.status === 'skipped' ? 0.5 : 1,
                  }}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: config.color }} />
                  ) : m.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: config.color }} />
                  ) : m.status === 'in_progress' ? (
                    <Play className="w-3.5 h-3.5" style={{ color: config.color }} />
                  ) : m.status === 'skipped' ? (
                    <SkipForward className="w-3.5 h-3.5" style={{ color: config.color }} />
                  ) : (
                    <Circle className="w-3.5 h-3.5" style={{ color: config.color }} />
                  )}
                </button>
                {!isLast && (
                  <div
                    className="w-0.5 flex-1 mt-1 min-h-[16px]"
                    style={{
                      background: m.status === 'completed' ? 'var(--pos)' : 'var(--line)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="text-[13px] font-semibold"
                    style={{
                      color: m.status === 'skipped' ? 'var(--muted)' : 'var(--ink)',
                      textDecoration: m.status === 'skipped' ? 'line-through' : 'none',
                    }}
                  >
                    {stageInfo?.label ?? m.stage}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: config.bg, color: config.color }}
                    >
                      {config.label}
                    </span>
                    {isOwner && m.status !== 'skipped' && m.status !== 'completed' && (
                      <button
                        onClick={() => handleSkip(m)}
                        disabled={isUpdating}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
                {m.completed_at && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    Completed {new Date(m.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isOwner && (
        <p className="text-[10px] text-center" style={{ color: 'var(--muted-2)' }}>
          Click a milestone to cycle its status
        </p>
      )}
    </div>
  )
}
