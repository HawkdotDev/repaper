import { describe, it, expect, beforeEach } from 'bun:test'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import { UserSettings, DEFAULT_USER_SETTINGS } from '../components/settings/types'
import { PersistentAppState } from '../types'

describe('Autosave Configuration & Persistence', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => {
        store.clear()
      },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size
      }
    } as Storage
  })

  it('correctly saves and retrieves autoSaveEnabled = false in USER_SETTINGS', () => {
    const customSettings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      autoSaveEnabled: false,
      autoSaveDelay: 5
    }
    storageService.setItem(STORAGE_KEYS.USER_SETTINGS, customSettings)

    const loaded = storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS)
    expect(loaded.autoSaveEnabled).toBe(false)
    expect(loaded.autoSaveDelay).toBe(5)
  })

  it('correctly persists autoSaveEnabled across both APP_STATE and USER_SETTINGS', () => {
    // When autosave is disabled
    const currentSettings =
      storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) ?? DEFAULT_USER_SETTINGS
    storageService.setItem(STORAGE_KEYS.USER_SETTINGS, {
      ...currentSettings,
      autoSaveEnabled: false
    })

    const currentAppState = storageService.getItem<Partial<PersistentAppState>>(
      STORAGE_KEYS.APP_STATE,
      {}
    )
    storageService.setItem(STORAGE_KEYS.APP_STATE, {
      ...currentAppState,
      autoSaveEnabled: false
    })

    const loadedSettings = storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS)
    const loadedAppState = storageService.getItem<Partial<PersistentAppState>>(
      STORAGE_KEYS.APP_STATE
    )

    expect(loadedSettings.autoSaveEnabled).toBe(false)
    expect(loadedAppState.autoSaveEnabled).toBe(false)
  })

  it('determines initialAutoSave prioritizing userSettings.autoSaveEnabled', () => {
    // Case 1: USER_SETTINGS explicitly set to false, APP_STATE has true
    storageService.setItem(STORAGE_KEYS.USER_SETTINGS, {
      ...DEFAULT_USER_SETTINGS,
      autoSaveEnabled: false
    })
    storageService.setItem(STORAGE_KEYS.APP_STATE, {
      autoSaveEnabled: true
    })

    const userSettings = storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS)
    const savedState = storageService.getItem<Partial<PersistentAppState>>(STORAGE_KEYS.APP_STATE)

    const initialAutoSave =
      typeof userSettings.autoSaveEnabled === 'boolean'
        ? userSettings.autoSaveEnabled
        : (savedState.autoSaveEnabled ?? true)

    expect(initialAutoSave).toBe(false)
  })

  it('determines initialAutoSave falling back to savedState or true when unset', () => {
    // Case 2: USER_SETTINGS not set, APP_STATE has false
    storageService.setItem(STORAGE_KEYS.APP_STATE, {
      autoSaveEnabled: false
    })

    const userSettings = storageService.getItem<UserSettings | null>(
      STORAGE_KEYS.USER_SETTINGS,
      null
    )
    const savedState = storageService.getItem<Partial<PersistentAppState>>(STORAGE_KEYS.APP_STATE)

    const initialAutoSave =
      userSettings && typeof userSettings.autoSaveEnabled === 'boolean'
        ? userSettings.autoSaveEnabled
        : (savedState.autoSaveEnabled ?? true)

    expect(initialAutoSave).toBe(false)
  })
})
