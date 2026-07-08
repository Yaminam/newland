import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/context/AuthContext'
import { SEO } from '@/app/components/SEO'
import { MarketingNav } from './sections/MarketingNav'
import { Hero } from './sections/Hero'
import { ValueStrip } from './sections/ValueStrip'
import { Problem } from './sections/Problem'
import { HowItWorks } from './sections/HowItWorks'
import { Features } from './sections/Features'
import { Trust } from './sections/Trust'
import { InvestorsStrip } from './sections/InvestorsStrip'
import { MobileWaitlist } from './sections/MobileWaitlist'
import { Newsletter } from './sections/Newsletter'
import { FAQ } from './sections/FAQ'
import { FinalCTA } from './sections/FinalCTA'
import { MarketingFooter } from './sections/MarketingFooter'
import { Incubation } from './sections/Incubation'
import { RevealOnScroll } from './lib/RevealOnScroll'
import { ScrollProgress } from './lib/ScrollProgress'

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="marketing-page" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <SEO
        title="FounderCentral: Discover stage-relevant investors & request curated introductions"
        bareTitle
        description="FounderCentral helps founders discover relevant VCs, angels, family offices, and strategic investors, then request curated warm introductions based on sector, stage, geography, ticket size, and funding intent."
        path="/"
      />
      <ScrollProgress />
      <MarketingNav />
      <main>
        {/* Hero animates internally on mount; no scroll-reveal wrapper needed */}
        <Hero />
        {/* ValueStrip has its own in-view reveal; no wrapper needed */}
        <ValueStrip />
        <RevealOnScroll><Problem /></RevealOnScroll>
        <RevealOnScroll><HowItWorks /></RevealOnScroll>
        <RevealOnScroll><Features /></RevealOnScroll>
        <RevealOnScroll><Incubation /></RevealOnScroll>
        <RevealOnScroll><Trust /></RevealOnScroll>
        <RevealOnScroll><InvestorsStrip /></RevealOnScroll>
        <RevealOnScroll><Newsletter /></RevealOnScroll>
        <RevealOnScroll><MobileWaitlist /></RevealOnScroll>
        <RevealOnScroll><FAQ /></RevealOnScroll>
        <RevealOnScroll><FinalCTA /></RevealOnScroll>
      </main>
      <MarketingFooter />
    </div>
  )
}
