import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquarePlus, SmilePlus, Meh, Frown, X } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import type { FeedbackType } from '@/app/lib/types'

const feedbackOptions: Array<{
  type: FeedbackType
  label: string
  icon: typeof SmilePlus
  activeBackground: string
  activeColor: string
}> = [
  { type: 'positive', label: 'Positive', icon: SmilePlus, activeBackground: 'var(--pos-bg)', activeColor: 'var(--pos)' },
  { type: 'neutral', label: 'Neutral', icon: Meh, activeBackground: 'var(--warn-bg)', activeColor: 'var(--warn)' },
  { type: 'negative', label: 'Negative', icon: Frown, activeBackground: 'var(--neg-bg)', activeColor: 'var(--neg)' },
]

export function FeedbackWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('positive')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentPath = useMemo(() => window.location.pathname, [isOpen])

  useEffect(() => {
    if (!successMessage) return

    const timeoutId = window.setTimeout(() => {
      setIsOpen(false)
      setSuccessMessage(null)
      setMessage('')
      setFeedbackType('positive')
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user?.id) {
      setErrorMessage('You need to be signed in to share feedback.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          feedback_type: feedbackType,
          message: message.trim() ? message.trim() : null,
          page_url: window.location.pathname,
        })

      if (error) {
        console.error('[FeedbackWidget] Raw error object:', error)
        console.error('[FeedbackWidget] Full error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        console.error('[FeedbackWidget] Serialized error:', JSON.stringify(error, null, 2))
        throw error
      }

      setSuccessMessage('Thanks for your feedback!')
      setErrorMessage(null)
    } catch (error) {
      console.error('[FeedbackWidget] Raw caught error:', error)
      console.error('[FeedbackWidget] Full error:', {
        code: (error as { code?: string } | null | undefined)?.code,
        message: (error as { message?: string } | null | undefined)?.message,
        details: (error as { details?: string } | null | undefined)?.details,
        hint: (error as { hint?: string } | null | undefined)?.hint,
      })
      console.error('[FeedbackWidget] Serialized caught error:', JSON.stringify(error, null, 2))
      setErrorMessage(error instanceof Error ? error.message : 'We could not submit your feedback right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    if (isSubmitting) return
    setIsOpen(false)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[40] md:bottom-6 md:right-6 inline-flex items-center justify-center rounded-full shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl h-10 w-10 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
        style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(15,23,42,0.10)' }}
      >
        <MessageSquarePlus className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline text-xs font-medium">Feedback</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-slate-950/45"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="fixed inset-x-4 bottom-6 z-[120] mx-auto max-w-lg rounded-[28px] p-6 sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[440px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 24px 64px rgba(15,23,42,0.22)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                    Share Your Feedback
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                    Help us improve this workflow. We&apos;ll attach your feedback to the current page automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <p className="mb-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>Feedback type</p>
                  <div className="grid grid-cols-3 gap-2">
                    {feedbackOptions.map(option => {
                      const Icon = option.icon
                      const isActive = feedbackType === option.type

                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => setFeedbackType(option.type)}
                          className="rounded-2xl px-3 py-3 text-sm font-medium transition-colors"
                          style={{
                            background: isActive ? option.activeBackground : 'var(--surface-2)',
                            color: isActive ? option.activeColor : 'var(--muted)',
                            border: `1px solid ${isActive ? option.activeColor : 'var(--line)'}`,
                          }}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    Tell us more...
                  </label>
                  <textarea
                    value={message}
                    onChange={event => setMessage(event.target.value.slice(0, 500))}
                    rows={5}
                    maxLength={500}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', resize: 'vertical' }}
                    placeholder="What worked well, what felt unclear, or what slowed you down?"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
                    <span>Current page: {currentPath}</span>
                    <span>{message.length}/500</span>
                  </div>
                </div>

                {successMessage && (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--pos-bg)', border: '1px solid var(--pos)', color: 'var(--pos)' }}>
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--neg-bg)', border: '1px solid var(--neg)', color: 'var(--neg)' }}>
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !!successMessage}
                    className="rounded-2xl px-4 py-2.5 text-sm font-semibold transition-opacity"
                    style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: isSubmitting || !!successMessage ? 0.7 : 1 }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
