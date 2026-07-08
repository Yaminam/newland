import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'
import { cacheGet, cacheSet, cacheIsStale } from '@/app/lib/queryCache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DDChecklist {
  id: string
  investor_id: string
  founder_id: string | null
  deal_id: string
  startup_id: string
  template_id: string | null
  name: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  // joined
  startup?: { id: string; company_name: string }
  deal?: { id: string; pipeline_stage: string | null }
  // computed from items
  items?: DDChecklistItem[]
  total_items?: number
  completed_items?: number
}

export type DDItemStatus = 'not_started' | 'in_progress' | 'uploaded' | 'verified' | 'flagged'

export interface DDChecklistItem {
  id: string
  checklist_id: string
  title: string
  description: string | null
  category: DDCategory
  status: DDItemStatus
  is_completed: boolean
  completed_at: string | null
  due_date: string | null
  notes: string | null
  document_id: string | null
  position: number
  created_at: string
}

export type DDCategory = 'financial' | 'legal' | 'market' | 'team' | 'product' | 'technical' | 'other'

export const DD_ITEM_STATUSES: { value: DDItemStatus; label: string; color: string }[] = [
  { value: 'not_started',  label: 'Not Started',  color: 'var(--muted)' },
  { value: 'in_progress',  label: 'In Progress',  color: 'var(--blue)' },
  { value: 'uploaded',     label: 'Uploaded',      color: 'var(--warn)' },
  { value: 'verified',     label: 'Verified',      color: 'var(--pos)' },
  { value: 'flagged',      label: 'Flagged',       color: 'var(--neg)' },
]

export interface DDTemplate {
  id: string
  investor_id: string | null
  name: string
  description: string | null
  items: DDTemplateItem[]
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface DDTemplateItem {
  title: string
  description?: string
  category: DDCategory
}

export const DD_CATEGORIES: { value: DDCategory; label: string; color: string }[] = [
  { value: 'financial',  label: 'Financial',  color: 'var(--blue)' },
  { value: 'legal',      label: 'Legal',      color: 'var(--warn)' },
  { value: 'market',     label: 'Market',     color: 'var(--pos)' },
  { value: 'team',       label: 'Team',       color: '#8B5CF6' },
  { value: 'product',    label: 'Product',    color: '#F59E0B' },
  { value: 'technical',  label: 'Technical',  color: '#06B6D4' },
  { value: 'other',      label: 'Other',      color: 'var(--muted)' },
]

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useDDChecklists() {
  const { user, profile } = useAuth()
  const [checklists, setChecklists] = useState<DDChecklist[]>([])
  const [templates, setTemplates] = useState<DDTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isInvestor = profile?.role === 'investor'
  const isFounder = profile?.role === 'founder'

  /* ── Load checklists ────────────────────────────────────────────── */
  const loadChecklists = useCallback(async () => {
    if (!user) return
    const key = `dd:checklists:${user.id}`

    const cached = cacheGet<DDChecklist[]>(key)
    if (cached) {
      setChecklists(cached)
      setIsLoading(false)
      if (!cacheIsStale(key)) return
    }

    const { data, error: err } = await supabase
      .from('dd_checklists')
      .select(`
        *,
        startup:startup_applications ( id, company_name ),
        deal:deals ( id, pipeline_stage )
      `)
      .order('updated_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    // For each checklist, load item counts in a single batch query
    const ids = (data ?? []).map((c: any) => c.id)
    if (ids.length > 0) {
      const { data: items } = await supabase
        .from('dd_checklist_items')
        .select('checklist_id, is_completed')
        .in('checklist_id', ids)

      const countMap: Record<string, { total: number; completed: number }> = {}
      for (const item of items ?? []) {
        if (!countMap[item.checklist_id]) countMap[item.checklist_id] = { total: 0, completed: 0 }
        countMap[item.checklist_id].total++
        if (item.is_completed) countMap[item.checklist_id].completed++
      }

      const result = (data as any[]).map(c => ({
        ...c,
        total_items: countMap[c.id]?.total ?? 0,
        completed_items: countMap[c.id]?.completed ?? 0,
      }))
      cacheSet(key, result)
      setChecklists(result)
    } else {
      cacheSet(key, [])
      setChecklists([])
    }
  }, [user])

  /* ── Load checklist detail with items ────────────────────────────── */
  const loadChecklistDetail = useCallback(async (checklistId: string) => {
    const { data, error: err } = await supabase
      .from('dd_checklists')
      .select(`
        *,
        startup:startup_applications ( id, company_name ),
        deal:deals ( id, pipeline_stage )
      `)
      .eq('id', checklistId)
      .maybeSingle()
    if (err) {
      setError(err.message)
      return null
    }
    const { data: items } = await supabase
      .from('dd_checklist_items')
      .select('id, checklist_id, title, description, category, status, is_completed, completed_at, due_date, notes, document_id, position, created_at')
      .eq('checklist_id', checklistId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    return {
      ...data,
      items: items ?? [],
      total_items: items?.length ?? 0,
      completed_items: items?.filter((i: any) => i.is_completed).length ?? 0,
    } as DDChecklist
  }, [])

  /* ── Load templates ─────────────────────────────────────────────── */
  const loadTemplates = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase
      .from('dd_templates')
      .select('id, investor_id, name, description, items, is_system, created_at, updated_at')
      .order('is_system', { ascending: false })
      .order('name', { ascending: true })
    if (err) {
      setError(err.message)
      return
    }
    setTemplates((data as DDTemplate[]) ?? [])
  }, [user])

  /* ── Initial load ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    Promise.all([loadChecklists(), loadTemplates()]).finally(() => setIsLoading(false))
  }, [user, loadChecklists, loadTemplates])

  /* ── Realtime ───────────────────────────────────────────────────── */
  const reload = useCallback(() => { loadChecklists() }, [loadChecklists])
  useTableRealtime(['dd_checklists', 'dd_checklist_items'], reload, { events: ['INSERT', 'UPDATE', 'DELETE'] })

  /* ── Create checklist (founder only) ─────────────────────────── */
  const createChecklist = useCallback(async (
    dealId: string,
    startupId: string,
    name: string,
    investorId: string,
    templateId?: string,
  ) => {
    if (!user || !isFounder) return null
    const { data, error: err } = await supabase
      .from('dd_checklists')
      .insert({
        founder_id: user.id,
        investor_id: investorId,
        deal_id: dealId,
        startup_id: startupId,
        name,
        template_id: templateId ?? null,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }

    // If template provided, create items from it
    if (templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template && template.items.length > 0) {
        const itemRows = template.items.map((item, idx) => ({
          checklist_id: data.id,
          title: item.title,
          description: item.description ?? null,
          category: item.category,
          status: 'in_progress' as DDItemStatus,
          position: idx,
        }))
        const { error: itemErr } = await supabase.from('dd_checklist_items').insert(itemRows)
        if (itemErr) setError(itemErr.message)
      }
    }

    await loadChecklists()
    return data
  }, [user, isFounder, templates, loadChecklists])

  /* ── Update checklist ──────────────────────────────────────────── */
  const updateChecklist = useCallback(async (
    id: string,
    updates: Partial<Pick<DDChecklist, 'name' | 'status'>>,
  ) => {
    const { error: err } = await supabase
      .from('dd_checklists')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    await loadChecklists()
    return true
  }, [loadChecklists])

  /* ── Delete checklist (founder only) ────────────────────────────── */
  const deleteChecklist = useCallback(async (id: string) => {
    if (!isFounder) { setError('Only founders can delete checklists'); return false }
    // Delete items first
    const { error: itemErr } = await supabase
      .from('dd_checklist_items')
      .delete()
      .eq('checklist_id', id)
    if (itemErr) { setError(itemErr.message); return false }
    // Delete checklist
    const { error: err } = await supabase
      .from('dd_checklists')
      .delete()
      .eq('id', id)
    if (err) { setError(err.message); return false }
    await loadChecklists()
    return true
  }, [isFounder, loadChecklists])

  /* ── Archive checklist ─────────────────────────────────────────── */
  const archiveChecklist = useCallback(async (id: string) => {
    return updateChecklist(id, { status: 'archived' })
  }, [updateChecklist])

  /* ── Complete checklist ────────────────────────────────────────── */
  const completeChecklist = useCallback(async (id: string) => {
    return updateChecklist(id, { status: 'completed' })
  }, [updateChecklist])

  /* ── Add item (founder only) ────────────────────────────────── */
  const addItem = useCallback(async (
    checklistId: string,
    title: string,
    category: DDCategory = 'other',
    description?: string,
    dueDate?: string,
  ) => {
    if (!isFounder) { setError('Only founders can add items'); return null }
    // Get current max position
    const { data: existing } = await supabase
      .from('dd_checklist_items')
      .select('position')
      .eq('checklist_id', checklistId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPos = (existing?.[0]?.position ?? -1) + 1

    const { data, error: err } = await supabase
      .from('dd_checklist_items')
      .insert({
        checklist_id: checklistId,
        title,
        category,
        description: description ?? null,
        due_date: dueDate ?? null,
        position: nextPos,
        status: 'in_progress' as DDItemStatus,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }
    await loadChecklists()
    return data as DDChecklistItem
  }, [loadChecklists])

  /* ── Update item ───────────────────────────────────────────────── */
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<Pick<DDChecklistItem, 'title' | 'description' | 'category' | 'due_date' | 'notes' | 'document_id' | 'status'>>,
  ) => {
    const { error: err } = await supabase
      .from('dd_checklist_items')
      .update(updates)
      .eq('id', itemId)
    if (err) {
      setError(err.message)
      return false
    }
    return true
  }, [])

  /* ── Set item status (5-state workflow) ─────────────────────────── */
  const setItemStatus = useCallback(async (itemId: string, newStatus: DDItemStatus) => {
    const isCompleted = newStatus === 'verified'
    const { error: err } = await supabase
      .from('dd_checklist_items')
      .update({
        status: newStatus,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
    if (err) {
      setError(err.message)
      return false
    }
    await loadChecklists()
    return true
  }, [loadChecklists])

  /* ── Toggle item (legacy compat — maps to status) ──────────────── */
  const toggleItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    return setItemStatus(itemId, isCompleted ? 'verified' : 'not_started')
  }, [setItemStatus])

  /* ── Remove item (founder only) ──────────────────────────────── */
  const removeItem = useCallback(async (itemId: string) => {
    if (!isFounder) { setError('Only founders can remove items'); return false }
    const { error: err } = await supabase
      .from('dd_checklist_items')
      .delete()
      .eq('id', itemId)
    if (err) {
      setError(err.message)
      return false
    }
    await loadChecklists()
    return true
  }, [loadChecklists])

  /* ── Template mutations ─────────────────────────────────────────── */
  const createTemplate = useCallback(async (
    name: string,
    description: string | null,
    items: DDTemplateItem[],
  ) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('dd_templates')
      .insert({
        investor_id: user.id,
        name,
        description,
        items: items as any,
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
      .from('dd_templates')
      .delete()
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    await loadTemplates()
    return true
  }, [loadTemplates])

  /* ── Document upload for DD items (founder only) ─────────────────── */
  const uploadItemDoc = useCallback(async (itemId: string, file: File) => {
    if (!user) return null
    if (!isFounder) { setError('Only founders can upload documents'); return null }
    const docId = crypto.randomUUID()
    const storagePath = `dd/${user.id}/${itemId}/${docId}-${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('deal-documents')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) { setError(uploadErr.message); return null }
    // Update item with doc path and auto-set status to 'uploaded'
    const { error: updateErr } = await supabase
      .from('dd_checklist_items')
      .update({ document_id: storagePath, status: 'uploaded' })
      .eq('id', itemId)
    if (updateErr) { setError(updateErr.message); return null }
    await loadChecklists()
    return storagePath
  }, [user, isFounder, loadChecklists])

  const viewItemDoc = useCallback(async (documentPath: string) => {
    const { data } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(documentPath, 300)
    return data?.signedUrl ?? null
  }, [])

  /* ── Investor: verify an uploaded document ───────────────────────── */
  const verifyItem = useCallback(async (itemId: string) => {
    return setItemStatus(itemId, 'verified')
  }, [setItemStatus])

  /* ── Investor: request re-upload with instructions ───────────────── */
  const requestReupload = useCallback(async (itemId: string, comment: string) => {
    const { error: err } = await supabase
      .from('dd_checklist_items')
      .update({ status: 'in_progress', notes: comment })
      .eq('id', itemId)
    if (err) { setError(err.message); return false }
    await loadChecklists()
    return true
  }, [loadChecklists])

  /* ── Investor: flag an item ──────────────────────────────────────── */
  const flagItem = useCallback(async (itemId: string, comment?: string) => {
    const { error: err } = await supabase
      .from('dd_checklist_items')
      .update({ status: 'flagged', notes: comment ?? null })
      .eq('id', itemId)
    if (err) { setError(err.message); return false }
    await loadChecklists()
    return true
  }, [loadChecklists])

  /* ── AI analyze checklist (completeness scoring) ─────────────────── */
  const analyzeChecklist = useCallback(async (checklistId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return null
    const res = await supabase.functions.invoke('dd-analyze', {
      body: { checklist_id: checklistId, mode: 'completeness' },
    })
    if (res.error) throw new Error(res.error.message)
    return res.data as {
      completeness: Record<string, { score: number; missing: string[] }> | null
      issues: { type: string; item_id: string; message: string }[]
    }
  }, [])

  /* ── Generate DD report PDF ──────────────────────────────────────── */
  const generateReport = useCallback(async (checklistId: string) => {
    const res = await supabase.functions.invoke('dd-report', {
      body: { checklist_id: checklistId },
    })
    if (res.error) throw new Error(res.error.message)
    return (res.data as { pdf_url: string | null })?.pdf_url ?? null
  }, [])

  /* ── Computed ────────────────────────────────────────────────────── */
  const systemTemplates = useMemo(() => templates.filter(t => t.is_system), [templates])
  const userTemplates = useMemo(() => templates.filter(t => !t.is_system), [templates])

  return {
    checklists,
    templates,
    systemTemplates,
    userTemplates,
    isLoading,
    error,
    isInvestor,
    isFounder,
    loadChecklists,
    loadChecklistDetail,
    loadTemplates,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    archiveChecklist,
    completeChecklist,
    addItem,
    updateItem,
    setItemStatus,
    toggleItem,
    removeItem,
    createTemplate,
    deleteTemplate,
    uploadItemDoc,
    viewItemDoc,
    verifyItem,
    requestReupload,
    flagItem,
    analyzeChecklist,
    generateReport,
  }
}
