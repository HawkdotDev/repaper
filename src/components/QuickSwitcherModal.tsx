import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Search, FileText, CornerDownLeft, X } from 'lucide-react'
import { normalizePath } from '../utils/pathUtils'
import { ProfessionalFileIcon } from '../utils/fileIconUtils'
import { useWorkspaceContext } from '../context/WorkspaceContext'
import { useFileStorageContext } from '../context/FileStorageContext'

export interface QuickSwitcherItem {
  path: string
  name: string
  relPath: string
}

export interface QuickSwitcherModalProps {
  isOpen: boolean
  onClose: () => void
  workspacePath?: string | null
  onFileSelect?: (filePath: string) => void
  fileIcons?: Record<string, string>
}

export default function QuickSwitcherModal(props: QuickSwitcherModalProps): React.JSX.Element | null {
  const workspace = useWorkspaceContext()
  const fileStorage = useFileStorageContext()

  const isOpen = props.isOpen
  const onClose = props.onClose
  const workspacePath = props.workspacePath !== undefined ? props.workspacePath : workspace.workspacePath
  const onFileSelect = props.onFileSelect || fileStorage.handleFileSelect
  const fileIcons = props.fileIcons !== undefined ? props.fileIcons : fileStorage.fileIcons
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<QuickSwitcherItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true)
    setQuery('')
    setSelectedIndex(0)
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter items based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 30)

    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.relPath.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [items, query])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = useCallback(
    (filePath: string) => {
      onFileSelect(filePath)
      onClose()
    },
    [onFileSelect, onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].path)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, selectedIndex, handleSelect, onClose]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#16161a] border border-[#27272f] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[70vh] text-zinc-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#23232b] bg-[#1a1a20]">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
            placeholder="Search notes by name or path... (↑↓ to navigate, ↵ to jump)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setSelectedIndex(0)
              }}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] font-mono text-zinc-500 bg-[#0E0E11] px-1.5 py-0.5 rounded border border-[#23232b]">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center">
              <FileText size={24} className="mb-2 text-zinc-600" />
              <p>No matching notes found</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              const iconKey = item.relPath.toLowerCase()
              const customIcon = fileIcons[iconKey]

              return (
                <div
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-purple-600/20 text-white font-medium border border-purple-500/30'
                      : 'text-zinc-300 hover:bg-[#202026] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 text-zinc-400">
                      {customIcon ? (
                        <span className="text-sm">{customIcon}</span>
                      ) : (
                        <ProfessionalFileIcon fileName={item.name} />
                      )}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{item.name.replace(/\.md$/, '')}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{item.relPath}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-purple-400 shrink-0">
                      <span>Jump</span>
                      <CornerDownLeft size={10} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-[#23232b] bg-[#121216] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>{filtered.length} notes found</span>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
