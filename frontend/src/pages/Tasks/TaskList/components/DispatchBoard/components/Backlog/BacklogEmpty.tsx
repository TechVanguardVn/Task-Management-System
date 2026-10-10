import { Inbox } from 'lucide-react'

export const BacklogEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2 border-2 border-dashed border-slate-200 rounded-xl">
      <Inbox size={24} className="opacity-50" />
      <span className="text-sm font-medium">No tasks in backlog</span>
    </div>
  )
}
