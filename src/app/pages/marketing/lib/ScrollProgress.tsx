import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Thin gradient bar pinned to top of viewport that fills as the user
 * scrolls down the page. Sits ABOVE the sticky nav (z-index higher).
 * Springs gently rather than tracking 1:1, so it feels physical.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden
      style={{
        scaleX,
        transformOrigin: '0% 50%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'linear-gradient(90deg, #2563EB 0%, #4ADE80 50%, #2563EB 100%)',
        zIndex: 60, // sits above nav (z-50)
        pointerEvents: 'none',
      }}
    />
  )
}
