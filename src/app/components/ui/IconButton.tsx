'use client'

import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '../../lib/utils'

type IconButtonVariant = 'ghost' | 'outline'
type IconButtonSize = 'sm' | 'md'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize
  icon: React.ElementType
  tooltip: string
  variant?: IconButtonVariant
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-9 w-9', icon: 18 },
  md: { button: 'h-10 w-10', icon: 20 },
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost:
    'bg-transparent text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]',
  outline:
    'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] hover:border-[var(--line-2)]',
}

export function IconButton({
  size = 'md',
  icon: Icon,
  tooltip,
  variant = 'ghost',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const { button, icon: iconSize } = sizeStyles[size]

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={tooltip}
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-center rounded-[var(--r-sm)] transition-colors duration-100 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
              button,
              variantStyles[variant],
              className,
            )}
            {...props}
          >
            <Icon size={iconSize} strokeWidth={1.75} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className={cn(
              'z-50 rounded-[var(--r-sm)] bg-[var(--ink)] px-2.5 py-1.5',
              'text-xs font-medium text-white leading-none',
              'shadow-[var(--sh-pop)]',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
            )}
          >
            {tooltip}
            <Tooltip.Arrow className="fill-[var(--ink)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
