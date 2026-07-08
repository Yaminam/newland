import { useEffect, useState } from 'react'
import { useCRM } from '@/app/hooks/useCRM'

/**
 * OAuth callback page for Google/Outlook calendar integration.
 * Receives the auth code from the OAuth popup redirect, exchanges it,
 * then closes the popup window.
 */
export function CalendarCallbackPage() {
  const { exchangeCalendarCode } = useCRM()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Connecting your calendar...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    if (errorParam) {
      setStatus('error')
      setMessage(`Authorization failed: ${errorParam}`)
      setTimeout(() => window.close(), 3000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('No authorization code received.')
      setTimeout(() => window.close(), 3000)
      return
    }

    // Detect provider from the URL or referrer
    const isGoogle = window.location.href.includes('scope=') ||
                     document.referrer.includes('google') ||
                     params.get('scope')?.includes('calendar')
    const provider = isGoogle ? 'google' as const : 'outlook' as const

    exchangeCalendarCode(provider, code)
      .then((result) => {
        if (result?.error) {
          setStatus('error')
          setMessage(`Failed: ${result.error}`)
        } else {
          setStatus('success')
          setMessage('Calendar connected successfully! This window will close.')
          // Notify the opener window
          if (window.opener) {
            window.opener.postMessage({ type: 'calendar-connected', provider }, '*')
          }
        }
        setTimeout(() => window.close(), 2000)
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
        setTimeout(() => window.close(), 3000)
      })
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="p-8 rounded-[var(--r-lg)] text-center max-w-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
      >
        {status === 'processing' && (
          <div className="w-8 h-8 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--pos-bg, #dcfce7)' }}
          >
            <span className="text-[20px]">&#10003;</span>
          </div>
        )}
        {status === 'error' && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--neg-bg, #fee2e2)' }}
          >
            <span className="text-[20px]">&#10007;</span>
          </div>
        )}
        <p className="text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
          {message}
        </p>
      </div>
    </div>
  )
}
