interface TaskStatusBadgeProps {
  status: string
}

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'TODO': return { badge: 'bg-slate-50 text-slate-800', dot: 'bg-slate-400', label: 'To Do' }
      case 'IN_PROGRESS': return { badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]', label: 'In Progress' }
      case 'DONE': return { badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]', label: 'Done' }
      default: return { badge: 'bg-slate-50 text-slate-800', dot: 'bg-slate-400', label: 'To Do' }
    }
  }

  const styles = getStatusStyles()

  return (
    <span className={`${styles.badge} text-xs font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
      {styles.label}
    </span>
  )
}
