import { useEffect, useState, type FormEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import DOMPurify from 'dompurify'
import { SEO } from '@/app/components/SEO'
import { supabase } from '@/app/lib/supabase'
import { MarketingNav } from './sections/MarketingNav'
import { MarketingFooter } from './sections/MarketingFooter'
import { ScrollProgress } from './lib/ScrollProgress'
import { RevealOnScroll } from './lib/RevealOnScroll'
import { Link } from 'react-router-dom'
import {
  Mail, Calendar, Users, ArrowRight, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
}

interface NewsletterSend {
  id: string
  subject: string
  body_html: string
  recipients: number
  sent_at: string
  status: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SITE_URL = 'https://foundercentral.in'

export function NewsletterPage() {
  const [issues, setIssues] = useState<NewsletterSend[]>([])
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Subscribe form state
  const [email, setEmail] = useState('')
  const [subStatus, setSubStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

  useEffect(() => {
    async function load() {
      const [issuesRes, blogsRes] = await Promise.all([
        supabase
          .from('newsletter_sends')
          .select('id, subject, body_html, recipients, sent_at, status')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(50),
        supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(5),
      ])

      setIssues((issuesRes.data ?? []) as NewsletterSend[])
      setBlogs((blogsRes.data ?? []) as BlogPost[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault()
    if (subStatus === 'submitting' || subStatus === 'done') return

    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      toast.error('Enter a valid email address.')
      return
    }

    setSubStatus('submitting')
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmed, status: 'active', source: 'newsletter_page' })

    if (error && error.code !== '23505') {
      setSubStatus('idle')
      toast.error('Could not subscribe. Please try again.')
      return
    }

    setSubStatus('done')
    setEmail('')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /** Strip HTML tags and truncate for preview */
  function getExcerpt(html: string, maxLen = 180) {
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '...' : text
  }

  /** Parse sections from body_html for formatted display */
  function renderFormattedBody(bodyHtml: string) {
    const sections: { key: string; label: string; content: string; color: string }[] = []
    const lines = bodyHtml.split('\n')
    let currentKey = ''
    let currentLines: string[] = []

    const sectionMap: Record<string, { label: string; color: string }> = {
      EDITORIAL: { label: 'Editorial', color: '#2563EB' },
      INSIGHT: { label: 'Insight', color: '#7C3AED' },
      QUICK_TAKES: { label: 'Quick Takes', color: '#0891B2' },
      AUTOPSY: { label: 'Startup Autopsy', color: '#DC2626' },
      RESOURCE: { label: 'Resource', color: '#2563EB' },
      PREVIEW_NEXT: { label: 'Coming Next Week', color: '#D97706' },
    }

    for (const line of lines) {
      const stripped = line.trim()
      let matched = false

      for (const header of Object.keys(sectionMap)) {
        if (stripped.startsWith(header + ':') || stripped === header) {
          if (currentKey) {
            const meta2 = sectionMap[currentKey]
            if (meta2) {
              sections.push({
                key: currentKey,
                label: meta2.label,
                content: currentLines.join('\n').trim(),
                color: meta2.color,
              })
            }
          }
          currentKey = header
          const after = stripped.slice(header.length).replace(/^:/, '').trim()
          currentLines = after ? [after] : []
          matched = true
          break
        }
      }

      if (!matched && currentKey) {
        currentLines.push(line)
      }
    }

    // Push last section
    if (currentKey && sectionMap[currentKey]) {
      sections.push({
        key: currentKey,
        label: sectionMap[currentKey].label,
        content: currentLines.join('\n').trim(),
        color: sectionMap[currentKey].color,
      })
    }

    if (sections.length === 0) {
      // Fallback: just render as paragraphs
      return (
        <div
          style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink)' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml.replace(/\n/g, '<br/>')) }}
        />
      )
    }

    return (
      <div className="space-y-6">
        {sections.map(sec => {
          // Skip "None this week" autopsy
          if (sec.key === 'AUTOPSY' && sec.content.toLowerCase().startsWith('none')) return null

          const isQuickTakes = sec.key === 'QUICK_TAKES'
          const items = isQuickTakes
            ? sec.content.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.trim().slice(2))
            : []

          return (
            <div key={sec.key}>
              {/* Section label */}
              <p
                className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: sec.color }}
              >
                {sec.label}
              </p>

              {isQuickTakes && items.length > 0 ? (
                <ul className="space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: sec.color }}
                      />
                      <span style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink)' }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--ink)',
                  }}
                >
                  {sec.content}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Capital Intelligence Brief — Newsletter Archive',
    itemListElement: issues.slice(0, 10).map((issue, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        headline: issue.subject,
        datePublished: issue.sent_at,
        author: { '@type': 'Organization', name: 'FounderCentral' },
        url: `${SITE_URL}/newsletter`,
      },
    })),
  }

  return (
    <div className="marketing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO
        title="Newsletter"
        description="The Capital Intelligence Brief — weekly fundraising insights, investor signals, and startup ecosystem intelligence for founders and investors."
        path="/newsletter"
      />
      {issues.length > 0 && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
      )}

      <ScrollProgress />
      <MarketingNav />

      <main style={{ flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', padding: '120px 24px 80px' }}>
        {/* Header */}
        <RevealOnScroll>
          <div style={{ marginBottom: 48 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 999,
                background: 'rgba(37,99,235,0.08)', color: 'var(--blue)',
                fontSize: 13, fontWeight: 600, marginBottom: 16,
              }}
            >
              <Mail className="h-3.5 w-3.5" />
              Capital Intelligence Brief
            </span>
            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800,
                color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 14px',
              }}
            >
              Newsletter archive
            </h1>
            <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 540, lineHeight: 1.65 }}>
              Every issue of our weekly briefing for founders and investors.
              Fundraising strategies, cap table insights, and ecosystem intelligence.
            </p>
          </div>
        </RevealOnScroll>

        {/* Subscribe banner */}
        <RevealOnScroll>
          <div
            className="mb-10 rounded-2xl p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, #0D1B2A 0%, #1E3A5F 100%)',
            }}
          >
            {subStatus !== 'done' ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex-1">
                  <p className="text-[15px] font-semibold" style={{ color: '#FFFFFF' }}>
                    Get the next issue in your inbox
                  </p>
                  <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    One email per week. Unsubscribe anytime.
                  </p>
                </div>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="you@yourstartup.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={subStatus === 'submitting'}
                    className="text-sm"
                    style={{
                      height: 42, padding: '0 14px', borderRadius: 8, minWidth: 220,
                      background: 'rgba(255,255,255,0.1)', color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.15)', outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={subStatus === 'submitting'}
                    className="flex items-center gap-2 font-semibold"
                    style={{
                      height: 42, padding: '0 18px', borderRadius: 8,
                      background: '#FFFFFF', color: '#0D1B2A', fontSize: 14,
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {subStatus === 'submitting' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5" style={{ color: '#4ADE80' }} />
                <p className="text-[15px] font-medium" style={{ color: '#FFFFFF' }}>
                  You&apos;re subscribed! Check your inbox this week.
                </p>
              </div>
            )}
          </div>
        </RevealOnScroll>

        {/* Issues list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 100, borderRadius: 16, background: 'var(--surface-3)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div
            style={{
              textAlign: 'center', padding: '80px 40px',
              background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)',
            }}
          >
            <Mail className="mx-auto mb-4 h-10 w-10" style={{ color: 'var(--muted-2)' }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              No issues yet
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              The first Capital Intelligence Brief is coming soon. Subscribe above to get it first.
            </p>
          </div>
        ) : (
          <RevealOnScroll>
            <div className="space-y-4">
              {issues.map((issue, index) => {
                const isExpanded = expandedId === issue.id
                return (
                  <article
                    key={issue.id}
                    className="rounded-2xl transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isExpanded ? 'rgba(37,99,235,0.25)' : 'var(--line)'}`,
                      boxShadow: isExpanded ? '0 8px 32px -12px rgba(15,23,42,0.12)' : 'none',
                    }}
                  >
                    {/* Header — always visible */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                      className="flex w-full items-start gap-4 p-5 text-left sm:items-center sm:p-6"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {/* Issue number */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                        style={{
                          background: 'var(--blue-bg)',
                          color: 'var(--blue)',
                          border: '1px solid rgba(37,99,235,0.15)',
                        }}
                      >
                        #{issues.length - index}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-[15px] font-semibold leading-snug"
                          style={{ color: 'var(--ink)' }}
                        >
                          {issue.subject}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span
                            className="flex items-center gap-1 text-[12px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDate(issue.sent_at)}
                          </span>
                          <span
                            className="flex items-center gap-1 text-[12px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            <Users className="h-3 w-3" />
                            {issue.recipients} recipients
                          </span>
                        </div>
                        {!isExpanded && (
                          <p
                            className="mt-2 text-[13px] leading-relaxed"
                            style={{ color: 'var(--muted)' }}
                          >
                            {getExcerpt(issue.body_html)}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0" style={{ color: 'var(--muted)' }}>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div
                        className="border-t px-5 py-6 sm:px-6"
                        style={{ borderColor: 'var(--line)' }}
                      >
                        {renderFormattedBody(issue.body_html)}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </RevealOnScroll>
        )}

        {/* From the Blog */}
        {blogs.length > 0 && (
          <RevealOnScroll>
            <div className="mt-14">
              <p
                className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em]"
                style={{ color: 'var(--blue)' }}
              >
                From the Blog
              </p>
              <h2
                className="mb-6 text-xl font-bold"
                style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
              >
                Latest from FounderCentral
              </h2>
              <div className="space-y-3">
                {blogs.map(bp => (
                  <Link
                    key={bp.id}
                    to={`/blog/${bp.slug}`}
                    className="group flex items-start gap-4 rounded-xl p-4 transition-all"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px -12px rgba(15,23,42,0.10)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--line)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'var(--blue-bg)' }}
                    >
                      <BookOpen className="h-4 w-4" style={{ color: 'var(--blue)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-[14px] font-semibold leading-snug"
                        style={{ color: 'var(--ink)' }}
                      >
                        {bp.title}
                      </h3>
                      {bp.excerpt && (
                        <p
                          className="mt-1 text-[13px] leading-relaxed"
                          style={{ color: 'var(--muted)' }}
                        >
                          {bp.excerpt.length > 120 ? bp.excerpt.slice(0, 120).trimEnd() + '...' : bp.excerpt}
                        </p>
                      )}
                      <span
                        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium"
                        style={{ color: 'var(--blue)' }}
                      >
                        Read more
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all"
                  style={{
                    background: 'var(--blue-bg)',
                    color: 'var(--blue)',
                    border: '1px solid rgba(37,99,235,0.15)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--blue)'
                    e.currentTarget.style.color = '#FFFFFF'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--blue-bg)'
                    e.currentTarget.style.color = 'var(--blue)'
                  }}
                >
                  View all articles
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
