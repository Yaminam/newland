import { Helmet } from 'react-helmet-async'
import { SEO } from '@/app/components/SEO'
import { Link } from 'react-router-dom'
import { Shield, Heart, Zap, Users, ArrowRight, Target, Eye } from 'lucide-react'
import { MarketingNav } from './sections/MarketingNav'
import { MarketingFooter } from './sections/MarketingFooter'
import { RevealOnScroll } from './lib/RevealOnScroll'
import { ScrollProgress } from './lib/ScrollProgress'

const SITE_URL = 'https://foundercentral.in'

const VALUES = [
  {
    icon: Heart,
    title: 'Founder-First',
    description: 'Everything we build starts with one question: does this help founders raise faster? If not, we don\'t ship it.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'No black boxes. You see which investors match, why they match, and what happens after every intro.',
  },
  {
    icon: Target,
    title: 'Quality Over Quantity',
    description: 'One warm intro to the right investor beats fifty cold emails. We optimise for signal, not noise.',
  },
  {
    icon: Zap,
    title: 'Speed',
    description: 'Fundraising is time-sensitive. We cut the weeks of research and networking into minutes.',
  },
]

const DIFFERENTIATORS = [
  {
    icon: Shield,
    title: 'Free for Founders',
    description: 'No subscription, no paywall, no hidden charges. Founders get full access to investor matching and warm intros at zero cost.',
  },
  {
    icon: Users,
    title: 'Verified Investors',
    description: 'Every investor on the platform is verified. No fake profiles, no noise — just real fund managers, angels, and family offices.',
  },
  {
    icon: Target,
    title: 'Thesis-Matched Intros',
    description: 'We match based on actual investment thesis — sector, stage, check size, geography. Not vanity metrics.',
  },
  {
    icon: Zap,
    title: 'Warm, Not Cold',
    description: 'Cold outreach has a 2% response rate. Warm intros through FounderCentral have a 10x higher acceptance rate.',
  },
]

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FounderCentral',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'FounderCentral matches founders with investors who back their stage and sector, then opens the door with a warm introduction.',
  foundingDate: '2025',
  slogan: 'The Hub for Ambitious Founders',
  sameAs: [],
}

export function AboutPage() {
  return (
    <div className="marketing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO
        title="About"
        description="FounderCentral connects founders with investors through warm introductions. Learn about our mission, values, and what makes us different."
        path="/about"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
      </Helmet>

      <ScrollProgress />
      <MarketingNav />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          padding: '140px 24px 80px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
        }}>
          <RevealOnScroll>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: 999,
              background: 'rgba(37,99,235,0.1)', color: 'var(--blue)',
              fontSize: 13, fontWeight: 600, marginBottom: 20,
            }}>
              About FounderCentral
            </span>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800,
              color: 'var(--ink)', lineHeight: 1.15, margin: '0 auto 16px',
              maxWidth: 700,
            }}>
              Warm intros to investors who back your stage
            </h1>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--muted)',
              maxWidth: 640, margin: '0 auto', lineHeight: 1.7,
            }}>
              We believe every great startup deserves a fair shot at funding. FounderCentral replaces cold outreach with warm, thesis-matched introductions to verified investors.
            </p>
          </RevealOnScroll>
        </section>

        {/* Mission */}
        <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
          <RevealOnScroll>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
              padding: 'clamp(32px, 5vw, 56px)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 16 }}>
                Why we exist
              </h2>
              <div style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ margin: 0 }}>
                  Fundraising is broken. Founders spend months sending cold emails to investors who don't invest in their sector or stage. Investors drown in irrelevant inbound. Both sides waste time.
                </p>
                <p style={{ margin: 0 }}>
                  FounderCentral fixes this by matching founders with investors based on actual investment thesis — sector focus, stage preference, check size, and geography. Then we facilitate a warm introduction, not a cold pitch.
                </p>
                <p style={{ margin: 0 }}>
                  The result: founders get meetings with investors who are genuinely interested. Investors discover startups that fit their mandate. Fundraising becomes faster, fairer, and less painful for everyone.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </section>

        {/* How We're Different */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <RevealOnScroll>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
                How we're different
              </h2>
              <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
                Not another startup directory. Here's what sets us apart.
              </p>
            </div>
          </RevealOnScroll>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {DIFFERENTIATORS.map((d, i) => (
              <RevealOnScroll key={d.title} delay={i * 0.1}>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
                  padding: 28, height: '100%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(37,99,235,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <d.icon size={22} color="#2563EB" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                    {d.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                    {d.description}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        {/* Our Values */}
        <section style={{
          padding: '80px 24px', background: 'var(--surface-2)',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <RevealOnScroll>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
                  Our values
                </h2>
                <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto' }}>
                  The principles that guide every product decision we make.
                </p>
              </div>
            </RevealOnScroll>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}>
              {VALUES.map((v, i) => (
                <RevealOnScroll key={v.title} delay={i * 0.1}>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16,
                    padding: 28, textAlign: 'center', height: '100%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: 'linear-gradient(135deg, #2563EB 0%, #4ADE80 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <v.icon size={24} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                      {v.title}
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
                      {v.description}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: '80px 24px', textAlign: 'center',
        }}>
          <RevealOnScroll>
            <div style={{
              maxWidth: 600, margin: '0 auto',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: 24, padding: 'clamp(40px, 6vw, 64px)',
              color: 'white',
            }}>
              <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, marginBottom: 12 }}>
                Ready to get started?
              </h2>
              <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 28, lineHeight: 1.6 }}>
                Join thousands of founders who are getting warm intros to the right investors. Free forever.
              </p>
              <Link
                to="/auth/signup"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', borderRadius: 12,
                  background: 'var(--surface)', color: 'var(--blue)',
                  fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 150ms ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
