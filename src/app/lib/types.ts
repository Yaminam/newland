// ─── Enums ───────────────────────────────────────────────────────────
export type UserRole       = 'investor' | 'founder' | 'incubation'
export type AccessRole     = 'admin' | 'incubation_admin' | 'user' | 'team'
export type InvestorType   = 'angel' | 'venture-capital' | 'bank' | 'nbfc' | 'family-office' | 'corporate-venture'
export type FounderType    = 'active' | 'idea'
export type IncubationType = 'accelerator' | 'incubator' | 'university' | 'government' | 'corporate'
export type IntroStatus    = 'pending' | 'accepted' | 'rejected' | 'video_uploaded'
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected'
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved'
export type FeedbackType = 'positive' | 'neutral' | 'negative'

// ─── Auth / Profile ───────────────────────────────────────────────────
export interface AuthUser {
  id:                   string
  email:                string
  firstName:            string
  lastName:             string
  company:              string
  role:                 UserRole
  accessRole?:          AccessRole
  investorType?:        InvestorType
  founderType?:         FounderType
  onboardingCompleted:  boolean
  avatarUrl?:           string
}

export interface Profile {
  id:                   string
  email:                string
  first_name:           string
  last_name:            string
  company?:             string
  role:                 UserRole
  access_role?:         AccessRole
  investor_type?:       InvestorType
  founder_type?:        FounderType
  incubation_id?:       string | null
  onboarding_completed: boolean
  profile_approved:     boolean
  avatar_url?:          string
  created_at:           string
  updated_at:           string
}

// ─── Incubation Profile ───────────────────────────────────────────
export interface IncubationProfile {
  id:               string
  owner_id:         string
  name:             string
  incubation_type:  IncubationType
  description?:     string | null
  website_url?:     string | null
  linkedin_url?:    string | null
  location?:        string | null
  city?:            string | null
  country?:         string | null
  logo_url?:        string | null
  sectors:          string[]
  cohort_size?:     number | null
  total_startups:   number
  is_verified:      boolean
  verified_at?:     string | null
  created_at:       string
  updated_at:       string
}

// ─── Investor Preferences ─────────────────────────────────────────────
export interface InvestorPreferences {
  id:                     string
  profile_id:             string
  title?:                 string
  portfolio_companies?:   number
  fund_name?:             string
  fund_size?:             string
  bank_name?:             string
  nbfc_name?:             string
  office_family?:         string
  parent_company?:        string
  cvc_name?:              string
  sectors:                string[]
  investment_stages:      string[]
  geographies:            string[]
  check_min?:             string
  check_max?:             string
  investment_thesis?:     string
  lending_products:       string[]
  funding_types:          string[]
  risk_category?:         string
  co_investment_interest?: string
  innovation_focus:       string[]
  partnership_interest:   string[]
  created_at:             string
  updated_at:             string
}

// ─── Founder Profile ──────────────────────────────────────────────────
export interface FounderProfile {
  id:                   string
  profile_id:           string
  founder_type:         FounderType
  company_name?:        string | null
  sector?:              string | null
  stage?:               string | null
  arr?:                 string | null
  mom_growth?:          string | null
  raise_amount?:        string | null
  idea_title?:          string | null
  problem_statement?:   string | null
  idea_stage?:          string | null
  target_market?:       string | null
  support_needed:       string[]
  website?:             string | null
  linkedin_url?:        string | null
  team_size?:           number | null
  founded_year?:        number | null
  funding_purpose?:     string | null
  bio?:                 string | null
  pitch_deck_url?:      string | null
  verified:             boolean
  verification_status:  VerificationStatus
  trust_badges:         string[]
  views_count:          number
  created_at:           string
  updated_at:           string
  profile?:             Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'> | null
}

// ─── Scraped Investor ─────────────────────────────────────────────────
export interface ScrapedInvestor {
  id:                   string
  name:                 string
  institution?:         string
  title?:               string
  location?:            string
  sectors:              string[]
  stages:               string[]
  check_min?:           string
  check_max?:           string
  funding_type?:        string
  typical_equity?:      string
  investment_thesis?:   string
  portfolio_count?:     number
  recent_investments:   string[]
  verified:             boolean
  response_rate?:       string
  actively_investing:   boolean
  email?:               string
  website?:             string
  linkedin_url?:        string
  source_url:           string
  source_type:          string
  is_new:               boolean
  date_added:           string
  created_at:           string
}

// ─── Funding Event ────────────────────────────────────────────────────
// Maps to `funding_rounds` table (confirmed — FundingTrackerPage reads this table)
export interface FundingEvent {
  id:             string
  company_name:   string
  lead_investor?: string
  amount_usd?:    number
  round_type?:    string
  sector?:        string
  location?:      string
  stage?:         string
  country?:       string
  description?:   string
  announced_at?:  string
  source_url:     string
  source_name:    string
  created_at:     string
}

// ─── News Article ─────────────────────────────────────────────────────
// Maps to `news_articles` table
export interface NewsArticle {
  id:           string
  title:        string
  summary?:     string
  url:          string
  source_name:  string
  source_url:   string
  image_url?:   string
  category:     string
  sector_tags:  string[]
  is_hot:       boolean
  is_featured:  boolean
  published_at?: string
  fetched_at:   string
  indexed_at?:  string
}

// ─── Match ────────────────────────────────────────────────────────────
export interface Match {
  id:             string
  investor_id:    string
  founder_id:     string
  score:          number
  match_reasons:  string[]
  computed_at:    string
  is_active:      boolean
  founder?:       FounderProfile & { profile?: Profile }
  investor?:      Profile
}

// ─── Intro Request ────────────────────────────────────────────────────
export interface IntroRequest {
  id:             string
  investor_id:    string
  founder_id:     string
  status:         IntroStatus
  message?:       string
  video_url?:     string
  video_duration?: number
  requested_at:   string
  responded_at?:  string
  investor?:      Profile & { investor_preferences?: InvestorPreferences }
  founder?:       FounderProfile & { profile?: Profile }
}

// ─── Founder Bookmark ────────────────────────────────────────────────
export interface FounderBookmark {
  id:                 string
  investor_id:        string
  founder_profile_id: string
  created_at:         string
  founder_profile?:   FounderProfile
}

export type Bookmark = FounderBookmark

// ─── Notification ─────────────────────────────────────────────────────
export interface Notification {
  id:                 string
  user_id:            string
  type:               string
  title:              string
  message:            string
  related_user_id?:   string
  related_entity_id?: string
  read:               boolean
  created_at:         string
}

// ─── Portfolio Entry ──────────────────────────────────────────────────
export interface PortfolioEntry {
  id:                     string
  investor_id:            string
  company_name:           string
  sector?:                string
  stage_at_investment?:   string
  investment_amount?:     string
  investment_date?:       string
  current_status:         string
  notes?:                 string
  founder_id?:            string
  created_at:             string
  updated_at:             string
}

// ─── Chat ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id:         string
  role:       'user' | 'assistant'
  content:    string
  timestamp:  Date
}

// ─── Analytics ───────────────────────────────────────────────────────
export interface AnalyticsSnapshot {
  id:                       string
  profile_id:               string
  snapshot_date:            string
  profile_views:            number
  bookmarks_received:       number
  intro_requests_received:  number
  pitch_downloads:          number
  matches_count:            number
  created_at:               string
}

export interface SupportTicket {
  id:           string
  user_id:      string | null
  name:         string
  email:        string
  subject:      string
  message:      string
  status:       SupportTicketStatus
  created_at:   string
}

export interface FeedbackEntry {
  id:             string
  user_id:        string | null
  feedback_type:  FeedbackType
  message:        string | null
  page_url:       string
  created_at:     string
}
