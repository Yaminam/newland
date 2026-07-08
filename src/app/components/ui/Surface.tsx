'use client'

import React from 'react'
import { cn } from '../../lib/utils'

type SurfaceVariant = 'flat' | 'raised' | 'inset'

interface SurfaceProps {
  variant?: SurfaceVariant
  loading?: boolean
  className?: string
  children?: React.ReactNode
  as?: React.ElementType
}

const variantStyles: Record<SurfaceVariant, string> = {
  flat: 'bg-[var(--surface)] border border-[var(--line)]',
  raised: 'bg-[var(--surface)] shadow-[var(--sh-2)]',
  inset: 'bg-[var(--bg-soft)]',
}

export function Surface({
  variant = 'flat',
  loading = false,
  className,
  children,
  as: Component = 'div',
}: SurfaceProps) {
  return (
    <Component
      className={cn(
        'rounded-[var(--r-lg)] relative overflow-hidden',
        variantStyles[variant],
        className,
      )}
    >
      {loading && (
        <div
          className="absolute inset-0 z-10"
          aria-busy="true"
          aria-label="Loading"
        >
          <div
            className="absolute inset-0 bg-[var(--surface)] opacity-80"
          />
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, var(--bg-soft) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
            .animate-shimmer {
              animation: shimmer 1.5s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
      {children}
    </Component>
  )
}
