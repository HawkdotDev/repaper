import React, { useState, useEffect } from 'react'
import { PenLine, ArrowRight, FolderOpen, X, Sparkles, Shield, BookOpen, Check } from 'lucide-react'
import { APP_VERSION } from '../utils/version'

interface WelcomeScreenProps {
  workspacePath: string | null
  workspaceName?: string
  recentWorkspaces?: { path: string; name?: string; lastOpened?: number }[]
  onFileSelect?: (filePath: string) => void
  onCreateFileAtRoot?: () => void
  onOpenWorkspace?: () => void
  onStartInBrowser?: () => void
  onSwitchWorkspace?: (path: string, name?: string) => void
  onDismissWelcome?: () => void
  isFirstTime?: boolean
}

function WelcomeScreenComponent({
  workspacePath,
  workspaceName,
  onFileSelect,
  onCreateFileAtRoot,
  onOpenWorkspace,
  onStartInBrowser,
  onSwitchWorkspace,
  onDismissWelcome,
  isFirstTime = false
}: WelcomeScreenProps): React.JSX.Element {
  const [activeModal, setActiveModal] = useState<'about' | 'updates' | 'terms' | null>(null)

  // Handle ESC key to dismiss modal or welcome guide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null)
        } else if (onDismissWelcome) {
          onDismissWelcome()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, onDismissWelcome])

  const handleStartWriting = (): void => {
    if (onStartInBrowser) {
      onStartInBrowser()
    } else {
      if (onSwitchWorkspace && workspacePath !== '/workspace') {
        onSwitchWorkspace('/workspace', 'Browser Storage')
      }
      if (onFileSelect) {
        onFileSelect('/workspace/Untitled.md')
      } else if (onCreateFileAtRoot) {
        onCreateFileAtRoot()
      }
      if (onDismissWelcome) {
        onDismissWelcome()
      }
    }
  }

  const handleOpenFolderClick = (): void => {
    if (onOpenWorkspace) {
      onOpenWorkspace()
    } else if (onDismissWelcome) {
      onDismissWelcome()
    }
  }

  const openExternal = (url: string): void => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="welcome-toast-overlay select-none" onClick={onDismissWelcome}>
      <div className="welcome-toast-card" onClick={(e): void => e.stopPropagation()}>
        {/* Brand Tag & Dismiss Button */}
        <div className="flex items-center justify-between">
          <div className="welcome-brand">
            <div className="welcome-brand-badge">
              <PenLine size={13} className="text-zinc-400" />
              <span>Repaper</span>
            </div>
          </div>
          {onDismissWelcome && (
            <button
              type="button"
              className="welcome-dismiss-btn"
              onClick={onDismissWelcome}
              title="Close Guide (Esc)"
              aria-label="Close Guide"
            >
              <X size={13} />
              <span>Close</span>
            </button>
          )}
        </div>

        {/* Hero Title & Lead */}
        <div className="welcome-hero">
          <h1 className="welcome-headline">The simplest way to write</h1>
          <p className="welcome-lead">No setup or fuss, just open a tab and start writing.</p>
        </div>

        {/* Manifesto Body Text */}
        <div className="welcome-manifesto">
          <p>
            Most text editors are bloated with features you&apos;ll never use. They get in the way
            and make writing harder than it needs to be.
          </p>
          <p>
            <strong>Repaper</strong> keeps it simple. No setup, no complex file systems, no more
            clutter. Just the essentials to think and write clearly.
          </p>
          <p>
            Whether you&apos;re drafting a blog post, a difficult email, or a quick note for
            yourself, writing here feels easier.
          </p>
          <p className="welcome-punchline">Get focused and write with clarity.</p>
        </div>

        {/* Actions */}
        <div className="welcome-cta-group">
          <button
            type="button"
            className="welcome-btn-primary"
            onClick={handleStartWriting}
            autoFocus
          >
            <span>Start writing</span>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            className="welcome-btn-secondary"
            onClick={handleOpenFolderClick}
            title="Open a folder on your computer for direct disk access"
          >
            <FolderOpen size={14} className="text-zinc-400" />
            <span>Open local folder</span>
          </button>
        </div>

        {/* Return to Workspace / Home Link */}
        {onDismissWelcome && !isFirstTime && (
          <div className="welcome-hub-link-wrap">
            <button type="button" className="welcome-link-secondary" onClick={onDismissWelcome}>
              Return to {workspaceName || 'workspace'} →
            </button>
          </div>
        )}

        {/* Footer Navigation & Copyright */}
        <div className="welcome-footer-nav">
          <div className="welcome-links">
            <button
              type="button"
              className="welcome-footer-link"
              onClick={(): void => setActiveModal('about')}
            >
              About
            </button>
            <span className="welcome-dot">·</span>
            <button
              type="button"
              className="welcome-footer-link"
              onClick={(): void => setActiveModal('updates')}
            >
              Updates
            </button>
            <span className="welcome-dot">·</span>
            <button
              type="button"
              className="welcome-footer-link"
              onClick={(): void => setActiveModal('terms')}
            >
              Terms
            </button>
            <span className="welcome-dot">·</span>
            <button
              type="button"
              className="welcome-footer-link"
              onClick={(): void => openExternal('https://github.com/HawkdotDev/repaper')}
            >
              GitHub
            </button>
          </div>

          <div className="welcome-copyright">
            <button
              type="button"
              className="welcome-copyright-link"
              onClick={(): void => setActiveModal('about')}
            >
              © 2026 Repaper
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DIALOGS */}
      {activeModal && (
        <div
          className="welcome-modal-backdrop"
          onClick={(): void => setActiveModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="welcome-modal-card" onClick={(e): void => e.stopPropagation()}>
            <div className="welcome-modal-header">
              <div className="flex items-center gap-2">
                {activeModal === 'about' && <BookOpen size={16} className="text-zinc-400" />}
                {activeModal === 'updates' && <Sparkles size={16} className="text-amber-400" />}
                {activeModal === 'terms' && <Shield size={16} className="text-emerald-400" />}
                <h3 className="welcome-modal-title">
                  {activeModal === 'about' && 'About Repaper'}
                  {activeModal === 'updates' && `What's New in v${APP_VERSION}`}
                  {activeModal === 'terms' && 'Terms & Privacy'}
                </h3>
              </div>
              <button
                type="button"
                className="welcome-modal-close"
                onClick={(): void => setActiveModal(null)}
                aria-label="Close dialog"
              >
                <X size={15} />
              </button>
            </div>

            <div className="welcome-modal-body">
              {activeModal === 'about' && (
                <div className="space-y-3">
                  <p>
                    <strong>Repaper</strong> is a minimal, local-first hybrid block & markdown
                    workspace designed for writers, thinkers, and builders.
                  </p>
                  <p>
                    Unlike traditional cloud tools, Repaper gives you 100% control over your notes.
                    You can write immediately in your browser with offline storage, or open a folder
                    directly from your local hard drive.
                  </p>
                  <div className="welcome-modal-spec-grid">
                    <div className="welcome-spec-item">
                      <span className="welcome-spec-label">Version</span>
                      <span className="welcome-spec-val font-mono">v{APP_VERSION}</span>
                    </div>
                    <div className="welcome-spec-item">
                      <span className="welcome-spec-label">Storage</span>
                      <span className="welcome-spec-val">Local Disk & IndexedDB</span>
                    </div>
                    <div className="welcome-spec-item">
                      <span className="welcome-spec-label">Architecture</span>
                      <span className="welcome-spec-val">100% Client-Side</span>
                    </div>
                    <div className="welcome-spec-item">
                      <span className="welcome-spec-label">License</span>
                      <span className="welcome-spec-val">MIT Open Source</span>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'updates' && (
                <div className="space-y-3">
                  <div className="welcome-update-item">
                    <div className="welcome-update-badge">v{APP_VERSION}</div>
                    <div className="welcome-update-content">
                      <h4 className="font-semibold text-zinc-100">
                        Modernized Writing Experience & Customization
                      </h4>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Same-level Notion ghost actions, 30 monochrome icon choices, white square
                        default badge, browser storage renaming, and upcoming graph view previews.
                      </p>
                    </div>
                  </div>
                  <div className="welcome-update-item">
                    <div className="welcome-update-badge">Core</div>
                    <div className="welcome-update-content">
                      <h4 className="font-semibold text-zinc-100">Local-First Native Filesystem</h4>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        Seamless file synchronization with your computer&apos;s folders via modern
                        Web File System Access.
                      </p>
                    </div>
                  </div>
                  <div className="welcome-update-item">
                    <div className="welcome-update-badge">Focus</div>
                    <div className="welcome-update-content">
                      <h4 className="font-semibold text-zinc-100">Zen Mode & Markdown Polish</h4>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        True distraction-free mode, refined dark and paper-light themes, and instant
                        zip archiving.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <div className="space-y-3">
                  <div className="welcome-terms-point">
                    <h4 className="font-semibold text-zinc-100 flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-400" />
                      100% Private by Default
                    </h4>
                    <p className="text-zinc-400 text-xs mt-1">
                      Your notes are stored locally on your device or in your browser&apos;s
                      sandboxed storage. No notes or personal data are ever transmitted to private
                      servers.
                    </p>
                  </div>
                  <div className="welcome-terms-point">
                    <h4 className="font-semibold text-zinc-100 flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-400" />
                      Zero Trackers or Telemetry
                    </h4>
                    <p className="text-zinc-400 text-xs mt-1">
                      No invasive behavioral analytics, tracking pixels, or third-party cookies.
                    </p>
                  </div>
                  <div className="welcome-terms-point">
                    <h4 className="font-semibold text-zinc-100 flex items-center gap-1.5">
                      <Check size={13} className="text-emerald-400" />
                      Free & Open Source
                    </h4>
                    <p className="text-zinc-400 text-xs mt-1">
                      Repaper is open source software distributed under the MIT license. You own
                      your content and your workflow completely.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="welcome-modal-footer">
              <button
                type="button"
                className="welcome-modal-btn"
                onClick={(): void => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(WelcomeScreenComponent)
