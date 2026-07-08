import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Briefcase,
  Send,
  Flag,
  Megaphone,
  Newspaper,
  ToggleRight,
  CreditCard,
  LifeBuoy,
  FileClock,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  BookOpen,
  Gauge,
  Layers,
  Bot,
  ScanSearch,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAdminShortcuts } from '../hooks/useAdminShortcuts'

interface NavItem {
  to:    string
  label: string
  icon:  React.ElementType
  end?:  boolean
  phase: 'mvp' | 'v2' | 'v3'
}

const NAV: NavItem[] = [
  { to: '/internal/garagecollective/controlpanel',               label: 'Dashboard',    icon: LayoutDashboard, end: true, phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/monitoring',    label: 'Monitoring',   icon: Activity,                   phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/applications',  label: 'Applications', icon: FileCheck,                  phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/users',         label: 'Users',        icon: Users,                      phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/reports',       label: 'Reports',      icon: Flag,                       phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/deals',         label: 'Deals',        icon: Layers,                     phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/intros',        label: 'Intros',       icon: Send,                       phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/investors',     label: 'Investors',    icon: Briefcase,                  phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/scraper',      label: 'Scraper',      icon: ScanSearch,                 phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/notifications', label: 'Broadcasts',   icon: Megaphone,                  phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/content',       label: 'Content',      icon: Newspaper,                  phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/agents',        label: 'AI Agents',    icon: Bot,                        phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/support',       label: 'Support',      icon: LifeBuoy,                   phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/audit',         label: 'Audit log',    icon: FileClock,                  phase: 'v2'  },
  { to: '/internal/garagecollective/controlpanel/flags',         label: 'Feature flags',icon: ToggleRight,                phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/rate-limits',   label: 'Rate limits',  icon: Gauge,                      phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/billing',       label: 'Billing',      icon: CreditCard,                 phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/admins',        label: 'Admins',       icon: ShieldCheck,                phase: 'mvp' },
  { to: '/internal/garagecollective/controlpanel/help',          label: 'Runbook',      icon: BookOpen,                   phase: 'mvp' },
]

export function AdminLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { helpOpen, closeHelp, helpEntries } = useAdminShortcuts()

  // Close the mobile drawer on navigation so the main content is visible.
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  async function handleSignOut() {
    await logout()
    navigate('/auth/login', { replace: true })
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-6 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: '#8A93AE' }}>
            FounderCentral
          </p>
          <h1 className="mt-1 text-lg font-semibold" style={{ color: '#F8FAFC', fontFamily: 'var(--font-display)' }}>
            Admin Console
          </h1>
        </div>
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          style={{ color: '#8A93AE' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${isActive ? 'font-semibold' : ''}`
              }
              style={({ isActive }) => ({
                color:      isActive ? '#F8FAFC' : '#93A0C5',
                background: isActive ? '#1E293B' : 'transparent',
                borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
              })}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {item.phase !== 'mvp' && (
                <span
                  className="text-[10px] uppercase px-1.5 py-0.5 rounded"
                  style={{ background: '#1E293B', color: '#6B7AA0' }}
                >
                  {item.phase}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs" style={{ color: '#8A93AE' }}>Signed in as</p>
        <p className="text-sm font-medium truncate" style={{ color: '#F8FAFC' }}>{profile?.email ?? '—'}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 w-full flex items-center gap-2 text-xs font-medium transition-colors"
          style={{ color: '#93A0C5' }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="admin-panel min-h-screen flex" style={{ background: 'var(--surface-2)' }}>
      {/* Desktop sidebar (>= lg) */}
      <aside
        className="w-64 shrink-0 flex-col hidden lg:flex"
        style={{ background: 'var(--ink)', color: 'var(--line)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: top bar + slide-over drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: '#0D1B2A', color: '#F8FAFC', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{ color: '#F8FAFC' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Admin Console
        </span>
        <div className="w-5" />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 max-w-[85vw] flex flex-col"
            style={{ background: 'var(--ink)', color: 'var(--line)' }}
            onClick={e => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
          <div className="flex-1" style={{ background: 'rgba(15,23,42,0.6)' }} />
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>

      {helpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={closeHelp}
          style={{ background: 'rgba(15,23,42,0.6)' }}>
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{ background: 'var(--surface)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Keyboard shortcuts
              </h2>
              <button onClick={closeHelp} aria-label="Close"
                style={{ color: 'var(--muted)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              {helpEntries.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between text-sm py-1.5"
                  style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ color: 'var(--muted)' }}>{label}</span>
                  <kbd className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: 'var(--muted-2)' }}>
              Press <kbd className="font-mono">?</kbd> again to close. Shortcuts are ignored while typing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
