import { useWorkspaceState } from './hooks/useWorkspaceState'
import { WorkspaceHeader } from './components/WorkspaceHeader/WorkspaceHeader'
import { WorkspaceSelection } from './components/WorkspaceSelection/WorkspaceSelection'
import { WorkspaceCreate } from './components/WorkspaceCreate/WorkspaceCreate'
import { WorkspaceInviteWait } from './components/WorkspaceInviteWait/WorkspaceInviteWait'

export const WorkspacePage = () => {
  const { currentView, setCurrentView } = useWorkspaceState()

  return (
    <div className="w-full flex flex-col items-center justify-center relative animate-in fade-in duration-500">
      <div className="w-full max-w-4xl mx-auto relative">
        <div className="relative bg-white/40 backdrop-blur-3xl rounded-[2.25rem] p-8 md:p-12 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.85),inset_0_1px_2px_0_rgba(255,255,255,0.95)] overflow-hidden transition-all duration-500 ease-out min-h-[450px] flex flex-col">
          
          <WorkspaceHeader view={currentView} />

          <div className="flex-1 w-full flex items-center justify-center mt-8">
                {currentView === 'selection' && (
                  <WorkspaceSelection 
                    onSelectCreate={() => setCurrentView('create')} 
                    onSelectInvite={() => setCurrentView('invite')} 
                  />
                )}
                {currentView === 'create' && (
                  <WorkspaceCreate onBack={() => setCurrentView('selection')} />
                )}
                {currentView === 'invite' && (
                  <WorkspaceInviteWait onBack={() => setCurrentView('selection')} />
                )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkspacePage
