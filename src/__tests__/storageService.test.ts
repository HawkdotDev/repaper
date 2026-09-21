import { describe, it, expect, beforeEach } from 'bun:test'
import { storageService, STORAGE_KEYS } from '../services/storageService'

describe('storageService', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    // Setup mock Storage for test runner
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => { store.delete(k) },
      clear: () => { store.clear() },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size }
    } as Storage
  })

  it('stores and retrieves JSON objects safely', () => {
    const data = { theme: 'dark', fontSize: 16, plugins: ['katex'] }
    storageService.setItem('test_key', data)
    const retrieved = storageService.getItem<typeof data>('test_key')
    expect(retrieved).toEqual(data)
  })

  it('returns default value when key does not exist', () => {
    const result = storageService.getItem<string>('non_existent', 'fallback')
    expect(result).toBe('fallback')
  })

  it('checks existence and removes item correctly', () => {
    storageService.setItem('to_delete', 'value')
    expect(storageService.hasItem('to_delete')).toBe(true)
    storageService.removeItem('to_delete')
    expect(storageService.hasItem('to_delete')).toBe(false)
  })

  it('exports all oink-prefixed data', () => {
    storageService.setItem(STORAGE_KEYS.THEME_MODE, 'dark')
    storageService.setItem(STORAGE_KEYS.MAX_UNDO_COUNT, 100)
    const exported = storageService.exportAll()
    expect(exported[STORAGE_KEYS.THEME_MODE]).toBe('dark')
    expect(exported[STORAGE_KEYS.MAX_UNDO_COUNT]).toBe(100)
  })
})
