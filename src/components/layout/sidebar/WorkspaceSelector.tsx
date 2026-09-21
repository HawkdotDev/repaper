import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { ChevronDown } from 'lucide-react'
import { getPathKey } from '../../../utils/pathUtils'
import { WorkspaceIcon } from '../../../utils/fileIconUtils'
import WorkspaceRecentList from './WorkspaceRecentList'
import WorkspaceActionItems from './WorkspaceActionItems'

const EmojiPicker = lazy(() => import('../../EmojiPicker'))

interface WorkspaceSelectorProps {
  workspacePath: string | null
  workspaceName?: string
  workspaceIcons?: Record<string, string>
  onSetWorkspaceIcon?: (workspacePath: string, icon: string | null) => void
  recentWorkspaces?: { path: string; name: string }[]
  onOpenWorkspace: () => void
  onCloseWorkspace?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRemoveRecentWorkspace?: (path: string) => void
  onRenameWorkspace?: () => void
  onCreateFileAtRoot: () => void
  dropUp?: boolean
}

function WorkspaceSelector({
  workspacePath,
  workspaceName,
  workspaceIcons = {},
  onSetWorkspaceIcon,
  recentWorkspaces = [],
  onOpenWorkspace,
  onCloseWorkspace,
  onSwitchWorkspace,
  onRemoveRecentWorkspace,
  onRenameWorkspace,
  onCreateFileAtRoot,
  dropUp = false
}: WorkspaceSelectorProps): React.JSX.Element {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<boolean>(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const workspaceMenuRef = useRef<HTMLDivElement>(null)

  const isBrowser = !workspacePath || workspacePath === '/workspace'
  const effectiveWorkspacePath = workspacePath || '/workspace'

  const currentDisplayName =
    workspaceName ||
    (isBrowser
      ? 'Browser Storage'
      : effectiveWorkspacePath.split(/[\\/]/).filter(Boolean).pop() || 'Workspace')

  const savedIcon =
    workspaceIcons[getPathKey(effectiveWorkspacePath)] ||
    workspaceIcons[effectiveWorkspacePath]

  const currentIcon = savedIcon || '■'

  const handleCloseAll = useCallback((): void => {
    setShowWorkspaceMenu(false)
    setShowEmojiPicker(false)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        handleCloseAll()
      }
    }
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleCloseAll()
      }
    }
    if (showWorkspaceMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showWorkspaceMenu, showEmojiPicker, handleCloseAll])

  return (
    <div className="relative flex-1 min-w-0" ref={workspaceMenuRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        className={`sidebar-workspace-trigger ${showWorkspaceMenu ? 'active' : ''}`}
        onClick={(): void => {
          if (showEmojiPicker) {
            handleCloseAll()
          } else {
            setShowWorkspaceMenu((prev) => !prev)
          }
        }}
        title={`Workspace: ${currentDisplayName} (Click to switch or manage)`}
      >
        <WorkspaceIcon name={currentDisplayName} icon={currentIcon} size={20} />
        <span className="sidebar-workspace-name truncate">{currentDisplayName}</span>
        <ChevronDown
          size={12}
          className={`sidebar-workspace-chevron shrink-0 transition-transform duration-150 ${
            showWorkspaceMenu ? 'rotate-180 text-zinc-200' : 'text-zinc-500'
          }`}
        />
      </button>

      {/* Workspace Switcher Popover */}
      {showWorkspaceMenu && (
        <div className={`notion-dropdown-popover sidebar-workspace-popover ${dropUp ? 'drop-up' : ''}`}>
          <div className="dropdown-section-title">WORKSPACES</div>

          <WorkspaceRecentList
            recentWorkspaces={recentWorkspaces}
            workspacePath={workspacePath}
            workspaceIcons={workspaceIcons}
            onSwitchWorkspace={onSwitchWorkspace}
            onRemoveRecentWorkspace={onRemoveRecentWorkspace}
            onCloseMenu={handleCloseAll}
          />

          <div className="notion-menu-divider" />

          <WorkspaceActionItems
            workspacePath={effectiveWorkspacePath}
            workspaceName={workspaceName}
            currentIcon={currentIcon}
            hasSetIconHandler={Boolean(onSetWorkspaceIcon)}
            onOpenEmojiPicker={(): void => {
              setShowWorkspaceMenu(false)
              setShowEmojiPicker(true)
            }}
            onCreateFileAtRoot={onCreateFileAtRoot}
            onOpenWorkspace={onOpenWorkspace}
            onSwitchWorkspace={onSwitchWorkspace}
            onRenameWorkspace={onRenameWorkspace}
            onCloseWorkspace={onCloseWorkspace}
            onCloseMenu={handleCloseAll}
          />
        </div>
      )}

      {/* Emoji Picker Popover for Workspace Icon */}
      {showEmojiPicker && onSetWorkspaceIcon && (
        <div className={`workspace-emoji-picker-container ${dropUp ? 'drop-up' : ''}`}>
          <Suspense fallback={null}>
            <EmojiPicker
              onSelect={(emoji): void => {
                onSetWorkspaceIcon(effectiveWorkspacePath, emoji)
                handleCloseAll()
              }}
              onClose={(): void => setShowEmojiPicker(false)}
              onRemove={
                savedIcon
                  ? (): void => {
                      onSetWorkspaceIcon(effectiveWorkspacePath, null)
                      handleCloseAll()
                    }
                  : undefined
              }
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default React.memo(WorkspaceSelector)
