import { Search } from 'lucide-react'
import { Input } from 'antd'

interface ToolbarSearchProps {
  value: string
  onChange: (value: string) => void
}

export const ToolbarSearch = ({ value, onChange }: ToolbarSearchProps) => {
  return (
    <div className="relative w-full md:w-80">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 z-10">
        <Search size={20} />
      </span>
      <Input 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        variant="borderless"
        className="w-full !bg-white/80 !text-slate-900 placeholder:!text-slate-400 !pl-10 !pr-10 !py-2.5 !rounded-xl !text-sm !shadow-[inset_0_2px_4px_rgba(15,23,42,0.03)] hover:!bg-white focus:!bg-white transition-all" 
        placeholder="Search tasks..." 
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">⌘K</kbd>
      </div>
    </div>
  )
}
