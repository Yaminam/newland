'use client'

import React from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

type ChipVariant = 'default' | 'selected' | 'removable'

interface ChipProps {
  variant?: ChipVariant
  onRemove?: () => void
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<ChipVariant, string> = {
  default:
    'bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--muted)]',
  selected:
    'bg-[var(--blue)] border border-[var(--blue)] text-white',
  removable:
    'bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-2)]',
}

export function Chip({
  variant = 'default',
  onRemove,
  onClick,
  children,
  className,
}: ChipProps) {
  const isInteractive = !!onClick
  const resolvedVariant = onRemove ? 'removable' : variant

  const content = (
    <>
      <span className="truncate">{children}</span>
      {resolvedVariant === 'removable' && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label="Remove"
          className={cn(
            'inline-flex items-center justify-center rounded-full shrink-0',
            'h-4 w-4 ml-0.5 -mr-0.5',
            'text-current opacity-60 hover:opacity-100',
            'transition-opacity duration-100',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--blue)]',
          )}
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </>
  )

  const sharedClasses = cn(
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium leading-none',
    'transition-colors duration-100 max-w-full',
    variantStyles[resolvedVariant],
    isInteractive && [
      'cursor-pointer',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
      resolvedVariant === 'default' &&
        'hover:bg-[var(--surface-2)] hover:text-[var(--ink-2)]',
      resolvedVariant === 'selected' &&
        'hover:bg-[var(--blue-h)]',
    ],
    className,
  )

  if (isInteractive) {
    return (
      <button type="button" onClick={onClick} className={sharedClasses}>
        {content}
      </button>
    )
  }

  return (
    <span className={sharedClasses}>
      {content}
    </span>
  )
}
