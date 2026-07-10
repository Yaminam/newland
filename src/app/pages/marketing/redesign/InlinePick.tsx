import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface InlinePickProps<T extends string> {
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  tone?: 'blue' | 'gold' | 'green'
}

const TONES = {
  blue: { c: 'var(--rd-blue)', bg: 'var(--rd-blue-bg)', br: 'rgba(37,99,235,0.28)' },
  gold: { c: 'var(--rd-gold)', bg: 'var(--rd-gold-bg)', br: 'rgba(30,58,138,0.3)' },
  green: { c: 'var(--rd-green)', bg: 'var(--rd-green-bg)', br: 'rgba(37,99,235,0.28)' },
}

/** An editable "token" inside a sentence — reads as filled-in words, opens a menu. */
export function InlinePick<T extends string>({ value, options, onChange, tone = 'blue' }: InlinePickProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const t = TONES[tone]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-extrabold transition-all"
        style={{ color: t.c, background: t.bg, border: `1.5px solid ${open ? t.c : t.br}`, fontFamily: 'var(--font-display)' }}
      >
        {value}
        <ChevronDown className="h-4 w-4 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none', opacity: 0.7 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[calc(100%+8px)] z-40 w-48 -translate-x-1/2 overflow-hidden rounded-xl p-1.5"
            style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: 'var(--sh-4)' }}
          >
            {options.map(opt => {
              const active = opt === value
              return (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(opt); setOpen(false) }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-semibold transition-colors"
                    style={{ color: active ? t.c : 'var(--rd-ink)', background: active ? t.bg : 'transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--rd-surface-2)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {opt}
                    {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </span>
  )
}
