import { useState } from 'react'
import { MessageCircle, Check, Lightbulb, Loader2 } from 'lucide-react'
import type { TermSheetComment } from '@/app/hooks/useTermSheets'

/* ── Term field config per round type ────────────────────────────── */

interface TermField {
  key: string
  label: string
  placeholder: string
}

interface TermSection {
  title: string
  fields: TermField[]
}

const EQUITY_FIELDS: TermSection[] = [
  {
    title: 'Deal Terms',
    fields: [
      { key: 'investment_amount', label: 'Investment Amount', placeholder: '$2,000,000' },
      { key: 'pre_money_valuation', label: 'Pre-Money Valuation', placeholder: '$8,000,000' },
      { key: 'post_money_valuation', label: 'Post-Money Valuation', placeholder: '$10,000,000' },
      { key: 'equity_percentage', label: 'Equity Percentage', placeholder: '20%' },
      { key: 'share_class', label: 'Share Class', placeholder: 'Series A Preferred' },
      { key: 'price_per_share', label: 'Price Per Share', placeholder: '$1.50' },
    ],
  },
  {
    title: 'Governance & Rights',
    fields: [
      { key: 'board_seats', label: 'Board Seats', placeholder: '1 investor, 2 founders, 1 independent' },
      { key: 'liquidation_preference', label: 'Liquidation Preference', placeholder: '1x non-participating' },
      { key: 'anti_dilution', label: 'Anti-Dilution', placeholder: 'Broad-based weighted average' },
      { key: 'pro_rata_rights', label: 'Pro-Rata Rights', placeholder: 'Yes, for all major investors' },
      { key: 'vesting_schedule', label: 'Vesting Schedule', placeholder: '4 years, 1-year cliff' },
      { key: 'drag_along', label: 'Drag-Along', placeholder: 'Majority approval required' },
    ],
  },
  {
    title: 'Protective Provisions',
    fields: [
      { key: 'information_rights', label: 'Information Rights', placeholder: 'Quarterly financials, annual audited' },
      { key: 'right_of_first_refusal', label: 'Right of First Refusal', placeholder: 'Yes' },
      { key: 'no_shop_period', label: 'No-Shop Period', placeholder: '45 days' },
      { key: 'closing_conditions', label: 'Closing Conditions', placeholder: 'Due diligence, legal review' },
      { key: 'governing_law', label: 'Governing Law', placeholder: 'Delaware' },
    ],
  },
]

const NOTE_FIELDS: TermSection[] = [
  {
    title: 'Note Terms',
    fields: [
      { key: 'principal_amount', label: 'Principal Amount', placeholder: '$500,000' },
      { key: 'interest_rate', label: 'Interest Rate', placeholder: '5% per annum' },
      { key: 'maturity_date', label: 'Maturity Date', placeholder: '24 months from closing' },
      { key: 'conversion_discount', label: 'Conversion Discount', placeholder: '20%' },
      { key: 'valuation_cap', label: 'Valuation Cap', placeholder: '$5,000,000' },
      { key: 'qualified_financing_threshold', label: 'Qualified Financing', placeholder: '$1,000,000' },
    ],
  },
  {
    title: 'Conversion & Rights',
    fields: [
      { key: 'conversion_mechanics', label: 'Conversion Mechanics', placeholder: 'Lower of cap or discount' },
      { key: 'most_favored_nation', label: 'Most Favored Nation', placeholder: 'No' },
      { key: 'pro_rata_rights', label: 'Pro-Rata Rights', placeholder: 'Yes, upon conversion' },
      { key: 'information_rights', label: 'Information Rights', placeholder: 'Quarterly financials' },
      { key: 'governing_law', label: 'Governing Law', placeholder: 'Delaware' },
    ],
  },
]

const SAFE_FIELDS: TermSection[] = [
  {
    title: 'SAFE Terms',
    fields: [
      { key: 'investment_amount', label: 'Investment Amount', placeholder: '$250,000' },
      { key: 'valuation_cap', label: 'Valuation Cap', placeholder: '$5,000,000' },
      { key: 'discount_rate', label: 'Discount Rate', placeholder: 'No discount' },
      { key: 'safe_type', label: 'SAFE Type', placeholder: 'Post-money' },
    ],
  },
  {
    title: 'Rights & Provisions',
    fields: [
      { key: 'most_favored_nation', label: 'Most Favored Nation', placeholder: 'No' },
      { key: 'pro_rata_rights', label: 'Pro-Rata Rights', placeholder: 'Yes, via side letter' },
      { key: 'conversion_trigger', label: 'Conversion Trigger', placeholder: 'Equity financing, dissolution, or liquidity event' },
      { key: 'information_rights', label: 'Information Rights', placeholder: 'Annual financials' },
      { key: 'governing_law', label: 'Governing Law', placeholder: 'Delaware' },
    ],
  },
]

function getFields(roundType: string): TermSection[] {
  if (roundType === 'convertible_note') return NOTE_FIELDS
  if (roundType === 'safe') return SAFE_FIELDS
  return EQUITY_FIELDS
}

/* ── Component ───────────────────────────────────────────────────── */

interface Props {
  roundType: string
  terms: Record<string, string>
  onChange: (terms: Record<string, string>) => void
  readOnly?: boolean
  comments?: TermSheetComment[]
  onAddComment?: (clauseKey: string, body: string) => Promise<any>
  onResolveComment?: (commentId: string) => Promise<boolean>
  fairnessScores?: Record<string, { score: number; label: string; tip: string }>
  onAnalyze?: (clauseKey: string) => Promise<string | null>
}

export function TermSheetEditor({ roundType, terms, onChange, readOnly, comments, onAddComment, onResolveComment, fairnessScores, onAnalyze }: Props) {
  const sections = getFields(roundType)
  const [expandedComment, setExpandedComment] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null)

  const handleChange = (key: string, value: string) => {
    onChange({ ...terms, [key]: value })
  }

  const handleExplain = async (key: string) => {
    if (expandedExplanation === key) {
      setExpandedExplanation(null)
      return
    }
    // Use cached explanation if available
    if (explanations[key]) {
      setExpandedExplanation(key)
      return
    }
    if (!onAnalyze) return
    setLoadingExplanation(key)
    setExpandedExplanation(key)
    const text = await onAnalyze(key)
    if (text) {
      setExplanations(prev => ({ ...prev, [key]: text }))
    }
    setLoadingExplanation(null)
  }

  const getClauseComments = (key: string) => (comments ?? []).filter(c => c.clause_key === key && !c.resolved)

  const handleSubmitComment = async (key: string) => {
    if (!onAddComment || !commentBody.trim()) return
    await onAddComment(key, commentBody.trim())
    setCommentBody('')
    setExpandedComment(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {sections.map(section => (
        <div key={section.title}>
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--muted-2)' }}
          >
            {section.title}
          </p>
          <div className="flex flex-col gap-2.5">
            {section.fields.map(field => {
              const clauseComments = getClauseComments(field.key)
              const score = fairnessScores?.[field.key]
              const isCommenting = expandedComment === field.key

              return (
                <div key={field.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[12px] font-semibold"
                      style={{ color: 'var(--muted)' }}
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {score && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          title={score.tip}
                          style={{
                            background: score.score >= 7 ? 'var(--pos-bg)' : score.score >= 4 ? 'var(--warn-bg)' : 'var(--neg-bg)',
                            color: score.score >= 7 ? 'var(--pos)' : score.score >= 4 ? 'var(--warn)' : 'var(--neg)',
                          }}
                        >
                          {score.label}
                        </span>
                      )}
                      {onAnalyze && (
                        <button
                          onClick={() => handleExplain(field.key)}
                          className="cursor-pointer transition-colors"
                          title="Explain this clause with AI"
                          style={{ color: expandedExplanation === field.key ? 'var(--blue)' : 'var(--muted-2)' }}
                        >
                          {loadingExplanation === field.key
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Lightbulb className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                      {onAddComment && (
                        <button
                          onClick={() => setExpandedComment(isCommenting ? null : field.key)}
                          className="relative cursor-pointer"
                          style={{ color: clauseComments.length > 0 ? 'var(--blue)' : 'var(--muted-2)' }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {clauseComments.length > 0 && (
                            <span
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                              style={{ background: 'var(--blue)', color: '#fff' }}
                            >
                              {clauseComments.length}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={terms[field.key] ?? ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={readOnly}
                    className="w-full h-9 px-3 text-[13px] rounded-[var(--r-md)] border border-[var(--line)] focus:border-[var(--blue)] focus:outline-none transition-colors disabled:opacity-60"
                    style={{ background: 'var(--bg)', color: 'var(--ink)' }}
                  />

                  {/* AI explanation popover */}
                  {expandedExplanation === field.key && (
                    <div
                      className="mt-1 px-3 py-2.5 rounded-[var(--r-md)] flex gap-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                    >
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--blue)' }} />
                      <p className="text-[12px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                        {loadingExplanation === field.key
                          ? <span style={{ color: 'var(--muted-2)' }}>Generating explanation…</span>
                          : (explanations[field.key] ?? <span style={{ color: 'var(--muted-2)' }}>No explanation available.</span>)
                        }
                      </p>
                    </div>
                  )}

                  {/* Inline comment thread */}
                  {isCommenting && (
                    <div
                      className="mt-1 p-2.5 rounded-[var(--r-md)] space-y-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                    >
                      {clauseComments.map(c => (
                        <div key={c.id} className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>
                                {c.user?.full_name ?? 'Unknown'}
                              </span>
                              <span className="text-[9px]" style={{ color: 'var(--muted-2)' }}>
                                {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink)' }}>{c.body}</p>
                          </div>
                          {onResolveComment && (
                            <button
                              onClick={() => onResolveComment(c.id)}
                              className="shrink-0 cursor-pointer"
                              title="Resolve"
                              style={{ color: 'var(--pos)' }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={commentBody}
                          onChange={e => setCommentBody(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSubmitComment(field.key)}
                          placeholder="Add a comment..."
                          className="flex-1 px-2.5 py-1.5 text-[12px] rounded-[var(--r-sm)] outline-0"
                          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                        />
                        <button
                          onClick={() => handleSubmitComment(field.key)}
                          disabled={!commentBody.trim()}
                          className="px-2 py-1 text-[11px] font-medium rounded-[var(--r-sm)] cursor-pointer"
                          style={{ background: 'var(--blue)', color: '#fff', opacity: commentBody.trim() ? 1 : 0.5 }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
