'use client'

import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft } from 'lucide-react'
import { cn } from '@/app/lib/utils'

type DrawerSize = 'sm' | 'md' | 'lg' | 'full'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  size?: DrawerSize
  children: React.ReactNode
  footer?: React.ReactNode
  /** Show a back arrow button before the title. */
  showBack?: boolean
  /** Custom callback for the back button. Defaults to closing the drawer. */
  onBack?: () => void
}

const SIZE_MAP: Record<DrawerSize, string> = {
  sm:   '400px',
  md:   '560px',
  lg:   '720px',
  full: '100%',
}

export function Drawer({
  open,
  onOpenChange,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  showBack,
  onBack,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            {/* Overlay */}
            <RadixDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{
                  background: 'rgba(13, 27, 42, 0.4)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              />
            </RadixDialog.Overlay>

            {/* Panel */}
            <RadixDialog.Content asChild onOpenAutoFocus={e => e.preventDefault()}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, duration: 0.28 }}
                className={cn(
                  'fixed top-0 right-0 bottom-0 z-50',
                  'flex flex-col',
                  'bg-[var(--bg)] border-l border-[var(--line)]',
                  'shadow-[var(--sh-pop)]',
                  'focus-visible:outline-0',
                )}
                style={{
                  width: SIZE_MAP[size],
                  maxWidth: '100vw',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {showBack && (
                      <button
                        onClick={onBack ?? (() => onOpenChange(false))}
                        aria-label="Go back"
                        className={cn(
                          'shrink-0 w-8 h-8 rounded-full',
                          'flex items-center justify-center',
                          'transition-colors hover:bg-[var(--bg-soft)]',
                          'cursor-pointer',
                        )}
                        style={{ color: 'var(--muted)' }}
                      >
                        <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2} />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <RadixDialog.Title
                        className="text-lg font-semibold truncate leading-tight"
                        style={{
                          color: 'var(--ink)',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {title}
                      </RadixDialog.Title>
                      {subtitle && (
                        <RadixDialog.Description
                          className="text-sm mt-1 truncate"
                          style={{ color: 'var(--muted)' }}
                        >
                          {subtitle}
                        </RadixDialog.Description>
                      )}
                    </div>
                  </div>

                  <RadixDialog.Close asChild>
                    <button
                      aria-label="Close drawer"
                      className={cn(
                        'shrink-0 w-8 h-8 -mr-1 rounded-full',
                        'flex items-center justify-center',
                        'transition-colors hover:bg-[var(--bg-soft)]',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
                        'cursor-pointer',
                      )}
                      style={{ color: 'var(--muted)' }}
                    >
                      <X className="w-[18px] h-[18px]" strokeWidth={2} />
                    </button>
                  </RadixDialog.Close>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div
                    className="px-6 py-4 flex items-center justify-end gap-2.5 border-t border-[var(--line)]"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    {footer}
                  </div>
                )}
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  )
}
