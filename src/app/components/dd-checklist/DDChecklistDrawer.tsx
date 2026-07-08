import { Drawer } from '@/app/components/ui/Drawer'
import { DDChecklistDetailContent, type DDChecklistDetailContentProps } from './DDChecklistDetailContent'
import type { DDChecklist } from '@/app/hooks/useDDChecklists'

interface Props extends Omit<DDChecklistDetailContentProps, 'checklist' | 'variant' | 'onBack' | 'onClose'> {
  checklist: DDChecklist | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Thin Drawer wrapper around the shared DDChecklistDetailContent.
 * The full-page route (DDChecklistDetailPage) renders the same content
 * with variant="page".
 */
export function DDChecklistDrawer({ checklist, open, onOpenChange, ...content }: Props) {
  if (!checklist) return null
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={checklist.name}
      subtitle={checklist.startup?.company_name ?? undefined}
      size="lg"
    >
      {open && (
        <DDChecklistDetailContent
          checklist={checklist}
          onClose={() => onOpenChange(false)}
          {...content}
        />
      )}
    </Drawer>
  )
}
