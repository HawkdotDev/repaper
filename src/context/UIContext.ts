import React, { createContext, useContext } from 'react'
import { ViewMode } from '../types'

export interface UIContextType {
  // Layout & View Mode
  viewMode: ViewMode
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  isSidebarHoverPeeked: boolean
  setIsSidebarHoverPeeked: React.Dispatch<React.SetStateAction<boolean>>
  effectiveSidebarCollapsed: boolean
  showRightSidebar: boolean
  setShowRightSidebar: React.Dispatch<React.SetStateAction<boolean>>
  showTabs: boolean
  setShowTabs: React.Dispatch<React.SetStateAction<boolean>>
  sidebarView: 'explorer' | 'search'
  setSidebarView: React.Dispatch<React.SetStateAction<'explorer' | 'search'>>

  // Sidebar Resize
  sidebarWidth: number
  rightSidebarWidth: number
  isResizingLeft: boolean
  isResizingRight: boolean
  startLeftResize: (e: React.MouseEvent) => void
  startRightResize: (e: React.MouseEvent) => void

  // Modals & Overlays
  showSettingsModal: boolean
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>
  showQuickSwitcher: boolean
  setShowQuickSwitcher: React.Dispatch<React.SetStateAction<boolean>>
  showBannerPicker: boolean
  setShowBannerPicker: React.Dispatch<React.SetStateAction<boolean>>
  showWelcomeGuide: boolean
  setShowWelcomeGuide: React.Dispatch<React.SetStateAction<boolean>>
  hasSeenWelcome: boolean
  handleDismissWelcome: () => void
  handleOpenWelcomeGuide: () => void

  // Controls & Screen
  isFullScreen: boolean
  handleToggleFullScreen: () => void
  isPageLocked: boolean
  setIsPageLocked: React.Dispatch<React.SetStateAction<boolean>>
  autoSaveEnabled: boolean
  setAutoSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>
  maxUndoHistory: number
  setMaxUndoHistory: React.Dispatch<React.SetStateAction<number>>
  handleTriggerUndo: () => void
}

export const UIContext = createContext<UIContextType | null>(null)

export function useUIContext(): UIContextType {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider')
  }
  return context
}
