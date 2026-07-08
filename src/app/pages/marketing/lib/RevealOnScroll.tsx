import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Initial vertical offset before reveal. Negative = comes from below. */
  y?: number
  /** Stagger delay (s) for sequential reveals. */
  delay?: number
  /** Duration in seconds. */
  duration?: number
  /** Trigger margin — how far before the element enters viewport. */
  margin?: string
  /** Wrap as a section instead of a div (for semantic markup). */
  as?: 'div' | 'section'
}

/**
 * Fades in + slides up its children when scrolled into view. Once-only by
 * default so the user doesn't see things flicker on scroll-back. Honors
 * prefers-reduced-motion: accessibility users see content instantly.
 */
export function RevealOnScroll({
  children,
  y = 28,
  delay = 0,
  duration = 0.65,
  margin = '-60px',
  as = 'div',
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: margin as `${number}px` })
  const reducedMotion = useReducedMotion()

  const Component = as === 'section' ? motion.section : motion.div

  if (reducedMotion) {
    return <Component ref={ref}>{children}</Component>
  }

  return (
    <Component
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // gentle out-quart — feels expensive, not bouncy
      }}
    >
      {children}
    </Component>
  )
}
