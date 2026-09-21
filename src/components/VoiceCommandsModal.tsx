import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Mic,
  X,
  Search,
  Sparkles
} from 'lucide-react'

export interface VoiceCommandsModalProps {
  isOpen: boolean
  onClose: () => void
}

import {
  CommandCategory,
  VOICE_COMMANDS_DATA
} from '../utils/voiceCommandsData'

export function VoiceCommandsModal({
  isOpen,
  onClose
}: VoiceCommandsModalProps): React.JSX.Element | null {
  const [activeCategory, setActiveCategory] = useState<CommandCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search input when opened & handle Escape key
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Filter commands by active category and search query
  const filteredCommands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return VOICE_COMMANDS_DATA.filter((cmd) => {
      if (activeCategory !== 'all' && cmd.category !== activeCategory) {
        return false
      }
      if (!q) return true

      const matchTitle = cmd.title.toLowerCase().includes(q)
      const matchAction = cmd.action.toLowerCase().includes(q)
      const matchDesc = cmd.description.toLowerCase().includes(q)
      const matchEnglish = cmd.englishPhrases?.some((p) => p.toLowerCase().includes(q)) ?? false
      const matchHindi = cmd.hindiPhrases?.some((p) => p.toLowerCase().includes(q)) ?? false
      const matchBengali = cmd.bengaliPhrases?.some((p) => p.toLowerCase().includes(q)) ?? false

      return matchTitle || matchAction || matchDesc || matchEnglish || matchHindi || matchBengali
    })
  }, [activeCategory, searchQuery])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-9999 flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="voice-commands-modal-card bg-[#18181e] border border-zinc-700/60 rounded-none max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[88vh] text-zinc-200"
        onClick={(e): void => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
              <Mic size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 text-sm tracking-wide">
                  Voice Dictation Commands
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800/80 px-1.5 py-0.5 border border-zinc-700/50">
                  EN · HI · BN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Spoken punctuation, structural editing, and on-the-fly language controls
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
            onClick={onClose}
            title="Close dialog (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="py-3 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 rounded-none transition-colors"
              placeholder="Search commands, symbols, or spoken phrases..."
              value={searchQuery}
              onChange={(e): void => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                onClick={(): void => setSearchQuery('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] shrink-0">
            <button
              type="button"
              className={`px-2.5 py-1.5 font-medium transition-colors border ${
                activeCategory === 'all'
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={(): void => setActiveCategory('all')}
            >
              All ({VOICE_COMMANDS_DATA.length})
            </button>
            <button
              type="button"
              className={`px-2.5 py-1.5 font-medium transition-colors border ${
                activeCategory === 'punctuation'
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={(): void => setActiveCategory('punctuation')}
            >
              Punctuation ({VOICE_COMMANDS_DATA.filter((c) => c.category === 'punctuation').length})
            </button>
            <button
              type="button"
              className={`px-2.5 py-1.5 font-medium transition-colors border ${
                activeCategory === 'editing'
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={(): void => setActiveCategory('editing')}
            >
              Editing ({VOICE_COMMANDS_DATA.filter((c) => c.category === 'editing').length})
            </button>
            <button
              type="button"
              className={`px-2.5 py-1.5 font-medium transition-colors border ${
                activeCategory === 'language'
                  ? 'bg-zinc-200 text-zinc-950 border-zinc-200'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              onClick={(): void => setActiveCategory('language')}
            >
              Languages ({VOICE_COMMANDS_DATA.filter((c) => c.category === 'language').length})
            </button>
          </div>
        </div>

        {/* Literal Words & Escapes Guidance Banner */}
        <div className="my-2 p-2.5 bg-zinc-900/90 border border-amber-500/30 text-zinc-300 text-xs flex items-start gap-2.5 shrink-0">
          <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-200 text-[11.5px]">
              Want to dictate &ldquo;full stop&rdquo; or command words as text?
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Prefix with <code className="text-amber-300 bg-zinc-800/80 px-1 py-0.5 border border-zinc-700 font-mono">word full stop</code>,{' '}
              <code className="text-amber-300 bg-zinc-800/80 px-1 py-0.5 border border-zinc-700 font-mono">literal full stop</code>, or{' '}
              <code className="text-amber-300 bg-zinc-800/80 px-1 py-0.5 border border-zinc-700 font-mono">as word full stop</code>.
              You can also click <strong>Literal Mode</strong> on the narration bar, or say <code className="text-amber-300 bg-zinc-800/80 px-1 py-0.5 border border-zinc-700 font-mono">&ldquo;that was a word&rdquo;</code> right after!
            </p>
          </div>
        </div>

        {/* Scrollable Command List */}
        <div className="overflow-y-auto py-3 space-y-2.5 pr-1 flex-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No voice commands match &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="p-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 transition-colors flex flex-col gap-2"
              >
                {/* Top Row: Title + Output Symbol / Action Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-200">{cmd.title}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {cmd.description}
                    </span>
                  </div>
                  {cmd.badge && (
                    <span className="text-[11px] font-mono font-semibold text-zinc-200 bg-zinc-800/90 border border-zinc-700/80 px-2 py-0.5 shrink-0">
                      {cmd.badge}
                    </span>
                  )}
                </div>

                {/* Spoken Phrases by Language */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-800/60">
                  {/* English Phrases */}
                  {cmd.englishPhrases && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        English
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cmd.englishPhrases.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] text-zinc-300 font-mono bg-zinc-800/40 px-1.5 py-0.5 border border-zinc-700/40"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hindi Phrases */}
                  {cmd.hindiPhrases && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        हिन्दी (Hindi)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cmd.hindiPhrases.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] text-zinc-300 font-sans bg-zinc-800/40 px-1.5 py-0.5 border border-zinc-700/40"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bengali Phrases */}
                  {cmd.bengaliPhrases && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">
                        বাংলা (Bengali)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cmd.bengaliPhrases.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] text-zinc-300 font-sans bg-zinc-800/40 px-1.5 py-0.5 border border-zinc-700/40"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Sparkles size={13} className="text-zinc-400 shrink-0" />
            <span className="truncate">
              Speak naturally while dictating. Commands are executed in real time.
            </span>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 bg-zinc-200 text-zinc-900 hover:bg-white font-medium text-xs rounded-none transition-colors cursor-pointer shrink-0 ml-3"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(VoiceCommandsModal)
