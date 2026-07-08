'use client'

import React from 'react'
import * as RadixTabs from '@radix-ui/react-tabs'
import { cn } from '@/app/lib/utils'

interface Tab {
  value: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ tabs, value, onValueChange, children, className }: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      {/* Desktop: underline style */}
      <RadixTabs.List
        className={cn(
          'hidden md:flex items-center gap-1',
          'border-b border-[var(--line)]',
        )}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              'text-[var(--muted)] hover:text-[var(--ink)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
              'cursor-pointer rounded-t-[var(--r-sm)]',
              'data-[state=active]:text-[var(--blue)]',
            )}
          >
            {tab.label}
            {/* Active indicator line */}
            <span
              className={cn(
                'absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-colors',
                'bg-transparent',
              )}
              style={{
                background: value === tab.value ? 'var(--blue)' : 'transparent',
              }}
            />
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {/* Mobile: segmented pill style */}
      <RadixTabs.List
        className={cn(
          'flex md:hidden items-center gap-1 p-1',
          'rounded-[var(--r-lg)] bg-[var(--bg-soft)]',
        )}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex-1 px-3 py-2 text-sm font-medium transition-all duration-150',
              'rounded-[var(--r-md)] text-center',
              'text-[var(--muted)] hover:text-[var(--ink)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
              'cursor-pointer',
              'data-[state=active]:bg-[var(--blue)] data-[state=active]:text-white data-[state=active]:shadow-[var(--sh-2)]',
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {children}
    </RadixTabs.Root>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <RadixTabs.Content
      value={value}
      className={cn('mt-4 focus-visible:outline-0', className)}
    >
      {children}
    </RadixTabs.Content>
  )
}
