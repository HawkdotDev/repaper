import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Eye,
  ChevronDown,
  Layers,
  ListTree,
  Check
} from 'lucide-react'

interface ViewModeMenuProps {
  showTabs?: boolean
  onToggleTabs?: () => void
  showRightSidebar: boolean
  onToggleRightSidebar: () => void
  dropUp?: boolean
  triggerClassName?: string
}

function ViewModeMenu({
  showTabs = false,
  onToggleTabs,
  showRightSidebar,
  onToggleRightSidebar,
  dropUp = false,
  triggerClassName
}: ViewModeMenuProps): React.JSX.Element {
  const [showViewMenu, setShowViewMenu] = useState<boolean>(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (viewMenuRef.current) {
      const rect = viewMenuRef.current.getBoundingClientRect()
      const menuWidth = 280
      let left = dropUp ? rect.left : rect.right - menuWidth
      if (left < 10) left = 10
      if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10

      setMenuPos({
        top: dropUp ? rect.top : rect.bottom + 4,
        left
      })
    }
  }, [dropUp])

  const handleToggleMenu = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (!showViewMenu) updatePos()
    setShowViewMenu((prev) => !prev)
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        viewMenuRef.current &&
        !viewMenuRef.current.contains(e.target as Node)
      ) {
        setShowViewMenu(false)
      }
    }

    const handleScrollOrResize = (): void => {
      if (showViewMenu) setShowViewMenu(false)
    }

    if (showViewMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('resize', handleScrollOrResize)
      window.addEventListener('scroll', handleScrollOrResize, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [showViewMenu])

  return (
    <div className="relative inline-flex items-center" ref={viewMenuRef}>
      <button
        type="button"
        className={
          triggerClassName
            ? `${triggerClassName} ${showViewMenu ? 'active' : ''}`
            : `sub-header-tool-btn ${showViewMenu ? 'active' : ''}`
        }
        onClick={handleToggleMenu}
        title="View Options & Layout"
        aria-label="View Options & Layout"
      >
        {triggerClassName ? (
          <Eye
            size={16}
            strokeWidth={1.75}
            className={showViewMenu ? 'text-zinc-200' : 'text-zinc-500'}
          />
        ) : (
          <>
            <Eye
              size={14}
              strokeWidth={1.75}
              className={showViewMenu ? 'text-zinc-200' : 'text-zinc-400'}
            />
            <ChevronDown
              size={9.5}
              strokeWidth={1.75}
              className={`transition-transform duration-150 ${showViewMenu ? 'rotate-180 text-zinc-200' : 'text-zinc-400'}`}
            />
          </>
        )}
      </button>

      {showViewMenu &&
        menuPos &&
        createPortal(
          <div
            ref={dropdownRef}
            className="widgets-dropdown-menu view-dropdown-menu"
            style={{
              position: 'fixed',
              ...(dropUp
                ? { bottom: `${Math.max(10, window.innerHeight - menuPos.top)}px`, top: 'auto' }
                : { top: `${menuPos.top}px`, bottom: 'auto' }),
              left: `${menuPos.left}px`,
              right: 'auto',
              marginTop: 0,
              zIndex: 99999
            }}
          >
            <div className="widgets-dropdown-header">
              <span className="font-semibold text-zinc-300">View & Layout</span>
            </div>

            <div className="widgets-dropdown-list">
              {/* 1. Toggle Tabs */}
              {onToggleTabs && (
                <div
                  className={`widget-menu-item ${showTabs ? 'selected' : ''}`}
                  onClick={onToggleTabs}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col">
                      <span className="widget-title">Editor Tabs</span>
                      <span className="widget-desc">Show open document tabs</span>
                    </div>
                  </div>
                  <div className={`widget-checkbox ${showTabs ? 'checked' : ''}`}>
                    {showTabs && <Check size={11} />}
                  </div>
                </div>
              )}

              {/* 2. Toggle Document Outline */}
              <div
                className={`widget-menu-item ${showRightSidebar ? 'selected' : ''}`}
                onClick={onToggleRightSidebar}
              >
                <div className="flex items-center gap-2">
                  <ListTree size={13} className="text-zinc-300 shrink-0" />
                  <div className="flex flex-col">
                    <span className="widget-title">Document Outline</span>
                    <span className="widget-desc">Sidebar table of contents</span>
                  </div>
                </div>
                <div className={`widget-checkbox ${showRightSidebar ? 'checked' : ''}`}>
                  {showRightSidebar && <Check size={11} />}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

export default React.memo(ViewModeMenu)
