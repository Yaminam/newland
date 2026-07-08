import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import DOMPurify from 'dompurify'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { MarketingNav } from './sections/MarketingNav'
import { MarketingFooter } from './sections/MarketingFooter'
import { ScrollProgress } from './lib/ScrollProgress'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_name: string
  author_avatar: string | null
  category: string | null
  tags: string[]
  published_at: string | null
  updated_at: string
  reading_time_minutes: number | null
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  author_name: string
  published_at: string | null
  reading_time_minutes: number | null
}

const SITE_URL = 'https://foundercentral.in'

// Converts plain-text content to readable HTML paragraphs.
// Content from the Tiptap editor already has block tags and passes through unchanged.
function processContent(raw: string): string {
  if (!raw) return ''
  // Already proper HTML (created by Tiptap editor)
  if (/<(p|h[1-6]|ul|ol|blockquote|pre|figure|div)\b/i.test(raw)) return raw
  // Plain text: split on blank lines → <p>, detect basic # headings
  return raw
    .trim()
    .split(/\n{2,}/)
    .filter(s => s.trim())
    .map(block => {
      const b = block.trim()
      const hMatch = b.match(/^(#{1,3})\s+(.+)/)
      if (hMatch) return `<h${hMatch[1].length}>${hMatch[2]}</h${hMatch[1].length}>`
      return `<p>${b.replace(/\n/g, '<br>')}</p>`
    })
    .join('')
}

const CATEGORY_COLORS: Record<string, string> = {
  fundraising:         '#2563EB',
  product:             '#7C3AED',
  'founder-stories':   '#2563EB',
  growth:              '#D97706',
  engineering:         '#0891B2',
  news:                '#DC2626',
  'investor-insights': '#6366F1',
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [related, setRelated] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!slug) { setNotFound(true); setLoading(false); return }
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
      } else {
        setPost(data as BlogPost)
      }
      setLoading(false)
    }
    load()
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (!post) return
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image_url, category, author_name, published_at, reading_time_minutes')
      .eq('status', 'published')
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRelated((data ?? []) as RelatedPost[]))
  }, [post])

  const structuredData = post ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? post.title,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: post.author_name || 'FounderCentral' },
    publisher: {
      '@type': 'Organization',
      name: 'FounderCentral',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    ...(post.cover_image_url ? { image: post.cover_image_url } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.blog-excerpt', '.blog-body'] },
  } : null

  const breadcrumbData = post ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ...(post.category ? [{ '@type': 'ListItem', position: 3, name: post.category, item: `${SITE_URL}/blog?category=${encodeURIComponent(post.category)}` }] : []),
      { '@type': 'ListItem', position: post.category ? 4 : 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  } : null

  const date = post?.published_at
    ? new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const catColor = CATEGORY_COLORS[post?.category ?? ''] ?? '#64748B'

  return (
    <div className="marketing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {post && (
        <>
          <SEO
            type="article"
            title={post.title}
            description={post.excerpt ?? post.title}
            path={`/blog/${post.slug}`}
            image={post.cover_image_url ?? undefined}
            articleAuthor={post.author_name}
            articlePublishedTime={post.published_at ?? undefined}
            articleModifiedTime={post.updated_at}
            articleSection={post.category ?? undefined}
            articleTags={post.tags?.length ? post.tags : undefined}
          />
          <Helmet>
            <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            {breadcrumbData && <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>}
          </Helmet>
        </>
      )}

      {notFound && (
        <SEO title="Post Not Found" description="The blog post you're looking for doesn't exist." path={`/blog/${slug ?? ''}`} noindex />
      )}

      <ScrollProgress />
      <MarketingNav />

      <main style={{ flex: 1 }}>
        {loading ? (
          /* ── Skeleton ── */
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ height: 24, width: 100, background: 'var(--surface-3)', borderRadius: 999, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 24, width: 80, background: 'var(--surface-3)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
            </div>
            <div style={{ height: 52, width: '85%', background: 'var(--surface-3)', borderRadius: 8, margin: '0 auto 12px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 52, width: '60%', background: 'var(--surface-3)', borderRadius: 8, margin: '0 auto 32px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: 420, background: 'var(--surface-3)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
          </div>
        ) : notFound ? (
          /* ── Not found ── */
          <div style={{ textAlign: 'center', padding: '160px 24px 80px' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>Post not found</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 28 }}>
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 24px', borderRadius: 12,
              background: '#2563EB', color: 'white', fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <ArrowLeft size={15} /> Back to Blog
            </Link>
          </div>
        ) : post ? (
          <>
            {/* ── ARTICLE HEADER ── */}
            <header style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(96px, 12vw, 120px) 24px 0', textAlign: 'center' }}>

              {/* Back + breadcrumb row */}
              <Link to="/blog" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, color: 'var(--muted)',
                textDecoration: 'none', marginBottom: 28,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                <ArrowLeft size={13} /> Blog
              </Link>

              {/* Category pill + date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
                {post.category && (
                  <span style={{
                    padding: '5px 16px', borderRadius: 999,
                    fontSize: 12, fontWeight: 700,
                    background: `${catColor}18`, color: catColor,
                    textTransform: 'capitalize',
                    border: `1px solid ${catColor}28`,
                  }}>
                    {post.category.replace(/-/g, ' ')}
                  </span>
                )}
                {date && (
                  <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{date}</span>
                )}
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 900,
                color: 'var(--ink)',
                lineHeight: 1.14,
                margin: '0 0 20px',
                letterSpacing: '-0.025em',
              }}>
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="blog-excerpt" style={{
                  fontSize: 16, color: 'var(--muted)', lineHeight: 1.7,
                  margin: '0 0 28px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
                }}>
                  {post.excerpt}
                </p>
              )}

              {/* Author + reading time */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, fontSize: 13, color: 'var(--muted-2)',
                paddingBottom: 36,
                borderBottom: '1px solid var(--line)',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${catColor} 0%, ${catColor}aa 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'white',
                }}>
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{post.author_name}</span>
                {post.reading_time_minutes && (
                  <>
                    <span style={{ color: 'var(--faint)' }}>·</span>
                    <Clock size={12} style={{ opacity: 0.6 }} />
                    <span>{post.reading_time_minutes} min read</span>
                  </>
                )}
              </div>
            </header>

            {/* ── COVER IMAGE ── */}
            {post.cover_image_url && (
              <div style={{ maxWidth: 860, margin: '40px auto 0', padding: '0 24px' }}>
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  style={{
                    width: '100%',
                    height: 'clamp(240px, 38vw, 480px)',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 12,
                  }}
                />
              </div>
            )}

            {/* ── ARTICLE BODY ── */}
            <article style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(36px, 5vw, 52px) 24px 80px' }}>
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(processContent(post.content)) }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap',
                  marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)',
                }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '5px 14px', borderRadius: 999,
                      fontSize: 12, fontWeight: 600,
                      background: 'var(--surface-3)', color: 'var(--muted)',
                      border: '1px solid var(--line)',
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* ── RELATED ARTICLES ── */}
            {related.length > 0 && (
              <section style={{ borderTop: '1px solid var(--line)', background: '#fff' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(48px, 6vw, 72px) 24px' }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                      Related Articles
                    </h2>
                    <Link to="/blog" style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--blue)',
                      textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      View all articles <ArrowRight size={14} />
                    </Link>
                  </div>

                  {/* 3-column grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(related.length, 3)}, 1fr)`,
                    gap: 32,
                  }}>
                    {related.map(rp => {
                      const rDate = rp.published_at
                        ? new Date(rp.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : null
                      const rColor = CATEGORY_COLORS[rp.category ?? ''] ?? '#64748B'
                      return (
                        <Link key={rp.id} to={`/blog/${rp.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <article>
                            {/* Cover image */}
                            <div style={{
                              width: '100%', height: 200, overflow: 'hidden',
                              borderRadius: 10, marginBottom: 16,
                              background: 'var(--surface-3)',
                            }}>
                              {rp.cover_image_url ? (
                                <img
                                  src={rp.cover_image_url}
                                  alt={rp.title}
                                  loading="lazy"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
                                />
                              ) : (
                                <div style={{
                                  height: '100%',
                                  background: `linear-gradient(135deg, ${rColor}22 0%, ${rColor}44 100%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <span style={{ fontSize: 32, fontWeight: 800, color: `${rColor}55` }}>FC</span>
                                </div>
                              )}
                            </div>
                            {/* Date */}
                            {rDate && (
                              <p style={{ fontSize: 12, color: 'var(--muted-2)', margin: '0 0 8px' }}>{rDate}</p>
                            )}
                            {/* Title */}
                            <h3 style={{
                              fontSize: 16, fontWeight: 700, color: 'var(--ink)',
                              lineHeight: 1.4, margin: '0 0 8px',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {rp.title}
                            </h3>
                            {/* Excerpt */}
                            {rp.excerpt && (
                              <p style={{
                                fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0,
                                display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                              }}>
                                {rp.excerpt}
                              </p>
                            )}
                          </article>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── CTA SECTION ── */}
            <section style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #0D1B2A 0%, #1E3A8A 55%, #2563EB 100%)',
              padding: 'clamp(60px, 8vw, 96px) 24px',
              textAlign: 'center',
            }}>
              <div className="cc-pattern-dots" style={{ position: 'absolute', inset: 0, opacity: 0.09 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 120%, rgba(96,165,250,0.2) 0%, transparent 65%)' }} />
              <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
                <p style={{
                  fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 800,
                  color: 'white', lineHeight: 1.2, margin: '0 0 14px',
                  letterSpacing: '-0.02em',
                }}>
                  Find investors who actually fit your stage
                </p>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, margin: '0 0 32px' }}>
                  FounderCentral matches you with the right investors and opens the door with a warm introduction.
                </p>
                <Link to="/auth/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', borderRadius: 12,
                  background: 'white', color: '#1E3A8A',
                  fontSize: 15, fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                }}>
                  Get started — it's free <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <MarketingFooter />
    </div>
  )
}
