import { MoreHorizontal } from 'lucide-react'
import { formatShortId } from '../../utils/dispatch.utils'

interface CardHeaderProps {
  taskId: string
}

export const CardHeader = ({ taskId }: CardHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-2 mb-2">
      <span className="text-xs font-semibold text-slate-400">
        {formatShortId(taskId)}
      </span>
      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={14} />
      </button>
    </div>
  )
}
