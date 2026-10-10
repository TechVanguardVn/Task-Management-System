import { useDroppable } from '@dnd-kit/core'
import type { Task } from '@/pages/Tasks/types/task.types'
import { DispatchTaskCard } from '../Card/DispatchTaskCard'
import { BacklogHeader } from './BacklogHeader'
import { BacklogEmpty } from './BacklogEmpty'
import { DND_IDENTIFIERS } from '../../constants/dispatch.constants'

interface BacklogPaneProps {
  tasks: Task[]
}

export const BacklogPane = ({ tasks }: BacklogPaneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: DND_IDENTIFIERS.UNASSIGNED,
  })

  return (
    <div className="flex flex-col h-full bg-slate-50/40 backdrop-blur-3xl border-r border-white/60 w-80 shrink-0 shadow-[12px_0_32px_-12px_rgba(15,23,42,0.05)] z-10 relative">
      <BacklogHeader count={tasks.length} />

      <div 
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto p-4 flex flex-col gap-3 transition-colors ${
          isOver ? 'bg-indigo-100/40 ring-2 ring-inset ring-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : ''
        }`}
      >
        {tasks.map(task => (
          <DispatchTaskCard key={task._id} task={task} />
        ))}
        
        {tasks.length === 0 && <BacklogEmpty />}
      </div>
    </div>
  )
}
