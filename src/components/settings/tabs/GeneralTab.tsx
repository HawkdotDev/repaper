import React from 'react'
import { Save, Clock, History, AlertTriangle } from 'lucide-react'
import { UserSettings, SettingsTab } from '../types'
import { isItemMatching, SETTINGS_SEARCH_REGISTRY } from '../searchRegistry'

interface GeneralTabProps {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  searchQuery?: string
  onSwitchTab?: (tab: SettingsTab) => void
}

export default function GeneralTab({
  settings,
  updateSetting,
  searchQuery = '',
  onSwitchTab
}: GeneralTabProps): React.JSX.Element {
  const itemAutosave = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'autosave')!
  const itemAutosaveDelay = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'autosave-delay')!
  const itemRestoreTabs = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'restore-tabs')!
  const itemConfirmDelete = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'confirm-delete')!

  const showAutosave = isItemMatching(itemAutosave, searchQuery)
  const showAutosaveDelay =
    settings.autoSaveEnabled && isItemMatching(itemAutosaveDelay, searchQuery)
  const showRestoreTabs = isItemMatching(itemRestoreTabs, searchQuery)
  const showConfirmDelete = isItemMatching(itemConfirmDelete, searchQuery)

  const hasAnyMatch = showAutosave || showAutosaveDelay || showRestoreTabs || showConfirmDelete

  if (!hasAnyMatch && searchQuery.trim()) {
    return (
      <div className="settings-section">
        <div className="settings-empty-search">
          <p>
            No general preferences match &ldquo;<strong>{searchQuery}</strong>&rdquo;
          </p>
          {onSwitchTab && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">Quick jump:</span>
              <button
                type="button"
                className="settings-jump-btn"
                onClick={(): void => onSwitchTab('editor')}
              >
                Editor
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

  let renderedCount = 0

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>General Preferences</h3>
        <p>Configure document persistence, tab session recovery, and safety dialogs</p>
      </div>

      <div className="settings-card">
        {/* Autosave Toggle */}
        {showAutosave && (
          <div className="settings-row">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5 shrink-0">
                <Save size={13} />
              </div>
              <div className="settings-row-text">
                <label className="settings-row-label">Automatic Save</label>
                <span className="settings-row-desc">
                  Automatically write modified documents to disk after editing
                </span>
              </div>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.autoSaveEnabled}
                onChange={(e): void => updateSetting('autoSaveEnabled', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}

        {/* Autosave Delay */}
        {showAutosaveDelay && (
          <div
            className={`settings-row ${renderedCount++ > 0 || showAutosave ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5 shrink-0">
                <Clock size={13} />
              </div>
              <div className="settings-row-text">
                <label className="settings-row-label">Autosave Inactivity Delay</label>
                <span className="settings-row-desc">
                  Interval of typing inactivity before changes are saved to disk
                </span>
              </div>
            </div>
            <select
              className="settings-select"
              value={settings.autoSaveDelay}
              onChange={(e): void => updateSetting('autoSaveDelay', Number(e.target.value))}
            >
              <option value={1}>1 second (Instant)</option>
              <option value={2}>2 seconds (Default)</option>
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
            </select>
          </div>
        )}

        {/* Restore Tabs on Startup */}
        {showRestoreTabs && (
          <div
            className={`settings-row ${renderedCount++ > 0 || showAutosave || showAutosaveDelay ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5 shrink-0">
                <History size={13} />
              </div>
              <div className="settings-row-text">
                <label className="settings-row-label">Restore Open Tabs on Launch</label>
                <span className="settings-row-desc">
                  Reopen all previously open documents when starting Repaper
                </span>
              </div>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.restoreTabsOnStartup}
                onChange={(e): void => updateSetting('restoreTabsOnStartup', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}

        {/* Confirm Delete */}
        {showConfirmDelete && (
          <div
            className={`settings-row ${renderedCount++ > 0 || showAutosave || showAutosaveDelay || showRestoreTabs ? 'border-t border-zinc-800/60 pt-3' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5 shrink-0">
                <AlertTriangle size={13} />
              </div>
              <div className="settings-row-text">
                <label className="settings-row-label">Confirm File &amp; Folder Deletion</label>
                <span className="settings-row-desc">
                  Prompt a confirmation dialog before permanently removing files
                </span>
              </div>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.confirmDelete}
                onChange={(e): void => updateSetting('confirmDelete', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
