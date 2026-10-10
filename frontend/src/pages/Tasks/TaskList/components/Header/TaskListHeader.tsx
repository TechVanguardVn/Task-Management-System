

import { Plus, UserSquare2, Globe, Rocket } from 'lucide-react'

export type TaskViewMode = 'my_tasks' | 'workspace_tasks'

interface TaskListHeaderProps {
  viewMode: TaskViewMode
  onViewModeChange: (mode: TaskViewMode) => void
  onCreateTask?: () => void
  onDispatchMode?: () => void
  isAdminOrManager?: boolean
  hasSelectedWorkspace: boolean
}

export const TaskListHeader = ({ viewMode, onViewModeChange, onCreateTask, onDispatchMode, isAdminOrManager, hasSelectedWorkspace }: TaskListHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 mt-4 gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-4xl text-slate-900 tracking-tight font-bold">Task List</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-full sm:w-auto shadow-inner">
          <button
            onClick={() => onViewModeChange('my_tasks')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'my_tasks'
                ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <UserSquare2 size={16} />
            My Tasks
          </button>
          <button
            onClick={() => onViewModeChange('workspace_tasks')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'workspace_tasks'
                ? 'bg-white text-indigo-700 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Globe size={16} />
            Workspace Tasks
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {viewMode === 'workspace_tasks' && isAdminOrManager && (
            <button
              onClick={onDispatchMode}
              disabled={!hasSelectedWorkspace}
              title={!hasSelectedWorkspace ? 'Select a workspace first to use Dispatch Mode' : ''}
              className={`flex-1 sm:flex-none relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-150 focus:outline-none shrink-0 ${
                hasSelectedWorkspace 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {hasSelectedWorkspace && <span className="absolute inset-x-0 top-0 h-[1px] bg-white/40 rounded-t-xl"></span>}
              <Rocket size={16} strokeWidth={3} />
              <span className="hidden sm:inline">Dispatch Mode</span>
            </button>
          )}

          {isAdminOrManager && (
            <button
              onClick={onCreateTask}
              className="flex-1 sm:flex-none relative inline-flex items-center justify-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-xl px-4 py-2.5 text-sm font-bold hover:brightness-110 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 shrink-0"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-white/40 rounded-t-xl"></span>
              <Plus size={16} strokeWidth={3} />
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
