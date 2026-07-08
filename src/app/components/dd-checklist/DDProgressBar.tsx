interface Props {
  completed: number
  total: number
  className?: string
  showLabel?: boolean
}

export function DDProgressBar({ completed, total, className = '', showLabel = false }: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const isComplete = pct === 100

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: isComplete
              ? 'var(--pos)'
              : 'linear-gradient(90deg, var(--blue), var(--blue-l))',
            boxShadow: pct > 0 && !isComplete
              ? '0 0 8px rgba(37,99,235,0.25)'
              : isComplete
                ? '0 0 8px rgba(22,163,74,0.25)'
                : 'none',
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-[11px] font-semibold tabular-nums shrink-0"
          style={{
            color: isComplete ? 'var(--pos)' : 'var(--muted)',
            fontFamily: 'var(--font-num)',
          }}
        >
          {completed}/{total}
        </span>
      )}
    </div>
  )
}
