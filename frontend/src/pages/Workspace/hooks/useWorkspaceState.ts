import { useState } from 'react'
import type { WorkspaceView } from '../types/workspace.types'

export const useWorkspaceState = () => {
  const [currentView, setCurrentView] = useState<WorkspaceView>('selection')

  return {
    currentView,
    setCurrentView,
  }
}
