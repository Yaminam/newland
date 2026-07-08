import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'
import { cacheGet, cacheSet, cacheIsStale } from '@/app/lib/queryCache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export const CRM_STAGES = [
  { key: 'cold',       label: 'Cold',        color: '#94A3B8' },
  { key: 'warm',       label: 'Warm',        color: '#F59E0B' },
  { key: 'pitched',    label: 'Pitched',     color: '#3B82F6' },
  { key: 'in_dd',      label: 'In DD',       color: '#8B5CF6' },
  { key: 'term_sheet', label: 'Term Sheet',  color: '#10B981' },
  { key: 'closed',     label: 'Closed',      color: '#059669' },
] as const

export type CRMStageKey = (typeof CRM_STAGES)[number]['key']

export interface CRMContact {
  id: string
  founder_id: string
  investor_user_id: string | null
  scraped_investor_id: string | null
  display_name: string
  firm_name: string | null
  email: string | null
  linkedin_url: string | null
  phone: string | null
  avatar_url: string | null
  stage: CRMStageKey
  tags: string[]
  notes: string | null
  source: string
  created_at: string
  updated_at: string
}

export interface CRMInteraction {
  id: string
  contact_id: string
  founder_id: string
  type: string
  title: string
  body: string | null
  occurred_at: string
  source_table: string | null
  source_id: string | null
  next_action: string | null
  next_action_date: string | null
  created_at: string
}

export interface CRMReminder {
  id: string
  contact_id: string
  founder_id: string
  title: string
  remind_at: string
  is_done: boolean
  created_at: string
}

export interface CalendarConnection {
  id: string
  provider: 'google' | 'outlook'
  calendar_email: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  connection_id: string
  external_event_id: string
  contact_id: string | null
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  attendees: { email: string; name?: string }[]
  meeting_link: string | null
  is_logged: boolean
  created_at: string
}

export interface StageCounts {
  stage: string
  count: number
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useCRM() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [interactions, setInteractions] = useState<CRMInteraction[]>([])
  const [reminders, setReminders] = useState<CRMReminder[]>([])
  const [stageCounts, setStageCounts] = useState<StageCounts[]>([])
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Load contacts ─────────────────────────────────────────────── */
  const loadContacts = useCallback(async () => {
    if (!user) return
    const key = `crm:contacts:${user.id}`

    const cached = cacheGet<CRMContact[]>(key)
    if (cached) {
      setContacts(cached)
      if (!cacheIsStale(key)) return
    }

    const { data, error: err } = await supabase
      .from('crm_contacts')
      .select('id, founder_id, investor_user_id, scraped_investor_id, display_name, firm_name, email, linkedin_url, phone, avatar_url, stage, tags, notes, source, created_at, updated_at')
      .eq('founder_id', user.id)
      .order('updated_at', { ascending: false })
    if (err) { setError(err.message); return }
    const contacts = (data as CRMContact[]) ?? []
    cacheSet(key, contacts)
    setContacts(contacts)
  }, [user])

  /* ── Load interactions for a specific contact ──────────────────── */
  const loadInteractions = useCallback(async (contactId: string) => {
    const { data, error: err } = await supabase
      .from('crm_interactions')
      .select('id, contact_id, founder_id, type, title, body, occurred_at, source_table, source_id, next_action, next_action_date, created_at')
      .eq('contact_id', contactId)
      .order('occurred_at', { ascending: false })
    if (err) { setError(err.message); return }
    setInteractions((data as CRMInteraction[]) ?? [])
  }, [])

  /* ── Load reminders ────────────────────────────────────────────── */
  const loadReminders = useCallback(async (contactId?: string) => {
    if (!user) return
    // Only cache the global (no contactId) reminder list — per-contact
    // queries are too specific to be worth caching individually.
    const key = contactId ? null : `crm:reminders:${user.id}`

    if (key) {
      const cached = cacheGet<CRMReminder[]>(key)
      if (cached) {
        setReminders(cached)
        if (!cacheIsStale(key)) return
      }
    }

    let query = supabase
      .from('crm_reminders')
      .select('id, contact_id, founder_id, title, remind_at, is_done, created_at')
      .eq('founder_id', user.id)
      .eq('is_done', false)
      .order('remind_at', { ascending: true })
    if (contactId) query = query.eq('contact_id', contactId)
    const { data, error: err } = await query
    if (err) { setError(err.message); return }
    const reminders = (data as CRMReminder[]) ?? []
    if (key) cacheSet(key, reminders)
    setReminders(reminders)
  }, [user])

  /* ── Load stage counts via RPC ─────────────────────────────────── */
  const loadStageCounts = useCallback(async () => {
    if (!user) return
    const { data, error: err } = await supabase.rpc('crm_stage_counts')
    if (err) { setError(err.message); return }
    setStageCounts((data as StageCounts[]) ?? [])
  }, [user])

  /* ── Initial load ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    Promise.all([loadContacts(), loadStageCounts(), loadReminders()])
      .finally(() => setIsLoading(false))
  }, [user, loadContacts, loadStageCounts, loadReminders])

  /* ── Realtime ──────────────────────────────────────────────────── */
  const reload = useCallback(() => {
    loadContacts()
    loadStageCounts()
    loadReminders()
  }, [loadContacts, loadStageCounts, loadReminders])

  useTableRealtime(['crm_contacts', 'crm_interactions', 'crm_reminders'], reload, {
    events: ['INSERT', 'UPDATE', 'DELETE'],
  })

  /* ── Group contacts by stage ───────────────────────────────────── */
  const grouped = useMemo(() => {
    const map: Record<string, CRMContact[]> = {}
    for (const s of CRM_STAGES) map[s.key] = []
    for (const c of contacts) {
      if (!map[c.stage]) map[c.stage] = []
      map[c.stage].push(c)
    }
    return map
  }, [contacts])

  /* ── Stage count map ───────────────────────────────────────────── */
  const stageCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of CRM_STAGES) map[s.key] = 0
    for (const sc of stageCounts) map[sc.stage] = sc.count
    return map
  }, [stageCounts])

  /* ── Mutations ─────────────────────────────────────────────────── */

  const addContact = useCallback(async (contact: {
    display_name: string
    firm_name?: string
    email?: string
    linkedin_url?: string
    phone?: string
    investor_user_id?: string
    scraped_investor_id?: string
    source?: string
    stage?: CRMStageKey
    notes?: string
    tags?: string[]
  }) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('crm_contacts')
      .insert({
        founder_id: user.id,
        display_name: contact.display_name,
        firm_name: contact.firm_name || null,
        email: contact.email || null,
        linkedin_url: contact.linkedin_url || null,
        phone: contact.phone || null,
        investor_user_id: contact.investor_user_id || null,
        scraped_investor_id: contact.scraped_investor_id || null,
        source: contact.source ?? 'manual',
        stage: contact.stage ?? 'cold',
        notes: contact.notes || null,
        tags: contact.tags ?? [],
      })
      .select()
      .single()
    if (err) { setError(err.message); return null }
    await reload()
    return data
  }, [user, reload])

  const updateContact = useCallback(async (contactId: string, updates: Partial<CRMContact>) => {
    const { error: err } = await supabase
      .from('crm_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', contactId)
    if (err) { setError(err.message); return false }
    await reload()
    return true
  }, [reload])

  const moveContactStage = useCallback(async (contactId: string, newStage: CRMStageKey) => {
    setContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, stage: newStage } : c),
    )
    const { error: err } = await supabase
      .from('crm_contacts')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', contactId)
    if (err) {
      setError(err.message)
      loadContacts()
    } else {
      loadStageCounts()
    }
  }, [loadContacts, loadStageCounts])

  const deleteContact = useCallback(async (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId))
    const { error: err } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', contactId)
    if (err) {
      setError(err.message)
      loadContacts()
    } else {
      loadStageCounts()
    }
  }, [loadContacts, loadStageCounts])

  /* ── Interaction mutations ─────────────────────────────────────── */

  const addInteraction = useCallback(async (interaction: {
    contact_id: string
    type: string
    title: string
    body?: string
    occurred_at?: string
    next_action?: string
    next_action_date?: string
  }) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('crm_interactions')
      .insert({
        contact_id: interaction.contact_id,
        founder_id: user.id,
        type: interaction.type,
        title: interaction.title,
        body: interaction.body || null,
        occurred_at: interaction.occurred_at ?? new Date().toISOString(),
        next_action: interaction.next_action || null,
        next_action_date: interaction.next_action_date || null,
      })
      .select()
      .single()
    if (err) { setError(err.message); return null }
    // Update the contact's updated_at
    await supabase
      .from('crm_contacts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', interaction.contact_id)
    return data
  }, [user])

  /* ── Reminder mutations ────────────────────────────────────────── */

  const addReminder = useCallback(async (reminder: {
    contact_id: string
    title: string
    remind_at: string
  }) => {
    if (!user) return null
    const { data, error: err } = await supabase
      .from('crm_reminders')
      .insert({
        contact_id: reminder.contact_id,
        founder_id: user.id,
        title: reminder.title,
        remind_at: reminder.remind_at,
      })
      .select()
      .single()
    if (err) { setError(err.message); return null }
    await loadReminders()
    return data
  }, [user, loadReminders])

  const completeReminder = useCallback(async (reminderId: string) => {
    const { error: err } = await supabase
      .from('crm_reminders')
      .update({ is_done: true })
      .eq('id', reminderId)
    if (err) { setError(err.message); return false }
    await loadReminders()
    return true
  }, [loadReminders])

  /* ── AI Summary (streams SSE from edge function) ────────────────── */

  const getAISummary = useCallback(async (
    contactId: string,
    onChunk: (text: string) => void,
  ): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return false

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-ai-summary`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contact_id: contactId }),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI summary failed' }))
      setError(err.error ?? 'AI summary failed')
      return false
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr || jsonStr === '[DONE]') continue
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.text) onChunk(parsed.text)
        } catch { /* skip */ }
      }
    }
    return true
  }, [])

  /* ── Bulk stage update ─────────────────────────────────────────── */

  const bulkMoveStage = useCallback(async (contactIds: string[], newStage: CRMStageKey) => {
    if (!user || contactIds.length === 0) return false
    // Optimistic update
    setContacts(prev =>
      prev.map(c => contactIds.includes(c.id) ? { ...c, stage: newStage } : c),
    )
    const { error: err } = await supabase
      .from('crm_contacts')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .in('id', contactIds)
    if (err) {
      setError(err.message)
      loadContacts()
      return false
    }
    loadStageCounts()
    return true
  }, [user, loadContacts, loadStageCounts])

  const bulkDelete = useCallback(async (contactIds: string[]) => {
    if (!user || contactIds.length === 0) return false
    setContacts(prev => prev.filter(c => !contactIds.includes(c.id)))
    const { error: err } = await supabase
      .from('crm_contacts')
      .delete()
      .in('id', contactIds)
    if (err) {
      setError(err.message)
      loadContacts()
      return false
    }
    loadStageCounts()
    return true
  }, [user, loadContacts, loadStageCounts])

  /* ── Calendar integration ──────────────────────────────────────── */

  const calendarFetch = useCallback(async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      },
    )
    return res.json()
  }, [])

  const loadCalendarConnections = useCallback(async () => {
    const result = await calendarFetch({ action: 'list_connections' })
    if (result?.connections) setCalendarConnections(result.connections)
  }, [calendarFetch])

  const loadCalendarEvents = useCallback(async (contactId?: string) => {
    if (!user) return
    let query = supabase
      .from('calendar_events')
      .select('id, user_id, connection_id, external_event_id, contact_id, title, description, start_time, end_time, location, attendees, meeting_link, is_logged, created_at')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(50)
    if (contactId) query = query.eq('contact_id', contactId)
    const { data } = await query
    setCalendarEvents((data as CalendarEvent[]) ?? [])
  }, [user])

  const connectCalendar = useCallback(async (provider: 'google' | 'outlook') => {
    const redirectUri = `${window.location.origin}/dashboard/calendar-callback`
    const result = await calendarFetch({ action: 'get_auth_url', provider, redirect_uri: redirectUri })
    if (result?.url) {
      // Open OAuth popup
      const w = 500
      const h = 600
      const left = window.screenX + (window.innerWidth - w) / 2
      const top = window.screenY + (window.innerHeight - h) / 2
      window.open(result.url, 'calendar-oauth', `width=${w},height=${h},left=${left},top=${top}`)
    }
    return result
  }, [calendarFetch])

  const exchangeCalendarCode = useCallback(async (provider: 'google' | 'outlook', code: string) => {
    const redirectUri = `${window.location.origin}/dashboard/calendar-callback`
    const result = await calendarFetch({ action: 'exchange_code', provider, code, redirect_uri: redirectUri })
    if (result?.connection) {
      await loadCalendarConnections()
    }
    return result
  }, [calendarFetch, loadCalendarConnections])

  const disconnectCalendar = useCallback(async (provider: 'google' | 'outlook') => {
    await calendarFetch({ action: 'disconnect', provider })
    await loadCalendarConnections()
  }, [calendarFetch, loadCalendarConnections])

  const syncCalendar = useCallback(async (provider: 'google' | 'outlook') => {
    const result = await calendarFetch({ action: 'sync', provider })
    if (result?.synced != null) {
      await loadCalendarConnections()
      await loadCalendarEvents()
    }
    return result
  }, [calendarFetch, loadCalendarConnections, loadCalendarEvents])

  /* ── Load calendar connections on mount ─────────────────────────── */
  useEffect(() => {
    if (!user) return
    loadCalendarConnections()
  }, [user, loadCalendarConnections])

  /* ── CSV export ────────────────────────────────────────────────── */

  const exportCSV = useCallback(() => {
    const header = ['Name', 'Firm', 'Stage', 'Email', 'Tags', 'Source', 'Notes', 'Added']
    const rows = contacts.map(c => [
      c.display_name,
      c.firm_name ?? '',
      CRM_STAGES.find(s => s.key === c.stage)?.label ?? c.stage,
      c.email ?? '',
      (c.tags ?? []).join('; '),
      c.source,
      c.notes ?? '',
      c.created_at?.split('T')[0] ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`))
    const csv = [header.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `watchlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [contacts])

  return {
    contacts,
    interactions,
    reminders,
    stageCounts: stageCountMap,
    grouped,
    calendarConnections,
    calendarEvents,
    isLoading,
    error,
    reload,
    loadInteractions,
    loadReminders,
    loadCalendarConnections,
    loadCalendarEvents,
    connectCalendar,
    exchangeCalendarCode,
    disconnectCalendar,
    syncCalendar,
    addContact,
    updateContact,
    moveContactStage,
    deleteContact,
    addInteraction,
    addReminder,
    completeReminder,
    getAISummary,
    bulkMoveStage,
    bulkDelete,
    exportCSV,
  }
}
