import React from 'react'

interface FilterPillProps {
  label: string
  isSelected?: boolean
  onClick?: () => void
  className?: string
}

export function FilterPill({
  label,
  isSelected = false,
  onClick,
  className = '',
}: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-120 ease-out ${
        isSelected
          ? 'bg-[var(--blue)] border-[var(--blue)] text-white'
          : 'border border-[var(--line)] bg-transparent text-[var(--muted)] hover:bg-[var(--surface-2)]'
      } ${className}`}
    >
      {label}
    </button>
  )
}
