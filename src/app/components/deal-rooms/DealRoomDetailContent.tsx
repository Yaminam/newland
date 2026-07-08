import { useState, useEffect, useMemo } from 'react'
import {
  FileText, Users, Upload, Archive, RotateCcw, Clock, Shield, CalendarDays, Settings,
  ArrowLeft, FolderLock, Lock, CheckCircle2, Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/Button'
import { PillTabs } from '@/app/components/ui/PillTabs'
import { MILESTONE_STAGES } from '@/app/hooks/useDealRooms'
import { useAuth } from '@/app/context/AuthContext'
import { DocumentList } from './DocumentList'
import { DocumentUploadModal } from './DocumentUploadModal'
import { DocumentPreviewModal } from './DocumentPreviewModal'
import { MemberManagement } from './MemberManagement'
import { ActivityLog } from './ActivityLog'
import { MilestoneTracker } from './MilestoneTracker'
import { RoomChat } from './RoomChat'
import { EditRoomModal } from './EditRoomModal'
import type {
  DealRoom,
  DealRoomDocument,
  DealRoomMember,
  DealRoomActivity,
  DealRoomMilestone,
  DealRoomMessage,
  DealRoomInvite,
  DocumentCategory,
  SubRoomInfo,
} from '@/app/hooks/useDealRooms'

type Tab = 'documents' | 'milestones' | 'members' | 'chat' | 'activity'

export interface DealRoomDetailContentProps {
  room: DealRoom
  documents: DealRoomDocument[]
  members: DealRoomMember[]
  activity: DealRoomActivity[]
  milestones: DealRoomMilestone[]
  messages: DealRoomMessage[]
  subRooms: SubRoomInfo[]
  pendingInvites?: DealRoomInvite[]
  /** 'drawer' = compact (default), 'page' = full gradient-hero layout. */
  variant?: 'drawer' | 'page'
  /** Back navigation for the page variant breadcrumb. */
  onBack?: () => void
  /** Called when the room is archived/deleted and the view should close (drawer close or navigate back). */
  onClose: () => void
  onLoadDetail: (roomId: string) => void
  onLoadMessages: (roomId: string) => void
  onUpload: (roomId: string, category: DocumentCategory, file: File) => Promise<unknown>
  onDeleteDoc: (roomId: string, doc: DealRoomDocument) => Promise<boolean>
  onGetUrl: (filePath: string) => Promise<string | null>
  onLogView: (roomId: string, docId: string, fileName: string) => void
  onLogDownload: (roomId: string, docId: string, fileName: string) => void
  onInvite: (roomId: string, userId: string, userName?: string) => Promise<boolean>
  onRevoke: (roomId: string, userId: string, userName?: string) => Promise<boolean>
  onUpdate: (roomId: string, updates: { name?: string; description?: string | null }) => Promise<boolean>
  onDelete: (roomId: string) => Promise<boolean>
  onSetPin: (roomId: string, pin: string | null) => Promise<boolean>
  onArchive: (roomId: string) => Promise<boolean>
  onRestore: (roomId: string) => Promise<boolean>
  onUpdateMilestone: (milestoneId: string, roomId: string, updates: Partial<Pick<DealRoomMilestone, 'status' | 'notes'>>) => Promise<boolean>
  onSendMessage: (roomId: string, body: string) => Promise<DealRoomMessage | null>
  onDownloadBlob?: (filePath: string) => Promise<Blob | null>
  onEncryptNotes?: (docId: string, notes: string) => Promise<boolean>
  onDecryptNotes?: (docId: string) => Promise<string | null>
  onSendPin?: (roomId: string, pin: string) => Promise<{ success: boolean; sent?: number; error?: string }>
}

function stageLabel(stage: string): string {
  return MILESTONE_STAGES.find(s => s.value === stage)?.label ?? stage
}

function formatAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month' : `${months} months`
}

export function DealRoomDetailContent({
  room,
  documents,
  members,
  activity,
  milestones,
  messages,
  subRooms,
  pendingInvites,
  variant = 'drawer',
  onBack,
  onClose,
  onLoadDetail,
  onLoadMessages,
  onUpload,
  onDeleteDoc,
  onGetUrl,
  onLogView,
  onLogDownload,
  onInvite,
  onRevoke,
  onUpdate,
  onDelete,
  onSetPin,
  onArchive,
  onRestore,
  onUpdateMilestone,
  onSendMessage,
  onDownloadBlob,
  onEncryptNotes,
  onDecryptNotes,
  onSendPin,
}: DealRoomDetailContentProps) {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('documents')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DealRoomDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeChatSubRoom, setActiveChatSubRoom] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const isOwner = room.founder_id === user?.id
  const isFounder = profile?.role === 'founder'
  const isArchived = room.status === 'archived'
  const isParentRoom = !room.parent_room_id
  const isPage = variant === 'page'

  const activeMembers = useMemo(() => members.filter(m => !m.revoked_at), [members])
  const completedMilestones = useMemo(() => milestones.filter(m => m.status === 'completed'), [milestones])
  const activeMilestones = useMemo(() => milestones.filter(m => m.status !== 'skipped'), [milestones])

  useEffect(() => {
    onLoadDetail(room.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id])

  // Auto-select first sub-room for chat when sub-rooms load
  useEffect(() => {
    if (subRooms.length > 0 && !activeChatSubRoom) {
      setActiveChatSubRoom(subRooms[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subRooms])

  // Load messages when founder switches chat tab or sub-room
  useEffect(() => {
    if (tab === 'chat' && isFounder && isParentRoom && activeChatSubRoom) {
      onLoadMessages(activeChatSubRoom)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeChatSubRoom, isFounder, isParentRoom])

  const handleView = async (doc: DealRoomDocument) => {
    const url = await onGetUrl(doc.file_path)
    if (url) {
      setPreviewDoc(doc)
      setPreviewUrl(url)
      onLogView(room.id, doc.id, doc.file_name)
    } else {
      toast.error('Failed to generate link')
    }
  }

  const handleDownload = async (doc: DealRoomDocument) => {
    if (onDownloadBlob) {
      const blob = await onDownloadBlob(doc.file_path)
      if (blob) {
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = doc.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
        onLogDownload(room.id, doc.id, doc.file_name)
        return
      }
    }
    const url = await onGetUrl(doc.file_path)
    if (url) {
      window.open(url, '_blank')
      onLogDownload(room.id, doc.id, doc.file_name)
    } else {
      toast.error('Failed to generate download link')
    }
  }

  const handleDelete = async (doc: DealRoomDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    const ok = await onDeleteDoc(room.id, doc)
    if (ok) toast.success('Document deleted')
    else toast.error('Failed to delete')
  }

  const handleArchive = async () => {
    const ok = await onArchive(room.id)
    if (ok) {
      toast.success('Room archived')
      onClose()
    }
  }

  const handleRestore = async () => {
    const ok = await onRestore(room.id)
    if (ok) toast.success('Room restored')
  }

  const milestoneProgress = activeMilestones.length > 0
    ? Math.round((completedMilestones.length / activeMilestones.length) * 100)
    : 0

  // For founder: chat target is the active sub-room
  // For investor: chat target is their sub-room (the room itself)
  const chatRoomId = isFounder && isParentRoom
    ? activeChatSubRoom ?? ''
    : room.id

  // Member count for display (exclude the owner; union of sub-rooms + invited viewers)
  const nonOwnerActive = activeMembers.filter(m => m.role !== 'owner').length
  const displayMemberCount = isFounder && isParentRoom
    ? Math.max(subRooms.length, nonOwnerActive)
    : nonOwnerActive


  /* ── Shared pieces ──────────────────────────────────────────────── */

  const statItems = [
    { icon: FileText, label: 'Documents', value: documents.length, color: 'var(--blue)', bg: 'var(--blue-bg)' },
    { icon: Users, label: 'Members', value: displayMemberCount, color: 'var(--violet, #7C3AED)', bg: 'var(--violet-bg, #F3E8FF)' },
    {
      icon: Shield,
      label: 'Progress',
      value: `${milestoneProgress}%`,
      color: milestoneProgress === 100 ? 'var(--pos)' : 'var(--amber, #D97706)',
      bg: milestoneProgress === 100 ? 'var(--pos-bg)' : 'var(--amber-bg, #FFFBEB)',
    },
    { icon: CalendarDays, label: 'Age', value: formatAge(room.created_at), color: 'var(--muted)', bg: 'var(--surface-2)' },
  ]

  const tabsEl = (
    <PillTabs
      value={tab}
      options={[
        { value: 'documents' as Tab, label: `Docs${documents.length ? ` (${documents.length})` : ''}` },
        { value: 'milestones' as Tab, label: 'Milestones' },
        { value: 'members' as Tab, label: `Members${displayMemberCount ? ` (${displayMemberCount})` : ''}` },
        { value: 'chat' as Tab, label: 'Chat' },
        { value: 'activity' as Tab, label: 'Activity' },
      ]}
      onChange={setTab}
    />
  )

  const tabContentEl = (
    <>
      {tab === 'documents' && (
        <DocumentList
          documents={documents}
          isOwner={isOwner}
          onView={handleView}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onEncrypt={onEncryptNotes ? (doc) => {
            const notes = prompt('Enter notes to encrypt:')
            if (notes) onEncryptNotes(doc.id, notes).then(ok => {
              if (ok) { toast.success('Notes encrypted'); onLoadDetail(room.id) }
              else toast.error('Encryption failed')
            })
          } : undefined}
          onDecrypt={onDecryptNotes ? (doc) => {
            onDecryptNotes(doc.id).then(text => {
              if (text) toast.info(`Decrypted notes: ${text}`)
              else toast.error('No encrypted notes or decryption failed')
            })
          } : undefined}
        />
      )}

      {tab === 'milestones' && (
        <MilestoneTracker
          milestones={milestones}
          roomId={room.id}
          isOwner={isOwner}
          onUpdate={onUpdateMilestone}
        />
      )}

      {tab === 'members' && (
        <MemberManagement
          members={members}
          subRooms={isFounder && isParentRoom ? subRooms : undefined}
          pendingInvites={isFounder && isParentRoom ? pendingInvites : undefined}
          isOwner={isOwner && !isArchived}
          hasPin={room.has_pin}
          onInvite={(userId, userName) => onInvite(room.id, userId, userName)}
          onRevoke={(userId, userName) => onRevoke(room.id, userId, userName)}
          onSendPin={onSendPin ? (pin) => onSendPin(room.id, pin) : undefined}
        />
      )}

      {tab === 'chat' && (
        <div className="flex flex-col gap-3">
          {/* Founder: show investor tabs */}
          {isFounder && isParentRoom && subRooms.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {subRooms.map(sub => {
                const isActive = activeChatSubRoom === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveChatSubRoom(sub.id)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold shrink-0 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'var(--blue)' : 'var(--surface-2)',
                      color: isActive ? '#fff' : 'var(--muted)',
                      border: `1px solid ${isActive ? 'var(--blue)' : 'var(--line)'}`,
                    }}
                  >
                    {sub.investor_avatar ? (
                      <img src={sub.investor_avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--blue-bg)',
                          color: isActive ? '#fff' : 'var(--blue)',
                        }}
                      >
                        {(sub.investor_name ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                    {sub.investor_name?.split(' ')[0] ?? 'Investor'}
                  </button>
                )
              })}
            </div>
          )}

          {/* Empty state when founder has no investors yet */}
          {isFounder && isParentRoom && subRooms.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
                Invite investors to start chatting
              </p>
            </div>
          )}

          {/* Chat component */}
          {chatRoomId && (
            <RoomChat
              messages={messages}
              roomId={chatRoomId}
              onSend={onSendMessage}
            />
          )}
        </div>
      )}

      {tab === 'activity' && (
        <ActivityLog activity={activity} />
      )}
    </>
  )

  const modalsEl = (
    <>
      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(category, file) => onUpload(room.id, category, file)}
      />
      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => { setPreviewDoc(null); setPreviewUrl(null) }}
        url={previewUrl}
        fileName={previewDoc?.file_name ?? ''}
        mimeType={previewDoc?.mime_type ?? null}
        onDownload={() => previewDoc && handleDownload(previewDoc)}
      />
      <EditRoomModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        room={room}
        onUpdate={async (id, updates) => {
          const ok = await onUpdate(id, updates)
          if (ok) { toast.success('Room updated'); onLoadDetail(room.id) }
          return ok
        }}
        onSetPin={async (id, pin) => {
          const ok = await onSetPin(id, pin)
          if (ok) { toast.success(pin ? 'PIN updated' : 'PIN removed'); onLoadDetail(room.id) }
          return ok
        }}
        onDelete={async (id) => {
          const ok = await onDelete(id)
          if (ok) { toast.success('Room deleted'); onClose() }
          return ok
        }}
      />
    </>
  )

  const description = room.description && (
    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
      {room.description}
    </p>
  )

  const archivedBanner = isArchived && (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-md)]"
      style={{ background: 'var(--neg-bg, #FEF2F2)', border: '1px solid var(--neg-line, #FCA5A5)' }}
    >
      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
      <span className="text-[12px] font-semibold" style={{ color: 'var(--neg)' }}>This room is archived</span>
    </div>
  )

  /* ── PAGE VARIANT — gradient hero workspace ─────────────────────── */
  if (isPage) {
    return (
      <>
        {/* Hero */}
        <div className="hero-gradient" style={{ padding: '16px 22px 18px', marginBottom: 14 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4" style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.07em' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Deal Rooms
            </button>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>/</span>
            <span className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 260 }}>
              {room.name}
            </span>
          </div>

          {/* Identity + actions */}
          <div className="flex items-start justify-between gap-4 flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}
              >
                {isArchived
                  ? <Archive className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.8)' }} />
                  : <FolderLock className="w-6 h-6" style={{ color: '#fff' }} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[24px] font-bold leading-tight truncate" style={{ color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                    {room.name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                    style={
                      isArchived
                        ? { background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)' }
                        : { background: 'rgba(34,197,94,0.22)', color: '#86EFAC' }
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isArchived ? 'rgba(255,255,255,0.6)' : '#4ADE80' }} />
                    {isArchived ? 'Archived' : 'Active'}
                  </span>
                  {room.has_pin && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(245,158,11,0.22)', color: '#FCD34D' }}
                    >
                      <Lock className="w-2.5 h-2.5" /> PIN
                    </span>
                  )}
                </div>
                {room.startup?.company_name && (
                  <p className="text-[13px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {room.startup.company_name}
                  </p>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
                >
                  <Settings className="w-3.5 h-3.5" /> Settings
                </button>
                {isArchived ? (
                  <button
                    onClick={handleRestore}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                ) : (
                  <button
                    onClick={handleArchive}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                )}
                {!isArchived && (
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold cursor-pointer transition-all active:scale-[0.97]"
                    style={{ background: '#fff', color: '#0D1B2A' }}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Two-column workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* Main */}
          <div
            style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }}
            className="p-4 min-w-0 self-start"
          >
            {(archivedBanner || description) && (
              <div className="flex flex-col gap-3 mb-3">
                {archivedBanner}
                {description}
              </div>
            )}
            {tabsEl}
            <div className="mt-4">
              {tabContentEl}
            </div>
          </div>

          {/* Summary sidebar */}
          <aside className="space-y-4">
            {/* Deal progress */}
            <div
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center"
                    style={{ background: milestoneProgress === 100 ? 'var(--pos-bg, #F0FDF4)' : 'var(--blue-bg)' }}
                  >
                    <Shield className="w-4 h-4" style={{ color: milestoneProgress === 100 ? 'var(--pos)' : 'var(--blue)' }} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Deal Progress</p>
                </div>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: milestoneProgress === 100 ? 'var(--pos)' : 'var(--blue)' }}>
                  {milestoneProgress}%
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3.5" style={{ background: 'var(--surface-3)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${milestoneProgress}%`, background: milestoneProgress === 100 ? 'var(--pos)' : 'var(--blue)' }}
                />
              </div>
              {milestones.length === 0 ? (
                <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>No milestones yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {[...milestones].sort((a, b) => a.position - b.position).map(m => {
                    const done = m.status === 'completed'
                    const inProg = m.status === 'in_progress'
                    const skipped = m.status === 'skipped'
                    return (
                      <li key={m.id} className="flex items-center gap-2.5 text-[12px]">
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--pos)' }} />
                        ) : (
                          <Circle className="w-4 h-4 shrink-0" style={{ color: inProg ? 'var(--blue)' : 'var(--faint)' }} />
                        )}
                        <span style={{ color: done ? 'var(--muted-2)' : 'var(--ink)', textDecoration: skipped ? 'line-through' : 'none' }}>
                          {stageLabel(m.stage)}
                        </span>
                        {inProg && (
                          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                            In progress
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Room details */}
            <div
              style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }}
              className="p-4"
            >
              <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>Room Details</p>
              <dl className="space-y-2.5 text-[12px]">
                {[
                  { icon: Shield, label: 'Status', value: isArchived ? 'Archived' : 'Active' },
                  { icon: CalendarDays, label: 'Created', value: new Date(room.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                  { icon: FileText, label: 'Documents', value: String(documents.length) },
                  { icon: Users, label: 'Members', value: String(displayMemberCount) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2" style={{ color: 'var(--muted-2)' }}>
                      <row.icon className="w-3.5 h-3.5" />
                      {row.label}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{row.value}</span>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        {modalsEl}
      </>
    )
  }

  /* ── DRAWER VARIANT — compact (default) ─────────────────────────── */
  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Owner action toolbar */}
        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" iconLeft={Settings} onClick={() => setEditOpen(true)}>
              Settings
            </Button>
            {isArchived ? (
              <Button variant="secondary" size="sm" iconLeft={RotateCcw} onClick={handleRestore}>
                Restore
              </Button>
            ) : (
              <Button variant="secondary" size="sm" iconLeft={Archive} onClick={handleArchive}>
                Archive
              </Button>
            )}
            {!isArchived && (
              <Button variant="primary" size="sm" iconLeft={Upload} onClick={() => setUploadOpen(true)} className="ml-auto">
                Upload Document
              </Button>
            )}
          </div>
        )}

        {/* Status strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-[var(--r-lg)] overflow-hidden" style={{ background: 'var(--line)' }}>
          {statItems.map(stat => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-3 px-2 gap-1"
              style={{ background: 'var(--surface)' }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
              <span className="text-[14px] font-bold leading-none" style={{ color: 'var(--ink)' }}>{stat.value}</span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--muted-2)' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {description && <div className="-mt-2">{description}</div>}
        {archivedBanner}

        {tabsEl}
        {tabContentEl}
      </div>

      {modalsEl}
    </>
  )
}
