'use client'

import React, { useId } from 'react'
import { cn } from '../../lib/utils'

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hint?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    { label, hint, error, prefix, suffix, className, id, disabled, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--ink)] leading-none"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            'flex items-center h-[42px] rounded-[var(--r-md)] border bg-[var(--surface)] transition-colors duration-100',
            'focus-within:border-[var(--blue)] focus-within:shadow-[0_0_0_3px_var(--blue-bg)]',
            error
              ? 'border-[var(--neg)] focus-within:border-[var(--neg)] focus-within:shadow-[0_0_0_3px_var(--neg-bg)]'
              : 'border-[var(--line)]',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          {prefix && (
            <span className="flex items-center pl-3 text-[var(--muted)] shrink-0">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'flex-1 h-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)]',
              'outline-0 disabled:cursor-not-allowed',
              'font-[var(--font-body)]',
              prefix ? 'pl-2' : 'pl-3',
              suffix ? 'pr-2' : 'pr-3',
            )}
            {...props}
          />

          {suffix && (
            <span className="flex items-center pr-3 text-[var(--muted)] shrink-0">
              {suffix}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--muted)] leading-normal">
            {hint}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[var(--neg)] leading-normal"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)

TextField.displayName = 'TextField'
