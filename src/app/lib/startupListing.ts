import type { FounderProfile } from '@/app/lib/types'

export const STARTUP_SECTORS = [
  'AI/ML', 'SaaS', 'DeepTech', 'Web3/Crypto', 'Cybersecurity', 'IoT',
  'FinTech', 'InsurTech',
  'HealthTech', 'BioTech', 'MedTech',
  'E-Commerce', 'D2C', 'Consumer', 'FoodTech', 'Fashion/Lifestyle',
  'AgriTech', 'CleanTech', 'Climate', 'EV/Mobility', 'Logistics', 'Manufacturing',
  'EdTech', 'HRTech', 'LegalTech', 'MarTech/AdTech', 'TravelTech',
  'PropTech', 'SpaceTech', 'Defence',
  'Gaming', 'Media/Content', 'Creator Economy',
  'B2B Services', 'Marketplace', 'Other',
]

export const ACTIVE_STARTUP_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Growth', 'Pre-IPO']
export const IDEA_STARTUP_STAGES = ['Pre-Idea', 'Ideation', 'Validating', 'MVP Building']
export const MARKETPLACE_STAGES = ['All', ...IDEA_STARTUP_STAGES, ...ACTIVE_STARTUP_STAGES]

const SECTOR_ALIASES: Record<string, string> = {
  'ai/ml': 'AI/ML',
  ai: 'AI/ML',
  fintech: 'FinTech',
  healthtech: 'HealthTech',
  cleantech: 'CleanTech',
  edtech: 'EdTech',
  agritech: 'AgriTech',
  deeptech: 'DeepTech',
  'e-commerce': 'E-Commerce',
  ecommerce: 'E-Commerce',
  'web3/crypto': 'Web3/Crypto',
  blockchain: 'Web3/Crypto',
  biotech: 'BioTech',
  proptech: 'PropTech',
  hrtech: 'HRTech',
  legaltech: 'LegalTech',
  adtech: 'MarTech/AdTech',
  martech: 'MarTech/AdTech',
  traveltech: 'TravelTech',
  foodtech: 'FoodTech',
  ev: 'EV/Mobility',
  mobility: 'EV/Mobility',
  b2b: 'B2B Services',
  saas: 'SaaS',
  d2c: 'D2C',
  insuretech: 'InsurTech',
  insurtech: 'InsurTech',
  medtech: 'MedTech',
  iot: 'IoT',
  spacetech: 'SpaceTech',
  defence: 'Defence',
  defense: 'Defence',
  gaming: 'Gaming',
  media: 'Media/Content',
  climate: 'Climate',
  logistics: 'Logistics',
  manufacturing: 'Manufacturing',
  consumer: 'Consumer',
  marketplace: 'Marketplace',
}

const STAGE_ALIASES: Record<string, string> = {
  'pre-seed': 'Pre-Seed',
  preseed: 'Pre-Seed',
  'series c': 'Series C',
  'series c+': 'Series C',
  'series d': 'Series D+',
  'series d+': 'Series D+',
  'series b+': 'Series C',
  'pre-ipo': 'Pre-IPO',
  preidea: 'Pre-Idea',
  'pre-idea': 'Pre-Idea',
  validating: 'Validating',
  validation: 'Validating',
  ideation: 'Ideation',
  'mvp building': 'MVP Building',
  mvp: 'MVP Building',
}

export function cleanListingText(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const lower = trimmed.toLowerCase()
  if (lower === 'null' || lower === 'undefined') return ''
  return trimmed
}

export function normalizeSector(value: string | null | undefined) {
  const trimmed = cleanListingText(value)
  if (!trimmed) return ''

  const canonical = SECTOR_ALIASES[trimmed.toLowerCase()] ?? trimmed
  return STARTUP_SECTORS.includes(canonical) ? canonical : 'Other'
}

export function normalizeStartupStage(value: string | null | undefined) {
  const trimmed = cleanListingText(value)
  if (!trimmed) return ''

  const canonical = STAGE_ALIASES[trimmed.toLowerCase()] ?? trimmed
  return ACTIVE_STARTUP_STAGES.includes(canonical) ? canonical : ''
}

export function normalizeIdeaStage(value: string | null | undefined) {
  const trimmed = cleanListingText(value)
  if (!trimmed) return ''

  const canonical = STAGE_ALIASES[trimmed.toLowerCase()] ?? trimmed
  return IDEA_STARTUP_STAGES.includes(canonical) ? canonical : ''
}

export function resolveStartupDisplayName(startup: Pick<FounderProfile, 'company_name' | 'idea_title'>) {
  return cleanListingText(startup.company_name) || cleanListingText(startup.idea_title) || 'Unnamed Startup'
}

export function resolveStartupDisplayStage(startup: Pick<FounderProfile, 'stage' | 'idea_stage'>) {
  return normalizeStartupStage(startup.stage) || normalizeIdeaStage(startup.idea_stage)
}

export function resolveStartupSummary(startup: Pick<FounderProfile, 'bio' | 'problem_statement'>) {
  return cleanListingText(startup.bio) || cleanListingText(startup.problem_statement)
}

export function normalizeFounderListing<T extends Partial<FounderProfile>>(startup: T): T {
  return {
    ...startup,
    sector: normalizeSector(startup.sector) || null,
    stage: normalizeStartupStage(startup.stage) || null,
    idea_stage: normalizeIdeaStage(startup.idea_stage) || null,
  }
}
