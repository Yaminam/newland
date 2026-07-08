// Route → dynamic import map for hover-prefetching.
// When a user hovers a nav link the browser starts fetching that chunk so
// it's already in the module cache by the time they click.
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  '/dashboard':                    () => import('../pages/dashboard/DashboardHome'),
  '/dashboard/pipeline':           () => import('../pages/dashboard/PipelinePage'),
  '/dashboard/deal-rooms':         () => import('../pages/dashboard/DealRoomPage'),
  '/dashboard/dd-checklist':       () => import('../pages/dashboard/DDChecklistPage'),
  '/dashboard/marketplace':        () => import('../pages/dashboard/StartupMarketplacePage'),
  '/dashboard/introductions':      () => import('../pages/dashboard/WarmIntroductionsPage'),
  '/dashboard/portfolio':          () => import('../pages/dashboard/PortfolioPage'),
  '/dashboard/news-feed':          () => import('../pages/dashboard/NewsFeedPage'),
  '/dashboard/funding-tracker':    () => import('../pages/dashboard/FundingTrackerPage'),
  '/dashboard/ask-ai':             () => import('../pages/dashboard/AIChatPage'),
  '/dashboard/my-listing':         () => import('../pages/dashboard/MyListingPage'),
  '/dashboard/browse-investors':   () => import('../pages/dashboard/BrowseInvestorsPage'),
  '/dashboard/watchlist':          () => import('../pages/dashboard/InvestorCRMPage'),
  '/dashboard/investor-profile':   () => import('../pages/dashboard/InvestorProfilePage'),
  '/dashboard/settings':           () => import('../pages/dashboard/SettingsPage'),
  '/dashboard/events':             () => import('../pages/dashboard/EventsPage'),
  '/dashboard/grants':             () => import('../pages/dashboard/GrantsPage'),
  '/dashboard/notifications':      () => import('../pages/dashboard/NotificationsPage'),
  '/dashboard/partnership-intros': () => import('../pages/dashboard/PartnershipIntrosPage'),
  '/dashboard/co-invest':          () => import('../pages/dashboard/CoInvestPage'),
}

export function prefetchRoute(path: string): void {
  routePrefetchMap[path]?.()
}
