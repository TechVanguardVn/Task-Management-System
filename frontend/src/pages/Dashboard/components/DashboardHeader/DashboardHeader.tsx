import { RefreshCcw } from 'lucide-react'
import { Select, Skeleton } from 'antd'

interface Props {
  isLoading: boolean
  workspaceId: string
  workspaces: { id: string, name: string }[]
  onWorkspaceChange: (val: string) => void
  onRefresh: () => void
}

export const DashboardHeader = ({ isLoading, workspaceId, workspaces, onWorkspaceChange, onRefresh }: Props) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl text-slate-900 font-bold tracking-tight">Overview</h1>
      </div>
      
      <div className="flex items-center gap-2 self-start md:self-auto">
        <div className="relative group">
          {isLoading ? (
            <Skeleton.Button active style={{ width: 220, height: 48, borderRadius: 16 }} />
          ) : (
            <div className="flex items-center gap-4 px-4 py-2 bg-white/80 hover:bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06),0_1px_0_0_rgba(255,255,255,0.9)] transition-all">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Workspace:</span>
              <Select
                value={workspaceId}
                onChange={onWorkspaceChange}
                options={workspaces.map(ws => ({ label: ws.name, value: ws.id }))}
                bordered={false}
                className="min-w-[140px] font-semibold text-slate-800"
                popupClassName="rounded-xl shadow-lg border border-slate-100"
              />
            </div>
          )}
        </div>
        
        <button 
          onClick={onRefresh}
          aria-label="Refresh Data" 
          className="w-12 h-12 rounded-2xl bg-white/80 hover:bg-white backdrop-blur-xl shadow-[0_4px_16px_-2px_rgba(15,23,42,0.05)] flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all active:scale-95"
        >
          <RefreshCcw size={18} />
        </button>
      </div>
    </header>
  )
}
