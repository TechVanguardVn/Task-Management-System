import { DndContext, useSensor, useSensors, PointerSensor, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { BacklogPane } from './components/Backlog/BacklogPane'
import { ResourcePane } from './components/Resource/ResourcePane'
import { useDispatchLogic } from './hooks/useDispatchLogic'
import { DispatchTaskCardUI } from './components/Card/DispatchTaskCard'

export const DispatchBoard = ({ workspaceId }: { workspaceId: string }) => {
  const {
    unassignedTasks,
    memberTasks,
    members,
    activeTask,
    handleDragStart,
    handleDragEnd
  } = useDispatchLogic(workspaceId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  return (
    <div className="flex h-full w-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <BacklogPane tasks={unassignedTasks} />
        <ResourcePane members={members} memberTasks={memberTasks} />

        <DragOverlay 
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({ 
              styles: { active: { opacity: '0.4' } } 
            }),
          }}
        >
          {activeTask ? (
            <DispatchTaskCardUI 
              task={activeTask} 
              isOverlay={true}
              style={{ cursor: 'grabbing' }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
