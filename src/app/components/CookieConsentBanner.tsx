import { useState } from 'react'
import { Cookie, ChevronDown, ChevronUp } from 'lucide-react'
import { useCookieConsent } from '../hooks/useCookieConsent'

export function CookieConsentBanner() {
  const { hasAnswered, saveConsent } = useCookieConsent()
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  if (hasAnswered) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6">
      <div
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl border p-4 shadow-2xl sm:rounded-[24px] sm:p-5"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--line)',
          boxShadow: '0 18px 48px rgba(15,23,42,0.25)',
          backdropFilter: 'blur(18px)',
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: '#DBEAFE', color: 'var(--blue-h)' }}
              >
                <Cookie className="h-4 w-4" />
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
              >
                Cookie preferences
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: 'var(--muted)' }}>
                We use essential cookies to keep the platform secure. With your permission, we also use analytics
                cookies to improve the experience.{' '}
                <a href="/privacy-policy" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                  Privacy Policy
                </a>
              </p>

              {/* Granular controls toggle */}
              <button
                type="button"
                onClick={() => setShowDetails(d => !d)}
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Customize {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showDetails && (
                <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 12 }}>
                  {/* Essential — always on */}
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked disabled className="mt-0.5" style={{ accentColor: 'var(--blue)' }} />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Essential</span>
                      <p className="text-xs" style={{ color: 'var(--muted-2)', marginTop: 2 }}>
                        Authentication, security, and core functionality. Always active.
                      </p>
                    </div>
                  </label>

                  {/* Analytics */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={e => setAnalytics(e.target.checked)}
                      className="mt-0.5"
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Analytics</span>
                      <p className="text-xs" style={{ color: 'var(--muted-2)', marginTop: 2 }}>
                        Google Analytics to understand page views, feature usage, and improve the product. No personal data is shared with advertisers.
                      </p>
                    </div>
                  </label>

                  {/* Marketing */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketing}
                      onChange={e => setMarketing(e.target.checked)}
                      className="mt-0.5"
                      style={{ accentColor: 'var(--blue)' }}
                    />
                    <div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Marketing</span>
                      <p className="text-xs" style={{ color: 'var(--muted-2)', marginTop: 2 }}>
                        Advertising pixels for retargeting and campaign measurement. Currently not in use.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 sm:flex-row sm:gap-3 md:shrink-0">
            <button
              type="button"
              onClick={() => saveConsent(false, false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border px-4 text-xs font-semibold transition-colors sm:h-10 sm:rounded-xl sm:px-5 sm:text-sm"
              style={{ borderColor: 'var(--faint)', color: 'var(--muted)', background: 'var(--surface)' }}
            >
              Essential Only
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={() => saveConsent(analytics, marketing)}
                className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white transition-colors sm:h-10 sm:rounded-xl sm:px-5 sm:text-sm"
                style={{ background: 'var(--blue)', boxShadow: '0 8px 24px rgba(37,99,235,0.24)' }}
              >
                Save Preferences
              </button>
            ) : (
              <button
                type="button"
                onClick={() => saveConsent(true, true)}
                className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white transition-colors sm:h-10 sm:rounded-xl sm:px-5 sm:text-sm"
                style={{ background: 'var(--blue)', boxShadow: '0 8px 24px rgba(37,99,235,0.24)' }}
              >
                Accept All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
