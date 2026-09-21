import { WindowAPI } from '../types/api'

export const webWindow: WindowAPI = {
  minimize: (): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  },
  maximize: (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  },
  close: (): void => {
    try {
      window.close()
    } catch {
      // ignore
    }
  },
  toggleFullScreen: (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  },
  isFullScreen: async (): Promise<boolean> => {
    return !!document.fullscreenElement
  },
  onFullScreenChange: (callback: (isFullScreen: boolean) => void): (() => void) => {
    const handler = (): void => {
      callback(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)
    return (): void => {
      document.removeEventListener('fullscreenchange', handler)
    }
  }
}
