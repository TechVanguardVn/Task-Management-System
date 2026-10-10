import { useDroppable } from '@dnd-kit/core'
import type { Task } from '@/pages/Tasks/types/task.types'
import type { WorkspaceMember } from '../../types/dispatch.types'
import { DispatchTaskCard } from '../Card/DispatchTaskCard'
import { MemberAvatar } from './MemberAvatar'

interface MemberLaneProps {
  member: WorkspaceMember
  tasks: Task[]
}

export const MemberLane = ({ member, tasks }: MemberLaneProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: member.id,
  })

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-slate-100/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.8)] overflow-hidden">
      <div className="p-4 bg-white/50 border-b border-white/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MemberAvatar name={member.name} avatarUrl={member.avatar} />
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
            <p className="text-xs text-slate-500 font-medium">{member.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl font-black text-slate-700 leading-none">{tasks.length}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 flex flex-col gap-3 overflow-y-auto transition-colors min-h-[300px] ${
          isOver ? 'bg-indigo-100/40 ring-2 ring-inset ring-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : ''
        }`}
      >
        {tasks.map(task => (
          <DispatchTaskCard key={task._id} task={task} />
        ))}
        
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4 py-6 border-2 border-dashed border-slate-200 rounded-xl w-full">
              <span className="text-sm font-medium text-slate-400">Drop tasks here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
