import { useAuth } from '@/app/context/AuthContext'

interface Props {
  children?: React.ReactNode
  visible?: boolean
}

/**
 * Overlay that adds diagonal watermark text over deal room document previews.
 * Shows user's name, email, and access timestamp to deter unauthorized sharing.
 *
 * Can be used two ways:
 * 1. As a wrapper: <WatermarkOverlay>{children}</WatermarkOverlay>
 * 2. As a standalone overlay: <WatermarkOverlay /> (place inside a relative container)
 */
export function WatermarkOverlay({ children, visible = true }: Props) {
  const { user, profile } = useAuth()

  if (!visible || !user) return children ? <>{children}</> : null

  const displayName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : null
  const watermarkText = [
    displayName || user.email || 'Confidential',
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  ].join(' · ')

  const overlay = (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '20px',
          padding: '20px',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center center',
          width: '140%',
          height: '140%',
          left: '-20%',
          top: '-20%',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-center"
            style={{
              color: 'rgba(0, 0, 0, 0.06)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  )

  // Standalone mode: just render the overlay
  if (!children) return overlay

  // Wrapper mode: wrap children with relative container
  return (
    <div className="relative">
      {children}
      {overlay}
    </div>
  )
}
