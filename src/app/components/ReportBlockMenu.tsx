import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Flag, Ban, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type Reason = 'spam' | 'harassment' | 'misrepresentation' | 'inappropriate' | 'other'

const REASONS: { value: Reason; label: string }[] = [
  { value: 'spam',              label: 'Spam or scam' },
  { value: 'harassment',        label: 'Harassment or abuse' },
  { value: 'misrepresentation', label: 'Misrepresenting identity' },
  { value: 'inappropriate',     label: 'Inappropriate content' },
  { value: 'other',             label: 'Something else' },
]

interface Props {
  reportedId:   string
  reportedName: string
  onBlocked?:   () => void
}

export function ReportBlockMenu({ reportedId, reportedName, onBlocked }: Props) {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [reportOpen, setReportOpen]   = useState(false)
  const [reason, setReason]           = useState<Reason>('spam')
  const [detail, setDetail]           = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleBlock() {
    setMenuOpen(false)
    const ok = window.confirm(
      `Block ${reportedName}? They will be hidden from your browse and will not see you either. You can undo this from Settings → Privacy.`,
    )
    if (!ok) return
    const { error } = await supabase.from('user_blocks').insert({ blocked_id: reportedId })
    if (error) {
      console.warn('[block] failed:', error.message)
      toast.error('Could not block. Please try again.')
      return
    }
    toast.success(`${reportedName} has been blocked.`)
    onBlocked?.()
  }

  async function handleSubmitReport() {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('user_reports').insert({
        reporter_id: user.id,
        reported_id: reportedId,
        reason,
        detail: detail.trim() || null,
      })
      if (error) throw error
      setReportOpen(false)
      setDetail('')
      toast.success('Report submitted. Our team will review within 48 hours.')
    } catch (e) {
      console.warn('[report] failed:', e)
      toast.error('Could not submit the report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="More actions"
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--muted-2)',
            border: '1px solid var(--line)',
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-10 w-56 rounded-xl overflow-hidden z-50"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: 'var(--ink)' }}
              >
                <Flag className="w-4 h-4" />
                <span>Report {reportedName}</span>
              </button>
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                style={{ color: 'var(--neg)', borderTop: '1px solid var(--line)' }}
              >
                <Ban className="w-4 h-4" />
                <span>Block {reportedName}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop"
            onClick={() => setReportOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl w-full max-w-md mx-4 p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                  Report {reportedName}
                </h3>
                <button onClick={() => setReportOpen(false)} aria-label="Close">
                  <X className="w-4 h-4" style={{ color: 'var(--muted-2)' }} />
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--muted-2)' }}>
                What's the issue?
              </p>

              <div className="space-y-1 mb-4">
                {REASONS.map(r => (
                  <label
                    key={r.value}
                    className="flex items-center gap-2 py-1.5 cursor-pointer"
                    style={{ color: 'var(--ink)' }}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                    />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Anything else we should know? (optional)"
                className="w-full rounded-xl px-3 py-2 text-sm outline-0 mb-4"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setReportOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    background: 'var(--surface-2)',
                    color: 'var(--muted)',
                    border: '1px solid var(--line)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                  style={{ background: 'var(--blue)', color: 'var(--surface)', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
