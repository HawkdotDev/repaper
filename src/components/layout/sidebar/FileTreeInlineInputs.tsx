import React from 'react'

interface InlineCreateInputProps {
  creatingType: 'file' | 'folder'
  value: string
  onChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onBlur: () => void
}

export function InlineCreateInput({
  creatingType,
  value,
  onChange,
  onSubmit,
  onBlur
}: InlineCreateInputProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="tree-create-form" onClick={(e): void => e.stopPropagation()}>
      <input
        autoFocus
        className="input-inline"
        type="text"
        value={value}
        placeholder={`New ${creatingType}...`}
        onChange={(e): void => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </form>
  )
}

interface InlineRenameInputProps {
  value: string
  onChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onBlur: (e: React.FocusEvent) => void
}

export function InlineRenameInput({
  value,
  onChange,
  onSubmit,
  onBlur
}: InlineRenameInputProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} onClick={(e): void => e.stopPropagation()}>
      <input
        autoFocus
        className="input-inline"
        type="text"
        value={value}
        onChange={(e): void => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </form>
  )
}
