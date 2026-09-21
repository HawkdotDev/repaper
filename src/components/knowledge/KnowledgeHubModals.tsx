import React from 'react'

interface NewFolderModalProps {
  isOpen: boolean
  folderName: string
  parentFolderName: string
  onChange: (name: string) => void
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function NewFolderModal({
  isOpen,
  folderName,
  parentFolderName,
  onChange,
  onConfirm,
  onClose
}: NewFolderModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-card" onClick={(e): void => e.stopPropagation()}>
        <h3 className="hub-modal-title">New Folder</h3>
        <p className="hub-modal-subtitle">Create a subfolder in {parentFolderName}</p>
        <input
          type="text"
          autoFocus
          placeholder="Folder name"
          value={folderName}
          onChange={(e): void => onChange(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') void onConfirm()
            if (e.key === 'Escape') onClose()
          }}
          className="hub-modal-input"
        />
        <div className="hub-modal-actions flex items-center justify-end gap-2 mt-4">
          <button type="button" className="hub-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="hub-modal-btn confirm" onClick={(): void => void onConfirm()}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

interface NewFileModalProps {
  isOpen: boolean
  fileName: string
  parentFolderName: string
  onChange: (name: string) => void
  onConfirm: () => Promise<void>
  onClose: () => void
}

export function NewFileModal({
  isOpen,
  fileName,
  parentFolderName,
  onChange,
  onConfirm,
  onClose
}: NewFileModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-card" onClick={(e): void => e.stopPropagation()}>
        <h3 className="hub-modal-title">New Note</h3>
        <p className="hub-modal-subtitle">Create a markdown note in {parentFolderName}</p>
        <input
          type="text"
          autoFocus
          placeholder="Note title (e.g. Project Plan)"
          value={fileName}
          onChange={(e): void => onChange(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter') void onConfirm()
            if (e.key === 'Escape') onClose()
          }}
          className="hub-modal-input"
        />
        <div className="hub-modal-actions flex items-center justify-end gap-2 mt-4">
          <button type="button" className="hub-modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="hub-modal-btn confirm" onClick={(): void => void onConfirm()}>
            Create Note
          </button>
        </div>
      </div>
    </div>
  )
}
