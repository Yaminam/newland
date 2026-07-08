import { ClipboardCheck, Check, X, XCircle, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import type { DDRequest, DDRequestStatus } from '@/app/hooks/useDDRequests'

interface Props {
  request: DDRequest
  viewMode: 'investor' | 'founder'
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onOpenChecklist?: (checklistId: string) => void
}

const STATUS_CONFIG: Record<DDRequestStatus, { label: string; bg: string; color: string; icon: typeof Clock }> = {
  pending:   { label: 'Pending',   bg: 'var(--warn-bg, #FEF3C7)', color: 'var(--warn, #D97706)', icon: Clock },
  accepted:  { label: 'Accepted',  bg: 'var(--pos-bg, #DCFCE7)',  color: 'var(--pos, #16A34A)',  icon: Check },
  rejected:  { label: 'Rejected',  bg: 'var(--neg-bg, #FEE2E2)',  color: 'var(--neg, #DC2626)',  icon: X },
  cancelled: { label: 'Cancelled', bg: 'var(--bg-soft, #F1F5F9)', color: 'var(--muted, #94A3B8)', icon: XCircle },
}

export function DDRequestCard({ request, viewMode, onAccept, onReject, onCancel, onOpenChecklist }: Props) {
  const sc = STATUS_CONFIG[request.status]
  const StatusIcon = sc.icon
  const isPending = request.status === 'pending'
  const isAccepted = request.status === 'accepted'

  const otherParty = viewMode === 'investor'
    ? request.founder
      ? `${request.founder.first_name} ${request.founder.last_name}`
      : 'Founder'
    : request.investor
      ? `${request.investor.first_name} ${request.investor.last_name}`
      : 'Investor'

  const timeAgo = (() => {
    const diff = Date.now() - new Date(request.created_at).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  })()

  return (
    <div
      className="rounded-[var(--r-lg)] p-4 flex flex-col gap-3 transition-colors"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--blue-bg)' }}
          >
            <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
              {request.name}
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
              {request.startup?.company_name ?? 'Unknown startup'}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0"
          style={{ background: sc.bg, color: sc.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {sc.label}
        </span>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--muted)' }}>
        <span>{viewMode === 'investor' ? 'To' : 'From'}: <span style={{ color: 'var(--ink)' }}>{otherParty}</span></span>
        {request.template && (
          <span>Template: <span style={{ color: 'var(--ink)' }}>{request.template.name}</span></span>
        )}
        <span className="ml-auto">{timeAgo}</span>
      </div>

      {/* Message */}
      {request.message && (
        <p className="text-[12px] leading-relaxed p-2.5 rounded-[var(--r-md)]" style={{ background: 'var(--bg-soft)', color: 'var(--muted-2)' }}>
          {request.message}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {/* Founder: accept/reject pending */}
        {viewMode === 'founder' && isPending && (
          <>
            <Button variant="primary" size="sm" iconLeft={Check} onClick={() => onAccept?.(request.id)}>
              Accept
            </Button>
            <Button variant="ghost" size="sm" iconLeft={X} onClick={() => onReject?.(request.id)}>
              Decline
            </Button>
          </>
        )}

        {/* Investor: cancel pending */}
        {viewMode === 'investor' && isPending && (
          <Button variant="ghost" size="sm" iconLeft={XCircle} onClick={() => onCancel?.(request.id)}>
            Cancel Request
          </Button>
        )}

        {/* Both: open checklist if accepted */}
        {isAccepted && request.checklist_id && (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={ArrowRight}
            onClick={() => onOpenChecklist?.(request.checklist_id!)}
          >
            Open Checklist
          </Button>
        )}
      </div>
    </div>
  )
}
