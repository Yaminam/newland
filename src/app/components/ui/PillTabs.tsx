type PillTabsOption<T extends string> = T | { value: T; label: string }

interface PillTabsProps<T extends string> {
  value: T
  options: ReadonlyArray<PillTabsOption<T>>
  onChange: (value: T) => void
  className?: string
}

/**
 * Pill-shaped segmented control. Active state uses accent-blue surface.
 * Works with plain string arrays or {value,label} objects.
 */
export function PillTabs<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: PillTabsProps<T>) {
  const items = options.map(o =>
    typeof o === 'string' ? { value: o as T, label: o } : o,
  )

  return (
    <div className={`cc-pill-tabs ${className}`} role="tablist">
      {items.map(opt => (
        <button
          key={opt.value}
          role="tab"
          data-active={opt.value === value}
          aria-selected={opt.value === value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
