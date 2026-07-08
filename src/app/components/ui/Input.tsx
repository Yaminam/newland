import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--muted)] mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-10 px-3 border border-[var(--line)] rounded-md text-[var(--ink)] placeholder-[var(--muted-2)] focus:outline-0 focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--shadow-glow-blue)] transition-all duration-120 ${
          error ? 'border-[var(--neg)] focus:border-[var(--neg)]' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[var(--neg)] mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-[var(--muted-2)] mt-1">{helperText}</p>
      )}
    </div>
  )
}
