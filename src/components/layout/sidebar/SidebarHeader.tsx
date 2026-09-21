import React from 'react'
import {
  SharpHomeIcon,
  SharpFolderIcon,
  SharpGraphIcon
} from '../../icons/SharpIcons'

export type SidebarSubTab = 'home' | 'folders' | 'graph'

interface SidebarHeaderProps {
  activeSubTab?: SidebarSubTab
  onSelectSubTab?: (tab: SidebarSubTab) => void
}

function SidebarHeader({
  activeSubTab = 'folders',
  onSelectSubTab
}: SidebarHeaderProps): React.JSX.Element {
  return (
    <div className="sidebar-header-redesign select-none shrink-0">
      {/* Segmented Switcher: [ Home ] | [ File ] | [ Graph ] */}
      <div className="sidebar-segmented-switcher">
        <button
          type="button"
          className={`switcher-pill-btn ${activeSubTab === 'home' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('home')}
          title="Knowledge Base Home"
        >
          <SharpHomeIcon size={13} />
          <span>Home</span>
        </button>
        <button
          type="button"
          className={`switcher-pill-btn ${activeSubTab === 'folders' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('folders')}
          title="File Tree Explorer"
        >
          <SharpFolderIcon size={13} />
          <span>File</span>
        </button>
        <button
          type="button"
          className={`switcher-pill-btn is-graph ${activeSubTab === 'graph' ? 'active' : ''}`}
          onClick={(): void => onSelectSubTab?.('graph')}
          title="Knowledge Graph"
        >
          <SharpGraphIcon size={13} />
          <span>Graph</span>
        </button>
      </div>
    </div>
  )
}

export default React.memo(SidebarHeader)
