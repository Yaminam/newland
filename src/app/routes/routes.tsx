import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { IncubationLayout } from '../layouts/IncubationLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { RoleGuard } from '../components/RoleGuard'
import { RouteErrorPage } from '../components/RouteErrorPage'
import { useAuth } from '../context/AuthContext'

// Dashboard pages - lazy import all of them
import { lazy, Suspense, type ReactNode } from 'react'

// Auth pages — lazy loaded to keep initial bundle small
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('../pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const EmailVerificationPage = lazy(() => import('../pages/auth/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })))
const AdminLoginPage = lazy(() => import('../pages/auth/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
// Onboarding — lazy loaded
const OnboardingPage = lazy(() => import('../pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

// Redesigned conversion homepage (new). Original LandingPage is preserved
// in ../pages/marketing/LandingPage for reference.
const LandingPage = lazy(() => import('../pages/marketing/redesign/RedesignLanding').then(m => ({ default: m.RedesignLanding })))
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })))
const StartupMarketplacePage = lazy(() => import('../pages/dashboard/StartupMarketplacePage').then(m => ({ default: m.StartupMarketplacePage })))
const WarmIntroductionsPage = lazy(() => import('../pages/dashboard/WarmIntroductionsPage').then(m => ({ default: m.WarmIntroductionsPage })))
const PipelinePage = lazy(() => import('../pages/dashboard/PipelinePage').then(m => ({ default: m.PipelinePage })))
const PortfolioPage = lazy(() => import('../pages/dashboard/PortfolioPage').then(m => ({ default: m.PortfolioPage })))
const InvestorProfilePage = lazy(() => import('../pages/dashboard/InvestorProfilePage').then(m => ({ default: m.InvestorProfilePage })))
const MyListingPage = lazy(() => import('../pages/dashboard/MyListingPage').then(m => ({ default: m.MyListingPage })))
const BrowseInvestorsPage = lazy(() => import('../pages/dashboard/BrowseInvestorsPage').then(m => ({ default: m.BrowseInvestorsPage })))
const AIChatPage = lazy(() => import('../pages/dashboard/AIChatPage').then(m => ({ default: m.AIChatPage })))
const NewsFeedPage = lazy(() => import('../pages/dashboard/NewsFeedPage').then(m => ({ default: m.NewsFeedPage })))
// const TrendingFeedPage = lazy(() => import('../pages/dashboard/TrendingFeedPage').then(m => ({ default: m.TrendingFeedPage }))) // Trending: hidden
const FundingTrackerPage = lazy(() => import('../pages/dashboard/FundingTrackerPage').then(m => ({ default: m.FundingTrackerPage })))
const EventsPage = lazy(() => import('../pages/dashboard/EventsPage').then(m => ({ default: m.EventsPage })))
const GrantsPage = lazy(() => import('../pages/dashboard/GrantsPage').then(m => ({ default: m.GrantsPage })))
const SettingsPage = lazy(() => import('../pages/dashboard/SettingsPage').then(m => ({ default: m.SettingsPage })))
// ─── API Keys feature: DISABLED ─────────────────────────────────────
// The in-product API Keys UI is intentionally hidden. The page module
// and backend RLS policies are preserved so that any keys already issued
// continue to validate — we're hiding the surface, not revoking access.
// To re-enable: uncomment this import and restore the route below.
// const APIKeysPage = lazy(() => import('../pages/dashboard/APIKeysPage').then(m => ({ default: m.APIKeysPage })))
const ProfileUnderReviewPage = lazy(() => import('../pages/dashboard/ProfileUnderReviewPage').then(m => ({ default: m.ProfileUnderReviewPage })))
const InvestorCRMPage = lazy(() => import('../pages/dashboard/InvestorCRMPage').then(m => ({ default: m.InvestorCRMPage })))
const CalendarCallbackPage = lazy(() => import('../pages/dashboard/CalendarCallbackPage').then(m => ({ default: m.CalendarCallbackPage })))
const DealRoomPage = lazy(() => import('../pages/dashboard/DealRoomPage').then(m => ({ default: m.DealRoomPage })))
const DealRoomDetailPage = lazy(() => import('../pages/dashboard/DealRoomDetailPage').then(m => ({ default: m.DealRoomDetailPage })))
// ─── Term Sheets feature: DISABLED ──────────────────────────────────
// The Term Sheets UI is intentionally hidden. The page module, hooks,
// components, edge functions, and database tables are preserved so that
// any existing data remains intact — we're hiding the surface, not
// deleting the feature. To re-enable: uncomment this import and restore
// the route + nav item below.
// const TermSheetsPage = lazy(() => import('../pages/dashboard/TermSheetsPage').then(m => ({ default: m.TermSheetsPage })))
const DDChecklistPage = lazy(() => import('../pages/dashboard/DDChecklistPage').then(m => ({ default: m.DDChecklistPage })))
const DDChecklistDetailPage = lazy(() => import('../pages/dashboard/DDChecklistDetailPage').then(m => ({ default: m.DDChecklistDetailPage })))
const PartnershipIntrosPage = lazy(() => import('../pages/dashboard/PartnershipIntrosPage').then(m => ({ default: m.PartnershipIntrosPage })))
const CoInvestPage = lazy(() => import('../pages/dashboard/CoInvestPage').then(m => ({ default: m.CoInvestPage })))
const HelpCenterPage = lazy(() => import('../pages/help/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('../pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })))
const DPAPage = lazy(() => import('../pages/legal/DPAPage').then(m => ({ default: m.DPAPage })))
const AITransparencyPage = lazy(() => import('../pages/legal/AITransparencyPage').then(m => ({ default: m.AITransparencyPage })))
const DataGovernancePage = lazy(() => import('../pages/legal/DataGovernancePage').then(m => ({ default: m.DataGovernancePage })))
const APIUsagePolicyPage = lazy(() => import('../pages/legal/APIUsagePolicyPage').then(m => ({ default: m.APIUsagePolicyPage })))
const GDPRPage = lazy(() => import('../pages/legal/GDPRPage').then(m => ({ default: m.GDPRPage })))
const SOC2ReadinessPage = lazy(() => import('../pages/legal/SOC2ReadinessPage').then(m => ({ default: m.SOC2ReadinessPage })))
const PromptStoragePolicyPage = lazy(() => import('../pages/legal/PromptStoragePolicyPage').then(m => ({ default: m.PromptStoragePolicyPage })))
const IncubationDashboardPage      = lazy(() => import('../pages/incubation/IncubationDashboardPage').then(m => ({ default: m.IncubationDashboardPage })))
const IncubationIntroductionsPage  = lazy(() => import('../pages/incubation/IncubationIntroductionsPage').then(m => ({ default: m.IncubationIntroductionsPage })))
const IncubationNewsEventsPage     = lazy(() => import('../pages/incubation/IncubationNewsEventsPage').then(m => ({ default: m.IncubationNewsEventsPage })))
const IncubationFoundersPage       = lazy(() => import('../pages/incubation/IncubationFoundersPage').then(m => ({ default: m.IncubationFoundersPage })))
const InviteAcceptPage             = lazy(() => import('../pages/incubation/InviteAcceptPage').then(m => ({ default: m.InviteAcceptPage })))
const IncubationSettingsPage       = lazy(() => import('../pages/incubation/IncubationSettingsPage').then(m => ({ default: m.IncubationSettingsPage })))
const AdminDashboardPage    = lazy(() => import('../pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminApplicationsPage = lazy(() => import('../pages/admin/ApplicationsPage').then(m => ({ default: m.ApplicationsPage })))
const AdminUsersPage        = lazy(() => import('../pages/admin/UsersPage').then(m => ({ default: m.UsersPage })))
const AdminReportsPage      = lazy(() => import('../pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })))
const AdminIntrosPage        = lazy(() => import('../pages/admin/IntrosPage').then(m => ({ default: m.IntrosPage })))
const AdminInvestorsPage     = lazy(() => import('../pages/admin/InvestorsPage').then(m => ({ default: m.InvestorsPage })))
const AdminNotificationsPage = lazy(() => import('../pages/admin/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const DashboardNotificationsPage = lazy(() => import('../pages/dashboard/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const AdminContentPage       = lazy(() => import('../pages/admin/ContentPage').then(m => ({ default: m.ContentPage })))
const AdminSupportPage       = lazy(() => import('../pages/admin/SupportPage').then(m => ({ default: m.SupportPage })))
const AdminAuditLogPage      = lazy(() => import('../pages/admin/AuditLogPage').then(m => ({ default: m.AuditLogPage })))
const AdminMonitoringPage    = lazy(() => import('../pages/admin/MonitoringPage').then(m => ({ default: m.MonitoringPage })))
const AdminFlagsPage         = lazy(() => import('../pages/admin/FlagsPage').then(m => ({ default: m.FlagsPage })))
const AdminAdminsPage        = lazy(() => import('../pages/admin/AdminsPage').then(m => ({ default: m.AdminsPage })))
const AdminBillingPage       = lazy(() => import('../pages/admin/BillingPage').then(m => ({ default: m.BillingPage })))
const AdminHelpPage          = lazy(() => import('../pages/admin/HelpPage').then(m => ({ default: m.HelpPage })))
const AdminRateLimitsPage    = lazy(() => import('../pages/admin/RateLimitsPage').then(m => ({ default: m.RateLimitsPage })))
const AdminDealsPage         = lazy(() => import('../pages/admin/DealsPage').then(m => ({ default: m.AdminDealsPage })))
const AdminAgentsPage             = lazy(() => import('../pages/admin/AgentsPage').then(m => ({ default: m.AgentsPage })))
const AdminScraperPage            = lazy(() => import('../pages/admin/ScraperPage').then(m => ({ default: m.ScraperPage })))
const ContactPage = lazy(() => import('../pages/support/ContactPage').then(m => ({ default: m.ContactPage })))
const BlogListingPage = lazy(() => import('../pages/marketing/BlogListingPage').then(m => ({ default: m.BlogListingPage })))
const BlogPostPage = lazy(() => import('../pages/marketing/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const AboutPage = lazy(() => import('../pages/marketing/AboutPage').then(m => ({ default: m.AboutPage })))
const NewsletterPage = lazy(() => import('../pages/marketing/NewsletterPage').then(m => ({ default: m.NewsletterPage })))
const ForFoundersPage = lazy(() => import('../pages/marketing/ForFoundersPage').then(m => ({ default: m.ForFoundersPage })))
const ForInvestorsPage = lazy(() => import('../pages/marketing/ForInvestorsPage').then(m => ({ default: m.ForInvestorsPage })))
const ForIncubationPage = lazy(() => import('../pages/marketing/ForIncubationPage').then(m => ({ default: m.ForIncubationPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

function ApprovedRoute({ children }: { children: ReactNode }) {
  const { profile, profileApproved, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  // FC admins bypass the approval gate
  if (profile?.access_role === 'admin') return <>{children}</>

  // Incubation admins: redirect to portal if approved, else to under-review
  if (profile?.access_role === 'incubation_admin') {
    return profileApproved
      ? <Navigate to="/incubation" replace />
      : <Navigate to="/dashboard/under-review" replace />
  }

  if (!profileApproved) {
    return <Navigate to="/dashboard/under-review" replace />
  }

  return <>{children}</>
}

function InvestorOnlyDashboardRoute({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (profile?.role === 'founder') {
    return <Navigate to="/dashboard/my-listing" replace />
  }

  if (profile?.role !== 'investor') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function FounderOnlyDashboardRoute({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (profile?.role === 'investor') {
    return <Navigate to="/dashboard/marketplace" replace />
  }

  if (profile?.role !== 'founder') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function IncubationAdminRoute({ children }: { children: ReactNode }) {
  const { profile, profileApproved, isLoading } = useAuth()

  if (isLoading) return <PageLoader />

  if (profile?.access_role !== 'incubation_admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Block access until FC Admin verifies the incubation
  if (!profileApproved) {
    return <Navigate to="/dashboard/under-review" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(LandingPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/blog',
    element: withSuspense(BlogListingPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/blog/:slug',
    element: withSuspense(BlogPostPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/about',
    element: withSuspense(AboutPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/newsletter',
    element: withSuspense(NewsletterPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/for-founders',
    element: withSuspense(ForFoundersPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/for-investors',
    element: withSuspense(ForInvestorsPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/for-incubators',
    element: withSuspense(ForIncubationPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: 'login', element: withSuspense(LoginPage) },
      { path: 'signup', element: withSuspense(SignupPage) },
      { path: 'forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: 'reset-password', element: withSuspense(ResetPasswordPage) },
      { path: 'verify-email', element: withSuspense(EmailVerificationPage) },
    ],
  },
  {
    path: '/onboarding',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={false}>
        <Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/privacy-policy',
    element: withSuspense(PrivacyPolicyPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/verify-email',
    element: withSuspense(EmailVerificationPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/terms-of-service',
    element: withSuspense(TermsOfServicePage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/dpa',
    element: withSuspense(DPAPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/ai-transparency',
    element: withSuspense(AITransparencyPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/data-governance',
    element: withSuspense(DataGovernancePage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/api-usage-policy',
    element: withSuspense(APIUsagePolicyPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/gdpr',
    element: withSuspense(GDPRPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/soc2-readiness',
    element: withSuspense(SOC2ReadinessPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/internal/garagecollective/controlpanel/login',
    element: withSuspense(AdminLoginPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/internal/garagecollective/controlpanel',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={false} unauthRedirect="/internal/garagecollective/controlpanel/login">
        <RoleGuard allowedRoles={['admin']} showAccessDenied>
          <AdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true,           element: withSuspense(AdminDashboardPage) },
      { path: 'applications',  element: withSuspense(AdminApplicationsPage) },
      { path: 'users',         element: withSuspense(AdminUsersPage) },
      { path: 'reports',       element: withSuspense(AdminReportsPage) },
      { path: 'intros',        element: withSuspense(AdminIntrosPage) },
      { path: 'investors',     element: withSuspense(AdminInvestorsPage) },
      { path: 'notifications', element: withSuspense(AdminNotificationsPage) },
      { path: 'content',       element: withSuspense(AdminContentPage) },
      { path: 'support',       element: withSuspense(AdminSupportPage) },
      { path: 'audit',         element: withSuspense(AdminAuditLogPage) },
      { path: 'monitoring',    element: withSuspense(AdminMonitoringPage) },
      { path: 'health',        element: withSuspense(AdminMonitoringPage) },
      { path: 'flags',         element: withSuspense(AdminFlagsPage) },
      { path: 'admins',        element: withSuspense(AdminAdminsPage) },
      { path: 'billing',       element: withSuspense(AdminBillingPage) },
      { path: 'help',          element: withSuspense(AdminHelpPage) },
      { path: 'rate-limits',   element: withSuspense(AdminRateLimitsPage) },
      { path: 'deals',              element: withSuspense(AdminDealsPage) },
      { path: 'agents',             element: withSuspense(AdminAgentsPage) },
      { path: 'scraper',            element: withSuspense(AdminScraperPage) },
      { path: 'investor-directory', element: <Navigate to="/internal/garagecollective/controlpanel/investors" replace /> },
    ],
  },
  {
    path: '/prompt-storage-policy',
    element: withSuspense(PromptStoragePolicyPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/contact',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={true}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(ContactPage) },
    ],
  },
  {
    path: '/help',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={true}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(HelpCenterPage) },
    ],
  },
  // Under-review page rendered WITHOUT dashboard layout (no navbar/sidebar)
  {
    path: '/dashboard/under-review',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={true}>
        {withSuspense(ProfileUnderReviewPage)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={true}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // All other dashboard routes require admin approval
      { index: true, element: <ApprovedRoute>{withSuspense(DashboardHome)}</ApprovedRoute> },
      {
        path: 'marketplace',
        element: (
          <ApprovedRoute>
            <InvestorOnlyDashboardRoute>
              {withSuspense(StartupMarketplacePage)}
            </InvestorOnlyDashboardRoute>
          </ApprovedRoute>
        ),
      },
      { path: 'introductions', element: <ApprovedRoute>{withSuspense(WarmIntroductionsPage)}</ApprovedRoute> },
      {
        path: 'pipeline',
        element: (
          <ApprovedRoute>
            <InvestorOnlyDashboardRoute>
              {withSuspense(PipelinePage)}
            </InvestorOnlyDashboardRoute>
          </ApprovedRoute>
        ),
      },
      { path: 'portfolio', element: <ApprovedRoute>{withSuspense(PortfolioPage)}</ApprovedRoute> },
      { path: 'investor-profile', element: <ApprovedRoute>{withSuspense(InvestorProfilePage)}</ApprovedRoute> },
      { path: 'my-listing', element: <ApprovedRoute><FounderOnlyDashboardRoute>{withSuspense(MyListingPage)}</FounderOnlyDashboardRoute></ApprovedRoute> },
      { path: 'browse-investors', element: <ApprovedRoute><FounderOnlyDashboardRoute>{withSuspense(BrowseInvestorsPage)}</FounderOnlyDashboardRoute></ApprovedRoute> },
      { path: 'ask-ai', element: <ApprovedRoute>{withSuspense(AIChatPage)}</ApprovedRoute> },
      { path: 'news-feed', element: <ApprovedRoute>{withSuspense(NewsFeedPage)}</ApprovedRoute> },
      // { path: 'trending', element: <ApprovedRoute>{withSuspense(TrendingFeedPage)}</ApprovedRoute> }, // Trending: hidden
      { path: 'funding-tracker', element: <ApprovedRoute>{withSuspense(FundingTrackerPage)}</ApprovedRoute> },
      { path: 'events', element: <ApprovedRoute>{withSuspense(EventsPage)}</ApprovedRoute> },
      { path: 'grants', element: <ApprovedRoute>{withSuspense(GrantsPage)}</ApprovedRoute> },
      { path: 'settings', element: <ApprovedRoute>{withSuspense(SettingsPage)}</ApprovedRoute> },
      // API Keys route is disabled. Anyone deep-linking to /dashboard/api-keys
      // is redirected back to the dashboard home.
      { path: 'api-keys', element: <Navigate to="/dashboard" replace /> },
      // { path: 'api-keys', element: withSuspense(APIKeysPage) },
      { path: 'watchlist', element: <ApprovedRoute>{withSuspense(InvestorCRMPage)}</ApprovedRoute> },
      { path: 'calendar-callback', element: withSuspense(CalendarCallbackPage) },
      { path: 'deal-rooms', element: <ApprovedRoute>{withSuspense(DealRoomPage)}</ApprovedRoute> },
      { path: 'deal-rooms/:id', element: <ApprovedRoute>{withSuspense(DealRoomDetailPage)}</ApprovedRoute> },
      // { path: 'term-sheets', element: <ApprovedRoute>{withSuspense(TermSheetsPage)}</ApprovedRoute> }, // Term Sheets: DISABLED
      { path: 'dd-checklist', element: <ApprovedRoute>{withSuspense(DDChecklistPage)}</ApprovedRoute> },
      { path: 'dd-checklist/:id', element: <ApprovedRoute>{withSuspense(DDChecklistDetailPage)}</ApprovedRoute> },
      { path: 'partnership-intros', element: <ApprovedRoute>{withSuspense(PartnershipIntrosPage)}</ApprovedRoute> },
      { path: 'co-invest', element: <ApprovedRoute>{withSuspense(CoInvestPage)}</ApprovedRoute> },
      { path: 'notifications', element: <ApprovedRoute>{withSuspense(DashboardNotificationsPage)}</ApprovedRoute> },
    ],
  },
  // ─── Incubation Admin Portal ─────────────────────────────────
  {
    path: '/incubation',
    errorElement: <RouteErrorPage />,
    element: (
      <ProtectedRoute requireOnboarding={true}>
        <IncubationAdminRoute>
          <IncubationLayout />
        </IncubationAdminRoute>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(IncubationDashboardPage) },
      { path: 'founders',          element: withSuspense(IncubationFoundersPage) },
      { path: 'news-events',       element: withSuspense(IncubationNewsEventsPage) },
      { path: 'due-diligence',     element: <Navigate to="/incubation" replace /> },
      { path: 'settings',          element: <IncubationAdminRoute>{withSuspense(IncubationSettingsPage)}</IncubationAdminRoute> },
      { path: 'introductions',     element: withSuspense(IncubationIntroductionsPage) },
      { path: 'watchlist',         element: withSuspense(InvestorCRMPage) },
      { path: 'events',            element: withSuspense(EventsPage) },
      { path: 'grants',            element: withSuspense(GrantsPage) },
      { path: 'news-feed',         element: withSuspense(NewsFeedPage) },
      { path: 'funding-tracker',   element: withSuspense(FundingTrackerPage) },
      { path: 'ask-ai',            element: withSuspense(AIChatPage) },
      { path: 'browse-investors',  element: withSuspense(BrowseInvestorsPage) },
    ],
  },
  // ─── Public invite-accept page (no auth required) ─────────────────
  {
    path: '/invite/:token',
    element: withSuspense(InviteAcceptPage),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
    errorElement: <RouteErrorPage />,
  },
])
