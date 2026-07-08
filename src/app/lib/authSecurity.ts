import type { User } from '@supabase/supabase-js'

type RateLimitConfig = {
  windowMs: number
  maxAttempts: number
  lockoutMs: number
}

type RateLimitRecord = {
  count: number
  firstAttemptAt: number
  lockedUntil: number
}

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  lockoutMs: 15 * 60 * 1000,
}

const PASSWORD_RESET_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 3,
  lockoutMs: 30 * 60 * 1000,
}

const SIGNUP_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxAttempts: 10,
  lockoutMs: 15 * 60 * 1000,
}

// Rate-limit records are kept in localStorage so that lockouts persist
// across tabs and browser restarts within the lockout window.
// sessionStorage was the previous store — it was bypassable by clearing
// a single tab's storage or by opening a fresh tab.
function safeLocalStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function storageKey(action: string, identifier: string) {
  return `founder-central.auth-rate-limit.${action}.${identifier}`
}

function readRateLimitRecord(key: string): RateLimitRecord | null {
  const storage = safeLocalStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) as RateLimitRecord : null
  } catch {
    storage.removeItem(key)
    return null
  }
}

function writeRateLimitRecord(key: string, record: RateLimitRecord | null) {
  const storage = safeLocalStorage()
  if (!storage) return

  if (!record) {
    storage.removeItem(key)
    return
  }

  storage.setItem(key, JSON.stringify(record))
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}s`
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}

function getNormalizedRecord(key: string, config: RateLimitConfig) {
  const now = Date.now()
  const existing = readRateLimitRecord(key)
  if (!existing) return { now, record: null as RateLimitRecord | null }

  if (existing.lockedUntil > now) return { now, record: existing }

  if (existing.firstAttemptAt + config.windowMs <= now) {
    writeRateLimitRecord(key, null)
    return { now, record: null as RateLimitRecord | null }
  }

  return { now, record: existing }
}

function assertAllowed(action: string, identifier: string, config: RateLimitConfig) {
  const key = storageKey(action, identifier)
  const { now, record } = getNormalizedRecord(key, config)
  if (record?.lockedUntil && record.lockedUntil > now) {
    throw new Error(`Too many ${action.replace('-', ' ')} attempts. Try again in ${formatDuration(record.lockedUntil - now)}.`)
  }
}

function recordFailure(action: string, identifier: string, config: RateLimitConfig) {
  const key = storageKey(action, identifier)
  const { now, record } = getNormalizedRecord(key, config)
  const nextCount = (record?.count ?? 0) + 1
  const nextRecord: RateLimitRecord = {
    count: nextCount,
    firstAttemptAt: record?.firstAttemptAt ?? now,
    lockedUntil: nextCount >= config.maxAttempts ? now + config.lockoutMs : 0,
  }
  writeRateLimitRecord(key, nextRecord)
}

function clearFailures(action: string, identifier: string) {
  writeRateLimitRecord(storageKey(action, identifier), null)
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isEmailVerified(user: Pick<User, 'email_confirmed_at'> | null | undefined) {
  return Boolean(user?.email_confirmed_at)
}

export function assertLoginAllowed(email: string) {
  assertAllowed('login', normalizeEmail(email), LOGIN_RATE_LIMIT)
}

export function recordLoginFailure(email: string) {
  recordFailure('login', normalizeEmail(email), LOGIN_RATE_LIMIT)
}

export function clearLoginFailures(email: string) {
  clearFailures('login', normalizeEmail(email))
}

export function assertPasswordResetAllowed(email: string) {
  assertAllowed('password-reset', normalizeEmail(email), PASSWORD_RESET_RATE_LIMIT)
}

export function recordPasswordResetAttempt(email: string) {
  recordFailure('password-reset', normalizeEmail(email), PASSWORD_RESET_RATE_LIMIT)
}

export function assertSignupAllowed(email: string) {
  assertAllowed('signup', normalizeEmail(email), SIGNUP_RATE_LIMIT)
}

export function recordSignupAttempt(email: string) {
  recordFailure('signup', normalizeEmail(email), SIGNUP_RATE_LIMIT)
}

export function clearSignupAttempts(email: string) {
  clearFailures('signup', normalizeEmail(email))
}
