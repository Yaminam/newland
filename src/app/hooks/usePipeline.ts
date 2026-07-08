import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'
import { cacheGet, cacheSet, cacheIsStale } from '@/app/lib/queryCache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PipelineStage {
  id: string
  investor_id: string
  name: string
  position: number
  color: string
  is_terminal: boolean
  created_at: string
}

export interface PipelineDeal {
  id: string
  investor_id: string
  startup_id: string
  pipeline_stage: string | null
  stage_id: string | null
  amount_usd: number | null
  probability_pct: number | null
  notes: any
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  next_action: string | null
  next_action_date: string | null
  reminder_date: string | null
  reminder_note: string | null
  created_at: string
  updated_at: string
  // joined startup data
  startup?: {
    id: string
    company_name: string
    sector: string | null
    stage: string | null
    tagline: string | null
    funding_ask_usd: number | null
    arr_usd: number | null
    country: string | null
    founder?: {
      full_name: string | null
      avatar_url: string | null
    }
  }
}

export interface PipelineAlert {
  id: string
  investor_id: string
  deal_id: string
  alert_type: 'stage_change' | 'metric_change' | 'stale_deal' | 'amount_change'
  message: string
  is_read: boolean
  metadata: Record<string, any>
  created_at: string
}

export interface PipelineData {
  stages: PipelineStage[]
  deals: PipelineDeal[]
  grouped: Record<string, PipelineDeal[]>
  isLoading: boolean
  error: string | null
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePipeline() {
  const { user } = useAuth()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [deals, setDeals] = useState<PipelineDeal[]>([])
  const [alerts, setAlerts] = useState<PipelineAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Fetch stages (seed defaults if needed) ──────────────────────── */
  const loadStages = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase.rpc('ensure_default_pipeline_stages')
    if (err) {
      setError(err.message)
      return
    }
    setStages((data as PipelineStage[]) ?? [])
  }, [user])

  /* ── Fetch deals with startup info ───────────────────────────────── */
  const loadDeals = useCallback(async () => {
    if (!user) return
    const key = `pipeline:deals:${user.id}`

    // Serve cached data immediately — page feels instant on revisit.
    const cached = cacheGet<PipelineDeal[]>(key)
    if (cached) {
      setDeals(cached)
      setIsLoading(false)
      if (!cacheIsStale(key)) return  // still fresh, skip network round-trip
    }

    const { data, error: err } = await supabase
      .from('deals')
      .select(`
        *,
        startup:startup_applications (
          id, company_name, sector, stage, tagline,
          funding_ask_usd, arr_usd, country,
          founder:profiles!startup_applications_founder_id_fkey (
            full_name, avatar_url
          )
        )
      `)
      .eq('investor_id', user.id)
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    const deals = (data as PipelineDeal[]) ?? []
    cacheSet(key, deals)
    setDeals(deals)
  }, [user])

  /* ── Fetch alerts ─────────────────────────────────────────────────── */
  const loadAlerts = useCallback(async () => {
    if (!user) return
    const key = `pipeline:alerts:${user.id}`

    const cached = cacheGet<PipelineAlert[]>(key)
    if (cached) {
      setAlerts(cached)
      if (!cacheIsStale(key)) return
    }

    const { data, error: err } = await supabase
      .from('pipeline_alerts')
      .select('id, investor_id, deal_id, alert_type, message, is_read, metadata, created_at')
      .eq('investor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (err) { setError(err.message); return }
    const alerts = (data as PipelineAlert[]) ?? []
    cacheSet(key, alerts)
    setAlerts(alerts)
  }, [user])

  const markAlertRead = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a))
    await supabase.from('pipeline_alerts').update({ is_read: true }).eq('id', alertId)
  }, [])

  const markAllAlertsRead = useCallback(async () => {
    if (!user) return
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
    await supabase
      .from('pipeline_alerts')
      .update({ is_read: true })
      .eq('investor_id', user.id)
      .eq('is_read', false)
  }, [user])

  const dismissAlert = useCallback(async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    await supabase.from('pipeline_alerts').delete().eq('id', alertId)
  }, [])

  /* ── Initial load ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    Promise.all([loadStages(), loadDeals(), loadAlerts()]).finally(() => setIsLoading(false))
  }, [user, loadStages, loadDeals, loadAlerts])

  /* ── Realtime ────────────────────────────────────────────────────── */
  const reload = useCallback(() => {
    loadStages()
    loadDeals()
    loadAlerts()
  }, [loadStages, loadDeals, loadAlerts])

  useTableRealtime(['deals', 'pipeline_stages', 'pipeline_alerts'], reload, {
    events: ['INSERT', 'UPDATE', 'DELETE'],
  })

  /* ── Group deals by stage_id ─────────────────────────────────────── */
  const grouped = useMemo(() => {
    const map: Record<string, PipelineDeal[]> = {}
    for (const s of stages) map[s.id] = []
    for (const d of deals) {
      const key = d.stage_id ?? 'unassigned'
      if (!map[key]) map[key] = []
      map[key].push(d)
    }
    return map
  }, [stages, deals])

  /* ── Mutations ───────────────────────────────────────────────────── */

  const moveDeal = useCallback(async (dealId: string, newStageId: string, newStageName: string) => {
    // Optimistic update
    setDeals(prev =>
      prev.map(d =>
        d.id === dealId ? { ...d, stage_id: newStageId, pipeline_stage: newStageName } : d,
      ),
    )
    const { error: err } = await supabase
      .from('deals')
      .update({ stage_id: newStageId, pipeline_stage: newStageName, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (err) {
      setError(err.message)
      loadDeals() // rollback
    }
  }, [loadDeals])

  /* ── Duplicate detection ─────────────────────────────────────────── */
  const checkDuplicate = useCallback((startupId: string): PipelineDeal | undefined => {
    return deals.find(d => d.startup_id === startupId)
  }, [deals])

  const addDeal = useCallback(async (startupId: string, stageId?: string) => {
    if (!user) return null

    // Warn on duplicate (the upsert still prevents DB-level duplicates)
    const existing = checkDuplicate(startupId)
    if (existing) {
      return { ...existing, _duplicate: true } as PipelineDeal & { _duplicate: boolean }
    }

    const targetStage = stageId ?? stages[0]?.id
    const targetStageName = stages.find(s => s.id === targetStage)?.name ?? 'Watching'
    const { data, error: err } = await supabase
      .from('deals')
      .upsert(
        {
          investor_id: user.id,
          startup_id: startupId,
          stage_id: targetStage,
          pipeline_stage: targetStageName,
        },
        { onConflict: 'investor_id,startup_id' },
      )
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }
    await loadDeals()
    return data
  }, [user, stages, deals, loadDeals, checkDuplicate])

  const updateDeal = useCallback(async (dealId: string, updates: Partial<PipelineDeal>) => {
    const { error: err } = await supabase
      .from('deals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (err) {
      setError(err.message)
      return false
    }
    await loadDeals()
    return true
  }, [loadDeals])

  const removeDeal = useCallback(async (dealId: string) => {
    setDeals(prev => prev.filter(d => d.id !== dealId))
    const { error: err } = await supabase.from('deals').delete().eq('id', dealId)
    if (err) {
      setError(err.message)
      loadDeals()
    }
  }, [loadDeals])

  /* ── Reminders ───────────────────────────────────────────────────── */

  const setReminder = useCallback(async (dealId: string, reminderDate: string, reminderNote?: string) => {
    const { error: err } = await supabase
      .from('deals')
      .update({ reminder_date: reminderDate, reminder_note: reminderNote ?? null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (err) {
      setError(err.message)
      return false
    }
    await loadDeals()
    return true
  }, [loadDeals])

  const clearReminder = useCallback(async (dealId: string) => {
    const { error: err } = await supabase
      .from('deals')
      .update({ reminder_date: null, reminder_note: null, updated_at: new Date().toISOString() })
      .eq('id', dealId)
    if (err) {
      setError(err.message)
      return false
    }
    await loadDeals()
    return true
  }, [loadDeals])

  /* ── Activity ────────────────────────────────────────────────────── */

  const loadActivity = useCallback(async (dealId: string) => {
    const { data, error: err } = await supabase
      .from('watchlist_activity')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      return []
    }
    return data ?? []
  }, [])

  /* ── Stage management ────────────────────────────────────────────── */

  const addStage = useCallback(async (name: string, color = '#3B82F6') => {
    if (!user) return
    const pos = stages.length
    const { error: err } = await supabase
      .from('pipeline_stages')
      .insert({ investor_id: user.id, name, position: pos, color })
    if (err) setError(err.message)
    else await loadStages()
  }, [user, stages.length, loadStages])

  const updateStage = useCallback(async (stageId: string, updates: Partial<PipelineStage>) => {
    const { error: err } = await supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', stageId)
    if (err) setError(err.message)
    else await loadStages()
  }, [loadStages])

  const deleteStage = useCallback(async (stageId: string) => {
    const { error: err } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId)
    if (err) setError(err.message)
    else await loadStages()
  }, [loadStages])

  const reorderStages = useCallback(async (reordered: PipelineStage[]) => {
    setStages(reordered)
    const updates = reordered.map((s, i) =>
      supabase.from('pipeline_stages').update({ position: i }).eq('id', s.id),
    )
    await Promise.all(updates)
    await loadStages()
  }, [loadStages])

  /* ── Export ──────────────────────────────────────────────────────── */

  const exportCSV = useCallback(async () => {
    const rows = deals.map(d => {
      const stage = stages.find(s => s.id === d.stage_id)
      return [
        d.startup?.company_name ?? '',
        stage?.name ?? d.pipeline_stage ?? '',
        (d.tags ?? []).join('; '),
        d.priority ?? '',
        d.amount_usd ?? '',
        d.next_action ?? '',
        d.next_action_date ?? '',
        d.created_at?.split('T')[0] ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`)
    })
    const header = ['Company', 'Stage', 'Tags', 'Priority', 'Amount (USD)', 'Next Action', 'Next Action Date', 'Added']
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pipeline-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [deals, stages])

  const unreadAlertCount = useMemo(() => alerts.filter(a => !a.is_read).length, [alerts])

  return {
    stages,
    deals,
    grouped,
    alerts,
    unreadAlertCount,
    isLoading,
    error,
    reload,
    moveDeal,
    addDeal,
    checkDuplicate,
    updateDeal,
    removeDeal,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
    loadAlerts,
    markAlertRead,
    markAllAlertsRead,
    dismissAlert,
    exportCSV,
    setReminder,
    clearReminder,
    loadActivity,
  }
}
