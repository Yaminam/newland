import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Eye, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FLAG_KEY  = 'impersonation_active'
const NONCE_KEY = 'cc:imp:nonce'

// Reads the ?impersonation=1 query param that admin-impersonate appended to
// the magic-link redirect, stashes it in sessionStorage so the banner
// survives navigation, and renders a persistent bar at the top of every
// dashboard page with a one-click "End impersonation" button.
//
// Security: the param is only trusted when accompanied by a one-time nonce
// (_n) that matches the value UsersPage stored in localStorage before
// opening the link. This prevents anyone from spoofing the banner by
// manually navigating to /dashboard?impersonation=1.
export function ImpersonationBanner() {
  const { profile, logout } = useAuth()
  const location = useLocation()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem(FLAG_KEY) === '1'
    const params  = new URLSearchParams(location.search)
    const hasFlag = params.get('impersonation') === '1'
    const urlNonce = params.get('_n') ?? ''

    if (hasFlag) {
      const storedNonce = localStorage.getItem(NONCE_KEY) ?? ''
      // Only trust the flag when the nonce matches what the admin tab stored.
      if (urlNonce && storedNonce && urlNonce === storedNonce) {
        localStorage.removeItem(NONCE_KEY)   // single-use
        sessionStorage.setItem(FLAG_KEY, '1')
        setActive(true)
      }
      // Strip both params from the URL regardless so the address bar looks clean.
      const url = new URL(window.location.href)
      url.searchParams.delete('impersonation')
      url.searchParams.delete('_n')
      window.history.replaceState({}, '', url.toString())
    } else if (stored) {
      setActive(true)
    }
  }, [location.search])

  if (!active) return null

  async function end() {
    sessionStorage.removeItem(FLAG_KEY)
    await logout()
    // Send the browser back to the regular login so the admin can sign
    // in with their own credentials again.
    window.location.href = '/auth/login'
  }

  return (
    <div
      className="w-full px-4 py-2 flex items-center justify-between gap-3 text-sm"
      style={{ background: 'var(--warn)', color: '#1F2937', position: 'sticky', top: 0, zIndex: 40 }}
    >
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Impersonating <strong>{profile?.email ?? 'user'}</strong> — actions here are performed as this user.
        </span>
      </div>
      <button
        type="button"
        onClick={() => void end()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg"
        style={{ background: '#1F2937', color: 'var(--ink)' }}
      >
        <LogOut className="w-3.5 h-3.5" />
        End impersonation
      </button>
    </div>
  )
}
