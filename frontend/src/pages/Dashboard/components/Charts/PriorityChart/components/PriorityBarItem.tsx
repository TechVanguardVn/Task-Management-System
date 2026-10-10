interface Props {
  label: string
  count: number
  percentage: number
  colorClass: string
  gradientClass: string
}

export const PriorityBarItem = ({ label, count, percentage, colorClass, gradientClass }: Props) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
          <span className="text-sm text-slate-900 font-semibold">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-[18px] font-bold ${colorClass.replace('bg-', 'text-')}`}>{count}</span>
          <span className="text-sm text-slate-500">tasks ({Math.round(percentage)}%)</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-xl h-4 p-0.5 overflow-hidden">
        <div className={`h-full rounded-lg transition-all duration-700 ${gradientClass}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
