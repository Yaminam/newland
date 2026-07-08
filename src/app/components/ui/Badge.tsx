import { cn } from '@/app/lib/utils'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'angel'
  | 'vc'
  | 'bank'
  | 'nbfc'
  | 'family-office'
  | 'cvc'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  /** Optional dot indicator before text */
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default:         'bg-[var(--surface-2)] text-[var(--muted)]',
  success:         'bg-[var(--pos-bg)] text-[var(--pos)]',
  warning:         'bg-[var(--warn-bg)] text-[var(--warn)]',
  danger:          'bg-[var(--neg-bg)] text-[var(--neg)]',
  info:            'bg-[var(--blue-bg)] text-[var(--blue)]',
  neutral:         'bg-[var(--surface-3)] text-[var(--muted-2)]',
  angel:           'bg-[rgba(37,99,235,0.10)]  text-[var(--t-angel)]',
  vc:              'bg-[rgba(99,102,241,0.10)] text-[var(--t-vc)]',
  bank:            'bg-[rgba(8,145,178,0.10)]  text-[var(--t-bank)]',
  nbfc:            'bg-[rgba(13,148,136,0.10)] text-[var(--t-nbfc)]',
  'family-office': 'bg-[rgba(5,150,105,0.10)]  text-[var(--t-fo)]',
  cvc:             'bg-[rgba(217,119,6,0.10)]  text-[var(--t-cvc)]',
}

/** Map common status strings to badge variants */
export function statusBadgeVariant(
  status: string | null | undefined,
): BadgeVariant {
  const s = (status ?? '').toLowerCase().replace(/[\s_]+/g, '-')
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    'under-review': 'warning',
    submitted: 'warning',
    exploring: 'info',
    open: 'success',
    active: 'success',
    accepted: 'success',
    approved: 'success',
    completed: 'success',
    verified: 'success',
    declined: 'danger',
    rejected: 'danger',
    failed: 'danger',
    closing: 'warning',
    ipo: 'warning',
    expired: 'neutral',
    exited: 'info',
    'written-off': 'danger',
    closed: 'neutral',
    draft: 'neutral',
    cancelled: 'neutral',
  }
  return map[s] ?? 'default'
}

/** Map investor_type DB values to badge variants */
export function investorTypeBadgeVariant(
  type: string | null | undefined,
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    angel: 'angel',
    'venture-capital': 'vc',
    bank: 'bank',
    nbfc: 'nbfc',
    'family-office': 'family-office',
    'corporate-venture': 'cvc',
  }
  return map[type ?? ''] ?? 'neutral'
}

export function Badge({
  variant = 'default',
  children,
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-4 tracking-wide uppercase whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
    >
      {dot ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      ) : null}
      {children}
    </span>
  )
}
