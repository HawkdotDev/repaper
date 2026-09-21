import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, FileText, CornerDownLeft, X, SlidersHorizontal } from 'lucide-react'
import { normalizePath } from '../utils/pathUtils'
import { ProfessionalFileIcon } from '../utils/fileIconUtils'
import { useWorkspaceContext } from '../context/WorkspaceContext'
import { useFileStorageContext } from '../context/FileStorageContext'
import { useDebounce } from '../hooks/useDebounce'

export interface QuickSwitcherItem {
  path: string
  name: string
  relPath: string
  contentMatches?: Array<{ line: number; text: string }>
  score?: number
}

export type QuickSwitcherMode = 'all' | 'titles' | 'content'

export interface QuickSwitcherModalProps {
  isOpen: boolean
  onClose: () => void
  workspacePath?: string | null
  onFileSelect?: (filePath: string) => void
  onSelectWithQuery?: (filePath: string, query: string) => void
  fileIcons?: Record<string, string>
}

const MAX_PREVIEW_MATCHES = 35
const MAX_CONTENT_CACHE = 80

function highlightText(text: string, q: string): React.ReactNode {
  const trimmed = q.trim()
  if (!trimmed) return text
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <mark key={i} className="quick-switcher-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export default function QuickSwitcherModal(props: QuickSwitcherModalProps): React.JSX.Element | null {
  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()

  const isOpen = props.isOpen
  const onClose = props.onClose
  const workspacePath = props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath
  const onFileSelect = props.onFileSelect || fileStorage.handleFileSelect
  const onSelectWithQuery = props.onSelectWithQuery
  const fileIcons = props.fileIcons !== undefined ? props.fileIcons : fileStorage.fileIcons

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 120)
  const [mode, setMode] = useState<QuickSwitcherMode>('all')
  const [items, setItems] = useState<QuickSwitcherItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [matches, setMatches] = useState<QuickSwitcherItem[]>([])
  const [isSearchingContent, setIsSearchingContent] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const contentCache = useRef<Map<string, string>>(new Map())

  // Scan workspace files on open
  useEffect(() => {
    if (!isOpen || !workspacePath) return

    let isMounted = true
    const normalizedRoot = normalizePath(workspacePath)

    const scanDir = async (dir: string): Promise<QuickSwitcherItem[]> => {
      const results: QuickSwitcherItem[] = []
      try {
        const entries = await window.api.fs.readDirectory(dir)
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
          const normPath = normalizePath(entry.path)
          if (entry.isDir) {
            const sub = await scanDir(normPath)
            results.push(...sub)
          } else if (entry.name.endsWith('.md')) {
            const rel = normPath.toLowerCase().startsWith(normalizedRoot.toLowerCase())
              ? normPath.slice(normalizedRoot.length).replace(/^[\\/]/, '')
              : entry.name
            results.push({
              path: normPath,
              name: entry.name,
              relPath: rel
            })
          }
        }
      } catch (err) {
        console.warn('Failed reading directory for quick switcher:', err)
      }
      return results
    }

    void scanDir(workspacePath).then((files) => {
      if (isMounted) {
        setItems(files)
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen, workspacePath])

  // Reset state when opening
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 40)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Search execution with ranking & async content searching
  useEffect(() => {
    let isCancelled = false

    const runSearch = async (): Promise<void> => {
      const q = debouncedQuery.trim().toLowerCase()
      if (!q) {
        setMatches(
          items.slice(0, MAX_PREVIEW_MATCHES).map((item) => ({
            ...item,
            contentMatches: []
          }))
        )
        setSelectedIndex(0)
        return
      }

      // Preload contents of markdown files for content search
      const shouldSearchContent = mode === 'all' || mode === 'content'
      if (shouldSearchContent) {
        const uncached = items.filter((it) => !contentCache.current.has(it.path))
        if (uncached.length > 0) {
          setIsSearchingContent(true)
          // Load in batches to avoid overwhelming disk I/O
          const batch = uncached.slice(0, 50)
          await Promise.all(
            batch.map(async (item) => {
              try {
                const text = await window.api.fs.readFile(item.path)
                if (contentCache.current.size >= MAX_CONTENT_CACHE) {
                  const firstKey = contentCache.current.keys().next().value
                  if (firstKey !== undefined) contentCache.current.delete(firstKey)
                }
                contentCache.current.set(item.path, text)
              } catch {
                contentCache.current.set(item.path, '')
              }
            })
          )
          if (!isCancelled) setIsSearchingContent(false)
        }
      }

      if (isCancelled) return

      const results: QuickSwitcherItem[] = []

      for (const item of items) {
        const nameLower = item.name.toLowerCase()
        const titleWithoutExt = nameLower.replace(/\.md$/, '')
        const relPathLower = item.relPath.toLowerCase()

        let score = 0
        const contentMatches: Array<{ line: number; text: string }> = []

        // Title matching
        if (mode !== 'content') {
          if (titleWithoutExt === q) {
            score += 120
          } else if (titleWithoutExt.startsWith(q)) {
            score += 90
          } else if (nameLower.includes(q)) {
            score += 65
          } else if (relPathLower.includes(q)) {
            score += 40
          }
        }

        // Content matching
        if (shouldSearchContent) {
          const content = contentCache.current.get(item.path) || ''
          if (content && content.toLowerCase().includes(q)) {
            const lines = content.split('\n')
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(q)) {
                contentMatches.push({
                  line: i + 1,
                  text: lines[i].trim()
                })
                if (contentMatches.length >= 2) break
              }
            }
            if (contentMatches.length > 0) {
              score += 30 + contentMatches.length * 5
            }
          }
        }

        if (score > 0) {
          results.push({
            ...item,
            score,
            contentMatches
          })
        }
      }

      // Sort by score descending
      results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

      if (!isCancelled) {
        setMatches(results.slice(0, MAX_PREVIEW_MATCHES))
        setSelectedIndex(0)
      }
    }

    void runSearch()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, items, mode])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = useCallback(
    (item: QuickSwitcherItem) => {
      const trimmedQuery = query.trim()
      if (onSelectWithQuery && trimmedQuery) {
        onSelectWithQuery(item.path, trimmedQuery)
      } else {
        onFileSelect(item.path)
      }
      onClose()
    },
    [onFileSelect, onSelectWithQuery, query, onClose]
  )

  const cycleMode = useCallback((): void => {
    setMode((prev) => {
      if (prev === 'all') return 'titles'
      if (prev === 'titles') return 'content'
      return 'all'
    })
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (matches.length > 0 ? (prev + 1) % matches.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (matches.length > 0 ? (prev - 1 + matches.length) % matches.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (matches[selectedIndex]) {
          handleSelect(matches[selectedIndex])
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        cycleMode()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [matches, selectedIndex, handleSelect, cycleMode, onClose]
  )

  if (!isOpen) return null

  return (
    <div className="quick-switcher-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="quick-switcher-dialog"
        onClick={(e): void => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header with Search Input */}
        <div className="quick-switcher-header">
          <div className="quick-switcher-input-box">
            <Search size={16} className="quick-switcher-input-icon" />
            <input
              ref={inputRef}
              type="text"
              className="quick-switcher-input"
              placeholder={
                mode === 'titles'
                  ? 'Search note titles...'
                  : mode === 'content'
                    ? 'Search note content...'
                    : 'Search notes by title or content...'
              }
              value={query}
              onChange={(e): void => setQuery(e.target.value)}
              aria-label="Quick Switcher search query"
            />
            {query && (
              <button
                type="button"
                className="quick-switcher-clear-btn"
                onClick={(): void => {
                  setQuery('')
                  setSelectedIndex(0)
                  inputRef.current?.focus()
                }}
                title="Clear input"
              >
                <X size={13} />
              </button>
            )}
            <kbd className="quick-switcher-kbd">ESC</kbd>
          </div>

          {/* Filter Mode Bar */}
          <div className="quick-switcher-filter-bar">
            <button
              type="button"
              className={`quick-switcher-filter-chip ${mode === 'all' ? 'active' : ''}`}
              onClick={(): void => setMode('all')}
              title="Search both titles and note content"
            >
              All
            </button>
            <button
              type="button"
              className={`quick-switcher-filter-chip ${mode === 'titles' ? 'active' : ''}`}
              onClick={(): void => setMode('titles')}
              title="Search file names and paths only"
            >
              Titles
            </button>
            <button
              type="button"
              className={`quick-switcher-filter-chip ${mode === 'content' ? 'active' : ''}`}
              onClick={(): void => setMode('content')}
              title="Search note body text only"
            >
              Content
            </button>
            <span className="text-[10px] text-zinc-500 ml-auto font-mono flex items-center gap-1">
              <SlidersHorizontal size={10} />
              <span>Tab to switch mode</span>
            </span>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="quick-switcher-list" role="listbox">
          {matches.length === 0 ? (
            <div className="quick-switcher-empty">
              <FileText size={28} className="opacity-40" />
              <p className="quick-switcher-empty-title">No matching notes found</p>
              <p className="quick-switcher-empty-sub">
                {query.trim()
                  ? `Try a different keyword or switch filter mode`
                  : 'Workspace contains no markdown notes yet'}
              </p>
            </div>
          ) : (
            matches.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const iconKey = item.relPath.toLowerCase()
              const customIcon = fileIcons[iconKey]
              const cleanTitle = item.name.replace(/\.md$/, '')
              const hasContentMatches = item.contentMatches && item.contentMatches.length > 0

              return (
                <div
                  key={item.path}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(): void => handleSelect(item)}
                  onMouseEnter={(): void => setSelectedIndex(idx)}
                  className={`quick-switcher-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="quick-switcher-item-main">
                    <div className="quick-switcher-item-info">
                      <span className="shrink-0 flex items-center">
                        {customIcon ? (
                          <span className="text-sm">{customIcon}</span>
                        ) : (
                          <ProfessionalFileIcon fileName={item.name} />
                        )}
                      </span>
                      <div className="quick-switcher-item-titles">
                        <span className="quick-switcher-item-name">
                          {highlightText(cleanTitle, query)}
                        </span>
                        <span className="quick-switcher-item-path">
                          {highlightText(item.relPath, query)}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="quick-switcher-item-action">
                        <span>Jump</span>
                        <CornerDownLeft size={11} />
                      </div>
                    )}
                  </div>

                  {/* Snippet previews */}
                  {hasContentMatches && (
                    <div className="quick-switcher-snippets">
                      {item.contentMatches!.map((snippet, sIdx) => (
                        <div key={sIdx} className="quick-switcher-snippet-line">
                          <span className="quick-switcher-snippet-ln">L{snippet.line}:</span>
                          <span>{highlightText(snippet.text, query)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="quick-switcher-footer">
          <span className="quick-switcher-footer-count">
            {isSearchingContent
              ? 'Searching...'
              : `${matches.length} ${matches.length === 1 ? 'note' : 'notes'}`}
          </span>
          <div className="quick-switcher-footer-shortcuts">
            <span>↑↓ Navigate</span>
            <span>↵ Jump</span>
            <span>Tab Mode</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}

