import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

type RequestType = 'access' | 'delete' | 'export' | 'rectify' | 'restrict' | 'object'

const REQUEST_LABELS: Record<RequestType, string> = {
  access:   'Data access request',
  delete:   'Data deletion request',
  export:   'Data export request',
  rectify:  'Rectification / correction',
  restrict: 'Restrict processing',
  object:   'Object to processing',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1.5px solid var(--line)',
  borderRadius: 10,
  color: 'var(--ink)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--muted)',
  letterSpacing: '0.04em',
  marginBottom: 6,
}

export function GDPRDataRequestForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [requestType, setRequestType] = useState<RequestType>('access')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return

    setStatus('submitting')

    // Route through the support-contact edge function (service_role) — direct
    // INSERT to gdpr_requests keeps hitting anon GRANT issues.
    const { data, error } = await supabase.functions.invoke('support-contact', {
      body: {
        kind:         'gdpr',
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        request_type: requestType,
        message:      message.trim(),
      },
    })

    if (error) {
      setStatus('idle')
      toast.error(`Could not submit: ${error.message}`)
      return
    }
    const resp = data as { success?: boolean; message?: string; error?: string } | null
    if (!resp?.success) {
      setStatus('idle')
      toast.error(resp?.message ?? resp?.error ?? 'Submission failed.')
      return
    }

    setStatus('submitted')
    toast.success('Request received. Our privacy team will respond within 30 days.')
    setName(''); setEmail(''); setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="gdpr-name" style={labelStyle}>Full Name</label>
          <input
            id="gdpr-name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Your name"
            required
            style={{ ...inputStyle, padding: '0 14px', height: 44 }}
          />
        </div>

        <div>
          <label htmlFor="gdpr-email" style={labelStyle}>Email Address</label>
          <input
            id="gdpr-email"
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            style={{ ...inputStyle, padding: '0 14px', height: 44 }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="gdpr-request-type" style={labelStyle}>Request Type</label>
        <select
          id="gdpr-request-type"
          value={requestType}
          onChange={event => setRequestType(event.target.value as RequestType)}
          style={{ ...inputStyle, padding: '0 14px', height: 44 }}
        >
          {(Object.keys(REQUEST_LABELS) as RequestType[]).map(k => (
            <option key={k} value={k}>{REQUEST_LABELS[k]}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="gdpr-message" style={labelStyle}>Message</label>
        <textarea
          id="gdpr-message"
          value={message}
          onChange={event => setMessage(event.target.value)}
          placeholder="Please describe the data or account details relevant to your request."
          rows={6}
          style={{ ...inputStyle, padding: 14, resize: 'vertical' }}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Your request is logged to our privacy queue. Our team responds within
          30 days per GDPR Article 12(3).
        </p>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'var(--blue)', boxShadow: '0 8px 24px rgba(37,99,235,0.24)' }}
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>

      {status === 'submitted' && (
        <p className="text-sm" style={{ color: '#166534' }}>
          Request received. We'll email <strong>{email}</strong> within 30 days.
        </p>
      )}
    </form>
  )
}
