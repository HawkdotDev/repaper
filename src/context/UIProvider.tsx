import React, { useState, useCallback, useMemo, useContext } from 'react'
import { ViewMode, PersistentAppState } from '../types'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import { useSidebarResize, DEFAULT_SIDEBAR_WIDTH } from '../hooks/useSidebarResize'
import { useFullscreen } from '../hooks/useFullscreen'
import { UIContext, UIContextType } from './UIContext'
import { FileStorageContext } from './FileStorageContext'
import { UserSettings } from '../components/settings/types'

export interface UIProviderProps {
  children: React.ReactNode
  initialViewMode?: ViewMode
  initialSidebarWidth?: number
  initialRightSidebarWidth?: number
  initialAutoSaveEnabled?: boolean
  initialShowRightSidebar?: boolean
  initialShowTabs?: boolean
}

export function UIProvider({
  children,
  initialViewMode = 'editor',
  initialSidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  initialRightSidebarWidth = 220,
  initialAutoSaveEnabled = true,
  initialShowRightSidebar = false,
  initialShowTabs = false
}: UIProviderProps): React.JSX.Element {
  const fileStorage = useContext(FileStorageContext)
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)

  const [localAutoSaveEnabled, setLocalAutoSaveEnabled] = useState<boolean>(() => {
    const userSettings = storageService.getItem<UserSettings | null>(
      STORAGE_KEYS.USER_SETTINGS,
      null
    )
    if (userSettings && typeof userSettings.autoSaveEnabled === 'boolean') {
      return userSettings.autoSaveEnabled
    }
    const appState = storageService.getItem<Partial<PersistentAppState> | null>(
      STORAGE_KEYS.APP_STATE,
      null
    )
    if (appState && typeof appState.autoSaveEnabled === 'boolean') {
      return appState.autoSaveEnabled
    }
    return initialAutoSaveEnabled
  })

  const autoSaveEnabled = fileStorage ? fileStorage.autoSaveEnabled : localAutoSaveEnabled
  const setAutoSaveEnabled = fileStorage ? fileStorage.setAutoSaveEnabled : setLocalAutoSaveEnabled
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true)
  const [isSidebarHoverPeeked, setIsSidebarHoverPeeked] = useState<boolean>(false)
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(initialShowRightSidebar)

  const [showTabs, setShowTabs] = useState<boolean>(() => {
    const saved = storageService.getItem<boolean | null>(STORAGE_KEYS.SHOW_TABS, null)
    return saved !== null ? Boolean(saved) : initialShowTabs
  })

  const [sidebarView, setSidebarView] = useState<'explorer' | 'search'>(() => {
    const saved = storageService.getItem<string>(STORAGE_KEYS.SIDEBAR_VIEW, 'explorer')
    if (saved === 'explorer' || saved === 'search') {
      return saved as 'explorer' | 'search'
    }
    return 'explorer'
  })

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [showQuickSwitcher, setShowQuickSwitcher] = useState<boolean>(false)
  const { isFullScreen, handleToggleFullScreen } = useFullscreen()
  const [isPageLocked, setIsPageLocked] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)

  const [maxUndoHistory, setMaxUndoHistory] = useState<number>(() => {
    return storageService.getItem<number>(STORAGE_KEYS.MAX_UNDO_COUNT, 50)
  })

  const handleTriggerUndo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('oink:undo'))
  }, [])

  const {
    sidebarWidth,
    rightSidebarWidth,
    isResizingLeft,
    isResizingRight,
    startLeftResize,
    startRightResize
  } = useSidebarResize(initialSidebarWidth, initialRightSidebarWidth)

  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean>(() => {
    return storageService.getItem<boolean>(STORAGE_KEYS.WELCOME_DISMISSED, false)
  })
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(false)

  const handleDismissWelcome = useCallback(() => {
    storageService.setItem(STORAGE_KEYS.WELCOME_DISMISSED, true)
    setHasSeenWelcome(true)
    setShowWelcomeGuide(false)
  }, [])

  const handleOpenWelcomeGuide = useCallback(() => {
    setShowWelcomeGuide(true)
  }, [])

  const effectiveSidebarCollapsed = sidebarCollapsed && !isSidebarHoverPeeked

  const value = useMemo<UIContextType>(
    () => ({
      viewMode,
      setViewMode,
      sidebarCollapsed,
      setSidebarCollapsed,
      isSidebarHoverPeeked,
      setIsSidebarHoverPeeked,
      effectiveSidebarCollapsed,
      showRightSidebar,
      setShowRightSidebar,
      showTabs,
      setShowTabs,
      sidebarView,
      setSidebarView,
      sidebarWidth,
      rightSidebarWidth,
      isResizingLeft,
      isResizingRight,
      startLeftResize,
      startRightResize,
      showSettingsModal,
      setShowSettingsModal,
      showQuickSwitcher,
      setShowQuickSwitcher,
      showBannerPicker,
      setShowBannerPicker,
      showWelcomeGuide,
      setShowWelcomeGuide,
      hasSeenWelcome,
      handleDismissWelcome,
      handleOpenWelcomeGuide,
      isFullScreen,
      handleToggleFullScreen,
      isPageLocked,
      setIsPageLocked,
      autoSaveEnabled,
      setAutoSaveEnabled,
      maxUndoHistory,
      setMaxUndoHistory,
      handleTriggerUndo
    }),
    [
      viewMode,
      sidebarCollapsed,
      isSidebarHoverPeeked,
      effectiveSidebarCollapsed,
      showRightSidebar,
      showTabs,
      sidebarView,
      sidebarWidth,
      rightSidebarWidth,
      isResizingLeft,
      isResizingRight,
      startLeftResize,
      startRightResize,
      showSettingsModal,
      showQuickSwitcher,
      showBannerPicker,
      showWelcomeGuide,
      hasSeenWelcome,
      handleDismissWelcome,
      handleOpenWelcomeGuide,
      isFullScreen,
      handleToggleFullScreen,
      isPageLocked,
      autoSaveEnabled,
      maxUndoHistory,
      handleTriggerUndo
    ]
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
