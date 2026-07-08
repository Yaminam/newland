import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://foundercentral.in'
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`
const SITE_NAME = 'FounderCentral'
const DEFAULT_DESCRIPTION =
  'FounderCentral matches founders with investors who actually back their stage and sector, then opens the door with a warm intro. Free for founders. The Hub for Ambitious Founders.'

interface SEOProps {
  /** Page title — appended with " · FounderCentral" automatically unless `bareTitle` is true */
  title: string
  /** Meta description, ~155 chars sweet spot */
  description?: string
  /** Path on the site (no domain). Used for canonical + og:url. Optional for dashboard pages. */
  path?: string
  /** Override the default 1200×1200 OG image */
  image?: string
  /** og:type — defaults to "website". Use "article" for blog posts later. */
  type?: 'website' | 'article'
  /** True = use title verbatim without " · FounderCentral" suffix (e.g. for the brand homepage) */
  bareTitle?: boolean
  /** True = tell crawlers not to index (use on auth + admin redirect pages) */
  noindex?: boolean
  /** Article-specific: author name (rendered when type='article') */
  articleAuthor?: string
  /** Article-specific: ISO 8601 published date */
  articlePublishedTime?: string
  /** Article-specific: ISO 8601 modified date */
  articleModifiedTime?: string
  /** Article-specific: content section/category (e.g. "fundraising") */
  articleSection?: string
  /** Article-specific: tags for the article */
  articleTags?: string[]
}

/**
 * Renders all the meta tags a marketing/legal page needs to be properly
 * indexed and to show rich previews on social media. Use on every public
 * route. Powered by react-helmet-async so titles update on client-side
 * navigation and stay correct on direct page loads (when combined with
 * server-side pre-rendering, which we'll add in v2).
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  bareTitle = false,
  noindex = false,
  articleAuthor,
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  articleTags,
}: SEOProps) {
  const fullTitle = bareTitle ? title : `${title} · ${SITE_NAME}`
  const url = path ? `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}` : SITE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="en_IN" />

      {/* Article metadata (blog posts) */}
      {type === 'article' && articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {type === 'article' && articleModifiedTime && (
        <meta property="article:modified_time" content={articleModifiedTime} />
      )}
      {type === 'article' && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}
      {type === 'article' && articleSection && (
        <meta property="article:section" content={articleSection} />
      )}
      {type === 'article' && articleTags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@_foundercentral" />
      <meta name="twitter:creator" content="@_foundercentral" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Indexing control */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  )
}
