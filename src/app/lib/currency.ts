// Currency formatting shared across portfolio, dashboards, funding tracker.
// Keep this file tiny — every component imports from here so the symbol
// conventions stay consistent.

export type Currency = 'USD' | 'INR'

export const CURRENCIES: Currency[] = ['USD', 'INR']

export function currencySymbol(currency: Currency): string {
  return currency === 'INR' ? '₹' : '$'
}

// Format a monetary amount with currency-appropriate scale labels.
// INR → Cr / L (crore / lakh). USD → B / M / K.
export function formatAmount(amount: number | null | undefined, currency: Currency = 'USD'): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  if (currency === 'INR') {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`
    if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)} L`
    return `₹${amount.toLocaleString('en-IN')}`
  }
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000)     return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)         return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toLocaleString()}`
}

// Sum a list of { amount, currency } entries, returning a per-currency total.
// Useful for mixed-currency portfolio aggregations where adding across
// currencies would be nonsense.
export function sumByCurrency<T>(
  rows: T[],
  amountOf: (row: T) => number | null | undefined,
  currencyOf: (row: T) => Currency | null | undefined,
): Record<Currency, number> {
  const totals: Record<Currency, number> = { USD: 0, INR: 0 }
  for (const row of rows) {
    const amount = amountOf(row)
    if (amount == null || !Number.isFinite(amount)) continue
    const currency = (currencyOf(row) ?? 'USD') as Currency
    totals[currency] += amount
  }
  return totals
}

// Render per-currency totals as a single string. If only one currency has
// non-zero value, returns just that total. If both do, joins with " + ".
// If all zero, returns "$0".
export function formatTotals(totals: Record<Currency, number>): string {
  const parts: string[] = []
  if (totals.USD > 0) parts.push(formatAmount(totals.USD, 'USD'))
  if (totals.INR > 0) parts.push(formatAmount(totals.INR, 'INR'))
  return parts.length ? parts.join(' + ') : '$0'
}
