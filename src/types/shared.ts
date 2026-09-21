export interface FileNode {
  name: string
  path: string
  isDir: boolean
}

export interface MarkdownMetadata {
  icon?: string
  banner?: string
  showIcon?: boolean
  showCover?: boolean
  showFileName?: boolean
}

export interface OinkFileMetadata extends MarkdownMetadata {
  title?: string
  tags?: string[]
  aliases?: string[]
  isFavorite?: boolean
  isPinned?: boolean
  isLocked?: boolean
  wordCount?: number
  charCount?: number
  readingTimeMinutes?: number
  createdAt?: number
  lastEditedTime?: number
  customProps?: Record<string, unknown>
}

export interface OpenFileInfo {
  path: string
  name: string
}

export type ViewMode = 'editor' | 'graph'

export interface StatusStatsConfig {
  showWords: boolean
  showLines: boolean
  showChars: boolean
  showSpaces: boolean
  showReadingTime: boolean
  showLanguage: boolean
  showSavedBadge: boolean
}

export interface ParsedDocument {
  metadata: MarkdownMetadata
  content: string
  title: string
}
