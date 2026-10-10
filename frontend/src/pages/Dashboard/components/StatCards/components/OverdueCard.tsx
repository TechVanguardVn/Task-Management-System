import { AlertTriangle } from 'lucide-react'

interface Props {
  overdueCount: number
}

export const OverdueCard = ({ overdueCount }: Props) => {
  return (
    <div className="group relative bg-rose-50/50 hover:bg-rose-50/70 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(225,29,72,0.08),0_1px_0_0_rgba(255,255,255,0.8)] border border-rose-100 transition-all hover:scale-[1.01] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
          <AlertTriangle size={24} />
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold tracking-tight shadow-sm">
          Immediate Action
        </span>
      </div>
      <div className="mt-6 flex flex-col">
        <span className="text-3xl font-bold text-rose-600 tracking-tight">{overdueCount}</span>
        <span className="text-sm text-rose-600 font-semibold mt-1">Overdue</span>
      </div>
      <div className="mt-4 w-full bg-rose-200 rounded-full h-1 overflow-hidden">
        <div className="bg-rose-500 h-full rounded-full shadow-[0_0_8px_rgba(225,29,72,0.6)] w-full"></div>
      </div>
    </div>
  )
}
