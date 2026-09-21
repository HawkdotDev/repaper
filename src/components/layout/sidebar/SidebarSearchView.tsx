import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Search, X, Clock, SlidersHorizontal, CornerDownLeft, Sparkles } from 'lucide-react'
import { normalizePath, getPathKey } from '../../../utils/pathUtils'
import { ProfessionalFileIcon } from '../../../utils/fileIconUtils'
import { useDebounce } from '../../../hooks/useDebounce'

const MAX_CACHE_SIZE = 50

function setCacheItem(cache: Map<string, string>, key: string, value: string): void {
  if (cache.has(key)) {
    cache.delete(key)
  } else if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) {
      cache.delete(oldestKey)
    }
  }
  cache.set(key, value)
}

interface SearchItem {
  path: string
  name: string
  isDir: boolean
  relPath: string
  content?: string
}

interface SearchMatch {
  item: SearchItem
  nameMatched: boolean
  contentMatches: Array<{ line: number; text: string }>
}

interface SidebarSearchViewProps {
  workspacePath: string
  activeFilePath: string | null
  onFileSelect: (filePath: string) => void
  onSelectWithQuery?: (filePath: string, query: string) => void
  fileIcons?: Record<string, string>
  onBackToExplorer?: () => void
}

function SidebarSearchViewComponent({
  workspacePath,
  activeFilePath,
  onFileSelect,
  onSelectWithQuery,
  fileIcons,
  onBackToExplorer
}: SidebarSearchViewProps): React.JSX.Element {
  const [query, setQuery] = useState<string>('')
  const debouncedQuery = useDebounce(query, 200)
  const [searchContent, setSearchContent] = useState<boolean>(true)
  const [items, setItems] = useState<SearchItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const normalizedRoot = useMemo(() => normalizePath(workspacePath), [workspacePath])
  const inputRef = useRef<HTMLInputElement>(null)
  const contentCache = useRef<Map<string, string>>(new Map())

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scan workspace recursively
  useEffect(() => {
    let isMounted = true
    const scan = async (): Promise<void> => {
      if (!workspacePath) return
      setIsLoading(true)

      const collected: SearchItem[] = []
      const scanDir = async (dir: string): Promise<void> => {
        try {
          const dirItems = await window.api.fs.readDirectory(dir)
          for (const it of dirItems) {
            if (it.name.startsWith('.') || it.name === 'node_modules') continue
            const normPath = normalizePath(it.path)
            const rel = normPath.toLowerCase().startsWith(normalizedRoot.toLowerCase())
              ? normPath.slice(normalizedRoot.length).replace(/^[\\/]/, '')
              : it.name

            if (!it.isDir) {
              collected.push({
                path: normPath,
                name: it.name,
                isDir: false,
                relPath: rel
              })
            } else {
              await scanDir(normPath)
            }
          }
        } catch (err) {
          console.error('Failed reading directory in search:', err)
        }
      }

      await scanDir(workspacePath)
      if (isMounted) {
        setItems(collected)
        setIsLoading(false)
      }
    }

    void scan()
    return (): void => {
      isMounted = false
    }
  }, [workspacePath, normalizedRoot])

  // Filtered & Searched matches
  const [matches, setMatches] = useState<SearchMatch[]>([])

  useEffect(() => {
    let isCancelled = false
    const performSearch = async (): Promise<void> => {
      const q = debouncedQuery.trim().toLowerCase()
      if (!q) {
        // When query is empty, show all files as recent / quick list
        setMatches(
          items.map((item) => ({
            item,
            nameMatched: false,
            contentMatches: []
          }))
        )
        return
      }

      // Pre-load any uncached markdown files in parallel
      if (searchContent) {
        const uncachedItems = items.filter(
          (item) => item.name.endsWith('.md') && !contentCache.current.has(item.path)
        )
        if (uncachedItems.length > 0) {
          await Promise.all(
            uncachedItems.map(async (item) => {
              try {
                const content = await window.api.fs.readFile(item.path)
                setCacheItem(contentCache.current, item.path, content)
              } catch {
                setCacheItem(contentCache.current, item.path, '')
              }
            })
          )
        }
      }

      if (isCancelled) return

      const results: Array<SearchMatch & { score: number }> = []

      for (const item of items) {
        const nameLower = item.name.toLowerCase()
        const titleWithoutExt = nameLower.replace(/\.md$/, '')
        const relPathLower = item.relPath.toLowerCase()

        let score = 0
        const contentMatches: Array<{ line: number; text: string }> = []

        if (titleWithoutExt === q) {
          score += 120
        } else if (titleWithoutExt.startsWith(q)) {
          score += 85
        } else if (nameLower.includes(q)) {
          score += 60
        } else if (relPathLower.includes(q)) {
          score += 35
        }

        if (searchContent && item.name.endsWith('.md')) {
          const content = contentCache.current.get(item.path) || ''
          if (content) {
            setCacheItem(contentCache.current, item.path, content)
            const lines = content.split('\n')
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(q)) {
                contentMatches.push({
                  line: i + 1,
                  text: lines[i].trim()
                })
                if (contentMatches.length >= 3) break // Max 3 snippet previews per file
              }
            }
            if (contentMatches.length > 0) {
              score += 25 + contentMatches.length * 5
            }
          }
        }

        if (score > 0) {
          results.push({
            item,
            nameMatched: score >= 35,
            contentMatches,
            score
          })
        }
      }

      results.sort((a, b) => b.score - a.score)

      if (!isCancelled) {
        setMatches(results)
        setSelectedIndex(0)
      }
    }

    void performSearch()

    return (): void => {
      isCancelled = true
    }
  }, [debouncedQuery, items, searchContent])

  // Handle keyboard navigation (Arrow Up, Arrow Down, Enter, Escape)
  const handleSelectFile = useCallback(
    (filePath: string): void => {
      if (onSelectWithQuery && query.trim()) {
        onSelectWithQuery(filePath, query.trim())
      } else {
        onFileSelect(filePath)
      }
    },
    [onFileSelect, onSelectWithQuery, query]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          matches.length > 0 ? (prev + 1) % matches.length : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          matches.length > 0 ? (prev - 1 + matches.length) % matches.length : 0
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (matches[selectedIndex]) {
          handleSelectFile(matches[selectedIndex].item.path)
        }
      } else if (e.key === 'Escape') {
        if (query) {
          setQuery('')
        } else if (onBackToExplorer) {
          onBackToExplorer()
        }
      }
    },
    [matches, selectedIndex, query, handleSelectFile, onBackToExplorer]
  )

  // Highlight matching text helper
  const highlightText = (text: string, q: string): React.ReactNode => {
    if (!q.trim()) return text
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="sidebar-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const activeKey = activeFilePath ? getPathKey(activeFilePath) : ''

  return (
    <div className="sidebar-search-view flex flex-col flex-1 h-full min-h-0 overflow-hidden">
      {/* Top Search Controls */}
      <div className="sidebar-search-header shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Workspace Search
          </span>
          {onBackToExplorer && (
            <button
              type="button"
              className="text-[10.5px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              onClick={onBackToExplorer}
              title="Return to file tree (Esc)"
            >
              Done
            </button>
          )}
        </div>

        <div className="sidebar-search-wrapper">
          <Search size={13} className="sidebar-search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes and content..."
            value={query}
            onChange={(e): void => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="sidebar-search-input"
          />
          {query ? (
            <button
              type="button"
              className="sidebar-search-clear-btn"
              onClick={(): void => setQuery('')}
              title="Clear search (Esc)"
            >
              <X size={12} />
            </button>
          ) : (
            <span className="sidebar-search-badge">ESC</span>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            className={`sidebar-search-filter-chip ${searchContent ? 'active' : ''}`}
            onClick={(): void => setSearchContent((p) => !p)}
            title="Toggle searching within markdown note text"
          >
            <SlidersHorizontal size={11} />
            <span>Search text</span>
          </button>

          <span className="text-[10px] text-zinc-500 font-mono">
            {isLoading
              ? 'Indexing...'
              : query.trim()
                ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`
                : `${items.length} files`}
          </span>
        </div>
      </div>

      {/* Results List */}
      <div className="sidebar-search-results-container flex-1 overflow-y-auto min-h-0">
        {matches.length === 0 && !isLoading ? (
          <div className="sidebar-search-empty flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <Search size={20} className="text-zinc-600 mb-2" />
            <p className="text-xs font-medium text-zinc-400">No matching files found</p>
            <p className="text-[11px] text-zinc-600 mt-1">
              Try searching with another keyword or file name
            </p>
          </div>
        ) : (
          <>
            {!query.trim() && (
              <div className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <Clock size={11} />
                <span>Workspace Files</span>
              </div>
            )}

            {matches.map((match, index) => {
              const { item, contentMatches } = match
              const nodeKey = getPathKey(item.path)
              const isActive = activeKey === nodeKey
              const isSelected = selectedIndex === index
              const relPath = item.relPath.toLowerCase()
              const customIcon = fileIcons ? fileIcons[relPath] : undefined

              const dirBreadcrumb = item.relPath.includes('/')
                ? item.relPath.substring(0, item.relPath.lastIndexOf('/'))
                : ''

              return (
                <div
                  key={item.path}
                  className={`sidebar-search-result-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
                  onClick={(): void => handleSelectFile(item.path)}
                  onMouseEnter={(): void => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 flex items-center">
                      {customIcon ? (
                        <span className="text-xs">{customIcon}</span>
                      ) : (
                        <ProfessionalFileIcon fileName={item.name} />
                      )}
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="sidebar-search-result-name truncate">
                        {highlightText(item.name.endsWith('.md') ? item.name.slice(0, -3) : item.name, query)}
                      </span>
                      {dirBreadcrumb && (
                        <span className="sidebar-search-result-path truncate">
                          {highlightText(dirBreadcrumb, query)}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <CornerDownLeft size={11} className="text-zinc-500 shrink-0 mr-1" />
                    )}
                  </div>

                  {/* Content snippet previews */}
                  {contentMatches.length > 0 && (
                    <div className="sidebar-search-snippets">
                      {contentMatches.map((snippet, sIdx) => (
                        <div
                          key={sIdx}
                          className="sidebar-search-snippet-line truncate cursor-pointer hover:opacity-100 transition-opacity"
                          title={`Jump to match at line ${snippet.line}`}
                          onClick={(e): void => {
                            e.stopPropagation()
                            handleSelectFile(item.path)
                          }}
                        >
                          <span className="sidebar-search-snippet-ln">L{snippet.line}:</span>
                          <span className="sidebar-search-snippet-text">
                            {highlightText(snippet.text, query)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer Navigation Tip */}
      <div className="sidebar-search-footer shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-zinc-600" />
          <span>Quick Finder</span>
        </span>
        {onBackToExplorer && (
          <button
            type="button"
            className="hover:text-zinc-300 transition-colors text-zinc-500 cursor-pointer"
            onClick={onBackToExplorer}
          >
            Back to Files
          </button>
        )}
      </div>
    </div>
  )
}

export default React.memo(SidebarSearchViewComponent)
