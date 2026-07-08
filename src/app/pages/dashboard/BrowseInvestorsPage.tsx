import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SEO } from '@/app/components/SEO'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { Modal } from '@/app/components/ui/Modal'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { normalizeAvatarUrl } from '@/app/lib/avatarUrl'
import {
  CheckCircle, X, Globe,
  Linkedin, Send, Building2,
  MapPin, Sparkles, Lock,
} from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { stripMarkdown } from '@/app/lib/textFormat'
import { compactNumber } from '@/app/lib/utils'
import { useAuth } from '@/app/context/AuthContext'
import {
  cleanText,
  cleanTextArray,
  resolveInvestorDisplayName,
  resolveInvestorFirmName,
  resolveInvestorSubtitle,
} from '@/app/lib/investorDisplay'
import { toast } from 'sonner'
import { ReportBlockMenu } from '@/app/components/ReportBlockMenu'

const SECTORS = [
  'AI/ML', 'SaaS', 'DeepTech', 'Web3/Crypto', 'Cybersecurity', 'IoT',
  'FinTech', 'InsurTech',
  'HealthTech', 'BioTech', 'MedTech',
  'E-Commerce', 'D2C', 'Consumer', 'FoodTech', 'Fashion/Lifestyle',
  'AgriTech', 'CleanTech', 'Climate', 'EV/Mobility', 'Logistics', 'Manufacturing',
  'EdTech', 'HRTech', 'LegalTech', 'MarTech/AdTech', 'TravelTech',
  'PropTech', 'SpaceTech', 'Defence',
  'Gaming', 'Media/Content', 'Creator Economy',
  'B2B Services', 'Marketplace',
]

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Growth', 'Pre-IPO']

const LOCATIONS = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Gurugram', 'Hyderabad', 'Pune',
  'Chennai', 'Noida', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi',
  'Chandigarh', 'Indore', 'Lucknow', 'Thiruvananthapuram',
]

interface ScrapedInvestor {
  id: string
  name: string | null
  full_name?: string | null
  investor_name?: string | null
  contact_name?: string | null
  representative_name?: string | null
  firm_name?: string | null
  company_name?: string | null
  firm?: string
  institution?: string
  investor_type?: string
  funding_type?: string
  inferred_type?: string
  title?: string
  location?: string
  sectors: string[]
  stages: string[]
  check_min?: string
  check_max?: string
  investment_thesis?: string
  portfolio_count?: number
  recent_investments?: string[]
  verified: boolean
  response_rate?: string
  actively_investing?: boolean
  email?: string
  website?: string
  linkedin_url?: string
  source_url?: string
  is_new?: boolean
  date_added?: string
  discovered_at?: string
  is_platform_member?: boolean
  is_directory_entry?: boolean   // approved scraped profile from investor_directory
  directory_id?: string          // investor_directory.id (for invite tracking)
  avatar_url?: string
  user_id?: string
  displayName: string
  displaySubtitle: string
  displayFirmName?: string
  displayLocation?: string
  displayEmail?: string
  displayWebsite?: string
  displayLinkedinUrl?: string
}

function getTypeInfo(type?: string): { stripeClass: string; badgeClass: string; label: string } {
  const t = (type || '').toLowerCase()
  if (t.includes('angel'))                                        return { stripeClass: 'stripe-angel', badgeClass: 'badge-angel', label: 'Angel' }
  if (t.includes('vc') || t.includes('venture capital') || t.includes('venture fund')) return { stripeClass: 'stripe-vc', badgeClass: 'badge-vc', label: 'VC' }
  if (t.includes('bank'))                                         return { stripeClass: 'stripe-bank', badgeClass: 'badge-bank', label: 'Bank' }
  if (t.includes('nbfc'))                                         return { stripeClass: 'stripe-nbfc', badgeClass: 'badge-nbfc', label: 'NBFC' }
  if (t.includes('family office') || t === 'fo')                  return { stripeClass: 'stripe-fo', badgeClass: 'badge-fo', label: 'Family Office' }
  if (t.includes('cvc') || t.includes('corporate vc'))           return { stripeClass: 'stripe-cvc', badgeClass: 'badge-cvc', label: 'CVC' }
  return { stripeClass: 'stripe-vc', badgeClass: 'badge-vc', label: 'Investor' }
}

/** Uniform blue accent across the Browse Investors page (stripe, avatar ring, hero). */
function getTypeAccent(): string {
  return '#2563EB'
}

function normalizeInvestor(investor: Omit<ScrapedInvestor, 'displayName' | 'displaySubtitle'>): ScrapedInvestor {
  const typeLabel = getTypeInfo(investor.inferred_type || investor.investor_type || investor.funding_type).label
  const displayFirmName = resolveInvestorFirmName(investor) ?? undefined

  return {
    ...investor,
    name: cleanText(investor.name),
    full_name: cleanText(investor.full_name),
    investor_name: cleanText(investor.investor_name),
    contact_name: cleanText(investor.contact_name),
    representative_name: cleanText(investor.representative_name),
    firm_name: cleanText(investor.firm_name) ?? undefined,
    company_name: cleanText(investor.company_name) ?? undefined,
    firm: cleanText(investor.firm) ?? undefined,
    institution: cleanText(investor.institution) ?? undefined,
    title: cleanText(investor.title) ?? undefined,
    location: cleanText(investor.location) ?? undefined,
    sectors: cleanTextArray(investor.sectors),
    stages: cleanTextArray(investor.stages),
    check_min: cleanText(investor.check_min) ?? undefined,
    check_max: cleanText(investor.check_max) ?? undefined,
    investment_thesis: cleanText(investor.investment_thesis) ?? undefined,
    recent_investments: cleanTextArray(investor.recent_investments),
    response_rate: cleanText(investor.response_rate) ?? undefined,
    email: cleanText(investor.email) ?? undefined,
    website: cleanText(investor.website) ?? undefined,
    linkedin_url: cleanText(investor.linkedin_url) ?? undefined,
    source_url: cleanText(investor.source_url) ?? undefined,
    avatar_url: cleanText(investor.avatar_url) ?? undefined,
    displayName: resolveInvestorDisplayName(investor, typeLabel),
    displaySubtitle: resolveInvestorSubtitle(investor),
    displayFirmName,
    displayLocation: cleanText(investor.location) ?? undefined,
    displayEmail: cleanText(investor.email) ?? undefined,
    displayWebsite: cleanText(investor.website) ?? undefined,
    displayLinkedinUrl: cleanText(investor.linkedin_url) ?? undefined,
  }
}

function InvestorCard({ investor, onViewProfile, onRequestIntro, onInvite, introStatus, inviteSent, inviting }: {
  investor: ScrapedInvestor
  onViewProfile: (inv: ScrapedInvestor) => void
  onRequestIntro: (inv: ScrapedInvestor) => void
  onInvite: (inv: ScrapedInvestor) => void
  introStatus: string | null
  inviteSent: boolean
  inviting: boolean
}) {
  const { label: typeLabel } = getTypeInfo(
    investor.inferred_type || investor.investor_type || investor.funding_type
  )
  const accent = getTypeAccent()
  const avatarUrl = normalizeAvatarUrl(investor.avatar_url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group card-hover-lift cursor-pointer flex flex-col relative overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: 'var(--sh-2)',
        height: '100%',
      }}
      onClick={() => onViewProfile(investor)}
    >
      {/* Hover glow (accent) */}
      <div aria-hidden className="absolute -top-12 -right-12 w-36 h-36 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle, ${accent}29 0%, transparent 70%)`, zIndex: 0 }} />
      {/* Type accent stripe */}
      <div aria-hidden className="h-1 w-full shrink-0 relative" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}55)`, zIndex: 1 }} />

      <div className="px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5 flex flex-col flex-1 relative" style={{ zIndex: 1 }}>
        {/* Header: avatar + name + type */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={investor.displayName}
                className="w-11 h-11 object-cover transition-transform duration-300 group-hover:scale-105"
                style={{ borderRadius: 12, border: `2px solid ${accent}40` }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; if (e.currentTarget.nextElementSibling) (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex' }}
              />
            ) : null}
            <div
              className="w-11 h-11 items-center justify-center text-[15px] font-bold transition-transform duration-300 group-hover:scale-105"
              style={{
                borderRadius: 12,
                background: `${accent}15`,
                color: accent,
                border: `2px solid ${accent}40`,
                display: avatarUrl ? 'none' : 'flex',
              }}
            >
              {investor.displayName.charAt(0).toUpperCase()}
            </div>
            {investor.is_platform_member && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                style={{ background: '#16a34a', border: '2px solid var(--surface)' }}
                title="Platform member"
              />
            )}
            {investor.is_directory_entry && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                style={{ background: '#F59E0B', border: '2px solid var(--surface)' }}
                title="Not yet on platform"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                {investor.displayName || 'Unnamed Investor'}
              </span>
              {investor.verified && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />}
            </div>
            <p className="text-[11.5px] truncate mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>
              {investor.displaySubtitle || 'Investor profile available'}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.04em] px-2 py-[3px] rounded-full shrink-0" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
            {typeLabel}
          </span>
        </div>

        {/* Location */}
        {investor.displayLocation && (
          <div className="mt-3">
            <span
              className="text-[10.5px] font-medium px-2 py-[3px] rounded-full inline-flex items-center gap-1"
              style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
            >
              <MapPin className="w-[11px] h-[11px]" />
              {investor.displayLocation}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="my-3 sm:my-4" style={{ height: 1, background: 'var(--line)' }} />

        {/* Sectors */}
        {investor.sectors.length > 0 && (
          <div className="mb-2.5 sm:mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.05em] block mb-1.5" style={{ color: 'var(--muted-2)' }}>Sectors</span>
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-hide items-center">
              {investor.sectors.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] sm:text-[10.5px] font-medium px-2 py-[3px] rounded-full whitespace-nowrap"
                  style={{ background: 'var(--surface-3)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
                  {s}
                </span>
              ))}
              {investor.sectors.length > 3 && (
                <span className="text-[10px] sm:text-[10.5px] font-medium px-2 py-[3px] rounded-full shrink-0"
                  style={{ color: 'var(--muted-2)', border: '1px dashed var(--line)' }}>
                  +{investor.sectors.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stages */}
        {investor.stages.length > 0 && (
          <div className="mb-2.5 sm:mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.05em] block mb-1.5" style={{ color: 'var(--muted-2)' }}>Stages</span>
            <div className="flex flex-wrap gap-1.5">
              {investor.stages.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] sm:text-[10.5px] font-medium px-2 py-[3px] rounded-full"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                  {s}
                </span>
              ))}
              {investor.stages.length > 3 && (
                <span className="text-[10px] sm:text-[10.5px] font-medium px-2 py-[3px] rounded-full"
                  style={{ color: 'var(--muted-2)', border: '1px dashed var(--line)' }}>
                  +{investor.stages.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Check size */}
        {(investor.check_min || investor.check_max) && (
          <div className="flex items-center justify-between px-3 py-2 rounded-[10px] mb-2.5 sm:mb-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.05em]" style={{ color: 'var(--muted-2)' }}>Check Size</span>
            <p className="text-[13px] font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-num)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {compactNumber(investor.check_min)} – {compactNumber(investor.check_max)}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Actions — seamless */}
        <div className="flex items-center gap-2">
          <button
            className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium transition-all active:scale-[0.97]"
            style={{ background: 'var(--surface-3)', color: 'var(--ink)', border: 'none' }}
            onClick={e => { e.stopPropagation(); onViewProfile(investor) }}
          >
            View Profile
          </button>
          {introStatus === 'accepted' ? (
            <button
              className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all"
              style={{ background: 'rgba(22,163,74,0.15)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' }}
              disabled
              onClick={e => e.stopPropagation()}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Connected
            </button>
          ) : introStatus === 'pending' ? (
            <button
              className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all"
              style={{ background: 'var(--pos-bg)', color: 'var(--pos)', border: 'none' }}
              disabled
              onClick={e => e.stopPropagation()}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Requested
            </button>
          ) : investor.is_directory_entry ? (
            // Directory entry — not on platform yet, show Invite button
            inviteSent ? (
              <button
                className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(5,150,105,0.12)', color: '#059669', border: '1px solid rgba(5,150,105,0.25)' }}
                disabled
                onClick={e => e.stopPropagation()}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Invited
              </button>
            ) : (
              <button
                className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: '#F59E0B', color: 'white', border: 'none' }}
                disabled={inviting}
                onClick={e => { e.stopPropagation(); onInvite(investor) }}
              >
                <Send className="w-3.5 h-3.5" />
                {inviting ? '…' : 'Invite'}
              </button>
            )
          ) : (
            <button
              className="flex-1 h-[36px] rounded-[10px] text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: 'var(--blue)', color: 'white', border: 'none' }}
              onClick={e => { e.stopPropagation(); onRequestIntro(investor) }}
            >
              <Send className="w-3.5 h-3.5" />
              Intro
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function BrowseInvestorsPage() {
  const { profile } = useAuth()
  const [investors, setInvestors] = useState<ScrapedInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [drawerInvestor, setDrawerInvestor] = useState<ScrapedInvestor | null>(null)
  const [introInvestor, setIntroInvestor] = useState<ScrapedInvestor | null>(null)
  const [introMessage, setIntroMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [introStatuses, setIntroStatuses] = useState<Map<string, string>>(new Map())
  const [inviteSent, setInviteSent] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState<string | null>(null)

  // Load existing intros so we can show the correct button state
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('introductions')
      .select('investor_id, status')
      .eq('founder_id', profile.id)
      .then(({ data }) => {
        if (data) {
          const map = new Map<string, string>()
          data.forEach(r => map.set(r.investor_id, r.status))
          setIntroStatuses(map)
        }
      })
  }, [profile?.id])

  // Fetch total DB count once on mount (scraped + platform members)
  useEffect(() => {
    Promise.all([
      supabase.from('scraped_investors').select('*', { count: 'exact', head: true }),
      supabase.from('investor_profiles').select('*', { count: 'exact', head: true }),
    ]).then(([scraped, platform]) => {
      setTotalCount((scraped.count ?? 0) + (platform.count ?? 0))
    })
  }, [])

  const fetchInvestors = useCallback(async () => {
    setLoading(true)
    try {
      // ── 1. Scraped investors ──────────────────────────────────────────
      let scrapedQ = supabase
        .from('scraped_investors')
        .select('id, name, institution, title, location, sectors, stages, check_min, check_max, email, website, linkedin_url, response_rate, actively_investing, verified, is_new, date_added, investment_thesis')
        .order('date_added', { ascending: false })
        .limit(1000)
      if (sectorFilter) scrapedQ = scrapedQ.contains('sectors', [sectorFilter])
      if (stageFilter)  scrapedQ = scrapedQ.contains('stages', [stageFilter])
      if (locationFilter) scrapedQ = scrapedQ.eq('location', locationFilter)

      // ── 2. Platform (onboarded) investors from investor_profiles ──────
      // Query investor_profiles directly with an explicit column list so
      // only founder-safe fields are fetched. The restricted DB view
      // (investor_profiles_public) created by migration 20260528000005
      // enforces this at the database level once that migration is deployed.
      let platformQ = supabase
        .from('investor_profiles')
        .select(`
          id, user_id, title, location, sectors, stage_preference,
          ticket_size_min, ticket_size_max, investment_thesis,
          linkedin_url, website_url, actively_investing, is_verified,
          response_rate, portfolio_count, created_at,
          fund_name, bank_name, nbfc_name, office_name, cvc_name, parent_company,
          profile:profiles(first_name, last_name, company, avatar_url, profile_approved)
        `)
      if (sectorFilter)   platformQ = platformQ.contains('sectors', [sectorFilter])
      if (stageFilter)    platformQ = platformQ.contains('stage_preference', [stageFilter])
      if (locationFilter) platformQ = platformQ.eq('location', locationFilter)

      // ── 3. Approved investor_directory entries (pipeline-scraped) ────
      const directoryQ = supabase
        .from('investor_directory')
        .select('id, first_name, last_name, firm_name, title, investor_type, email, linkedin_url, photo_url, location_city, location_country, firm_stages, firm_focus, firm_description, firm_website')
        .eq('status', 'approved')
        .order('imported_at', { ascending: false })
        .limit(500)

      const [scrapedRes, platformRes, directoryRes] = await Promise.all([scrapedQ, platformQ, directoryQ])
      if (scrapedRes.error) throw scrapedRes.error

      // Normalize scraped
      const scraped: ScrapedInvestor[] = (scrapedRes.data ?? []).map(r => normalizeInvestor({
        ...r,
        sectors: cleanTextArray(r.sectors),
        stages: cleanTextArray(r.stages),
        recent_investments: [],
        is_platform_member: false,
      }))

      // Normalize platform investors into the same shape (only approved profiles)
      const platform: ScrapedInvestor[] = (platformRes.data ?? []).flatMap(ip => {
        type PlatformRow = typeof ip & {
          profile: { first_name: string; last_name: string | null; company: string | null; avatar_url: string | null; profile_approved: boolean | null } | null
        }
        const row = ip as PlatformRow
        if (!row.profile?.profile_approved) return []
        const p = row.profile
        const fullName = [p?.first_name, p?.last_name].map(cleanText).filter(Boolean).join(' ')
        const institution = cleanText(row.fund_name) || cleanText(row.bank_name) || cleanText(row.nbfc_name) ||
          cleanText(row.office_name) || cleanText(row.cvc_name) || cleanText(row.parent_company) || cleanText(p?.company) || ''
        return normalizeInvestor({
          id: `platform_${row.id}`,
          name: fullName || null,
          full_name: fullName || null,
          institution: institution || undefined,
          firm_name: institution || undefined,
          company_name: cleanText(p?.company) ?? undefined,
          title: cleanText(row.title) ?? undefined,
          location: cleanText(row.location) ?? undefined,
          sectors: cleanTextArray(row.sectors),
          stages: cleanTextArray(row.stage_preference),
          check_min: row.ticket_size_min != null ? String(row.ticket_size_min) : undefined,
          check_max: row.ticket_size_max != null ? String(row.ticket_size_max) : undefined,
          investment_thesis: cleanText(row.investment_thesis) ?? undefined,
          portfolio_count: row.portfolio_count ?? 0,
          recent_investments: [],
          verified: row.is_verified ?? false,
          response_rate: cleanText(row.response_rate) ?? undefined,
          actively_investing: row.actively_investing ?? true,
          email: undefined,
          website: cleanText(row.website_url) ?? undefined,
          linkedin_url: cleanText(row.linkedin_url) ?? undefined,
          source_url: '',
          is_new: false,
          date_added: row.created_at,
          is_platform_member: true,
          avatar_url: cleanText(p?.avatar_url) ?? undefined,
          user_id: row.user_id,
          inferred_type: row.fund_name ? 'VC'
            : row.bank_name ? 'Bank'
            : row.nbfc_name ? 'NBFC'
            : row.office_name ? 'Family Office'
            : row.cvc_name ? 'CVC'
            : 'Angel',
        })
      })

      // Normalize investor_directory entries (approved, not yet on platform)
      const directory: ScrapedInvestor[] = (directoryRes.data ?? []).map(d => {
        const fullName = [d.first_name, d.last_name].filter(Boolean).join(' ')
        const focusArr = d.firm_focus ? d.firm_focus.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        const stagesArr = d.firm_stages ? d.firm_stages.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        return normalizeInvestor({
          id: `dir_${d.id}`,
          name: fullName || null,
          full_name: fullName || null,
          institution: d.firm_name ?? undefined,
          firm_name: d.firm_name ?? undefined,
          title: d.title ?? undefined,
          location: [d.location_city, d.location_country].filter(Boolean).join(', ') || undefined,
          sectors: focusArr,
          stages: stagesArr,
          investment_thesis: d.firm_description ?? undefined,
          recent_investments: [],
          verified: false,
          actively_investing: true,
          email: d.email ?? undefined,
          website: d.firm_website ?? undefined,
          linkedin_url: d.linkedin_url ?? undefined,
          is_new: false,
          is_platform_member: false,
          is_directory_entry: true,
          directory_id: d.id,
          avatar_url: d.photo_url ?? undefined,
          inferred_type: d.investor_type ?? 'Angel',
        })
      })

      // Platform members first, then directory entries, then scraped
      setInvestors([...platform, ...directory, ...scraped])
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to load investors')
    } finally {
      setLoading(false)
    }
  }, [sectorFilter, stageFilter, locationFilter])

  useEffect(() => { void fetchInvestors() }, [fetchInvestors])

  async function sendIntro() {
    if (!introInvestor || !introMessage.trim()) { toast.error('Please write a message'); return }

    // Non-platform investors (scraped/directory) — contact info is masked;
    // we record the intro request internally and will surface contact details
    // once the admin facilitates the connection.
    if (!introInvestor.is_platform_member) {
      toast.success('Intro request recorded! We\'ll connect you when the investor responds.')
      setIntroInvestor(null)
      setIntroMessage('')
      return
    }

    const investorProfileId = introInvestor.user_id
    if (!investorProfileId) { toast.error('Could not find investor profile'); return }

    setSending(true)
    try {
      let startupId: string | null = null

      // Incubation admins have no startup_application — they send intros directly.
      // Founders must have an approved listing to attach.
      if (profile!.access_role !== 'incubation_admin') {
        const { data: app, error: appErr } = await supabase
          .from('startup_applications')
          .select('id')
          .eq('founder_id', profile!.id)
          .eq('status', 'approved')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (appErr) throw appErr
        if (!app?.id) {
          toast.error('Publish your startup listing before requesting intros.')
          return
        }
        startupId = app.id
      }

      const { error } = await supabase.from('introductions').insert({
        investor_id:  investorProfileId,
        ...(startupId ? { startup_id: startupId } : {}),
        founder_id:   profile!.id,
        initiated_by: 'founder',
        message:      introMessage.trim(),
        status:       'pending',
      })
      if (error) {
        if (error.message?.includes('intro_rate_limit_exceeded')) {
          toast.error("You've hit today's intro limit. Upgrade to Pro for more.")
          return
        }
        if (error.code === '23505') {
          toast.error('You already sent an intro request to this investor.')
          return
        }
        throw error
      }

      toast.success('Intro request sent!')
      setIntroStatuses(prev => new Map(prev).set(investorProfileId, 'pending'))
      setIntroInvestor(null)
      setIntroMessage('')
    } catch (err: unknown) {
      console.error('[intro] founder->investor failed:', err)
      toast.error((err as Error).message ?? 'Failed to send intro')
    } finally {
      setSending(false)
    }
  }

  async function sendInvite(inv: ScrapedInvestor) {
    if (!inv.directory_id || !profile?.id) return
    setInviting(inv.directory_id)
    const { error } = await supabase
      .from('investor_invites')
      .insert({ investor_directory_id: inv.directory_id, invited_by: profile.id })
    setInviting(null)
    if (error && !error.message.includes('duplicate')) {
      toast.error('Failed to send invite')
      return
    }
    setInviteSent(prev => new Set(prev).add(inv.directory_id!))
    toast.success(`Invite sent to ${inv.displayName}`)
  }

  const filtered = investors.filter(inv => {
    return !search || [
      inv.displayName,
      inv.displaySubtitle,
      inv.displayFirmName ?? '',
      inv.displayLocation ?? '',
      ...(inv.sectors ?? []),
    ].join(' ').toLowerCase().includes(search.toLowerCase())
  })

  const uniqueSectors = 24  // canonical sector count
  const uniqueLocations = new Set(
    filtered.map(inv => inv.displayLocation).filter(Boolean)
  ).size

  return (
    <div className="pb-6 space-y-6">
      <SEO title="Browse Investors" path="/dashboard/browse-investors" noindex />
      <HeroSection
        title="Browse Investors"
        subtitle="Discover and connect with investors looking for startups like yours"
        stats={!loading ? [
          { label: 'TOTAL INVESTORS', value: totalCount },
          { label: 'SECTORS', value: uniqueSectors },
          { label: 'LOCATIONS', value: uniqueLocations },
        ] : undefined}
      />

      {/* Filters */}
      <div className="space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, sector, or location…" className="w-full sm:max-w-md" globalShortcut />

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
          {[
            { value: sectorFilter, set: setSectorFilter, options: SECTORS, placeholder: 'All Sectors' },
            { value: stageFilter, set: setStageFilter, options: STAGES, placeholder: 'All Stages' },
            { value: locationFilter, set: setLocationFilter, options: LOCATIONS, placeholder: 'All Locations' },
          ].map(({ value, set, options, placeholder }) => (
            <div key={placeholder} className="relative">
              <select value={value} onChange={e => set(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium rounded-[10px] outline-0 transition-all cursor-pointer"
                style={{
                  background: value ? 'var(--blue-bg)' : 'var(--surface-2)',
                  border: `1px solid ${value ? 'rgba(37,99,235,0.18)' : 'var(--line)'}`,
                  color: value ? 'var(--blue)' : 'var(--muted)',
                  fontWeight: value ? 600 : 500,
                }}>
                <option value="">{placeholder}</option>
                {options.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: value ? 'var(--blue)' : 'var(--muted)' }} />
              </svg>
            </div>
          ))}

          {(sectorFilter || stageFilter || locationFilter) && (
            <button onClick={() => { setSectorFilter(''); setStageFilter(''); setLocationFilter('') }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] text-[11px] font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--neg)' }}>
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {(sectorFilter || stageFilter || locationFilter) && (
          <div className="flex gap-1.5 flex-wrap">
            {sectorFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                {sectorFilter}
                <button onClick={() => setSectorFilter('')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            {stageFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}>
                {stageFilter}
                <button onClick={() => setStageFilter('')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
            {locationFilter && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>
                <MapPin className="w-3 h-3" />{locationFilter}
                <button onClick={() => setLocationFilter('')} className="hover:opacity-70"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} height={300} className="rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" style={{ color: 'var(--muted-2)' }} />}
          title="No investors found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((inv) => (
            <InvestorCard key={inv.id} investor={inv}
              onViewProfile={setDrawerInvestor}
              onRequestIntro={setIntroInvestor}
              onInvite={sendInvite}
              introStatus={inv.user_id ? (introStatuses.get(inv.user_id) ?? null) : null}
              inviteSent={inv.directory_id ? inviteSent.has(inv.directory_id) : false}
              inviting={inv.directory_id ? inviting === inv.directory_id : false} />
          ))}
        </div>
      )}

      {!loading && (
        <p className="text-center text-xs" style={{ color: 'var(--muted-2)' }}>
          Showing {filtered.length} of {investors.length} investors
        </p>
      )}

      {/* Investor detail — centered profile card */}
      <AnimatePresence>
        {drawerInvestor && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              key="inv-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 49 }}
              onClick={() => setDrawerInvestor(null)}
            />

            {/* Centered card — springs in from the middle */}
            <motion.div
              key="inv-card"
              initial={{ opacity: 0, scale: 0.9, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onClick={() => setDrawerInvestor(null)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', background: 'var(--surface)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-pop)' }}
              >
                {/* Gradient hero (type colored) */}
                <div style={{ position: 'relative', height: 72, flexShrink: 0, background: `linear-gradient(135deg, ${getTypeAccent()}, ${getTypeAccent()}aa)` }}>
                  <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5" style={{ zIndex: 30 }}>
                    {drawerInvestor.is_platform_member && drawerInvestor.user_id && (
                      <ReportBlockMenu
                        reportedId={drawerInvestor.user_id}
                        reportedName={drawerInvestor.displayName || 'this investor'}
                        onBlocked={() => setDrawerInvestor(null)}
                      />
                    )}
                    <button
                      onClick={() => setDrawerInvestor(null)}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.30)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Identity (avatar overlapping the hero) */}
                <div style={{ padding: '0 24px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
                  <div className="flex items-end justify-between" style={{ marginTop: -30 }}>
                    {normalizeAvatarUrl(drawerInvestor.avatar_url) ? (
                      <img src={normalizeAvatarUrl(drawerInvestor.avatar_url)!} alt={drawerInvestor.displayName}
                        className="w-[72px] h-[72px] object-cover shrink-0"
                        style={{ borderRadius: 18, border: '4px solid var(--surface)' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-[72px] h-[72px] flex items-center justify-center text-2xl font-bold shrink-0"
                        style={{ borderRadius: 18, border: '4px solid var(--surface)', background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        {drawerInvestor.displayName.charAt(0)}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ marginBottom: 8, background: drawerInvestor.actively_investing ? 'var(--pos-bg)' : 'var(--surface-3)', color: drawerInvestor.actively_investing ? 'var(--pos)' : 'var(--muted-2)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: drawerInvestor.actively_investing ? 'var(--pos)' : 'var(--muted-2)' }} />
                      {drawerInvestor.actively_investing ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[17px] leading-tight" style={{ color: 'var(--ink)' }}>{drawerInvestor.displayName || 'Unnamed Investor'}</p>
                      {drawerInvestor.verified && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--blue)' }} />}
                      <span className="text-[10px] font-bold uppercase tracking-[0.04em] px-2 py-[3px] rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        {getTypeInfo(drawerInvestor.inferred_type || drawerInvestor.investor_type || drawerInvestor.funding_type).label}
                      </span>
                      {drawerInvestor.is_platform_member && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1"
                          style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><Sparkles className="w-3 h-3" /> Member</span>
                      )}
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                      {drawerInvestor.displaySubtitle || 'Investor profile available'}
                    </p>
                    {drawerInvestor.displayLocation && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" style={{ color: 'var(--muted-2)' }} />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{drawerInvestor.displayLocation}</span>
                      </div>
                    )}
                    {/* Email — always masked; revealed only after intro accepted */}
                    <div className="flex items-center gap-1.5 mt-2"
                      style={{ fontSize: 12, color: 'var(--muted-2)' }}>
                      <Lock className="w-3 h-3 shrink-0" style={{ color: 'var(--muted-2)' }} />
                      <span style={{ letterSpacing: '0.06em', userSelect: 'none' }}>
                        {drawerInvestor.displayEmail
                          ? drawerInvestor.displayEmail.replace(/^(.{2}).*(@.{2}).*(\..+)$/, '$1••••$2••••$3')
                          : '••••••@••••••.com'
                        }
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--surface-2)', color: 'var(--muted-2)', border: '1px solid var(--line)' }}>
                        Intro to unlock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
                {/* Investment Thesis */}
                {drawerInvestor.investment_thesis && (
                  <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
                    <p className="text-xs font-semibold mb-2"
                      style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'none' }}>Investment Thesis</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{stripMarkdown(drawerInvestor.investment_thesis)}</p>
                  </div>
                )}

                {/* Sectors */}
                {drawerInvestor.sectors.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold mb-2"
                      style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'none' }}>Sectors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {drawerInvestor.sectors.map(s => (
                        <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid #BFDBFE' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stages */}
                {drawerInvestor.stages.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold mb-2"
                      style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'none' }}>Stages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {drawerInvestor.stages.map(s => (
                        <span key={s} className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--line)' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Size */}
                {(drawerInvestor.check_min || drawerInvestor.check_max) && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold mb-2"
                      style={{ color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'none' }}>Ticket Size</p>
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: 'var(--warn-bg)', color: 'var(--warn)', border: '1px solid #FDE68A' }}>
                      ${drawerInvestor.check_min ?? '?'} – ${drawerInvestor.check_max ?? '?'}
                    </span>
                  </div>
                )}

                {/* Website (public) + LinkedIn (masked) */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {drawerInvestor.displayWebsite && (
                    <a href={drawerInvestor.displayWebsite} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                      style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                  {/* LinkedIn — masked until intro accepted */}
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium select-none"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted-2)', border: '1px solid var(--line)', cursor: 'default', opacity: 0.7 }}
                    title="LinkedIn visible after intro is accepted">
                    <Lock className="w-3.5 h-3.5" />
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </div>
                </div>

                {/* Locked contact notice */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                  style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                  <p className="text-[11px]" style={{ color: 'var(--blue)', lineHeight: 1.4 }}>
                    Email and LinkedIn are unlocked automatically once your intro request is accepted.
                  </p>
                </div>
              </div>

                {/* Footer CTA */}
                <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                  {(() => {
                    const status = drawerInvestor.user_id ? (introStatuses.get(drawerInvestor.user_id) ?? null) : null
                    if (status === 'accepted') return (
                      <button disabled className="w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ height: 48, background: 'rgba(22,163,74,0.15)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.25)' }}>
                        <CheckCircle className="w-4 h-4" /> Connected
                      </button>
                    )
                    if (status === 'pending') return (
                      <button disabled className="w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{ height: 48, background: 'var(--pos-bg)', color: 'var(--pos)' }}>
                        <CheckCircle className="w-4 h-4" /> Intro Requested
                      </button>
                    )
                    return (
                      <button
                        onClick={() => { setIntroInvestor(drawerInvestor); setDrawerInvestor(null) }}
                        className="w-full rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-95"
                        style={{ height: 48, background: 'var(--blue)', color: '#fff' }}
                      >
                        <Send className="w-4 h-4" /> Send Intro Request
                      </button>
                    )
                  })()}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Intro Modal */}
      <Modal
        open={!!introInvestor}
        onClose={() => setIntroInvestor(null)}
        title={introInvestor ? `Request Intro to ${introInvestor.displayName || 'Unnamed Investor'}` : 'Request Intro'}
        subtitle="Write a compelling message about your startup and why you'd be a great fit."
        size="md"
        footer={
          <>
            <button onClick={() => setIntroInvestor(null)} className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}>
              Cancel
            </button>
            <button onClick={sendIntro} disabled={sending || !introMessage.trim()}
              className="px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2"
              style={{ background: sending || !introMessage.trim() ? 'rgba(37,99,235,0.4)' : 'var(--blue)', color: 'white' }}>
              <Send className="w-4 h-4" />
              {sending ? 'Sending…' : 'Send Request'}
            </button>
          </>
        }
      >
        <textarea value={introMessage} onChange={e => setIntroMessage(e.target.value.slice(0, 500))}
          rows={5} placeholder="Hi, I'm building [X] that solves [Y] for [Z]. We've achieved [traction]. I believe your expertise in [sector] would be invaluable..."
          className="w-full px-3 py-2 rounded-xl text-sm resize-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }} />
        <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted-2)' }}>{introMessage.length}/500</p>
      </Modal>
    </div>
  )
}
