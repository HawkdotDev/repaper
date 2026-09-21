import React from 'react'
import { Check, Plus, HardDrive, AlertTriangle } from 'lucide-react'
import { UserSettings, SettingsTab } from '../types'
import { storageService } from '../../../services/storageService'
import { isItemMatching, SETTINGS_SEARCH_REGISTRY } from '../searchRegistry'

interface FilesTabProps {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  searchQuery?: string
  onSwitchTab?: (tab: SettingsTab) => void
}

const PRESET_EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.oink',
  'coverage',
  '.next',
  '.cache'
]

export default function FilesTab({
  settings,
  updateSetting,
  searchQuery = '',
  onSwitchTab
}: FilesTabProps): React.JSX.Element {
  const handleClearCache = (): void => {
    const ok = confirm('Clear temporary app cache and reset persistent UI states?')
    if (ok) {
      storageService.clear()
      window.location.reload()
    }
  }

  // Parse comma-separated exclude patterns
  const activePatterns = settings.excludePatterns
    ? settings.excludePatterns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  const togglePresetPattern = (pattern: string): void => {
    const exists = activePatterns.includes(pattern)
    let next: string[]
    if (exists) {
      next = activePatterns.filter((p) => p !== pattern)
    } else {
      next = [...activePatterns, pattern]
    }
    updateSetting('excludePatterns', next.join(', '))
  }

  // Filter items if search is active
  const itemHiddenFiles = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'hidden-files')!
  const itemExcludePatterns = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'exclude-patterns')!
  const itemClearCache = SETTINGS_SEARCH_REGISTRY.find((i) => i.id === 'clear-cache')!

  const showHiddenFilesRow = isItemMatching(itemHiddenFiles, searchQuery)
  const showExcludeRow = isItemMatching(itemExcludePatterns, searchQuery)
  const showCacheRow = isItemMatching(itemClearCache, searchQuery)

  const hasAnyMatch = showHiddenFilesRow || showExcludeRow || showCacheRow

  if (!hasAnyMatch && searchQuery.trim()) {
    return (
      <div className="settings-section">
        <div className="settings-empty-search">
          <p>
            No files &amp; explorer settings match &ldquo;<strong>{searchQuery}</strong>&rdquo;
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
                onClick={(): void => onSwitchTab('editor')}
              >
                Editor
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Files &amp; Explorer</h3>
        <p>Configure directory filtering, dotfile visibility, and storage maintenance</p>
      </div>

      <div className="settings-card">
        {/* Show Hidden Files */}
        {showHiddenFilesRow && (
          <div className="settings-row">
            <div className="settings-row-text">
              <label className="settings-row-label">Show Dot / Hidden Files</label>
              <span className="settings-row-desc">
                Display files and folders starting with a dot (e.g. .env, .gitignore) in file
                explorer
              </span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.showHiddenFiles}
                onChange={(e): void => updateSetting('showHiddenFiles', e.target.checked)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        )}

        {/* Exclusion Patterns */}
        {showExcludeRow && (
          <div className={showHiddenFilesRow ? 'border-t border-zinc-800/60 pt-3' : ''}>
            <div className="mb-2">
              <label className="settings-row-label">Excluded Directories &amp; Patterns</label>
              <span className="settings-row-desc block mt-0.5">
                Comma-separated folder names to ignore during background indexing and tree rendering
              </span>
            </div>

            <input
              type="text"
              className="settings-input w-full font-mono text-[11.5px]"
              value={settings.excludePatterns}
              onChange={(e): void => updateSetting('excludePatterns', e.target.value)}
              placeholder="node_modules, .git, dist, out"
            />

            {/* Quick-add chips */}
            <div className="mt-2.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1.5">
                Quick Exclude Presets:
              </span>
              <div className="settings-chip-group">
                {PRESET_EXCLUDES.map((preset) => {
                  const isActive = activePatterns.includes(preset)
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`settings-chip ${isActive ? 'active' : ''}`}
                      onClick={(): void => togglePresetPattern(preset)}
                      title={isActive ? `Remove ${preset}` : `Add ${preset} to exclusions`}
                    >
                      {isActive ? <Check size={10} strokeWidth={2.5} /> : <Plus size={10} />}
                      <span>{preset}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Storage Maintenance */}
        {showCacheRow && (
          <div
            className={
              showHiddenFilesRow || showExcludeRow ? 'border-t border-zinc-800/60 pt-4 mt-1' : ''
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 mt-0.5 shrink-0">
                  <HardDrive size={13} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <label className="settings-row-label">Storage Maintenance</label>
                    <span className="text-[10px] text-zinc-500 font-mono">IndexedDB / Local</span>
                  </div>
                  <span className="settings-row-desc block mt-0.5">
                    Reset cached metadata, unsaved draft recovery states, and layout settings
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors shrink-0 flex items-center gap-1.5 font-medium"
              >
                <AlertTriangle size={12} />
                <span>Clear App Cache</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
