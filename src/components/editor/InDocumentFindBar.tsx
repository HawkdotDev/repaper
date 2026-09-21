import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react'

export interface InDocumentFindBarProps {
  containerSelector?: string
  initialQuery?: string
  onClose: () => void
}

export function InDocumentFindBar({
  containerSelector = '.editor-wrapper',
  initialQuery = '',
  onClose
}: InDocumentFindBarProps): React.JSX.Element {
  const [query, setQuery] = useState(initialQuery)
  const [matchCase, setMatchCase] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const matchesRef = useRef<HTMLElement[]>([])

  // Helper to remove all highlight marks from DOM
  const removeHighlightMarksFromDOM = useCallback((): void => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const existingMarks = container.querySelectorAll('mark.oink-find-match')
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark)
        }
        parent.removeChild(mark)
        parent.normalize()
      }
    })
    matchesRef.current = []
  }, [containerSelector])

  // Perform search and DOM highlighting
  const performSearch = useCallback((): void => {
    removeHighlightMarksFromDOM()

    const trimmed = query.trim()
    if (!trimmed) {
      setTotalMatches(0)
      setCurrentIndex(0)
      return
    }

    const container = document.querySelector(containerSelector)
    if (!container) {
      setTotalMatches(0)
      setCurrentIndex(0)
      return
    }

    // Find all text nodes in content blocks (skipping find bar itself)
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          if (
            parent.closest('.in-document-find-bar') ||
            parent.closest('.notion-page-header') ||
            parent.tagName === 'SCRIPT' ||
            parent.tagName === 'STYLE' ||
            parent.tagName === 'TEXTAREA' ||
            parent.tagName === 'INPUT'
          ) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    const textNodes: Text[] = []
    let currentNode = walker.nextNode()
    while (currentNode) {
      textNodes.push(currentNode as Text)
      currentNode = walker.nextNode()
    }

    const createdMarks: HTMLElement[] = []
    const flags = matchCase ? 'g' : 'gi'
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, flags)

    textNodes.forEach((node) => {
      const text = node.nodeValue || ''
      if (!regex.test(text)) return
      regex.lastIndex = 0

      const fragment = document.createDocumentFragment()
      let lastIndex = 0
      let match: RegExpExecArray | null = regex.exec(text)

      while (match !== null) {
        // Text before match
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)))
        }

        // Highlight mark
        const mark = document.createElement('mark')
        mark.className = 'oink-find-match'
        mark.textContent = match[0]
        fragment.appendChild(mark)
        createdMarks.push(mark)

        lastIndex = regex.lastIndex
        match = regex.exec(text)
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)))
      }

      node.parentNode?.replaceChild(fragment, node)
    })

    matchesRef.current = createdMarks
    setTotalMatches(createdMarks.length)

    if (createdMarks.length > 0) {
      setCurrentIndex(0)
      createdMarks[0].classList.add('oink-find-match--active')
      createdMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setCurrentIndex(0)
    }
  }, [containerSelector, matchCase, query, removeHighlightMarksFromDOM])

  // Re-run search when query or matchCase changes
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      performSearch()
    })
    return () => cancelAnimationFrame(frameId)
  }, [performSearch])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      removeHighlightMarksFromDOM()
    }
  }, [removeHighlightMarksFromDOM])

  const goToMatch = useCallback((index: number): void => {
    const marks = matchesRef.current
    if (!marks.length) return

    const normalizedIndex = (index + marks.length) % marks.length

    marks.forEach((m, i) => {
      if (i === normalizedIndex) {
        m.classList.add('oink-find-match--active')
        m.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        m.classList.remove('oink-find-match--active')
      }
    })

    setCurrentIndex(normalizedIndex)
  }, [])

  const handleNext = useCallback((): void => {
    if (totalMatches === 0) return
    goToMatch(currentIndex + 1)
  }, [currentIndex, goToMatch, totalMatches])

  const handlePrev = useCallback((): void => {
    if (totalMatches === 0) return
    goToMatch(currentIndex - 1)
  }, [currentIndex, goToMatch, totalMatches])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        handlePrev()
      } else {
        handleNext()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className="in-document-find-bar select-none" role="search">
      <div className="find-bar-input-wrapper">
        <Search size={13} className="find-bar-search-icon shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e): void => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in note..."
          className="find-bar-input"
          aria-label="Find in note"
        />
        {query && (
          <button
            type="button"
            className="find-bar-icon-btn"
            onClick={(): void => setQuery('')}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <button
        type="button"
        className={`find-bar-toggle-btn ${matchCase ? 'active' : ''}`}
        onClick={(): void => setMatchCase((p) => !p)}
        title="Match Case (Alt+C)"
      >
        Aa
      </button>

      <span className="find-bar-counter">
        {totalMatches > 0
          ? `${currentIndex + 1} of ${totalMatches}`
          : query.trim()
            ? '0 of 0'
            : ''}
      </span>

      <div className="find-bar-divider" />

      <button
        type="button"
        className="find-bar-icon-btn"
        disabled={totalMatches === 0}
        onClick={handlePrev}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={14} />
      </button>

      <button
        type="button"
        className="find-bar-icon-btn"
        disabled={totalMatches === 0}
        onClick={handleNext}
        title="Next match (Enter)"
      >
        <ChevronDown size={14} />
      </button>

      <button
        type="button"
        className="find-bar-icon-btn find-bar-close-btn"
        onClick={onClose}
        title="Close (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default InDocumentFindBar
