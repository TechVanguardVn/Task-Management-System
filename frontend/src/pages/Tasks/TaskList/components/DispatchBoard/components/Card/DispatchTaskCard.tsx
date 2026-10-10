import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/pages/Tasks/types/task.types'
import { CardHeader } from './CardHeader'
import { CardFooter } from './CardFooter'
import { CardTags } from './CardTags'
import { CardStatus } from './CardStatus'
import { CardLock } from './CardLock'

interface DispatchTaskCardUIProps {
  task: Task
  isDragging?: boolean
  isOverlay?: boolean
  style?: React.CSSProperties
  setNodeRef?: (node: HTMLElement | null) => void
  listeners?: Record<string, any>
  attributes?: Record<string, any>
}

export const DispatchTaskCardUI = ({ 
  task, 
  isDragging, 
  isOverlay,
  style, 
  setNodeRef, 
  listeners, 
  attributes 
}: DispatchTaskCardUIProps) => {
  
  const isLocked = task.status === 'IN_PROGRESS' || task.status === 'DONE'

  return (
    <div
      ref={!isLocked ? setNodeRef : undefined}
      style={style}
      {...(!isLocked ? listeners : {})}
      {...(!isLocked ? attributes : {})}
      className={`relative group bg-white/70 backdrop-blur-lg border rounded-xl p-3 shadow-[0_8px_20px_-4px_rgba(15,23,42,0.05),inset_0_1px_0_0_rgba(255,255,255,0.85)] transition-all ${
        isLocked ? 'cursor-not-allowed opacity-80 border-amber-200/60 bg-amber-50/20' : 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,1)]'
      } ${
        isOverlay ? 'shadow-[0_20px_40px_-8px_rgba(15,23,42,0.15),inset_0_1px_0_0_rgba(255,255,255,1)] ring-2 ring-indigo-500/50 rotate-2 opacity-100 z-[9999]' : ''
      } ${
        isDragging && !isOverlay ? 'opacity-40 border-dashed border-indigo-300' : (!isLocked ? 'border-white/60' : '')
      }`}
    >
      <CardLock isLocked={isLocked} />
      <CardHeader taskId={task._id} />
      
      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}
      
      <CardTags tags={task.tags} />

      <div className="flex items-center justify-between mt-auto">
        <CardStatus status={task.status} />
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100">
        <CardFooter priority={task.priority} dueDate={task.dueDate} />
      </div>
    </div>
  )
}

interface DispatchTaskCardProps {
  task: Task
}

export const DispatchTaskCard = ({ task }: DispatchTaskCardProps) => {
  const isLocked = task.status === 'IN_PROGRESS' || task.status === 'DONE'
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: task,
    disabled: isLocked
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  return (
    <DispatchTaskCardUI 
      task={task}
      isDragging={isDragging}
      style={style}
      setNodeRef={setNodeRef}
      listeners={listeners}
      attributes={attributes}
    />
  )
}
