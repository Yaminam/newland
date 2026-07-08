import { useCallback, useEffect, useState } from 'react'

export const COOKIE_CONSENT_STORAGE_KEY = 'founder-central-cookie-consent'

/** Consent version — bump this to re-ask users when the policy changes. */
export const CONSENT_VERSION = 1

export interface CookieConsentState {
  version: number
  analytics: boolean
  marketing: boolean
  timestamp: string // ISO 8601
}

// Legacy values were 'accepted' | 'rejected' strings — migrate them.
function readStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
    if (!raw) return null

    // Migrate old binary format
    if (raw === 'accepted') {
      const migrated: CookieConsentState = { version: CONSENT_VERSION, analytics: true, marketing: true, timestamp: new Date().toISOString() }
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    if (raw === 'rejected') {
      const migrated: CookieConsentState = { version: CONSENT_VERSION, analytics: false, marketing: false, timestamp: new Date().toISOString() }
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }

    const parsed = JSON.parse(raw) as CookieConsentState
    // Re-ask if consent version has changed
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<CookieConsentState | null>(() => readStoredConsent())

  useEffect(() => {
    const sync = () => setConsentState(readStoredConsent())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const saveConsent = useCallback((analytics: boolean, marketing: boolean) => {
    const state: CookieConsentState = {
      version: CONSENT_VERSION,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    }
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(state))
    } catch { /* quota exceeded — proceed without persistence */ }
    setConsentState(state)
  }, [])

  const resetConsent = useCallback(() => {
    try { window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY) } catch {}
    setConsentState(null)
  }, [])

  return {
    consent,
    hasAnswered: consent !== null,
    analyticsAllowed: consent?.analytics ?? false,
    marketingAllowed: consent?.marketing ?? false,
    saveConsent,
    resetConsent,
  }
}
