import { LayoutGrid, Loader2 } from 'lucide-react'
import { useGetWorkspacesQuery } from '@/services/queries/workspace.query'

interface WorkspaceSelectProps {
  value?: string
  onChange: (value: string) => void
  error?: string
}

export const WorkspaceSelect = ({ value, onChange, error }: WorkspaceSelectProps) => {
  const { data, isLoading } = useGetWorkspacesQuery({ limit: 100, page: 1 })
  const workspaces = data?.data?.items || []
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
        Workspace <span className="text-red-500">*</span>
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors z-10 pointer-events-none">
          <LayoutGrid size={16} />
        </div>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className={`w-full pl-9 pr-8 py-2 bg-white/50 border rounded-xl outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] appearance-none cursor-pointer ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="" disabled className="text-slate-400">
            Select a workspace...
          </option>
          {workspaces.map(ws => (
            <option key={ws._id} value={ws._id}>
              {ws.name}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 ml-1 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}
