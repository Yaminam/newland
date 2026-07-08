import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Two-key shortcuts in the style of GitHub / Linear. Press `g`, then a
// destination letter within 1.5 s. Stand-alone keys `/` and `?` work
// without the prefix.
//
// Ignored when the user is typing in an input / textarea / contentEditable.

const ROUTE_KEYS: Record<string, string> = {
  d: '/internal/garagecollective/controlpanel',
  m: '/internal/garagecollective/controlpanel/monitoring',
  a: '/internal/garagecollective/controlpanel/applications',
  u: '/internal/garagecollective/controlpanel/users',
  r: '/internal/garagecollective/controlpanel/reports',
  i: '/internal/garagecollective/controlpanel/intros',
  s: '/internal/garagecollective/controlpanel/support',
  b: '/internal/garagecollective/controlpanel/billing',
  f: '/internal/garagecollective/controlpanel/flags',
  n: '/internal/garagecollective/controlpanel/notifications',
  v: '/internal/garagecollective/controlpanel/investors',
  c: '/internal/garagecollective/controlpanel/content',
  l: '/internal/garagecollective/controlpanel/audit',      // (l)og
  t: '/internal/garagecollective/controlpanel/admins',     // (t)eam
  h: '/internal/garagecollective/controlpanel/help',
  j: '/internal/garagecollective/controlpanel/agents',
}

const HELP_ENTRIES: Array<[string, string]> = [
  ['g d', 'Dashboard'],
  ['g m', 'Monitoring'],
  ['g a', 'Applications'],
  ['g u', 'Users'],
  ['g r', 'Reports'],
  ['g i', 'Intros'],
  ['g v', 'Investors'],
  ['g s', 'Support'],
  ['g n', 'Broadcasts'],
  ['g c', 'Content'],
  ['g b', 'Billing'],
  ['g f', 'Feature flags'],
  ['g t', 'Admin team'],
  ['g l', 'Audit log'],
  ['g h', 'Help / runbook'],
  ['g j', 'AI Agents'],
  ['/',   'Focus the search input on the current page'],
  ['?',   'Show this help'],
]

function isEditable(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (t.isContentEditable) return true
  return false
}

export function useAdminShortcuts(): { helpOpen: boolean; closeHelp: () => void; helpEntries: typeof HELP_ENTRIES } {
  const navigate = useNavigate()
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    let gPending = false
    let gTimer: ReturnType<typeof setTimeout> | null = null

    function clearG() {
      gPending = false
      if (gTimer) { clearTimeout(gTimer); gTimer = null }
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isEditable(e.target)) return

      // ? toggles help
      if (e.key === '?' && !gPending) {
        e.preventDefault()
        setHelpOpen(v => !v)
        return
      }

      // / focuses the first search input on the page (if any)
      if (e.key === '/' && !gPending) {
        const input = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search" i]')
        if (input) {
          e.preventDefault()
          input.focus()
          input.select()
        }
        return
      }

      if (gPending) {
        const target = ROUTE_KEYS[e.key.toLowerCase()]
        if (target) {
          e.preventDefault()
          navigate(target)
        }
        clearG()
        return
      }

      if (e.key === 'g') {
        gPending = true
        if (gTimer) clearTimeout(gTimer)
        gTimer = setTimeout(clearG, 1500)
      } else if (e.key === 'Escape') {
        setHelpOpen(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (gTimer) clearTimeout(gTimer)
    }
  }, [navigate])

  return {
    helpOpen,
    closeHelp: () => setHelpOpen(false),
    helpEntries: HELP_ENTRIES,
  }
}
