import { Outlet, Link } from 'react-router-dom'
import { FounderCentralLogo } from '@/app/components/FounderCentralLogo'
import { ArrowUpRight, TrendingUp, Users, Handshake, BarChart3, Shield, BriefcaseBusiness } from 'lucide-react'

/**
 * Auth shell — split layout with product showcase left panel + form right panel.
 * Inspired by BIDSuite-style auth with floating UI cards showcasing the product.
 */
export function AuthLayout() {
  return (
    <div className="marketing-page" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left branded panel — product showcase — hidden on mobile */}
      <div
        className="hidden lg:flex"
        style={{
          width: '48%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(160deg, #FFFFFF 0%, #EFF6FF 30%, #DBEAFE 70%, #BFDBFE 100%)',
          padding: '36px 44px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(37,99,235,0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            pointerEvents: 'none',
          }}
        />

        {/* Diagonal accent line */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            border: '1px solid rgba(37,99,235,0.08)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -200,
            width: 600,
            height: 600,
            border: '1px solid rgba(37,99,235,0.06)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Top: Logo + tagline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: 24 }}>
            <FounderCentralLogo size="md" />
          </Link>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-display)',
              margin: '0 0 8px',
            }}
          >
            Simplify Fundraising &{'\n'}Investor Relations.
          </h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            AI-powered matching, deal rooms, CRM, and pipeline management —
            everything founders need to close their round, in one place.
          </p>
        </div>

        {/* Middle: Floating UI showcase cards */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: 340 }}>

            {/* Main dashboard card */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 300,
                background: '#FFFFFF',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04)',
                padding: '20px',
                border: '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pipeline Overview</span>
              </div>
              {/* Mini pipeline stages */}
              {[
                { label: 'Leads', count: 24, color: '#3B82F6', width: '85%' },
                { label: 'In Conversation', count: 12, color: '#8B5CF6', width: '55%' },
                { label: 'Term Sheet', count: 5, color: '#F59E0B', width: '30%' },
                { label: 'Closed', count: 3, color: '#22C55E', width: '18%' },
              ].map(stage => (
                <div key={stage.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{stage.label}</span>
                    <span style={{ fontSize: 11, color: '#0F172A', fontWeight: 700 }}>{stage.count}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: '#F1F5F9' }}>
                    <div style={{ height: '100%', borderRadius: 2, background: stage.color, width: stage.width, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats cards - overlapping */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {/* Stat card 1 */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.07)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  width: 150,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: 14, height: 14, color: '#2563EB' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investors</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>248</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>+12.5%</span>
                </div>
              </div>

              {/* Stat card 2 */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.07)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  width: 150,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Handshake style={{ width: 14, height: 14, color: '#16A34A' }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intros</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>56</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>+8.3%</span>
                </div>
              </div>
            </div>

            {/* Bottom card - Deal Room preview */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 20,
                right: 20,
                background: '#FFFFFF',
                borderRadius: 14,
                padding: '16px 20px',
                boxShadow: '0 6px 24px rgba(15,23,42,0.08)',
                border: '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BriefcaseBusiness style={{ width: 14, height: 14, color: '#D97706' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Active Deal Rooms</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>7</span>
              </div>
              {/* Mini deal list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Series A — Acme Ventures', status: 'Due Diligence', statusColor: '#8B5CF6' },
                  { name: 'Seed — Peak Capital', status: 'Term Sheet', statusColor: '#F59E0B' },
                  { name: 'Pre-Seed — AngelFund', status: 'Closed', statusColor: '#22C55E' },
                ].map(deal => (
                  <div key={deal.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{deal.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: deal.statusColor,
                        background: `${deal.statusColor}14`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {deal.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: trust indicators + link */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { icon: Shield, text: 'Bank-grade security' },
              { icon: BarChart3, text: 'AI-powered matching' },
              { icon: TrendingUp, text: 'Trusted by 500+ founders' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon style={{ width: 13, height: 13, color: '#94A3B8' }} />
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: '#94A3B8',
              textDecoration: 'none',
            }}
          >
            foundercentral.in <ArrowUpRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </div>

      {/* Right form panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          minHeight: '100vh',
        }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden" style={{ textAlign: 'center', padding: '24px 20px 0' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <FounderCentralLogo size="md" />
          </Link>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 24px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
