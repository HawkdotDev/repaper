import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FolderPlus,
  Search,
  ArrowLeft,
  FileText,
  FilePlus,
  ChevronRight,
  X,
  Compass
} from 'lucide-react'
import { SharpFolderIcon } from './icons/SharpIcons'
import { ProfessionalFileIcon } from '../utils/fileIconUtils'
import { normalizePath, getRelativePath } from '../utils/pathUtils'

export interface KnowledgeHubItem {
  name: string
  path: string
  isDir: boolean
  size?: number
  fileCount?: number
}

interface KnowledgeHubViewProps {
  workspacePath: string | null
  workspaceName?: string
  onFileSelect: (filePath: string) => void
  onCreateFileAtRoot?: () => void
  onOpenWorkspace?: () => void
  fileIcons?: Record<string, string>
  onOpenWelcomeGuide?: () => void
  isLight?: boolean
  onToggleTheme?: () => void
}

function KnowledgeHubView({
  workspacePath,
  workspaceName,
  onFileSelect,
  onCreateFileAtRoot,
  fileIcons = {},
  onOpenWelcomeGuide
}: KnowledgeHubViewProps): React.JSX.Element {
  const [selectedSubDir, setSelectedSubDir] = useState<string | null>(null)
  const currentDir = selectedSubDir ?? workspacePath ?? ''

  const [items, setItems] = useState<KnowledgeHubItem[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [refreshTick, setRefreshTick] = useState<number>(0)

  const isBrowserStorage = !workspacePath || workspacePath === '/workspace'

  // Load directory contents
  useEffect(() => {
    let isMounted = true
    if (!currentDir) return

    const fetchDirectory = async (): Promise<void> => {
      try {
        if (window.api?.fs?.readDirectory) {
          const rawEntries = await window.api.fs.readDirectory(currentDir)
          const parsedItems: KnowledgeHubItem[] = await Promise.all(
            rawEntries
              .filter((entry) => !entry.name.startsWith('.'))
              .map(async (entry) => {
                let childCount = 0
                if (entry.isDir) {
                  try {
                    const children = await window.api.fs.readDirectory(entry.path)
                    childCount = children.filter((c) => !c.name.startsWith('.')).length
                  } catch {
                    childCount = 0
                  }
                }
                return {
                  name: entry.name,
                  path: normalizePath(entry.path),
                  isDir: entry.isDir,
                  fileCount: entry.isDir ? childCount : undefined
                }
              })
          )
          if (isMounted) {
            setItems(parsedItems)
          }
        }
      } catch (err) {
        console.error('Failed to load directory items:', err)
      }
    }

    void fetchDirectory()

    return (): void => {
      isMounted = false
    }
  }, [currentDir, refreshTick])

  // Subfolder navigation
  const handleNavigateFolder = useCallback((folderPath: string): void => {
    setSelectedSubDir(normalizePath(folderPath))
    setSearchQuery('')
  }, [])

  const handleNavigateUp = useCallback((): void => {
    if (!workspacePath || normalizePath(currentDir) === normalizePath(workspacePath)) {
      setSelectedSubDir(null)
      return
    }
    const parent = currentDir.substring(
      0,
      Math.max(currentDir.lastIndexOf('/'), currentDir.lastIndexOf('\\'))
    )
    if (parent && parent.length >= workspacePath.length) {
      setSelectedSubDir(normalizePath(parent))
    } else {
      setSelectedSubDir(null)
    }
    setSearchQuery('')
  }, [currentDir, workspacePath])

  // Split into folders and files
  const folders = useMemo(() => items.filter((item) => item.isDir), [items])
  const files = useMemo(() => items.filter((item) => !item.isDir), [items])

  // Filtered lists
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders
    const q = searchQuery.toLowerCase()
    return folders.filter((f) => f.name.toLowerCase().includes(q))
  }, [folders, searchQuery])

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files
    const q = searchQuery.toLowerCase()
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, searchQuery])

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (!workspacePath) return []
    const normWs = normalizePath(workspacePath)
    const normCur = normalizePath(currentDir)
    if (!normCur.startsWith(normWs)) {
      return [{ name: workspaceName || 'Workspace', path: normWs }]
    }
    const rel = normCur.slice(normWs.length).replace(/^[/\\]/, '')
    if (!rel) {
      return [{ name: workspaceName || 'Workspace', path: normWs }]
    }
    const segments = rel.split('/').filter(Boolean)
    const crumbs = [{ name: workspaceName || 'Workspace', path: normWs }]
    let acc = normWs
    for (const seg of segments) {
      acc = `${acc}/${seg}`
      crumbs.push({ name: seg, path: acc })
    }
    return crumbs
  }, [workspacePath, workspaceName, currentDir])

  const currentFolderName =
    breadcrumbs.length > 0
      ? breadcrumbs[breadcrumbs.length - 1].name
      : workspaceName || 'Workspace'

  // Fast inline actions
  const handleCreateNote = useCallback(async (): Promise<void> => {
    if (!currentDir) {
      if (onCreateFileAtRoot) {
        onCreateFileAtRoot()
      }
      return
    }
    const name = prompt('Enter new note title:')
    if (!name || !name.trim()) return
    const fileName = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`
    try {
      if (window.api?.fs?.createFile) {
        const newPath = await window.api.fs.createFile(currentDir, fileName)
        setRefreshTick((t) => t + 1)
        onFileSelect(normalizePath(newPath))
      }
    } catch (err) {
      alert(`Error creating note: ${err}`)
    }
  }, [currentDir, onCreateFileAtRoot, onFileSelect])

  const handleCreateFolder = useCallback(async (): Promise<void> => {
    if (!currentDir) return
    const name = prompt('Enter new folder name:')
    if (!name || !name.trim()) return
    try {
      if (window.api?.fs?.createFolder) {
        await window.api.fs.createFolder(currentDir, name.trim())
        setRefreshTick((t) => t + 1)
      }
    } catch (err) {
      alert(`Error creating folder: ${err}`)
    }
  }, [currentDir])

  return (
    <div className="knowledge-hub-container select-none">
      <div className="knowledge-hub-inner">
        {/* ====== HERO HEADER ====== */}
        <div className="hub-hero">
          {/* Subfolder Breadcrumb Navigation */}
          {selectedSubDir && (
            <nav className="hub-breadcrumbs" aria-label="Folder Breadcrumb">
              <button
                type="button"
                className="hub-back-btn"
                onClick={handleNavigateUp}
                title="Go up one level"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <div className="hub-breadcrumb-trail">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={crumb.path}>
                      {idx > 0 && <span className="hub-breadcrumb-sep">/</span>}
                      {isLast ? (
                        <span className="hub-breadcrumb-current">{crumb.name}</span>
                      ) : (
                        <button
                          type="button"
                          className="hub-breadcrumb-link"
                          onClick={(): void =>
                            setSelectedSubDir(
                              crumb.path === normalizePath(workspacePath || '') ? null : crumb.path
                            )
                          }
                        >
                          {crumb.name}
                        </button>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </nav>
          )}

          {/* Title & Action Buttons */}
          <div className="hub-title-row">
            <div>
              <h1 className="hub-page-title">
                {selectedSubDir ? currentFolderName : workspaceName || 'Workspace'}
              </h1>
              <p className="hub-page-subtitle">
                {files.length} {files.length === 1 ? 'note' : 'notes'}
                {folders.length > 0 &&
                  ` • ${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`}
                {isBrowserStorage ? ' • In-Browser Storage' : ' • Local Disk'}
              </p>
            </div>

            <div className="hub-actions">
              {onOpenWelcomeGuide && (
                <button
                  type="button"
                  className="hub-action-btn"
                  onClick={onOpenWelcomeGuide}
                  title="Open Welcome Guide & Shortcuts"
                >
                  <Compass size={13} className="text-zinc-400 shrink-0" />
                  <span>Guide</span>
                </button>
              )}
              <button
                type="button"
                className="hub-action-btn"
                onClick={handleCreateFolder}
                title="Create New Folder"
              >
                <FolderPlus size={13} className="text-zinc-400 shrink-0" />
                <span>Folder</span>
              </button>
              <button
                type="button"
                className="hub-action-btn primary"
                onClick={handleCreateNote}
                title="Create New Note"
              >
                <FilePlus size={13} className="shrink-0" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          {(items.length > 3 || searchQuery) && (
            <div className="hub-filter-bar">
              <div className="hub-search-box">
                <Search size={13} className="text-zinc-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Filter notes and folders..."
                  value={searchQuery}
                  onChange={(e): void => setSearchQuery(e.target.value)}
                  className="hub-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(): void => setSearchQuery('')}
                    className="hub-search-clear-btn"
                    title="Clear filter"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ====== FOLDERS SECTION ====== */}
        {filteredFolders.length > 0 && (
          <section className="hub-section">
            <div className="hub-section-label">FOLDERS</div>
            <div className="hub-folder-chips-grid">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.path}
                  className="hub-folder-chip"
                  onClick={(): void => handleNavigateFolder(folder.path)}
                  title={`Open folder: ${folder.name}`}
                >
                  <SharpFolderIcon size={14} className="text-zinc-400 shrink-0" />
                  <span className="hub-folder-chip-title truncate">{folder.name}</span>
                  <span className="tree-node-count-pill">{folder.fileCount ?? 0}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== DOCUMENTS / NOTES SECTION ====== */}
        <section className="hub-section">
          <div className="hub-section-label">
            {selectedSubDir ? 'NOTES IN THIS FOLDER' : 'NOTES'}
          </div>

          {filteredFiles.length > 0 ? (
            <div className="hub-notes-list">
              {filteredFiles.map((file) => {
                const rel = getRelativePath(file.path, workspacePath).toLowerCase()
                const customIcon = fileIcons[rel]
                const displayName = file.name.endsWith('.md')
                  ? file.name.slice(0, -3)
                  : file.name
                const ext = file.name.includes('.')
                  ? file.name.split('.').pop()?.toUpperCase()
                  : null
                const isNonMd = ext && ext !== 'MD'

                return (
                  <div
                    key={file.path}
                    className="hub-note-row group"
                    onClick={(): void => onFileSelect(file.path)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="hub-note-icon shrink-0">
                        {customIcon ? (
                          <span className="text-[13px]">{customIcon}</span>
                        ) : (
                          <ProfessionalFileIcon fileName={file.name} />
                        )}
                      </span>
                      <span className="hub-note-title truncate">{displayName}</span>
                      {isNonMd && <span className="hub-note-ext-badge">{ext}</span>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronRight
                        size={13}
                        className="hub-note-arrow opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : searchQuery ? (
            <div className="hub-empty-state">
              <p className="text-xs text-zinc-500 mb-2">
                No matching items found for &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                className="hub-empty-action-btn"
                onClick={(): void => setSearchQuery('')}
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="hub-empty-state">
              <FileText size={22} className="text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500 mb-3">No documents in this location</p>
              <div className="flex items-center gap-2">
                {onOpenWelcomeGuide && (
                  <button
                    type="button"
                    className="hub-action-btn"
                    onClick={onOpenWelcomeGuide}
                    title="Open Welcome Guide & Shortcuts"
                  >
                    <Compass size={13} className="text-zinc-400" />
                    <span>View Guide</span>
                  </button>
                )}
                <button
                  type="button"
                  className="hub-action-btn primary"
                  onClick={handleCreateNote}
                >
                  <FilePlus size={13} />
                  <span>Create note</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default React.memo(KnowledgeHubView)
