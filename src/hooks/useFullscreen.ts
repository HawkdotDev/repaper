import { useState, useCallback, useEffect } from 'react'

export function useFullscreen() {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!document.fullscreenElement
    }
    return false
  })

  const handleToggleFullScreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      } else {
        if (document.documentElement?.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      }
    } catch (err) {
      console.warn('[useFullscreen] Error toggling full screen:', err)
      // Sync state back to actual DOM state in case of rejection/cancellation
      setIsFullScreen(!!document.fullscreenElement)
    }
  }, [])

  useEffect(() => {
    const handleFsChange = (): void => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    // Initial check
    handleFsChange()

    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    document.addEventListener('mozfullscreenchange', handleFsChange)
    document.addEventListener('MSFullscreenChange', handleFsChange)

    return (): void => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
      document.removeEventListener('mozfullscreenchange', handleFsChange)
      document.removeEventListener('MSFullscreenChange', handleFsChange)
    }
  }, [])

  return {
    isFullScreen,
    setIsFullScreen,
    handleToggleFullScreen
  }
}

