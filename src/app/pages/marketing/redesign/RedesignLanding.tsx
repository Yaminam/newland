import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { ScrollProgress } from '../lib/ScrollProgress'
import { RevealOnScroll } from '../lib/RevealOnScroll'
// Reused verbatim from the existing marketing folder:
import { FAQ } from '../sections/FAQ'
import { MarketingFooter } from '../sections/MarketingFooter'
// New redesign sections:
import { RedesignNav } from './sections/RedesignNav'
import { HeroMatcher } from './sections/HeroMatcher'
import { LiveTicker } from './sections/LiveTicker'
import { Proof } from './sections/Proof'
import { Audiences } from './sections/Audiences'
import { NetworkMotif } from './sections/NetworkMotif'
import { ForFounders } from './sections/ForFounders'
import { ForInvestors } from './sections/ForInvestors'
import { ForIncubators } from './sections/ForIncubators'
import { About } from './sections/About'
import { Newsletter } from './sections/Newsletter'
import { Transformation } from './sections/Transformation'
import { FoundersBand } from './sections/FoundersBand'
import { HubBento } from './sections/HubBento'
import { VerifiedSupply } from './sections/VerifiedSupply'
import { LiveHub } from './sections/LiveHub'
import { FreeVsGated } from './sections/FreeVsGated'
import { HowItWorks } from './sections/HowItWorks'
import { FinalCTA } from './sections/FinalCTA'
import './redesign.css'

/**
 * Redesigned conversion homepage (v2 — light cinematic).
 *
 * One conversion spine: land → run the live matcher → see real matches with
 * names locked → hit the wall at peak intent → sign up. Borrows a signature
 * move from each reference: cursor-spotlight lit card + count-ups + magnetic
 * CTAs (Linear), aurora depth + glass (super.money), before→after (Wispr),
 * gold verified gatekeeping (Cred), sticky-stack how-it-works (Beside).
 */
export function RedesignLanding() {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const auroraY = useTransform(scrollY, [0, 900], [0, 180])

  return (
    <div className="fc-redesign" style={{ position: 'relative', minHeight: '100dvh' }}>
      <SEO
        title="FounderCentral: See the investors who fit your stage, before you sign up"
        bareTitle
        description="Run a live investor match in seconds, no email needed. Pick your stage, sector and city and see real investors from our directory who back founders like you. Free for founders."
        path="/"
      />

      {/* Cinematic background — parallaxes with scroll, behind the hero */}
      <motion.div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1080, overflow: 'hidden', zIndex: 0, y: reduce ? 0 : auroraY }}>
        <div className="rd-aurora"><span className="a1" /><span className="a2" /><span className="a3" /></div>
        <div className="rd-grid" />
      </motion.div>

      <ScrollProgress />
      <RedesignNav />
      <main className="relative" style={{ zIndex: 1 }}>
        <HeroMatcher />
        <LiveTicker />
        <RevealOnScroll><Proof /></RevealOnScroll>
        <RevealOnScroll><Audiences /></RevealOnScroll>
        <NetworkMotif />
        <RevealOnScroll><Transformation /></RevealOnScroll>
        <FoundersBand />
        <RevealOnScroll><HubBento /></RevealOnScroll>
        <RevealOnScroll><VerifiedSupply /></RevealOnScroll>
        <RevealOnScroll><LiveHub /></RevealOnScroll>
        <RevealOnScroll><FreeVsGated /></RevealOnScroll>
        <HowItWorks />
        {/* One dedicated lane per audience. */}
        <ForFounders />
        <ForInvestors />
        <ForIncubators />
        <RevealOnScroll><About /></RevealOnScroll>
        <RevealOnScroll><Newsletter /></RevealOnScroll>
        <RevealOnScroll><FAQ /></RevealOnScroll>
        <RevealOnScroll><FinalCTA /></RevealOnScroll>
      </main>
      <MarketingFooter />
    </div>
  )
}
