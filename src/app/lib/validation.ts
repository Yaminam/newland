import { z } from 'zod'
import { sanitizeText, sanitizeOptionalText } from './inputSecurity'

// Accepts full URLs (https://example.com) and bare domains (example.com).
// sanitizeUrl() auto-prepends https:// when saving.
const flexibleUrl = z.string().refine(
  (val) => {
    if (!val) return true
    const withScheme = /^https?:\/\//i.test(val) ? val : `https://${val}`
    try { new URL(withScheme); return true } catch { return false }
  },
  { message: 'Invalid URL' },
)

// ---------------------------------------------------------------------------
// Auth policy constants — kept here so every schema enforces the same rules.
// Mirror this value in: Supabase Dashboard → Auth → Password Policy → Min length
// ---------------------------------------------------------------------------
export const PASSWORD_MIN_LENGTH = 8 as const
export const PASSWORD_REQUIRED_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, a number, and a symbol`

export const passwordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_REQUIRED_MESSAGE)
  .regex(/[a-z]/, PASSWORD_REQUIRED_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_REQUIRED_MESSAGE)
  .regex(/[0-9]/, PASSWORD_REQUIRED_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_REQUIRED_MESSAGE)

export function getPasswordPolicyError(password: string): string | null {
  const result = passwordSchema.safeParse(password)
  if (result.success) return null
  return result.error.issues[0]?.message ?? PASSWORD_REQUIRED_MESSAGE
}

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100)
    .transform(v => sanitizeText(v, { maxLength: 100 })),
  lastName:  z.string().trim().max(100).optional().transform(v => (v ? sanitizeText(v, { maxLength: 100 }) : undefined)),
  email:     z.string().email('Invalid email address'),
  password:  passwordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const investorProfileSchema = z.object({
  title:             z.string().max(200).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 200 }) || undefined),
  bio:               z.string().max(500).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 500, multiline: true }) || undefined),
  linkedin_url:      flexibleUrl.optional().or(z.literal('')),
  website_url:       flexibleUrl.optional().or(z.literal('')),
  location:          z.string().max(200).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 200 }) || undefined),
  investment_thesis: z.string().max(1000).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 1000, multiline: true }) || undefined),
  ticket_size_min:   z.number().positive().optional(),
  ticket_size_max:   z.number().positive().optional(),
})

export const startupApplicationSchema = z.object({
  company_name:       z.string().min(2, 'Company name must be at least 2 characters').max(200)
    .transform(v => sanitizeText(v, { maxLength: 200 })),
  tagline:            z.string().max(120).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 120 }) || undefined),
  website:            flexibleUrl.optional().or(z.literal('')),
  sector:             z.string().min(1, 'Sector is required').max(100)
    .transform(v => sanitizeText(v, { maxLength: 100 })),
  stage:              z.enum(['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series B+', 'Growth']),
  country:            z.string().max(100).default('India')
    .transform(v => sanitizeText(v, { maxLength: 100 })),
  city:               z.string().max(100).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 100 }) || undefined),
  founded_year:       z.number().int().min(2000).max(2026).optional(),
  description:        z.string().min(50, 'Description must be at least 50 characters').max(5000)
    .transform(v => sanitizeText(v, { maxLength: 5000, multiline: true })),
  business_model:     z.string().max(1000).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 1000, multiline: true }) || undefined),
  arr_usd:            z.number().nonnegative().optional(),
  mrr_usd:            z.number().nonnegative().optional(),
  growth_rate_pct:    z.number().optional(),
  users_count:        z.number().int().nonnegative().optional(),
  funding_ask_usd:    z.number().positive('Funding ask must be positive'),
  funding_round:      z.string().max(100).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 100 }) || undefined),
  use_of_funds:       z.string().max(1000).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 1000, multiline: true }) || undefined),
  previous_raised:    z.number().nonnegative().default(0),
  previous_investors: z.string().max(500).optional()
    .transform(v => sanitizeOptionalText(v, { maxLength: 500 }) || undefined),
  team_size:          z.number().int().positive().optional(),
  pitch_video_url:    flexibleUrl.optional().or(z.literal('')),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type InvestorProfileFormData = z.infer<typeof investorProfileSchema>
export type StartupApplicationFormData = z.infer<typeof startupApplicationSchema>
