export interface UserSettings {
  // General
  autoSaveEnabled: boolean
  autoSaveDelay: number
  restoreTabsOnStartup: boolean
  confirmDelete: boolean

  // Editor
  fontFamily: 'sans' | 'mono' | 'serif'
  fontSize: number
  lineHeight: 'compact' | 'normal' | 'relaxed'
  tabSize: number
  wordWrap: boolean
  spellcheck: boolean
  maxUndoHistory: number

  // Appearance
  themeMode: 'dark' | 'light' | 'system'
  editorWidth: 'compact' | 'standard' | 'wide' | 'full'
  coverBannerHeight: number
  showBreadcrumbs: boolean
  showStatusBar: boolean
  showFileName: boolean

  // Files & Explorer
  showHiddenFiles: boolean
  excludePatterns: string

  // AI & Diagnostics
  aiAutoAnalyze: boolean
  aiModelProvider: 'local' | 'gemini' | 'custom'
  geminiApiKey: string
  checkGrammar: boolean
  checkStyle: boolean
  checkPassiveVoice: boolean
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  autoSaveEnabled: true,
  autoSaveDelay: 2,
  restoreTabsOnStartup: true,
  confirmDelete: true,

  fontFamily: 'sans',
  fontSize: 15,
  lineHeight: 'normal',
  tabSize: 2,
  wordWrap: true,
  spellcheck: true,
  maxUndoHistory: 50,

  themeMode: 'dark',
  editorWidth: 'standard',
  coverBannerHeight: 200,
  showBreadcrumbs: true,
  showStatusBar: true,
  showFileName: false,

  showHiddenFiles: false,
  excludePatterns: 'node_modules, .git, dist, out, .DS_Store',

  aiAutoAnalyze: true,
  aiModelProvider: 'local',
  geminiApiKey: '',
  checkGrammar: true,
  checkStyle: true,
  checkPassiveVoice: true
}

export const FONT_OPTIONS = [
  { label: 'Inter (Modern Sans)', value: "'Inter', sans-serif" },
  { label: 'System Default', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: 'Georgia (Classic Serif)', value: "'Georgia', serif" },
  { label: 'Merriweather (Editorial Serif)', value: "'Merriweather', serif" },
  { label: 'Lora (Literary Serif)', value: "'Lora', serif" },
  { label: 'JetBrains Mono (Code Monospace)', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code (Ligatures Monospace)', value: "'Fira Code', monospace" }
]

export type SettingsTab = 'general' | 'editor' | 'files'

export interface ShortcutItem {
  keyCombo: string
  description: string
  category: string
}

export const SHORTCUT_LIST: ShortcutItem[] = [
  { keyCombo: 'Ctrl + S', description: 'Save current document', category: 'General' },
  { keyCombo: 'Ctrl + Z', description: 'Undo last edit / block modification', category: 'Editor' },
  {
    keyCombo: 'Ctrl + Y / Ctrl + Shift + Z',
    description: 'Redo previously undone edit',
    category: 'Editor'
  },
  { keyCombo: 'Ctrl + P', description: 'Quick document switcher', category: 'Navigation' },
  { keyCombo: 'Ctrl + B', description: 'Toggle explorer sidebar', category: 'Layout' },
  { keyCombo: 'Ctrl + ,', description: 'Open Settings & Preferences', category: 'General' },
  { keyCombo: 'Ctrl + Shift + G', description: 'Toggle Knowledge Graph view', category: 'View' },
  { keyCombo: 'Ctrl + Shift + N', description: 'Create new markdown document', category: 'Files' },
  { keyCombo: 'Ctrl + Shift + D', description: 'Toggle Diff preview mode', category: 'Editor' },
  { keyCombo: 'Ctrl + W', description: 'Close active tab', category: 'Tabs' },
  { keyCombo: 'Ctrl + Tab', description: 'Switch to next open tab', category: 'Tabs' },
  { keyCombo: 'Esc', description: 'Close popovers / modals / search', category: 'General' }
]
