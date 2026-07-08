import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

interface BlogCardProps {
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  author_name: string
  published_at: string | null
  reading_time_minutes: number | null
}

const CATEGORY_COLORS: Record<string, string> = {
  fundraising:         '#2563EB',
  product:             '#7C3AED',
  'founder-stories':   '#059669',
  growth:              '#D97706',
  engineering:         '#0891B2',
  news:                '#DC2626',
  'investor-insights': '#6366F1',
}

export function BlogCard({
  slug, title, excerpt, cover_image_url, category, author_name, published_at, reading_time_minutes,
}: BlogCardProps) {
  const catColor = CATEGORY_COLORS[category ?? ''] ?? '#64748B'
  const date = published_at
    ? new Date(published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link to={`/blog/${slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <article
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'box-shadow 250ms ease, transform 250ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
          e.currentTarget.style.transform = 'none'
        }}
      >
        {/* Cover Image */}
        <div style={{ height: 210, overflow: 'hidden', background: 'var(--surface-3)', position: 'relative' }}>
          {cover_image_url ? (
            <img
              src={cover_image_url}
              alt={title}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }}
            />
          ) : (
            <div style={{
              height: '100%', background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 50%, #60A5FA 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: 'rgba(255,255,255,0.15)', letterSpacing: 4 }}>FC</span>
            </div>
          )}
          {/* Category overlay on image */}
          {category && (
            <span style={{
              position: 'absolute', top: 14, left: 14,
              padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: 'rgba(255,255,255,0.92)', color: catColor,
              textTransform: 'capitalize', backdropFilter: 'blur(8px)',
              letterSpacing: '0.02em',
            }}>
              {category.replace(/-/g, ' ')}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {/* Title */}
          <h3 style={{
            fontSize: 17, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </h3>

          {/* Excerpt */}
          {excerpt && (
            <p style={{
              fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {excerpt}
            </p>
          )}

          {/* Meta row */}
          <div style={{
            marginTop: 'auto', paddingTop: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 12, color: 'var(--muted-2)', borderTop: '1px solid var(--line-2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: 'var(--muted)' }}>{author_name}</span>
              {date && (
                <>
                  <span style={{ color: 'var(--faint)' }}>·</span>
                  <span>{date}</span>
                </>
              )}
            </div>
            {reading_time_minutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} />
                <span>{reading_time_minutes} min</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
