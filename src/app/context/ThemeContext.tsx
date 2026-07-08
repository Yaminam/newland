import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  /** True when the current theme is pinned by the user (overrides system). */
  overridden: boolean
  /** Clear the override and follow system preference again. */
  followSystem: () => void
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType)

const STORAGE_KEY = 'theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // If the user has explicitly toggled, honor that. Otherwise follow the OS.
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    return saved ?? getSystemTheme()
  })
  const [overridden, setOverridden] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) != null,
  )

  // Apply the class so CSS `.dark` rules kick in.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Track OS changes while the user hasn't pinned a preference.
  useEffect(() => {
    if (overridden) return
    const mq = window.matchMedia(MEDIA_QUERY)
    const onChange = (e: MediaQueryListEvent) => setThemeState(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [overridden])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    setOverridden(true)
    localStorage.setItem(STORAGE_KEY, t)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const followSystem = () => {
    localStorage.removeItem(STORAGE_KEY)
    setOverridden(false)
    setThemeState(getSystemTheme())
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, overridden, followSystem }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
