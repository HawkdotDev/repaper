import { useState, useCallback } from 'react'
import { normalizePath } from '../utils/pathUtils'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export interface RecentWorkspaceItem {
  path: string
  name: string
}

export interface UseWorkspaceReturn {
  workspacePath: string | null
  setWorkspacePath: React.Dispatch<React.SetStateAction<string | null>>
  workspaceName: string
  setWorkspaceName: React.Dispatch<React.SetStateAction<string>>
  recentWorkspaces: RecentWorkspaceItem[]
  updateRecentWorkspaces: (path: string, name?: string) => void
  handleOpenWorkspace: () => Promise<string | null>
  handleSwitchWorkspace: (path: string, name?: string) => string
  handleRemoveRecentWorkspace: (path: string) => void
  handleCloseWorkspace: () => void
  handleRenameWorkspace: (newName?: string) => Promise<string | null>
}

export function useWorkspace(
  initialWorkspacePath: string | null,
  initialWorkspaceName: string
): UseWorkspaceReturn {
  const [workspacePath, setWorkspacePath] = useState<string | null>(initialWorkspacePath)
  const [workspaceName, setWorkspaceName] = useState<string>(() => {
    if (!initialWorkspacePath || initialWorkspacePath === '/workspace') {
      const savedCustomName = storageService.getItem<string>(STORAGE_KEYS.BROWSER_STORAGE_NAME)
      if (savedCustomName && savedCustomName.trim()) {
        return savedCustomName.trim()
      }
    }
    return initialWorkspaceName
  })

  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspaceItem[]>(() => {
    const saved =
      storageService.getItem<RecentWorkspaceItem[]>(STORAGE_KEYS.RECENT_WORKSPACES) ||
      storageService.getItem<RecentWorkspaceItem[]>(STORAGE_KEYS.LEGACY_RECENT_WORKSPACES)
    if (Array.isArray(saved)) {
      return saved.filter(
        (item: RecentWorkspaceItem) =>
          item && item.path && normalizePath(item.path) !== '/workspace'
      )
    }
    return []
  })

  const updateRecentWorkspaces = useCallback((path: string, name?: string) => {
    const norm = normalizePath(path)
    if (!norm || norm === '/workspace' || norm.toLowerCase() === '/workspace') return
    const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
    setRecentWorkspaces((prev) => {
      const filtered = prev.filter(
        (item) => normalizePath(item.path) !== norm && normalizePath(item.path) !== '/workspace'
      )
      const updated = [{ path: norm, name: folderName }, ...filtered].slice(0, 10)
      storageService.setItem(STORAGE_KEYS.RECENT_WORKSPACES, updated)
      return updated
    })
  }, [])

  const handleOpenWorkspace = useCallback(async (): Promise<string | null> => {
    try {
      const selected = await window.api.fs.openDirectory()
      if (selected && selected.path) {
        const norm = normalizePath(selected.path)
        if (!norm || norm === '/workspace') return null
        const folderName = selected.name || norm.split(/[\\/]/).pop() || 'Workspace'
        setWorkspacePath(norm)
        setWorkspaceName(folderName)
        updateRecentWorkspaces(norm, folderName)
        return norm
      }
    } catch (err) {
      console.error('Error opening folder:', err)
    }
    return null
  }, [updateRecentWorkspaces])

  const handleSwitchWorkspace = useCallback(
    (path: string, name?: string): string => {
      const norm = normalizePath(path)
      if (!norm) return ''
      if (norm === '/workspace') {
        setWorkspacePath('/workspace')
        const savedCustomName = storageService.getItem<string>(STORAGE_KEYS.BROWSER_STORAGE_NAME)
        const effectiveName = name || (savedCustomName && savedCustomName.trim()) || 'Browser Storage'
        setWorkspaceName(effectiveName)
        return '/workspace'
      }
      const folderName = name || norm.split(/[\\/]/).pop() || 'Workspace'
      setWorkspacePath(norm)
      setWorkspaceName(folderName)
      updateRecentWorkspaces(norm, folderName)
      return norm
    },
    [updateRecentWorkspaces]
  )

  const handleRemoveRecentWorkspace = useCallback((path: string): void => {
    const norm = normalizePath(path)
    setRecentWorkspaces((prev) => {
      const updated = prev.filter((item) => normalizePath(item.path) !== norm)
      storageService.setItem(STORAGE_KEYS.RECENT_WORKSPACES, updated)
      return updated
    })
  }, [])

  const handleCloseWorkspace = useCallback((): void => {
    setWorkspacePath('/workspace')
    const savedCustomName = storageService.getItem<string>(STORAGE_KEYS.BROWSER_STORAGE_NAME)
    setWorkspaceName((savedCustomName && savedCustomName.trim()) || 'Browser Storage')
  }, [])

  const handleRenameWorkspace = useCallback(
    async (newName?: string): Promise<string | null> => {
      if (!workspacePath) return null
      const isBrowser = workspacePath === '/workspace'
      const currentName =
        workspaceName ||
        (isBrowser ? 'Browser Storage' : workspacePath.split(/[\\/]/).pop() || 'Workspace')
      const targetName =
        newName !== undefined
          ? newName.trim()
          : prompt(
              isBrowser ? 'Enter new name for Browser Storage:' : 'Enter new workspace folder name:',
              currentName
            )?.trim()
      if (!targetName || targetName === currentName) return null

      if (isBrowser) {
        setWorkspaceName(targetName)
        storageService.setItem(STORAGE_KEYS.BROWSER_STORAGE_NAME, targetName)
        return '/workspace'
      }

      const parentDir = workspacePath.substring(
        0,
        Math.max(workspacePath.lastIndexOf('/'), workspacePath.lastIndexOf('\\'))
      )
      const newPath = normalizePath(`${parentDir}/${targetName}`)
      try {
        await window.api.fs.renamePath(workspacePath, newPath)
        setWorkspacePath(newPath)
        setWorkspaceName(targetName)
        updateRecentWorkspaces(newPath, targetName)
        return newPath
      } catch (err) {
        alert(`Error renaming workspace folder: ${err}`)
        return null
      }
    },
    [workspacePath, workspaceName, updateRecentWorkspaces]
  )

  return {
    workspacePath,
    setWorkspacePath,
    workspaceName,
    setWorkspaceName,
    recentWorkspaces,
    updateRecentWorkspaces,
    handleOpenWorkspace,
    handleSwitchWorkspace,
    handleRemoveRecentWorkspace,
    handleCloseWorkspace,
    handleRenameWorkspace
  }
}
