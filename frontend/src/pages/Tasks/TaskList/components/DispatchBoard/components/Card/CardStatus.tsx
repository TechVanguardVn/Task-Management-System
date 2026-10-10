interface CardStatusProps {
  status: string
}

export const CardStatus = ({ status }: CardStatusProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'TODO':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
