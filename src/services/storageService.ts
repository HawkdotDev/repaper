/**
 * Centralised, type-safe Storage Service for Repaper
 * Handles namespaced keys, JSON serialization, quota exceptions, and data export.
 */

export const STORAGE_KEYS = {
  RECENT_WORKSPACES: 'oink_recent_workspaces',
  LEGACY_RECENT_WORKSPACES: 'recentWorkspaces',
  THEME_MODE: 'oink_theme_mode',
  APP_STATE: 'oink_app_state_v1',
  USER_SETTINGS: 'oink_user_settings',
  EDITOR_TYPOGRAPHY: 'oink_editor_typography',
  MAX_UNDO_COUNT: 'oink_max_undo_count',
  RECENT_FONTS: 'oink_recent_fonts',
  NOTIFICATIONS: 'oink_app_notifications',
  SHOW_TABS: 'oink_show_tabs',
  SIDEBAR_VIEW: 'oink_sidebar_view',
  GLOBAL_SHOW_COVER: 'oink_global_show_cover',
  GLOBAL_SHOW_ICON: 'oink_global_show_icon',
  GLOBAL_SHOW_FILE_NAME: 'oink_global_show_file_name',
  WORKSPACE_ICONS: 'oink_workspace_icons',
  STATUS_STATS_CONFIG: 'oink_status_stats_config',
  WELCOME_DISMISSED: 'onlineeditor_welcome_dismissed',
  BROWSER_STORAGE_NAME: 'oink_browser_storage_name'
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | string

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage
  }
  return null
}

class StorageService {
  public hasItem(key: StorageKey): boolean {
    const storage = getStorage()
    if (!storage) return false
    return storage.getItem(key) !== null
  }

  public getItem<T>(key: StorageKey, defaultValue?: T): T {
    const storage = getStorage()
    if (!storage) {
      return defaultValue as T
    }

    try {
      const raw = storage.getItem(key)
      if (raw === null) {
        return defaultValue as T
      }

      // Try parsing JSON first
      try {
        return JSON.parse(raw) as T
      } catch {
        // If not valid JSON, return as string or boolean
        if (raw === 'true') return true as unknown as T
        if (raw === 'false') return false as unknown as T
        return raw as unknown as T
      }
    } catch (err) {
      console.warn(`[StorageService] Failed reading key "${key}":`, err)
      return defaultValue as T
    }
  }

  public setItem<T>(key: StorageKey, value: T): boolean {
    const storage = getStorage()
    if (!storage) {
      return false
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      storage.setItem(key, serialized)
      return true
    } catch (err) {
      if (
        (err as Error)?.name === 'QuotaExceededError' ||
        (err as { code?: number })?.code === 22
      ) {
        console.error(`[StorageService] LocalStorage quota exceeded when writing "${key}"!`)
      } else {
        console.warn(`[StorageService] Failed writing key "${key}":`, err)
      }
      return false
    }
  }

  public removeItem(key: StorageKey): void {
    const storage = getStorage()
    if (!storage) return
    try {
      storage.removeItem(key)
    } catch (err) {
      console.warn(`[StorageService] Failed removing key "${key}":`, err)
    }
  }

  public clear(prefix = 'oink_'): void {
    const storage = getStorage()
    if (!storage) return
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k))
    } catch (err) {
      console.warn('[StorageService] Failed clearing storage:', err)
    }
  }

  public exportAll(): Record<string, unknown> {
    const storage = getStorage()
    if (!storage) return {}
    const result: Record<string, unknown> = {}
    try {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (
          k &&
          (k.startsWith('oink_') || k.startsWith('onlineeditor_') || k === 'recentWorkspaces')
        ) {
          result[k] = this.getItem(k)
        }
      }
    } catch (err) {
      console.warn('[StorageService] Failed exporting storage:', err)
    }
    return result
  }
}

export const storageService = new StorageService()
