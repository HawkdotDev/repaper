import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, FilePlus, FolderPlus } from 'lucide-react'
import WorkspaceSelector from './sidebar/WorkspaceSelector'
import { useWorkspaceContext } from '../../context/WorkspaceContext'
import { useFileStorageContext } from '../../context/FileStorageContext'
import { useUIContext } from '../../context/UIContext'

export interface TopHeaderProps {
  workspacePath?: string | null
  workspaceName?: string
  workspaceIcons?: Record<string, string>
  onSetWorkspaceIcon?: (workspacePath: string, icon: string | null) => void
  recentWorkspaces?: { path: string; name: string }[]
  onOpenWorkspace?: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onRenameWorkspace?: () => void
  onCreateFileAtRoot?: () => void
}

function TopHeader(props: TopHeaderProps): React.JSX.Element {
  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()
  const ui = useUIContext()

  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  const { onCreateFileAtRoot } = props
  const currentWorkspacePath =
    props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath

  useEffect(() => {
    if (!showAddMenu) return

    const handleClickOutside = (e: MouseEvent): void => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setShowAddMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAddMenu])

  const handleCreateFile = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation()
      setShowAddMenu(false)
      if (!currentWorkspacePath) {
        if (onCreateFileAtRoot) {
          onCreateFileAtRoot()
        } else {
          void fileStorage.handleCreateFileAtRoot()
        }
        return
      }

      const needsViewSwitch = ui.sidebarView !== 'explorer' || ui.viewMode !== 'editor'
      if (ui.sidebarView !== 'explorer') {
        ui.setSidebarView('explorer')
      }
      if (ui.viewMode !== 'editor') {
        ui.setViewMode('editor')
      }

      if (needsViewSwitch) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('create-root-file'))
        }, 50)
      } else {
        window.dispatchEvent(new CustomEvent('create-root-file'))
      }
    },
    [currentWorkspacePath, onCreateFileAtRoot, fileStorage, ui]
  )

  const handleCreateFolder = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation()
      setShowAddMenu(false)
      if (!currentWorkspacePath) {
        alert('Please open a workspace folder first.')
        return
      }

      const needsViewSwitch = ui.sidebarView !== 'explorer' || ui.viewMode !== 'editor'
      if (ui.sidebarView !== 'explorer') {
        ui.setSidebarView('explorer')
      }
      if (ui.viewMode !== 'editor') {
        ui.setViewMode('editor')
      }

      if (needsViewSwitch) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('create-root-folder'))
        }, 50)
      } else {
        window.dispatchEvent(new CustomEvent('create-root-folder'))
      }
    },
    [currentWorkspacePath, ui]
  )

  return (
    <div className="top-header-left flex items-center w-full select-none min-w-0">
      {/* Left Control: Fixed Button Spacer so it doesn't overlap stationary toggle */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-6.5 h-6.5 shrink-0 pointer-events-none" aria-hidden="true" />
      </div>

      {/* Workspace Selector Dropdown */}
      <div className="flex-1 min-w-0 ml-1">
        <WorkspaceSelector
          workspacePath={props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath}
          workspaceName={props.workspaceName !== undefined ? props.workspaceName : workspace.workspaceName}
          workspaceIcons={props.workspaceIcons !== undefined ? props.workspaceIcons : workspace.workspaceIcons}
          onSetWorkspaceIcon={props.onSetWorkspaceIcon || workspace.handleSetWorkspaceIcon}
          recentWorkspaces={props.recentWorkspaces !== undefined ? props.recentWorkspaces : workspace.recentWorkspaces}
          onOpenWorkspace={props.onOpenWorkspace || workspace.handleOpenWorkspace}
          onCloseWorkspace={props.onCloseWorkspace || workspace.handleCloseWorkspace}
          onSwitchWorkspace={props.onSwitchWorkspace || workspace.handleSwitchWorkspace}
          onRemoveRecentWorkspace={props.onRemoveRecentWorkspace || workspace.handleRemoveRecentWorkspace}
          onRenameWorkspace={props.onRenameWorkspace || workspace.handleRenameWorkspace}
          onCreateFileAtRoot={props.onCreateFileAtRoot || fileStorage.handleCreateFileAtRoot}
          dropUp={false}
        />
      </div>

      {/* Plus Button with Dropdown Menu */}
      <div className="relative shrink-0" ref={addMenuRef}>
        <button
          type="button"
          className={`sidebar-workspace-add-btn ${showAddMenu ? 'active' : ''}`}
          onClick={(): void => setShowAddMenu((prev) => !prev)}
          title="New..."
          aria-label="New File or Folder"
          aria-expanded={showAddMenu}
        >
          <Plus size={14} strokeWidth={1.8} />
        </button>

        {showAddMenu && (
          <div className="sidebar-quick-add-menu">
            <button
              type="button"
              className="quick-add-item"
              onClick={handleCreateFile}
            >
              <FilePlus size={14} strokeWidth={1.8} className="text-zinc-400 shrink-0" />
              <span>New File</span>
            </button>
            <button
              type="button"
              className="quick-add-item"
              onClick={handleCreateFolder}
            >
              <FolderPlus size={14} strokeWidth={1.8} className="text-zinc-400 shrink-0" />
              <span>New Folder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(TopHeader)
export { TopHeader as TopHeaderLeft }
