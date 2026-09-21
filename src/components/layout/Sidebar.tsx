import React from 'react'
import type { ViewMode } from '../../types'
import SidebarHeader, { SidebarSubTab } from './sidebar/SidebarHeader'
import SidebarBody from './sidebar/SidebarBody'
import SidebarFooter from './sidebar/SidebarFooter'
import type { SidebarViewMode } from './sidebar/SidebarBody'
import { useWorkspaceContext } from '../../context/WorkspaceContext'
import { useFileStorageContext } from '../../context/FileStorageContext'
import { useUIContext } from '../../context/UIContext'
import { useTheme } from '../../hooks/useTheme'

export type { SidebarViewMode, SidebarSubTab }

export interface SidebarProps {
  activeView?: SidebarViewMode
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  isResizing?: boolean
  workspacePath?: string | null
  activeFilePath?: string | null
  onFileSelect?: (filePath: string) => void
  onSelectWithQuery?: (filePath: string, query: string) => void
  onCreateFileAtRoot?: () => void
  onOpenWorkspace?: () => void
  fileIcons?: Record<string, string>
  onMetadataLoaded?: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onStartResize?: (e: React.MouseEvent) => void
  onOpenSettings?: () => void
  onSwitchView?: (view: SidebarViewMode) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  viewMode?: ViewMode
  onSwitchToHome?: () => void
  onSwitchToFiles?: () => void
  onSwitchToGraph?: () => void
  topHeader?: React.ReactNode
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar?: boolean
  onToggleRightSidebar?: () => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
  isLight?: boolean
  onToggleTheme?: () => void
  onOpenDailyNote?: () => void
}

function Sidebar(props: SidebarProps): React.JSX.Element {
  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()
  const ui = useUIContext()
  const theme = useTheme()

  const activeView = props.activeView !== undefined ? props.activeView : ui.sidebarView
  const sidebarCollapsed = props.sidebarCollapsed !== undefined ? props.sidebarCollapsed : ui.effectiveSidebarCollapsed
  const sidebarWidth = props.sidebarWidth !== undefined ? props.sidebarWidth : ui.sidebarWidth
  const isResizing = props.isResizing !== undefined ? props.isResizing : ui.isResizingLeft
  const workspacePath = props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath
  const activeFilePath = props.activeFilePath !== undefined ? props.activeFilePath : fileStorage.activeFilePath
  const onFileSelect = props.onFileSelect || fileStorage.handleFileSelect
  const onCreateFileAtRoot = props.onCreateFileAtRoot || fileStorage.handleCreateFileAtRoot
  const onOpenWorkspace = props.onOpenWorkspace || workspace.handleOpenWorkspace
  const fileIcons = props.fileIcons !== undefined ? props.fileIcons : fileStorage.fileIcons
  const onStartResize = props.onStartResize || ui.startLeftResize
  const viewMode = props.viewMode !== undefined ? props.viewMode : ui.viewMode
  const showTabs = props.showTabs !== undefined ? props.showTabs : ui.showTabs
  const showRightSidebar = props.showRightSidebar !== undefined ? props.showRightSidebar : ui.showRightSidebar
  const isLight = props.isLight !== undefined ? props.isLight : theme.isLight
  const onToggleTheme = props.onToggleTheme || theme.toggleTheme
  const onOpenSettings = props.onOpenSettings || (() => ui.setShowSettingsModal(true))
  const onSwitchView = props.onSwitchView || ui.setSidebarView

  const onToggleTabs = props.onToggleTabs || (() => ui.setShowTabs((prev) => !prev))
  const onToggleRightSidebar = props.onToggleRightSidebar || (() => ui.setShowRightSidebar((prev) => !prev))

  const onSwitchToHome = props.onSwitchToHome || (() => {
    fileStorage.setActiveFilePath(null)
    ui.setViewMode('editor')
  })
  const onSwitchToFiles = props.onSwitchToFiles || (() => ui.setViewMode('editor'))
  const onSwitchToGraph = props.onSwitchToGraph || (() => ui.setViewMode('graph'))

  const onMetadataLoaded = props.onMetadataLoaded || ((filePath: string, metadata: { icon?: string; banner?: string }) => {
    if (metadata.icon) fileStorage.handleSetFileIcon(filePath, metadata.icon)
    if (metadata.banner) fileStorage.handleSetFileBanner(filePath, metadata.banner)
  })

  const activeSubTab: SidebarSubTab =
    viewMode === 'graph'
      ? 'graph'
      : viewMode === 'editor' && !activeFilePath
        ? 'home'
        : 'folders'

  const handleSelectSubTab = (tab: SidebarSubTab): void => {
    if (tab === 'home') {
      if (activeView === 'search') onSwitchView('explorer')
      onSwitchToHome()
    } else if (tab === 'graph') {
      if (activeView === 'search') onSwitchView('explorer')
      onSwitchToGraph()
    } else {
      if (activeView === 'search') onSwitchView('explorer')
      onSwitchToFiles()
    }
  }

  const handleToggleSearch = (): void => {
    if (activeView === 'search') {
      onSwitchView('explorer')
    } else {
      onSwitchView('search')
    }
  }

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'is-collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}
      style={{
        width: sidebarCollapsed ? 0 : `${sidebarWidth}px`
      }}
      aria-hidden={sidebarCollapsed}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <div
        className="sidebar-content flex flex-col h-full min-w-0 relative"
        style={{
          width: `${sidebarWidth}px`,
          minWidth: `${sidebarWidth}px`
        }}
      >
        {/* Top Header Controls (same level as tabs bar) */}
        {props.topHeader && (
          <div
            className="sidebar-top-header flex items-center shrink-0"
            onDoubleClick={(): void => window.api?.window?.maximize?.()}
          >
            {props.topHeader}
          </div>
        )}

        {/* Top Action Row: SubTab Switcher (Home / Folders / Search) */}
        <SidebarHeader activeSubTab={activeSubTab} onSelectSubTab={handleSelectSubTab} />

        {/* Main Body Area: Tree or Search View */}
        <SidebarBody
          activeView={activeView}
          workspacePath={workspacePath}
          activeFilePath={activeFilePath}
          onCreateFileAtRoot={onCreateFileAtRoot}
          onFileSelect={onFileSelect}
          onSelectWithQuery={props.onSelectWithQuery}
          fileIcons={fileIcons}
          onMetadataLoaded={onMetadataLoaded}
          onOpenWorkspace={onOpenWorkspace}
          onOpenSettings={onOpenSettings}
          onSwitchView={onSwitchView}
          onSelectSubTab={handleSelectSubTab}
          onOpenDailyNote={props.onOpenDailyNote}
        />

        {/* Bottom Pinned Footer: View Mode Menu + Search + Theme Button + Notifications + Settings */}
        <SidebarFooter
          activeView={activeView}
          onToggleSearch={handleToggleSearch}
          showTabs={showTabs}
          onToggleTabs={onToggleTabs}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={onToggleRightSidebar}
          isLight={isLight}
          onToggleTheme={onToggleTheme}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Resize handle bar */}
      {!sidebarCollapsed && (
        <div
          className={`sidebar-resizer ${isResizing ? 'is-active' : ''}`}
          onMouseDown={onStartResize}
        />
      )}
    </aside>
  )
}

export default React.memo(Sidebar)
