import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Loader2, Command } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Debounce delay in ms. 0 = no debounce (default). */
  debounce?: number
  /** Show a loading spinner inside the input. */
  isLoading?: boolean
  /** Result count to display as a subtle badge. */
  resultCount?: number
  /** Enable Cmd/Ctrl+K global shortcut to focus. */
  globalShortcut?: boolean
  /** Auto-focus on mount. */
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search\u2026',
  className,
  debounce = 0,
  isLoading = false,
  resultCount,
  globalShortcut = false,
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Sync external value changes
  useEffect(() => { setLocalValue(value) }, [value])

  const handleChange = useCallback((v: string) => {
    setLocalValue(v)
    if (debounce > 0) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onChange(v), debounce)
    } else {
      onChange(v)
    }
  }, [onChange, debounce])

  // Cleanup timer
  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    if (!globalShortcut) return
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [globalShortcut])

  const showClear = localValue.length > 0
  const showCount = resultCount != null && localValue.length > 0

  return (
    <div className={cn('relative group', className)}>
      {/* Search icon */}
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-150 group-focus-within:text-[var(--blue)]"
        style={{ color: 'var(--muted-2)' }}
      />

      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-20 py-2.5 text-[13px] rounded-xl outline-0 transition-all duration-200"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          boxShadow: '0 1px 2px rgba(13,27,42,0.04)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'var(--blue)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--blue-bg), 0 1px 2px rgba(13,27,42,0.04)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'var(--line)'
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(13,27,42,0.04)'
        }}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            handleChange('')
            inputRef.current?.blur()
          }
        }}
      />

      {/* Right side controls */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--blue)' }} />
        )}

        {/* Result count badge */}
        {showCount && !isLoading && (
          <span
            className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
            style={{ background: 'var(--bg-soft)', color: 'var(--muted-2)' }}
          >
            {resultCount}
          </span>
        )}

        {/* Clear button */}
        {showClear && (
          <button
            onClick={() => { handleChange(''); inputRef.current?.focus() }}
            aria-label="Clear search"
            className="p-0.5 rounded-full transition-colors duration-150 hover:bg-[var(--bg-soft)] cursor-pointer"
            style={{ color: 'var(--muted-2)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {globalShortcut && !localValue && (
          <kbd
            className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              background: 'var(--bg-soft)',
              color: 'var(--muted-2)',
              border: '1px solid var(--line)',
            }}
          >
            {navigator.platform?.includes('Mac')
              ? <><Command className="w-3 h-3" />K</>
              : <>Ctrl+K</>
            }
          </kbd>
        )}
      </div>
    </div>
  )
}
