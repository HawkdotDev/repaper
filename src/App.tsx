import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react'
import { Minimize2, Image, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import BlockEditor from './components/BlockEditor'
import NotionPageHeader from './components/editor/NotionPageHeader'
import InDocumentFindBar from './components/editor/InDocumentFindBar'
import VoiceDictationBar from './components/editor/VoiceDictationBar'
import WelcomeScreen from './components/WelcomeScreen'
import KnowledgeHubView from './components/KnowledgeHubView'
import TopHeader from './components/layout/TopHeader'
import SubHeader from './components/layout/SubHeader'
import Sidebar from './components/layout/Sidebar'
import TabBar from './components/layout/TabBar'
import OutlinePanel from './components/layout/OutlinePanel'
import StatusBar from './components/layout/StatusBar'
import { ErrorBoundary } from './components/ErrorBoundary'

const GraphView = lazy(() => import('./components/GraphView'))
const SettingsModal = lazy(() => import('./components/SettingsModal'))
const BannerPicker = lazy(() => import('./components/BannerPicker'))
const QuickSwitcherModal = lazy(() => import('./components/QuickSwitcherModal'))

import { MarkdownMetadata } from './types'
import { normalizePath, getRelativePath } from './utils/pathUtils'
import { metadataEngine } from './utils/metadataEngine'
import { storageService, STORAGE_KEYS } from './services/storageService'
import { notificationService } from './services/notificationService'
import { UserSettings, DEFAULT_USER_SETTINGS } from './components/settings/types'

import { usePersistentState } from './hooks/usePersistentState'
import { useIndexerWorker } from './hooks/useIndexerWorker'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useDocumentExport } from './hooks/useDocumentExport'
import { useWikilinkNavigation } from './hooks/useWikilinkNavigation'
import { useTheme } from './hooks/useTheme'
import { DEFAULT_SIDEBAR_WIDTH } from './hooks/useSidebarResize'

import {
  WorkspaceProvider,
  useWorkspaceContext,
  FileStorageProvider,
  useFileStorageContext,
  EditorSettingsProvider,
  useEditorSettingsContext,
  UIProvider,
  useUIContext
} from './context'

function AppLayout(): React.JSX.Element {
  const { themeMode, isLight, setThemeMode, toggleTheme } = useTheme()
  const { saveState } = usePersistentState()

  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()
  const editorSettings = useEditorSettingsContext()
  const ui = useUIContext()

  const { workspacePath, workspaceName, handleOpenWorkspace, handleSwitchWorkspace } = workspace

  const {
    activeFilePath,
    setActiveFilePath,
    openFiles,
    setOpenFiles,
    fileContents,
    setFileContents,
    fileIcons,
    fileBanners,
    setFileIcons,
    setFileBanners,
    setFileMetadataMap,
    activeRelKey,
    handleFileSelect,
    handleTabClose,
    handleSaveActiveFile,
    handleSetFileIcon,
    handleSetFileBanner,
    handleRenameActiveFile,
    handleCreateFileAtRoot,
    resetAllFileStates
  } = fileStorage

  const {
    editorFontFamily,
    editorFontSize,
    editorLineHeight,
    editorLetterSpacing,
    editorParagraphSpacing,
    editorFontWeight,
    editorTextAlign,
    handleFontFamilyChange,
    handleFontSizeChange,
    userSettings,
    setUserSettings,
    globalShowFileName,
    setGlobalShowFileName,
    effectiveShowCover,
    effectiveShowIcon,
    effectiveShowFileName,
    handleToggleFileName
  } = editorSettings

  const {
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    isSidebarHoverPeeked,
    setIsSidebarHoverPeeked,
    showRightSidebar,
    setShowRightSidebar,
    showTabs,
    sidebarView,
    setSidebarView,
    sidebarWidth,
    rightSidebarWidth,
    isResizingRight,
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
    autoSaveEnabled,
    setAutoSaveEnabled,
    maxUndoHistory,
    setMaxUndoHistory
  } = ui

  // In-Document Find Bar state
  const [showFindBar, setShowFindBar] = useState<boolean>(false)
  const [findBarInitialQuery, setFindBarInitialQuery] = useState<string>('')

  // Voice Dictation & Narration state
  const [showVoiceDictation, setShowVoiceDictation] = useState<boolean>(false)

  const handleToggleVoiceDictation = useCallback((): void => {
    setShowVoiceDictation((prev) => !prev)
  }, [])

  // Network connection status notifications
  useEffect(() => {
    let wasOffline = !navigator.onLine
    const handleOnline = (): void => {
      if (wasOffline) {
        notificationService.addNotification({
          title: 'Back Online',
          description: 'Internet connection restored. Offline changes are secured.',
          type: 'system'
        })
      }
      wasOffline = false
    }
    const handleOffline = (): void => {
      wasOffline = true
      notificationService.addNotification({
        title: 'Offline Mode Active',
        description: 'Working offline. All notes are saved to your local storage.',
        type: 'system'
      })
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Multithreaded Background Indexer
  const { stats: workerStats, headings: workerHeadings } = useIndexerWorker(
    activeFilePath ? fileContents[activeFilePath] : ''
  )

  // Sidebar Hover Peek Interaction
  const hoverLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringButtonRef = useRef(false)
  const isHoveringSidebarRef = useRef(false)

  const clearHoverTimeout = useCallback(() => {
    if (hoverLeaveTimeoutRef.current) {
      clearTimeout(hoverLeaveTimeoutRef.current)
      hoverLeaveTimeoutRef.current = null
    }
  }, [])

  const scheduleHoverLeave = useCallback(() => {
    clearHoverTimeout()
    hoverLeaveTimeoutRef.current = setTimeout(() => {
      if (!isHoveringButtonRef.current && !isHoveringSidebarRef.current) {
        setIsSidebarHoverPeeked(false)
      }
    }, 250)
  }, [clearHoverTimeout, setIsSidebarHoverPeeked])

  const handleButtonHoverEnter = useCallback((): void => {
    clearHoverTimeout()
    isHoveringButtonRef.current = true
    if (sidebarCollapsed) {
      setIsSidebarHoverPeeked(true)
    }
  }, [clearHoverTimeout, sidebarCollapsed, setIsSidebarHoverPeeked])

  const handleButtonHoverLeave = useCallback((): void => {
    isHoveringButtonRef.current = false
    scheduleHoverLeave()
  }, [scheduleHoverLeave])

  const handleSidebarHoverEnter = useCallback((): void => {
    clearHoverTimeout()
    isHoveringSidebarRef.current = true
    if (sidebarCollapsed) {
      setIsSidebarHoverPeeked(true)
    }
  }, [clearHoverTimeout, sidebarCollapsed, setIsSidebarHoverPeeked])

  const handleSidebarHoverLeave = useCallback((): void => {
    isHoveringSidebarRef.current = false
    scheduleHoverLeave()
  }, [scheduleHoverLeave])

  const handleToggleSidebar = useCallback((): void => {
    clearHoverTimeout()
    isHoveringButtonRef.current = false
    isHoveringSidebarRef.current = false
    setIsSidebarHoverPeeked(false)
    setSidebarCollapsed((p) => !p)
  }, [clearHoverTimeout, setIsSidebarHoverPeeked, setSidebarCollapsed])

  useEffect(() => {
    return () => {
      if (hoverLeaveTimeoutRef.current) {
        clearTimeout(hoverLeaveTimeoutRef.current)
      }
    }
  }, [])

  const effectiveSidebarCollapsed = sidebarCollapsed && !isSidebarHoverPeeked

  const handleToggleSearch = useCallback(() => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
      setSidebarView('search')
    } else if (sidebarView === 'search') {
      setSidebarView('explorer')
    } else {
      setSidebarView('search')
    }
  }, [sidebarCollapsed, sidebarView, setSidebarCollapsed, setSidebarView])

  const handleSwitchToFiles = useCallback(() => {
    setViewMode('editor')
    setSidebarView('explorer')
    if (sidebarCollapsed) {
      setSidebarCollapsed(false)
    }
    if (!activeFilePath && openFiles.length > 0) {
      void handleFileSelect(openFiles[0].path)
    }
  }, [
    sidebarCollapsed,
    activeFilePath,
    openFiles,
    setViewMode,
    setSidebarView,
    setSidebarCollapsed,
    handleFileSelect
  ])

  // Workspace actions
  const onOpenWorkspaceClick = useCallback(async () => {
    const newPath = await handleOpenWorkspace()
    if (newPath) {
      handleDismissWelcome()
      resetAllFileStates()
    }
  }, [handleOpenWorkspace, handleDismissWelcome, resetAllFileStates])

  const onSwitchWorkspaceClick = useCallback(
    (path: string, name?: string) => {
      const newPath = handleSwitchWorkspace(path, name)
      if (newPath) {
        resetAllFileStates()
      }
    },
    [handleSwitchWorkspace, resetAllFileStates]
  )

  const handleToggleOnlyThisFile = useCallback(() => {
    if (!activeFilePath || !workspacePath) return
    const rel = getRelativePath(activeFilePath, workspacePath)
    const relKey = rel.toLowerCase()

    setFileMetadataMap((prev) => {
      const current = prev[relKey] || {}
      const currentlyOnlyThisFile =
        current.showCover !== undefined ||
        current.showIcon !== undefined ||
        current.showFileName !== undefined

      const nextMeta = { ...current }
      if (currentlyOnlyThisFile) {
        delete nextMeta.showCover
        delete nextMeta.showIcon
        delete nextMeta.showFileName
        metadataEngine.clearFileOverrides(rel)
      } else {
        nextMeta.showCover = effectiveShowCover
        nextMeta.showIcon = effectiveShowIcon
        nextMeta.showFileName = effectiveShowFileName
        metadataEngine.setShowCover(rel, effectiveShowCover)
        metadataEngine.setShowIcon(rel, effectiveShowIcon)
        metadataEngine.setShowFileName(rel, effectiveShowFileName)
      }
      return { ...prev, [relKey]: nextMeta }
    })

    setTimeout(() => {
      void handleSaveActiveFile()
    }, 50)
  }, [
    activeFilePath,
    workspacePath,
    effectiveShowCover,
    effectiveShowIcon,
    effectiveShowFileName,
    setFileMetadataMap,
    handleSaveActiveFile
  ])

  const handleMetadataLoaded = useCallback(
    (filePath: string, metadata: MarkdownMetadata): void => {
      const rel = getRelativePath(filePath, workspacePath)
      const relKey = rel.toLowerCase()
      if (metadata.icon) {
        setFileIcons((prev) => ({ ...prev, [relKey]: metadata.icon! }))
      }
      if (metadata.banner) {
        setFileBanners((prev) => ({ ...prev, [relKey]: metadata.banner! }))
      }
      setFileMetadataMap((prev) => ({
        ...prev,
        [relKey]: { ...prev[relKey], ...metadata }
      }))
    },
    [workspacePath, setFileIcons, setFileBanners, setFileMetadataMap]
  )

  const handleOpenDailyNote = useCallback(async (): Promise<void> => {
    if (!workspacePath) return
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const dailyNotesDir = `${workspacePath}/Daily Notes`
    const dailyNotePath = `${dailyNotesDir}/${dateStr}.md`

    try {
      const exists = window.api.fs.exists
        ? await window.api.fs.exists(dailyNotePath)
        : await window.api.fs
            .readFile(dailyNotePath)
            .then(() => true)
            .catch(() => false)
      if (!exists) {
        await window.api.fs.createFolder(workspacePath, 'Daily Notes').catch(() => {})
        const initialContent = `# Daily Note: ${dateStr}\n\n## Tasks\n- [ ] \n\n## Notes\n\n`
        await window.api.fs.writeFile(dailyNotePath, initialContent)
      }
      await handleFileSelect(dailyNotePath)
    } catch (err) {
      console.error('Failed to create/open daily note:', err)
    }
  }, [workspacePath, handleFileSelect])

  // Wikilink Navigation Hook
  const { handleWikilinkClick } = useWikilinkNavigation({
    workspacePath,
    handleFileSelect
  })

  // Document Exports & Utilities Hook
  const {
    handleExportHTML,
    handleExportText,
    handleExportMarkdown,
    handleCopyLink,
    handleImportFile
  } = useDocumentExport({
    activeFilePath,
    fileContents,
    editorFontFamily,
    editorFontSize,
    workspacePath,
    handleFileSelect,
    isLight
  })

  // Global Keyboard Shortcuts Hook
  useGlobalShortcuts({
    isFullScreen,
    activeFilePath,
    onSaveActiveFile: (): void => {
      void handleSaveActiveFile()
    },
    onOpenWorkspace: (): void => {
      void onOpenWorkspaceClick()
    },
    onCreateFileAtRoot: (): void => {
      void handleCreateFileAtRoot()
    },
    onCloseActiveTab: handleTabClose,
    onToggleFullScreen: handleToggleFullScreen,
    onToggleSearch: handleToggleSearch,
    onToggleQuickSwitcher: (): void => setShowQuickSwitcher((prev) => !prev),
    onToggleFindInDocument: (): void => {
      if (activeFilePath) {
        setShowFindBar((prev) => !prev)
      }
    },
    onToggleVoiceDictation: (): void => {
      if (activeFilePath) {
        handleToggleVoiceDictation()
      }
    },
    onToggleSettings: (): void => setShowSettingsModal((prev) => !prev),
    onToggleTheme: toggleTheme
  })

  // State Persistence Sync
  useEffect(() => {
    saveState({
      workspacePath,
      workspaceName,
      activeFilePath,
      openFiles,
      viewMode,
      autoSaveEnabled,
      sidebarCollapsed,
      sidebarWidth,
      showRightSidebar,
      rightSidebarWidth,
      showTabs
    })

    if (workspacePath) {
      metadataEngine.setWorkspaceInfo({ name: workspaceName })
      metadataEngine.setSessionState({
        activeFilePath,
        openFiles,
        viewMode,
        autoSaveEnabled,
        sidebarCollapsed,
        sidebarWidth,
        showRightSidebar,
        rightSidebarWidth
      })
    }
  }, [
    workspacePath,
    workspaceName,
    activeFilePath,
    openFiles,
    viewMode,
    autoSaveEnabled,
    sidebarCollapsed,
    sidebarWidth,
    showRightSidebar,
    rightSidebarWidth,
    showTabs,
    saveState
  ])

  const handleSwitchToHome = useCallback(() => {
    setActiveFilePath(null)
    setViewMode('editor')
    setSidebarView('explorer')
    setShowWelcomeGuide(false)
  }, [setActiveFilePath, setViewMode, setSidebarView, setShowWelcomeGuide])

  const handleSwitchToGraph = useCallback(() => {
    setViewMode('graph')
  }, [setViewMode])

  const activeFileIcon = activeFilePath ? fileIcons[activeRelKey] : undefined
  const activeFileBanner = activeFilePath ? fileBanners[activeRelKey] : undefined
  const hasTabs = viewMode !== 'graph' && showTabs && openFiles.length > 0

  return (
    <div className={`app-container ${isFullScreen ? 'distraction-free-fullscreen' : ''}`}>
      {/* Floating Exit Fullscreen Button in Distraction-Free Mode */}
      {isFullScreen && (
        <div className="fullscreen-exit-wrapper">
          <button
            type="button"
            className="exit-fullscreen-floating-btn"
            onClick={handleToggleFullScreen}
            title="Exit Full Screen (Esc / F11)"
          >
            <Minimize2 size={13} />
            <span>Exit Full Screen</span>
          </button>
        </div>
      )}

      {/* ====== 1. MAIN APP CONTENT CONTAINER ====== */}
      <div className="app-main flex flex-1 min-h-0 min-w-0 overflow-hidden relative">
        {/* Stationary Sidebar Toggle Button */}
        <button
          type="button"
          className={`fixed-sidebar-toggle-btn w-6.5 h-6.5 p-0 justify-center ${!effectiveSidebarCollapsed ? 'active' : ''}`}
          onClick={handleToggleSidebar}
          onMouseEnter={handleButtonHoverEnter}
          onMouseLeave={handleButtonHoverLeave}
          title={effectiveSidebarCollapsed ? 'Open Sidebar (Ctrl+B)' : 'Close Sidebar (Ctrl+B)'}
          aria-label={effectiveSidebarCollapsed ? 'Open Sidebar' : 'Close Sidebar'}
        >
          {effectiveSidebarCollapsed ? (
            <PanelLeftOpen size={22} strokeWidth={1.4} className="text-zinc-400" />
          ) : (
            <PanelLeftClose size={22} strokeWidth={1.4} className="text-zinc-200" />
          )}
        </button>

        {/* Sidebar Panel */}
        <Sidebar
          sidebarCollapsed={effectiveSidebarCollapsed}
          topHeader={<TopHeader />}
          onMetadataLoaded={handleMetadataLoaded}
          onMouseEnter={handleSidebarHoverEnter}
          onMouseLeave={handleSidebarHoverLeave}
          onSwitchToHome={handleSwitchToHome}
          onSwitchToFiles={handleSwitchToFiles}
          onSwitchToGraph={handleSwitchToGraph}
          onOpenDailyNote={handleOpenDailyNote}
          onToggleOnlyThisFile={handleToggleOnlyThisFile}
          onSelectWithQuery={(filePath, query): void => {
            void handleFileSelect(filePath)
            setFindBarInitialQuery(query)
            setShowFindBar(true)
          }}
        />

        {/* Editor Workspace & Split Area */}
        <div className={`editor-workspace ${effectiveSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {hasTabs && (
            <div
              className="editor-top-nav flex items-stretch"
              onDoubleClick={(): void => window.api?.window?.maximize?.()}
            >
              <div
                className="collapsed-sidebar-spacer shrink-0 overflow-hidden"
                style={{
                  width: effectiveSidebarCollapsed ? '40px' : '0px',
                  transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                aria-hidden="true"
              />

              <TabBar />
            </div>
          )}

          {/* SubHeader Actions & Breadcrumbs */}
          {activeFilePath && viewMode !== 'graph' && (
            <SubHeader
              leadingControl={
                !hasTabs ? (
                  <div
                    className="collapsed-sidebar-spacer shrink-0 overflow-hidden"
                    style={{
                      width: effectiveSidebarCollapsed ? '40px' : '0px',
                      transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    aria-hidden="true"
                  />
                ) : undefined
              }
              onExportHTML={(): void => void handleExportHTML()}
              onExportText={(): void => void handleExportText()}
              onExportMarkdown={(): void => void handleExportMarkdown()}
              onCopyLink={handleCopyLink}
              onImport={(): void => void handleImportFile()}
              onToggleVoiceDictation={handleToggleVoiceDictation}
              isVoiceDictationActive={showVoiceDictation}
            />
          )}

          <div className="editor-center-split">
            {viewMode === 'graph' ? (
              <ErrorBoundary fallbackTitle="Failed to load Graph View">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center flex-1 text-zinc-500 text-xs italic">
                      Loading...
                    </div>
                  }
                >
                  <GraphView
                    workspacePath={workspacePath || ''}
                    onNodeClick={(nodeId): void => void handleFileSelect(nodeId)}
                    onClose={(): void => setViewMode('editor')}
                  />
                </Suspense>
              </ErrorBoundary>
            ) : activeFilePath ? (
              <div className="editor-writing-viewport">
                <div
                  className="editor-container"
                  style={
                    {
                      '--editor-font-family': editorFontFamily,
                      '--editor-font-size': `${editorFontSize}px`,
                      '--editor-line-height': editorLineHeight,
                      '--editor-letter-spacing': editorLetterSpacing,
                      '--editor-paragraph-spacing': editorParagraphSpacing,
                      '--editor-font-weight': editorFontWeight,
                      '--editor-text-align': editorTextAlign
                    } as React.CSSProperties
                  }
                >
                  {/* Notion-style Full-Width Cover Banner */}
                  {effectiveShowCover && activeFileBanner && (
                    <div
                      className="notion-cover-banner group"
                      style={{
                        height: `${userSettings.coverBannerHeight || 200}px`,
                        ...(activeFileBanner.startsWith('linear-gradient')
                          ? { background: activeFileBanner }
                          : {
                              backgroundImage: `url("${activeFileBanner}")`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                              backgroundRepeat: 'no-repeat'
                            })
                      }}
                    >
                      <div
                        className={`notion-cover-actions ${showBannerPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                      >
                        <div className="relative">
                          <button
                            className="notion-cover-btn"
                            onClick={(): void => setShowBannerPicker((prev) => !prev)}
                          >
                            <Image size={12} strokeWidth={1.75} className="shrink-0 opacity-80" />
                            <span>Change cover</span>
                          </button>

                          {showBannerPicker && (
                            <Suspense fallback={null}>
                              <BannerPicker
                                onSelect={(bannerUrl): void => {
                                  if (activeRelKey) handleSetFileBanner(activeRelKey, bannerUrl)
                                  setShowBannerPicker(false)
                                }}
                                onClose={(): void => setShowBannerPicker(false)}
                              />
                            </Suspense>
                          )}
                        </div>

                        <button
                          className="notion-cover-btn"
                          onClick={(): void => {
                            if (!activeRelKey) return
                            handleSetFileBanner(activeRelKey, null)
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`editor-wrapper ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''}`}
                  >
                    {/* Floating In-Document Find Bar */}
                    {showFindBar && (
                      <InDocumentFindBar
                        containerSelector=".editor-wrapper"
                        initialQuery={findBarInitialQuery}
                        onClose={(): void => {
                          setShowFindBar(false)
                          setFindBarInitialQuery('')
                        }}
                      />
                    )}

                    {/* Notion-style Page Header */}
                    <NotionPageHeader
                      activeFilePath={activeFilePath}
                      workspacePath={workspacePath}
                      effectiveShowCover={effectiveShowCover}
                      effectiveShowIcon={effectiveShowIcon}
                      effectiveShowFileName={effectiveShowFileName}
                      activeFileBanner={activeFileBanner}
                      activeFileIcon={activeFileIcon}
                      isPageLocked={isPageLocked}
                      onSetFileIcon={handleSetFileIcon}
                      onSetFileBanner={handleSetFileBanner}
                      onRenameActiveFile={handleRenameActiveFile}
                      onToggleFileName={handleToggleFileName}
                    />

                    <ErrorBoundary fallbackTitle="Failed to load Editor">
                      <BlockEditor
                        value={fileContents[activeFilePath] || ''}
                        readOnly={isPageLocked}
                        workspacePath={workspacePath}
                        maxUndoHistory={maxUndoHistory}
                        onChange={(value): void => {
                          if (activeFilePath) {
                            const norm = normalizePath(activeFilePath)
                            setFileContents((prev) => ({
                              ...prev,
                              [activeFilePath]: value,
                              [norm]: value
                            }))
                          }
                        }}
                        activeFilePath={activeFilePath}
                        onWikilinkClick={handleWikilinkClick}
                        spellcheck={userSettings.spellcheck}
                        wordWrap={userSettings.wordWrap}
                        tabSize={userSettings.tabSize}
                      />
                    </ErrorBoundary>
                  </div>
                </div>

                {/* Floating Voice Dictation Bar (at same vertical level as StatusBar) */}
                {showVoiceDictation && (
                  <VoiceDictationBar onClose={(): void => setShowVoiceDictation(false)} />
                )}

                {/* Floating Stats & Autosave Pill */}
                {userSettings.showStatusBar && <StatusBar stats={workerStats} />}
              </div>
            ) : (
              <KnowledgeHubView
                workspacePath={workspacePath}
                workspaceName={workspaceName}
                onFileSelect={(f): void => {
                  void handleFileSelect(f)
                }}
                onCreateFileAtRoot={(): void => {
                  void handleCreateFileAtRoot()
                }}
                onOpenWorkspace={(): void => {
                  void onOpenWorkspaceClick()
                }}
                fileIcons={fileIcons}
                onOpenWelcomeGuide={handleOpenWelcomeGuide}
                isLight={isLight}
                onToggleTheme={toggleTheme}
              />
            )}

            {/* ====== FIRST-LAUNCH / GUIDE FLOATING TOAST NOTIFICATION ====== */}
            {(!hasSeenWelcome || showWelcomeGuide) && (
              <WelcomeScreen
                workspacePath={workspacePath}
                workspaceName={workspaceName}
                isFirstTime={!hasSeenWelcome}
                onFileSelect={(f): void => {
                  handleDismissWelcome()
                  void handleFileSelect(f)
                }}
                onCreateFileAtRoot={(): void => {
                  handleDismissWelcome()
                  void handleCreateFileAtRoot()
                }}
                onStartInBrowser={(): void => {
                  handleDismissWelcome()
                  if (workspacePath !== '/workspace') {
                    onSwitchWorkspaceClick('/workspace', 'Browser Storage')
                  }
                  void (async (): Promise<void> => {
                    const untitledPath = '/workspace/Untitled.md'
                    try {
                      const exists = window.api?.fs?.exists
                        ? await window.api.fs.exists(untitledPath)
                        : false
                      if (!exists && window.api?.fs?.writeFile) {
                        await window.api.fs.writeFile(untitledPath, '')
                      }
                    } catch (e) {
                      console.error('Failed to ensure Untitled.md exists:', e)
                    }
                    setOpenFiles([{ path: untitledPath, name: 'Untitled.md' }])
                    void handleFileSelect(untitledPath)
                  })()
                }}
                onOpenWorkspace={(): void => {
                  handleDismissWelcome()
                  void onOpenWorkspaceClick()
                }}
                onSwitchWorkspace={(path, name): void => {
                  handleDismissWelcome()
                  onSwitchWorkspaceClick(path, name)
                }}
                onDismissWelcome={handleDismissWelcome}
              />
            )}

            {/* ====== RIGHT SIDEBAR PANEL (OUTLINE) ====== */}
            {viewMode !== 'graph' && (
              <div
                className={`right-sidebar-panel ${!showRightSidebar ? 'is-collapsed' : ''} ${
                  isResizingRight ? 'is-resizing' : ''
                }`}
                style={{ width: showRightSidebar ? rightSidebarWidth : 0 }}
              >
                <div
                  className="sidebar-resize-handle sidebar-resize-handle-left"
                  onMouseDown={startRightResize}
                />
                <div className="right-sidebar-content">
                  <OutlinePanel
                    content={activeFilePath ? fileContents[activeFilePath] || '' : ''}
                    headings={activeFilePath ? workerHeadings : []}
                    onClose={(): void => setShowRightSidebar(false)}
                    hasActiveFile={Boolean(activeFilePath)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== PREFERENCES & SETTINGS MODAL ====== */}
      {showSettingsModal && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={(): void => setShowSettingsModal(false)}
            onSettingsChange={(newSettings): void => {
              setUserSettings(newSettings)
              if (typeof newSettings.autoSaveEnabled === 'boolean') {
                setAutoSaveEnabled(newSettings.autoSaveEnabled)
              }
              if (typeof newSettings.autoSaveDelay === 'number') {
                fileStorage.setAutoSaveDelay(newSettings.autoSaveDelay * 1000)
              }
            }}
            currentAutoSave={autoSaveEnabled}
            onAutoSaveChange={setAutoSaveEnabled}
            onToggleAutoSave={(): void => setAutoSaveEnabled((p) => !p)}
            currentThemeMode={themeMode}
            onThemeModeChange={setThemeMode}
            editorFontFamily={editorFontFamily}
            editorFontSize={editorFontSize}
            onFontFamilyChange={handleFontFamilyChange}
            onFontSizeChange={handleFontSizeChange}
            maxUndoHistory={maxUndoHistory}
            onMaxUndoHistoryChange={setMaxUndoHistory}
            showFileName={globalShowFileName}
            onShowFileNameChange={(val): void => {
              setGlobalShowFileName(val)
              storageService.setItem(STORAGE_KEYS.GLOBAL_SHOW_FILE_NAME, val)
            }}
          />
        </Suspense>
      )}

      {/* ====== FLOATING QUICK SWITCHER PALETTE (Ctrl + P / Ctrl + K) ====== */}
      {showQuickSwitcher && (
        <Suspense fallback={null}>
          <QuickSwitcherModal
            isOpen={showQuickSwitcher}
            onClose={(): void => setShowQuickSwitcher(false)}
            onSelectWithQuery={(filePath, query): void => {
              void handleFileSelect(filePath)
              setFindBarInitialQuery(query)
              setShowFindBar(true)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default function App(): React.JSX.Element {
  const { savedState } = usePersistentState()
  const userSettings =
    storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) ?? DEFAULT_USER_SETTINGS

  const legacyMockFiles = new Set([
    '/workspace/welcome to oink.md',
    '/workspace/welcome to repaper.md',
    '/workspace/product-roadmap.md',
    '/workspace/tech-architecture.md',
    '/workspace/design-system.md'
  ])

  const filteredSavedFiles = (savedState.openFiles ?? []).filter(
    (f) => !legacyMockFiles.has(f.path.toLowerCase())
  )

  const initialFiles =
    filteredSavedFiles.length > 0
      ? filteredSavedFiles
      : [{ path: '/workspace/Untitled.md', name: 'Untitled.md' }]

  const initialActiveFile =
    savedState.activeFilePath &&
    !legacyMockFiles.has(savedState.activeFilePath.toLowerCase()) &&
    initialFiles.some((f) => f.path === savedState.activeFilePath)
      ? savedState.activeFilePath
      : initialFiles[0].path

  const initialAutoSave =
    typeof userSettings.autoSaveEnabled === 'boolean'
      ? userSettings.autoSaveEnabled
      : (savedState.autoSaveEnabled ?? true)

  const initialDelay =
    typeof userSettings.autoSaveDelay === 'number' ? userSettings.autoSaveDelay * 1000 : 2000

  return (
    <WorkspaceProvider
      initialPath={savedState.workspacePath ?? '/workspace'}
      initialName={
        savedState.workspaceName ??
        storageService.getItem<string>(STORAGE_KEYS.BROWSER_STORAGE_NAME) ??
        'Browser Storage'
      }
    >
      <FileStorageProvider
        initialActiveFilePath={initialActiveFile}
        initialOpenFiles={initialFiles}
        initialAutoSaveEnabled={initialAutoSave}
        initialAutoSaveDelay={initialDelay}
      >
        <EditorSettingsProvider>
          <UIProvider
            initialViewMode={savedState.viewMode ?? 'editor'}
            initialSidebarWidth={
              !savedState.sidebarWidth ||
              savedState.sidebarWidth === 240 ||
              savedState.sidebarWidth === 260
                ? DEFAULT_SIDEBAR_WIDTH
                : savedState.sidebarWidth
            }
            initialRightSidebarWidth={savedState.rightSidebarWidth ?? 220}
            initialAutoSaveEnabled={initialAutoSave}
            initialShowRightSidebar={savedState.showRightSidebar ?? false}
            initialShowTabs={savedState.showTabs ?? false}
          >
            <AppLayout />
          </UIProvider>
        </EditorSettingsProvider>
      </FileStorageProvider>
    </WorkspaceProvider>
  )
}
