import React, { useState, useCallback, useMemo } from 'react'
import { useEditorTypography } from '../hooks/useEditorTypography'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import { UserSettings, DEFAULT_USER_SETTINGS } from '../components/settings/types'
import { StatusStatsConfig } from '../types'
import { useFileStorageContext } from './FileStorageContext'
import { EditorSettingsContext, EditorSettingsContextType } from './EditorSettingsContext'

export function EditorSettingsProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const { activeFileMeta } = useFileStorageContext()

  const typography = useEditorTypography()

  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    return storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) ?? DEFAULT_USER_SETTINGS
  })

  const [globalShowCover, setGlobalShowCover] = useState<boolean>(() => {
    return storageService.getItem<boolean>(STORAGE_KEYS.GLOBAL_SHOW_COVER, true)
  })
  const [globalShowIcon, setGlobalShowIcon] = useState<boolean>(() => {
    return storageService.getItem<boolean>(STORAGE_KEYS.GLOBAL_SHOW_ICON, true)
  })
  const [globalShowFileName, setGlobalShowFileName] = useState<boolean>(() => {
    return storageService.getItem<boolean>(STORAGE_KEYS.GLOBAL_SHOW_FILE_NAME, false)
  })

  const effectiveShowCover =
    activeFileMeta?.showCover !== undefined ? activeFileMeta.showCover : globalShowCover
  const effectiveShowIcon =
    activeFileMeta?.showIcon !== undefined ? activeFileMeta.showIcon : globalShowIcon
  const effectiveShowFileName =
    activeFileMeta?.showFileName !== undefined ? activeFileMeta.showFileName : globalShowFileName

  const handleToggleCover = useCallback(() => {
    setGlobalShowCover((prev) => {
      const next = !prev
      storageService.setItem(STORAGE_KEYS.GLOBAL_SHOW_COVER, next)
      return next
    })
  }, [])

  const handleToggleIcon = useCallback(() => {
    setGlobalShowIcon((prev) => {
      const next = !prev
      storageService.setItem(STORAGE_KEYS.GLOBAL_SHOW_ICON, next)
      return next
    })
  }, [])

  const handleToggleFileName = useCallback(() => {
    setGlobalShowFileName((prev) => {
      const next = !prev
      storageService.setItem(STORAGE_KEYS.GLOBAL_SHOW_FILE_NAME, next)
      return next
    })
  }, [])

  const [statsConfig, setStatsConfig] = useState<StatusStatsConfig>(() => {
    return storageService.getItem<StatusStatsConfig>(STORAGE_KEYS.STATUS_STATS_CONFIG, {
      showWords: true,
      showLines: true,
      showChars: false,
      showSpaces: true,
      showReadingTime: false,
      showLanguage: true,
      showSavedBadge: true
    })
  })

  const handleToggleStat = useCallback((key: keyof StatusStatsConfig) => {
    setStatsConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      storageService.setItem(STORAGE_KEYS.STATUS_STATS_CONFIG, next)
      return next
    })
  }, [])

  const value = useMemo<EditorSettingsContextType>(
    () => ({
      ...typography,
      userSettings,
      setUserSettings,
      globalShowCover,
      setGlobalShowCover,
      globalShowIcon,
      setGlobalShowIcon,
      globalShowFileName,
      setGlobalShowFileName,
      effectiveShowCover,
      effectiveShowIcon,
      effectiveShowFileName,
      handleToggleCover,
      handleToggleIcon,
      handleToggleFileName,
      statsConfig,
      setStatsConfig,
      handleToggleStat
    }),
    [
      typography,
      userSettings,
      globalShowCover,
      globalShowIcon,
      globalShowFileName,
      effectiveShowCover,
      effectiveShowIcon,
      effectiveShowFileName,
      handleToggleCover,
      handleToggleIcon,
      handleToggleFileName,
      statsConfig,
      handleToggleStat
    ]
  )

  return (
    <EditorSettingsContext.Provider value={value}>{children}</EditorSettingsContext.Provider>
  )
}
