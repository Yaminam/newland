// Normalize Supabase storage URLs stored on profile rows.
//
// Over time the `avatar_url` column has accumulated a mix of formats:
//   - OAuth URLs from Google / LinkedIn (e.g. https://lh3.googleusercontent.com/...)
//   - Correct public URLs (/storage/v1/object/public/avatars/<path>)
//   - Legacy authenticated-endpoint URLs (/storage/v1/object/avatars/<path>) — 400 in the browser
//   - Legacy doubled-path URLs (/storage/v1/object/public/avatars/avatars/<path>) — 400 in the browser
//
// This helper takes whatever is in the DB and returns a browser-loadable URL,
// or null if the input doesn't parse.

const PUBLIC_BUCKETS = ['avatars', 'reports', 'bug-screenshots']

export function normalizeAvatarUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url = raw.trim()
  if (!url) return null

  // Not a Supabase storage URL — pass through (OAuth avatars, custom CDN, etc.)
  if (!url.includes('/storage/v1/object/')) return url

  // Insert `/public/` if missing: /object/avatars/... -> /object/public/avatars/...
  for (const bucket of PUBLIC_BUCKETS) {
    const authEndpoint = `/storage/v1/object/${bucket}/`
    const publicEndpoint = `/storage/v1/object/public/${bucket}/`
    if (url.includes(authEndpoint) && !url.includes(publicEndpoint)) {
      url = url.replace(authEndpoint, publicEndpoint)
    }
  }

  // Collapse the legacy doubled-bucket path: /public/avatars/avatars/<id>.png -> /public/avatars/<id>.png
  for (const bucket of PUBLIC_BUCKETS) {
    const doubled = `/storage/v1/object/public/${bucket}/${bucket}/`
    const single = `/storage/v1/object/public/${bucket}/`
    if (url.includes(doubled)) {
      url = url.replace(doubled, single)
    }
  }

  return url
}
