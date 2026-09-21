import { useState, useEffect, useCallback } from 'react'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export type ThemeMode = 'dark' | 'light' | 'system'

export interface UseThemeReturn {
  themeMode: ThemeMode
  isLight: boolean
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = storageService.getItem<string>(STORAGE_KEYS.THEME_MODE)
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved as ThemeMode
    }
    return 'dark'
  })

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return true
  })

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => {
      setSystemIsDark(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return (): void => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  const isLight = themeMode === 'light' || (themeMode === 'system' && !systemIsDark)

  // Apply data-theme attribute and classes to document root and body
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const themeName = isLight ? 'light' : 'dark'

    root.setAttribute('data-theme', themeName)
    root.style.colorScheme = themeName

    if (body) {
      body.classList.toggle('theme-light', isLight)
      body.classList.toggle('theme-dark', !isLight)
    }

    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isLight ? '#ffffff' : '#0E0E11')
    }
  }, [isLight])

  const setThemeMode = useCallback((mode: ThemeMode): void => {
    setThemeModeState(mode)
    storageService.setItem(STORAGE_KEYS.THEME_MODE, mode)
  }, [])

  const toggleTheme = useCallback((): void => {
    setThemeModeState((prev) => {
      let next: ThemeMode
      if (prev === 'system') {
        next = systemIsDark ? 'light' : 'dark'
      } else {
        next = prev === 'light' ? 'dark' : 'light'
      }
      storageService.setItem(STORAGE_KEYS.THEME_MODE, next)
      return next
    })
  }, [systemIsDark])

  return {
    themeMode,
    isLight,
    setThemeMode,
    toggleTheme
  }
}
