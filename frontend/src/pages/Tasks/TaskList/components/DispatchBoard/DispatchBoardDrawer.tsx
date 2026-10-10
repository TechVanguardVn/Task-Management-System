import { X, Rocket } from 'lucide-react'
import { DispatchBoard } from './DispatchBoard'
import { useEffect, useState } from 'react'
import { useLockBodyScroll } from './hooks/useLockBodyScroll'
import { useGetWorkspacesQuery } from '@/services/queries/workspace.query'
import { Select } from 'antd'

interface DispatchBoardDrawerProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export const DispatchBoardDrawer = ({ isOpen, onClose, workspaceId: initialWorkspaceId }: DispatchBoardDrawerProps) => {
  const [render, setRender] = useState(false)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(initialWorkspaceId)
  
  const { data: workspacesData } = useGetWorkspacesQuery({ limit: 100 })
  const workspaces = workspacesData?.data?.items || []

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (isOpen) {
      setRender(true)
      setActiveWorkspaceId(initialWorkspaceId)
    } else {
      setTimeout(() => setRender(false), 300)
    }
  }, [isOpen, initialWorkspaceId])

  if (!render && !isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div
        className={`w-full h-full bg-slate-50/80 backdrop-blur-2xl shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        <div className="h-16 border-b border-white/60 bg-white/40 flex items-center justify-between px-6 shrink-0 relative z-20 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Rocket size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Dispatch Mode</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-slate-500">Resource allocation for</span>
                <Select
                  value={activeWorkspaceId}
                  onChange={setActiveWorkspaceId}
                  options={workspaces.map((ws: any) => ({ label: ws.name, value: ws._id }))}
                  variant="borderless"
                  className="min-w-[150px] !bg-indigo-50 !rounded-md [&_.ant-select-selector]:!px-2 font-semibold text-indigo-600"
                  popupMatchSelectWidth={false}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10 mix-blend-multiply"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 mix-blend-multiply"></div>
          {activeWorkspaceId ? (
            <DispatchBoard workspaceId={activeWorkspaceId} />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-slate-500 font-medium">
              Please select a workspace to start dispatching tasks.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
