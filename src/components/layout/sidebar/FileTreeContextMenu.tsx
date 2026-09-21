import React from 'react'
import { createPortal } from 'react-dom'
import {
  FolderPlus,
  FolderSearch,
  FolderCog,
  Copy,
  Link,
  Check,
  Edit3,
  Trash2,
  FilePlus
} from 'lucide-react'
import { ContextMenuState } from '../../../types'
import { getPathKey } from '../../../utils/pathUtils'

interface FileTreeContextMenuProps {
  contextMenu: ContextMenuState | null
  rootKey: string
  copiedType: 'path' | 'rel' | null
  onNewFile: (menu: ContextMenuState) => void
  onNewFolder: (menu: ContextMenuState) => void
  onRevealInExplorer: (path: string) => void
  onOpenFolderSettings: (path: string) => void
  onCopyPath: (path: string) => void
  onCopyRelativePath: (path: string) => void
  onRename: (path: string) => void
  onDelete: (path: string, parentPath: string, isDir: boolean) => void
}

function FileTreeContextMenu({
  contextMenu,
  rootKey,
  copiedType,
  onNewFile,
  onNewFolder,
  onRevealInExplorer,
  onOpenFolderSettings,
  onCopyPath,
  onCopyRelativePath,
  onRename,
  onDelete
}: FileTreeContextMenuProps): React.JSX.Element | null {
  if (!contextMenu) return null

  const isNonRoot = contextMenu.path && getPathKey(contextMenu.path) !== rootKey

  return createPortal(
    <div
      className="context-menu-popover"
      style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
      onClick={(e): void => e.stopPropagation()}
    >

      {/* 1. New File */}
      <button className="context-menu-item" onClick={(): void => onNewFile(contextMenu)}>
        <FilePlus size={13} />
        <span>New File</span>
      </button>

      {/* 2. New Folder */}
      <button className="context-menu-item" onClick={(): void => onNewFolder(contextMenu)}>
        <FolderPlus size={13} />
        <span>New Folder</span>
      </button>

      <div className="context-menu-divider" />

      {/* 3. Reveal in File Explorer */}
      <button
        className="context-menu-item"
        onClick={(): void => onRevealInExplorer(contextMenu.path)}
      >
        <FolderSearch size={13} />
        <span>Reveal in File Explorer</span>
      </button>

      {/* 4. Open Folder Settings */}
      <button
        className="context-menu-item"
        onClick={(): void => onOpenFolderSettings(contextMenu.path)}
      >
        <FolderCog size={13} />
        <span>Open Folder Settings</span>
      </button>

      <div className="context-menu-divider" />

      {/* 5. Copy Path */}
      <button
        className="context-menu-item"
        onClick={(): void => onCopyPath(contextMenu.path)}
        style={{ justifyContent: 'space-between' }}
      >
        <span className="flex items-center gap-2">
          <Copy size={13} />
          <span>Copy Path</span>
        </span>
        {copiedType === 'path' && (
          <span
            style={{
              fontSize: '10px',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontWeight: 500
            }}
          >
            <Check size={10} /> Copied
          </span>
        )}
      </button>

      {/* 6. Copy Relative Path */}
      <button
        className="context-menu-item"
        onClick={(): void => onCopyRelativePath(contextMenu.path)}
        style={{ justifyContent: 'space-between' }}
      >
        <span className="flex items-center gap-2">
          <Link size={13} />
          <span>Copy Relative Path</span>
        </span>
        {copiedType === 'rel' && (
          <span
            style={{
              fontSize: '10px',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontWeight: 500
            }}
          >
            <Check size={10} /> Copied
          </span>
        )}
      </button>

      {/* Optional Rename & Delete actions for non-root items */}
      {isNonRoot && (
        <>
          <div className="context-menu-divider" />
          <button className="context-menu-item" onClick={(): void => onRename(contextMenu.path)}>
            <Edit3 size={13} />
            <span>Rename</span>
          </button>
          <button
            className="context-menu-item danger"
            onClick={(): void =>
              onDelete(contextMenu.path, contextMenu.parentPath, !!contextMenu.isDir)
            }
          >
            <Trash2 size={13} />
            <span>Delete {contextMenu.isDir ? 'Folder' : 'File'}</span>
          </button>
        </>
      )}
    </div>,
    document.body
  )
}

export default React.memo(FileTreeContextMenu)
