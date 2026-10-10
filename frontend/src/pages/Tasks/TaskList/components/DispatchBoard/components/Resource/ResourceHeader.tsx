import { Search, Filter } from 'lucide-react'
import { Button } from 'antd'

export const ResourceHeader = () => {
  return (
    <div className="p-4 border-b border-white/60 bg-white/40 flex items-center justify-between">
      <div>
        <h3 className="font-bold text-slate-900">Resource Workload</h3>
        <p className="text-xs text-slate-500 mt-1">Manage team capacity</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search member..." 
            className="pl-9 pr-4 py-1.5 text-sm border border-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all w-60 bg-white/50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] placeholder:text-slate-400 font-medium text-slate-700"
          />
        </div>
        <Button 
          icon={<Filter size={14} />} 
          className="flex items-center justify-center text-slate-400 hover:text-indigo-600"
        />
      </div>
    </div>
  )
}
