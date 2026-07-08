import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD'): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

/**
 * Compact any number-like value (number OR string) into a short label.
 * Handles raw numbers, "$1,000,000", "1000000", "$500K", "10%", etc.
 * Already-compact values like "$5M" or "20%" pass through unchanged.
 */
export function compactNumber(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  const raw = String(value).trim()
  if (!raw) return '—'

  // Detect if it's a percentage — pass through as-is
  if (/%/.test(raw)) return raw

  // Already compact (ends with K/M/B/Cr/L and is short) — pass through
  if (/^\$?\s*[\d.]+\s*[KMBT]$/i.test(raw) || /Cr|Lakh/i.test(raw)) return raw

  // Strip currency symbols, commas, whitespace to extract the number
  const stripped = raw.replace(/[$₹€£,\s]/g, '')
  const num = parseFloat(stripped)

  if (!Number.isFinite(num)) return raw // not a number, return original

  // Detect if original had a currency prefix
  const hasDollar = raw.includes('$')
  const hasRupee = raw.includes('₹')
  const prefix = hasRupee ? '₹' : hasDollar ? '$' : ''

  if (hasRupee) {
    if (num >= 10_000_000) return `${prefix}${+(num / 10_000_000).toFixed(1)}Cr`
    if (num >= 100_000)    return `${prefix}${+(num / 100_000).toFixed(1)}L`
    if (num >= 1_000)      return `${prefix}${+(num / 1_000).toFixed(1)}K`
    return `${prefix}${num}`
  }

  if (num >= 1_000_000_000) return `${prefix}${+(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000)     return `${prefix}${+(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)         return `${prefix}${+(num / 1_000).toFixed(1)}K`
  return `${prefix}${num}`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60)   return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)     return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7)       return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--success)'
  if (score >= 80) return 'var(--blue)'
  if (score >= 70) return 'var(--warning)'
  return '#9ca3af'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent Match'
  if (score >= 80) return 'Strong Match'
  if (score >= 70) return 'Good Match'
  return 'Fair Match'
}

export function getScoreClass(score: number): string {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-strong'
  if (score >= 70) return 'score-good'
  return 'score-fair'
}

// Generate mock chart data
export function generateMonthlyData(months = 7, baseValue = 100, variance = 30) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now)
    d.setMonth(d.getMonth() - (months - 1 - i))
    return {
      month: d.toLocaleString('default', { month: 'short' }),
      value: Math.max(0, baseValue + Math.floor((Math.random() - 0.3) * variance)),
    }
  })
}
