import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmModalHeaderProps {
  title: string
  type?: 'primary' | 'danger'
}

export const ConfirmModalHeader = ({ title, type = 'primary' }: ConfirmModalHeaderProps) => {
  const isDanger = type === 'danger'
  
  return (
    <div className="flex flex-col items-center justify-center pt-8 pb-4 px-6 text-center space-y-4">
      <div className={`p-3 rounded-full ${isDanger ? 'bg-red-50 text-red-500 shadow-sm border border-red-100/50' : 'bg-indigo-50 text-indigo-500 shadow-sm border border-indigo-100/50'}`}>
        {isDanger ? <AlertTriangle className="w-8 h-8" strokeWidth={1.5} /> : <Info className="w-8 h-8" strokeWidth={1.5} />}
      </div>
      <h3 className="text-xl font-semibold text-slate-800 leading-tight">
        {title}
      </h3>
    </div>
  )
}
