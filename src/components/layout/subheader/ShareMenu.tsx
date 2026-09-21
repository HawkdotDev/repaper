import React, { useState, useRef, useEffect } from 'react'
import {
  Share,
  ChevronDown,
  Check,
  Copy,
  Globe,
  Radio,
  UserPlus,
  FileCode,
  Code2,
  FileText,
  Download
} from 'lucide-react'

export interface ShareMenuProps {
  activeFilePath?: string | null
  onCopyLink?: () => void
  onImport?: () => void
  onExportHTML?: () => void
  onExportText?: () => void
  onExportMarkdown?: () => void
}

function ShareMenu({
  activeFilePath,
  onCopyLink,
  onImport,
  onExportHTML,
  onExportText,
  onExportMarkdown
}: ShareMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleCopy = (): void => {
    if (onCopyLink) {
      onCopyLink()
    } else if (activeFilePath) {
      const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
      navigator.clipboard.writeText(`[[${baseName}]]`)
    }
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 1800)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`action-pill-btn ${isOpen ? 'active' : ''}`}
        onClick={(e): void => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        title="Share & Export"
      >
        <Share size={14} strokeWidth={1.75} className="shrink-0 text-zinc-300" />
        <ChevronDown
          size={11}
          strokeWidth={1.75}
          className={`transition-transform duration-150 text-zinc-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="share-dropdown-menu" onClick={(e): void => e.stopPropagation()}>
          {/* Section: Collaboration */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Collaboration</span>

            {/* 1. Copy Document Reference Link */}
            <div className="share-dropdown-item" onClick={handleCopy}>
              <div className="flex items-center gap-2.5">
                {copiedLink ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={14} className="text-zinc-400 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="share-item-title">
                    {copiedLink ? 'Copied link to clipboard!' : 'Copy Reference Link'}
                  </span>
                  <span className="share-item-desc">Wikilink or internal doc link</span>
                </div>
              </div>
            </div>

            {/* 2. Invite Collaborators */}
            <div className="share-dropdown-item opacity-45 cursor-not-allowed select-none">
              <div className="flex items-center gap-2.5">
                <UserPlus size={14} className="text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="share-item-title">Invite Collaborators</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Coming Soon</span>
                  </div>
                  <span className="share-item-desc">Add team members with edit access</span>
                </div>
              </div>
            </div>

            {/* 3. Live Peer Session */}
            <div className="share-dropdown-item opacity-45 cursor-not-allowed select-none">
              <div className="flex items-center gap-2.5">
                <Radio size={14} className="text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="share-item-title">Live Peer Session</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Coming Soon</span>
                  </div>
                  <span className="share-item-desc">Real-time collaborative editing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 my-1 mx-1" />

          {/* Section: Export */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Export</span>

            {/* Export Markdown */}
            {onExportMarkdown && (
              <div
                className="share-dropdown-item"
                onClick={(): void => {
                  onExportMarkdown()
                  setIsOpen(false)
                }}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode size={14} className="text-zinc-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="share-item-title">Export as Markdown</span>
                    <span className="share-item-desc">Save formatted .md file</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export HTML */}
            {onExportHTML && (
              <div
                className="share-dropdown-item"
                onClick={(): void => {
                  onExportHTML()
                  setIsOpen(false)
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 size={14} className="text-zinc-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="share-item-title">Export as HTML</span>
                    <span className="share-item-desc">Standalone styled .html</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export Plain Text */}
            {onExportText && (
              <div
                className="share-dropdown-item"
                onClick={(): void => {
                  onExportText()
                  setIsOpen(false)
                }}
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={14} className="text-zinc-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="share-item-title">Export as Plain Text</span>
                    <span className="share-item-desc">Unformatted raw .txt file</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-white/5 my-1 mx-1" />

          {/* Section: Import */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Import</span>

            {onImport && (
              <div
                className="share-dropdown-item"
                onClick={(): void => {
                  onImport()
                  setIsOpen(false)
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Download size={14} className="text-zinc-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="share-item-title">Import Document</span>
                    <span className="share-item-desc">Open local .md or .txt file</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-white/5 my-1 mx-1" />

          {/* Section: Web Publishing */}
          <div className="share-dropdown-section">
            <span className="share-section-title">Publish</span>

            <div className="share-dropdown-item opacity-45 cursor-not-allowed select-none">
              <div className="flex items-center gap-2.5">
                <Globe size={14} className="text-zinc-400 shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="share-item-title">Publish to Web</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Coming Soon</span>
                  </div>
                  <span className="share-item-desc">Make a read-only public web link</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ShareMenu)
