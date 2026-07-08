import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DDRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface DDRequest {
  id: string
  investor_id: string
  founder_id: string
  deal_id: string | null
  startup_id: string
  template_id: string | null
  checklist_id: string | null
  name: string
  message: string | null
  status: DDRequestStatus
  responded_at: string | null
  created_at: string
  updated_at: string
  // joined
  investor?: { id: string; first_name: string; last_name: string; avatar_url: string | null }
  founder?: { id: string; first_name: string; last_name: string; avatar_url: string | null }
  startup?: { id: string; company_name: string }
  template?: { id: string; name: string }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useDDRequests() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState<DDRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isInvestor = profile?.role === 'investor'
  const isFounder = profile?.role === 'founder'

  /* ── Load requests ─────────────────────────────────────────────── */
  const loadRequests = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase
      .from('dd_requests')
      .select(`
        *,
        investor:profiles!dd_requests_investor_id_fkey ( id, first_name, last_name, avatar_url ),
        founder:profiles!dd_requests_founder_id_fkey ( id, first_name, last_name, avatar_url ),
        startup:startup_applications ( id, company_name ),
        template:dd_templates ( id, name )
      `)
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    setRequests((data as DDRequest[]) ?? [])
  }, [user])

  /* ── Initial load ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    loadRequests().finally(() => setIsLoading(false))
  }, [user, loadRequests])

  /* ── Realtime ──────────────────────────────────────────────────── */
  useTableRealtime(['dd_requests'], () => void loadRequests(), { events: ['INSERT', 'UPDATE'] })

  /* ── Send request (investor only) ──────────────────────────────── */
  const sendRequest = useCallback(async (
    dealId: string | null,
    startupId: string,
    founderId: string,
    name: string,
    templateId?: string,
    message?: string,
  ) => {
    if (!user || !isInvestor) return null
    const { data, error: err } = await supabase
      .from('dd_requests')
      .insert({
        investor_id: user.id,
        founder_id: founderId,
        deal_id: dealId,
        startup_id: startupId,
        template_id: templateId ?? null,
        name,
        message: message ?? null,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }

    // Notify founder (cross-user — requires SECURITY DEFINER RPC)
    await supabase.rpc('send_notification', {
      p_user_id: founderId,
      p_type: 'dd_request',
      p_title: 'Due Diligence Request',
      p_body: `An investor has requested due diligence documents for "${name}"`,
      p_action_url: '/dashboard/dd-checklist',
      p_payload: { request_id: data.id },
    })

    await loadRequests()
    return data
  }, [user, isInvestor, loadRequests])

  /* ── Respond to request (founder only) ─────────────────────────── */
  const respondToRequest = useCallback(async (
    requestId: string,
    action: 'accept' | 'reject',
  ) => {
    if (!user || !isFounder) return false
    const now = new Date().toISOString()

    if (action === 'reject') {
      const { error: err } = await supabase
        .from('dd_requests')
        .update({ status: 'rejected', responded_at: now, updated_at: now })
        .eq('id', requestId)
      if (err) { setError(err.message); return false }
      await loadRequests()
      return true
    }

    // Accept: create checklist, then link it
    const request = requests.find(r => r.id === requestId)
    if (!request) return false

    // Create the checklist
    const { data: checklist, error: clErr } = await supabase
      .from('dd_checklists')
      .insert({
        investor_id: request.investor_id,
        founder_id: user.id,
        deal_id: request.deal_id,
        startup_id: request.startup_id,
        template_id: request.template_id,
        name: request.name,
      })
      .select()
      .single()
    if (clErr) { setError(clErr.message); return false }

    // If template provided, populate items
    if (request.template_id) {
      const { data: template } = await supabase
        .from('dd_templates')
        .select('items')
        .eq('id', request.template_id)
        .maybeSingle()
      if (template?.items && Array.isArray(template.items) && template.items.length > 0) {
        const itemRows = (template.items as { title: string; description?: string; category: string }[]).map((item, idx) => ({
          checklist_id: checklist.id,
          title: item.title,
          description: item.description ?? null,
          category: item.category,
          position: idx,
        }))
        const { error: itemErr } = await supabase.from('dd_checklist_items').insert(itemRows)
        if (itemErr) setError(itemErr.message)
      }
    }

    // Update request with accepted + checklist link
    const { error: upErr } = await supabase
      .from('dd_requests')
      .update({
        status: 'accepted',
        checklist_id: checklist.id,
        responded_at: now,
        updated_at: now,
      })
      .eq('id', requestId)
    if (upErr) { setError(upErr.message); return false }

    // Notify investor (cross-user — requires SECURITY DEFINER RPC)
    await supabase.rpc('send_notification', {
      p_user_id: request.investor_id,
      p_type: 'dd_request_accepted',
      p_title: 'DD Request Accepted',
      p_body: `Your due diligence request "${request.name}" has been accepted`,
      p_action_url: '/dashboard/dd-checklist',
      p_payload: { request_id: requestId, checklist_id: checklist.id },
    })

    await loadRequests()
    return true
  }, [user, isFounder, requests, loadRequests])

  /* ── Cancel request (investor only) ────────────────────────────── */
  const cancelRequest = useCallback(async (requestId: string) => {
    if (!user || !isInvestor) return false
    const { error: err } = await supabase
      .from('dd_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
    if (err) { setError(err.message); return false }
    await loadRequests()
    return true
  }, [user, isInvestor, loadRequests])

  /* ── Computed ──────────────────────────────────────────────────── */
  const pendingRequests = requests.filter(r => r.status === 'pending')

  return {
    requests,
    pendingRequests,
    isLoading,
    error,
    isInvestor,
    isFounder,
    loadRequests,
    sendRequest,
    respondToRequest,
    cancelRequest,
  }
}
