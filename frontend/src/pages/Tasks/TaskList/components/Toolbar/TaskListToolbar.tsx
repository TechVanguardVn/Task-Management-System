import { Filter, Flag, ArrowUpDown, Globe } from 'lucide-react'
import { ToolbarSearch } from './components/ToolbarSearch'
import { ToolbarFilter } from './components/ToolbarFilter'
import { ToolbarActions } from './components/ToolbarActions'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/pages/Tasks/constants/task.constants'
import type { GetTasksQuery } from '@/pages/Tasks/types/task.types'
import { useGetWorkspacesQuery } from '@/services/queries/workspace.query'

interface TaskListToolbarProps {
  rawSearch: string
  queryParams: GetTasksQuery
  setSearch: (value: string) => void
  setFilter: (key: keyof GetTasksQuery, value: any) => void
}

export const TaskListToolbar = ({ rawSearch, queryParams, setSearch, setFilter }: TaskListToolbarProps) => {
  const { data: workspacesData } = useGetWorkspacesQuery({ limit: 100 })
  const workspaces = workspacesData?.data?.items || []
  
  const workspaceOptions = [
    { label: 'All Workspaces', value: '' },
    ...workspaces.map(ws => ({ label: ws.name, value: ws._id }))
  ]

  return (
    <div className="bg-white/65 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.05),inset_0_1px_0_0_rgba(255,255,255,0.85)] flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <ToolbarSearch value={rawSearch} onChange={setSearch} />
        <ToolbarActions />
      </div>
      
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
        <ToolbarFilter 
          icon={Globe} 
          iconColorClass="text-blue-600" 
          options={workspaceOptions} 
          value={queryParams.workspaceId || ''}
          onChange={(val) => setFilter('workspaceId', val || undefined)} 
        />

        <ToolbarFilter 
          icon={Filter} 
          iconColorClass="text-indigo-600" 
          options={[{ label: 'All Status', value: '' }, ...TASK_STATUS_OPTIONS]} 
          value={queryParams.status || ''}
          onChange={(val) => setFilter('status', val || undefined)} 
        />
        
        <ToolbarFilter 
          icon={Flag} 
          iconColorClass="text-violet-600" 
          options={[{ label: 'All Priorities', value: '' }, ...TASK_PRIORITY_OPTIONS]} 
          value={queryParams.priority || ''}
          onChange={(val) => setFilter('priority', val || undefined)} 
        />
        
        <ToolbarFilter 
          icon={ArrowUpDown} 
          iconColorClass="text-slate-500" 
          options={[{ label: 'Newest First', value: 'desc' }, { label: 'Oldest First', value: 'asc' }]} 
          value={queryParams.sortOrder || 'desc'}
          onChange={(val) => setFilter('sortOrder', val as 'asc' | 'desc')} 
        />
      </div>
    </div>
  )
}
