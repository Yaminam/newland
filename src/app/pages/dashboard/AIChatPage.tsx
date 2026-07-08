import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { PageHeader } from '@/app/components/ui/PageHeader'
import {
  BarChart2, Rocket, Bot, X, ArrowUp, ShieldCheck,
  Sparkles, ArrowRight, MessageSquare,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from 'sonner'
import { logSecurityEvent } from '@/app/lib/securityEvents'
import { sanitizeReply } from '@/app/lib/textFormat'

type ChatMode = 'market-intel' | 'fundraising' | 'compliance'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const MODES: { id: ChatMode; label: string; icon: React.ElementType; desc: string; color: string; tint: string }[] = [
  {
    id: 'market-intel',
    label: 'Market Intelligence',
    icon: BarChart2,
    desc: 'Get insights on market trends, sectors, and competitive landscape',
    color: '#2563EB',
    tint: 'rgba(37,99,235,0.10)',
  },
  {
    id: 'fundraising',
    label: 'Fundraising Coach',
    icon: Rocket,
    desc: 'Get guidance on pitch strategy, investor outreach, and term sheets',
    color: '#7C3AED',
    tint: 'rgba(124,58,237,0.10)',
  },
]

const CAPABILITIES: { icon: React.ElementType; label: string }[] = [
  { icon: Sparkles,   label: 'AI-powered answers' },
  { icon: BarChart2,  label: 'Live India market data' },
  { icon: ShieldCheck, label: 'Private & secure' },
]

const SUGGESTIONS: Record<ChatMode, string[]> = {
  'market-intel': [
    'What sectors are attracting Seed funding in India this month?',
    'Which investors are most active in HealthTech right now?',
    'What is the average check size for Series A in India?',
  ],
  'fundraising': [
    'Help me write a cold outreach email to a VC',
    'What should my SAFE note terms look like for a pre-seed round?',
    'How do I prepare for a due diligence process?',
  ],
  // 'compliance' mode retained for back-compat with any stored sessions;
  // entry point removed from MODES list per product decision (out of scope
  // for discovery-only platform).
  'compliance': [
    'What are SEBI regulations for startup fundraising in India?',
    'What due diligence documents should a startup prepare?',
    'Explain the legal structure for angel investment in India.',
  ],
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--blue)' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  )
}

// Very small inline formatter: renders **bold** spans; everything else is
// plain text. Intentionally tiny so we avoid pulling in react-markdown.
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function FormattedMessage({ text }: { text: string }) {
  const clean = sanitizeReply(text)
  const blocks = clean.split(/\n{2,}/).filter(b => b.trim().length > 0)

  const isBullet  = (l: string) => /^\s*[-•]\s+/.test(l)
  const isOrdered = (l: string) => /^\s*\d+\.\s+/.test(l)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')

        if (lines.every(isBullet)) {
          return (
            <ul key={bi} style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lines.map((l, i) => (
                <li key={i} style={{ lineHeight: 1.55 }}>
                  {renderInline(l.replace(/^\s*[-•]\s+/, ''))}
                </li>
              ))}
            </ul>
          )
        }

        if (lines.every(isOrdered)) {
          return (
            <ol key={bi} style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lines.map((l, i) => (
                <li key={i} style={{ lineHeight: 1.55 }}>
                  {renderInline(l.replace(/^\s*\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          )
        }

        // A lone short line followed by siblings in the same block often means
        // a section title the model wrote on its own line. If the first line
        // is short and the block has multiple lines, style it as a subheading.
        if (lines.length > 1 && lines[0].trim().length <= 60 && !lines[0].endsWith('.')) {
          return (
            <div key={bi}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{renderInline(lines[0])}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{renderInline(lines.slice(1).join('\n'))}</div>
            </div>
          )
        }

        return (
          <p key={bi} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}

export function AIChatPage() {
  const { user, profile } = useAuth()
  const [mode, setMode] = useState<ChatMode | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-expand textarea height
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
    }
  }, [input])

  function startMode(m: ChatMode) {
    setMode(m)
    setMessages([])
    setSessionId(null)
  }

  // Jump straight into a mode with a prompt pre-filled (from an example chip).
  function startWithPrompt(m: ChatMode, prompt: string) {
    setMode(m)
    setMessages([])
    setSessionId(null)
    setInput(prompt)
    setTimeout(() => textareaRef.current?.focus(), 60)
  }

  function clearMode() {
    setMode(null)
    setMessages([])
    setInput('')
  }

  async function sendMessage() {
    if (!input.trim() || loading || !mode) return
    const userMsg = input.trim()
    setInput('')

    const userChatMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userChatMsg])
    setLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Session expired. Please log in again.')
      }

      // Call the Supabase edge function directly.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey':        anonKey,
        },
        body: JSON.stringify({
          message: userMsg,
          mode,
          session_id: sessionId ?? undefined,
        }),
      })

      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const body = await res.json() as { error?: string; message?: string }
          detail = body.message ?? body.error ?? detail
        } catch { /* non-JSON body */ }
        logSecurityEvent({
          type: 'api_error',
          outcome: 'failure',
          userId: user?.id ?? undefined,
          route: '/functions/v1/ai-chat',
          statusCode: res.status,
          message: `AI chat request failed: ${detail}`,
        })
        // Common: 503 "AI service not configured" → set OPENAI_API_KEY as
        // a Supabase secret. Surface that to the user.
        if (res.status === 503) {
          throw new Error('AI is not configured yet. Ask an admin to set OPENAI_API_KEY.')
        }
        throw new Error(detail)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            const json = line.slice(6).trim()
            if (json === '[DONE]') continue
            try {
              const parsed = JSON.parse(json)
              if (parsed.text) assistantText += parsed.text
              if (parsed.session_id && !sessionId) setSessionId(parsed.session_id)
            } catch {
              if (json && json !== '[DONE]') assistantText += json
            }
          }
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: assistantText } : m
          ))
        }
      }

      if (!assistantText) {
        const text = await res.text().catch(() => '')
        try {
          const parsed = JSON.parse(text)
          assistantText = parsed.response ?? parsed.text ?? text
          if (parsed.session_id) setSessionId(parsed.session_id)
        } catch {
          assistantText = text
        }
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: assistantText } : m
        ))
      }
    } catch (err: unknown) {
      logSecurityEvent({
        type: 'api_error',
        outcome: 'failure',
        userId: user?.id ?? undefined,
        route: 'edge/ai-chat',
        message: err instanceof Error ? err.message : 'Unknown AI chat error',
      })
      toast.error((err as Error).message ?? 'AI request failed')
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectedMode = MODES.find(m => m.id === mode)

  // Single composer, reused in the centered "new chat" hero and pinned at the
  // bottom once a conversation is underway.
  const composerNode = (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div
        ref={inputContainerRef}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '6px 6px 6px 16px',
          boxShadow: 'var(--sh-2)',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputContainerRef.current) {
              inputContainerRef.current.style.borderColor = 'var(--blue)'
              inputContainerRef.current.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
            }
          }}
          onBlur={() => {
            if (inputContainerRef.current) {
              inputContainerRef.current.style.borderColor = 'var(--line)'
              inputContainerRef.current.style.boxShadow = 'var(--sh-2)'
            }
          }}
          placeholder="Ask anything…"
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent', resize: 'none',
            fontSize: 14, lineHeight: '22px', color: 'var(--ink)', fontFamily: 'inherit',
            height: 40, minHeight: 40, maxHeight: 160, overflowY: 'auto',
            padding: '9px 0', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: 12,
            background: input.trim() && !loading ? 'var(--blue)' : 'var(--surface-3)',
            border: 'none',
            color: input.trim() && !loading ? '#fff' : 'var(--muted-2)',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 150ms ease',
          }}
        >
          {loading ? (
            <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
        Press <strong style={{ fontWeight: 600 }}>Enter</strong> to send · <strong style={{ fontWeight: 600 }}>Shift + Enter</strong> for a new line
      </p>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      background: 'var(--bg)',
    }}>
      <SEO title="AI Chat" path="/dashboard/ai-chat" noindex />
      {/* Header Section */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <PageHeader
          title="Ask AI"
          subtitle="Your assistant for fundraising and market intelligence"
          icon={<Bot className="w-5 h-5" />}
          action={
            mode ? (
              <div className="flex items-center gap-2">
                <span className="cc-badge blue">
                  {selectedMode && <selectedMode.icon className="w-3 h-3" />}
                  {selectedMode!.label}
                </span>
                <button
                  onClick={clearMode}
                  aria-label="Clear selected mode"
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted-2)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : undefined
          }
          className="mb-0"
        />
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {!mode ? (
          /* Landing / Mode Selection State */
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 40px' }}>
            <div style={{ maxWidth: 940, margin: '0 auto', width: '100%' }}>

              {/* Welcome hero */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center"
                style={{ padding: '40px 16px 30px' }}
              >
                <div
                  className="mx-auto mb-4 flex items-center justify-center relative"
                  style={{
                    width: 64, height: 64, borderRadius: 18,
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.16), rgba(124,58,237,0.12))',
                    border: '1px solid rgba(37,99,235,0.18)',
                  }}
                >
                  <Bot className="w-8 h-8" style={{ color: 'var(--blue)' }} />
                  <Sparkles className="w-4 h-4 absolute -top-1 -right-1" style={{ color: '#7C3AED' }} />
                </div>
                <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)', margin: 0 }}>
                  {profile?.first_name ? `How can I help, ${profile.first_name}?` : 'How can I help you today?'}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
                  Choose a focus to get started, or jump straight in with a question below.
                </p>
              </motion.div>

              {/* Mode cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
                {MODES.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.35 }}
                    className="card card-hover-lift"
                    style={{ borderRadius: 16, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ height: 4, background: m.color }} />
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Clickable header → opens an empty chat in this mode */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => startMode(m.id)}
                        onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); startMode(m.id) } }}
                        className="group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{ width: 44, height: 44, borderRadius: 12, background: m.tint, border: `1px solid ${m.color}26` }}
                          >
                            <m.icon className="w-5 h-5" style={{ color: m.color }} />
                          </div>
                          <h3 className="flex-1 text-[16px] font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>{m.label}</h3>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: m.color }} />
                        </div>
                        <p className="text-[12.5px] leading-relaxed mt-2.5" style={{ color: 'var(--muted)' }}>{m.desc}</p>
                      </div>

                      {/* Example prompts */}
                      <div className="mt-4 pt-3.5" style={{ borderTop: '1px solid var(--line-2)' }}>
                        <p className="text-[10px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em' }}>Try asking</p>
                        <div className="flex flex-col gap-0.5">
                          {SUGGESTIONS[m.id].map(s => (
                            <button
                              key={s}
                              onClick={() => startWithPrompt(m.id, s)}
                              className="group/p flex items-center gap-2 text-left rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--surface-2)]"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: m.color, opacity: 0.7 }} />
                              <span className="flex-1 text-[12.5px] leading-snug" style={{ color: 'var(--muted)' }}>{s}</span>
                              <ArrowRight className="w-3 h-3 shrink-0 opacity-0 group-hover/p:opacity-100 transition-opacity" style={{ color: m.color }} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Capabilities strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2"
                style={{ marginTop: 28 }}
              >
                {CAPABILITIES.map(c => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <c.icon className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                    <span className="text-[12px]" style={{ color: 'var(--muted-2)' }}>{c.label}</span>
                  </div>
                ))}
              </motion.div>

            </div>
          </div>
        ) : (
          /* Chat Active State */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '20px 24px',
              minHeight: 0,
              width: '100%',
              maxWidth: 860,
              margin: '0 auto',
            }}>
              {messages.length === 0 ? (
                /* Suggested Questions */
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  flex: 1,
                  minHeight: '300px',
                }}>
                  {/* Mode intro */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                    style={{ marginBottom: 22 }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 54, height: 54, borderRadius: 15, marginBottom: 12,
                        background: selectedMode?.tint ?? 'var(--blue-bg)',
                        border: `1px solid ${(selectedMode?.color ?? 'var(--blue)')}26`,
                      }}
                    >
                      {selectedMode
                        ? <selectedMode.icon className="w-6 h-6" style={{ color: selectedMode.color }} />
                        : <Bot className="w-6 h-6" style={{ color: 'var(--blue)' }} />}
                    </div>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>
                      {selectedMode?.label ?? 'Ask AI'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, maxWidth: 430, lineHeight: 1.5 }}>
                      {selectedMode?.desc ?? 'Ask anything to get started.'}
                    </p>
                  </motion.div>

                  {/* Composer grouped with the intro & prompts — no floating dead space */}
                  <div style={{ width: '100%', marginBottom: 22 }}>
                    {composerNode}
                  </div>

                  <p className="text-[11px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Suggested questions
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 620 }}>
                    {SUGGESTIONS[mode].map((s, i) => (
                      <motion.button
                        key={s}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 + i * 0.06 }}
                        onClick={() => { setInput(s); textareaRef.current?.focus() }}
                        className="group card card-hover-lift flex items-center gap-3 text-left"
                        style={{ borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}
                      >
                        <span
                          className="flex items-center justify-center shrink-0"
                          style={{ width: 32, height: 32, borderRadius: 9, background: selectedMode?.tint ?? 'var(--blue-bg)' }}
                        >
                          <Sparkles className="w-4 h-4" style={{ color: selectedMode?.color ?? 'var(--blue)' }} />
                        </span>
                        <span className="flex-1 text-[13.5px]" style={{ color: 'var(--ink)' }}>{s}</span>
                        <ArrowRight
                          className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                          style={{ color: selectedMode?.color ?? 'var(--blue)' }}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Messages */
                <>
                  <AnimatePresence>
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{ maxWidth: msg.role === 'user' ? '70%' : '80%' }}>
                          <div style={{
                            background: msg.role === 'user' ? 'var(--blue)' : 'var(--bg-secondary)',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--line)',
                            color: msg.role === 'user' ? 'white' : 'var(--ink)',
                            borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            padding: '10px 14px',
                            fontSize: '14px',
                            lineHeight: 1.6,
                          }}>
                            {msg.content === '' && msg.role === 'assistant' ? (
                              <TypingDots />
                            ) : msg.role === 'assistant' ? (
                              <FormattedMessage text={msg.content} />
                            ) : (
                              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                            )}
                          </div>
                          <p style={{
                            fontSize: '11px',
                            color: 'var(--text-tertiary)',
                            marginTop: '4px',
                            textAlign: msg.role === 'user' ? 'right' : 'left',
                          }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer — pinned at the bottom once a conversation is underway */}
      {mode && messages.length > 0 && (
        <div style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid var(--line)',
          background: 'var(--bg)',
          flexShrink: 0,
        }}>
          {composerNode}
        </div>
      )}
    </div>
  )
}
