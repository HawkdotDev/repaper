import { useEffect } from 'react'

interface UseGlobalShortcutsOptions {
  isFullScreen: boolean
  activeFilePath: string | null
  onSaveActiveFile: () => void
  onOpenWorkspace: () => void
  onCreateFileAtRoot: () => void
  onCloseActiveTab: (filePath: string) => void
  onToggleFullScreen: () => void
  onToggleSearch: () => void
  onToggleQuickSwitcher?: () => void
  onToggleFindInDocument?: () => void
  onToggleSettings: () => void
  onToggleTheme?: () => void
  onToggleVoiceDictation?: () => void
}

export function useGlobalShortcuts({
  isFullScreen,
  activeFilePath,
  onSaveActiveFile,
  onOpenWorkspace,
  onCreateFileAtRoot,
  onCloseActiveTab,
  onToggleFullScreen,
  onToggleSearch,
  onToggleQuickSwitcher,
  onToggleFindInDocument,
  onToggleSettings,
  onToggleTheme,
  onToggleVoiceDictation
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Alt + D or Alt + V for Voice Dictation
      if (e.altKey && !e.ctrlKey && !e.metaKey && (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'v')) {
        e.preventDefault()
        if (onToggleVoiceDictation) {
          onToggleVoiceDictation()
        }
        return
      }

      // Escape exit fullscreen
      if (e.key === 'Escape' && (isFullScreen || !!document.fullscreenElement)) {
        if (document.fullscreenElement) {
          void document.exitFullscreen?.().catch(() => {})
        }
        return
      }

      // F11 toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        onToggleFullScreen()
        return
      }

      // Ctrl / Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()

        if (key === 's') {
          e.preventDefault()
          onSaveActiveFile()
        } else if (key === 'o') {
          e.preventDefault()
          onOpenWorkspace()
        } else if (key === 'n') {
          e.preventDefault()
          onCreateFileAtRoot()
        } else if (key === 'w') {
          e.preventDefault()
          if (activeFilePath) {
            onCloseActiveTab(activeFilePath)
          }
        } else if (key === 'p' || key === 'k') {
          e.preventDefault()
          if (onToggleQuickSwitcher) {
            onToggleQuickSwitcher()
          } else {
            onToggleSearch()
          }
        } else if (key === 'f') {
          e.preventDefault()
          if (e.shiftKey) {
            onToggleSearch()
          } else if (onToggleFindInDocument) {
            onToggleFindInDocument()
          }
        } else if (key === 'd' && e.shiftKey && onToggleVoiceDictation) {
          e.preventDefault()
          onToggleVoiceDictation()
        } else if (key === ',') {
          e.preventDefault()
          onToggleSettings()
        } else if (key === 'l' && e.shiftKey && onToggleTheme) {
          e.preventDefault()
          onToggleTheme()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isFullScreen,
    activeFilePath,
    onSaveActiveFile,
    onOpenWorkspace,
    onCreateFileAtRoot,
    onCloseActiveTab,
    onToggleFullScreen,
    onToggleSearch,
    onToggleQuickSwitcher,
    onToggleSettings,
    onToggleTheme,
    onToggleFindInDocument,
    onToggleVoiceDictation
  ])
}
