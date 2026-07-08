import { Bell, X, CheckCheck, ArrowRightLeft, DollarSign, Clock, AlertTriangle } from 'lucide-react'
import type { PipelineAlert } from '@/app/hooks/usePipeline'

interface Props {
  alerts: PipelineAlert[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onDismiss: (id: string) => void
}

const ALERT_ICONS: Record<string, typeof Bell> = {
  stage_change: ArrowRightLeft,
  amount_change: DollarSign,
  stale_deal: Clock,
  metric_change: AlertTriangle,
}

const ALERT_COLORS: Record<string, string> = {
  stage_change: 'var(--blue)',
  amount_change: 'var(--pos)',
  stale_deal: 'var(--warn)',
  metric_change: 'var(--blue)',
}

export function AlertsPanel({ alerts, onMarkRead, onMarkAllRead, onDismiss }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="py-8 text-center">
        <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
        <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No alerts yet</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>
          Alerts appear when deals change stages or amounts update.
        </p>
      </div>
    )
  }

  const unread = alerts.filter(a => !a.is_read)

  return (
    <div className="flex flex-col gap-2">
      {unread.length > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            {unread.length} unread
          </span>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-medium cursor-pointer"
            style={{ color: 'var(--blue)' }}
          >
            <CheckCheck className="w-3 h-3" /> Mark all read
          </button>
        </div>
      )}

      {alerts.map(alert => {
        const Icon = ALERT_ICONS[alert.alert_type] ?? Bell
        const color = ALERT_COLORS[alert.alert_type] ?? 'var(--blue)'
        const meta = alert.metadata ?? {}

        let detail = ''
        if (alert.alert_type === 'stage_change' && meta.old_stage_name && meta.new_stage_name) {
          detail = `${meta.old_stage_name} → ${meta.new_stage_name}`
        } else if (alert.alert_type === 'amount_change') {
          const fmt = (n: number) => n ? `$${(n / 1000).toFixed(0)}k` : '$0'
          detail = `${fmt(meta.old_amount ?? 0)} → ${fmt(meta.new_amount ?? 0)}`
        }

        return (
          <div
            key={alert.id}
            className="flex items-start gap-2.5 p-2.5 rounded-[var(--r-md)] transition-colors"
            style={{
              background: alert.is_read ? 'transparent' : 'var(--blue-bg)',
              border: `1px solid ${alert.is_read ? 'var(--line)' : 'rgba(37,99,235,0.15)'}`,
            }}
            onClick={() => !alert.is_read && onMarkRead(alert.id)}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: color + '15' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                {alert.message}
              </p>
              {detail && (
                <p className="text-[11px] font-semibold mt-0.5" style={{ color }}>
                  {detail}
                </p>
              )}
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted-2)' }}>
                {new Date(alert.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDismiss(alert.id) }}
              className="shrink-0 p-0.5 cursor-pointer"
              style={{ color: 'var(--muted-2)' }}
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
