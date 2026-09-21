import { useState, useEffect, useRef, useCallback } from 'react'
import {
  formatSpokenText,
  detectLanguage,
  VoiceCommand,
  PunctuationSubstitution
} from '../utils/punctuationEngine'
import { transliterateIndicToRoman } from '../utils/transliterationEngine'

// SpeechRecognition type declarations for browsers
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export type ScriptOutputMode = 'native' | 'romanized'

export interface UseVoiceDictationOptions {
  initialLanguage?: string
  initialScriptMode?: ScriptOutputMode
  autoCapitalize?: boolean
  autoPunctuateCommands?: boolean
  onSpeechCommit?: (
    text: string,
    commands: VoiceCommand[],
    substitutions?: PunctuationSubstitution[]
  ) => void
  onInterimSpeech?: (interimText: string) => void
}

export interface UseVoiceDictationReturn {
  isSupported: boolean
  isListening: boolean
  isPaused: boolean
  interimTranscript: string
  audioLevel: number // 0 to 100 for visualizer
  language: string
  scriptMode: ScriptOutputMode
  autoPunctuateCommands: boolean
  detectedLanguage: 'en' | 'hi' | 'bn'
  setLanguage: (lang: string) => void
  setScriptMode: (mode: ScriptOutputMode) => void
  toggleScriptMode: () => void
  setAutoPunctuateCommands: (enabled: boolean) => void
  toggleAutoPunctuateCommands: () => void
  error: string | null
  startListening: () => Promise<void>
  pauseListening: () => void
  resumeListening: () => void
  stopListening: () => void
  toggleListening: () => Promise<void>
}

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: 'Auto' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'bn-BD', label: 'Bengali (Bangladesh)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' }
]

export function useVoiceDictation({
  initialLanguage = 'auto',
  initialScriptMode = 'native',
  autoCapitalize = true,
  autoPunctuateCommands: initialAutoPunctuateCommands = true,
  onSpeechCommit,
  onInterimSpeech
}: UseVoiceDictationOptions = {}): UseVoiceDictationReturn {
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [language, setLanguageState] = useState(initialLanguage)
  const [scriptMode, setScriptModeState] = useState<ScriptOutputMode>(initialScriptMode)
  const [autoPunctuateCommands, setAutoPunctuateCommandsState] = useState<boolean>(
    initialAutoPunctuateCommands
  )
  const [detectedLanguage, setDetectedLanguage] = useState<'en' | 'hi' | 'bn'>('en')
  const [error, setError] = useState<string | null>(null)

  const isListeningRef = useRef(false)
  const isPausedRef = useRef(false)
  const languageRef = useRef(initialLanguage)
  const activeLangRef = useRef(initialLanguage === 'auto' ? 'en-IN' : initialLanguage)
  const scriptModeRef = useRef<ScriptOutputMode>(initialScriptMode)
  const autoPunctuateCommandsRef = useRef(initialAutoPunctuateCommands)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const restartTimerRef = useRef<number | null>(null)
  const isStartingRef = useRef(false)
  const startSessionRef = useRef<(() => void) | null>(null)

  const setScriptMode = useCallback((mode: ScriptOutputMode): void => {
    setScriptModeState(mode)
    scriptModeRef.current = mode
  }, [])

  const toggleScriptMode = useCallback((): void => {
    setScriptMode(scriptModeRef.current === 'native' ? 'romanized' : 'native')
  }, [setScriptMode])

  const setAutoPunctuateCommands = useCallback((enabled: boolean): void => {
    setAutoPunctuateCommandsState(enabled)
    autoPunctuateCommandsRef.current = enabled
  }, [])

  const toggleAutoPunctuateCommands = useCallback((): void => {
    setAutoPunctuateCommandsState((prev) => {
      const next = !prev
      autoPunctuateCommandsRef.current = next
      return next
    })
  }, [])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const onSpeechCommitRef = useRef(onSpeechCommit)
  const onInterimSpeechRef = useRef(onInterimSpeech)

  useEffect(() => {
    onSpeechCommitRef.current = onSpeechCommit
  }, [onSpeechCommit])

  useEffect(() => {
    onInterimSpeechRef.current = onInterimSpeech
  }, [onInterimSpeech])

  const consecutiveErrorsRef = useRef(0)

  // Start Web Audio analyser for soundwave bars
  const startAudioAnalyzer = useCallback(async (): Promise<void> => {
    try {
      if (mediaStreamRef.current && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          void audioContextRef.current.resume()
        }
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) return

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      const audioCtx = new AudioCtx()
      audioContextRef.current = audioCtx
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume()
      }

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = (): void => {
        if (!isListeningRef.current) {
          setAudioLevel(0)
          return
        }

        if (isPausedRef.current) {
          setAudioLevel(0)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
          return
        }

        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length
        const normalized = Math.min(100, Math.round((average / 128) * 100))
        setAudioLevel(normalized)

        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    } catch {
      // Non-fatal: visualizer failure will not block speech transcription
    }
  }, [])

  const stopAudioAnalyzer = useCallback((): void => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }, [])

  // Safely cleans up the active SpeechRecognition instance
  const cleanupRecognitionInstance = useCallback((): void => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current
      rec.onstart = null
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      try {
        rec.stop()
      } catch {
        // ignore
      }
      try {
        rec.abort()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])

  // Clean stop helper
  const stopListening = useCallback((): void => {
    isListeningRef.current = false
    isPausedRef.current = false
    isStartingRef.current = false
    setIsListening(false)
    setIsPaused(false)
    setInterimTranscript('')

    cleanupRecognitionInstance()
    stopAudioAnalyzer()
  }, [cleanupRecognitionInstance, stopAudioAnalyzer])

  // Pause listening
  const pauseListening = useCallback((): void => {
    if (!isListeningRef.current) return
    isPausedRef.current = true
    setIsPaused(true)
    setInterimTranscript('')
  }, [])

  // Resume listening
  const resumeListening = useCallback((): void => {
    if (!isListeningRef.current) return
    isPausedRef.current = false
    setIsPaused(false)
  }, [])

  // Instantiates a FRESH SpeechRecognition session (never reuses an ended instance)
  const startSession = useCallback((): void => {
    if (!isListeningRef.current || isPausedRef.current) return

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechAPI) return

    cleanupRecognitionInstance()

    const recognition = new SpeechAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    const engineLang =
      languageRef.current === 'auto' ? activeLangRef.current : languageRef.current
    recognition.lang = engineLang

    recognition.onstart = (): void => {
      isStartingRef.current = false
      consecutiveErrorsRef.current = 0
      if (isListeningRef.current) {
        setIsListening(true)
        setIsPaused(false)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent): void => {
      if (isPausedRef.current) return
      consecutiveErrorsRef.current = 0

      let liveInterim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const transcript = res[0]?.transcript || ''

        if (res.isFinal) {
          const detected = detectLanguage(transcript)
          setDetectedLanguage(detected)

          // In auto mode, dynamically adapt recognition language for optimal future fidelity
          if (languageRef.current === 'auto') {
            const adapted = detected === 'hi' ? 'hi-IN' : detected === 'bn' ? 'bn-IN' : 'en-IN'
            if (activeLangRef.current !== adapted) {
              activeLangRef.current = adapted
            }
          }

          const formatted = formatSpokenText(transcript, {
            language: engineLang,
            scriptMode: scriptModeRef.current,
            autoCapitalize,
            autoPunctuateCommands: autoPunctuateCommandsRef.current
          })

          // Check if user spoke a mode-switching command
          const modeSwitchCmd = formatted.commands.find((c) => c.type === 'switch-mode')
          if (modeSwitchCmd?.dictationMode) {
            const isSmart = modeSwitchCmd.dictationMode === 'smart'
            setAutoPunctuateCommandsState(isSmart)
            autoPunctuateCommandsRef.current = isSmart
          }

          // Check if user spoke a script-switching command
          const scriptSwitchCmd = formatted.commands.find((c) => c.type === 'switch-script')
          if (scriptSwitchCmd?.scriptMode) {
            setScriptMode(scriptSwitchCmd.scriptMode)
          }

          // Check if user spoke a language-switching command
          const langSwitchCmd = formatted.commands.find((c) => c.type === 'switch-language')
          if (langSwitchCmd?.language) {
            activeLangRef.current = langSwitchCmd.language
            // Reboot session smoothly with new language
            cleanupRecognitionInstance()
            restartTimerRef.current = window.setTimeout(() => {
              if (isListeningRef.current) {
                startSessionRef.current?.()
              }
            }, 50)
            return
          }

          if (formatted.text || formatted.commands.length > 0) {
            onSpeechCommitRef.current?.(
              formatted.text,
              formatted.commands,
              formatted.lastSubstitutions
            )
          }
          setInterimTranscript('')
        } else {
          liveInterim += transcript
        }
      }

      if (liveInterim) {
        const detected = detectLanguage(liveInterim)
        setDetectedLanguage(detected)

        const displayInterim =
          scriptModeRef.current === 'romanized'
            ? transliterateIndicToRoman(liveInterim)
            : liveInterim

        setInterimTranscript(displayInterim)
        onInterimSpeechRef.current?.(displayInterim)
      }
    }

    recognition.onerror = (ev: SpeechRecognitionErrorEvent): void => {
      isStartingRef.current = false
      // 'no-speech' is a normal silence pause; onend will automatically spin up a fresh instance
      if (ev.error === 'no-speech') {
        return
      }
      if (ev.error === 'aborted') {
        return
      }
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        setError('Microphone permission was denied. Please allow microphone access in browser settings.')
        stopListening()
        return
      }
      consecutiveErrorsRef.current++
      if (ev.error === 'network') {
        // Transient network disconnect; will auto-restart via onend with smart backoff
        return
      }
      console.warn('Speech recognition warning:', ev.error)
    }

    recognition.onend = (): void => {
      isStartingRef.current = false
      // Auto-restart with a FRESH instance if user is still in listening mode
      if (isListeningRef.current && !isPausedRef.current) {
        cleanupRecognitionInstance()
        const delay =
          consecutiveErrorsRef.current > 0
            ? Math.min(3000, 400 * Math.pow(1.5, consecutiveErrorsRef.current))
            : 50
        restartTimerRef.current = window.setTimeout(() => {
          if (isListeningRef.current && !isPausedRef.current) {
            startSessionRef.current?.()
          }
        }, delay)
      } else {
        stopListening()
      }
    }

    recognitionRef.current = recognition

    try {
      if (!isStartingRef.current) {
        isStartingRef.current = true
        recognition.start()
      }
    } catch (err) {
      isStartingRef.current = false
      console.warn('Recognition start exception, retrying:', err)
      restartTimerRef.current = window.setTimeout(() => {
        if (isListeningRef.current && !isPausedRef.current) {
          startSessionRef.current?.()
        }
      }, 150)
    }
  }, [autoCapitalize, cleanupRecognitionInstance, setScriptMode, stopListening])

  useEffect(() => {
    startSessionRef.current = startSession
  }, [startSession])

  // Master start function (Non-blocking audio analyzer startup for zero delay!)
  const startListening = useCallback(async (): Promise<void> => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechAPI) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    setError(null)
    isListeningRef.current = true
    isPausedRef.current = false
    setIsListening(true)
    setIsPaused(false)

    // Start recognition session immediately
    startSession()

    // Start audio visualizer non-blockingly in background
    void startAudioAnalyzer()
  }, [startAudioAnalyzer, startSession])

  // Dynamic language switching
  const setLanguage = useCallback((newLang: string): void => {
    setLanguageState(newLang)
    languageRef.current = newLang
    if (newLang !== 'auto') {
      activeLangRef.current = newLang
    }

    // If currently listening, seamlessly reboot the recognition session with the new language
    if (isListeningRef.current) {
      cleanupRecognitionInstance()
      restartTimerRef.current = window.setTimeout(() => {
        if (isListeningRef.current) {
          startSession()
        }
      }, 50)
    }
  }, [cleanupRecognitionInstance, startSession])

  const toggleListening = useCallback(async (): Promise<void> => {
    if (isListeningRef.current) {
      stopListening()
    } else {
      await startListening()
    }
  }, [startListening, stopListening])

  // Clean up completely on component unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      cleanupRecognitionInstance()
      stopAudioAnalyzer()
    }
  }, [cleanupRecognitionInstance, stopAudioAnalyzer])

  return {
    isSupported,
    isListening,
    isPaused,
    interimTranscript,
    audioLevel,
    language,
    scriptMode,
    autoPunctuateCommands,
    detectedLanguage,
    setLanguage,
    setScriptMode,
    toggleScriptMode,
    setAutoPunctuateCommands,
    toggleAutoPunctuateCommands,
    error,
    startListening,
    pauseListening,
    resumeListening,
    stopListening,
    toggleListening
  }
}
