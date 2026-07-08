import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import { PipelineCard } from './PipelineCard'
import type { PipelineStage, PipelineDeal } from '@/app/hooks/usePipeline'
import { formatCurrency } from '@/app/lib/utils'

interface KanbanBoardProps {
  stages: PipelineStage[]
  grouped: Record<string, PipelineDeal[]>
  onMoveDeal: (dealId: string, newStageId: string, newStageName: string) => void
  onCardClick: (deal: PipelineDeal) => void
  onAddDeal?: () => void
}

export function KanbanBoard({
  stages,
  grouped,
  onMoveDeal,
  onCardClick,
  onAddDeal,
}: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const dealId = result.draggableId
    const newStageId = result.destination.droppableId
    const stage = stages.find(s => s.id === newStageId)
    if (!stage) return
    if (result.source.droppableId === newStageId) return
    onMoveDeal(dealId, newStageId, stage.name)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3.5 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {stages.map(stage => {
          const deals = grouped[stage.id] ?? []
          const stageValue = deals.reduce((sum, d) => sum + (d.amount_usd ?? 0), 0)
          return (
            <div
              key={stage.id}
              className="flex flex-col shrink-0 rounded-[var(--r-lg)]"
              style={{
                width: 290,
                minWidth: 290,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
              }}
            >
              {/* Column header */}
              <div className="px-3.5 py-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: stage.color }}
                  />
                  <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: 'var(--ink)' }}>
                    {stage.name}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
                  >
                    {deals.length}
                  </span>
                </div>
                {stageValue > 0 && (
                  <p
                    className="text-[11px] font-medium mt-1 ml-[18px]"
                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-num)' }}
                  >
                    {formatCurrency(stageValue)}
                  </p>
                )}
              </div>

              {/* Droppable area */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 overflow-y-auto transition-colors"
                    style={{
                      minHeight: 80,
                      background: snapshot.isDraggingOver
                        ? 'rgba(37, 99, 235, 0.04)'
                        : undefined,
                      borderRadius: snapshot.isDraggingOver ? '0 0 var(--r-lg) var(--r-lg)' : undefined,
                    }}
                  >
                    {deals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <PipelineCard
                              deal={deal}
                              onClick={() => onCardClick(deal)}
                              isDragging={dragSnapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Empty state hint */}
                    {deals.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8">
                        <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>
                          Drop deals here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add deal button on first stage only */}
              {stage.position === 0 && onAddDeal && (
                <button
                  onClick={onAddDeal}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-t border-[var(--line)] transition-colors hover:bg-[var(--surface-3)] cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add startup
                </button>
              )}
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
