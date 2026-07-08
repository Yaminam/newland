import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string
  error?: string
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  ...props
}: SelectProps) {
  

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--muted)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full h-10 px-3 py-2 appearance-none border border-[var(--line)] rounded-md text-[var(--ink)] bg-[var(--surface)] focus:outline-0 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--shadow-glow-blue)] transition-all duration-120 ${
            error ? 'border-[var(--neg)]' : ''
          } ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--muted-2)]" />
      </div>
      {error && <p className="text-xs text-[var(--neg)] mt-1">{error}</p>}
    </div>
  )
}
