import React, { useState, useMemo, useCallback } from 'react'
import { Search, X, ListTree, FileText } from 'lucide-react'

export interface OutlineHeadingItem {
  id?: string
  idx?: number
  level: number
  text: string
  rawText?: string
  line?: number
}

interface OutlinePanelProps {
  content?: string
  headings?: OutlineHeadingItem[]
  onClose?: () => void
  hasActiveFile?: boolean
}

function cleanMarkdownHeading(text: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function OutlinePanelComponent({
  content = '',
  headings: propHeadings,
  onClose,
  hasActiveFile = true
}: OutlinePanelProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHeadingText, setActiveHeadingText] = useState<string | null>(null)

  const parsedHeadings: OutlineHeadingItem[] = useMemo(() => {
    if (propHeadings && propHeadings.length > 0) {
      return propHeadings.map((h, i) => ({
        id: h.id || `heading-${i}-${h.level}`,
        idx: h.idx ?? i,
        level: h.level,
        text: cleanMarkdownHeading(h.text),
        rawText: h.rawText || h.text,
        line: h.line
      }))
    }

    if (!content) return []
    return content
      .split('\n')
      .map((line, idx) => {
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (!headingMatch) return null
        const level = headingMatch[1].length
        const rawText = headingMatch[2]
        const text = cleanMarkdownHeading(rawText)
        return {
          id: `heading-${idx}-${level}`,
          idx,
          level,
          text,
          rawText,
          line: idx + 1
        }
      })
      .filter(Boolean) as OutlineHeadingItem[]
  }, [propHeadings, content])

  const filteredHeadings = useMemo(() => {
    if (!searchQuery.trim()) return parsedHeadings
    const q = searchQuery.toLowerCase().trim()
    return parsedHeadings.filter((h) => h.text.toLowerCase().includes(q))
  }, [parsedHeadings, searchQuery])

  const scrollToHeading = useCallback((item: OutlineHeadingItem): void => {
    setActiveHeadingText(item.text)
    const editorElem =
      document.querySelector('.editor-container') ||
      document.querySelector('.codex-editor') ||
      document.querySelector('.editor-wrapper')

    if (!editorElem) return

    const headers = editorElem.querySelectorAll('h1, h2, h3, h4, h5, h6, .ce-header')
    const search = item.text.trim().toLowerCase()

    for (const h of Array.from(headers)) {
      const cleanHText = (h.textContent || '').trim().toLowerCase()
      if (cleanHText === search || cleanHText.includes(search) || search.includes(cleanHText)) {
        h.scrollIntoView({ behavior: 'smooth', block: 'center' })
        h.classList.add('outline-target-highlight')
        setTimeout(() => {
          h.classList.remove('outline-target-highlight')
        }, 1200)
        break
      }
    }
  }, [])

  return (
    <div className="outline-widget-root">
      {/* 38px Top Bar matching Left Sidebar Header line - No redundant "Outline" text */}
      <div className="right-sidebar-header">
        {hasActiveFile && parsedHeadings.length > 0 ? (
          <div className="outline-search-box">
            <Search size={12} strokeWidth={1.75} className="outline-search-icon shrink-0" />
            <input
              type="text"
              className="outline-search-input"
              placeholder="Filter headings..."
              value={searchQuery}
              onChange={(e): void => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="outline-search-clear"
                onClick={(): void => setSearchQuery('')}
                title="Clear filter (Esc)"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {onClose && (
          <button
            type="button"
            className="right-sidebar-btn"
            onClick={onClose}
            title="Close outline"
            aria-label="Close outline"
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Headings List or Empty State */}
      <div className="outline-list-container">
        {!hasActiveFile ? (
          <div className="outline-empty-state">
            <div className="outline-empty-icon-wrap">
              <FileText size={18} strokeWidth={1.25} />
            </div>
            <span className="outline-empty-title">No file open</span>
            <span className="outline-empty-desc">
              Select a note from the explorer to see its outline
            </span>
          </div>
        ) : filteredHeadings.length === 0 ? (
          <div className="outline-empty-state">
            <div className="outline-empty-icon-wrap">
              <ListTree size={18} strokeWidth={1.25} />
            </div>
            <span className="outline-empty-title">
              {searchQuery ? 'No matching headings' : 'No headings found'}
            </span>
            <span className="outline-empty-desc">
              {searchQuery ? 'Try a different filter term' : 'Add # Heading 1 to structure your note'}
            </span>
          </div>
        ) : (
          <div className="outline-tree">
            {filteredHeadings.map((item) => {
              const indentLevel = Math.max(0, item.level - 1)
              const isActive = activeHeadingText === item.text

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`outline-item level-${item.level} ${isActive ? 'is-active' : ''}`}
                  style={{ paddingLeft: `${indentLevel * 12 + 10}px` }}
                  onClick={(): void => scrollToHeading(item)}
                  title={`Jump to: ${item.text}`}
                >
                  <span className="outline-level-pill">{`H${item.level}`}</span>
                  <span className="outline-item-text">{item.text}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer info stats dock matching left sidebar dock */}
      {hasActiveFile && parsedHeadings.length > 0 && (
        <div className="outline-footer-stats">
          <span className="outline-footer-count">
            {searchQuery
              ? `${filteredHeadings.length} of ${parsedHeadings.length} matching`
              : `${parsedHeadings.length} ${parsedHeadings.length === 1 ? 'heading' : 'headings'}`}
          </span>
          <span className="outline-footer-range">
            {`H${Math.min(...parsedHeadings.map((h) => h.level))}–H${Math.max(...parsedHeadings.map((h) => h.level))}`}
          </span>
        </div>
      )}
    </div>
  )
}

export default React.memo(OutlinePanelComponent)
