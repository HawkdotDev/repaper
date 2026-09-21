import { transliterateIndicToRoman } from './transliterationEngine'

export interface PunctuationSubstitution {
  symbol: string
  spokenPhrase: string
}

export interface VoiceCommand {
  type:
    | 'new-line'
    | 'new-paragraph'
    | 'scratch-that'
    | 'clear-block'
    | 'switch-language'
    | 'switch-script'
    | 'switch-mode'
    | 'convert-to-word'
  language?: string
  scriptMode?: 'native' | 'romanized'
  dictationMode?: 'smart' | 'literal'
}

export interface FormattedSpeechResult {
  text: string
  commands: VoiceCommand[]
  detectedLanguage?: 'en' | 'hi' | 'bn'
  lastSubstitutions?: PunctuationSubstitution[]
}

export interface PunctuationEngineOptions {
  language?: string // 'auto' | 'en-IN' | 'en-US' | 'hi-IN' | 'bn-IN' | etc.
  scriptMode?: 'native' | 'romanized' // 'native' = বাংলা/हिन्दी, 'romanized' = "amake, ekdin, jinish"
  autoCapitalize?: boolean
  autoPunctuateCommands?: boolean
  normalizeSpacing?: boolean
}

const DEFAULT_OPTIONS: Required<PunctuationEngineOptions> = {
  language: 'auto',
  scriptMode: 'native',
  autoCapitalize: true,
  autoPunctuateCommands: true,
  normalizeSpacing: true
}

/**
 * Detects the dominant script/language of a text snippet.
 */
export function detectLanguage(text: string): 'en' | 'hi' | 'bn' {
  if (!text) return 'en'

  let devanagariCount = 0
  let bengaliCount = 0
  let latinCount = 0

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x0900 && code <= 0x097f) {
      devanagariCount++
    } else if (code >= 0x0980 && code <= 0x09ff) {
      bengaliCount++
    } else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinCount++
    }
  }

  if (bengaliCount > devanagariCount && bengaliCount > latinCount) {
    return 'bn'
  }
  if (devanagariCount > bengaliCount && devanagariCount > latinCount) {
    return 'hi'
  }
  return 'en'
}

/**
 * English verbal punctuation maps.
 * Format: [Regex, Symbol Replacement, Canonical Phrase Name]
 */
const ENGLISH_PUNCTUATION_MAP: [RegExp, string, string][] = [
  [/\b(question mark)\b/gi, '?', 'question mark'],
  [/\b(exclamation mark|exclamation point)\b/gi, '!', 'exclamation mark'],
  [/\b(full stop)\b/gi, '.', 'full stop'],
  [/\b(dot dot dot)\b/gi, '...', 'dot dot dot'],
  [/\b(open quote|open quotes|begin quote)\b/gi, '“', 'open quote'],
  [/\b(close quote|close quotes|end quote|unquote)\b/gi, '”', 'close quote'],
  [/\b(open parenthesis|open paren)\b/gi, '(', 'open paren'],
  [/\b(close parenthesis|close paren)\b/gi, ')', 'close paren'],
  [/\b(open bracket)\b/gi, '[', 'open bracket'],
  [/\b(close bracket)\b/gi, ']', 'close bracket'],
  [/\b(period)\b/gi, '.', 'period'],
  [/\b(comma)\b/gi, ',', 'comma'],
  [/\b(colon)\b/gi, ':', 'colon'],
  [/\b(semicolon)\b/gi, ';', 'semicolon'],
  [/\b(ellipsis)\b/gi, '...', 'ellipsis'],
  [/\b(dash|hyphen)\b/gi, ' — ', 'dash'],
  [/\b(at sign)\b/gi, '@', 'at sign'],
  [/\b(hashtag|hash tag|pound sign)\b/gi, '#', 'hashtag'],
  [/\b(percent sign|percent)\b/gi, '%', 'percent sign'],
  [/\b(dollar sign|dollars)\b/gi, '$', 'dollar sign'],
  [/\b(rupee|rupees)\b/gi, '₹', 'rupees'],
  [/\b(bullet point|bullet)\b/gi, '• ', 'bullet point'],
  [/\b(ampersand|and sign)\b/gi, '&', 'ampersand']
]

/**
 * Hindi verbal punctuation & commands.
 */
const HINDI_PUNCTUATION_MAP: [RegExp, string, string][] = [
  [/(?:^|\s*)(?:पूर्ण विराम|पूर्णविराम|पूर्ण-विराम)(?:\s*|$)/gu, '। ', 'पूर्ण विराम'],
  [/(?:^|\s*)(?:अल्प विराम|अल्पविराम|कोमा)(?:\s*|$)/gu, ', ', 'अल्प विराम'],
  [/(?:^|\s*)(?:प्रश्न चिन्ह|प्रश्नचिन्ह|सवालिया निशान)(?:\s*|$)/gu, '? ', 'प्रश्न चिन्ह'],
  [/(?:^|\s*)(?:विस्मयादिबोधक चिन्ह|विस्मयादिबोधक)(?:\s*|$)/gu, '! ', 'विस्मयादिबोधक'],
  [/(?:^|\s*)(?:डंडा|दाड़ी|दांडी)(?:\s*|$)/gu, '। ', 'दाड़ी']
]

/**
 * Bengali verbal punctuation & commands.
 */
const BENGALI_PUNCTUATION_MAP: [RegExp, string, string][] = [
  [/(?:^|\s*)(?:দাঁড়ি|দাড়ি|পূর্ণচ্ছেদ|পূর্ণ\s*বিরাম|পূর্ণবিরাম)(?:\s*|$)/gu, '। ', 'দাঁড়ি'],
  [/(?:^|\s*)(?:কমা)(?:\s*|$)/gu, ', ', 'কমা'],
  [/(?:^|\s*)(?:প্রশ্ন চিহ্ন|জিজ্ঞাসা চিহ্ন|প্রশ্নচিহ্ন)(?:\s*|$)/gu, '? ', 'জিজ্ঞাসা চিহ্ন'],
  [/(?:^|\s*)(?:বিস্ময় চিহ্ন|আশ্চর্য চিহ্ন)(?:\s*|$)/gu, '! ', 'বিস্ময় চিহ্ন']
]

/**
 * Target command keywords that can be disambiguated as words vs punctuation.
 */
const TARGET_COMMAND_WORDS =
  'full\\s+stop|period|comma|question\\s+mark|exclamation\\s+mark|exclamation\\s+point|colon|semicolon|dash|hyphen|ellipsis|dot\\s+dot\\s+dot|at\\s+sign|hashtag|hash\\s*tag|pound\\s+sign|percent\\s+sign|dollar\\s+sign|rupee|bullet\\s+point|bullet|ampersand|new\\s+line|newline|new\\s+paragraph|next\\s+paragraph|scratch\\s+that|undo\\s+that|delete\\s+that|clear\\s+block|clear\\s+current\\s+block'

/**
 * Contextual Disambiguation & Literal Guard:
 * Shields spoken phrases where voice command words (like "full stop", "comma", "new line", "scratch that")
 * are intended as literal words rather than executable commands or punctuation substitutions.
 */
export function protectLiteralPhrases(rawText: string): {
  text: string
  tokens: string[]
} {
  const tokens: string[] = []
  let text = rawText

  const replaceWithToken = (replacement: string): string => {
    const idx = tokens.length
    tokens.push(replacement)
    return `__LITERAL_TOKEN_${idx}__`
  }

  // 1. Explicit Verbal Escapes: "literal full stop" -> "full stop", "word full stop" -> "full stop", "as word full stop" -> "full stop"
  // Here, the prefix is an intentional escape keyword, so we strip the escape prefix and protect the literal word!
  text = text.replace(
    new RegExp(
      `\\b(?:literal|literally|verbatim|raw|as\\s+(?:a\\s+)?words?|as\\s+text|just\\s+(?:the\\s+)?words?|(?:the\\s+)?words?|phrase|term)\\s+(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (_match, cmd) => replaceWithToken(cmd)
  )

  // 2. Explicit Quotations: "quote full stop" -> "“full stop”", "in quotes full stop" -> "“full stop”"
  text = text.replace(
    new RegExp(
      `\\b(?:quoted?|in\\s+quotes)\\s+(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (_match, cmd) => replaceWithToken(`“${cmd}”`)
  )

  // 3. Prepositional phrases (Prepositions strictly modify nouns, never punctuation marks or commands):
  // e.g. "came to a full stop", "without a full stop", "brought to a full stop", "ended with a full stop", "meaning of full stop", "talked about full stop"
  text = text.replace(
    new RegExp(
      `\\b(to|at|into|with|without|before|after|between|of|about|like|for|from)\\s+(?:(?:a|an|the|no)\\s+)?(?:single\\s+)?(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (match) => replaceWithToken(match)
  )

  // 4. Determiners & Articles modifying command words (e.g. "the full stop", "a comma", "my full stop", "no full stop")
  text = text.replace(
    new RegExp(
      `\\b(a|an|the|my|your|our|their|its|no)\\s+(?:single\\s+)?(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (match) => replaceWithToken(match)
  )

  // 5. Adjectival modifiers modifying punctuation nouns:
  // e.g. "complete full stop", "dead full stop", "sudden full stop", "abrupt full stop", "hard full stop", "actual full stop", "missing comma"
  text = text.replace(
    new RegExp(
      `\\b(complete|dead|sudden|abrupt|hard|actual|missing|wrong|unnecessary|extra|trailing|leading)\\s+(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (match) => replaceWithToken(match)
  )

  // 6. Verbs of Writing, Speech, Action, or Definition (e.g. "write full stop", "type comma", "said full stop", "put a full stop", "add full stop")
  text = text.replace(
    new RegExp(
      `\\b(write|writes|writing|wrote|written|type|types|typing|typed|spell|spells|spelling|spelled|spelt|say|says|saying|said|speak|speaks|speaking|spoke|spoken|put|puts|putting|place|places|placing|placed|add|adds|adding|added|insert|inserts|inserting|inserted|delete|deletes|deleting|deleted|call|calls|calling|called|name|names|naming|named|contain|contains|containing|contained|include|includes|including|included|mean|means|meaning|meant|print|prints|printing|printed|need|needs|needing|needed)\\s+(?:(?:a|an|the)\\s+)?(?:words?|phrase|term)?\\s*(${TARGET_COMMAND_WORDS})\\b`,
      'gi'
    ),
    (match) => replaceWithToken(match)
  )

  // 7. Predicate Verbs following Subject (e.g. "full stop is used", "comma was missing", "question mark indicates", "full stop means")
  text = text.replace(
    /\b(full\s+stop|period|comma|question\s+mark|exclamation\s+mark|colon|semicolon|dash|hyphen|new\s+line|new\s+paragraph)\s+(is|are|was|were|means|meant|represents|represented|indicates|indicated|denotes|denoted|symbolizes|symbolized|separates|separated|stands\s+for|comes|came|appears|should\s+be|must\s+be|cannot\s+be|follows|followed)\b/gi,
    (match) => replaceWithToken(match)
  )

  // 8. Special Collocations for "New Line" (e.g. "new line of code", "brand new line")
  text = text.replace(
    /\b(brand\s+new\s+line|new\s+line\s+of\s+[a-zA-Z]+)\b/gi,
    (match) => replaceWithToken(match)
  )

  // 9. Negations and modals before "scratch that" / "clear block" (e.g. "don't scratch that", "to scratch that")
  text = text.replace(
    /\b(to|don't|do\s+not|didn't|did\s+not|won't|will\s+not|can't|cannot|can|could|would|should|never|might|please\s+don't|gently|accidentally|wanna|want\s+to|trying\s+to|tried\s+to|about\s+to|how\s+to)\s+(scratch\s+that|undo\s+that|delete\s+that|clear\s+block)\b/gi,
    (match) => replaceWithToken(match)
  )

  // 10. Indic Literal Expressions (e.g. "शब्द पूर्ण विराम", "लिखो पूर्ण विराम", "হিসাবে দাঁড়ি", "শব্দ দাঁড়ি", "শব্দ কমা")
  text = text.replace(
    /(?:शब्द|लिखो|লেখো|হিসাবে|হিসেবে)\s+(पूर्ण\s*विराम|अल्प\s*विराम|प्रश्न\s*चिन्ह|দাঁড়ি|দাড়ি|কমা|জিজ্ঞাসা\s*চিহ্ন|পূর্ণ\s*বিরাম|পূর্ণচ্ছেদ|মুছে\s*ফেলো|বাতিল\s*করো|রদ্দ\s*করো)/giu,
    (match) => replaceWithToken(match)
  )

  return { text, tokens }
}

export function restoreLiteralPhrases(text: string, tokens: string[]): string {
  if (tokens.length === 0) return text
  return text.replace(/__LITERAL_TOKEN_(\d+)__/g, (_, idx) => {
    return tokens[Number(idx)] ?? ''
  })
}

/**
 * Formats a raw spoken transcript chunk into clean, readable text,
 * extracting any structural, language-switch, script-switch, mode-switch, or editing commands.
 */
export function formatSpokenText(
  rawTranscript: string,
  options: PunctuationEngineOptions = {}
): FormattedSpeechResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const commands: VoiceCommand[] = []
  const lastSubstitutions: PunctuationSubstitution[] = []

  if (!rawTranscript || !rawTranscript.trim()) {
    return { text: '', commands: [] }
  }

  // Detect script/language
  const detected = detectLanguage(rawTranscript)
  const isIndic =
    opts.language.startsWith('hi') ||
    opts.language.startsWith('bn') ||
    detected === 'hi' ||
    detected === 'bn'

  let text = rawTranscript
  let literalTokens: string[] = []

  // If autoPunctuateCommands is active, shield literal phrases first
  if (opts.autoPunctuateCommands) {
    const guarded = protectLiteralPhrases(text)
    text = guarded.text
    literalTokens = guarded.tokens
  }

  // Check for mode-switching voice commands (e.g. "literal mode", "command mode", "dictation mode")
  if (
    /(?:^|\s*)(?:switch to literal mode|literal mode|text mode|dictation only|dictation mode|raw mode|verbatim mode)(?:\s*|$)/iu.test(
      text
    )
  ) {
    commands.push({ type: 'switch-mode', dictationMode: 'literal' })
    text = text
      .replace(
        /(?:^|\s*)(?:switch to literal mode|literal mode|text mode|dictation only|dictation mode|raw mode|verbatim mode)(?:\s*|$)/giu,
        ' '
      )
      .trim()
  } else if (
    /(?:^|\s*)(?:switch to command mode|command mode|commands mode|smart mode|punctuation mode)(?:\s*|$)/iu.test(
      text
    )
  ) {
    commands.push({ type: 'switch-mode', dictationMode: 'smart' })
    text = text
      .replace(
        /(?:^|\s*)(?:switch to command mode|command mode|commands mode|smart mode|punctuation mode)(?:\s*|$)/giu,
        ' '
      )
      .trim()
  }

  // Check for post-punctuation correction ("that was a word" / "as word" / "undo punctuation")
  if (
    /(?:^|\s*)(?:that was a word|as a word|as word|as words|write as word|make that a word|undo punctuation|write that out|শব্দ হিসেবে)(?:\s*|$)/iu.test(
      text
    )
  ) {
    commands.push({ type: 'convert-to-word' })
    text = text
      .replace(
        /(?:^|\s*)(?:that was a word|as a word|as word|as words|write as word|make that a word|undo punctuation|write that out|শব্দ হিসেবে)(?:\s*|$)/giu,
        ' '
      )
      .trim()
  }

  // If autoPunctuateCommands is active, process commands and spoken punctuation
  if (opts.autoPunctuateCommands) {

    // 1a. Check for script output switching voice commands
    if (
      /(?:^|\s*)(?:switch to english script|switch to roman script|write in english|write in roman|romanized script|রোমান লিপি|রোমান হরফ|रोमन लिपि)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'switch-script', scriptMode: 'romanized' })
      text = text
        .replace(
          /(?:^|\s*)(?:switch to english script|switch to roman script|write in english|write in roman|romanized script|রোমান লিপি|রোমান হরফ|रोमन लिपि)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    } else if (
      /(?:^|\s*)(?:switch to native script|native script|write in native|বাংলা লিপি|বাংলা হরফ|हिंदी लिपि|देवनागरी)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'switch-script', scriptMode: 'native' })
      text = text
        .replace(
          /(?:^|\s*)(?:switch to native script|native script|write in native|বাংলা লিপি|বাংলা হরফ|हिंदी लिपि|देवनागरी)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    }

    // 1b. Check for on-the-fly language switching voice commands
    if (/(?:^|\s*)(?:switch to hindi|hindi mein|हिंदी में|হিন্দি)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'switch-language', language: 'hi-IN' })
      text = text
        .replace(/(?:^|\s*)(?:switch to hindi|hindi mein|हिंदी में|হিন্দি)(?:\s*|$)/giu, ' ')
        .trim()
    } else if (
      /(?:^|\s*)(?:switch to bengali|bangla mein|banglay|বাংলায়|বাংলা|बंगाली में)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'switch-language', language: 'bn-IN' })
      text = text
        .replace(
          /(?:^|\s*)(?:switch to bengali|bangla mein|banglay|বাংলায়|বাংলা|बंगाली में)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    } else if (
      /(?:^|\s*)(?:switch to english|in english|english mein|ইংরেজি|अंग्रेजी में)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'switch-language', language: 'en-IN' })
      text = text
        .replace(
          /(?:^|\s*)(?:switch to english|in english|english mein|ইংরেজি|अंग्रेजी में)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    } else if (/(?:^|\s*)(?:switch to spanish|in spanish|en español)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'switch-language', language: 'es-ES' })
      text = text
        .replace(/(?:^|\s*)(?:switch to spanish|in spanish|en español)(?:\s*|$)/giu, ' ')
        .trim()
    } else if (/(?:^|\s*)(?:switch to french|in french|en français)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'switch-language', language: 'fr-FR' })
      text = text
        .replace(/(?:^|\s*)(?:switch to french|in french|en français)(?:\s*|$)/giu, ' ')
        .trim()
    } else if (/(?:^|\s*)(?:switch to german|in german|auf deutsch)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'switch-language', language: 'de-DE' })
      text = text
        .replace(/(?:^|\s*)(?:switch to german|in german|auf deutsch)(?:\s*|$)/giu, ' ')
        .trim()
    } else if (/(?:^|\s*)(?:switch to japanese|in japanese|日本語)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'switch-language', language: 'ja-JP' })
      text = text
        .replace(/(?:^|\s*)(?:switch to japanese|in japanese|日本語)(?:\s*|$)/giu, ' ')
        .trim()
    }

    // 2. Check for editing commands (English, Hindi, Bengali)
    if (
      /(?:^|\s*)(?:scratch that|undo that|delete that|रद्द करो|वापस लो|মুছে ফেলো|বাতিল করো)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'scratch-that' })
      text = text
        .replace(
          /(?:^|\s*)(?:scratch that|undo that|delete that|रद्द करो|वापस लो|মুছে ফেলো|বাতিল করো)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    }

    if (
      /(?:^|\s*)(?:clear block|clear current block|पूरा ब्लॉक मिटाओ|ব্লক মুছে ফেলো)(?:\s*|$)/iu.test(
        text
      )
    ) {
      commands.push({ type: 'clear-block' })
      text = text
        .replace(
          /(?:^|\s*)(?:clear block|clear current block|पूरा ब्लॉक मिटाओ|ব্লক মুছে ফেলো)(?:\s*|$)/giu,
          ' '
        )
        .trim()
    }

    // 3. Check for structural commands (new paragraph / new line)
    if (
      /(?:^|\s*)(?:new paragraph|next paragraph|नया पैराग्राफ|নতুন প্যারাগ্রাফ)(?:\s*|$)/iu.test(text)
    ) {
      commands.push({ type: 'new-paragraph' })
      text = text.replace(
        /(?:^|\s*)(?:new paragraph|next paragraph|नया पैराग्राफ|নতুন প্যারাগ্রাফ)(?:\s*|$)/giu,
        '\n\n'
      )
    }

    if (/(?:^|\s*)(?:new line|newline|नई लाइन|নতুন লাইন)(?:\s*|$)/iu.test(text)) {
      commands.push({ type: 'new-line' })
      text = text.replace(/(?:^|\s*)(?:new line|newline|नई लाइन|নতুন লাইন)(?:\s*|$)/giu, '\n')
    }

    // 4. Spoken punctuation substitution
    // English verbal punctuation
    for (const [regex, replacement, canonicalPhrase] of ENGLISH_PUNCTUATION_MAP) {
      if (regex.test(text)) {
        regex.lastIndex = 0
        if (isIndic && replacement === '.') {
          if (opts.scriptMode === 'romanized') {
            text = text.replace(regex, '.')
            lastSubstitutions.push({ symbol: '.', spokenPhrase: canonicalPhrase })
          } else {
            text = text.replace(regex, '।')
            lastSubstitutions.push({ symbol: '।', spokenPhrase: canonicalPhrase })
          }
        } else {
          text = text.replace(regex, replacement)
          lastSubstitutions.push({ symbol: replacement.trim(), spokenPhrase: canonicalPhrase })
        }
      }
    }

    // Hindi verbal punctuation
    for (const [regex, replacement, canonicalPhrase] of HINDI_PUNCTUATION_MAP) {
      if (regex.test(text)) {
        regex.lastIndex = 0
        if (opts.scriptMode === 'romanized' && replacement.trim() === '।') {
          text = text.replace(regex, '.')
          lastSubstitutions.push({ symbol: '.', spokenPhrase: canonicalPhrase })
        } else {
          text = text.replace(regex, replacement)
          lastSubstitutions.push({ symbol: replacement.trim(), spokenPhrase: canonicalPhrase })
        }
      }
    }

    // Bengali verbal punctuation
    for (const [regex, replacement, canonicalPhrase] of BENGALI_PUNCTUATION_MAP) {
      if (regex.test(text)) {
        regex.lastIndex = 0
        if (opts.scriptMode === 'romanized' && replacement.trim() === '।') {
          text = text.replace(regex, '.')
          lastSubstitutions.push({ symbol: '.', spokenPhrase: canonicalPhrase })
        } else {
          text = text.replace(regex, replacement)
          lastSubstitutions.push({ symbol: replacement.trim(), spokenPhrase: canonicalPhrase })
        }
      }
    }
  }

  // 5. Spacing normalization (including danda '।')
  if (opts.normalizeSpacing) {
    // Remove spaces before punctuation (.,!?:;।)
    text = text.replace(/\s+([.,!?:;।])/g, '$1')

    // Remove space inside opening quotes/parentheses: "( hello" -> "(hello", "“ world" -> "“world"
    text = text.replace(/([“(\[])\s+/g, '$1')

    // Remove space before closing quotes/parentheses: "hello )" -> "hello)", "world ”" -> "world”"
    text = text.replace(/\s+([”)\],])/g, '$1')

    // Ensure single space after punctuation if followed by any word character
    text = text.replace(/([.,!?:;।])\s*(?=[a-zA-Z0-9\u0900-\u097F\u0980-\u09FF])/g, '$1 ')

    // Remove space after @ and # when followed by tag/handle name
    text = text.replace(/([@#])\s+(?=[a-zA-Z0-9_\u0900-\u097F\u0980-\u09FF])/g, '$1')

    // Remove space before percent sign
    text = text.replace(/\s+(%)/g, '$1')

    // Replace multiple spaces with single space
    text = text.replace(/[ \t]+/g, ' ')

    // Clean up spaces around newlines
    text = text.replace(/[ \t]*\n[ \t]*/g, '\n')
  }

  // 5b. Transliterate to Roman English letters if scriptMode is 'romanized'
  if (opts.scriptMode === 'romanized') {
    text = transliterateIndicToRoman(text)
    text = text.replace(/।/g, '.')
  }

  // 5c. Restore protected literal phrases before capitalization
  if (literalTokens.length > 0) {
    text = restoreLiteralPhrases(text, literalTokens)
  }

  // 6. Smart Capitalization for Latin characters
  if (opts.autoCapitalize) {
    // Capitalize start of text
    text = text.replace(/^(\s*)([a-z])/, (_match, space, char) => `${space}${char.toUpperCase()}`)

    // Capitalize after sentence-ending punctuation (. ? ! । •) or newline
    text = text.replace(
      /([.?!।•]\s+)([a-z])/g,
      (_match, prefix, char) => `${prefix}${char.toUpperCase()}`
    )
    text = text.replace(/(\n+)([a-z])/g, (_match, prefix, char) => `${prefix}${char.toUpperCase()}`)

    // Capitalize standalone pronoun "I" and contractions
    text = text.replace(/\b(i)\b/g, 'I')
    text = text.replace(
      /\b(i)('m|'ve|'ll|'d)\b/gi,
      (_match, _i, suffix) => `I${suffix.toLowerCase()}`
    )
  }

  return {
    text: text.trim(),
    commands,
    detectedLanguage: detected,
    lastSubstitutions: lastSubstitutions.length > 0 ? lastSubstitutions : undefined
  }
}

/**
 * Checks if a single character is a standard punctuation mark.
 */
export function isPunctuationChar(char: string | null | undefined): boolean {
  if (!char) return false
  return /^[.,!?:;।]$/.test(char)
}

/**
 * Checks if the text consists solely of punctuation marks and whitespace.
 */
export function isStandalonePunctuation(text: string): boolean {
  if (!text) return false
  return /^[.,!?:;।\s]+$/.test(text.trim())
}

/**
 * Determines whether a leading space should be prepended before inserting text,
 * based on the character immediately preceding the cursor in the document,
 * and the incoming text to be inserted.
 */
export function shouldPrependSpace(
  precedingChar: string | null | undefined,
  nextText?: string
): boolean {
  if (!precedingChar) return false
  if (/[\s\n\r([“'"`@#$₹]/.test(precedingChar)) {
    return false
  }
  if (nextText && /^[.,!?:;।\])”'"`%&]/.test(nextText.trim())) {
    return false
  }
  return true
}
