import { useMemo, useRef, useState } from 'react'
import { COUNTS, scoreInvestors, type City, type Sector, type Stage } from './data'

/** Shared matcher state so every hero variant runs the same live logic. */
export function useMatcher() {
  const [stage, setStage] = useState<Stage>('Seed')
  const [sector, setSector] = useState<Sector>('SaaS')
  const [city, setCity] = useState<City>('Bangalore')
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scored = useMemo(() => scoreInvestors(stage, sector, city), [stage, sector, city])

  const run = () => {
    if (timer.current) clearTimeout(timer.current)
    setRunning(true)
    timer.current = setTimeout(() => setRunning(false), 650)
  }
  const pick = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); run() }

  return {
    stage, sector, city, setStage, setSector, setCity,
    running, run, pick, scored,
    top: scored.slice(0, 3),
    locked: COUNTS.matches - 3,
    matches: COUNTS.matches,
    directory: COUNTS.directory,
    comboKey: `${stage}-${sector}-${city}`,
  }
}
