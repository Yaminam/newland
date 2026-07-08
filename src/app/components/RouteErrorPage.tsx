import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from 'lucide-react'

export function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  let status: number | null = null
  let title = 'Something went wrong'
  let message = 'An unexpected error occurred. Please try again.'

  if (isRouteErrorResponse(error)) {
    status = error.status
    if (error.status === 404) {
      title = 'Page not found'
      message = "The page you're looking for doesn't exist or has been moved."
    } else if (error.status === 401 || error.status === 403) {
      title = 'Access denied'
      message = "You don't have permission to view this page."
    } else if (error.status === 500) {
      title = 'Server error'
      message = 'Something went wrong on our end. Please try again in a moment.'
    } else {
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertTriangle className="w-9 h-9" style={{ color: 'var(--neg)' }} />
        </div>

        {/* Status badge */}
        {status && (
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest"
            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--neg)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {status}
          </span>
        )}

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            {title}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-2)' }}>
            {message}
          </p>
        </div>

        {/* Dev error detail */}
        {import.meta.env.DEV && error instanceof Error && error.stack && (
          <pre
            className="text-left text-xs p-4 rounded-xl overflow-x-auto"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: '#f87171',
              maxHeight: '160px',
              overflowY: 'auto',
            }}
          >
            {error.stack}
          </pre>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Go back
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--blue)', color: 'var(--surface)' }}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
