import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

interface Props {
  icon: ReactNode
  title: string
  description: string
  actionText: string
  colorTheme: 'indigo' | 'violet'
  onClick: () => void
}

export const WorkspaceSelectionCard = ({ icon, title, description, actionText, colorTheme, onClick }: Props) => {
  const isIndigo = colorTheme === 'indigo'
  
  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white/50 hover:bg-white/90 transition-all duration-300 rounded-2xl p-8 cursor-pointer shadow-sm hover:shadow-lg overflow-hidden flex flex-col justify-between border border-white/60`}
    >
      <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${isIndigo ? 'from-indigo-200/40' : 'from-violet-200/40'} to-transparent rounded-bl-full pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity`}></div>
      <div>
        <div className={`w-14 h-14 rounded-2xl ${isIndigo ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600' : 'bg-violet-50 text-violet-600 group-hover:bg-violet-600'} group-hover:text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-300`}>
          {icon}
        </div>
        <h2 className={`text-2xl font-semibold text-slate-900 mt-6 ${isIndigo ? 'group-hover:text-indigo-600' : 'group-hover:text-violet-600'} transition-colors`}>
          {title}
        </h2>
        <p className="text-slate-500 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
      <div className={`pt-8 flex items-center justify-between ${isIndigo ? 'text-indigo-600' : 'text-violet-600'} font-semibold`}>
        <span>{actionText}</span>
        <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-200" />
      </div>
    </div>
  )
}
