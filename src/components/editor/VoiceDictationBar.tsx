import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Mic,
  MicOff,
  X,
  Globe,
  Check,
  Sparkles,
  ChevronDown,
  Type,
  RotateCcw
} from 'lucide-react'
import {
  useVoiceDictation,
  SUPPORTED_LANGUAGES
} from '../../hooks/useVoiceDictation'
import {
  commitSpokenText,
  updateLiveInterimText,
  cancelLiveInterimText,
  executeVoiceCommands,
  createNewParagraphBlock,
  convertLastPunctuationToWord
} from '../../utils/voiceTypingHelper'
import { VoiceCommand, PunctuationSubstitution } from '../../utils/punctuationEngine'

export interface VoiceDictationBarProps {
  onClose: () => void
}

export function VoiceDictationBar({
  onClose
}: VoiceDictationBarProps): React.JSX.Element {
  const [showLanguages, setShowLanguages] = useState(false)
  const languageMenuRef = useRef<HTMLDivElement>(null)

  // ZERO-DELAY REAL-TIME STREAMING: Updates the editor as syllables are spoken!
  const handleInterimSpeech = useCallback((interimText: string): void => {
    updateLiveInterimText(interimText)
  }, [])

  // Final commit replaces the live streaming span with finalized punctuated text
  const handleSpeechCommit = useCallback(
    (
      text: string,
      commands: VoiceCommand[],
      substitutions?: PunctuationSubstitution[]
    ): void => {
      const hasNewParagraph = commands.some((c) => c.type === 'new-paragraph')

      // If a single speech chunk contains text spanning across a new paragraph break
      if (hasNewParagraph && text.includes('\n\n')) {
        const parts = text.split(/\n\n+/)
        const beforeText = parts[0]?.trim() || ''
        const afterText = parts.slice(1).join('\n\n').trim()

        // 1. Commit the text before the paragraph break (or discard interim if empty)
        if (beforeText) {
          commitSpokenText(beforeText, substitutions)
        } else {
          cancelLiveInterimText()
        }

        // 2. Execute any non-paragraph commands first
        const otherCmds = commands.filter((c) => c.type !== 'new-paragraph')
        if (otherCmds.length > 0) {
          executeVoiceCommands(otherCmds)
        }

        // 3. Create the new paragraph block and move cursor
        createNewParagraphBlock()

        // 4. If text was dictated for after the paragraph break, commit it into the new block
        if (afterText) {
          setTimeout(() => {
            commitSpokenText(afterText)
          }, 40)
        }
        return
      }

      // Standard flow:
      // 1. Commit text first to overwrite interim text, or cleanly discard interim command words
      if (text) {
        commitSpokenText(text, substitutions)
      } else {
        cancelLiveInterimText()
      }

      // 2. Execute any commands (new-paragraph, new-line, scratch-that, etc.)
      if (commands.length > 0) {
        executeVoiceCommands(commands)
      }
    },
    []
  )

  const {
    isSupported,
    isListening,
    audioLevel,
    language,
    scriptMode,
    autoPunctuateCommands,
    detectedLanguage,
    setLanguage,
    setScriptMode,
    toggleAutoPunctuateCommands,
    error,
    startListening,
    stopListening
  } = useVoiceDictation({
    initialLanguage: 'auto',
    initialScriptMode: 'native',
    onSpeechCommit: handleSpeechCommit,
    onInterimSpeech: handleInterimSpeech
  })

  // Track recent punctuation substitution for instant one-click or voice word conversion
  const [recentSubstitution, setRecentSubstitution] = useState<PunctuationSubstitution | null>(null)
  const subTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const handleSubstituted = (e: Event): void => {
      const custom = e as CustomEvent<PunctuationSubstitution>
      if (custom.detail) {
        setRecentSubstitution(custom.detail)
        if (subTimerRef.current) clearTimeout(subTimerRef.current)
        subTimerRef.current = window.setTimeout(() => {
          setRecentSubstitution(null)
        }, 5000)
      }
    }

    const handleConverted = (): void => {
      setRecentSubstitution(null)
      if (subTimerRef.current) clearTimeout(subTimerRef.current)
    }

    window.addEventListener('oink:punctuation-substituted', handleSubstituted)
    window.addEventListener('oink:punctuation-converted', handleConverted)
    return () => {
      window.removeEventListener('oink:punctuation-substituted', handleSubstituted)
      window.removeEventListener('oink:punctuation-converted', handleConverted)
      if (subTimerRef.current) clearTimeout(subTimerRef.current)
    }
  }, [])

  const handleConvertToWord = useCallback((): void => {
    convertLastPunctuationToWord()
    setRecentSubstitution(null)
  }, [])

  // Track language switches to briefly display a switch notification
  const [switchedNotice, setSwitchedNotice] = useState<string | null>(null)
  const prevLangRef = useRef(detectedLanguage)

  useEffect(() => {
    if (prevLangRef.current !== detectedLanguage) {
      const newName =
        detectedLanguage === 'hi'
          ? 'Hindi (हिन्दी)'
          : detectedLanguage === 'bn'
            ? 'Bengali (বাংলা)'
            : 'English'
      setSwitchedNotice(`Switched to ${newName}`)
      prevLangRef.current = detectedLanguage
      const t = setTimeout(() => {
        setSwitchedNotice(null)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [detectedLanguage])

  // Track mode toggles (Smart Commands vs Literal Text)
  const prevAutoPunctuateRef = useRef(autoPunctuateCommands)
  useEffect(() => {
    if (prevAutoPunctuateRef.current !== autoPunctuateCommands) {
      const modeName = autoPunctuateCommands
        ? 'Smart Commands ON'
        : 'Literal Mode (Words only)'
      setSwitchedNotice(modeName)
      prevAutoPunctuateRef.current = autoPunctuateCommands
      const t = setTimeout(() => {
        setSwitchedNotice(null)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [autoPunctuateCommands])

  // Start listening automatically on mount
  useEffect(() => {
    void startListening()
    return () => {
      cancelLiveInterimText()
      stopListening()
    }
  }, [startListening, stopListening])

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent): void => {
      const target = e.target as Node
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setShowLanguages(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (showLanguages) {
          setShowLanguages(false)
        } else {
          cancelLiveInterimText()
          stopListening()
          onClose()
        }
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, showLanguages, stopListening])

  // Start / Stop toggle
  const handleMicToggle = (): void => {
    if (isListening) {
      cancelLiveInterimText()
      stopListening()
    } else {
      void startListening()
    }
  }

  // Calculate dynamic bar heights for soundwave (8 bars)
  const BAR_FACTORS = [0.45, 0.7, 1.05, 1.35, 1.35, 1.05, 0.7, 0.45]
  const barHeights = BAR_FACTORS.map((factor, idx) => {
    if (!isListening) return 4
    const variance = Math.sin((audioLevel * 0.2) + idx * 0.7) * 3.5
    const scaled = Math.round((audioLevel * 0.16 * factor) + variance)
    return Math.min(22, Math.max(3, scaled + 4))
  })

  const detectedLanguageLabel =
    detectedLanguage === 'hi'
      ? 'Hindi (हिन्दी)'
      : detectedLanguage === 'bn'
        ? 'Bengali (বাংলা)'
        : 'English'

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language)
  const currentLangLabel =
    language === 'auto'
      ? 'Auto'
      : language === 'en-IN'
        ? 'English'
        : language === 'hi-IN'
          ? 'Hindi'
          : language === 'bn-IN'
            ? 'Bengali'
            : (currentLangObj?.label.split('(')[0].trim() || language)

  const isIndicApplicable =
    ['auto', 'hi-IN', 'bn-IN', 'bn-BD'].includes(language) ||
    detectedLanguage === 'hi' ||
    detectedLanguage === 'bn'

  return (
    <div className="voice-dictation-container select-none">
      {/* Box 1: Start/Stop Button & Voice Activity */}
      <div className="voice-box voice-box-activity">
        <button
          type="button"
          className={`voice-mic-btn ${isListening ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleMicToggle}
          title={isListening ? 'Stop narration' : 'Start narration'}
        >
          {isListening ? (
            <Mic size={15} className="text-zinc-100" />
          ) : (
            <MicOff size={15} className="text-zinc-400" />
          )}
        </button>

        {/* Live Audio Equalizer Wave (Extended) */}
        <div className="voice-equalizer-bars" title="Real-time voice activity">
          {barHeights.map((height, idx) => (
            <span
              key={idx}
              className="voice-eq-bar"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>

      {/* Box 2: Language Selector, Script Mode, Detected Language & Controls */}
      <div className="voice-box voice-box-controls">
        {/* Unified Language Selection Dropdown (including Auto) */}
        <div className="relative" ref={languageMenuRef}>
          <button
            type="button"
            className={`voice-island-btn voice-lang-selector-btn ${showLanguages ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowLanguages(!showLanguages)}
            title="Select recognition language"
          >
            {language === 'auto' ? (
              <Sparkles size={13} className="text-zinc-300" />
            ) : (
              <Globe size={13} />
            )}
            <span className="font-medium text-[12px] whitespace-nowrap">
              {currentLangLabel}
            </span>
            <ChevronDown size={12} className="opacity-60" />
          </button>

          {showLanguages && (
            <div className="voice-dropdown-menu voice-lang-menu">
              <div className="voice-dropdown-header">Recognition Language</div>
              <div className="voice-dropdown-scroll">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`voice-dropdown-item ${language === lang.code ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLanguages(false)
                    }}
                  >
                    <span>{lang.label}</span>
                    {language === lang.code && <Check size={13} className="text-zinc-200" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Script Output Mode Toggle: Native and English (Applicable for Hindi, Bengali, or Auto) */}
        {isIndicApplicable && (
          <div className="voice-script-toggle-group flex items-center" title="Output Script (Bengali & Hindi)">
            <button
              type="button"
              className={`voice-script-pill ${scriptMode === 'native' ? 'active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setScriptMode('native')}
              title="Native Script (বাংলা / हिन्दी)"
            >
              Native
            </button>
            <button
              type="button"
              className={`voice-script-pill ${scriptMode === 'romanized' ? 'active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setScriptMode('romanized')}
              title="English Script (Bengali/Hindi spoken words written in English)"
            >
              English
            </button>
          </div>
        )}

        {/* Dictation Mode Toggle: Smart Commands vs Literal Text */}
        <button
          type="button"
          className={`voice-island-btn voice-mode-toggle-btn ${!autoPunctuateCommands ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleAutoPunctuateCommands}
          title={
            autoPunctuateCommands
              ? 'Commands: ON (Spoken "full stop" becomes "."). Click for Literal Words mode.'
              : 'Literal Mode: ON (Every word is typed literally as words). Click for Smart Commands.'
          }
        >
          {autoPunctuateCommands ? (
            <Sparkles size={12} className="text-zinc-400" />
          ) : (
            <Type size={12} className="text-amber-400" />
          )}
          <span className="font-medium text-[11.5px] whitespace-nowrap">
            {autoPunctuateCommands ? 'Commands' : 'Literal Mode'}
          </span>
        </button>

        {/* Ephemeral Quick Conversion Chip (Allows converting "." back to "full stop" with one click) */}
        {recentSubstitution && isListening && (
          <button
            type="button"
            className="voice-convert-chip flex items-center gap-1.5 px-2 py-0.5 text-[11px] bg-amber-500/15 border border-amber-500/40 text-amber-200 hover:bg-amber-500/25 transition-colors cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleConvertToWord}
            title={`Undo substitution: convert "${recentSubstitution.symbol}" back to "${recentSubstitution.spokenPhrase}"`}
          >
            <RotateCcw size={11} className="text-amber-300 shrink-0" />
            <span className="truncate">
              &ldquo;{recentSubstitution.symbol}&rdquo; &rarr; <strong>{recentSubstitution.spokenPhrase}</strong>
            </span>
          </button>
        )}

        {/* Status & Detected Language Indicator */}
        <div className="voice-text-stream flex items-center min-w-0">
          {error ? (
            <span className="voice-status-error truncate">{error}</span>
          ) : !isSupported ? (
            <span className="voice-status-error truncate">
              Speech recognition requires Chrome, Edge, or Safari.
            </span>
          ) : !isListening ? (
            <span className="voice-status-label text-zinc-500">Narration Stopped</span>
          ) : switchedNotice ? (
            <div className="voice-switch-notice flex items-center gap-1 text-zinc-200 font-medium">
              <Sparkles size={12} />
              <span className="truncate">{switchedNotice}</span>
            </div>
          ) : (
            <div className="voice-detected-lang flex items-center gap-1.5 text-zinc-300">
              <span className="voice-lang-badge font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 bg-white/10 text-zinc-200">
                {detectedLanguage}
              </span>
              <span className="truncate text-[12.5px] font-medium">
                {detectedLanguageLabel}
              </span>
              {isIndicApplicable && (
                <span className="text-zinc-500 text-[11px]">
                  ({scriptMode === 'romanized' ? 'English' : 'Native'})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Standalone Stop/Close Narration Button (same size as the box) */}
      <button
        type="button"
        className="voice-box voice-close-box-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          cancelLiveInterimText()
          stopListening()
          onClose()
        }}
        title="Stop narration (Esc)"
        aria-label="Stop narration"
      >
        <X size={15} />
      </button>
    </div>
  )

}

export default React.memo(VoiceDictationBar)
