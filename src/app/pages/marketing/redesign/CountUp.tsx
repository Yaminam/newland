import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

interface CountUpProps {
  to: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  style?: React.CSSProperties
}

/** Counts from 0 → `to` the first time it scrolls into view. Honors reduced motion. */
export function CountUp({ to, prefix = '', suffix = '', duration = 1.6, className, style }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) { setVal(to); return }
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setVal(v),
    })
    return () => controls.stop()
  }, [inView, to, duration, reduce])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{Math.round(val).toLocaleString('en-IN')}{suffix}
    </span>
  )
}
