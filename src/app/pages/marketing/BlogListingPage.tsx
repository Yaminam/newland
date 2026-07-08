import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/app/components/SEO'
import { BlogCard } from '@/app/components/BlogCard'
import { supabase } from '@/app/lib/supabase'
import { MarketingNav } from './sections/MarketingNav'
import { MarketingFooter } from './sections/MarketingFooter'
import { ScrollProgress } from './lib/ScrollProgress'
import { RevealOnScroll } from './lib/RevealOnScroll'

interface BlogPost {
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

export function BlogListingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image_url, category, author_name, published_at, reading_time_minutes')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50)

      setPosts((data ?? []) as BlogPost[])
      setLoading(false)
    }
    load()
  }, [])

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'BlogPosting',
        headline: p.title,
        url: `${SITE_URL}/blog/${p.slug}`,
        datePublished: p.published_at,
        author: { '@type': 'Organization', name: 'FounderCentral' },
        ...(p.cover_image_url ? { image: p.cover_image_url } : {}),
      },
    })),
  }

  return (
    <div className="marketing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO
        title="Blog"
        description="Insights on fundraising, startup growth, investor relations, and building your company — from the FounderCentral team."
        path="/blog"
      />
      {posts.length > 0 && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
      )}

      <ScrollProgress />
      <MarketingNav />

      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '120px 24px 80px' }}>
        {/* Header */}
        <RevealOnScroll>
          <div style={{ marginBottom: 56 }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: 999,
              background: 'rgba(37,99,235,0.08)', color: 'var(--blue)',
              fontSize: 13, fontWeight: 600, marginBottom: 16,
            }}>
              FounderCentral Blog
            </span>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800,
              color: 'var(--ink)', lineHeight: 1.15, margin: '0 0 14px',
            }}>
              Insights for founders <br />who raise smarter
            </h1>
            <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 540, lineHeight: 1.65 }}>
              Practical guides on fundraising, investor relations, and startup growth. No fluff — just what works.
            </p>
          </div>
        </RevealOnScroll>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 400, borderRadius: 16, background: 'var(--surface-3)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--line)',
          }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              No posts yet
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              We're working on great content. Check back soon!
            </p>
          </div>
        ) : (
          <RevealOnScroll>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24,
            }}>
              {posts.map(post => (
                <BlogCard key={post.id} {...post} />
              ))}
            </div>
          </RevealOnScroll>
        )}
      </main>

      <MarketingFooter />
    </div>
  )
}
