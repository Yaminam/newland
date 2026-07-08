import {
  MessageSquare, Phone, Mail, FileText, ArrowRight,
  CheckCircle, XCircle, Clock, Send,
} from 'lucide-react'
import type { CRMInteraction } from '@/app/hooks/useCRM'

const INTERACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  meeting:         { icon: MessageSquare, color: 'var(--blue)' },
  call:            { icon: Phone,         color: 'var(--pos)' },
  email:           { icon: Mail,          color: 'var(--blue)' },
  note:            { icon: FileText,      color: 'var(--muted)' },
  follow_up:       { icon: ArrowRight,    color: 'var(--warn)' },
  intro_sent:      { icon: Send,          color: 'var(--blue)' },
  intro_accepted:  { icon: CheckCircle,   color: 'var(--pos)' },
  intro_declined:  { icon: XCircle,       color: 'var(--neg)' },
  deck_requested:  { icon: FileText,      color: 'var(--warn)' },
  deck_approved:   { icon: CheckCircle,   color: 'var(--pos)' },
  deck_declined:   { icon: XCircle,       color: 'var(--neg)' },
  auto:            { icon: Clock,         color: 'var(--muted)' },
}

interface CRMInteractionTimelineProps {
  interactions: CRMInteraction[]
}

export function CRMInteractionTimeline({ interactions }: CRMInteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
          No interactions yet
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-4 top-2 bottom-2 w-px"
        style={{ background: 'var(--line)' }}
      />

      <div className="space-y-0">
        {interactions.map((interaction, idx) => {
          const config = INTERACTION_ICONS[interaction.type] ?? INTERACTION_ICONS.auto
          const Icon = config.icon
          const isLast = idx === interactions.length - 1

          return (
            <div key={interaction.id} className="relative flex gap-3 pb-4">
              {/* Icon dot */}
              <div
                className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                    {interaction.title}
                  </p>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--muted-2)' }}>
                    {new Date(interaction.occurred_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {interaction.body && (
                  <p className="text-[12px] mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                    {interaction.body}
                  </p>
                )}
                <span
                  className="inline-block text-[10px] font-medium uppercase tracking-wide mt-1 px-1.5 py-0.5 rounded"
                  style={{
                    background: `color-mix(in srgb, ${config.color} 8%, transparent)`,
                    color: config.color,
                  }}
                >
                  {interaction.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
