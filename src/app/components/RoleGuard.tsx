import { Navigate } from 'react-router-dom'
import type { AccessRole } from '@/app/lib/types'
import { useRole } from '@/app/hooks/useRole'

interface RoleGuardProps {
  allowedRoles: AccessRole[]
  children: React.ReactNode
  redirectTo?: string
  showAccessDenied?: boolean
}

export function RoleGuard({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
  showAccessDenied = false,
}: RoleGuardProps) {
  const { role, isLoading } = useRole()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center min-h-screen px-6" style={{ background: 'var(--bg)' }}>
          <div
            className="max-w-md w-full rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <h1 className="text-2xl font-semibold mb-3" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
              Access Denied
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              You do not have permission to view this page.
            </p>
          </div>
        </div>
      )
    }

    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
