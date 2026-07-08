import { useState, useRef, useEffect, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  LayoutDashboard, Newspaper, Search,
  Users, Settings, LogOut, X,
  Command, ChevronDown, Plus,
  PanelLeftClose, PanelLeftOpen,
  MessageSquare, BookMarked, CalendarDays, Landmark,
  DollarSign, Bot, Mail, LifeBuoy, User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { NotificationCenter } from '../components/NotificationCenter'
import { ThemeToggle } from '../components/ThemeToggle'
import { FounderCentralLogo } from '../components/FounderCentralLogo'
import { FounderCentralMark } from '../components/FounderCentralMark'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { FeedbackWidget } from '../components/FeedbackWidget'
import { ImpersonationBanner } from '../components/ImpersonationBanner'
import { AvatarRequiredGate } from '../components/AvatarRequiredGate'
import { normalizeAvatarUrl } from '../lib/avatarUrl'
import { GlobalSearch } from '../components/GlobalSearch'

const INCUBATION_BADGE = {
  bg: '#F5F3FF',
  text: '#7C3AED',
  label: 'Incubation Admin',
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pipeline',
    items: [
      { to: '/incubation',                   icon: LayoutDashboard, label: 'Dashboard'        },
      { to: '/incubation/founders',          icon: Users,           label: 'Founders'         },
      { to: '/incubation/browse-investors',  icon: User,            label: 'Browse Investors' },
      { to: '/incubation/news-events',       icon: Newspaper,       label: 'News & Events'    },
    ],
  },
  {
    title: 'Network',
    items: [
      { to: '/incubation/introductions', icon: MessageSquare, label: 'Introductions' },
      { to: '/incubation/watchlist',     icon: BookMarked,    label: 'Watchlist'     },
      { to: '/incubation/events',        icon: CalendarDays,  label: 'Events'        },
      { to: '/incubation/grants',        icon: Landmark,      label: 'Govt Grants'   },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { to: '/incubation/news-feed',         icon: Newspaper,    label: 'News Feed'        },
      { to: '/incubation/funding-tracker',   icon: DollarSign,   label: 'Funding Tracker'  },
      { to: '/incubation/ask-ai',            icon: Bot,          label: 'Ask AI'           },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/contact', icon: Mail,      label: 'Contact'     },
      { to: '/help',    icon: LifeBuoy,  label: 'Help Center' },
      { to: '/incubation/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

function getInitials(profile: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return 'U'
  const first = profile.first_name?.[0] ?? ''
  const last = profile.last_name?.[0] ?? ''
  if (first || last) return `${first}${last}`.toUpperCase()
  return 'U'
}

interface SidebarProfile {
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
}

/* ------------------------------------------------------------------ */
/*  NavItemWithTooltip                                                 */
/* ------------------------------------------------------------------ */
function NavItemWithTooltip({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const { to, icon: Icon, label } = item
  return (
    <div className="relative group">
      <NavLink
        to={to}
        end={to === '/incubation'}
        onClick={onNavigate}
        className={({ isActive }) =>
          `${collapsed
            ? 'flex items-center justify-center w-10 h-10 mx-auto'
            : 'flex items-center gap-2.5 relative overflow-hidden px-3 py-2'
          } transition-all nav-item-hover ${isActive ? 'nav-item-active' : ''}`
        }
        style={({ isActive }) => ({
          borderRadius: 'var(--r-md)',
          background: isActive ? 'var(--blue-bg)' : 'transparent',
          color: isActive ? 'var(--blue)' : 'var(--muted)',
          fontWeight: isActive ? 600 : 500,
          borderLeft: !collapsed && isActive ? '3px solid var(--blue)' : !collapsed ? '3px solid transparent' : undefined,
        })}
      >
        {({ isActive }) => (
          <>
            <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 1.8} />
            {!collapsed && <span className="text-sm truncate">{label}</span>}
          </>
        )}
      </NavLink>
      {collapsed && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            borderRadius: 'var(--r-sm)',
            background: 'var(--ink)',
            color: '#ffffff',
            boxShadow: 'var(--sh-3)',
          }}
        >
          {label}
          <span
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              border: '5px solid transparent',
              borderRightColor: 'var(--ink)',
            }}
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function Sidebar({ collapsed, onToggle, onClose, profile, onLogout }: {
  collapsed: boolean
  onToggle: () => void
  onClose?: () => void
  profile: SidebarProfile | null
  onLogout: () => void
}) {
  const initials = getInitials(profile)

  return (
    <div className="flex flex-col h-full surface-bar border-r" style={{ borderColor: 'var(--line)' }}>
      {/* Logo area */}
      <div
        className="flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--line)', height: 64, minHeight: 64 }}
      >
        {collapsed ? <FounderCentralMark size={28} /> : <FounderCentralLogo size="md" />}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--muted)' }}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-7 h-7 flex items-center justify-center lg:hidden"
              style={{ color: 'var(--muted)', borderRadius: 'var(--r-md)', background: 'var(--surface-2)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1"
            style={{
              borderRadius: 'var(--r-xl)',
              background: `color-mix(in srgb, ${INCUBATION_BADGE.text} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${INCUBATION_BADGE.text} 22%, transparent)`,
              color: INCUBATION_BADGE.text,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: INCUBATION_BADGE.text, boxShadow: `0 0 0 3px color-mix(in srgb, ${INCUBATION_BADGE.text} 18%, transparent)` }}
            />
            {INCUBATION_BADGE.label}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto cc-no-scrollbar py-4 space-y-5 ${collapsed ? 'px-2' : 'px-3'}`}>
        <LayoutGroup>
          {NAV_SECTIONS.map((section, sectionIdx) => (
            <div key={section.title || `section-${sectionIdx}`}>
              {!collapsed && section.title && (
                <p
                  className="px-3 mb-1.5"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--muted-2)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItemWithTooltip key={item.to} item={item} collapsed={collapsed} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </LayoutGroup>
      </nav>

      {/* User card + logout */}
      <div className="p-3" style={{ borderTop: '1px solid var(--line)' }}>
        {!collapsed && (
          <div
            className="flex items-center gap-3 p-2.5 mb-1 rounded-[var(--r-lg)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line-2)' }}
          >
            {normalizeAvatarUrl(profile?.avatar_url) ? (
              <img
                src={normalizeAvatarUrl(profile?.avatar_url)!}
                alt="Avatar"
                className="w-8 h-8 rounded-full shrink-0 object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                style={{ background: 'var(--gradient-primary)', color: 'white' }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink)' }}>
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                Incubation Admin
              </p>
            </div>
            <button
              onClick={onLogout}
              aria-label="Sign out"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover-danger"
              style={{ color: 'var(--muted)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="flex items-center justify-center w-10 h-10 mx-auto transition-colors hover-danger rounded-[var(--r-md)]"
            style={{ color: 'var(--muted)' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MobileBottomTabs                                                   */
/* ------------------------------------------------------------------ */
function MobileBottomTabs() {
  const tabItems = useMemo(() => {
    const all: NavItem[] = []
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        all.push(item)
        if (all.length >= 5) break
      }
      if (all.length >= 5) break
    }
    return all
  }, [])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around surface-bar border-t"
      style={{ borderColor: 'var(--line)', height: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabItems.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/incubation'}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={({ isActive }) => ({
              color: isActive ? 'var(--blue)' : 'var(--muted)',
              fontWeight: isActive ? 600 : 400,
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '25%',
                      right: '25%',
                      height: 2,
                      borderRadius: '0 0 2px 2px',
                      background: 'var(--blue)',
                    }}
                  />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ fontSize: 10, lineHeight: 1 }}>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/*  IncubationLayout                                                   */
/* ------------------------------------------------------------------ */
export function IncubationLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const quickActionsRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) setShowQuickActions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
        return
      }
      if (e.key === 'Escape') {
        if (showUserMenu) { setShowUserMenu(false); return }
        if (showQuickActions) { setShowQuickActions(false); return }
        if (showCommandPalette) { setShowCommandPalette(false); return }
        if (mobileOpen) setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showUserMenu, showQuickActions, showCommandPalette, mobileOpen])

  const quickActions = [
    { label: 'View Founders',    icon: Users,        to: '/incubation/founders',        description: 'Browse your cohort'       },
    { label: 'Introductions',    icon: MessageSquare,to: '/incubation/introductions',   description: 'Connect founders & investors' },
    { label: 'Ask AI',           icon: Bot,          to: '/incubation/ask-ai',          description: 'Market & programme intel' },
    { label: 'Funding Tracker',  icon: DollarSign,   to: '/incubation/funding-tracker', description: 'Track cohort fundraising' },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const initials = getInitials(profile)

  const breadcrumb = useMemo(() => {
    let currentSection: string | null = null
    let currentLabel: string | null = null
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        const isMatch = location.pathname === item.to
          || (item.to !== '/incubation' && location.pathname.startsWith(item.to))
        if (isMatch) {
          currentSection = section.title || null
          currentLabel = item.label
        }
      }
    }
    return { section: currentSection, label: currentLabel }
  }, [location.pathname])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ============================================================ */}
      {/*  Topbar                                                       */}
      {/* ============================================================ */}
      <header
        className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 shrink-0 sticky top-0 z-30 surface-bar border-b"
        style={{ borderColor: 'var(--line)', height: 64, minHeight: 64 }}
      >
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center transition-colors shrink-0"
          style={{
            borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--muted)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 min-w-0 flex items-center gap-2"
        >
          {breadcrumb.label && (
            <>
              {breadcrumb.section && (
                <>
                  <span
                    className="text-xs font-semibold uppercase hidden sm:inline"
                    style={{ color: 'var(--muted-2)', letterSpacing: '0.05em' }}
                  >
                    {breadcrumb.section}
                  </span>
                  <span className="hidden sm:inline" style={{ color: 'var(--muted-2)' }}>/</span>
                </>
              )}
              <span
                className="text-sm font-semibold truncate"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
              >
                {breadcrumb.label}
              </span>
            </>
          )}
        </motion.div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search — desktop */}
          <button
            onClick={() => setShowCommandPalette(true)}
            aria-label="Search (⌘K)"
            className="hidden sm:flex items-center gap-2 px-3 h-9 transition-colors"
            style={{
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              minWidth: 160,
            }}
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs flex-1 text-left truncate">Search dashboard…</span>
            <span
              className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold"
              style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--muted-2)' }}
            >
              <Command className="w-2.5 h-2.5" />K
            </span>
          </button>
          {/* Search — mobile icon */}
          <button
            onClick={() => setShowCommandPalette(true)}
            aria-label="Search"
            className="sm:hidden w-9 h-9 flex items-center justify-center transition-colors"
            style={{
              borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Quick actions */}
          <div className="relative hidden sm:block" ref={quickActionsRef}>
            <button
              onClick={() => setShowQuickActions(v => !v)}
              aria-label="Quick actions"
              aria-expanded={showQuickActions}
              className="w-9 h-9 flex items-center justify-center transition-colors"
              style={{
                borderRadius: 'var(--r-md)',
                background: showQuickActions ? 'var(--blue)' : 'var(--surface-2)',
                border: `1px solid ${showQuickActions ? 'var(--blue)' : 'var(--line)'}`,
                color: showQuickActions ? '#FFFFFF' : 'var(--muted)',
                boxShadow: showQuickActions ? 'var(--sh-3)' : 'none',
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.2} />
            </button>
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 overflow-hidden z-50 dropdown-menu"
                  style={{ width: 'min(18rem, calc(100vw - 2rem))' }}
                >
                  <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--line)' }}>
                    <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>
                      Quick Actions
                    </p>
                  </div>
                  <div className="p-2">
                    {quickActions.map(action => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.to}
                          onClick={() => { navigate(action.to); setShowQuickActions(false) }}
                          className="w-full flex items-center gap-3 p-2.5 transition-colors text-left hover-surface rounded-[var(--r-md)]"
                        >
                          <div
                            className="shrink-0 w-9 h-9 flex items-center justify-center"
                            style={{ borderRadius: 'var(--r-md)', background: 'var(--blue-bg)', color: 'var(--blue)' }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{action.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{action.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Avatar menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              aria-label="Open user menu"
              aria-expanded={showUserMenu}
              className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 cursor-pointer transition-all"
              style={{
                borderRadius: 'var(--r-xl)',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                boxShadow: showUserMenu ? 'var(--sh-2)' : 'none',
              }}
            >
              <span
                className="flex items-center justify-center text-xs font-bold overflow-hidden relative"
                style={{ width: 32, height: 32, borderRadius: '9999px', background: 'var(--gradient-primary)', color: 'white' }}
              >
                <span className="absolute inset-0 flex items-center justify-center">{initials}</span>
                {normalizeAvatarUrl(profile?.avatar_url) && (
                  <img
                    src={normalizeAvatarUrl(profile?.avatar_url)!}
                    alt="Avatar"
                    className="relative w-full h-full object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{ color: 'var(--muted)', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-11 w-52 overflow-hidden z-50 dropdown-menu"
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--line-2)' }}>
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Incubation Admin</p>
                  </div>
                  <button
                    onClick={() => { navigate('/incubation/settings'); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover-surface"
                    style={{ color: 'var(--muted)', borderBottom: '1px solid var(--line-2)' }}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowUserMenu(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover-danger"
                    style={{ color: 'var(--neg)' }}
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  Body: Sidebar + Content                                      */}
      {/* ============================================================ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        <motion.div
          animate={{ width: collapsed ? 72 : 240 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="shrink-0 hidden lg:block overflow-hidden sticky top-[64px] self-start"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            profile={profile}
            onLogout={handleLogout}
          />
        </motion.div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 lg:hidden modal-backdrop"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.22, type: 'spring', damping: 28 }}
                className="fixed left-0 top-0 bottom-0 z-50 lg:hidden"
                style={{ width: 240 }}
              >
                <Sidebar
                  collapsed={false}
                  onToggle={() => setMobileOpen(false)}
                  onClose={() => setMobileOpen(false)}
                  profile={profile}
                  onLogout={handleLogout}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto min-w-0">
          <ImpersonationBanner />
          <div
            className="mx-auto pb-8 pt-4"
            style={{
              maxWidth: 1280,
              paddingLeft: 'clamp(16px, 3vw, 48px)',
              paddingRight: 'clamp(16px, 3vw, 48px)',
            }}
          >
            <ErrorBoundary>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
              <AvatarRequiredGate />
            </ErrorBoundary>
          </div>
          <div className="md:hidden" style={{ height: 56 }} />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <MobileBottomTabs />

      {/* Feedback widget */}
      <FeedbackWidget />

      {/* Global command palette */}
      <GlobalSearch
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        navItems={NAV_SECTIONS}
        role="incubation_admin"
      />
    </div>
  )
}
