import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import { FolderLock, Plus, Clock, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useDealRooms, type DealRoom } from '@/app/hooks/useDealRooms'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { useAuth } from '@/app/context/AuthContext'
import { DealRoomCard } from '@/app/components/deal-rooms/DealRoomCard'
import { CreateRoomModal } from '@/app/components/deal-rooms/CreateRoomModal'


type ViewFilter = 'active' | 'archived'

export function DealRoomPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const {
    rooms,
    activeRooms,
    archivedRooms,
    pendingInvites,
    isLoading,
    createRoom,
    acceptInvite,
    declineInvite,
  } = useDealRooms()

  const [filter, setFilter] = useState<ViewFilter>('active')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const isFounder = profile?.role === 'founder'

  const displayRooms = filter === 'active' ? activeRooms : archivedRooms

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return displayRooms
    const q = search.toLowerCase()
    return displayRooms.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.startup?.company_name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q),
    )
  }, [displayRooms, search])

  const openRoom = useCallback((roomId: string) => {
    navigate(`/dashboard/deal-rooms/${roomId}`)
  }, [navigate])

  // PIN is handled entirely inside DealRoomDetailPage — navigate directly
  const handleCardClick = useCallback((room: DealRoom) => {
    openRoom(room.id)
  }, [openRoom])

  const handleCreate = async (name: string, description?: string, pin?: string) => {
    const room = await createRoom(name, description, pin)
    if (room) {
      toast.success('Deal room created')
      return room
    }
    toast.error('Failed to create room')
    return null
  }

  const handleAccept = async (inviteId: string) => {
    const ok = await acceptInvite(inviteId)
    if (ok) toast.success('You joined the deal room')
    else toast.error('Failed to accept invitation')
  }

  const handleDecline = async (inviteId: string) => {
    const ok = await declineInvite(inviteId)
    if (ok) toast.success('Invitation declined')
    else toast.error('Failed to decline invitation')
  }

  const totalDocs = useMemo(() =>
    rooms.reduce((sum, r) => sum + (r.document_count ?? 0), 0),
  [rooms])

  const totalMembers = useMemo(() =>
    rooms.reduce((sum, r) => sum + (r.member_count ?? 0), 0),
  [rooms])

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={160} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBlock key={i} height={170} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Deal Rooms" />

      <HeroSection
        eyebrow="Deal Rooms"
        title="Secure Collaboration"
        subtitle="Share documents, track milestones, and communicate with investors in encrypted deal rooms."
        stats={[
          { label: 'Active', value: activeRooms.length },
          { label: 'Archived', value: archivedRooms.length },
          { label: 'Documents', value: totalDocs },
          { label: 'Members', value: totalMembers },
        ]}
      >
        {isFounder && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] mt-1"
            style={{
              background: 'rgba(255,255,255,0.90)',
              color: '#1e293b',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Room
          </button>
        )}
      </HeroSection>

      {/* Pending invitations — investor only */}
      {!isFounder && pendingInvites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6 px-1"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: 'var(--warn, #D97706)' }} />
            <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>
              Pending Invitations
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--warn-bg, #FFFBEB)', color: 'var(--warn, #D97706)' }}
            >
              {pendingInvites.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingInvites.map(invite => (
              <div
                key={invite.id}
                className="flex items-center gap-3 p-3.5 rounded-[14px] border"
                style={{ background: 'var(--surface)', borderColor: 'var(--warn-bg, #FEF3C7)' }}
              >
                {invite.founder?.avatar_url ? (
                  <img src={invite.founder.avatar_url} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                  >
                    {(invite.room?.name ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                    {invite.room?.name ?? 'Deal Room'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                    Invited by {invite.founder?.full_name ?? 'Founder'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAccept(invite.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--pos-bg, #F0FDF4)', color: 'var(--pos)' }}
                  >
                    <Check className="w-3 h-3" /> Accept
                  </button>
                  <button
                    onClick={() => handleDecline(invite.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--neg-bg, #FEF2F2)', color: 'var(--neg)' }}
                  >
                    <X className="w-3 h-3" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex items-center gap-3 mb-5 flex-wrap px-1"
      >
        <div
          className="inline-flex items-center gap-1 p-1 rounded-[10px]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          {(['active', 'archived'] as ViewFilter[]).map(f => {
            const active = filter === f
            const count = f === 'active' ? activeRooms.length : archivedRooms.length
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all capitalize"
                style={{
                  background: active ? 'var(--blue)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                }}
              >
                {f}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(255,255,255,0.20)' : 'var(--surface-3)',
                    color: active ? '#fff' : 'var(--muted-2)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0 sm:max-w-[280px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search rooms…"
            className="w-full"
            resultCount={search ? filteredRooms.length : undefined}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="px-1"
      >
        {rooms.length === 0 ? (
          <EmptyState
            icon={<FolderLock className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
            title="No deal rooms yet"
            description={
              isFounder
                ? 'Create a deal room to securely share documents with investors during fundraising.'
                : pendingInvites.length > 0
                  ? 'Accept a pending invitation above to enter your first deal room.'
                  : 'You\'ll see deal rooms here when a founder invites you to one.'
            }
            action={
              isFounder
                ? { label: 'Create Room', onClick: () => setCreateOpen(true) }
                : undefined
            }
          />
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            icon={<FolderLock className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
            title="No matching rooms"
            description="Try adjusting your search."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
              >
                <DealRoomCard room={room} onClick={() => handleCardClick(room)} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

    </>
  )
}
