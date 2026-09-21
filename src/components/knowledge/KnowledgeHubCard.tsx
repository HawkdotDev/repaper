import React from 'react'
import { Folder, FolderPlus, ArrowUpRight } from 'lucide-react'
import { ProfessionalFileIcon } from '../../utils/fileIconUtils'

interface FolderCardProps {
  name: string
  path: string
  fileCount?: number
  onClick: () => void
}

export const FolderCard = React.memo(function FolderCard({
  name,
  fileCount = 0,
  onClick
}: FolderCardProps): React.JSX.Element {
  return (
    <div className="hub-folder-card group" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className="hub-folder-icon-wrap">
          <Folder size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
        </div>
        <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
      </div>
      <div>
        <div className="hub-folder-card-title truncate group-hover:text-white transition-colors">
          {name}
        </div>
        <div className="hub-folder-card-subtitle">
          {fileCount} {fileCount === 1 ? 'item' : 'items'}
        </div>
      </div>
    </div>
  )
})

export const AddFolderCard = React.memo(function AddFolderCard({
  onClick
}: {
  onClick: () => void
}): React.JSX.Element {
  return (
    <div className="hub-folder-card add-card group" onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className="hub-folder-icon-wrap subtle">
          <FolderPlus size={16} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </div>
      </div>
      <div>
        <div className="hub-folder-card-title text-zinc-400 group-hover:text-zinc-200">
          New Folder
        </div>
        <div className="hub-folder-card-subtitle">
          Create subfolder
        </div>
      </div>
    </div>
  )
})

interface DocumentRowProps {
  name: string
  path: string
  customIcon?: string
  ext: string
  onSelect: (path: string) => void
}

export const DocumentRow = React.memo(function DocumentRow({
  name,
  path,
  customIcon,
  ext,
  onSelect
}: DocumentRowProps): React.JSX.Element {
  return (
    <tr className="hub-file-row group" onClick={(): void => onSelect(path)}>
      <td className="td-name">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hub-file-icon-wrap shrink-0">
            {customIcon ? (
              <span className="text-[13px]">{customIcon}</span>
            ) : (
              <ProfessionalFileIcon fileName={name} className="scale-[0.9]" />
            )}
          </span>
          <span className="hub-file-name truncate group-hover:text-white transition-colors">
            {name}
          </span>
        </div>
      </td>
      <td className="td-type">
        <span className="hub-format-tag">{ext}</span>
      </td>
      <td className="td-actions text-right">
        <button
          type="button"
          className="hub-row-open-btn opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e): void => {
            e.stopPropagation()
            onSelect(path)
          }}
          title="Open Document"
        >
          <span>Open</span>
          <ArrowUpRight size={12} />
        </button>
      </td>
    </tr>
  )
})
