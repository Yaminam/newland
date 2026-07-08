import type { InvestorType, FounderType } from './types'

export interface InvestorTypeConfig {
  id:          InvestorType
  label:       string
  shortLabel:  string
  description: string
  color:       string
  bgColor:     string
  textColor:   string
  borderColor: string
  gradient:    string
  icon:        string
}

export const INVESTOR_TYPES: InvestorTypeConfig[] = [
  {
    id:          'angel',
    label:       'Angel Investor',
    shortLabel:  'Angel',
    description: 'Individual early-stage investor deploying personal capital',
    color:       'var(--blue)',
    bgColor:     'rgba(37,99,235,0.12)',
    textColor:   '#a5b4fc',
    borderColor: 'rgba(37,99,235,0.3)',
    gradient:    'from-indigo-600 to-indigo-800',
    icon:        'Zap',
  },
  {
    id:          'venture-capital',
    label:       'Venture Capital',
    shortLabel:  'VC',
    description: 'Professional fund investing in high-growth scalable startups',
    color:       '#3486e8',
    bgColor:     'rgba(52,134,232,0.12)',
    textColor:   '#c4b5fd',
    borderColor: 'rgba(52,134,232,0.3)',
    gradient:    'from-violet-600 to-purple-800',
    icon:        'TrendingUp',
  },
  {
    id:          'bank',
    label:       'Bank',
    shortLabel:  'Bank',
    description: 'Institutional debt funding and venture debt provider',
    color:       '#3b82f6',
    bgColor:     'rgba(59,130,246,0.12)',
    textColor:   '#93c5fd',
    borderColor: 'rgba(59,130,246,0.3)',
    gradient:    'from-blue-600 to-indigo-800',
    icon:        'Building2',
  },
  {
    id:          'nbfc',
    label:       'NBFC',
    shortLabel:  'NBFC',
    description: 'Non-Banking Financial Company offering flexible financing',
    color:       '#59cbef',
    bgColor:     'rgba(89,203,239,0.12)',
    textColor:   '#67e8f9',
    borderColor: 'rgba(89,203,239,0.3)',
    gradient:    'from-cyan-600 to-blue-800',
    icon:        'Wallet',
  },
  {
    id:          'family-office',
    label:       'Family Office',
    shortLabel:  'Family Office',
    description: 'Long-term wealth management with patient capital deployment',
    color:       'var(--pos)',
    bgColor:     'rgba(16,185,129,0.12)',
    textColor:   '#6ee7b7',
    borderColor: 'rgba(16,185,129,0.3)',
    gradient:    'from-emerald-600 to-teal-800',
    icon:        'Home',
  },
  {
    id:          'corporate-venture',
    label:       'Corporate VC',
    shortLabel:  'CVC',
    description: 'Strategic corporate investing for innovation and partnerships',
    color:       'var(--warn)',
    bgColor:     'rgba(245,158,11,0.12)',
    textColor:   '#fcd34d',
    borderColor: 'rgba(245,158,11,0.3)',
    gradient:    'from-amber-600 to-orange-800',
    icon:        'Briefcase',
  },
]

export const FOUNDER_TYPES = [
  {
    id:          'active' as FounderType,
    label:       'Active Startup',
    description: 'Registered company actively seeking investment',
    color:       'var(--pos)',
    bgColor:     'rgba(16,185,129,0.12)',
    textColor:   '#6ee7b7',
    borderColor: 'rgba(16,185,129,0.3)',
    gradient:    'from-emerald-600 to-teal-800',
    icon:        'Rocket',
  },
  {
    id:          'idea' as FounderType,
    label:       'Idea Stage',
    description: 'Early concept seeking mentors, co-founders, or pre-seed',
    color:       '#3486e8',
    bgColor:     'rgba(52,134,232,0.12)',
    textColor:   '#c4b5fd',
    borderColor: 'rgba(52,134,232,0.3)',
    gradient:    'from-violet-600 to-fuchsia-800',
    icon:        'Lightbulb',
  },
]

export const getInvestorTypeConfig = (type?: InvestorType) =>
  INVESTOR_TYPES.find(t => t.id === type) ?? INVESTOR_TYPES[0]

export const SECTORS = [
  // Core tech
  'AI/ML', 'SaaS', 'DeepTech', 'Web3/Crypto', 'Cybersecurity', 'IoT',
  // Finance
  'FinTech', 'InsurTech',
  // Health & Bio
  'HealthTech', 'BioTech', 'MedTech',
  // Commerce & Consumer
  'E-Commerce', 'D2C', 'Consumer', 'FoodTech', 'Fashion/Lifestyle',
  // Industry & Infra
  'AgriTech', 'CleanTech', 'Climate', 'EV/Mobility', 'Logistics', 'Manufacturing',
  // Services & Enterprise
  'EdTech', 'HRTech', 'LegalTech', 'MarTech/AdTech', 'TravelTech',
  // Real estate & Space
  'PropTech', 'SpaceTech', 'Defence',
  // Media & Entertainment
  'Gaming', 'Media/Content', 'Creator Economy',
  // B2B / Other
  'B2B Services', 'Marketplace', 'Other',
]

export const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Growth', 'Pre-IPO']

export const GEOGRAPHIES = [
  // South Asia
  'India — North', 'India — South', 'India — West', 'India — East', 'India — Pan-India',
  // Asia-Pacific
  'Southeast Asia', 'Japan', 'South Korea', 'Australia/NZ', 'China',
  // Americas
  'USA', 'Canada', 'Latin America',
  // EMEA
  'Europe', 'UK', 'Middle East', 'Africa',
  // Global
  'Global',
]

export const SUPPORT_NEEDED = [
  'Pre-seed Funding', 'Mentorship — Product', 'Mentorship — Fundraising',
  'Mentorship — Sales & GTM', 'Co-founder Search', 'Technical Co-founder',
  'Legal & Compliance', 'Product Feedback', 'Design/UI/UX Help',
  'Tech/Engineering Support', 'Marketing & Growth', 'Customer Discovery',
  'Industry Expert Intros', 'Community Access',
]
