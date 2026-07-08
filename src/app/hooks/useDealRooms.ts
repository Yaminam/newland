import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { useTableRealtime } from './useTableRealtime'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

export const DOCUMENT_CATEGORIES = [
  { key: 'pitch_deck',  label: 'Pitch Deck',  icon: 'presentation' },
  { key: 'financials',  label: 'Financials',   icon: 'bar-chart-3' },
  { key: 'cap_table',   label: 'Cap Table',    icon: 'table' },
  { key: 'legal',       label: 'Legal',        icon: 'scale' },
  { key: 'other',       label: 'Other',        icon: 'file' },
] as const

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]['key']

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DealRoom {
  id: string
  founder_id: string
  startup_id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  parent_room_id: string | null
  created_at: string
  updated_at: string
  // joined
  member_count?: number
  document_count?: number
  has_pin?: boolean
  startup?: {
    id: string
    company_name: string
    sector: string | null
  }
}

export interface SubRoomInfo {
  id: string
  investor_id: string
  investor_name: string | null
  investor_avatar: string | null
}

export interface DealRoomMember {
  id: string
  room_id: string
  user_id: string
  role: 'owner' | 'viewer'
  invited_at: string
  revoked_at: string | null
  // joined
  profile?: {
    id: string
    full_name: string | null
    company: string | null
    avatar_url: string | null
    role: string | null
  }
}

export interface DealRoomDocument {
  id: string
  room_id: string
  uploaded_by: string
  category: DocumentCategory
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  is_encrypted: boolean
  created_at: string
  // joined
  uploader?: {
    id: string
    full_name: string | null
  }
}

export interface DealRoomActivity {
  id: string
  room_id: string
  user_id: string
  action: string
  target_id: string | null
  metadata: Record<string, any>
  created_at: string
  // joined
  user?: {
    id: string
    full_name: string | null
  }
}

export type MilestoneStage = 'nda' | 'due_diligence' | 'term_sheet' | 'legals' | 'closed'
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export const MILESTONE_STAGES: { value: MilestoneStage; label: string }[] = [
  { value: 'nda', label: 'NDA' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'legals', label: 'Legals' },
  { value: 'closed', label: 'Closed' },
]

export interface DealRoomMilestone {
  id: string
  room_id: string
  stage: MilestoneStage
  status: MilestoneStatus
  completed_at: string | null
  completed_by: string | null
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface DealRoomMessage {
  id: string
  room_id: string
  user_id: string
  body: string
  thread_id: string | null
  created_at: string
  // joined
  user?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface DealRoomInvite {
  id: string
  room_id: string
  investor_id: string
  founder_id: string
  status: 'pending' | 'accepted' | 'declined'
  invited_at: string
  responded_at: string | null
  // for investor view
  room?: { name: string; description: string | null }
  founder?: { full_name: string | null; avatar_url: string | null }
  // for founder view
  investor?: { full_name: string | null; avatar_url: string | null; company: string | null }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useDealRooms() {
  const { user, profile } = useAuth()
  const isFounder = profile?.role === 'founder'

  const [rooms, setRooms] = useState<DealRoom[]>([])
  const [documents, setDocuments] = useState<DealRoomDocument[]>([])
  const [members, setMembers] = useState<DealRoomMember[]>([])
  const [activity, setActivity] = useState<DealRoomActivity[]>([])
  const [milestones, setMilestones] = useState<DealRoomMilestone[]>([])
  const [messages, setMessages] = useState<DealRoomMessage[]>([])
  const [subRooms, setSubRooms] = useState<SubRoomInfo[]>([])
  const [pendingInvites, setPendingInvites] = useState<DealRoomInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track active room (parent for founders, sub for investors)
  const activeRoomIdRef = useRef<string | null>(null)
  // For founders: track the parent room separately so realtime reloads target the right room
  const activeParentIdRef = useRef<string | null>(null)

  /* ── Load all rooms the user has access to ──────────────────────── */
  const loadRooms = useCallback(async () => {
    if (!user) return

    // For investors: always load pending invites first — independent of whether they have rooms
    if (!isFounder) {
      const { data: inviteData } = await supabase
        .from('deal_room_invites')
        .select('*, room:deal_rooms!room_id ( name, description ), founder:profiles!founder_id ( full_name, avatar_url )')
        .eq('investor_id', user.id)
        .eq('status', 'pending')
      setPendingInvites((inviteData ?? []) as DealRoomInvite[])
    }

    const { data, error: err } = await supabase
      .from('deal_rooms')
      .select('id, founder_id, startup_id, name, description, status, parent_room_id, created_at, updated_at, startup:startup_applications ( id, company_name, sector )')
      .order('updated_at', { ascending: false })
    if (err) {
      setError(err.message)
      return
    }
    if (!data?.length) { setRooms([]); return }

    // Founders see parent rooms, investors see sub-rooms
    const filtered = isFounder
      ? data.filter((r: any) => !r.parent_room_id)
      : data.filter((r: any) => !!r.parent_room_id)

    if (!filtered.length) { setRooms([]); return }

    const roomIds = filtered.map((r: any) => r.id)

    // For founders: count members via sub-rooms; for investors: count direct members
    let memberCounts: Record<string, number> = {}

    if (isFounder) {
      // Count sub-rooms per parent (each sub-room = 1 investor)
      const allSubRooms = data.filter((r: any) => r.parent_room_id && roomIds.includes(r.parent_room_id))
      for (const sub of allSubRooms) {
        const pid = (sub as any).parent_room_id
        memberCounts[pid] = (memberCounts[pid] ?? 0) + 1
      }
    } else {
      const { data: membersData } = await supabase
        .from('deal_room_members')
        .select('room_id')
        .in('room_id', roomIds)
        .is('revoked_at', null)
      for (const m of membersData ?? []) memberCounts[m.room_id] = (memberCounts[m.room_id] ?? 0) + 1
    }

    // For founders: count docs on parent rooms; for investors: count docs on parent
    const docCountIds = isFounder
      ? roomIds
      : [...new Set(filtered.map((r: any) => r.parent_room_id).filter(Boolean))]
    const { data: docsData } = await supabase
      .from('deal_room_documents')
      .select('room_id')
      .in('room_id', docCountIds)
    const docCounts: Record<string, number> = {}
    for (const d of docsData ?? []) docCounts[d.room_id] = (docCounts[d.room_id] ?? 0) + 1

    // PIN status (only for parent rooms — founders set PINs on parent)
    const pinRoomIds = isFounder ? roomIds : [...new Set(filtered.map((r: any) => r.parent_room_id).filter(Boolean))]
    const pinResults = await Promise.all(
      pinRoomIds.map((id: string) => supabase.rpc('deal_room_has_pin', { p_room_id: id }))
    )
    const pinStatus: Record<string, boolean> = {}
    pinRoomIds.forEach((id: string, idx: number) => { pinStatus[id] = !!pinResults[idx]?.data })

    setRooms(filtered.map((r: any) => {
      const docRoomId = isFounder ? r.id : r.parent_room_id
      const pinRoomId = isFounder ? r.id : r.parent_room_id
      return {
        ...r,
        member_count: memberCounts[r.id] ?? 0,
        document_count: docCounts[docRoomId] ?? 0,
        has_pin: pinStatus[pinRoomId] ?? false,
      }
    }))
  }, [user, isFounder])

  /* ── Load detail for a single room ──────────────────────────────── */
  const loadRoomDetail = useCallback(async (roomId: string) => {
    if (!user) return
    activeRoomIdRef.current = roomId

    // Determine if this is a sub-room
    const { data: roomData } = await supabase
      .from('deal_rooms')
      .select('parent_room_id, founder_id')
      .eq('id', roomId)
      .maybeSingle()

    const isSubRoom = !!roomData?.parent_room_id
    const parentId = isSubRoom ? roomData.parent_room_id! : roomId
    activeParentIdRef.current = parentId

    // Documents & milestones always come from the parent room
    // Members, activity, messages depend on room type
    const [docsRes, membersRes, activityRes, milestonesRes, messagesRes] = await Promise.all([
      supabase
        .from('deal_room_documents')
        .select('*, uploader:profiles!uploaded_by ( id, full_name )')
        .eq('room_id', parentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('deal_room_members')
        .select('*, profile:profiles!user_id ( id, full_name, company, avatar_url, role )')
        .eq('room_id', roomId)
        .order('invited_at', { ascending: true }),
      supabase
        .from('deal_room_activity')
        .select('*, user:profiles!user_id ( id, full_name )')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('deal_room_milestones')
        .select('*')
        .eq('room_id', parentId)
        .order('position', { ascending: true }),
      // For sub-rooms (investor): load messages from this room
      // For parent rooms (founder): don't load messages here — loaded per sub-room tab
      ...(isSubRoom ? [
        supabase
          .from('deal_room_messages')
          .select('*, user:profiles!deal_room_messages_user_id_profiles_fkey ( id, full_name, avatar_url )')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(100),
      ] : [Promise.resolve({ data: [], error: null })]),
    ])

    if (docsRes.error) setError(docsRes.error.message)
    else setDocuments((docsRes.data as DealRoomDocument[]) ?? [])

    if (membersRes.error) setError(membersRes.error.message)
    else setMembers((membersRes.data as DealRoomMember[]) ?? [])

    if (activityRes.error) setError(activityRes.error.message)
    else setActivity((activityRes.data as DealRoomActivity[]) ?? [])

    if (milestonesRes.error) setError(milestonesRes.error.message)
    else setMilestones((milestonesRes.data as DealRoomMilestone[]) ?? [])

    if (messagesRes.error) setError(messagesRes.error.message)
    else setMessages((messagesRes.data as DealRoomMessage[]) ?? [])

    // For parent rooms (founder): load sub-rooms + pending invites
    if (!isSubRoom) {
      // Load pending invites for this room (founder view of MemberManagement)
      const { data: inviteData } = await supabase
        .from('deal_room_invites')
        .select('*, investor:profiles!investor_id ( full_name, avatar_url, company )')
        .eq('room_id', roomId)
        .eq('status', 'pending')
      setPendingInvites((inviteData ?? []) as DealRoomInvite[])

      const { data: subs } = await supabase
        .from('deal_rooms')
        .select('id')
        .eq('parent_room_id', roomId)
        .eq('status', 'active')

      if (subs?.length) {
        const subRoomInfos: SubRoomInfo[] = []
        // For each sub-room, find the investor member
        const { data: subMembers } = await supabase
          .from('deal_room_members')
          .select('room_id, user_id, profile:profiles!user_id ( id, full_name, avatar_url )')
          .in('room_id', subs.map(s => s.id))
          .eq('role', 'viewer')
          .is('revoked_at', null)

        for (const sub of subs) {
          const member = (subMembers ?? []).find((m: any) => m.room_id === sub.id) as any
          if (member) {
            subRoomInfos.push({
              id: sub.id,
              investor_id: member.user_id,
              investor_name: member.profile?.full_name ?? null,
              investor_avatar: member.profile?.avatar_url ?? null,
            })
          }
        }
        setSubRooms(subRoomInfos)
      } else {
        setSubRooms([])
      }
    } else {
      setSubRooms([])
    }
  }, [user])

  /* ── Initial load ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    loadRooms().finally(() => setIsLoading(false))
  }, [user, loadRooms])

  /* ── Realtime ───────────────────────────────────────────────────── */
  const reloadAll = useCallback(() => {
    loadRooms()
    // Always reload the parent room for founders
    const targetId = activeParentIdRef.current || activeRoomIdRef.current
    if (targetId) loadRoomDetail(targetId)
  }, [loadRooms, loadRoomDetail])

  useTableRealtime(
    ['deal_rooms', 'deal_room_documents', 'deal_room_members', 'deal_room_milestones', 'deal_room_invites'],
    reloadAll,
    { events: ['INSERT', 'UPDATE', 'DELETE'] },
  )

  // Dedicated realtime channel for messages
  useEffect(() => {
    const ch = supabase
      .channel('rt-deal-room-messages-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deal_room_messages' },
        async (payload) => {
          const newRow = payload.new as { id: string; room_id: string; user_id: string; body: string; thread_id: string | null; created_at: string }
          // Accept messages for the active room OR any active sub-room
          if (!activeRoomIdRef.current || newRow.room_id !== activeRoomIdRef.current) return
          const { data } = await supabase
            .from('deal_room_messages')
            .select('*, user:profiles!deal_room_messages_user_id_profiles_fkey ( id, full_name, avatar_url )')
            .eq('id', newRow.id)
            .maybeSingle()
          if (data) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data as DealRoomMessage]
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'deal_room_messages' },
        (payload) => {
          const oldRow = payload.old as { id: string }
          setMessages(prev => prev.filter(m => m.id !== oldRow.id))
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(ch) }
  }, [])

  /* ── Grouped by status ──────────────────────────────────────────── */
  const activeRooms = useMemo(() => rooms.filter(r => r.status === 'active'), [rooms])
  const archivedRooms = useMemo(() => rooms.filter(r => r.status === 'archived'), [rooms])

  /* ── Mutations ──────────────────────────────────────────────────── */

  const createRoom = useCallback(async (name: string, description?: string, pin?: string) => {
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
      .from('deal_rooms')
      .insert({
        founder_id: user.id,
        startup_id: startup.id,
        name,
        description: description || null,
      })
      .select()
      .single()
    if (err) {
      setError(err.message)
      return null
    }

    // Set PIN if provided
    if (pin?.trim()) {
      await supabase.rpc('set_deal_room_pin', { p_room_id: data.id, p_pin: pin.trim() })
    }

    await loadRooms()
    return data
  }, [user, loadRooms])

  const updateRoom = useCallback(async (roomId: string, updates: { name?: string; description?: string | null }) => {
    const { error: err } = await supabase
      .from('deal_rooms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', roomId)
    if (err) { setError(err.message); return false }
    // Also update sub-room names if name changed
    if (updates.name) {
      await supabase
        .from('deal_rooms')
        .update({ name: updates.name, updated_at: new Date().toISOString() })
        .eq('parent_room_id', roomId)
    }
    await loadRooms()
    return true
  }, [loadRooms])

  const deleteRoom = useCallback(async (roomId: string) => {
    // Delete sub-rooms first (cascade should handle, but be explicit)
    const { data: subs } = await supabase
      .from('deal_rooms')
      .select('id')
      .eq('parent_room_id', roomId)
    if (subs?.length) {
      const subIds = subs.map(s => s.id)
      await supabase.from('deal_room_messages').delete().in('room_id', subIds)
      await supabase.from('deal_room_activity').delete().in('room_id', subIds)
      await supabase.from('deal_room_members').delete().in('room_id', subIds)
      await supabase.from('deal_rooms').delete().in('id', subIds)
    }
    // Delete parent room data
    await supabase.from('deal_room_messages').delete().eq('room_id', roomId)
    await supabase.from('deal_room_activity').delete().eq('room_id', roomId)
    await supabase.from('deal_room_milestones').delete().eq('room_id', roomId)
    // Delete documents from storage
    const { data: docs } = await supabase
      .from('deal_room_documents')
      .select('file_path')
      .eq('room_id', roomId)
    if (docs?.length) {
      await supabase.storage.from('deal-documents').remove(docs.map(d => d.file_path))
    }
    await supabase.from('deal_room_documents').delete().eq('room_id', roomId)
    await supabase.from('deal_room_members').delete().eq('room_id', roomId)
    const { error: err } = await supabase.from('deal_rooms').delete().eq('id', roomId)
    if (err) { setError(err.message); return false }
    await loadRooms()
    return true
  }, [loadRooms])

  const archiveRoom = useCallback(async (roomId: string) => {
    const { error: err } = await supabase
      .from('deal_rooms')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', roomId)
    if (err) {
      setError(err.message)
      return false
    }
    // Also archive all sub-rooms
    await supabase
      .from('deal_rooms')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('parent_room_id', roomId)
    await loadRooms()
    return true
  }, [loadRooms])

  const restoreRoom = useCallback(async (roomId: string) => {
    const { error: err } = await supabase
      .from('deal_rooms')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', roomId)
    if (err) {
      setError(err.message)
      return false
    }
    // Also restore sub-rooms
    await supabase
      .from('deal_rooms')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('parent_room_id', roomId)
    await loadRooms()
    return true
  }, [loadRooms])

  /* ── Member management ──────────────────────────────────────────── */

  const inviteMember = useCallback(async (roomId: string, userId: string, userName?: string) => {
    if (!user) return false

    const room = rooms.find(r => r.id === roomId)
    if (!room) return false

    // Check if an invite already exists
    const { data: existing } = await supabase
      .from('deal_room_invites')
      .select('id, status')
      .eq('room_id', roomId)
      .eq('investor_id', userId)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'pending') return false // invite already in-flight
      // For 'accepted' status: only block if the investor still has active access.
      // After a revoke the invite is set to 'declined', so this guard rarely fires.
      if (existing.status === 'accepted') {
        // Check whether they still have a live (non-revoked) member row in a sub-room
        const { data: subs } = await supabase
          .from('deal_rooms')
          .select('id')
          .eq('parent_room_id', roomId)
        if (subs?.length) {
          const { data: activeSub } = await supabase
            .from('deal_room_members')
            .select('id')
            .in('room_id', subs.map(s => s.id))
            .eq('user_id', userId)
            .is('revoked_at', null)
            .maybeSingle()
          if (activeSub) return false // genuinely still in the room
        }
      }
      // Re-invite (declined or accepted-but-revoked)
      await supabase
        .from('deal_room_invites')
        .update({ status: 'pending', responded_at: null, invited_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      const { error: invErr } = await supabase.from('deal_room_invites').insert({
        room_id: roomId,
        investor_id: userId,
        founder_id: user.id,
      })
      if (invErr) { setError(invErr.message); return false }
    }

    // Log activity
    await supabase.from('deal_room_activity').insert({
      room_id: roomId,
      user_id: user.id,
      action: 'member_invited',
      target_id: userId,
      metadata: { member_name: userName ?? null },
    })

    // Notify investor (cross-user — requires SECURITY DEFINER RPC)
    await supabase.rpc('send_notification', {
      p_user_id: userId,
      p_type: 'deal_room_invite',
      p_title: 'Deal Room Invitation',
      p_body: `You've been invited to the deal room "${room.name}"`,
      p_action_url: '/dashboard/deal-rooms',
      p_payload: { room_id: roomId },
    })

    await loadRoomDetail(roomId)
    return true
  }, [user, rooms, loadRoomDetail])

  const revokeMember = useCallback(async (roomId: string, userId: string, userName?: string) => {
    if (!user) return false

    // Mark any invite (pending or accepted) as declined so re-invite is possible
    await supabase
      .from('deal_room_invites')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('investor_id', userId)

    // Find the investor's sub-room and revoke access
    const { data: allSubs } = await supabase
      .from('deal_rooms')
      .select('id')
      .eq('parent_room_id', roomId)
    if (allSubs?.length) {
      const { data: investorSub } = await supabase
        .from('deal_room_members')
        .select('room_id')
        .in('room_id', allSubs.map(s => s.id))
        .eq('user_id', userId)
        .is('revoked_at', null)
        .maybeSingle()
      if (investorSub) {
        await supabase
          .from('deal_room_members')
          .update({ revoked_at: new Date().toISOString() })
          .eq('room_id', investorSub.room_id)
          .eq('user_id', userId)
        await supabase
          .from('deal_rooms')
          .update({ status: 'archived', updated_at: new Date().toISOString() })
          .eq('id', investorSub.room_id)
      }
    }

    // Also revoke from parent room if they were added there
    await supabase
      .from('deal_room_members')
      .update({ revoked_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    // Log activity
    await supabase.from('deal_room_activity').insert({
      room_id: roomId,
      user_id: user.id,
      action: 'member_revoked',
      target_id: userId,
      metadata: { member_name: userName ?? null },
    })

    await loadRoomDetail(roomId)
    return true
  }, [user, loadRoomDetail])

  /* ── Document management ────────────────────────────────────────── */

  const uploadDocument = useCallback(async (
    roomId: string,
    category: DocumentCategory,
    file: File,
  ) => {
    if (!user) return null
    // Always upload to parent room
    const parentId = activeParentIdRef.current || roomId
    const docId = crypto.randomUUID()
    const storagePath = `${parentId}/${docId}/${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('deal-documents')
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) {
      setError(uploadErr.message)
      return null
    }

    const { data, error: insertErr } = await supabase
      .from('deal_room_documents')
      .insert({
        id: docId,
        room_id: parentId,
        uploaded_by: user.id,
        category,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()
    if (insertErr) {
      setError(insertErr.message)
      return null
    }

    await supabase.from('deal_room_activity').insert({
      room_id: parentId,
      user_id: user.id,
      action: 'document_uploaded',
      target_id: docId,
      metadata: { file_name: file.name, category },
    })

    await supabase
      .from('deal_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', parentId)

    // Notify all active sub-room investors
    const { data: subs } = await supabase
      .from('deal_rooms')
      .select('id')
      .eq('parent_room_id', parentId)
      .eq('status', 'active')
    if (subs?.length) {
      const { data: investorMembers } = await supabase
        .from('deal_room_members')
        .select('user_id')
        .in('room_id', subs.map(s => s.id))
        .eq('role', 'viewer')
        .is('revoked_at', null)
      const investorIds = [...new Set((investorMembers ?? []).map(m => m.user_id))]
      if (investorIds.length) {
        const room = rooms.find(r => r.id === parentId)
        // Cross-user notifications — use SECURITY DEFINER RPC
        await Promise.all(investorIds.map(uid =>
          supabase.rpc('send_notification', {
            p_user_id: uid,
            p_type: 'deal_room_document',
            p_title: 'New Document Added',
            p_body: `A new ${category.replace('_', ' ')} was added to "${room?.name ?? 'Data Room'}"`,
            p_action_url: '/dashboard/deal-rooms',
            p_payload: { room_id: parentId, document_id: docId },
          })
        ))
      }
    }

    await loadRoomDetail(activeRoomIdRef.current || parentId)
    await loadRooms()
    return data
  }, [user, rooms, loadRoomDetail, loadRooms])

  const deleteDocument = useCallback(async (roomId: string, doc: DealRoomDocument) => {
    if (!user) return false
    const parentId = activeParentIdRef.current || roomId

    await supabase.storage.from('deal-documents').remove([doc.file_path])

    const { error: err } = await supabase
      .from('deal_room_documents')
      .delete()
      .eq('id', doc.id)
    if (err) {
      setError(err.message)
      return false
    }

    await supabase.from('deal_room_activity').insert({
      room_id: parentId,
      user_id: user.id,
      action: 'document_deleted',
      target_id: doc.id,
      metadata: { file_name: doc.file_name },
    })

    await loadRoomDetail(activeRoomIdRef.current || parentId)
    await loadRooms()
    return true
  }, [user, loadRoomDetail, loadRooms])

  const getDocumentUrl = useCallback(async (filePath: string) => {
    const { data } = await supabase.storage
      .from('deal-documents')
      .createSignedUrl(filePath, 300)
    return data?.signedUrl ?? null
  }, [])

  const downloadDocument = useCallback(async (filePath: string): Promise<Blob | null> => {
    const { data, error } = await supabase.storage
      .from('deal-documents')
      .download(filePath)
    if (error || !data) return null
    return data
  }, [])

  const getWatermarkedPdfUrl = useCallback(async (filePath: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ file_path: filePath }),
        },
      )
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [])

  /* ── Room PIN ────────────────────────────────────────────────────── */

  const verifyRoomPin = useCallback(async (roomId: string, pin: string): Promise<boolean> => {
    // PIN is always on the parent room
    const { data: roomData } = await supabase
      .from('deal_rooms')
      .select('parent_room_id')
      .eq('id', roomId)
      .maybeSingle()
    const targetId = roomData?.parent_room_id || roomId
    const { data, error: err } = await supabase.rpc('verify_deal_room_pin', {
      p_room_id: targetId,
      p_pin: pin,
    })
    if (err) { setError(err.message); return false }
    return !!data
  }, [])

  const setRoomPin = useCallback(async (roomId: string, pin: string | null): Promise<boolean> => {
    const { error: err } = await supabase.rpc('set_deal_room_pin', {
      p_room_id: roomId,
      p_pin: pin ?? '',
    })
    if (err) { setError(err.message); return false }
    await loadRooms()
    return true
  }, [loadRooms])

  const sendRoomPin = useCallback(async (
    roomId: string,
    pin: string,
  ): Promise<{ success: boolean; sent?: number; error?: string }> => {
    const { data, error } = await supabase.functions.invoke('send-deal-room-pin', {
      body: { room_id: roomId, pin },
    })
    if (error) return { success: false, error: error.message }
    return { success: true, sent: (data as any)?.sent ?? 0 }
  }, [])

  /* ── Vault encryption for document notes ─────────────────────────── */

  const encryptDocumentNotes = useCallback(async (docId: string, notes: string): Promise<boolean> => {
    const { error: err } = await supabase.rpc('encrypt_document_notes', { doc_id: docId, notes })
    if (err) { setError(err.message); return false }
    return true
  }, [])

  const decryptDocumentNotes = useCallback(async (docId: string): Promise<string | null> => {
    const { data, error: err } = await supabase.rpc('decrypt_document_notes', { doc_id: docId })
    if (err) { setError(err.message); return null }
    return data as string | null
  }, [])

  const logDocumentView = useCallback(async (roomId: string, docId: string, fileName: string) => {
    if (!user) return
    await supabase.from('deal_room_activity').insert({
      room_id: activeParentIdRef.current || roomId,
      user_id: user.id,
      action: 'document_viewed',
      target_id: docId,
      metadata: { file_name: fileName },
    })
  }, [user])

  const logDocumentDownload = useCallback(async (roomId: string, docId: string, fileName: string) => {
    if (!user) return
    await supabase.from('deal_room_activity').insert({
      room_id: activeParentIdRef.current || roomId,
      user_id: user.id,
      action: 'document_downloaded',
      target_id: docId,
      metadata: { file_name: fileName },
    })
  }, [user])

  /* ── Milestone management ──────────────────────────────────────── */

  const updateMilestone = useCallback(async (
    milestoneId: string,
    roomId: string,
    updates: Partial<Pick<DealRoomMilestone, 'status' | 'notes'>>,
  ) => {
    if (!user) return false
    const payload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() }
    if (updates.status === 'completed') {
      payload.completed_at = new Date().toISOString()
      payload.completed_by = user.id
    } else if (updates.status) {
      payload.completed_at = null
      payload.completed_by = null
    }
    const { error: err } = await supabase
      .from('deal_room_milestones')
      .update(payload)
      .eq('id', milestoneId)
    if (err) { setError(err.message); return false }
    await supabase.from('deal_room_activity').insert({
      room_id: activeParentIdRef.current || roomId,
      user_id: user.id,
      action: 'milestone_updated',
      target_id: milestoneId,
      metadata: { status: updates.status ?? null },
    })
    await loadRoomDetail(activeRoomIdRef.current || roomId)
    return true
  }, [user, loadRoomDetail])

  /* ── Chat / messaging ──────────────────────────────────────────── */

  const sendMessage = useCallback(async (roomId: string, body: string, threadId?: string) => {
    if (!user || !body.trim()) return null
    const { data, error: err } = await supabase
      .from('deal_room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        body: body.trim(),
        ...(threadId ? { thread_id: threadId } : {}),
      })
      .select('*, user:profiles!deal_room_messages_user_id_profiles_fkey ( id, full_name, avatar_url )')
      .single()
    if (err) { setError(err.message); return null }
    setMessages(prev => [...prev, data as DealRoomMessage])
    return data as DealRoomMessage
  }, [user])

  const loadMessages = useCallback(async (roomId: string) => {
    activeRoomIdRef.current = roomId
    const { data, error: err } = await supabase
      .from('deal_room_messages')
      .select('*, user:profiles!deal_room_messages_user_id_profiles_fkey ( id, full_name, avatar_url )')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)
    if (err) { setError(err.message); return }
    setMessages((data as DealRoomMessage[]) ?? [])
  }, [])

  const acceptInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!user) return false

    // Capture invite data before RPC so we have room name for the notification
    const pendingInvite = pendingInvites.find(i => i.id === inviteId)

    // Call SECURITY DEFINER RPC — investor cannot create deal_rooms rows with
    // a different founder_id due to RLS, so the server-side function does it.
    const { data: subRoomId, error: rpcErr } = await supabase.rpc('accept_deal_room_invite', {
      p_invite_id: inviteId,
    })
    if (rpcErr) { setError(rpcErr.message); return false }

    // Notify founder (cross-user — requires SECURITY DEFINER RPC)
    if (pendingInvite) {
      await supabase.rpc('send_notification', {
        p_user_id: pendingInvite.founder_id,
        p_type: 'deal_room_invite_accepted',
        p_title: 'Invitation Accepted',
        p_body: `An investor accepted your invitation to "${pendingInvite.room?.name ?? 'your deal room'}"`,
        p_action_url: `/dashboard/deal-rooms/${pendingInvite.room_id}`,
        p_payload: { room_id: pendingInvite.room_id, sub_room_id: subRoomId },
      })
    }

    await loadRooms()
    return true
  }, [user, pendingInvites, loadRooms])

  const declineInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    if (!user) return false
    const { data: invite } = await supabase
      .from('deal_room_invites')
      .select('room_id, founder_id, room:deal_rooms!room_id ( name )')
      .eq('id', inviteId)
      .maybeSingle()
    if (!invite) return false

    // room join may be null if RLS blocked it — use the already-loaded pending invite as fallback
    const roomName = (invite as any).room?.name
      ?? pendingInvites.find(i => i.id === inviteId)?.room?.name
      ?? 'the deal room'

    await supabase
      .from('deal_room_invites')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', inviteId)

    // Notify founder (cross-user — requires SECURITY DEFINER RPC)
    await supabase.rpc('send_notification', {
      p_user_id: invite.founder_id,
      p_type: 'deal_room_invite_declined',
      p_title: 'Invitation Declined',
      p_body: `An investor declined your invitation to "${roomName}"`,
      p_action_url: `/dashboard/deal-rooms/${invite.room_id}`,
      p_payload: { room_id: invite.room_id },
    })

    setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    return true
  }, [user, pendingInvites])

  const archiveOnPassed = useCallback(async (roomId: string) => {
    await supabase.from('deal_rooms').update({ status: 'archived' }).eq('id', roomId)
    await supabase.from('deal_room_members').update({ revoked_at: new Date().toISOString() }).eq('room_id', roomId)
    // Archive sub-rooms too
    await supabase.from('deal_rooms').update({ status: 'archived' }).eq('parent_room_id', roomId)
  }, [])

  const clearActiveRoom = useCallback(() => {
    activeRoomIdRef.current = null
    activeParentIdRef.current = null
    setSubRooms([])
    if (isFounder) setPendingInvites([])
  }, [isFounder])

  return {
    rooms,
    activeRooms,
    archivedRooms,
    documents,
    members,
    activity,
    milestones,
    messages,
    subRooms,
    pendingInvites,
    isLoading,
    error,
    loadRooms,
    loadRoomDetail,
    createRoom,
    updateRoom,
    deleteRoom,
    archiveRoom,
    restoreRoom,
    inviteMember,
    revokeMember,
    acceptInvite,
    declineInvite,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    downloadDocument,
    getWatermarkedPdfUrl,
    verifyRoomPin,
    setRoomPin,
    sendRoomPin,
    encryptDocumentNotes,
    decryptDocumentNotes,
    logDocumentView,
    logDocumentDownload,
    updateMilestone,
    sendMessage,
    loadMessages,
    clearActiveRoom,
    archiveOnPassed,
  }
}

/* ── Helper: create a sub-room for an investor ────────────────────── */

async function createSubRoom(
  parentRoomId: string,
  investorId: string,
  founderId: string,
  startupId: string,
  roomName: string,
) {
  // Check if sub-room already exists for this investor
  const { data: existing } = await supabase
    .from('deal_rooms')
    .select('id')
    .eq('parent_room_id', parentRoomId)
    .eq('founder_id', founderId)
    .limit(100)

  if (existing?.length) {
    // Check if any of these sub-rooms has this investor as a member
    const { data: existingMembers } = await supabase
      .from('deal_room_members')
      .select('room_id')
      .in('room_id', existing.map(e => e.id))
      .eq('user_id', investorId)
      .is('revoked_at', null)
    if (existingMembers?.length) return // already exists
  }

  // Create sub-room
  const { data: subRoom, error: err } = await supabase
    .from('deal_rooms')
    .insert({
      founder_id: founderId,
      startup_id: startupId,
      name: roomName,
      parent_room_id: parentRoomId,
    })
    .select()
    .single()
  if (err || !subRoom) return

  // Add founder as owner and investor as viewer
  await supabase.from('deal_room_members').upsert([
    { room_id: subRoom.id, user_id: founderId, role: 'owner' as const },
    { room_id: subRoom.id, user_id: investorId, role: 'viewer' as const },
  ], { onConflict: 'room_id,user_id' })

  // Also add investor to parent room for document RLS access
  await supabase.from('deal_room_members').upsert(
    { room_id: parentRoomId, user_id: investorId, role: 'viewer' as const },
    { onConflict: 'room_id,user_id' },
  )
}
