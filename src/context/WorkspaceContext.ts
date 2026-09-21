import { createContext, useContext } from 'react'
import { RecentWorkspaceItem } from '../hooks/useWorkspace'

export interface WorkspaceContextType {
  workspacePath: string | null
  workspaceName: string
  recentWorkspaces: RecentWorkspaceItem[]
  workspaceIcons: Record<string, string>
  handleOpenWorkspace: () => Promise<string | null>
  handleSwitchWorkspace: (path: string, name?: string) => string
  handleRemoveRecentWorkspace: (path: string) => void
  handleCloseWorkspace: () => void
  handleRenameWorkspace: (newName?: string) => Promise<string | null>
  handleSetWorkspaceIcon: (wsPath: string, icon: string | null) => void
}

export const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function useWorkspaceContext(): WorkspaceContextType {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider')
  }
  return context
}
