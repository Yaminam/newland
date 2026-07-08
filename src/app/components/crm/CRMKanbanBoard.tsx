import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { CRMContactCard } from './CRMContactCard'
import { CRM_STAGES, type CRMContact, type CRMStageKey } from '@/app/hooks/useCRM'

interface CRMKanbanBoardProps {
  grouped: Record<string, CRMContact[]>
  stageCounts: Record<string, number>
  onMoveStage: (contactId: string, newStage: CRMStageKey) => void
  onCardClick: (contact: CRMContact) => void
  onAddContact?: () => void
}

export function CRMKanbanBoard({
  grouped,
  stageCounts,
  onMoveStage,
  onCardClick,
  onAddContact,
}: CRMKanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const contactId = result.draggableId
    const newStage = result.destination.droppableId as CRMStageKey
    if (result.source.droppableId === newStage) return
    onMoveStage(contactId, newStage)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1" style={{ minHeight: 420 }}>
        {CRM_STAGES.map((stage, idx) => {
          const contacts = grouped[stage.key] ?? []
          return (
            <div
              key={stage.key}
              className="flex flex-col shrink-0"
              style={{
                width: 264,
                minWidth: 264,
                borderRadius: 16,
                background: 'var(--surface-2)',
              }}
            >
              {/* Column header */}
              <div className="flex items-center gap-2.5 px-4 py-3.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: stage.color }}
                />
                <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  {stage.label}
                </span>
                <span
                  className="text-[11px] font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-[6px]"
                  style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
                >
                  {stageCounts[stage.key] ?? contacts.length}
                </span>
              </div>

              {/* Hairline divider */}
              <div className="mx-3" style={{ height: 1, background: 'var(--line-2)' }} />

              {/* Droppable area */}
              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 overflow-y-auto transition-colors"
                    style={{
                      minHeight: 80,
                      borderRadius: '0 0 16px 16px',
                      background: snapshot.isDraggingOver
                        ? `${stage.color}06`
                        : undefined,
                    }}
                  >
                    {contacts.map((contact, index) => (
                      <Draggable key={contact.id} draggableId={contact.id} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <CRMContactCard
                              contact={contact}
                              onClick={() => onCardClick(contact)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {contacts.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8">
                        <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>
                          Drop contacts here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add contact button on first column */}
              {idx === 0 && onAddContact && (
                <>
                  <div className="mx-3" style={{ height: 1, background: 'var(--line-2)' }} />
                  <button
                    onClick={onAddContact}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold transition-colors hover:bg-[var(--surface-3)] cursor-pointer active:scale-[0.98]"
                    style={{
                      color: 'var(--blue)',
                      borderRadius: '0 0 16px 16px',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add investor
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
