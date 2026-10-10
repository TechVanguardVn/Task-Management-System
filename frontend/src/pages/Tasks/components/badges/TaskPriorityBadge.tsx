import { ArrowDown, ArrowUp, AlertTriangle, Equal } from 'lucide-react'

interface TaskPriorityBadgeProps {
  priority: string
}

export const TaskPriorityBadge = ({ priority }: TaskPriorityBadgeProps) => {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'URGENT': return { badge: 'bg-rose-50 text-rose-700', icon: <AlertTriangle size={13} className="text-rose-600" /> }
      case 'HIGH': return { badge: 'bg-orange-50 text-orange-700', icon: <ArrowUp size={13} className="text-orange-600" /> }
      case 'MEDIUM': return { badge: 'bg-indigo-50 text-indigo-700', icon: <Equal size={13} className="text-indigo-600" /> }
      case 'LOW': return { badge: 'bg-slate-50 text-slate-600', icon: <ArrowDown size={13} className="text-slate-500" /> }
      default: return { badge: 'bg-slate-50 text-slate-600', icon: <ArrowDown size={13} className="text-slate-500" /> }
    }
  }

  const styles = getPriorityStyles()

  return (
    <span className={`${styles.badge} text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-sm`}>
      {styles.icon}
      {priority}
    </span>
  )
}
