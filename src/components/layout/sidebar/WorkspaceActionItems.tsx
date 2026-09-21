import React from 'react'
import { Folder, FolderPlus, Plus, Edit3, XCircle, Smile, Download, Globe } from 'lucide-react'
import { exportWorkspaceAsZip } from '../../../utils/exportUtils'

interface WorkspaceActionItemsProps {
  workspacePath: string | null
  workspaceName?: string
  currentIcon?: string
  hasSetIconHandler: boolean
  onOpenEmojiPicker: () => void
  onCreateFileAtRoot: () => void
  onOpenWorkspace: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onRenameWorkspace?: () => void
  onCloseWorkspace?: () => void
  onCloseMenu: () => void
}

function WorkspaceActionItems({
  workspacePath,
  workspaceName,
  currentIcon,
  hasSetIconHandler,
  onOpenEmojiPicker,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onSwitchWorkspace,
  onRenameWorkspace,
  onCloseWorkspace,
  onCloseMenu
}: WorkspaceActionItemsProps): React.JSX.Element {
  return (
    <div className="notion-popover-section">
      {workspacePath && hasSetIconHandler && (
        <button type="button" className="notion-menu-item" onClick={onOpenEmojiPicker}>
          <Smile size={14} className="text-zinc-300 shrink-0" />
          <span>{currentIcon ? 'Change Workspace Icon...' : 'Add Workspace Icon...'}</span>
        </button>
      )}

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          onCreateFileAtRoot()
          onCloseMenu()
        }}
      >
        <Plus size={14} className="text-zinc-300 shrink-0" />
        <span>New File</span>
      </button>

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          window.dispatchEvent(new CustomEvent('create-root-folder'))
          onCloseMenu()
        }}
      >
        <FolderPlus size={14} className="text-zinc-300 shrink-0" />
        <span>New Folder</span>
      </button>

      <button
        type="button"
        className="notion-menu-item"
        onClick={(): void => {
          onOpenWorkspace()
          onCloseMenu()
        }}
      >
        <Folder size={14} className="text-zinc-300 shrink-0" />
        <span className="text-zinc-200 font-medium">Open Local Folder...</span>
      </button>

      {workspacePath && (
        <button
          type="button"
          className="notion-menu-item"
          onClick={(): void => {
            if (onRenameWorkspace) {
              void onRenameWorkspace()
            } else {
              window.dispatchEvent(new CustomEvent('rename-root-folder'))
            }
            onCloseMenu()
          }}
        >
          <Edit3 size={14} className="text-zinc-300 shrink-0" />
          <span>{workspacePath === '/workspace' ? 'Rename Browser Storage...' : 'Rename Workspace...'}</span>
        </button>
      )}

      {workspacePath && (
        <button
          type="button"
          className="notion-menu-item"
          onClick={(): void => {
            void exportWorkspaceAsZip(workspacePath, workspaceName)
            onCloseMenu()
          }}
        >
          <Download size={14} className="text-amber-400 shrink-0" />
          <span>Export Workspace (.zip)</span>
        </button>
      )}

      {workspacePath && workspacePath !== '/workspace' && onSwitchWorkspace && (
        <button
          type="button"
          className="notion-menu-item"
          onClick={(): void => {
            onSwitchWorkspace('/workspace', 'Browser Storage')
            onCloseMenu()
          }}
        >
          <Globe size={14} className="text-zinc-300 shrink-0" />
          <span>Switch to Browser Storage</span>
        </button>
      )}

      {workspacePath && workspacePath !== '/workspace' && onCloseWorkspace && (
        <button
          type="button"
          className="notion-menu-item text-rose-400 hover:text-rose-300"
          onClick={(): void => {
            onCloseWorkspace()
            onCloseMenu()
          }}
        >
          <XCircle size={14} className="text-rose-400 shrink-0" />
          <span>Close Workspace</span>
        </button>
      )}
    </div>
  )
}

export default React.memo(WorkspaceActionItems)
