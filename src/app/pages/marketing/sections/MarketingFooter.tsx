import { Link } from 'react-router-dom'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'
import { useCookieConsent } from '@/app/hooks/useCookieConsent'

const COLUMNS: Array<{
  title: string
  links: Array<{ label: string; to: string; external?: boolean }>
}> = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Features', to: '/#features' },
      { label: 'For investors', to: '/#for-investors' },
      { label: 'Blog', to: '/blog' },
      { label: 'Newsletter', to: '/newsletter' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Help center', to: '/help' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy-policy' },
      { label: 'Terms', to: '/terms-of-service' },
      { label: 'DPA', to: '/dpa' },
      { label: 'GDPR', to: '/gdpr' },
      { label: 'AI transparency', to: '/ai-transparency' },
      { label: 'SOC 2 readiness', to: '/soc2-readiness' },
    ],
  },
]

export function MarketingFooter() {
  const { resetConsent } = useCookieConsent()
  return (
    <footer
      style={{
        background: 'linear-gradient(160deg, #0D1B2A 0%, #16294A 55%, #1E3A8A 100%)',
        color: 'rgba(255,255,255,0.72)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-5">
            <div
              className="inline-block rounded-lg p-2"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <FounderCentralLogo size="md" variant="light" />
            </div>
            <p
              className="mt-5 max-w-md text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.62)' }}
            >
              The Hub for Ambitious Founders. Warm intros to investors who actually back your
              stage and sector. Then the conversation moves to email, where deals get done.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-10">
            {COLUMNS.map(col => (
              <div key={col.title}>
                <div
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'white' }}
                >
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="text-sm transition-colors"
                        style={{ color: 'rgba(255,255,255,0.65)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} FounderCentral. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={resetConsent}
              className="text-xs underline underline-offset-2 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
            >
              Cookie Settings
            </button>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              The Hub for Ambitious Founders.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
