import { useEffect, useMemo, useState } from 'react'
import { Mail, Clock3, Building2, Send, Bug, ImagePlus, X } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { HeroSection } from '@/app/components/ui/HeroSection'

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Technical Issue',
  'Billing Question',
  'Partnership',
  'Other',
] as const

const BUG_SEVERITIES = [
  { value: 'low', label: 'Low', bg: '#DCFCE7', border: '#86EFAC', color: 'var(--pos)' },
  { value: 'medium', label: 'Medium', bg: '#FEF3C7', border: '#FCD34D', color: '#B45309' },
  { value: 'high', label: 'High', bg: '#FFEDD5', border: '#FDBA74', color: '#C2410C' },
  { value: 'critical', label: 'Critical', bg: '#FEE2E2', border: '#FCA5A5', color: '#B91C1C' },
] as const

type SubjectOption = typeof SUBJECT_OPTIONS[number]
type BugSeverity = typeof BUG_SEVERITIES[number]['value']

type ContactFormState = {
  fullName: string
  email: string
  subject: SubjectOption
  message: string
}

type BugFormState = {
  fullName: string
  email: string
  title: string
  severity: BugSeverity
  description: string
  stepsToReproduce: string
  expectedBehavior: string
  actualBehavior: string
}

const initialFormState: ContactFormState = {
  fullName: '',
  email: '',
  subject: 'General Inquiry',
  message: '',
}

const initialBugFormState: BugFormState = {
  fullName: '',
  email: '',
  title: '',
  severity: 'medium',
  description: '',
  stepsToReproduce: '',
  expectedBehavior: '',
  actualBehavior: '',
}

export function ContactPage() {
  const { user, profile } = useAuth()
  const [mode, setMode] = useState<'message' | 'bug'>('message')
  const [formState, setFormState] = useState<ContactFormState>(initialFormState)
  const [bugFormState, setBugFormState] = useState<BugFormState>(initialBugFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingBug, setIsSubmittingBug] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bugSuccessMessage, setBugSuccessMessage] = useState<string | null>(null)
  const [bugErrorMessage, setBugErrorMessage] = useState<string | null>(null)
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null)

  const prefilledFullName = useMemo(
    () => [profile?.first_name, profile?.last_name].filter(Boolean).join(' '),
    [profile?.first_name, profile?.last_name],
  )

  useEffect(() => {
    setFormState(current => ({
      ...current,
      fullName: current.fullName || prefilledFullName,
      email: current.email || user?.email || profile?.email || '',
    }))
    setBugFormState(current => ({
      ...current,
      fullName: current.fullName || prefilledFullName,
      email: current.email || user?.email || profile?.email || '',
    }))
  }, [prefilledFullName, profile?.email, user?.email])

  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(screenshotFile)
    setScreenshotPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [screenshotFile])

  function updateField<Key extends keyof ContactFormState>(field: Key, value: ContactFormState[Key]) {
    setFormState(current => ({ ...current, [field]: value }))
  }

  function updateBugField<Key extends keyof BugFormState>(field: Key, value: BugFormState[Key]) {
    setBugFormState(current => ({ ...current, [field]: value }))
  }

  function validateEmail(email: string) {
    return /^\S+@\S+\.\S+$/.test(email)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    const fullName = formState.fullName.trim()
    const email = formState.email.trim()
    const message = formState.message.trim()

    if (!fullName) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (!email || !validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (message.length < 20) {
      setErrorMessage('Please provide at least 20 characters so we can help effectively.')
      return
    }

    setIsSubmitting(true)

    try {
      // Route via the support-contact edge function (service_role) so we
      // don't hit anon GRANT / RLS snags on support_tickets.
      const { data, error } = await supabase.functions.invoke('support-contact', {
        body: {
          kind:    'ticket',
          name:    fullName,
          email,
          subject: formState.subject,
          message,
        },
      })

      if (error) {
        console.error('[ContactPage] support-contact invoke error', error)
        throw error
      }
      const resp = data as { success?: boolean; message?: string; error?: string } | null
      if (!resp?.success) {
        throw new Error(resp?.message ?? resp?.error ?? 'Submission failed.')
      }

      setSuccessMessage('Your message has been sent to the FounderCentral support team.')
      setFormState(current => ({
        ...current,
        subject: 'General Inquiry',
        message: '',
      }))
    } catch (error) {
      const fallback = 'We could not submit your request right now. Please email support@foundercentral.in directly.'
      setErrorMessage(error instanceof Error ? error.message || fallback : fallback)
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearScreenshot() {
    setScreenshotFile(null)
  }

  async function handleBugSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBugSuccessMessage(null)
    setBugErrorMessage(null)

    const fullName = bugFormState.fullName.trim()
    const email = bugFormState.email.trim()
    const title = bugFormState.title.trim()
    const description = bugFormState.description.trim()

    if (!fullName) {
      setBugErrorMessage('Please enter your full name.')
      return
    }

    if (!email || !validateEmail(email)) {
      setBugErrorMessage('Please enter a valid email address.')
      return
    }

    if (!title) {
      setBugErrorMessage('Please provide a bug title.')
      return
    }

    if (description.length < 20) {
      setBugErrorMessage('Please describe the bug in at least 20 characters.')
      return
    }

    if (screenshotFile && screenshotFile.size > 5 * 1024 * 1024) {
      setBugErrorMessage('Screenshots must be 5MB or smaller.')
      return
    }

    setIsSubmittingBug(true)

    try {
      let screenshotUrl: string | null = null

      if (screenshotFile) {
        const extension = screenshotFile.name.split('.').pop()?.toLowerCase() || 'png'
        const safeBaseName = screenshotFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const storagePath = `${user?.id ?? 'anonymous'}/${Date.now()}-${safeBaseName}`

        const { error: uploadError } = await supabase.storage
          .from('bug-screenshots')
          .upload(storagePath, screenshotFile, {
            upsert: false,
            contentType: screenshotFile.type || `image/${extension}`,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage
          .from('bug-screenshots')
          .getPublicUrl(storagePath)

        screenshotUrl = publicUrlData.publicUrl
      }

      // Build full description with extra context
      const parts = [description]
      if (bugFormState.expectedBehavior.trim()) parts.push(`\nExpected: ${bugFormState.expectedBehavior.trim()}`)
      if (bugFormState.actualBehavior.trim()) parts.push(`\nActual: ${bugFormState.actualBehavior.trim()}`)
      if (fullName || email) parts.push(`\nReported by: ${fullName} (${email})`)

      const { error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user?.id ?? null,
          title,
          description: parts.join(''),
          severity: bugFormState.severity,
          steps: bugFormState.stepsToReproduce.trim() || null,
          screenshot_url: screenshotUrl,
        })

      if (error) {
        console.error('[ContactPage] Failed to submit bug report', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      setBugSuccessMessage('Bug report submitted successfully. Thank you.')
      setBugFormState(current => ({
        ...current,
        title: '',
        severity: 'medium',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
      }))
      clearScreenshot()
    } catch (error) {
      const fallback = 'We could not submit your bug report right now. Please try again.'
      setBugErrorMessage(error instanceof Error ? error.message || fallback : fallback)
    } finally {
      setIsSubmittingBug(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-6" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-6xl space-y-8">
        <HeroSection
          eyebrow="FounderCentral Support"
          title="We're here to help"
          subtitle="Reach out for product support, billing questions, technical issues, or partnership requests. Our team will route your message to the right person quickly."
        />

        {/* Tab switcher */}
        <div className="inline-flex p-1 gap-1 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {([
            { key: 'message' as const, label: 'Send a message', icon: Mail },
            { key: 'bug' as const, label: 'Report a bug', icon: Bug },
          ]).map(t => {
            const active = mode === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setMode(t.key)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{ background: active ? 'var(--blue)' : 'transparent', color: active ? '#fff' : 'var(--muted)' }}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {mode === 'message' && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section
            className="rounded-3xl p-6 md:p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)' }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Contact our team
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                Submit your details below and we&apos;ll open a support ticket immediately.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Full Name</span>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={event => updateField('fullName', event.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    placeholder="Jane Founder"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Email Address</span>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={event => updateField('email', event.target.value)}
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                    placeholder="jane@company.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Subject</span>
                <select
                  value={formState.subject}
                  onChange={event => updateField('subject', event.target.value as SubjectOption)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                >
                  {SUBJECT_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Message</span>
                <textarea
                  value={formState.message}
                  onChange={event => updateField('message', event.target.value)}
                  minLength={20}
                  rows={7}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', resize: 'vertical' }}
                  placeholder="Tell us what happened, what you expected, and any relevant account or integration details."
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  Minimum 20 characters. Include enough context for faster triage.
                </p>
              </label>

              {successMessage && (
                <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857' }}>
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--neg-bg)', border: '1px solid #FECACA', color: '#B91C1C' }}>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-opacity"
                style={{ background: 'var(--ink)', color: 'var(--surface)', opacity: isSubmitting ? 0.7 : 1 }}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </section>

          <section className="space-y-5">
            <div
              className="rounded-3xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)' }}
            >
              <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Contact information
              </h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5" style={{ color: 'var(--blue)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Support email</p>
                    <a href="mailto:support@foundercentral.in" className="text-sm" style={{ color: 'var(--blue)' }}>
                      support@foundercentral.in
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5" style={{ color: 'var(--blue)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Response time</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>We respond within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5" style={{ color: 'var(--blue)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Business hours</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Monday to Friday, 9:00 AM to 6:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-3xl p-6"
              style={{ background: '#E0F2FE', border: '1px solid #BAE6FD' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#0369A1' }}>
                Need faster routing?
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: '#0C4A6E' }}>
                Choose the subject that best matches your issue. Technical and billing requests are automatically prioritized into the correct queue for follow-up.
              </p>
            </div>
          </section>
        </div>
        )}

        {mode === 'bug' && (
        <section
          className="rounded-3xl p-6 md:p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 18px 45px rgba(15,23,42,0.06)' }}
        >
          <div className="mb-6 flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: '#DBEAFE', color: 'var(--blue-h)' }}
            >
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Report a Bug
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                Found something broken? Let us know and we&apos;ll fix it fast.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleBugSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Full Name</span>
                <input
                  type="text"
                  value={bugFormState.fullName}
                  onChange={event => updateBugField('fullName', event.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  placeholder="Jane Founder"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Email Address</span>
                <input
                  type="email"
                  value={bugFormState.email}
                  onChange={event => updateBugField('email', event.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  placeholder="jane@company.com"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Bug Title</span>
              <input
                type="text"
                value={bugFormState.title}
                onChange={event => updateBugField('title', event.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                placeholder="Example: Save button fails on investor profile"
              />
            </label>

            <div>
              <span className="mb-3 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Severity</span>
              <div className="grid gap-2 sm:grid-cols-4">
                {BUG_SEVERITIES.map(option => {
                  const active = bugFormState.severity === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateBugField('severity', option.value)}
                      className="rounded-full px-4 py-2 text-sm font-semibold transition-opacity"
                      style={{
                        background: active ? option.bg : '#F8FAFC',
                        color: active ? option.color : 'var(--muted)',
                        border: `1px solid ${active ? option.border : 'var(--line)'}`,
                        opacity: active ? 1 : 0.9,
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Description</span>
              <textarea
                value={bugFormState.description}
                onChange={event => updateBugField('description', event.target.value)}
                minLength={20}
                rows={6}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', resize: 'vertical' }}
                placeholder="Describe the issue clearly, including what you were trying to do when it happened."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Steps to Reproduce</span>
              <textarea
                value={bugFormState.stepsToReproduce}
                onChange={event => updateBugField('stepsToReproduce', event.target.value)}
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', resize: 'vertical' }}
                placeholder="Optional: list the exact steps someone can follow to reproduce the issue."
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Expected Behavior</span>
                <input
                  type="text"
                  value={bugFormState.expectedBehavior}
                  onChange={event => updateBugField('expectedBehavior', event.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  placeholder="Optional: what should have happened?"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Actual Behavior</span>
                <input
                  type="text"
                  value={bugFormState.actualBehavior}
                  onChange={event => updateBugField('actualBehavior', event.target.value)}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                  placeholder="Optional: what actually happened?"
                />
              </label>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium" style={{ color: 'var(--muted)' }}>Screenshot Upload</span>
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-8 text-center"
                style={{ borderColor: 'var(--faint)', background: 'var(--surface-2)' }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0] ?? null
                    if (!file) return

                    if (file.size > 5 * 1024 * 1024) {
                      setBugErrorMessage('Screenshots must be 5MB or smaller.')
                      event.currentTarget.value = ''
                      return
                    }

                    setBugErrorMessage(null)
                    setScreenshotFile(file)
                  }}
                />
                <ImagePlus className="h-8 w-8" style={{ color: 'var(--blue)' }} />
                <p className="mt-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>Click to upload a screenshot</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>PNG, JPG, WEBP, or GIF up to 5MB</p>
              </label>

              {screenshotPreviewUrl && (
                <div
                  className="mt-4 rounded-3xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Screenshot Preview</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{screenshotFile?.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearScreenshot}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                      style={{ background: 'var(--neg-bg)', color: '#B91C1C' }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <img
                    src={screenshotPreviewUrl}
                    alt="Bug report screenshot preview"
                    className="mt-4 max-h-72 w-full rounded-2xl object-contain"
                    style={{ background: 'var(--surface-2)' }}
                  />
                </div>
              )}
            </div>

            {bugSuccessMessage && (
              <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857' }}>
                {bugSuccessMessage}
              </div>
            )}

            {bugErrorMessage && (
              <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--neg-bg)', border: '1px solid #FECACA', color: '#B91C1C' }}>
                {bugErrorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingBug}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-opacity"
              style={{ background: 'var(--ink)', color: 'var(--surface)', opacity: isSubmittingBug ? 0.7 : 1 }}
            >
              <Bug className="h-4 w-4" />
              {isSubmittingBug ? 'Submitting Bug Report...' : 'Submit Bug Report'}
            </button>
          </form>
        </section>
        )}
      </div>
    </div>
  )
}
