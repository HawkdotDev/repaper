import React, { useMemo, useState, useEffect } from 'react'
import { Maximize2, Minimize2, Mic } from 'lucide-react'
import ShareMenu from './subheader/ShareMenu'
import PageActionsMenu from './subheader/PageActionsMenu'
import { StatusStatsConfig } from '../../types'
import { getRelativePath, normalizePath } from '../../utils/pathUtils'
import { useWorkspaceContext } from '../../context/WorkspaceContext'
import { useFileStorageContext } from '../../context/FileStorageContext'
import { useEditorSettingsContext } from '../../context/EditorSettingsContext'
import { useUIContext } from '../../context/UIContext'

export interface SubHeaderProps {
  workspacePath?: string | null
  workspaceName?: string
  activeFilePath?: string | null
  fileContent?: string
  onOpenWorkspace?: () => void
  autoSaveEnabled?: boolean
  onToggleAutoSave?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
  lastEditedTime?: number | null
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  showBreadcrumbs?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
  editorFontFamily?: string
  onChangeFontFamily?: (family: string) => void
  editorFontSize?: number
  onChangeFontSize?: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (val: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (val: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (val: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (val: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (val: string) => void
  isFullScreen?: boolean
  onToggleFullScreen?: () => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  onOpenAI?: () => void
  onUndo?: () => void
  onImport?: () => void
  onToggleVoiceDictation?: () => void
  isVoiceDictationActive?: boolean
  leadingControl?: React.ReactNode
}

function formatRelativeEditedTime(timestamp?: number | null): string {
  if (!timestamp) return 'Edited recently'
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 10) return 'Edited just now'
  if (diffSeconds < 60) return `Edited ${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `Edited ${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Edited ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `Edited ${diffDays}d ago`
}

function SubHeader(props: SubHeaderProps): React.JSX.Element {
  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()
  const editorSettings = useEditorSettingsContext()
  const ui = useUIContext()

  const workspacePath = props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath
  const activeFilePath = props.activeFilePath !== undefined ? props.activeFilePath : fileStorage.activeFilePath
  const onOpenWorkspace = props.onOpenWorkspace || workspace.handleOpenWorkspace
  const showBreadcrumbs = props.showBreadcrumbs !== undefined
    ? props.showBreadcrumbs
    : (editorSettings.userSettings.showBreadcrumbs ?? true)
  const isFullScreen = props.isFullScreen !== undefined ? props.isFullScreen : ui.isFullScreen
  const onToggleFullScreen = props.onToggleFullScreen || ui.handleToggleFullScreen
  const lastEditedTime = props.lastEditedTime
  const leadingControl = props.leadingControl
  const onCopyLink = props.onCopyLink
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!lastEditedTime) return
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 15000)
    return (): void => clearInterval(timer)
  }, [lastEditedTime])

  const breadcrumbItems = useMemo<{ name: string; isLast: boolean }[]>(() => {
    if (!activeFilePath) return []

    const relPath = workspacePath ? getRelativePath(activeFilePath, workspacePath) : ''

    // If activeFilePath is within workspacePath
    if (workspacePath && relPath && relPath !== normalizePath(activeFilePath)) {
      const parts = relPath.split(/[\\/]/).filter(Boolean)
      const filtered = parts.filter((p) => p.toLowerCase() !== 'workspace')
      return filtered.map((name, idx) => ({
        name,
        isLast: idx === filtered.length - 1
      }))
    }

    // Otherwise, standalone or outside workspace path
    const normalized = normalizePath(activeFilePath)
    const parts = normalized.split('/').filter(Boolean)
    const filtered = parts.filter((p) => p.toLowerCase() !== 'workspace')

    return filtered.map((name, idx) => ({
      name,
      isLast: idx === filtered.length - 1
    }))
  }, [activeFilePath, workspacePath])

  const formattedEditedTime = useMemo(() => {
    if (tick < 0) return ''
    return formatRelativeEditedTime(lastEditedTime)
  }, [lastEditedTime, tick])

  return (
    <div className="app-actions-bar select-none">
      {/* Left Application Navigation Breadcrumbs */}
      <div className="actions-bar-left flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
        {leadingControl}
        {showBreadcrumbs && (
          <div className="nav-breadcrumbs">
            <span
              className="breadcrumb-root-slash"
              title="Workspace root (Click to open local folder)"
              onClick={onOpenWorkspace}
            >
              /
            </span>
            {breadcrumbItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={`breadcrumb-item ${item.isLast ? 'active-file' : 'directory'}`}
                  title={item.name}
                >
                  <span className="truncate max-w-44">{item.name}</span>
                </div>
                {!item.isLast && <span className="breadcrumb-separator">/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Right Toolbar Actions */}
      <div className="actions-bar-right flex items-center gap-2">
        {/* Edited Time Indicator */}
        {activeFilePath && (
          <>
            <span
              className="edited-time-badge"
              title={lastEditedTime ? new Date(lastEditedTime).toLocaleString() : undefined}
            >
              {formattedEditedTime}
            </span>
            <span className="actions-bar-pipe" aria-hidden="true">
              |
            </span>
          </>
        )}

        {/* Voice Narration / Dictation Button */}
        {props.onToggleVoiceDictation && (
          <button
            type="button"
            className={`action-pill-btn w-6.5 h-6.5 p-0 justify-center voice-dictate-btn ${props.isVoiceDictationActive ? 'active' : ''}`}
            onClick={props.onToggleVoiceDictation}
            title={
              props.isVoiceDictationActive
                ? 'Stop Voice Narration (Alt+D / Alt+V)'
                : 'Start Voice Narration (Alt+D / Alt+V)'
            }
          >
            <Mic
              size={14}
              strokeWidth={1.75}
              className={props.isVoiceDictationActive ? 'text-white' : 'text-zinc-300'}
            />
          </button>
        )}

        {/* Selectable Full Screen Icon Button */}
        {onToggleFullScreen && (
          <button
            type="button"
            className={`action-pill-btn w-6.5 h-6.5 p-0 justify-center fullscreen-btn ${isFullScreen ? 'active' : ''}`}
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen (Esc / F11)' : 'Enter Full Screen (F11)'}
          >
            {isFullScreen ? (
              <Minimize2 size={14} strokeWidth={1.75} className="text-zinc-200" />
            ) : (
              <Maximize2 size={14} strokeWidth={1.75} className="text-zinc-300" />
            )}
          </button>
        )}

        {/* Share & Export Dropdown */}
        <ShareMenu
          activeFilePath={activeFilePath}
          onCopyLink={onCopyLink}
          onImport={props.onImport}
          onExportHTML={props.onExportHTML}
          onExportText={props.onExportText}
          onExportMarkdown={props.onExportMarkdown}
        />

        {/* 3-Dots Page Actions Dropdown (includes Text Customisation, Customize Page, Lock Page, etc.) */}
        <PageActionsMenu
          onOpenAI={props.onOpenAI}
          onCopyLink={props.onCopyLink}
          onDuplicateFile={props.onDuplicateFile}
          onDeleteFile={props.onDeleteFile}
        />
      </div>
    </div>
  )
}

export default React.memo(SubHeader)
