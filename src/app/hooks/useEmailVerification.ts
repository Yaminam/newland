import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/app/lib/supabase'

const BASE_COOLDOWN_SECONDS = 60
const MAX_RETRIES = 3

export function useEmailVerification(email: string | null | undefined) {
  const [isResending, setIsResending] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(BASE_COOLDOWN_SECONDS)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timerId = window.setTimeout(() => {
      setCooldownSeconds(current => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [cooldownSeconds])

  const retriesLeft = useMemo(() => Math.max(0, MAX_RETRIES - failedAttempts), [failedAttempts])

  const resend = useCallback(async () => {
    if (!email) {
      setError('We could not determine which email address to verify.')
      setSuccess(null)
      return
    }

    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds}s before requesting another verification email.`)
      setSuccess(null)
      return
    }

    if (failedAttempts >= MAX_RETRIES) {
      setError('Maximum resend retries reached. Please wait and try again later or contact support.')
      setSuccess(null)
      return
    }

    setIsResending(true)
    setError(null)
    setSuccess(null)

    try {
      const appUrl = import.meta.env.VITE_APP_URL as string | undefined
      if (!appUrl && import.meta.env.PROD) {
        throw new Error('VITE_APP_URL must be set in production')
      }

      const redirectBase = appUrl ?? window.location.origin
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${redirectBase}/auth/login`,
        },
      })

      if (resendError) {
        throw resendError
      }

      setFailedAttempts(0)
      setCooldownSeconds(BASE_COOLDOWN_SECONDS)
      setSuccess('A new verification email has been sent.')
    } catch (err: unknown) {
      const nextFailedAttempts = failedAttempts + 1
      const backoffSeconds = BASE_COOLDOWN_SECONDS * (2 ** nextFailedAttempts)
      const message = err instanceof Error ? err.message : 'Failed to resend verification email.'

      setFailedAttempts(nextFailedAttempts)
      setCooldownSeconds(backoffSeconds)
      setError(`${message} Please wait ${backoffSeconds}s before retrying.`)
    } finally {
      setIsResending(false)
    }
  }, [cooldownSeconds, email, failedAttempts])

  return {
    resend,
    isResending,
    cooldownSeconds,
    retriesLeft,
    error,
    success,
  }
}
