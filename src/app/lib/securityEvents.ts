export type SecurityEventType =
  | 'auth_login_attempt'
  | 'auth_login_success'
  | 'auth_login_failure'
  | 'auth_signup_attempt'
  | 'auth_signup_success'
  | 'auth_signup_failure'
  | 'auth_password_reset_requested'
  | 'auth_password_reset_failure'
  | 'api_error'
  | 'frontend_error'
  | 'unhandled_rejection'

type SecurityEventPayload = {
  type: SecurityEventType
  outcome?: 'success' | 'failure'
  email?: string
  userId?: string
  route?: string
  message?: string
  statusCode?: number
  metadata?: Record<string, unknown>
}

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase()
}

function canUseNavigatorSendBeacon() {
  return typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function'
}

function securityEventEndpoint(): string | null {
  // Only POST to a collector when one is configured. In local dev this stays
  // empty so we don't spam the Vite server with 404s.
  const url = (import.meta.env.VITE_SECURITY_EVENT_ENDPOINT as string | undefined)?.trim()
  return url && url.length > 0 ? url : null
}

export function logSecurityEvent(payload: SecurityEventPayload) {
  if (typeof window === 'undefined') return

  const endpoint = securityEventEndpoint()
  if (!endpoint) return

  const body = JSON.stringify({
    ...payload,
    email: normalizeEmail(payload.email),
    route: payload.route ?? window.location.pathname,
    timestamp: new Date().toISOString(),
  })

  if (canUseNavigatorSendBeacon()) {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(endpoint, blob)
    return
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function setupGlobalSecurityLogging() {
  if (typeof window === 'undefined') return () => {}

  const handleError = (event: ErrorEvent) => {
    logSecurityEvent({
      type: 'frontend_error',
      outcome: 'failure',
      message: event.message,
      metadata: {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    })
  }

  const handleRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? 'Unknown rejection')
    logSecurityEvent({
      type: 'unhandled_rejection',
      outcome: 'failure',
      message: reason,
    })
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)

  return () => {
    window.removeEventListener('error', handleError)
    window.removeEventListener('unhandledrejection', handleRejection)
  }
}
