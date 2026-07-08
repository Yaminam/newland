// ─── Redesign homepage mock data ───────────────────────────────────────
// All figures here are illustrative for the logged-out matcher experience.
// Names are intentionally masked in the UI (a founder unlocks them by
// creating a free profile), so these stand in for the real directory.

export type Stage = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B'
export type Sector = 'SaaS' | 'Fintech' | 'Consumer' | 'AI / ML' | 'Healthtech' | 'Climate'
export type City = 'Bangalore' | 'Mumbai' | 'Delhi NCR' | 'Pune' | 'Remote'

export const STAGES: Stage[] = ['Pre-seed', 'Seed', 'Series A', 'Series B']
export const SECTORS: Sector[] = ['SaaS', 'Fintech', 'Consumer', 'AI / ML', 'Healthtech', 'Climate']
export const CITIES: City[] = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Pune', 'Remote']

export type InvestorType = 'VC' | 'Angel' | 'Micro-VC' | 'Family office'

export interface Investor {
  name: string
  type: InvestorType
  stages: Stage[]
  sectors: Sector[]
  cities: City[]
  cheque: string
  verified: boolean
}

// A representative slice of the directory. Fit is computed against the
// founder's picks at runtime, so the same firm can rank differently.
export const INVESTORS: Investor[] = [
  { name: 'Everblue Ventures',   type: 'VC',           stages: ['Seed', 'Series A'], sectors: ['SaaS', 'AI / ML'],       cities: ['Bangalore', 'Remote'],   cheque: '₹2 - 8 Cr',   verified: true },
  { name: 'Kavya Capital',       type: 'VC',           stages: ['Seed'],             sectors: ['SaaS', 'Fintech'],       cities: ['Bangalore', 'Mumbai'],   cheque: '₹1 - 5 Cr',   verified: true },
  { name: 'Meridian Angels',     type: 'Angel',        stages: ['Pre-seed', 'Seed'], sectors: ['SaaS', 'Consumer'],      cities: ['Bangalore', 'Delhi NCR'],cheque: '₹25 - 75 L',  verified: true },
  { name: 'Northlight Partners', type: 'Micro-VC',     stages: ['Pre-seed', 'Seed'], sectors: ['AI / ML', 'SaaS'],        cities: ['Remote', 'Bangalore'],   cheque: '₹50 L - 2 Cr',verified: true },
  { name: 'Harbour & Co',        type: 'Family office', stages: ['Series A', 'Series B'], sectors: ['Fintech', 'Consumer'], cities: ['Mumbai'],             cheque: '₹8 - 20 Cr',  verified: false },
  { name: 'Sitara Fund',         type: 'VC',           stages: ['Seed', 'Series A'], sectors: ['Consumer', 'Healthtech'], cities: ['Delhi NCR', 'Mumbai'],  cheque: '₹3 - 10 Cr',  verified: false },
  { name: 'Basecamp Collective', type: 'Micro-VC',     stages: ['Pre-seed', 'Seed'], sectors: ['SaaS', 'Climate'],        cities: ['Pune', 'Remote'],       cheque: '₹40 L - 1.5 Cr', verified: false },
  { name: 'Ravi Menon',          type: 'Angel',        stages: ['Pre-seed'],         sectors: ['Fintech', 'AI / ML'],     cities: ['Bangalore'],            cheque: '₹15 - 50 L',  verified: true },
  { name: 'Peakwater VC',        type: 'VC',           stages: ['Series A'],         sectors: ['AI / ML', 'Healthtech'],  cities: ['Remote', 'Delhi NCR'],  cheque: '₹6 - 15 Cr',  verified: false },
  { name: 'Lodhi Angel Network', type: 'Angel',        stages: ['Seed'],             sectors: ['Consumer', 'SaaS'],       cities: ['Delhi NCR'],            cheque: '₹20 - 80 L',  verified: false },
]

export interface Scored extends Investor {
  fit: number
}

// Deterministic fit score: rewards stage/sector/city overlap, plus a stable
// per-firm jitter derived from the name so no two matches collapse to the
// same rounded %. Produces a believable descending spread (e.g. 96/93/90).
export function scoreInvestors(stage: Stage, sector: Sector, city: City): Scored[] {
  return INVESTORS.map(inv => {
    let score = 44
    if (inv.stages.includes(stage)) score += 20
    if (inv.sectors.includes(sector)) score += 15
    if (inv.cities.includes(city)) score += 9
    else if (inv.cities.includes('Remote')) score += 6
    if (inv.verified) score += 3
    // Stable per-firm jitter 0-9 from the name, so ties break naturally.
    const jitter = inv.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 10
    score += jitter
    return { ...inv, fit: Math.min(97, score) }
  }).sort((a, b) => b.fit - a.fit)
}

// ─── Live-hub teaser data ──────────────────────────────────────────────
export const GRANTS = [
  { title: 'Startup India Seed Fund', amount: '₹50 L', tag: 'Open' },
  { title: 'SISFS Grant', amount: '₹20 L', tag: 'Open' },
  { title: 'BIRAC BIG', amount: '₹50 L', tag: 'Closing soon' },
] as const

export const EVENTS = [
  { title: 'TiE Delhi Pitch Night', when: 'Jul 12', city: 'Delhi NCR' },
  { title: 'Demo Day Mumbai', when: 'Jul 18', city: 'Mumbai' },
  { title: 'Seed Forum Bangalore', when: 'Jul 24', city: 'Bangalore' },
] as const

export const NEWS = [
  { title: 'Everblue closes Fund IV at ₹1,200 Cr', when: '2h' },
  { title: 'Kavya Capital backs a vertical-SaaS seed round', when: '5h' },
  { title: 'Angel tax exemption widened for DPIIT startups', when: '1d' },
] as const

export const COUNTS = {
  directory: '5,000+',
  verified: '192',
  grants: '47',
  events: '30+',
  matches: 23,
}
