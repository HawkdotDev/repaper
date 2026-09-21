import React from 'react'
import { ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import { SharpFolderIcon } from '../../icons/SharpIcons'
import { ProfessionalFileIcon } from '../../../utils/fileIconUtils'
import { InlineRenameInput } from './FileTreeInlineInputs'

interface FolderNodeRowProps {
  name: string
  isExpanded: boolean
  count: number
  isRenaming: boolean
  renamingName: string
  isDraggable: boolean
  onToggleExpand: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: () => void
  onDrop: (e: React.DragEvent) => void
  onRenameChange: (val: string) => void
  onRenameSubmit: (e: React.FormEvent) => Promise<void>
  onRenameBlur: (e: React.FocusEvent) => void
}

export const FolderNodeRow = React.memo(function FolderNodeRow({
  name,
  isExpanded,
  count,
  isRenaming,
  renamingName,
  isDraggable,
  onToggleExpand,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDrop,
  onRenameChange,
  onRenameSubmit,
  onRenameBlur
}: FolderNodeRowProps): React.JSX.Element {
  return (
    <div
      className={`tree-node-item group ${isExpanded ? 'expanded-folder' : ''}`}
      onClick={onToggleExpand}
      onContextMenu={onContextMenu}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
    >
      <span className="tree-node-left">
        <span className="tree-node-chevron shrink-0">
          {isExpanded ? (
            <ChevronDown size={11} strokeWidth={2.2} />
          ) : (
            <ChevronRight size={11} strokeWidth={2.2} />
          )}
        </span>
        <SharpFolderIcon open={isExpanded} size={14} className="text-zinc-500 shrink-0" />
        {isRenaming ? (
          <InlineRenameInput
            value={renamingName}
            onChange={onRenameChange}
            onSubmit={onRenameSubmit}
            onBlur={onRenameBlur}
          />
        ) : (
          <span className="tree-node-label">{name}</span>
        )}
      </span>
      <span className="tree-node-right flex items-center">
        <span className="tree-node-count-pill group-hover:hidden">{count}</span>
        <div className="tree-node-hover-actions hidden group-hover:flex items-center gap-0.5">
          <button
            type="button"
            className="tree-node-action-btn"
            onClick={(e): void => {
              e.stopPropagation()
              onContextMenu(e)
            }}
            title="Folder Options"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
      </span>
    </div>
  )
})

interface FileNodeRowProps {
  name: string
  isSelected: boolean
  isUnsaved: boolean
  isDragOver: boolean
  customIcon?: string
  isRenaming: boolean
  renamingName: string
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onRenameChange: (val: string) => void
  onRenameSubmit: (e: React.FormEvent) => Promise<void>
  onRenameBlur: (e: React.FocusEvent) => void
}

export const FileNodeRow = React.memo(function FileNodeRow({
  name,
  isSelected,
  isUnsaved,
  isDragOver,
  customIcon,
  isRenaming,
  renamingName,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onRenameChange,
  onRenameSubmit,
  onRenameBlur
}: FileNodeRowProps): React.JSX.Element {
  const fileClasses = [
    'tree-node-item group',
    isSelected ? 'active' : '',
    isDragOver ? 'drag-over-file' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={fileClasses}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      draggable={true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <span className="tree-node-left">
        {customIcon ? (
          <span className="tree-node-emoji-icon">{customIcon}</span>
        ) : (
          <ProfessionalFileIcon fileName={name} />
        )}
        {isRenaming ? (
          <InlineRenameInput
            value={renamingName}
            onChange={onRenameChange}
            onSubmit={onRenameSubmit}
            onBlur={onRenameBlur}
          />
        ) : (
          <span className="tree-node-label">{name}</span>
        )}
      </span>
      <span className="tree-node-right flex items-center">
        {isUnsaved && <span className="tree-node-unsaved-dot" title="Unsaved changes" />}
        <button
          type="button"
          className="tree-node-action-btn opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e): void => {
            e.stopPropagation()
            onContextMenu(e)
          }}
          title="Page Options"
        >
          <MoreHorizontal size={12} />
        </button>
      </span>
    </div>
  )
})
