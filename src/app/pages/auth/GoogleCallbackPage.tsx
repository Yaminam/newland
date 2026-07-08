import { useEffect } from 'react'

/**
 * Receives the Google OAuth implicit-flow redirect inside a popup,
 * extracts the id_token from the URL hash, and posts it back to the
 * opener window via postMessage. Then closes itself.
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const idToken = params.get('id_token')

    if (idToken && window.opener) {
      window.opener.postMessage(
        { type: 'google-id-token', token: idToken },
        window.location.origin,
      )
      window.close()
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
      <p>Signing you in...</p>
    </div>
  )
}
