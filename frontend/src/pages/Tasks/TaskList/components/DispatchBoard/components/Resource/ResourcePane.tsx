import type { Task } from '@/pages/Tasks/types/task.types'
import type { WorkspaceMember } from '../../types/dispatch.types'
import { ResourceHeader } from './ResourceHeader'
import { MemberLane } from './MemberLane'

interface ResourcePaneProps {
  members: WorkspaceMember[]
  memberTasks: Record<string, Task[]>
}

export const ResourcePane = ({ members, memberTasks }: ResourcePaneProps) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/40">
      <ResourceHeader />
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden bg-slate-100/30">
        <div className="flex gap-6 h-full items-start">
          {members.map(member => (
            <MemberLane 
              key={member.id} 
              member={member} 
              tasks={memberTasks[member.id] || []} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}
