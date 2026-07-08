import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Mail, Shield, LogOut, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'
import { SEO } from '@/app/components/SEO'

export function ProfileUnderReviewPage() {
  const { profile, logout, refreshProfile, profileApproved } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role === 'investor' ? 'investor' : 'founder'
  const [checking, setChecking] = useState(false)

  // Poll every 30s for approval
  useEffect(() => {
    const id = setInterval(() => void refreshProfile(), 30_000)
    return () => clearInterval(id)
  }, [refreshProfile])

  // Redirect when approved
  useEffect(() => {
    if (profileApproved) navigate('/dashboard', { replace: true })
  }, [profileApproved, navigate])

  const handleCheck = useCallback(async () => {
    setChecking(true)
    try { await refreshProfile() } finally { setChecking(false) }
  }, [refreshProfile])

  return (
    <>
      <SEO title="Profile Under Review" path="/dashboard/under-review" noindex />
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg text-center"
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'color-mix(in srgb, var(--warn) 12%, transparent)',
              border: '2px solid color-mix(in srgb, var(--warn) 30%, transparent)',
            }}
          >
            <Clock className="w-10 h-10" style={{ color: 'var(--warn)' }} />
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
          >
            Profile Under Review
          </h1>

          {/* Message */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
            Thank you for completing your {role} profile! Our team is reviewing
            your details to ensure a high-quality experience for everyone on the
            platform. This usually takes <strong style={{ color: 'var(--ink)' }}>2-3 business days</strong>.
          </p>

          {/* Status card */}
          <div className="card rounded-2xl p-5 mb-6 text-left">
            <h3
              className="text-xs font-semibold uppercase mb-4"
              style={{ color: 'var(--muted)', letterSpacing: 'var(--tracking-wider)' }}
            >
              What happens next?
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'color-mix(in srgb, var(--blue) 10%, transparent)' }}
                >
                  <Shield className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    Admin Review
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>
                    Our team verifies your profile details and credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'color-mix(in srgb, var(--pos) 10%, transparent)' }}
                >
                  <Mail className="w-4 h-4" style={{ color: 'var(--pos)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    You'll be notified
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-2)' }}>
                    Once approved, you'll receive a notification and gain full access to the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{
              background: 'color-mix(in srgb, var(--warn) 10%, transparent)',
              color: 'var(--warn)',
              border: '1px solid color-mix(in srgb, var(--warn) 25%, transparent)',
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </div>

          {/* Check status button */}
          <button
            onClick={() => void handleCheck()}
            disabled={checking}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all mb-4 w-full justify-center"
            style={{
              background: 'var(--blue)',
              color: 'white',
              opacity: checking ? 0.6 : 1,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check status'}
          </button>

          {/* Sign out link */}
          <div>
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--muted-2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted-2)' }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}
