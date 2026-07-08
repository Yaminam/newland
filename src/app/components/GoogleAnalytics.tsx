import { useEffect, useRef } from 'react'
import { useCookieConsent } from '../hooks/useCookieConsent'

/**
 * GA4 Measurement ID.
 * Set VITE_GA4_ID in your .env file (e.g. VITE_GA4_ID=G-XXXXXXXXXX).
 */
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_ID as string | undefined

/**
 * Consent-gated Google Analytics 4 loader.
 *
 * - Only loads the gtag.js script when the user has accepted analytics cookies.
 * - Uses gtag consent mode v2: starts with `denied`, upgrades to `granted`.
 * - Tracks SPA page views via History API monkey-patching (no router dependency).
 * - Render this component anywhere — it renders nothing and has no router dependency.
 */
export function GoogleAnalytics() {
  const { analyticsAllowed } = useCookieConsent()
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !analyticsAllowed || scriptLoaded.current) return

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || []
    function gtag(...args: unknown[]) { window.dataLayer!.push(args) }
    window.gtag = gtag

    // Consent mode v2: start denied, then grant analytics
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    gtag('consent', 'update', { analytics_storage: 'granted' })

    gtag('js', new Date())
    gtag('config', GA_MEASUREMENT_ID, { send_page_view: true })

    // Load the script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.async = true
    document.head.appendChild(script)
    scriptLoaded.current = true

    // Track SPA navigations — GA4 auto-detects History API changes
    // when `send_page_view: true`, but we add a listener as fallback.
    const onNav = () => {
      window.gtag?.('event', 'page_view', {
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      })
    }
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [analyticsAllowed])

  return null
}

// Global type augmentation for gtag
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
