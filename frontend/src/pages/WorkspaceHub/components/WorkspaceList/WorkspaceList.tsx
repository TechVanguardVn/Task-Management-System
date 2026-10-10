import type { Workspace } from '../../types/workspace.types'
import { WORKSPACE_HUB_TEXTS } from '../../constants/workspaceHub.constants'
import { WorkspaceCard } from './components/WorkspaceCard'
import { WorkspaceToolbar } from './components/WorkspaceToolbar'
import { WorkspaceEmptySearch } from './components/WorkspaceEmptySearch'

interface Props {
  workspaces: Workspace[]
  searchQuery: string
  onSearchChange: (value: string) => void
  onCreateClick: () => void
  onEnterWorkspace: (id: string) => void
  activeOrgCount: number
}

export const WorkspaceList = ({
  workspaces,
  searchQuery,
  onSearchChange,
  onCreateClick,
  onEnterWorkspace,
  activeOrgCount
}: Props) => {
  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h1 className="text-4xl lg:text-6xl text-slate-900 font-bold tracking-tight">
          {WORKSPACE_HUB_TEXTS.list.title}
        </h1>
      </div>

      <WorkspaceToolbar 
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onCreateClick={onCreateClick}
        activeOrgCount={activeOrgCount}
      />

      {workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace, index) => (
            <WorkspaceCard 
              key={workspace._id}
              workspace={workspace}
              index={index}
              onEnter={onEnterWorkspace}
            />
          ))}
        </div>
      ) : (
        <WorkspaceEmptySearch />
      )}

    </div>
  )
}
