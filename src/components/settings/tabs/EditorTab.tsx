import React from 'react'
import { UserSettings, SettingsTab } from '../types'
import { isItemMatching, SETTINGS_SEARCH_REGISTRY } from '../searchRegistry'

interface EditorTabProps {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  maxUndoHistory?: number
  onMaxUndoHistoryChange?: (val: number) => void
  searchQuery?: string
  onSwitchTab?: (tab: SettingsTab) => void
}

export default function EditorTab({
  settings,
  updateSetting,
  maxUndoHistory,
  onMaxUndoHistoryChange,
  searchQuery = '',
  onSwitchTab
}: EditorTabProps): React.JSX.Element {
  const itemTabSize = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'tab-size')!
  const itemWordWrap = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'word-wrap')!
  const itemSpellcheck = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'spellcheck')!
  const itemUndo = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'undo-history')!

  const showTabSize = isItemMatching(itemTabSize, searchQuery)
  const showWordWrap = isItemMatching(itemWordWrap, searchQuery)
  const showSpellcheck = isItemMatching(itemSpellcheck, searchQuery)
  const showUndo = isItemMatching(itemUndo, searchQuery)

  const hasAnyMatch = showTabSize || showWordWrap || showSpellcheck || showUndo

  if (!hasAnyMatch && searchQuery.trim()) {
    return (
      <div className="settings-section">
        <div className="settings-empty-search">
          <p>
            No editor settings match &ldquo;<strong>{searchQuery}</strong>&rdquo;
          </p>
          {onSwitchTab && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">Quick jump:</span>
              <button
                type="button"
                className="settings-jump-btn"
                onClick={(): void => onSwitchTab('general')}
              >
                General
              </button>
              <button
                type="button"
                className="settings-jump-btn"
                onClick={(): void => onSwitchTab('files')}
              >
                Files &amp; Explorer
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  let rowCount = 0

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Editor Engine &amp; Behavior</h3>
        <p>Configure indentation, line wrapping, spellcheck, and undo snapshot depth</p>
      </div>

      <div className="settings-card">
        {/* Tab Size */}
        {showTabSize && (
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-row-label">Tab Indentation</label>
              <span className="settings-row-desc">
                Number of spaces inserted into text when pressing the Tab key
              </span>
            </div>
            <select
              className="settings-select"
              value={settings.tabSize}
              onChange={(e): void => updateSetting('tabSize', Number(e.target.value))}
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
            </select>
          </div>
        )}

        {/* Word Wrap */}
        {showWordWrap && (
          <div
            className={`settings-row ${rowCount++ > 0 || showTabSize ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="settings-row-text">
              <label className="settings-row-label">Soft Word Wrap</label>
              <span className="settings-row-desc">
                Wrap long lines within document window instead of horizontal scrolling
              </span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e): void => updateSetting('wordWrap', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}

        {/* Spellcheck */}
        {showSpellcheck && (
          <div
            className={`settings-row ${rowCount++ > 0 || showTabSize || showWordWrap ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="settings-row-text">
              <label className="settings-row-label">Browser Spellcheck</label>
              <span className="settings-row-desc">
                Enable native dictionary spellchecking and typo squiggly highlights
              </span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.spellcheck}
                onChange={(e): void => updateSetting('spellcheck', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}

        {/* Undo / Redo History Limit (Ctrl + Z) */}
        {showUndo && (
          <div
            className={`settings-row ${rowCount++ > 0 || showTabSize || showWordWrap || showSpellcheck ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="settings-row-text">
              <label className="settings-row-label">Undo History Depth (Ctrl + Z)</label>
              <span className="settings-row-desc">
                Maximum undo/redo revision snapshots preserved per document (Default: 50)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                className="settings-range"
                value={settings.maxUndoHistory ?? maxUndoHistory ?? 50}
                onChange={(e): void => {
                  const val = Number(e.target.value)
                  updateSetting('maxUndoHistory', val)
                  onMaxUndoHistoryChange?.(val)
                }}
              />
              <span className="text-xs font-mono text-zinc-300 w-16 text-right">
                {settings.maxUndoHistory ?? maxUndoHistory ?? 50} steps
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
