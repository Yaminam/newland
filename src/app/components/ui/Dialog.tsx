'use client'

import React from 'react'
import * as RadixDialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/app/lib/utils'

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  size?: DialogSize
  children: React.ReactNode
  footer?: React.ReactNode
}

const SIZE_MAP: Record<DialogSize, string> = {
  sm:   '400px',
  md:   '540px',
  lg:   '680px',
  xl:   '880px',
  full: '100%',
}

export function Dialog({
  open,
  onOpenChange,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
}: DialogProps) {
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
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50"
                style={{
                  background: 'rgba(13, 27, 42, 0.45)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              />
            </RadixDialog.Overlay>

            {/* Content wrapper for centering */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <RadixDialog.Content asChild onOpenAutoFocus={e => e.preventDefault()}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className={cn(
                    'w-full pointer-events-auto flex flex-col',
                    'rounded-[var(--r-2xl)] overflow-hidden',
                    'bg-[var(--bg)] border border-[var(--line)]',
                    'shadow-[var(--sh-pop)]',
                    'focus-visible:outline-0',
                  )}
                  style={{
                    maxWidth: SIZE_MAP[size],
                    maxHeight: '90vh',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
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
                          className="text-sm mt-1.5"
                          style={{ color: 'var(--muted)' }}
                        >
                          {subtitle}
                        </RadixDialog.Description>
                      )}
                    </div>

                    <RadixDialog.Close asChild>
                      <button
                        aria-label="Close dialog"
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
                  <div className="px-6 pb-6 overflow-y-auto flex-1">
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
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  )
}
