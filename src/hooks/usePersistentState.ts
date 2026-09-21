import { useState, useRef, useCallback, useEffect } from 'react'
import { PersistentAppState } from '../types'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export function usePersistentState(): {
  savedState: Partial<PersistentAppState>
  saveState: (state: PersistentAppState) => void
} {
  const [savedState] = useState<Partial<PersistentAppState>>(() => {
    return storageService.getItem<Partial<PersistentAppState>>(STORAGE_KEYS.APP_STATE, {})
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveState = useCallback((state: PersistentAppState): void => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      storageService.setItem(STORAGE_KEYS.APP_STATE, state)
    }, 300)
  }, [])

  useEffect(() => {
    return (): void => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  return { savedState, saveState }
}
