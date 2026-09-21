import React from 'react'
import { Search, Moon, Sun, Settings2 } from 'lucide-react'
import HelpMenu from '../subheader/HelpMenu'
import ViewModeMenu from '../subheader/ViewModeMenu'
import NotificationsMenu from '../subheader/NotificationsMenu'
import type { SidebarViewMode } from './SidebarBody'

interface SidebarFooterProps {
  activeView?: SidebarViewMode
  onToggleSearch?: () => void
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar?: boolean
  onToggleRightSidebar?: () => void
  isLight?: boolean
  onToggleTheme?: () => void
  onOpenSettings?: () => void
}

function SidebarFooter({
  activeView,
  onToggleSearch,
  showTabs = false,
  onToggleTabs,
  showRightSidebar = false,
  onToggleRightSidebar = (): void => {},
  isLight = false,
  onToggleTheme,
  onOpenSettings
}: SidebarFooterProps): React.JSX.Element {
  return (
    <div className="sidebar-footer-dock">
      {/* Workspace Tools Group */}
      <div className="sidebar-footer-group">
        <ViewModeMenu
          dropUp
          triggerClassName="sidebar-footer-btn"
          showTabs={showTabs}
          onToggleTabs={onToggleTabs}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={onToggleRightSidebar}
        />

        {onToggleSearch && (
          <button
            type="button"
            className={`sidebar-footer-btn ${activeView === 'search' ? 'active' : ''}`}
            onClick={onToggleSearch}
            title={activeView === 'search' ? 'Close Search' : 'Search Workspace (Ctrl+Shift+F)'}
            aria-label="Search Workspace"
          >
            <Search size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="sidebar-footer-separator" />

      {/* System Controls Group */}
      <div className="sidebar-footer-group">
        {onToggleTheme && (
          <button
            type="button"
            className="sidebar-footer-btn"
            onClick={onToggleTheme}
            title={isLight ? 'Switch to Dark Theme (Ctrl+Shift+L)' : 'Switch to Light Theme (Ctrl+Shift+L)'}
            aria-label="Toggle Color Theme"
          >
            {isLight ? (
              <Moon size={16} strokeWidth={1.75} />
            ) : (
              <Sun size={17} strokeWidth={1.6} />
            )}
          </button>
        )}

        <NotificationsMenu dropUp buttonClassName="sidebar-footer-btn" />

        <HelpMenu
          onOpenSettings={onOpenSettings}
          dropUp
          triggerClassName="sidebar-footer-btn"
          menuClassName="sidebar-help-menu"
        />

        <button
          type="button"
          className="sidebar-footer-btn"
          onClick={onOpenSettings}
          title="Settings & Preferences"
          aria-label="Settings"
        >
          <Settings2 size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}

export default React.memo(SidebarFooter)
