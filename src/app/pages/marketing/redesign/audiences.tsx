import type { ReactNode } from 'react'
import { Rocket, Landmark, Building2, Check } from 'lucide-react'
import { MatchRing } from '@/app/components/ui/MatchRing'

export type Audience = 'founders' | 'investors' | 'incubators'

export const TONE = {
  founders: { c: 'var(--rd-blue)', bg: 'var(--rd-blue-bg)', br: 'rgba(37,99,235,0.22)', glow: 'rgba(37,99,235,0.22)' },
  investors: { c: 'var(--rd-gold)', bg: 'var(--rd-gold-bg)', br: 'rgba(183,121,31,0.24)', glow: 'rgba(214,155,52,0.20)' },
  incubators: { c: 'var(--rd-green)', bg: 'var(--rd-green-bg)', br: 'rgba(18,136,90,0.24)', glow: 'rgba(18,136,90,0.18)' },
} as const

/* ── Shared app-window frame ──────────────────────────────────────────── */
export function Frame({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rd-lit relative z-10">
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--rd-border)' }}>
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#F87171' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#FBBF24' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#34D399' }} /></span>
        <span className="ml-2 text-[12.5px] font-bold" style={{ color: 'var(--rd-ink)', fontFamily: 'var(--font-display)' }}>{title}</span>
        {right && <span className="ml-auto">{right}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const Blur = ({ t, w }: { t: string; w: string }) => (
  <span className={`block truncate text-[13px] font-bold ${w}`} style={{ color: 'var(--rd-ink)', filter: 'blur(4.2px)', userSelect: 'none' }}>{t}</span>
)
const rowStyle: React.CSSProperties = { background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)', borderRadius: 12, padding: 10 }

/* ── Investors: pre-qualified deal flow on your thesis ────────────────── */
const DEALS = [
  { fit: 95, name: 'Ledgerly', meta: 'Seed · ₹3 Cr ask · Vertical SaaS' },
  { fit: 92, name: 'Farmstack', meta: 'Seed · ₹2.5 Cr ask · AgriTech' },
  { fit: 89, name: 'Clinikai', meta: 'Pre-seed · ₹1 Cr ask · Healthtech' },
]

export function InvestorPanel() {
  return (
    <Frame title="Deal flow" right={<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--rd-gold)' }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rd-gold)' }} /> on your thesis</span>}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--rd-muted-2)' }}>Your thesis</span>
        {['Seed', 'SaaS', 'India'].map(t => (
          <span key={t} className="rounded-md px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'var(--rd-gold-bg)', color: 'var(--rd-gold)', border: '1px solid rgba(183,121,31,0.2)' }}>{t}</span>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {DEALS.map(d => (
          <div key={d.name} className="flex items-center gap-3" style={rowStyle}>
            <MatchRing score={d.fit} size={36} />
            <div className="min-w-0 flex-1">
              <Blur t={d.name} w="w-24" />
              <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--rd-muted)' }}>{d.meta}</div>
            </div>
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.06em]" style={{ background: 'var(--rd-bg-2)', color: 'var(--rd-muted)' }}>1-pager</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11.5px] font-bold" style={{ background: 'var(--rd-green-bg)', color: 'var(--rd-green)' }}>
        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Both sides opt in before contact
      </div>
    </Frame>
  )
}

/* ── Incubators: run the whole cohort from one portal ─────────────────── */
const COHORT = [
  { name: 'Ledgerly', stage: 'Seed', ready: 90, intros: 4 },
  { name: 'Farmstack', stage: 'Seed', ready: 72, intros: 2 },
  { name: 'Clinikai', stage: 'Pre-seed', ready: 45, intros: 1 },
]

export function IncubatorPanel() {
  return (
    <Frame title="Cohort dashboard" right={<span className="rd-num text-[11px] font-semibold" style={{ color: 'var(--rd-muted-2)' }}>12 startups · 4 raising</span>}>
      <div className="flex flex-col gap-2">
        {COHORT.map(c => (
          <div key={c.name} className="flex items-center gap-3" style={rowStyle}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: 'var(--rd-grad)' }}>{c.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Blur t={c.name} w="w-20" />
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}>{c.stage}</span>
              </div>
              {/* readiness */}
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--rd-border-2)' }}>
                  <div className="h-full rounded-full" style={{ width: `${c.ready}%`, background: c.ready >= 80 ? 'var(--rd-green)' : c.ready >= 60 ? 'var(--rd-blue)' : 'var(--rd-gold)' }} />
                </div>
                <span className="rd-num shrink-0 text-[10px] font-bold" style={{ color: 'var(--rd-muted-2)' }}>{c.ready}% ready</span>
              </div>
            </div>
            <span className="rd-num shrink-0 text-[11px] font-bold" style={{ color: 'var(--rd-ink-2)' }}>{c.intros} intros</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11.5px] font-bold text-white" style={{ background: 'var(--rd-grad)' }}>
        Send curated intros on their behalf
      </div>
    </Frame>
  )
}

/* ── Per-audience hero content. All copy taken from FounderCentral's own
      For-Founders / For-Investors / For-Incubators pages. ──────────────── */
export interface Stat { big?: string; count?: number; suffix?: string; label: string; accent?: boolean }

export interface AudienceConfig {
  key: Audience
  tab: string
  icon: typeof Rocket
  eyebrow: string
  headLead: string
  headAccent: string
  sub: string
  cta: string
  stats: Stat[]
  trust: string[]
}

export const AUDIENCES: Record<Audience, AudienceConfig> = {
  founders: {
    key: 'founders',
    tab: 'Founders',
    icon: Rocket,
    eyebrow: '192 verified investors, matching live',
    headLead: 'Meet the investors who',
    headAccent: 'fit your round.',
    sub: 'Answer three quick questions and real investors from our directory rank themselves against you in seconds. No cold emails, no signup just to look.',
    cta: 'Create free profile',
    stats: [
      { count: 5000, suffix: '+', label: 'in the directory' },
      { count: 192, label: 'human-verified', accent: true },
      { count: 47, label: 'active grants' },
    ],
    trust: ['Free for founders', 'No credit card'],
  },
  investors: {
    key: 'investors',
    tab: 'Investors',
    icon: Landmark,
    eyebrow: 'High-signal, pre-qualified deal flow',
    headLead: 'Deal flow that fits',
    headAccent: 'your thesis.',
    sub: 'Publish your thesis once. Pre-qualified founders arrive ranked by fit, every one in the same structured one-pager. Your inbox stays an inbox, not a graveyard.',
    cta: 'Apply as an investor',
    stats: [
      { big: '0', label: 'cold pitches' },
      { big: '1', label: 'one-pager format', accent: true },
      { big: 'Both', label: 'sides opt in' },
    ],
    trust: ['Run multiple theses', 'Pause or decline anytime'],
  },
  incubators: {
    key: 'incubators',
    tab: 'Incubators',
    icon: Building2,
    eyebrow: 'Run your cohort’s fundraise',
    headLead: 'Your whole cohort,',
    headAccent: 'one portal.',
    sub: 'Every startup on one screen: stage, sector, ask and readiness. Send curated intros on their behalf, and watch every deal through to close.',
    cta: 'Bring your program',
    stats: [
      { big: 'One', label: 'cohort dashboard' },
      { big: 'Every', label: 'intro tracked', accent: true },
      { big: 'Ready', label: 'before the first call' },
    ],
    trust: ['Diligence checklists', 'Full pipeline visibility'],
  },
}
