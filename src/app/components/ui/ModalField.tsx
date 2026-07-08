/**
 * Shared form field primitives for modals. Provides consistent input styling
 * across all popup forms with focus glow, proper sizing, and unified design.
 */

import type { ReactNode } from 'react'

/* ── Shared styles ──────────────────────────────────────────────────── */

const baseInputClasses =
  'w-full h-11 px-4 text-[13px] rounded-xl outline-none transition-all duration-200'

const baseInputStyle: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1.5px solid var(--line)',
  color: 'var(--ink)',
}

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--blue)'
    e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--blue) 12%, transparent)'
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--line)'
    e.target.style.boxShadow = 'none'
  },
}

/* ── Label ──────────────────────────────────────────────────────────── */

export function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label
      className="block text-[11px] font-bold uppercase tracking-wider mb-2"
      style={{ color: 'var(--muted-2)' }}
    >
      {children}
      {required && <span style={{ color: 'var(--neg)' }}> *</span>}
    </label>
  )
}

/* ── Text input ─────────────────────────────────────────────────────── */

interface InputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  autoFocus?: boolean
  icon?: React.ReactNode
  disabled?: boolean
}

export function ModalInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  autoFocus,
  icon,
  disabled,
}: InputProps) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div className="relative">
        {icon && (
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--muted-2)' }}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`${baseInputClasses} ${icon ? 'pl-10' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={baseInputStyle}
          {...focusHandlers}
        />
      </div>
    </div>
  )
}

/* ── Textarea ───────────────────────────────────────────────────────── */

interface TextareaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
}

export function ModalTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: TextareaProps) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 text-[13px] rounded-xl outline-none transition-all duration-200 resize-none"
        style={baseInputStyle}
        {...(focusHandlers as any)}
      />
    </div>
  )
}

/* ── Select ─────────────────────────────────────────────────────────── */

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  required?: boolean
  disabled?: boolean
}

export function ModalSelect({ label, value, onChange, children, required, disabled }: SelectProps) {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`${baseInputClasses} appearance-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          ...baseInputStyle,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%236b7280' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '2.5rem',
        }}
        {...(focusHandlers as any)}
      >
        {children}
      </select>
    </div>
  )
}

/* ── Pill selector (for round types, modes, etc.) ───────────────────── */

interface PillOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  color?: string
}

interface PillSelectorProps {
  label?: string
  options: PillOption[]
  value: string
  onChange: (value: string) => void
  variant?: 'pill' | 'card'
  columns?: number
}

export function PillSelector({ label, options, value, onChange, variant = 'pill', columns }: PillSelectorProps) {
  if (variant === 'card') {
    return (
      <div>
        {label && <FieldLabel>{label}</FieldLabel>}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : `repeat(auto-fit, minmax(140px, 1fr))` }}
        >
          {options.map(opt => {
            const active = value === opt.value
            const accentColor = opt.color ?? 'var(--blue)'
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all cursor-pointer active:scale-[0.97]"
                style={{
                  background: active ? `color-mix(in srgb, ${accentColor} 8%, transparent)` : 'var(--surface-2)',
                  border: `1.5px solid ${active ? accentColor : 'var(--line)'}`,
                }}
              >
                {opt.icon && (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)` }}
                  >
                    {opt.icon}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-[12px] font-semibold"
                    style={{ color: active ? accentColor : 'var(--ink)' }}
                  >
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {opt.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="px-3.5 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: active ? 'var(--blue)' : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--muted)',
                border: `1.5px solid ${active ? 'var(--blue)' : 'var(--line)'}`,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Info banner ────────────────────────────────────────────────────── */

export function ModalInfo({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: 'color-mix(in srgb, var(--blue) 6%, transparent)' }}
    >
      <div className="shrink-0 mt-0.5" style={{ color: 'var(--blue)' }}>
        {icon}
      </div>
      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--blue)' }}>
        {children}
      </p>
    </div>
  )
}

/* ── Warning banner ─────────────────────────────────────────────────── */

export function ModalWarning({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] mt-1.5" style={{ color: 'var(--warn)' }}>
      {children}
    </p>
  )
}
