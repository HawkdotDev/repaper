import React from 'react'
import FileTree from '../../FileTree'
import SidebarSearchView from './SidebarSearchView'
import SidebarEmptyState from './SidebarEmptyState'
import type { SidebarSubTab } from './SidebarHeader'

export type SidebarViewMode = 'explorer' | 'search'

interface SidebarBodyProps {
  activeView: SidebarViewMode
  workspacePath: string | null
  activeFilePath: string | null
  onCreateFileAtRoot?: () => void
  onFileSelect: (filePath: string) => void
  onSelectWithQuery?: (filePath: string, query: string) => void
  fileIcons: Record<string, string>
  onMetadataLoaded: (filePath: string, metadata: { icon?: string; banner?: string }) => void
  onOpenWorkspace: () => void
  onOpenSettings?: () => void
  onSwitchView?: (view: SidebarViewMode) => void
  onSelectSubTab?: (tab: SidebarSubTab) => void
  onOpenDailyNote?: () => void
}

function SidebarBody({
  activeView,
  workspacePath,
  activeFilePath,
  onFileSelect,
  onSelectWithQuery,
  fileIcons,
  onMetadataLoaded,
  onOpenWorkspace,
  onOpenSettings,
  onSwitchView,
  onSelectSubTab,
  onOpenDailyNote
}: SidebarBodyProps): React.JSX.Element {
  void onOpenDailyNote

  if (activeView === 'search') {
    return (
      <SidebarSearchView
        workspacePath={workspacePath || ''}
        activeFilePath={activeFilePath}
        onFileSelect={onFileSelect}
        onSelectWithQuery={onSelectWithQuery}
        fileIcons={fileIcons}
        onBackToExplorer={(): void => {
          onSelectSubTab?.('folders')
          onSwitchView?.('explorer')
        }}
      />
    )
  }

  if (workspacePath) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        <div
          className="sidebar-tree-wrapper flex-1 overflow-y-auto min-h-0"
          onContextMenu={(e): void => {
            if (e.target === e.currentTarget) {
              e.preventDefault()
              window.dispatchEvent(
                new CustomEvent('sidebar-context-menu', {
                  detail: { x: e.clientX, y: e.clientY }
                })
              )
            }
          }}
        >
          <FileTree
            rootPath={workspacePath}
            activeFilePath={activeFilePath}
            onFileSelect={onFileSelect}
            fileIcons={fileIcons}
            onMetadataLoaded={onMetadataLoaded}
            onOpenSettings={onOpenSettings}
          />
        </div>
      </div>
    )
  }

  return <SidebarEmptyState onOpenWorkspace={onOpenWorkspace} />
}

export default React.memo(SidebarBody)
