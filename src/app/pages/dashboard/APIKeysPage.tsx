import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Copy, KeyRound, RefreshCcw, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { generateApiKey, hashApiKey } from '@/app/lib/apiKeyUtils'
import { useAuth } from '@/app/context/AuthContext'

interface ApiKeyRecord {
  id: string
  user_id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  revoked_at: string | null
}

interface NewlyIssuedKey {
  id: string
  key: string
  name: string
}

function formatDateTime(value: string | null) {
  if (!value) return 'Never'
  return format(new Date(value), 'MMM d, yyyy h:mm a')
}

function getKeyStatus(key: ApiKeyRecord) {
  if (key.revoked_at || !key.is_active) return 'Revoked'
  if (key.expires_at && new Date(key.expires_at).getTime() <= Date.now()) return 'Expired'
  return 'Active'
}

function statusStyles(status: string) {
  if (status === 'Active') {
    return { background: 'rgba(16,185,129,0.12)', color: '#047857' }
  }

  if (status === 'Expired') {
    return { background: 'rgba(245,158,11,0.14)', color: '#B45309' }
  }

  return { background: 'rgba(239,68,68,0.12)', color: '#B91C1C' }
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value)
}

function logApiKeyErrorDetails(error: unknown) {
  console.error('[APIKeysPage] Full error details:', {
    code: (error as { code?: string } | null | undefined)?.code,
    message: (error as { message?: string } | null | undefined)?.message,
    details: (error as { details?: string } | null | undefined)?.details,
    hint: (error as { hint?: string } | null | undefined)?.hint,
  })
}

// ─── API Keys page: DISABLED ──────────────────────────────────────────
// The feature is hidden from the product but the component is preserved so
// re-enabling is a comment flip in routes.tsx + DashboardLayout.tsx. The
// exported function below short-circuits to a "feature disabled" card so
// that even if someone reaches this render path via a stale bundle, hot
// import, or explicit deep-link, no network calls go out.
export function APIKeysPage() {
  return (
    <div className="pb-6 space-y-6">
      <div
        className="rounded-3xl p-8 text-center"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--sh-2)',
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}
        >
          <KeyRound className="w-5 h-5" />
        </div>
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
        >
          API Keys are unavailable
        </h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--muted-2)' }}>
          This feature is temporarily disabled. Previously-issued keys continue to work for any
          external integrations you&apos;ve configured.
        </p>
      </div>
    </div>
  )
}

// Implementation preserved below but unreachable. Remove the _ prefix and the
// early-return above to re-enable.
function _APIKeysPageImpl() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [rotatingId, setRotatingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [issuedKey, setIssuedKey] = useState<NewlyIssuedKey | null>(null)

  const activeCount = useMemo(
    () => apiKeys.filter(key => getKeyStatus(key) === 'Active').length,
    [apiKeys],
  )

  async function loadApiKeys() {
    if (!user?.id) {
      setApiKeys([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, key_prefix, is_active, last_used_at, expires_at, created_at, revoked_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load API keys.')
      setLoading(false)
      return
    }

    setApiKeys((data ?? []) as ApiKeyRecord[])
    setLoading(false)
  }

  useEffect(() => {
    void loadApiKeys()
  }, [user?.id])

  async function createApiKey() {
    if (!user?.id) {
      console.error('[APIKeysPage] Create API key attempted without authenticated user')
      toast.error('You must be signed in to create API keys.')
      return
    }

    const trimmedName = newKeyName.trim()
    if (!trimmedName) {
      toast.error('Enter a label for this API key.')
      return
    }

    setCreating(true)
    setIssuedKey(null)

    try {
      const plainKey = generateApiKey()
      const keyHash = await hashApiKey(plainKey)
      const keyPrefix = plainKey.slice(0, 8)


      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: trimmedName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
        })
        .select('id, name')
        .single()

      if (error) {
        logApiKeyErrorDetails(error)
        throw error
      }

      setIssuedKey({
        id: data.id as string,
        key: plainKey,
        name: data.name as string,
      })
      setNewKeyName('')
      toast.success('API key created.')
      await loadApiKeys()
    } catch (error) {
      logApiKeyErrorDetails(error)
      const message = error instanceof Error ? error.message : 'Failed to create API key.'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  async function rotateKey(key: ApiKeyRecord) {
    if (!user?.id) return

    const confirmed = window.confirm(`Rotate "${key.name}"? The current key will stop working once the new key is issued.`)
    if (!confirmed) return

    setRotatingId(key.id)
    setIssuedKey(null)

    try {
      const nextKey = generateApiKey()
      const nextHash = await hashApiKey(nextKey)

      const { data: createdKey, error: createError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: `${key.name} (Rotated)`,
          key_hash: nextHash,
          key_prefix: nextKey.slice(0, 8),
        })
        .select('id, name')
        .single()

      if (createError) {
        throw createError
      }

      const revokePayload = {
        is_active: false,
        revoked_at: new Date().toISOString(),
      }

      const { error: revokeError } = await supabase
        .from('api_keys')
        .update(revokePayload)
        .eq('id', key.id)
        .eq('user_id', user.id)

      if (revokeError) {
        await supabase
          .from('api_keys')
          .update(revokePayload)
          .eq('id', createdKey.id as string)
          .eq('user_id', user.id)
        throw revokeError
      }

      setIssuedKey({
        id: createdKey.id as string,
        key: nextKey,
        name: createdKey.name as string,
      })
      toast.success('API key rotated.')
      await loadApiKeys()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rotate API key.')
    } finally {
      setRotatingId(null)
    }
  }

  async function revokeKey(key: ApiKeyRecord) {
    if (!user?.id) return

    const confirmed = window.confirm(`Revoke "${key.name}"? This key will stop working immediately.`)
    if (!confirmed) return

    setRevokingId(key.id)

    const { error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', key.id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to revoke API key.')
      setRevokingId(null)
      return
    }

    toast.success('API key revoked.')
    await loadApiKeys()
    setRevokingId(null)
  }

  return (
    <div className="pb-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>API Keys</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-2)' }}>
              Generate, rotate, and revoke personal API keys for your integrations.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {activeCount} active key{activeCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </motion.div>

      {issuedKey && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: '#FEFCE8', border: '1px solid #FDE68A' }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#854D0E' }}>Copy this key now - it will never be shown again.</p>
              <p className="text-xs mt-1" style={{ color: '#A16207' }}>
                Store it in your secret manager or integration settings before leaving this page.
              </p>
              <div
                className="mt-3 rounded-xl px-4 py-3 font-mono text-sm break-all"
                style={{ background: 'var(--surface)', border: '1px solid #FCD34D', color: 'var(--ink)' }}
              >
                {issuedKey.key}
              </div>
            </div>
            <button
              onClick={() => {
                void copyText(issuedKey.key)
                  .then(() => toast.success('API key copied to clipboard.'))
                  .catch(() => toast.error('Clipboard access failed.'))
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              style={{ background: 'var(--blue)', color: 'var(--surface)' }}
            >
              <Copy className="w-4 h-4" />
              Copy Key
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--blue)' }}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Create New API Key</h2>
              <p className="text-sm" style={{ color: 'var(--muted-2)' }}>
                Label this key so you can identify where it is used.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-medium" style={{ color: 'var(--muted-2)' }}>
              Key Name / Label
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={event => setNewKeyName(event.target.value)}
              placeholder="My Integration"
              maxLength={120}
              className="w-full rounded-xl px-4 py-3 text-sm outline-0"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
            <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
              Only the hashed key is stored. FounderCentral never stores plaintext API keys after issuance.
            </p>
            <button
              onClick={() => void createApiKey()}
              disabled={creating}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity"
              style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: creating ? 0.7 : 1 }}
            >
              {creating ? 'Creating Key...' : 'Create New API Key'}
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Your API Keys</h2>
              <p className="text-sm" style={{ color: 'var(--muted-2)' }}>
                Rotate keys regularly and revoke anything you no longer use.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl"
                  style={{ background: 'var(--surface-2)' }}
                />
              ))
            ) : apiKeys.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-8 text-center"
                style={{ background: 'var(--surface-2)', border: '1px dashed var(--line)' }}
              >
                <ShieldX className="w-8 h-8 mx-auto" style={{ color: 'var(--muted-2)' }} />
                <p className="mt-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>No API keys yet.</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--muted-2)' }}>
                  Create your first key to connect external tools or private integrations.
                </p>
              </div>
            ) : (
              apiKeys.map(key => {
                const status = getKeyStatus(key)
                const statusStyle = statusStyles(status)

                return (
                  <div
                    key={key.id}
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{key.name}</p>
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={statusStyle}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                          <span style={{ color: 'var(--muted-2)' }}>
                            Key Prefix: <span style={{ color: 'var(--ink)' }}>{key.key_prefix}...</span>
                          </span>
                          <span style={{ color: 'var(--muted-2)' }}>
                            Created: <span style={{ color: 'var(--ink)' }}>{formatDateTime(key.created_at)}</span>
                          </span>
                          <span style={{ color: 'var(--muted-2)' }}>
                            Last Used: <span style={{ color: 'var(--ink)' }}>{formatDateTime(key.last_used_at)}</span>
                          </span>
                          <span style={{ color: 'var(--muted-2)' }}>
                            Expires: <span style={{ color: 'var(--ink)' }}>{key.expires_at ? formatDateTime(key.expires_at) : 'No expiry'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void rotateKey(key)}
                          disabled={status !== 'Active' || rotatingId === key.id}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity"
                          style={{
                            background: 'var(--blue-bg)',
                            color: 'var(--blue-h)',
                            opacity: status !== 'Active' || rotatingId === key.id ? 0.5 : 1,
                          }}
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          {rotatingId === key.id ? 'Rotating...' : 'Rotate Key'}
                        </button>
                        <button
                          onClick={() => void revokeKey(key)}
                          disabled={status !== 'Active' || revokingId === key.id}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity"
                          style={{
                            background: 'var(--neg-bg)',
                            color: '#B91C1C',
                            opacity: status !== 'Active' || revokingId === key.id ? 0.5 : 1,
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {revokingId === key.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
