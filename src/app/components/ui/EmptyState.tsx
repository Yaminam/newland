import { cn } from '@/app/lib/utils'
import { FounderCentralMark } from '../FounderCentralMark'
import { Button } from './Button'

interface EmptyStateProps {
  /** Custom icon node. Falls back to FounderCentralMark if omitted. */
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className,
      )}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{
          background: 'var(--surface-3)',
          border: '1px solid var(--line)',
        }}
      >
        {icon ?? <FounderCentralMark size={28} />}
      </div>
      <h3
        className="text-[15px] font-semibold mb-1.5"
        style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] max-w-[320px] leading-relaxed"
        style={{ color: 'var(--muted)' }}
      >
        {description}
      </p>
      {action ? (
        <Button
          variant="primary"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
