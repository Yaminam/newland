import { useState, useRef, useEffect, useMemo } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { prefetchRoute } from '../lib/prefetch'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Newspaper, Search, Building2,
  DollarSign, MessageSquare, User, Users, Bot, Kanban,
  Settings, LogOut, X,
  Rocket, Bell, Landmark, Handshake, Coins, Command, LifeBuoy, Mail, ChevronDown, Plus,
  PanelLeftClose, PanelLeftOpen, FolderLock, ClipboardCheck
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

// Role / investor-type badge config
const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  // Investor types
  angel:              { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Angel Investor' },
  'venture-capital':  { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'VC Investor' },
  bank:               { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Bank' },
  nbfc:               { bg: 'var(--success-bg)', text: 'var(--pos)', label: 'NBFC' },
  'family-office':    { bg: 'var(--success-bg)', text: 'var(--pos)', label: 'Family Office' },
  'corporate-venture':{ bg: 'var(--warning-bg)', text: 'var(--warn)', label: 'Corporate VC' },
  // Roles
  investor:           { bg: 'var(--blue-bg)', text: 'var(--blue)', label: 'Investor' },
  founder:            { bg: 'var(--success-bg)', text: 'var(--pos)', label: 'Founder' },
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  section?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

function getNavItems(role?: string, investorType?: string, founderType?: string): NavSection[] {
  if (role === 'investor') {
    return [
      {
        title: 'Pipeline',
        items: [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/dashboard/pipeline', icon: Kanban, label: 'Pipeline' },
          { to: '/dashboard/deal-rooms', icon: FolderLock, label: 'Deal Rooms' },
          { to: '/dashboard/dd-checklist', icon: ClipboardCheck, label: 'DD Checklist' },
          { to: '/dashboard/marketplace', icon: Building2, label: 'Browse Startups' },
          // { to: '/dashboard/trending', icon: Flame, label: 'Trending' }, // Trending: hidden
        ]
      },
      {
        title: 'Network',
        items: [
          { to: '/dashboard/introductions', icon: MessageSquare, label: 'Introductions' },
          { to: '/dashboard/portfolio', icon: TrendingUp, label: 'Portfolio' },
          ...(investorType === 'corporate-venture'
            ? [{ to: '/dashboard/partnership-intros', icon: Handshake, label: 'Partnerships' }]
            : []),
          ...(investorType === 'family-office'
            ? [{ to: '/dashboard/co-invest', icon: Coins, label: 'Co-Invest' }]
            : []),
        ]
      },
      {
        title: 'Intelligence',
        items: [
          { to: '/dashboard/news-feed', icon: Newspaper, label: 'News Feed' },
          { to: '/dashboard/funding-tracker', icon: DollarSign, label: 'Funding Tracker' },
          { to: '/dashboard/ask-ai', icon: Bot, label: 'Ask AI' },
        ]
      },
      {
        title: 'Account',
        items: [
          { to: '/dashboard/investor-profile', icon: User, label: 'My Profile' },
          // { to: '/dashboard/api-keys', icon: KeyRound, label: 'API Keys' }, // disabled — see routes.tsx
          { to: '/contact', icon: Mail, label: 'Contact' },
          { to: '/help', icon: LifeBuoy, label: 'Help Center' },
          { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
        ]
      },
    ]
  }
  if (role === 'founder' && founderType === 'active') {
    return [
      {
        title: 'Pipeline',
        items: [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/dashboard/my-listing', icon: Rocket, label: 'My Listing' },
          { to: '/dashboard/deal-rooms', icon: FolderLock, label: 'Deal Rooms' },
          { to: '/dashboard/dd-checklist', icon: ClipboardCheck, label: 'DD Checklist' },
          { to: '/dashboard/browse-investors', icon: User, label: 'Browse Investors' },
          // { to: '/dashboard/trending', icon: Flame, label: 'Trending' }, // Trending: hidden
        ]
      },
      {
        title: 'Network',
        items: [
          { to: '/dashboard/introductions', icon: MessageSquare, label: 'Introductions' },
          { to: '/dashboard/watchlist', icon: Users, label: 'Watchlist' },
          // { to: '/dashboard/term-sheets', icon: FileText, label: 'Term Sheets' }, // Term Sheets: DISABLED
          { to: '/dashboard/events', icon: Bell, label: 'Events' },
          { to: '/dashboard/grants', icon: Landmark, label: 'Govt Grants' },
        ]
      },
      {
        title: 'Intelligence',
        items: [
          { to: '/dashboard/news-feed', icon: Newspaper, label: 'News Feed' },
          { to: '/dashboard/funding-tracker', icon: DollarSign, label: 'Funding Tracker' },
          { to: '/dashboard/ask-ai', icon: Bot, label: 'Ask AI' },
        ]
      },
      {
        title: 'Account',
        items: [
          // { to: '/dashboard/api-keys', icon: KeyRound, label: 'API Keys' }, // disabled — see routes.tsx
          { to: '/contact', icon: Mail, label: 'Contact' },
          { to: '/help', icon: LifeBuoy, label: 'Help Center' },
          { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
        ]
      },
    ]
  }
  // idea founder
  return [
    {
      title: 'Pipeline',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/dashboard/my-listing', icon: Rocket, label: 'My Listing' },
        { to: '/dashboard/dd-checklist', icon: ClipboardCheck, label: 'DD Checklist' },
        { to: '/dashboard/browse-investors', icon: User, label: 'Browse Investors' },
        // { to: '/dashboard/trending', icon: Flame, label: 'Trending' }, // Trending: hidden
      ]
    },
    {
      title: 'Network',
      items: [
        { to: '/dashboard/introductions', icon: MessageSquare, label: 'Introductions' },
        { to: '/dashboard/watchlist', icon: Users, label: 'Watchlist' },
        { to: '/dashboard/events', icon: Bell, label: 'Events' },
        { to: '/dashboard/grants', icon: Landmark, label: 'Govt Grants' },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { to: '/dashboard/news-feed', icon: Newspaper, label: 'News Feed' },
        { to: '/dashboard/funding-tracker', icon: DollarSign, label: 'Funding Tracker' },
        { to: '/dashboard/ask-ai', icon: Bot, label: 'Ask AI' },
      ]
    },
    {
      title: 'Account',
      items: [
        // { to: '/dashboard/api-keys', icon: KeyRound, label: 'API Keys' }, // disabled — see routes.tsx
        { to: '/contact', icon: Mail, label: 'Contact' },
        { to: '/help', icon: LifeBuoy, label: 'Help Center' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
      ]
    },
  ]
}

function getInitials(profile: { first_name?: string | null; last_name?: string | null; company?: string | null } | null): string {
  if (!profile) return 'U'
  const first = profile.first_name?.[0] ?? ''
  const last = profile.last_name?.[0] ?? ''
  if (first || last) return `${first}${last}`.toUpperCase()
  if (profile.company) return profile.company.slice(0, 2).toUpperCase()
  return 'U'
}

interface SidebarProfile {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  role?: string
  investor_type?: string
  founder_type?: string
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
        end={to === '/dashboard'}
        onClick={onNavigate}
        onMouseEnter={() => prefetchRoute(to)}
        className={({ isActive }) =>
          `${collapsed
            ? 'flex items-center justify-center w-10 h-10 mx-auto'
            : 'flex items-center gap-2.5 relative overflow-hidden px-3 py-2'
          } transition-all nav-item-hover ${isActive ? 'nav-item-active' : ''}`
        }
        style={({ isActive }) => ({
          borderRadius: 'var(--r-md)',
          background: isActive
            ? 'var(--blue-bg)'
            : 'transparent',
          color: isActive
            ? 'var(--blue)'
            : 'var(--muted)',
          fontWeight: isActive ? 600 : 500,
          borderLeft: !collapsed && isActive ? '3px solid var(--blue)' : !collapsed ? '3px solid transparent' : undefined,
        })}
      >
        {({ isActive }) => (
          <>
            <Icon
              className="w-[18px] h-[18px] shrink-0"
              strokeWidth={isActive ? 2.25 : 1.8}
            />
            {!collapsed && (
              <span className="text-sm truncate">{label}</span>
            )}
          </>
        )}
      </NavLink>
      {/* Tooltip for collapsed state */}
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
function Sidebar({ collapsed, onToggle, onClose, navItems, profile, onLogout }: {
  collapsed: boolean
  onToggle: () => void
  onClose?: () => void
  navItems: NavSection[]
  profile: SidebarProfile | null
  onLogout: () => void
}) {
  const badgeCfg = profile?.investor_type
    ? ROLE_BADGES[profile.investor_type]
    : profile?.role
      ? ROLE_BADGES[profile.role]
      : null
  const initials = getInitials(profile)

  return (
    <div
      className="flex flex-col h-full surface-bar border-r"
      style={{ borderColor: 'var(--line)' }}
    >
      {/* Logo area */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          borderBottom: '1px solid var(--line)',
          height: 64,
          minHeight: 64,
        }}
      >
        {collapsed
          ? <FounderCentralMark size={28} />
          : <FounderCentralLogo size="md" />}

        <div className="flex items-center gap-1">
          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--muted)' }}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-7 h-7 flex items-center justify-center lg:hidden"
              style={{
                color: 'var(--muted)',
                borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Role badge */}
      {badgeCfg && !collapsed && (
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1"
            style={{
              borderRadius: 'var(--r-xl)',
              background: `color-mix(in srgb, ${badgeCfg.text} 10%, transparent)`,
              border: `1px solid color-mix(in srgb, ${badgeCfg.text} 22%, transparent)`,
              color: badgeCfg.text,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: badgeCfg.text, boxShadow: `0 0 0 3px color-mix(in srgb, ${badgeCfg.text} 18%, transparent)` }}
            />
            {badgeCfg.label}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className={`flex-1 overflow-y-auto cc-no-scrollbar py-4 space-y-5 ${collapsed ? 'px-2' : 'px-3'}`}>
        <LayoutGroup>
          {navItems.map((section, sectionIdx) => (
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
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line-2)',
            }}
          >
            {normalizeAvatarUrl(profile?.avatar_url) ? (
              <img src={normalizeAvatarUrl(profile?.avatar_url)!} alt="Avatar"
                className="w-8 h-8 rounded-full shrink-0 object-cover"
                onError={e => {
                  const el = e.currentTarget as HTMLImageElement
                  el.style.display = 'none'
                  const sibling = el.nextElementSibling as HTMLElement | null
                  if (sibling) sibling.style.display = 'flex'
                }}
              />
            ) : null}
            {normalizeAvatarUrl(profile?.avatar_url) ? (
              <div
                className="w-8 h-8 rounded-full items-center justify-center shrink-0 text-[10px] font-bold"
                style={{ display: 'none', background: 'var(--gradient-primary)', color: 'white' }}
              >
                {initials}
              </div>
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
              <p className="text-[10px] capitalize mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                {profile?.role}
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
function MobileBottomTabs({ navItems }: { navItems: NavSection[] }) {
  // Derive first 5 nav items across all sections
  const tabItems = useMemo(() => {
    const all: NavItem[] = []
    for (const section of navItems) {
      for (const item of section.items) {
        all.push(item)
        if (all.length >= 5) break
      }
      if (all.length >= 5) break
    }
    return all
  }, [navItems])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around surface-bar border-t"
      style={{
        borderColor: 'var(--line)',
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabItems.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
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
/*  DashboardLayout                                                    */
/* ------------------------------------------------------------------ */
export function DashboardLayout() {
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

  const navItems = getNavItems(profile?.role, profile?.investor_type, profile?.founder_type)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false)
      }
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
        if (mobileOpen) { setMobileOpen(false) }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showUserMenu, showQuickActions, showCommandPalette, mobileOpen])

  // Role-aware quick actions for the topbar `+` button.
  const quickActions: Array<{ label: string; icon: React.ElementType; to: string; description?: string }> = (() => {
    if (profile?.role === 'investor') {
      return [
        { label: 'Browse Startups',   icon: Building2,     to: '/dashboard/marketplace', description: 'Find new deals' },
        { label: 'Track Portfolio',   icon: TrendingUp,    to: '/dashboard/portfolio',   description: 'Add or update a position' },
        { label: 'Ask AI',            icon: Bot,           to: '/dashboard/ask-ai',      description: 'Fundraising & market intel' },
      ]
    }
    if (profile?.role === 'founder' && profile.founder_type === 'active') {
      return [
        { label: 'Edit My Listing',   icon: Rocket,        to: '/dashboard/my-listing',       description: 'Keep your profile fresh' },
        { label: 'Browse Investors',  icon: User,          to: '/dashboard/browse-investors', description: 'Find the right backer' },
        { label: 'Ask AI',            icon: Bot,           to: '/dashboard/ask-ai',           description: 'Fundraising coach' },
      ]
    }
    // Idea-stage founder
    return [
      { label: 'Build Your Idea',     icon: Rocket,        to: '/dashboard/my-listing',       description: 'Start your listing' },
      { label: 'Browse Investors',    icon: User,          to: '/dashboard/browse-investors', description: 'See who invests early' },
      { label: 'Ask AI',              icon: Bot,           to: '/dashboard/ask-ai',           description: 'Product & market intel' },
    ]
  })()

  const handleLogout = async () => {
    await logout()
    navigate('/auth/login')
  }

  const initials = getInitials(profile)

  // Derive breadcrumb from current route
  const breadcrumb = useMemo(() => {
    let currentSection: string | null = null
    let currentLabel: string | null = null
    for (const section of navItems) {
      for (const item of section.items) {
        const isMatch = location.pathname === item.to
          || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
        if (isMatch) {
          currentSection = section.title || null
          currentLabel = item.label
        }
      }
    }
    return { section: currentSection, label: currentLabel }
  }, [navItems, location.pathname])

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* ============================================================ */}
      {/*  Topbar — 64px, full width, sticky top                       */}
      {/* ============================================================ */}
      <header
        className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 shrink-0 sticky top-0 z-30 surface-bar border-b"
        style={{
          borderColor: 'var(--line)',
          height: 64,
          minHeight: 64,
        }}
      >
        {/* Hamburger — mobile/tablet only */}
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

        {/* Left: Breadcrumbs / page title */}
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
                  <span
                    className="hidden sm:inline"
                    style={{ color: 'var(--muted-2)' }}
                  >/</span>
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
          {/* Search / Command Palette trigger */}
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
          {/* Mobile icon-only trigger */}
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
                  style={{
                    width: 'min(18rem, calc(100vw - 2rem))',
                  }}
                >
                  <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid var(--line)' }}>
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}
                    >
                      Quick Actions
                    </p>
                  </div>
                  <div className="p-2">
                    {quickActions.map(action => {
                      const Icon = action.icon
                      return (
                        <button
                          key={action.to}
                          onClick={() => {
                            navigate(action.to)
                            setShowQuickActions(false)
                          }}
                          className="w-full flex items-center gap-3 p-2.5 transition-colors text-left hover-surface rounded-[var(--r-md)]"
                        >
                          <div
                            className="shrink-0 w-9 h-9 flex items-center justify-center"
                            style={{ borderRadius: 'var(--r-md)', background: 'var(--blue-bg)', color: 'var(--blue)' }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                              {action.label}
                            </p>
                            {action.description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                {action.description}
                              </p>
                            )}
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
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '9999px',
                  background: 'var(--gradient-primary)',
                  color: 'white',
                }}
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
                style={{
                  color: 'var(--muted)',
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
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
                    <p className="text-xs capitalize mt-0.5" style={{ color: 'var(--muted)' }}>
                      {profile?.role}
                    </p>
                  </div>
                  {[
                    {
                      label: 'View Profile',
                      action: () => {
                        navigate(profile?.role === 'investor' ? '/dashboard/investor-profile' : '/dashboard/my-listing')
                        setShowUserMenu(false)
                      },
                    },
                    {
                      label: 'Settings',
                      action: () => { navigate('/dashboard/settings'); setShowUserMenu(false) },
                    },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors hover-surface"
                      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--line-2)' }}
                    >
                      {item.label}
                    </button>
                  ))}
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
        {/* Desktop sidebar — sticky, beneath topbar */}
        <motion.div
          animate={{ width: collapsed ? 72 : 240 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="shrink-0 hidden lg:block overflow-hidden sticky top-[64px] self-start"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            navItems={navItems}
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
                  navItems={navItems}
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
            className="mx-auto pb-8 pt-4 md:pb-8"
            style={{
              maxWidth: 1280,
              paddingLeft: 'clamp(16px, 3vw, 48px)',
              paddingRight: 'clamp(16px, 3vw, 48px)',
              /* Extra bottom padding on mobile for bottom tabs */
              paddingBottom: undefined,
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
          {/* Spacer for mobile bottom tabs */}
          <div className="md:hidden" style={{ height: 56 }} />
        </main>
      </div>

      {/* Mobile bottom-tab nav (<768px) */}
      <MobileBottomTabs navItems={navItems} />

      {/* Feedback widget — outside sidebar so it's always accessible */}
      <FeedbackWidget />

      {/* Global command palette */}
      <GlobalSearch
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        navItems={navItems}
        role={profile?.role}
      />
    </div>
  )
}
