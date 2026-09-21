import React, { useState, useCallback, useMemo } from 'react'
import { useWorkspace } from '../hooks/useWorkspace'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import { getPathKey } from '../utils/pathUtils'
import { WorkspaceContext, WorkspaceContextType } from './WorkspaceContext'

export interface WorkspaceProviderProps {
  children: React.ReactNode
  initialPath?: string | null
  initialName?: string
}

export function WorkspaceProvider({
  children,
  initialPath = '/workspace',
  initialName = 'Browser Storage'
}: WorkspaceProviderProps): React.JSX.Element {
  const {
    workspacePath,
    workspaceName,
    recentWorkspaces,
    handleOpenWorkspace,
    handleSwitchWorkspace,
    handleRemoveRecentWorkspace,
    handleCloseWorkspace,
    handleRenameWorkspace
  } = useWorkspace(initialPath, initialName)

  const [workspaceIcons, setWorkspaceIcons] = useState<Record<string, string>>(() => {
    return storageService.getItem<Record<string, string>>(STORAGE_KEYS.WORKSPACE_ICONS, {})
  })

  const handleSetWorkspaceIcon = useCallback((wsPath: string, icon: string | null) => {
    setWorkspaceIcons((prev) => {
      const next = { ...prev }
      const key = getPathKey(wsPath)
      if (!icon) {
        delete next[key]
        delete next[wsPath]
      } else {
        next[key] = icon
        next[wsPath] = icon
      }
      storageService.setItem(STORAGE_KEYS.WORKSPACE_ICONS, next)
      return next
    })
  }, [])

  const value = useMemo<WorkspaceContextType>(
    () => ({
      workspacePath,
      workspaceName,
      recentWorkspaces,
      workspaceIcons,
      handleOpenWorkspace,
      handleSwitchWorkspace,
      handleRemoveRecentWorkspace,
      handleCloseWorkspace,
      handleRenameWorkspace,
      handleSetWorkspaceIcon
    }),
    [
      workspacePath,
      workspaceName,
      recentWorkspaces,
      workspaceIcons,
      handleOpenWorkspace,
      handleSwitchWorkspace,
      handleRemoveRecentWorkspace,
      handleCloseWorkspace,
      handleRenameWorkspace,
      handleSetWorkspaceIcon
    ]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
