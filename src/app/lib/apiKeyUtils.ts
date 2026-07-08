const API_KEY_PREFIX = 'cc_live_'
const MASK_VISIBLE_CHARS = 12
const RANDOM_HEX_BYTES = 24

function assertCryptoAvailable() {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error('Secure crypto is not available in this environment.')
  }
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function generateApiKey() {
  assertCryptoAvailable()
  const bytes = new Uint8Array(RANDOM_HEX_BYTES)
  globalThis.crypto.getRandomValues(bytes)
  return `${API_KEY_PREFIX}${bytesToHex(bytes)}`
}

export async function hashApiKey(key: string) {
  assertCryptoAvailable()
  const encoded = new TextEncoder().encode(key)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
  return bytesToHex(new Uint8Array(digest))
}

export function maskApiKey(key: string) {
  if (key.length <= MASK_VISIBLE_CHARS) {
    return key
  }

  return `${key.slice(0, MASK_VISIBLE_CHARS)}...`
}
