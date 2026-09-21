import React, { createContext, useContext } from 'react'
import { UserSettings } from '../components/settings/types'
import { StatusStatsConfig } from '../types'

export interface EditorSettingsContextType {
  // Typography
  editorFontFamily: string
  editorFontSize: number
  editorLineHeight: string
  editorLetterSpacing: string
  editorParagraphSpacing: string
  editorFontWeight: string
  editorTextAlign: string
  handleFontFamilyChange: (font: string) => void
  handleFontSizeChange: (size: number) => void
  handleLineHeightChange: (lh: string) => void
  handleLetterSpacingChange: (ls: string) => void
  handleParagraphSpacingChange: (ps: string) => void
  handleFontWeightChange: (fw: string) => void
  handleTextAlignChange: (align: string) => void

  // User Settings
  userSettings: UserSettings
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>

  // Display Settings
  globalShowCover: boolean
  setGlobalShowCover: React.Dispatch<React.SetStateAction<boolean>>
  globalShowIcon: boolean
  setGlobalShowIcon: React.Dispatch<React.SetStateAction<boolean>>
  globalShowFileName: boolean
  setGlobalShowFileName: React.Dispatch<React.SetStateAction<boolean>>
  effectiveShowCover: boolean
  effectiveShowIcon: boolean
  effectiveShowFileName: boolean
  handleToggleCover: () => void
  handleToggleIcon: () => void
  handleToggleFileName: () => void

  // Status Bar Stats
  statsConfig: StatusStatsConfig
  setStatsConfig: React.Dispatch<React.SetStateAction<StatusStatsConfig>>
  handleToggleStat: (key: keyof StatusStatsConfig) => void
}

export const EditorSettingsContext = createContext<EditorSettingsContextType | null>(null)

export function useEditorSettingsContext(): EditorSettingsContextType {
  const context = useContext(EditorSettingsContext)
  if (!context) {
    throw new Error('useEditorSettingsContext must be used within an EditorSettingsProvider')
  }
  return context
}
