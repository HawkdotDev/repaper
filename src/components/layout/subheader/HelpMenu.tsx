import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CircleHelp,
  Keyboard,
  FileCode,
  ExternalLink,
  Bug,
  Sparkles,
  Mic,
  X
} from 'lucide-react'
import { APP_VERSION } from '../../../utils/version'
import VoiceCommandsModal from '../../VoiceCommandsModal'

interface HelpMenuProps {
  onOpenSettings?: () => void
  dropUp?: boolean
  triggerClassName?: string
  menuClassName?: string
}

function HelpMenuComponent({
  onOpenSettings,
  dropUp = false,
  triggerClassName,
  menuClassName = ''
}: HelpMenuProps): React.JSX.Element {
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [activeModal, setActiveModal] = useState<'shortcuts' | 'markdown' | 'voice' | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const menuWidth = 280
      let left = dropUp ? rect.left : rect.right - menuWidth
      if (left < 10) left = 10
      if (left + menuWidth > window.innerWidth - 10) {
        left = window.innerWidth - menuWidth - 10
      }
      setMenuPos({
        top: dropUp ? rect.top : rect.bottom + 4,
        left
      })
    }
  }, [dropUp])

  useEffect(() => {
    const handleOpenVoiceHelp = (): void => {
      setActiveModal('voice')
      setShowHelpMenu(false)
    }
    window.addEventListener('open-voice-help', handleOpenVoiceHelp)
    return (): void => {
      window.removeEventListener('open-voice-help', handleOpenVoiceHelp)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowHelpMenu(false)
      }
    }

    const handleScrollOrResize = (): void => {
      if (showHelpMenu) updatePos()
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && showHelpMenu && !activeModal) {
        setShowHelpMenu(false)
      }
    }

    if (showHelpMenu) {
      updatePos()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', handleScrollOrResize)
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('keydown', handleKeyDown)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeModal, showHelpMenu, updatePos])

  const openExternal = (url: string): void => {
    window.open(url, '_blank')
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className={
            triggerClassName
              ? `${triggerClassName} ${showHelpMenu ? 'active' : ''}`
              : `action-pill-btn w-6.5 h-6.5 p-0 justify-center ${showHelpMenu ? 'active' : ''}`
          }
          onClick={(e): void => {
            e.stopPropagation()
            if (!showHelpMenu) updatePos()
            setShowHelpMenu((prev) => !prev)
          }}
          title="Help & Documentation"
          aria-label="Help & Documentation"
        >
          <CircleHelp
            size={16}
            strokeWidth={1.75}
            className={showHelpMenu ? 'text-zinc-200' : 'text-zinc-500'}
          />
        </button>

        {/* HELP DROPDOWN MENU */}
        {showHelpMenu &&
          menuPos &&
          createPortal(
            <div
              ref={dropdownRef}
              className={`widgets-dropdown-menu help-dropdown-menu ${menuClassName}`}
              style={{
                position: 'fixed',
                ...(dropUp
                  ? { bottom: `${Math.max(10, window.innerHeight - menuPos.top)}px`, top: 'auto' }
                  : { top: `${menuPos.top}px`, bottom: 'auto' }),
                left: `${menuPos.left}px`,
                right: 'auto',
                marginTop: 0,
                zIndex: 99999
              }}
            >
              {/* Header */}
              <div className="widgets-dropdown-header">
                <span className="font-semibold text-zinc-300">Help & Documentation</span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.2">
                  v{APP_VERSION}
                </span>
              </div>

              {/* List of Items */}
              <div className="widgets-dropdown-list">
                {/* Keyboard Shortcuts */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    setActiveModal('shortcuts')
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Keyboard size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">Keyboard Shortcuts</span>
                      <span className="widget-desc">Hotkeys & quick navigation</span>
                    </div>
                  </div>
                  <kbd className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 shrink-0">
                    Ctrl+/
                  </kbd>
                </div>

                {/* Voice Commands */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    setActiveModal('voice')
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">Voice Commands</span>
                      <span className="widget-desc">Punctuation & languages</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 shrink-0">
                    EN · HI · BN
                  </span>
                </div>

                {/* Markdown Syntax Guide */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    setActiveModal('markdown')
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">Markdown Guide</span>
                      <span className="widget-desc">Formatting & syntax</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/8 my-0.5 mx-1" />

                {/* What's New */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    onOpenSettings?.()
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">What&apos;s New in v{APP_VERSION}</span>
                      <span className="widget-desc">Release notes & updates</span>
                    </div>
                  </div>
                </div>

                {/* GitHub Repository */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    openExternal('https://github.com/Dwaipayan-Ghoshal/Oink')
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ExternalLink size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">GitHub Repository</span>
                      <span className="widget-desc">Source code & docs</span>
                    </div>
                  </div>
                </div>

                {/* Report an Issue */}
                <div
                  className="widget-menu-item"
                  onClick={(): void => {
                    openExternal('https://github.com/Dwaipayan-Ghoshal/Oink/issues')
                    setShowHelpMenu(false)
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bug size={13} className="text-zinc-300 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="widget-title">Report an Issue</span>
                      <span className="widget-desc">Feedback & bug reports</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* SHORTCUTS MODAL */}
      {activeModal === 'shortcuts' && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-9999 flex items-center justify-center p-4"
          onClick={(): void => setActiveModal(null)}
        >
          <div
            className="bg-[#18181e] border border-zinc-700/60 rounded-none max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e): void => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-zinc-300" />
                <h3 className="font-semibold text-zinc-100 text-sm">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white p-1 rounded-none transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Quick Switcher / Search</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  Ctrl+P
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Toggle Sidebar</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  Ctrl+B
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Save Document</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  Ctrl+S
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Find in Document</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  Ctrl+F
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Toggle Fullscreen</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  F11
                </kbd>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex items-center justify-between">
                <span className="text-zinc-400">Slash Menu Commands</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono rounded-none text-[10px]">
                  /
                </kbd>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                className="px-3 py-1.5 bg-zinc-200 text-zinc-900 hover:bg-white font-medium text-xs rounded-none transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARKDOWN GUIDE MODAL */}
      {activeModal === 'markdown' && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-9999 flex items-center justify-center p-4"
          onClick={(): void => setActiveModal(null)}
        >
          <div
            className="bg-[#18181e] border border-zinc-700/60 rounded-none max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e): void => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-zinc-300" />
                <h3 className="font-semibold text-zinc-100 text-sm">Markdown Syntax Guide</h3>
              </div>
              <button
                type="button"
                className="text-zinc-400 hover:text-white p-1 rounded-none transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-zinc-300">
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex justify-between">
                <span className="text-zinc-400"># Heading 1</span>
                <span className="text-zinc-500 font-sans">Title size</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex justify-between">
                <span className="text-zinc-400">**bold text**</span>
                <span className="text-zinc-500 font-sans">Bold text</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex justify-between">
                <span className="text-zinc-400">*italic text*</span>
                <span className="text-zinc-500 font-sans">Italics</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex justify-between">
                <span className="text-zinc-400">- [ ] Checklist task</span>
                <span className="text-zinc-500 font-sans">Interactive checkbox</span>
              </div>
              <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-none flex justify-between">
                <span className="text-zinc-400">&gt; [!NOTE] callout</span>
                <span className="text-zinc-500 font-sans">Alert callout box</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                className="px-3 py-1.5 bg-zinc-200 text-zinc-900 hover:bg-white font-medium text-xs rounded-none transition-colors"
                onClick={(): void => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE COMMANDS MODAL */}
      <VoiceCommandsModal
        isOpen={activeModal === 'voice'}
        onClose={(): void => setActiveModal(null)}
      />
    </>
  )
}

export default React.memo(HelpMenuComponent)
