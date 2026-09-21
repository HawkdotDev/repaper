import React, { useState, useEffect, useMemo } from 'react'
import { X, Search, Sliders, Type, FolderCog, Check, RotateCcw } from 'lucide-react'
import { UserSettings, DEFAULT_USER_SETTINGS, SettingsTab } from './settings/types'
import { getTabSearchCounts } from './settings/searchRegistry'
import GeneralTab from './settings/tabs/GeneralTab'
import EditorTab from './settings/tabs/EditorTab'
import FilesTab from './settings/tabs/FilesTab'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export type { UserSettings, SettingsTab }

const SETTINGS_TABS: {
  id: SettingsTab
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { id: 'general', label: 'General', icon: Sliders },
  { id: 'editor', label: 'Editor', icon: Type },
  { id: 'files', label: 'Files & Explorer', icon: FolderCog }
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange?: (settings: UserSettings) => void
  currentAutoSave?: boolean
  onAutoSaveChange?: (enabled: boolean) => void
  onToggleAutoSave?: () => void
  currentThemeMode?: 'dark' | 'light' | 'system'
  onThemeModeChange?: (mode: 'dark' | 'light' | 'system') => void
  editorFontFamily?: string
  editorFontSize?: number
  onFontFamilyChange?: (font: string) => void
  onFontSizeChange?: (size: number) => void
  maxUndoHistory?: number
  onMaxUndoHistoryChange?: (val: number) => void
  initialTab?: SettingsTab
  showFileName?: boolean
  onShowFileNameChange?: (val: boolean) => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
  currentAutoSave,
  onAutoSaveChange,
  onToggleAutoSave,
  maxUndoHistory,
  onMaxUndoHistoryChange,
  initialTab = 'general',
  showFileName = false
}: SettingsModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [saveToast, setSaveToast] = useState<boolean>(false)

  // Load settings from storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored =
      storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) ?? DEFAULT_USER_SETTINGS
    if (typeof stored.showFileName !== 'boolean' && typeof showFileName === 'boolean') {
      return { ...stored, showFileName }
    }
    return stored
  })

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setActiveTab(initialTab)
    const stored =
      storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS) ?? DEFAULT_USER_SETTINGS
    setSettings(
      typeof stored.showFileName !== 'boolean' && typeof showFileName === 'boolean'
        ? { ...stored, showFileName }
        : stored
    )
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    setActiveTab(initialTab)
  }

  // Save settings helper
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]): void => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      storageService.setItem(STORAGE_KEYS.USER_SETTINGS, next)
      if (onSettingsChange) onSettingsChange(next)
      if (key === 'autoSaveEnabled') {
        if (onAutoSaveChange) {
          onAutoSaveChange(Boolean(value))
        } else if (onToggleAutoSave && value !== currentAutoSave) {
          onToggleAutoSave()
        }
      }
      return next
    })
    window.dispatchEvent(new CustomEvent('settings-updated'))
    setSaveToast(true)
    setTimeout(() => setSaveToast(false), 1200)
  }

  // Reset to factory defaults
  const handleResetDefaults = (): void => {
    const ok = confirm('Reset all preferences to factory defaults?')
    if (ok) {
      setSettings(DEFAULT_USER_SETTINGS)
      storageService.setItem(STORAGE_KEYS.USER_SETTINGS, DEFAULT_USER_SETTINGS)
      if (onSettingsChange) onSettingsChange(DEFAULT_USER_SETTINGS)
      window.dispatchEvent(new CustomEvent('settings-updated'))
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 1500)
    }
  }

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const tabCounts = useMemo(() => getTabSearchCounts(searchQuery), [searchQuery])
  const isSearching = searchQuery.trim().length > 0

  if (!isOpen) return null

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal-dialog" onClick={(e): void => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="settings-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="settings-header-icon-box">
              <Sliders size={13} className="text-zinc-300" />
            </div>
            <div>
              <h2 className="settings-title">Preferences</h2>
              <p className="settings-subtitle">
                Application defaults, editor behavior, and file indexing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <div className="settings-save-toast">
                <Check size={11} className="text-zinc-200" />
                <span>Saved</span>
              </div>
            )}

            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              title="Close Preferences (Esc)"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Search Filter Header */}
        <div className="settings-search-bar">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            className="settings-search-input"
            placeholder="Search preferences & options..."
            value={searchQuery}
            onChange={(e): void => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="settings-search-clear"
              onClick={(): void => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="settings-modal-body">
          {/* Left Navigation Tabs */}
          <div className="settings-sidebar-nav">
            {SETTINGS_TABS.map((tab) => {
              const TabIcon = tab.icon
              const count = tabCounts[tab.id]
              const isDimmed = isSearching && count === 0
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                  onClick={(): void => setActiveTab(tab.id)}
                >
                  <TabIcon size={13} />
                  <span>{tab.label}</span>
                  {isSearching && (
                    <span className={`settings-nav-badge ${count === 0 ? 'zero' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="mt-auto pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                className="settings-reset-btn"
                onClick={handleResetDefaults}
                title="Reset all settings to factory defaults"
              >
                <RotateCcw size={11} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="settings-content-pane">
            {activeTab === 'general' && (
              <GeneralTab
                settings={settings}
                updateSetting={updateSetting}
                searchQuery={searchQuery}
                onSwitchTab={(t): void => setActiveTab(t)}
              />
            )}

            {activeTab === 'editor' && (
              <EditorTab
                settings={settings}
                updateSetting={updateSetting}
                maxUndoHistory={maxUndoHistory}
                onMaxUndoHistoryChange={onMaxUndoHistoryChange}
                searchQuery={searchQuery}
                onSwitchTab={(t): void => setActiveTab(t)}
              />
            )}

            {activeTab === 'files' && (
              <FilesTab
                settings={settings}
                updateSetting={updateSetting}
                searchQuery={searchQuery}
                onSwitchTab={(t): void => setActiveTab(t)}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="settings-modal-footer">
          <span className="text-zinc-500 text-[11px] font-mono">
            Press <kbd className="settings-kbd">Esc</kbd> to close
          </span>
          <button type="button" className="settings-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
