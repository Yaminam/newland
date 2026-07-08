// Generates dist/sitemap.xml after `vite build`. Walks a hardcoded list of
// public routes plus dynamically fetched blog post slugs, and emits an XML
// sitemap with lastmod = today, sensible priorities, and changefreqs.
//
// Wired via package.json: { "build": "tsc -b && vite build && node scripts/generate-sitemap.mjs" }

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://foundercentral.in'

// Routes a search engine should crawl. Auth + dashboard + admin omitted.
// If you add a new public page, add it here so it shows up in the sitemap.
const STATIC_ROUTES = [
  { path: '/',                        priority: '1.0', changefreq: 'weekly'  },
  { path: '/blog',                    priority: '0.8', changefreq: 'weekly'  },
  { path: '/about',                   priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy-policy',          priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-of-service',        priority: '0.5', changefreq: 'monthly' },
  { path: '/dpa',                     priority: '0.3', changefreq: 'yearly'  },
  { path: '/gdpr',                    priority: '0.4', changefreq: 'yearly'  },
  { path: '/ai-transparency',         priority: '0.5', changefreq: 'monthly' },
  { path: '/data-governance',         priority: '0.4', changefreq: 'monthly' },
  { path: '/api-usage-policy',        priority: '0.3', changefreq: 'yearly'  },
  { path: '/soc2-readiness',          priority: '0.4', changefreq: 'monthly' },
  { path: '/prompt-storage-policy',   priority: '0.3', changefreq: 'yearly'  },
]

const today = new Date().toISOString().slice(0, 10)

async function main() {
  const routes = [...STATIC_ROUTES]

  // Fetch published blog post slugs for dynamic sitemap entries
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(500)

      if (posts?.length) {
        for (const post of posts) {
          routes.push({
            path: `/blog/${post.slug}`,
            priority: '0.6',
            changefreq: 'weekly',
          })
        }
        console.log(`  ↳ Added ${posts.length} blog post URLs`)
      }
    } catch (e) {
      console.warn('⚠ Could not fetch blog posts for sitemap:', e.message)
    }
  } else {
    console.warn('⚠ VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set — blog posts omitted from sitemap')
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(
  ({ path, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join('\n')}
</urlset>
`

  const outPath = resolve(process.cwd(), 'dist', 'sitemap.xml')
  writeFileSync(outPath, xml, 'utf8')
  console.log(`✓ Wrote sitemap: ${outPath} (${routes.length} URLs)`)

  // ── RSS feed ────────────────────────────────────────────────────
  // Generate dist/feed.xml with the latest published blog posts.
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: rssItems } = await supabase
        .from('blog_posts')
        .select('title, slug, excerpt, author_name, published_at, category, cover_image_url')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50)

      if (rssItems?.length) {
        const esc = (s) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>FounderCentral Blog</title>
  <link>${SITE_URL}/blog</link>
  <description>Insights for ambitious founders — fundraising, investor relations, and startup growth.</description>
  <language>en-in</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems.map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE_URL}/blog/${esc(p.slug)}</link>
    <guid isPermaLink="true">${SITE_URL}/blog/${esc(p.slug)}</guid>
    <description>${esc(p.excerpt ?? p.title)}</description>
    <author>${esc(p.author_name ?? 'FounderCentral')}</author>
    ${p.category ? `<category>${esc(p.category)}</category>` : ''}
    ${p.published_at ? `<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>` : ''}
  </item>`).join('\n')}
</channel>
</rss>
`
        const feedPath = resolve(process.cwd(), 'dist', 'feed.xml')
        writeFileSync(feedPath, rss, 'utf8')
        console.log(`✓ Wrote RSS feed: ${feedPath} (${rssItems.length} items)`)
      }
    } catch (e) {
      console.warn('⚠ Could not generate RSS feed:', e.message)
    }
  }
}

main()
