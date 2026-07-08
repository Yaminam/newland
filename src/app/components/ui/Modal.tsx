import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  /** Max width. Defaults to "lg" = 32rem / 512px. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Optional footer node — renders pinned to the bottom. */
  footer?: React.ReactNode
  /** Hide the X close button in the top-right. */
  hideClose?: boolean
}

const SIZE_MAP: Record<NonNullable<ModalProps['size']>, string> = {
  sm:   '24rem',
  md:   '28rem',
  lg:   '32rem',
  xl:   '40rem',
  full: '100%',
}

/**
 * Shared modal primitive. Frosted backdrop + glass panel + keyboard-escape.
 * Replaces the ad-hoc modal JSX scattered across Portfolio / MyListing / etc.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  footer,
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{
              background: 'rgba(2, 6, 23, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title ?? 'Dialog'}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
              className="w-full pointer-events-auto flex flex-col rounded-3xl overflow-hidden"
              style={{
                maxWidth: SIZE_MAP[size],
                maxHeight: '90vh',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                boxShadow: 'var(--sh-pop)',
              }}
            >
              {/* Gradient accent bar */}
              <div style={{ height: 2, background: 'var(--gradient-duo)', opacity: 0.85 }} />

              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
                  <div className="min-w-0">
                    {title && (
                      <h2
                        className="text-[19px] font-semibold truncate leading-tight"
                        style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-tight)' }}
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-[13px] mt-1.5" style={{ color: 'var(--muted-2)' }}>
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {!hideClose && (
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      className="shrink-0 w-8 h-8 -mr-1 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.05]"
                      style={{ background: 'transparent', color: 'var(--muted-2)' }}
                    >
                      <X className="w-[18px] h-[18px]" strokeWidth={2} />
                    </button>
                  )}
                </div>
              )}

              <div className="px-7 pb-7 overflow-y-auto flex-1">
                {children}
              </div>

              {footer && (
                <div
                  className="px-7 py-4 flex items-center justify-end gap-2.5"
                  style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
