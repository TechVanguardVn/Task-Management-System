import { Inbox } from 'lucide-react'

interface BacklogHeaderProps {
  count: number
}

export const BacklogHeader = ({ count }: BacklogHeaderProps) => {
  return (
    <div className="p-4 border-b border-white/60 bg-white/40">
      <h3 className="font-bold text-slate-900 flex items-center gap-2">
        <Inbox size={18} className="text-indigo-500" />
        Unassigned Backlog
        <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      </h3>
      <p className="text-xs text-slate-500 mt-1">Drag tasks to assign</p>
    </div>
  )
}
