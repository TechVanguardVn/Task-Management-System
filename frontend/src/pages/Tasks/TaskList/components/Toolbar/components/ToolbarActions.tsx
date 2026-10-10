import { LayoutList } from 'lucide-react'

export const ToolbarActions = () => {
  return (
    <>
      <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>
      
      <button className="w-10 h-10 rounded-xl bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-all hidden md:flex">
        <LayoutList size={20} />
      </button>
    </>
  )
}
