export function cleanText(value: unknown) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const normalized = trimmed.toLowerCase()
  if (normalized === 'null' || normalized === 'undefined') return null

  return trimmed
}

export function cleanTextArray(values: unknown) {
  if (!Array.isArray(values)) return []

  return values
    .map(cleanText)
    .filter((value): value is string => Boolean(value))
}

export type InvestorDisplaySource = {
  full_name?: string | null
  name?: string | null
  investor_name?: string | null
  contact_name?: string | null
  representative_name?: string | null
  firm_name?: string | null
  company_name?: string | null
  firm?: string | null
  institution?: string | null
  company?: string | null
  fund_name?: string | null
  bank_name?: string | null
  nbfc_name?: string | null
  office_name?: string | null
  cvc_name?: string | null
  parent_company?: string | null
  title?: string | null
  role_title?: string | null
  location?: string | null
}

export function resolveInvestorFirmName(investor: InvestorDisplaySource) {
  return (
    cleanText(investor.firm_name) ||
    cleanText(investor.company_name) ||
    cleanText(investor.firm) ||
    cleanText(investor.institution) ||
    cleanText(investor.company) ||
    cleanText(investor.fund_name) ||
    cleanText(investor.bank_name) ||
    cleanText(investor.nbfc_name) ||
    cleanText(investor.office_name) ||
    cleanText(investor.cvc_name) ||
    cleanText(investor.parent_company)
  )
}

export function resolveInvestorDisplayName(investor: InvestorDisplaySource, investorTypeLabel?: string) {
  const personName =
    cleanText(investor.full_name) ||
    cleanText(investor.name) ||
    cleanText(investor.investor_name) ||
    cleanText(investor.contact_name) ||
    cleanText(investor.representative_name)

  if (personName) return personName

  const firmName = resolveInvestorFirmName(investor)
  if (firmName) return `Team at ${firmName}`

  const typeLabel = cleanText(investorTypeLabel)
  if (typeLabel && typeLabel !== 'Investor') return `${typeLabel} Investor`

  const location = cleanText(investor.location)
  if (location) return `Investor in ${location}`

  return 'Unnamed Investor'
}

export function resolveInvestorSubtitle(investor: InvestorDisplaySource) {
  const roleTitle = cleanText(investor.role_title) || cleanText(investor.title)
  const firmName = resolveInvestorFirmName(investor)
  const subtitleParts = [roleTitle, firmName].filter((value): value is string => Boolean(value))

  return subtitleParts.join(' · ') || 'Investor profile available'
}
