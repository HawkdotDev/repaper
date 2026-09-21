import { SettingsTab } from './types'

export interface SearchableItem {
  id: string
  tab: SettingsTab
  title: string
  description: string
  keywords?: string[]
}

export const SETTINGS_SEARCH_REGISTRY: SearchableItem[] = [
  // General Tab
  {
    id: 'autosave',
    tab: 'general',
    title: 'Automatic Save',
    description: 'Automatically write modified documents to disk after editing',
    keywords: ['save', 'autosave', 'disk', 'persist']
  },
  {
    id: 'autosave-delay',
    tab: 'general',
    title: 'Autosave Delay',
    description: 'Interval of inactivity before saving changes',
    keywords: ['delay', 'interval', 'timer', 'seconds', 'timeout']
  },
  {
    id: 'restore-tabs',
    tab: 'general',
    title: 'Restore Tabs on Startup',
    description: 'Reopen all previously open documents when launching Repaper',
    keywords: ['restore', 'session', 'startup', 'tabs', 'reopen', 'windows']
  },
  {
    id: 'confirm-delete',
    tab: 'general',
    title: 'Confirm File Deletion',
    description: 'Prompt confirmation before permanently removing files or folders',
    keywords: ['delete', 'remove', 'confirm', 'trash', 'prompt', 'warning']
  },

  // Editor Engine Tab
  {
    id: 'tab-size',
    tab: 'editor',
    title: 'Tab Indentation',
    description: 'Spaces inserted on Tab press in the editor',
    keywords: ['tab', 'indent', 'indentation', 'spaces', '2', '4']
  },
  {
    id: 'word-wrap',
    tab: 'editor',
    title: 'Soft Word Wrap',
    description: 'Wrap long text lines within the editor window width',
    keywords: ['wrap', 'soft', 'break', 'overflow', 'lines']
  },
  {
    id: 'spellcheck',
    tab: 'editor',
    title: 'Browser Spellcheck',
    description: 'Enable native spellcheck and dictionary suggestions',
    keywords: ['spell', 'spellcheck', 'dictionary', 'typo', 'grammar']
  },
  {
    id: 'undo-history',
    tab: 'editor',
    title: 'Undo History Depth (Ctrl + Z)',
    description: 'Maximum number of undo/redo snapshots preserved per document',
    keywords: ['undo', 'redo', 'history', 'snapshots', 'ctrl z', 'depth', 'limit', 'steps']
  },

  // Files & Explorer Tab
  {
    id: 'hidden-files',
    tab: 'files',
    title: 'Show Dot / Hidden Files',
    description: 'Display files starting with a dot in explorer',
    keywords: ['dot', 'hidden', 'files', 'gitignore', 'env', 'invisible', 'explorer']
  },
  {
    id: 'exclude-patterns',
    tab: 'files',
    title: 'Excluded Directories & Patterns',
    description: 'Comma-separated folder names to ignore during background indexing',
    keywords: ['exclude', 'ignore', 'patterns', 'node_modules', 'git', 'dist', 'folders']
  },
  {
    id: 'clear-cache',
    tab: 'files',
    title: 'Storage Maintenance',
    description: 'Reset cached metadata and temporary storage states',
    keywords: ['cache', 'storage', 'maintenance', 'clear', 'reset', 'temp']
  }
]

export function isItemMatching(item: SearchableItem, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase().trim()
  if (!q) return true

  if (item.title.toLowerCase().includes(q)) return true
  if (item.description.toLowerCase().includes(q)) return true
  if (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(q))) return true
  return false
}

export function getTabSearchCounts(query: string): Record<SettingsTab, number> {
  const counts: Record<SettingsTab, number> = {
    general: 0,
    editor: 0,
    files: 0
  }

  if (!query.trim()) return counts
  const q = query.toLowerCase().trim()

  for (const item of SETTINGS_SEARCH_REGISTRY) {
    if (isItemMatching(item, q)) {
      counts[item.tab] = (counts[item.tab] || 0) + 1
    }
  }

  return counts
}
