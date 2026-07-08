import { useEffect, useState } from 'react'

/**
 * Returns true on touch / no-hover devices (phones, most tablets). Used to
 * disable cursor-driven 3D tilt — without a pointer to neutralise it, a tilted
 * card would otherwise sit permanently skewed on mobile.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setCoarse(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return coarse
}
