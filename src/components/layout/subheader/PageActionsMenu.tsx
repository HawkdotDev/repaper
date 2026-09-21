import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { StatusStatsConfig } from '../../../types'
import PageActionFontsView from './views/PageActionFontsView'
import { FontOption, DEFAULT_RECENT_FONTS } from './views/fontsData'
import PageActionCustomizeView from './views/PageActionCustomizeView'
import PageActionTypographyView from './views/PageActionTypographyView'
import PageActionMainView from './views/PageActionMainView'
import { storageService, STORAGE_KEYS } from '../../../services/storageService'
import { useFileStorageContext } from '../../../context/FileStorageContext'
import { useEditorSettingsContext } from '../../../context/EditorSettingsContext'
import { useUIContext } from '../../../context/UIContext'

export { type FontOption }

export interface PageActionsMenuProps {
  activeFilePath?: string | null
  workspacePath?: string | null
  fileContent?: string
  editorFontFamily?: string
  onChangeFontFamily?: (font: string) => void
  editorFontSize?: number
  onChangeFontSize?: (size: number) => void
  editorLineHeight?: string
  onChangeLineHeight?: (val: string) => void
  editorLetterSpacing?: string
  onChangeLetterSpacing?: (val: string) => void
  editorParagraphSpacing?: string
  onChangeParagraphSpacing?: (val: string) => void
  editorFontWeight?: string
  onChangeFontWeight?: (val: string) => void
  editorTextAlign?: string
  onChangeTextAlign?: (val: string) => void
  isPageLocked?: boolean
  onToggleLockPage?: () => void
  onDuplicateFile?: () => void
  onDeleteFile?: () => void
  onOpenAI?: () => void
  onUndo?: () => void
  onImport?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
  onCopyLink?: () => void
  autoSaveEnabled?: boolean
  onToggleAutoSave?: () => void

  // Customize page options
  statsConfig?: StatusStatsConfig
  onToggleStat?: (key: keyof StatusStatsConfig) => void
  showCover?: boolean
  showIcon?: boolean
  showFileName?: boolean
  isOnlyThisFile?: boolean
  onToggleCover?: () => void
  onToggleIcon?: () => void
  onToggleFileName?: () => void
  onToggleOnlyThisFile?: () => void
}

function PageActionsMenu(props: PageActionsMenuProps): React.JSX.Element {
  const fileStorage = useFileStorageContext()
  const editorSettings = useEditorSettingsContext()
  const ui = useUIContext()

  const activeFilePath = props.activeFilePath !== undefined ? props.activeFilePath : fileStorage.activeFilePath
  const fileContent = props.fileContent !== undefined ? props.fileContent : (activeFilePath ? fileStorage.fileContents[activeFilePath] || '' : '')
  const editorFontFamily = props.editorFontFamily !== undefined ? props.editorFontFamily : editorSettings.editorFontFamily
  const onChangeFontFamily = props.onChangeFontFamily || editorSettings.handleFontFamilyChange
  const editorFontSize = props.editorFontSize !== undefined ? props.editorFontSize : editorSettings.editorFontSize
  const onChangeFontSize = props.onChangeFontSize || editorSettings.handleFontSizeChange
  const editorLineHeight = props.editorLineHeight !== undefined ? props.editorLineHeight : editorSettings.editorLineHeight
  const onChangeLineHeight = props.onChangeLineHeight || editorSettings.handleLineHeightChange
  const editorLetterSpacing = props.editorLetterSpacing !== undefined ? props.editorLetterSpacing : editorSettings.editorLetterSpacing
  const onChangeLetterSpacing = props.onChangeLetterSpacing || editorSettings.handleLetterSpacingChange
  const editorParagraphSpacing = props.editorParagraphSpacing !== undefined ? props.editorParagraphSpacing : editorSettings.editorParagraphSpacing
  const onChangeParagraphSpacing = props.onChangeParagraphSpacing || editorSettings.handleParagraphSpacingChange
  const editorFontWeight = props.editorFontWeight !== undefined ? props.editorFontWeight : editorSettings.editorFontWeight
  const onChangeFontWeight = props.onChangeFontWeight || editorSettings.handleFontWeightChange
  const editorTextAlign = props.editorTextAlign !== undefined ? props.editorTextAlign : editorSettings.editorTextAlign
  const onChangeTextAlign = props.onChangeTextAlign || editorSettings.handleTextAlignChange

  const isPageLocked = props.isPageLocked !== undefined ? props.isPageLocked : ui.isPageLocked
  const onToggleLockPage = props.onToggleLockPage || (() => ui.setIsPageLocked((prev) => !prev))
  const onDuplicateFile = props.onDuplicateFile || fileStorage.handleDuplicateFile
  const onDeleteFile = props.onDeleteFile || fileStorage.handleDeleteFile
  const onUndo = props.onUndo || ui.handleTriggerUndo
  const autoSaveEnabled = props.autoSaveEnabled !== undefined ? props.autoSaveEnabled : ui.autoSaveEnabled
  const onToggleAutoSave = props.onToggleAutoSave || (() => ui.setAutoSaveEnabled((prev) => !prev))

  const statsConfig = props.statsConfig !== undefined ? props.statsConfig : editorSettings.statsConfig
  const onToggleStat = props.onToggleStat || editorSettings.handleToggleStat
  const showCover = props.showCover !== undefined ? props.showCover : editorSettings.effectiveShowCover
  const showIcon = props.showIcon !== undefined ? props.showIcon : editorSettings.effectiveShowIcon
  const showFileName = props.showFileName !== undefined ? props.showFileName : editorSettings.effectiveShowFileName
  const isOnlyThisFile = props.isOnlyThisFile !== undefined ? props.isOnlyThisFile : fileStorage.isOnlyThisFile
  const onToggleCover = props.onToggleCover || editorSettings.handleToggleCover
  const onToggleIcon = props.onToggleIcon || editorSettings.handleToggleIcon
  const onToggleFileName = props.onToggleFileName || editorSettings.handleToggleFileName
  const onToggleOnlyThisFile = props.onToggleOnlyThisFile
  const onOpenAI = props.onOpenAI
  const onImport = props.onImport
  const onExportHTML = props.onExportHTML
  const onExportText = props.onExportText
  const onExportMarkdown = props.onExportMarkdown
  const onCopyLink = props.onCopyLink
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeSubView, setActiveSubView] = useState<
    'main' | 'fonts' | 'customize' | 'textCustomization'
  >('main')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('')
  const [copiedContent, setCopiedContent] = useState<boolean>(false)
  const [recentFonts, setRecentFonts] = useState<FontOption[]>(() => {
    const saved = storageService.getItem<FontOption[]>(STORAGE_KEYS.RECENT_FONTS)
    if (Array.isArray(saved) && saved.length > 0) return saved.slice(0, 3)
    return DEFAULT_RECENT_FONTS
  })

  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveSubView('main')
        setSearchQuery('')
        setFontSearchQuery('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      if (activeSubView === 'main') {
        setTimeout(() => {
          searchInputRef.current?.focus()
        }, 50)
      }
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, activeSubView])

  const selectFont = (font: FontOption): void => {
    onChangeFontFamily(font.family)
    setRecentFonts((prev) => {
      const filtered = prev.filter((f) => f.id !== font.id)
      const updated = [font, ...filtered].slice(0, 3)
      storageService.setItem(STORAGE_KEYS.RECENT_FONTS, updated)
      return updated
    })
  }

  const handleCopyPageContent = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(fileContent)
      setCopiedContent(true)
      setTimeout(() => setCopiedContent(false), 1500)
    } catch (err) {
      console.error('Failed to copy content:', err)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`action-pill-btn w-6.5 h-6.5 p-0 justify-center more-options-btn ${isOpen ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
          setActiveSubView('main')
        }}
        title="More Actions (Page Options)"
      >
        <MoreHorizontal
          size={14}
          strokeWidth={1.75}
          className={isOpen ? 'text-zinc-200' : 'text-zinc-300'}
        />
      </button>

      {isOpen && (
        <div className="page-actions-dropdown-menu" onClick={(e): void => e.stopPropagation()}>
          {activeSubView === 'fonts' && (
            <PageActionFontsView
              editorFontFamily={editorFontFamily}
              fontSearchQuery={fontSearchQuery}
              onFontSearchChange={setFontSearchQuery}
              onSelectFont={selectFont}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'customize' && (
            <PageActionCustomizeView
              activeFilePath={activeFilePath}
              showCover={showCover}
              showIcon={showIcon}
              showFileName={showFileName}
              isOnlyThisFile={isOnlyThisFile}
              statsConfig={statsConfig}
              onToggleCover={onToggleCover}
              onToggleIcon={onToggleIcon}
              onToggleFileName={onToggleFileName}
              onToggleOnlyThisFile={onToggleOnlyThisFile}
              onToggleStat={onToggleStat}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'textCustomization' && (
            <PageActionTypographyView
              editorFontSize={editorFontSize}
              onChangeFontSize={onChangeFontSize}
              editorLineHeight={editorLineHeight}
              onChangeLineHeight={onChangeLineHeight}
              editorLetterSpacing={editorLetterSpacing}
              onChangeLetterSpacing={onChangeLetterSpacing}
              editorParagraphSpacing={editorParagraphSpacing}
              onChangeParagraphSpacing={onChangeParagraphSpacing}
              editorFontWeight={editorFontWeight}
              onChangeFontWeight={onChangeFontWeight}
              editorTextAlign={editorTextAlign}
              onChangeTextAlign={onChangeTextAlign}
              onBack={(): void => setActiveSubView('main')}
            />
          )}

          {activeSubView === 'main' && (
            <PageActionMainView
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchInputRef={searchInputRef}
              recentFonts={recentFonts}
              editorFontFamily={editorFontFamily}
              onSelectFont={selectFont}
              onNavigateSubView={setActiveSubView}
              copiedContent={copiedContent}
              onCopyPageContent={handleCopyPageContent}
              onDuplicateFile={onDuplicateFile}
              onDeleteFile={onDeleteFile}
              autoSaveEnabled={autoSaveEnabled}
              onToggleAutoSave={onToggleAutoSave}
              isPageLocked={isPageLocked}
              onToggleLockPage={onToggleLockPage}
              onOpenAI={onOpenAI}
              onUndo={onUndo}
              onClose={(): void => setIsOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default React.memo(PageActionsMenu)
