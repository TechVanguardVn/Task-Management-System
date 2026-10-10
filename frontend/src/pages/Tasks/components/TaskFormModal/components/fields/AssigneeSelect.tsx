import { UserCircle2, Loader2 } from 'lucide-react'
import { useGetWorkspaceMembersQuery } from '@/services/queries/workspace.query'

interface AssigneeSelectProps {
  workspaceId: string
  value?: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export const AssigneeSelect = ({ workspaceId, value, onChange, error, disabled }: AssigneeSelectProps) => {
  const { data, isLoading } = useGetWorkspaceMembersQuery(workspaceId)
  const members = data?.data || []
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
        Assignee
      </label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors z-10 pointer-events-none">
          <UserCircle2 size={16} />
        </div>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || !workspaceId || disabled}
          className={`w-full pl-9 pr-8 py-2 bg-white/50 border rounded-xl outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] appearance-none cursor-pointer ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          } ${(isLoading || !workspaceId || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="" className="text-slate-400">
            {workspaceId ? 'Unassigned (Backlog)' : 'Select workspace first'}
          </option>
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.fullName || member.email}
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
