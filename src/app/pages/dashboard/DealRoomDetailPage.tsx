import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FolderLock, Lock } from 'lucide-react'
import { SEO } from '@/app/components/SEO'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PinGateModal } from '@/app/components/deal-rooms/PinGateModal'
import { DealRoomDetailContent } from '@/app/components/deal-rooms/DealRoomDetailContent'
import { useDealRooms } from '@/app/hooks/useDealRooms'

const BACK_PATH = '/dashboard/deal-rooms'
const PIN_TTL_MS = 10 * 60 * 1000 // 10 minutes

export function DealRoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dr = useDealRooms()
  const { rooms, isLoading } = dr

  const room = useMemo(() => rooms.find(r => r.id === id) ?? null, [rooms, id])

  // Always start locked — PIN required on every visit
  const [unlocked, setUnlocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const needsPin = !!room?.has_pin && !unlocked

  const goBack = () => navigate(BACK_PATH)

  // Clear active room on unmount
  useEffect(() => {
    return () => { dr.clearActiveRoom() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-lock after 10 minutes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (unlocked) {
      timerRef.current = setTimeout(() => setUnlocked(false), PIN_TTL_MS)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [unlocked])

  const handleVerify = async (pin: string): Promise<boolean> => {
    if (!room) return false
    const ok = await dr.verifyRoomPin(room.id, pin)
    if (ok) setUnlocked(true)
    return ok
  }

  /* ── Loading ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={150} className="mb-4" />
        <SkeletonBlock height={360} />
      </div>
    )
  }

  /* ── Not found ───────────────────────────────────────────── */
  if (!room) {
    return (
      <>
        <SEO title="Deal Room" />
        <EmptyState
          icon={<FolderLock className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
          title="Deal room not found"
          description="This room may have been removed, archived, or you no longer have access."
          action={{ label: 'Back to Deal Rooms', onClick: goBack }}
        />
      </>
    )
  }

  /* ── PIN gate ────────────────────────────────────────────── */
  if (needsPin) {
    return (
      <>
        <SEO title={room.name} />
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 mb-5 text-[12px] font-semibold cursor-pointer transition-colors hover:text-[var(--blue)]"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal Rooms
        </button>
        <div
          className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-[16px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--warn-bg, #FFFBEB)' }}>
            <Lock className="w-6 h-6" style={{ color: 'var(--warn, #D97706)' }} />
          </div>
          <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--ink)' }}>
            This room is PIN-protected
          </p>
          <p className="text-[13px] mb-5 max-w-sm" style={{ color: 'var(--muted-2)' }}>
            Enter the access PIN to view documents, milestones, and members.
          </p>
        </div>
        <PinGateModal open onClose={goBack} onVerify={handleVerify} roomName={room.name} />
      </>
    )
  }

  /* ── Room workspace ──────────────────────────────────────── */
  return (
    <>
      <SEO title={room.name} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <DealRoomDetailContent
          room={room}
          variant="page"
          onBack={goBack}
          documents={dr.documents}
          members={dr.members}
          activity={dr.activity}
          milestones={dr.milestones}
          messages={dr.messages}
          subRooms={dr.subRooms}
          pendingInvites={dr.pendingInvites}
          onClose={goBack}
          onLoadDetail={dr.loadRoomDetail}
          onLoadMessages={dr.loadMessages}
          onUpload={dr.uploadDocument}
          onDeleteDoc={dr.deleteDocument}
          onGetUrl={dr.getDocumentUrl}
          onDownloadBlob={dr.downloadDocument}
          onLogView={dr.logDocumentView}
          onLogDownload={dr.logDocumentDownload}
          onInvite={dr.inviteMember}
          onRevoke={dr.revokeMember}
          onUpdate={dr.updateRoom}
          onDelete={dr.deleteRoom}
          onSetPin={dr.setRoomPin}
          onArchive={dr.archiveRoom}
          onRestore={dr.restoreRoom}
          onUpdateMilestone={dr.updateMilestone}
          onSendMessage={dr.sendMessage}
          onEncryptNotes={dr.encryptDocumentNotes}
          onDecryptNotes={dr.decryptDocumentNotes}
          onSendPin={dr.sendRoomPin}
        />
      </motion.div>
    </>
  )
}
