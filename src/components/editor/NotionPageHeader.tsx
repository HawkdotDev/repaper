import React, { useState, Suspense, lazy } from 'react'
import { Smile, Image, Minus, FileText } from 'lucide-react'
const EmojiPicker = lazy(() => import('../EmojiPicker'))
const BannerPicker = lazy(() => import('../BannerPicker'))
import { manipulateSvgTheme } from '../../utils/themeSvgUtils'
import { getRelativePath } from '../../utils/pathUtils'

interface NotionPageHeaderProps {
  activeFilePath: string | null
  workspacePath: string | null
  effectiveShowCover: boolean
  effectiveShowIcon: boolean
  effectiveShowFileName: boolean
  activeFileBanner?: string
  activeFileIcon?: string
  isPageLocked?: boolean
  onSetFileIcon: (relPath: string, icon: string | null) => void
  onSetFileBanner: (relPath: string, banner: string | null) => void
  onRenameActiveFile: (newTitle: string) => void
  onToggleFileName?: () => void
}

function NotionPageHeaderComponent({
  activeFilePath,
  workspacePath,
  effectiveShowCover,
  effectiveShowIcon,
  effectiveShowFileName,
  activeFileBanner,
  activeFileIcon,
  isPageLocked = false,
  onSetFileIcon,
  onSetFileBanner,
  onRenameActiveFile,
  onToggleFileName
}: NotionPageHeaderProps): React.JSX.Element {
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [showBannerPicker, setShowBannerPicker] = useState<boolean>(false)

  const relKey =
    activeFilePath && workspacePath
      ? getRelativePath(activeFilePath, workspacePath).toLowerCase()
      : ''

  const quickEmojis = ['✦', '★', '⌘', '📝', '🚀', '💡', '🔥', '⭐', '🎨', '💻', '⚡', '🎯', '🌱']

  const showGhostActions =
    (effectiveShowIcon && !activeFileIcon) ||
    (effectiveShowCover && !activeFileBanner) ||
    (!effectiveShowFileName && !isPageLocked && Boolean(onToggleFileName))

  return (
    <>
      <div
        className={`notion-page-header ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''} ${effectiveShowIcon && activeFileIcon ? 'has-icon' : ''}`}
      >
        {/* Top ghost buttons when no icon or cover exists, or file name is hidden */}
        {showGhostActions && (
          <div className="notion-header-ghost-actions">
            {effectiveShowIcon && !activeFileIcon && (
              <button className="notion-ghost-btn" onClick={(): void => setShowEmojiPicker(true)}>
                <Smile size={13} strokeWidth={1.5} className="shrink-0 opacity-70" />
                <span>Add icon</span>
              </button>
            )}
            {effectiveShowCover && !activeFileBanner && (
              <button className="notion-ghost-btn" onClick={(): void => setShowBannerPicker(true)}>
                <Image size={13} strokeWidth={1.75} className="shrink-0 opacity-70" />
                <span>Add banner</span>
              </button>
            )}
            {!effectiveShowFileName && !isPageLocked && onToggleFileName && (
              <button
                type="button"
                className="notion-ghost-btn"
                onClick={onToggleFileName}
                title="Show file name"
              >
                <FileText size={13} strokeWidth={1.75} className="shrink-0 opacity-70" />
                <span>Show file name</span>
              </button>
            )}
          </div>
        )}

        {/* Page Icon Display */}
        {effectiveShowIcon && activeFileIcon && (
          <div
            className={`notion-icon-container group ${effectiveShowCover && activeFileBanner ? 'has-cover' : ''}`}
          >
            <button
              className="notion-icon-btn"
              onClick={(): void => setShowEmojiPicker((prev) => !prev)}
              title="Change icon"
            >
              {typeof activeFileIcon === 'string' && activeFileIcon.includes('<svg') ? (
                <span
                  className="theme-svg-container"
                  dangerouslySetInnerHTML={{
                    __html: manipulateSvgTheme(activeFileIcon)
                  }}
                />
              ) : (
                activeFileIcon
              )}
            </button>

            <div className="notion-icon-hover-toolbar opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="notion-icon-quick-btn"
                onClick={(): void => {
                  if (!relKey) return
                  const randomEmoji = quickEmojis[Math.floor(Math.random() * quickEmojis.length)]
                  onSetFileIcon(relKey, randomEmoji)
                }}
              >
                Random
              </button>
              <button
                className="notion-icon-quick-btn"
                onClick={(): void => {
                  if (!relKey) return
                  onSetFileIcon(relKey, null)
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Popovers */}
        {showEmojiPicker && (
          <Suspense fallback={null}>
            <EmojiPicker
              onSelect={(emoji): void => {
                if (relKey) onSetFileIcon(relKey, emoji)
                setShowEmojiPicker(false)
              }}
              onRemove={(): void => {
                if (relKey) onSetFileIcon(relKey, null)
              }}
              onClose={(): void => setShowEmojiPicker(false)}
            />
          </Suspense>
        )}

        {showBannerPicker && (
          <Suspense fallback={null}>
            <BannerPicker
              onSelect={(bannerUrl): void => {
                if (relKey) onSetFileBanner(relKey, bannerUrl)
                setShowBannerPicker(false)
              }}
              onClose={(): void => setShowBannerPicker(false)}
            />
          </Suspense>
        )}
      </div>

      {effectiveShowFileName && (
        <div className="document-title-container">
          {onToggleFileName && !isPageLocked && (
            <button
              type="button"
              className="document-title-remove-btn"
              onClick={onToggleFileName}
              title="Hide file name"
              aria-label="Hide file name"
            >
              <Minus size={14} strokeWidth={2} />
            </button>
          )}
          <input
            className="document-title-input"
            type="text"
            disabled={isPageLocked}
            value={
              activeFilePath ? activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || '' : ''
            }
            onChange={(e): void => {
              onRenameActiveFile(e.target.value)
            }}
            placeholder="Untitled"
          />
        </div>
      )}
    </>
  )
}

export default React.memo(NotionPageHeaderComponent)
