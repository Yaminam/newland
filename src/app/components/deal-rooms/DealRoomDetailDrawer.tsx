import { Drawer } from '@/app/components/ui/Drawer'
import { DealRoomDetailContent, type DealRoomDetailContentProps } from './DealRoomDetailContent'
import type { DealRoom } from '@/app/hooks/useDealRooms'

interface Props extends Omit<DealRoomDetailContentProps, 'room' | 'onClose'> {
  room: DealRoom | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Thin Drawer wrapper around the shared DealRoomDetailContent.
 * The full-page route (DealRoomDetailPage) renders the same content
 * without the Drawer chrome.
 */
export function DealRoomDetailDrawer({ room, open, onOpenChange, ...content }: Props) {
  if (!room) return null
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={room.name}
      subtitle={room.startup?.company_name ?? undefined}
      size="lg"
      showBack
    >
      {open && (
        <DealRoomDetailContent
          room={room}
          onClose={() => onOpenChange(false)}
          {...content}
        />
      )}
    </Drawer>
  )
}
