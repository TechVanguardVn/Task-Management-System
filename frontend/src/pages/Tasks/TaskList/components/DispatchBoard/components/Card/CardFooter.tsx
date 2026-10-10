import { Clock } from 'lucide-react'
import { getPriorityColor } from '../../utils/dispatch.utils'

interface CardFooterProps {
  priority: string
  dueDate?: string
}

export const CardFooter = ({ priority, dueDate }: CardFooterProps) => {
  return (
    <div className="flex items-center justify-between mt-auto">
      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(priority)}`}>
        {priority}
      </div>
      
      {dueDate && (
        <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
          <Clock size={12} />
          <span>Dec 24</span>
        </div>
      )}
    </div>
  )
}
