export * from './shared'
import type { OpenFileInfo, ViewMode, OinkFileMetadata } from './shared'


export interface OinkWorkspaceInfo {
  name: string
  id: string
  icon?: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface OinkWorkspaceSession {
  activeFilePath?: string | null
  openFiles?: OpenFileInfo[]
  recentFiles?: string[]
  viewMode?: ViewMode
  sidebarCollapsed?: boolean
  sidebarWidth?: number
  showRightSidebar?: boolean
  rightSidebarWidth?: number
  showTabs?: boolean
  autoSaveEnabled?: boolean
}

export interface OinkWorkspaceConfig {
  name?: string
  description?: string
  version?: string
  theme?: {
    mode?: 'dark' | 'light' | 'system'
    accentColor?: string
    background?: string
    surface?: string
    sidebarBg?: string
    fontFamily?: string
  }
  editor?: {
    fontFamily?: string
    fontSize?: number
    lineHeight?: string
    letterSpacing?: string
    paragraphSpacing?: string
    fontWeight?: string
    textAlign?: string
    maxUndoHistory?: number
    autoSave?: boolean
    autoSaveIntervalMs?: number
  }
  markdown?: {
    wikilinks?: boolean
    strikethrough?: boolean
    autoCloseBrackets?: boolean
    tableOfContentsDepth?: number
  }
  excludePatterns?: string[]
  customCSS?: string
  keybindings?: Record<string, string>
  export?: {
    defaultFormat?: 'markdown' | 'html' | 'text'
    includeFrontmatter?: boolean
    pageWidth?: string
  }
  hooks?: {
    onWorkspaceOpen?: string
    onFileSave?: string
  }
}

export interface StoredWorkspaceMetadataFile {
  version: number
  appVersion?: string
  updatedAt: number
  workspace?: OinkWorkspaceInfo
  session?: OinkWorkspaceSession
  files?: Record<string, OinkFileMetadata>
  tags?: Record<string, { color?: string; description?: string; count?: number }>
  icons?: Record<string, string>
  banners?: Record<string, string>
  showCover?: Record<string, boolean | undefined>
  showIcon?: Record<string, boolean | undefined>
  showFileName?: Record<string, boolean | undefined>
  customProps?: Record<string, Record<string, unknown>>
}

export interface ContextMenuState {
  x: number
  y: number
  path: string
  isDir: boolean
  parentPath: string
}

export type TerminalTabType = 'PROBLEMS' | 'OUTPUT' | 'TERMINAL' | 'DEBUG CONSOLE'

export interface PersistentAppState {
  workspacePath: string | null
  workspaceName: string
  activeFilePath: string | null
  openFiles: OpenFileInfo[]
  viewMode: ViewMode
  autoSaveEnabled: boolean
  sidebarCollapsed: boolean
  sidebarWidth: number
  showRightSidebar: boolean
  rightSidebarWidth: number
  sidebarView?: 'explorer' | 'search'
  showSearchInput?: boolean
  showDiffToggle?: boolean
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  showTabs?: boolean
  searchQuery?: string
}
