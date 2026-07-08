'use client'

import React, { useId } from 'react'
import { cn } from '../../lib/utils'

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  rows?: number
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { label, hint, error, rows = 4, className, id, disabled, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId
    const hintId = hint ? `${textareaId}-hint` : undefined
    const errorId = error ? `${textareaId}-error` : undefined
    const describedBy =
      [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[var(--ink)] leading-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-[var(--r-md)] border bg-[var(--surface)] px-3 py-2.5',
            'text-sm text-[var(--ink)] placeholder:text-[var(--muted-2)]',
            'font-[var(--font-body)] leading-relaxed',
            'outline-0 transition-colors duration-100 resize-y',
            'focus:border-[var(--blue)] focus:shadow-[0_0_0_3px_var(--blue-bg)]',
            error
              ? 'border-[var(--neg)] focus:border-[var(--neg)] focus:shadow-[0_0_0_3px_var(--neg-bg)]'
              : 'border-[var(--line)]',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          {...props}
        />

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

TextArea.displayName = 'TextArea'
