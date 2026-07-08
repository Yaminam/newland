import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
  requireApproval?: boolean
  unauthRedirect?: string
}

export function ProtectedRoute({
  children,
  requireOnboarding = true,
  requireApproval = false,
  unauthRedirect = '/auth/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, onboardingCompleted, profileApproved, isLoading, user, profile } = useAuth()

  // Treat "session established but profile not yet fetched" as loading.
  // Without this, the post-login render sees profile=null → onboardingCompleted=false
  // and bounces to /onboarding for ~1 frame before fetchProfile resolves.
  const profilePending = !!user && !profile

  if (isLoading || profilePending) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={unauthRedirect} replace />
  }

  if (requireOnboarding && !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  // FC admins and incubation admins bypass the approval gate
  const isAdmin = profile?.access_role === 'admin' || profile?.access_role === 'incubation_admin'

  if (requireApproval && !profileApproved && !isAdmin) {
    return <Navigate to="/dashboard/under-review" replace />
  }

  return <>{children}</>
}
