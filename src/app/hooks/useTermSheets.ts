import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TermSheet {
  id: string
  founder_id: string
  startup_id: string
  investor_id: string | null
  deal_id: string | null
  name: string
  status: 'draft' | 'final' | 'archived' | 'negotiating' | 'signed'
  round_type: 'equity' | 'convertible_note' | 'safe' | 'other'
  terms: Record<string, string>
  ai_generated: boolean
  pdf_path: string | null
  signature_status: 'unsigned' | 'pending' | 'partially_signed' | 'fully_signed'
  signed_pdf_path: string | null
  created_at: string
  updated_at: string
  // joined
  startup?: { id: string; company_name: string }
  investor?: { id: string; full_name: string | null }
}

export interface SignatureRequest {
  id: string
  term_sheet_id: string
  requested_by: string
  signer_id: string
  signer_name: string | null
  signer_email: string | null
  provider: 'aadhaar_esign' | 'manual'
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired'
  provider_ref: string | null
  signed_at: string | null
  declined_at: string | null
  expires_at: string | null
  signature_data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TermSheetTemplate {
  id: string
  creator_id: string | null
  name: string
  description: string | null
  round_type: 'equity' | 'convertible_note' | 'safe' | 'other'
  fund_type: string | null
  round_stage: string | null
  terms: Record<string, string>
  is_system: boolean
  is_shared: boolean
  usage_count: number
  shared_at: string | null
  creator_name: string | null
  created_at: string
  updated_at: string
}

export interface TermSheetComment {
  id: string
  term_sheet_id: string
  user_id: string
  clause_key: string
  body: string
  resolved: boolean
  created_at: string
  // joined
  user?: { id: string; full_name: string | null }
}

export interface TermSheetVersion {
  id: string
  term_sheet_id: string
  version_number: number
  name: string
  terms: Record<string, string>
  status: string
  changed_by: string | null
  change_summary: string | null
  created_at: string
}

export const ROUND_TYPES = [
  { value: 'equity' as const, label: 'Equity' },
  { value: 'convertible_note' as const, label: 'Convertible Note' },
  { value: 'safe' as const, label: 'SAFE' },
  { value: 'other' as const, label: 'Other' },
] as const

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useTermSheets() {
  const { user } = useAuth()
  const [termSheets, setTermSheets] = useState<TermSheet[]>([])
  const [templates, setTemplates] = useState<TermSheetTemplate[]>([])
  const [marketplaceTemplates, setMarketplaceTemplates] = useState<TermSheetTemplate[]>([])
  const [comments, setComments] = useState<TermSheetComment[]>([])
  const [versions, setVersions] = useState<TermSheetVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Load term sheets ───────────────────────────────────────────── */
  const loadTermSheets = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase
      .from('term_sheets')
      .select(`
        *,
        startup:startup_applications ( id, company_name ),
        investor:profiles!investor_id ( id, full_name )
      `)
      .order('updated_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    setTermSheets((data as TermSheet[]) ?? [])
  }, [user])

  /* ── Load templates ─────────────────────────────────────────────── */
  const loadTemplates = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase
      .from('term_sheet_templates')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name', { ascending: true })
    if (err) {
      setError(err.message)
      return
    }
    setTemplates((data as TermSheetTemplate[]) ?? [])
  }, [user])

  /* ── Initial load ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    Promise.all([loadTermSheets(), loadTemplates()]).finally(() => setIsLoading(false))
  }, [user, loadTermSheets, loadTemplates])

  /* ── Realtime ───────────────────────────────────────────────────── */
  const reload = useCallback(() => { loadTermSheets() }, [loadTermSheets])
  useTableRealtime(['term_sheets'], reload, { events: ['INSERT', 'UPDATE', 'DELETE'] })

  /* ── Create term sheet ──────────────────────────────────────────── */
  const createTermSheet = useCallback(async (
    name: string,
    roundType: string,
    terms: Record<string, string>,
    opts?: { investorId?: string; dealId?: string; aiGenerated?: boolean },
  ) => {
    if (!user) return null
    const { data: startup } = await supabase
      .from('startup_applications')
      .select('id')
      .eq('founder_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!startup) {
      setError('No startup application found')
      return null
    }
    const { data, error: err } = await supabase
      .from('term_sheets')
      .insert({
        founder_id: user.id,
        startup_id: startup.id,
        name,
        round_type: roundType,
        terms,
        investor_id: opts?.investorId ?? null,
        deal_id: opts?.dealId ?? null,
        ai_generated: opts?.aiGenerated ?? false,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }
    await loadTermSheets()
    return data
  }, [user, loadTermSheets])

  /* ── Update term sheet (auto-saves version before updating) ─────── */
  const updateTermSheet = useCallback(async (
    id: string,
    updates: Partial<Pick<TermSheet, 'name' | 'status' | 'terms' | 'investor_id'>>,
  ) => {
    if (!user) return false

    // If terms are changing, save current state as a version first
    if (updates.terms) {
      const current = termSheets.find(ts => ts.id === id)
      if (current) {
        // Get next version number
        const { data: existingVersions } = await supabase
          .from('term_sheet_versions')
          .select('version_number')
          .eq('term_sheet_id', id)
          .order('version_number', { ascending: false })
          .limit(1)

        const nextVersion = ((existingVersions?.[0]?.version_number as number) ?? 0) + 1

        await supabase.from('term_sheet_versions').insert({
          term_sheet_id: id,
          version_number: nextVersion,
          name: current.name,
          terms: current.terms,
          status: current.status,
          changed_by: user.id,
          change_summary: `Saved before update (v${nextVersion})`,
        })
      }
    }

    const { error: err } = await supabase
      .from('term_sheets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    await loadTermSheets()
    return true
  }, [user, termSheets, loadTermSheets])

  /* ── Delete term sheet ──────────────────────────────────────────── */
  const deleteTermSheet = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('term_sheets')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    await loadTermSheets()
    return true
  }, [loadTermSheets])

  /* ── Generate AI term sheet ─────────────────────────────────────── */
  const generateAI = useCallback(async (
    startupId: string,
    roundType: string,
    investorId?: string,
    generationMode?: string,
    customParams?: Record<string, string>,
  ): Promise<Record<string, string> | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-term-sheet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          startup_id: startupId,
          investor_id: investorId,
          round_type: roundType,
          generation_mode: generationMode ?? 'balanced',
          ...(customParams && Object.keys(customParams).length > 0 ? { custom_params: customParams } : {}),
        }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI generation failed' }))
      setError(err.error ?? 'AI generation failed')
      return null
    }
    const { terms } = await res.json()
    return terms
  }, [])

  /* ── Generate PDF ───────────────────────────────────────────────── */
  const generatePDF = useCallback(async (termSheetId: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/term-sheet-pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ term_sheet_id: termSheetId }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'PDF generation failed' }))
      setError(err.error ?? 'PDF generation failed')
      return null
    }
    const { pdf_url } = await res.json()
    await loadTermSheets()
    return pdf_url
  }, [loadTermSheets])

  /* ── Template mutations ─────────────────────────────────────────── */
  const createTemplate = useCallback(async (
    name: string,
    roundType: string,
    terms: Record<string, string>,
    description?: string,
  ) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('term_sheet_templates')
      .insert({
        creator_id: user.id,
        name,
        round_type: roundType,
        terms,
        description: description ?? null,
        is_system: false,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }
    await loadTemplates()
    return data
  }, [user, loadTemplates])

  const deleteTemplate = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('term_sheet_templates')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    await loadTemplates()
    return true
  }, [loadTemplates])

  /* ── Marketplace ───────────────────────────────────────────────── */

  const loadMarketplaceTemplates = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('term_sheet_templates')
      .select('*')
      .eq('is_shared', true)
      .order('usage_count', { ascending: false })
      .order('shared_at', { ascending: false })
    if (err) { setError(err.message); return }
    setMarketplaceTemplates((data as TermSheetTemplate[]) ?? [])
  }, [])

  const shareTemplate = useCallback(async (templateId: string) => {
    if (!user) return false
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    const { error: err } = await supabase
      .from('term_sheet_templates')
      .update({
        is_shared: true,
        shared_at: new Date().toISOString(),
        creator_name: profile?.full_name ?? 'Anonymous',
      })
      .eq('id', templateId)
      .eq('creator_id', user.id)
    if (err) { setError(err.message); return false }
    await loadTemplates()
    return true
  }, [user, loadTemplates])

  const unshareTemplate = useCallback(async (templateId: string) => {
    const { error: err } = await supabase
      .from('term_sheet_templates')
      .update({ is_shared: false })
      .eq('id', templateId)
    if (err) { setError(err.message); return false }
    await loadTemplates()
    return true
  }, [loadTemplates])

  const cloneTemplate = useCallback(async (templateId: string) => {
    if (!user) return null
    const source = [...templates, ...marketplaceTemplates].find(t => t.id === templateId)
    if (!source) return null

    // Increment usage count
    await supabase.rpc('increment_template_usage', { template_id: templateId })

    const { data, error: err } = await supabase
      .from('term_sheet_templates')
      .insert({
        creator_id: user.id,
        name: `${source.name} (copy)`,
        description: source.description,
        round_type: source.round_type,
        fund_type: source.fund_type,
        round_stage: source.round_stage,
        terms: source.terms,
        is_system: false,
        is_shared: false,
      })
      .select()
      .single()
    if (err) { setError(err.message); return null }
    await loadTemplates()
    return data
  }, [user, templates, marketplaceTemplates, loadTemplates])

  /* ── Comments ───────────────────────────────────────────────────── */

  const loadComments = useCallback(async (termSheetId: string) => {
    const { data, error: err } = await supabase
      .from('term_sheet_comments')
      .select('*, user:profiles!term_sheet_comments_user_id_profiles_fkey ( id, full_name )')
      .eq('term_sheet_id', termSheetId)
      .order('created_at', { ascending: true })
    if (err) { setError(err.message); return }
    setComments((data as TermSheetComment[]) ?? [])
  }, [])

  const addComment = useCallback(async (termSheetId: string, clauseKey: string, body: string) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('term_sheet_comments')
      .insert({ term_sheet_id: termSheetId, user_id: user.id, clause_key: clauseKey, body })
      .select('*, user:profiles!term_sheet_comments_user_id_profiles_fkey ( id, full_name )')
      .single()
    if (err) { setError(err.message); return null }
    setComments(prev => [...prev, data as TermSheetComment])
    return data as TermSheetComment
  }, [user])

  const resolveComment = useCallback(async (commentId: string) => {
    const { error: err } = await supabase
      .from('term_sheet_comments')
      .update({ resolved: true })
      .eq('id', commentId)
    if (err) { setError(err.message); return false }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c))
    return true
  }, [])

  /* ── Version history ────────────────────────────────────────────── */

  const loadVersions = useCallback(async (termSheetId: string) => {
    const { data, error: err } = await supabase
      .from('term_sheet_versions')
      .select('*')
      .eq('term_sheet_id', termSheetId)
      .order('version_number', { ascending: false })
    if (err) { setError(err.message); return }
    setVersions((data as TermSheetVersion[]) ?? [])
  }, [])

  const restoreVersion = useCallback(async (termSheetId: string, version: TermSheetVersion) => {
    const { error: err } = await supabase
      .from('term_sheets')
      .update({
        terms: version.terms,
        name: version.name,
        status: version.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', termSheetId)
    if (err) { setError(err.message); return false }
    await loadTermSheets()
    await loadVersions(termSheetId)
    return true
  }, [loadTermSheets, loadVersions])

  /* ── Fairness scoring (client-side heuristic) ───────────────────── */

  const scoreFairness = useCallback((terms: Record<string, string>, roundType: string) => {
    const scores: Record<string, { score: number; label: string; tip: string }> = {}

    // Helper to parse numeric values
    const parseNum = (s?: string) => {
      if (!s) return null
      const n = parseFloat(s.replace(/[^0-9.]/g, ''))
      return isNaN(n) ? null : n
    }

    if (roundType === 'equity') {
      // Liquidation preference
      const lp = terms.liquidation_preference?.toLowerCase() ?? ''
      if (lp.includes('1x') && lp.includes('non-participating')) {
        scores.liquidation_preference = { score: 9, label: 'Fair', tip: '1x non-participating is market standard' }
      } else if (lp.includes('1x') && lp.includes('participating')) {
        scores.liquidation_preference = { score: 4, label: 'Aggressive', tip: '1x participating is investor-favored; non-participating is standard' }
      } else if (lp.includes('2x') || lp.includes('3x')) {
        scores.liquidation_preference = { score: 2, label: 'Very Aggressive', tip: 'Multiple liquidation preferences are rare and founder-unfriendly' }
      } else if (lp) {
        scores.liquidation_preference = { score: 6, label: 'Review', tip: 'Check liquidation terms against market norms' }
      }

      // Anti-dilution
      const ad = terms.anti_dilution?.toLowerCase() ?? ''
      if (ad.includes('broad-based') || ad.includes('broad based')) {
        scores.anti_dilution = { score: 8, label: 'Fair', tip: 'Broad-based weighted average is market standard' }
      } else if (ad.includes('narrow-based') || ad.includes('narrow based')) {
        scores.anti_dilution = { score: 4, label: 'Aggressive', tip: 'Narrow-based is more dilutive; broad-based is standard' }
      } else if (ad.includes('full ratchet')) {
        scores.anti_dilution = { score: 1, label: 'Very Aggressive', tip: 'Full ratchet heavily penalizes founders in a down round' }
      }

      // Vesting
      const vest = terms.vesting_schedule?.toLowerCase() ?? ''
      if (vest.includes('4 year') && vest.includes('1-year cliff') || vest.includes('1 year cliff')) {
        scores.vesting_schedule = { score: 9, label: 'Standard', tip: '4-year vesting with 1-year cliff is industry standard' }
      } else if (vest.includes('4 year')) {
        scores.vesting_schedule = { score: 7, label: 'Fair', tip: '4-year vesting is standard; check cliff terms' }
      }

      // Board seats
      const board = terms.board_seats?.toLowerCase() ?? ''
      if (board.includes('2 founder') || board.includes('founder majority')) {
        scores.board_seats = { score: 8, label: 'Balanced', tip: 'Founder majority on board is fair for early stages' }
      } else if (board.includes('1 investor') && board.includes('1 founder')) {
        scores.board_seats = { score: 5, label: 'Review', tip: 'Equal board seats — consider adding an independent director' }
      }

      // No-shop period
      const noShop = parseNum(terms.no_shop_period)
      if (noShop !== null) {
        if (noShop <= 30) scores.no_shop_period = { score: 8, label: 'Fair', tip: '30 days or less is reasonable' }
        else if (noShop <= 60) scores.no_shop_period = { score: 6, label: 'Moderate', tip: '30-60 days is acceptable but on the longer side' }
        else scores.no_shop_period = { score: 3, label: 'Aggressive', tip: 'Over 60 days is unusually long' }
      }
    }

    if (roundType === 'convertible_note' || roundType === 'safe') {
      // Valuation cap
      const capField = roundType === 'safe' ? 'valuation_cap' : 'valuation_cap'
      const cap = parseNum(terms[capField])
      if (cap !== null && cap > 0) {
        scores[capField] = { score: 7, label: 'Has Cap', tip: 'Having a valuation cap protects investors while setting an upper bound' }
      }

      // Discount
      const discountKey = roundType === 'safe' ? 'discount_rate' : 'conversion_discount'
      const discount = parseNum(terms[discountKey])
      if (discount !== null) {
        if (discount >= 15 && discount <= 25) {
          scores[discountKey] = { score: 8, label: 'Standard', tip: '15-25% discount is market standard' }
        } else if (discount < 15) {
          scores[discountKey] = { score: 6, label: 'Low', tip: 'Below 15% discount is founder-friendly' }
        } else {
          scores[discountKey] = { score: 4, label: 'High', tip: 'Over 25% discount is investor-friendly' }
        }
      }
    }

    // Compute overall score
    const values = Object.values(scores)
    const overall = values.length > 0
      ? Math.round(values.reduce((s, v) => s + v.score, 0) / values.length)
      : null

    return { clauses: scores, overall }
  }, [])

  /* ── AI analysis (explain + fairness) ───────────────────────────── */

  const analyzeWithAI = useCallback(async (
    termSheetId: string,
    mode: 'explain' | 'fairness' | 'both' = 'both',
  ): Promise<{
    explanations: Record<string, string>
    fairness: Record<string, { score: number; label: string; tip: string }>
  } | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-term-sheet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ term_sheet_id: termSheetId, mode }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI analysis failed' }))
      setError(err.error ?? 'AI analysis failed')
      return null
    }
    return res.json()
  }, [])

  /* ── Digital signatures ─────────────────────────────────────────── */

  const [signatures, setSignatures] = useState<SignatureRequest[]>([])

  const signFetch = useCallback(async (action: string, payload: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/digital-sign`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      setError(err.error ?? 'Signature request failed')
      return null
    }
    return res.json()
  }, [])

  const requestSignature = useCallback(async (termSheetId: string, signerId: string) => {
    const result = await signFetch('request_signature', { term_sheet_id: termSheetId, signer_id: signerId })
    if (result) await loadTermSheets()
    return result
  }, [signFetch, loadTermSheets])

  const signTermSheet = useCallback(async (signatureRequestId: string) => {
    const result = await signFetch('sign', { signature_request_id: signatureRequestId })
    if (result) await loadTermSheets()
    return result
  }, [signFetch, loadTermSheets])

  const declineSignature = useCallback(async (signatureRequestId: string, reason?: string) => {
    const result = await signFetch('decline', { signature_request_id: signatureRequestId, reason })
    if (result) await loadTermSheets()
    return result
  }, [signFetch, loadTermSheets])

  const loadSignatures = useCallback(async (termSheetId: string) => {
    const result = await signFetch('list', { term_sheet_id: termSheetId })
    if (result?.signatures) setSignatures(result.signatures)
  }, [signFetch])

  /* ── Vault encryption for term sheets ────────────────────────────── */

  const encryptTermSheet = useCallback(async (sheetId: string, termsJson: string): Promise<boolean> => {
    const { error: err } = await supabase.rpc('encrypt_term_sheet', { sheet_id: sheetId, terms_json: termsJson })
    if (err) { setError(err.message); return false }
    return true
  }, [])

  const decryptTermSheet = useCallback(async (sheetId: string): Promise<string | null> => {
    const { data, error: err } = await supabase.rpc('decrypt_term_sheet', { sheet_id: sheetId })
    if (err) { setError(err.message); return null }
    return data as string | null
  }, [])

  /* ── Computed ────────────────────────────────────────────────────── */
  const systemTemplates = useMemo(() => templates.filter(t => t.is_system), [templates])
  const userTemplates = useMemo(() => templates.filter(t => !t.is_system), [templates])

  return {
    termSheets,
    templates,
    systemTemplates,
    userTemplates,
    marketplaceTemplates,
    isLoading,
    error,
    loadTermSheets,
    loadTemplates,
    loadMarketplaceTemplates,
    createTermSheet,
    updateTermSheet,
    deleteTermSheet,
    generateAI,
    generatePDF,
    createTemplate,
    deleteTemplate,
    shareTemplate,
    unshareTemplate,
    cloneTemplate,
    comments,
    loadComments,
    addComment,
    resolveComment,
    versions,
    loadVersions,
    restoreVersion,
    scoreFairness,
    analyzeWithAI,
    encryptTermSheet,
    decryptTermSheet,
    signatures,
    requestSignature,
    signTermSheet,
    declineSignature,
    loadSignatures,
  }
}
