export type CommandCategory = 'all' | 'punctuation' | 'editing' | 'language'

export interface VoiceCommandItem {
  id: string
  category: 'punctuation' | 'editing' | 'language'
  title: string
  action: string
  description: string
  englishPhrases?: string[]
  hindiPhrases?: string[]
  bengaliPhrases?: string[]
  badge?: string
}

export const VOICE_COMMANDS_DATA: VoiceCommandItem[] = [
  // --- PUNCTUATION ---
  {
    id: 'p-period',
    category: 'punctuation',
    title: 'Period / Danda',
    action: '.  /  ।',
    description: 'Sentence terminator. Produces dot in English/Romanized mode, or danda in Indic native mode.',
    englishPhrases: ['“period”', '“full stop”'],
    hindiPhrases: ['“पूर्ण विराम”', '“दाड़ी”'],
    bengaliPhrases: ['“দাঁড়ি”', '“পূর্ণচ্ছেদ”', '“পূর্ণ বিরাম”'],
    badge: '. / ।'
  },
  {
    id: 'p-comma',
    category: 'punctuation',
    title: 'Comma',
    action: ',',
    description: 'Inserts a comma followed by normalized spacing.',
    englishPhrases: ['“comma”'],
    hindiPhrases: ['“अल्प विराम”', '“कोमा”'],
    bengaliPhrases: ['“কমা”'],
    badge: ','
  },
  {
    id: 'p-question',
    category: 'punctuation',
    title: 'Question Mark',
    action: '?',
    description: 'Inserts question mark and auto-capitalizes subsequent sentences.',
    englishPhrases: ['“question mark”'],
    hindiPhrases: ['“प्रश्न चिन्ह”', '“सवालिया निशान”'],
    bengaliPhrases: ['“জিজ্ঞাসা চিহ্ন”', '“প্রশ্নবোধক চিহ্ন”'],
    badge: '?'
  },
  {
    id: 'p-exclamation',
    category: 'punctuation',
    title: 'Exclamation Mark',
    action: '!',
    description: 'Inserts exclamation point with clean trailing spacing.',
    englishPhrases: ['“exclamation point”', '“exclamation mark”'],
    hindiPhrases: ['“विस्मयादिबोधक चिन्ह”'],
    bengaliPhrases: ['“বিস্ময়বোধক চিহ্ন”', '“বিস্ময় চিহ্ন”'],
    badge: '!'
  },
  {
    id: 'p-colon',
    category: 'punctuation',
    title: 'Colon',
    action: ':',
    description: 'Inserts colon for lists, explanations, or definitions.',
    englishPhrases: ['“colon”'],
    bengaliPhrases: ['“কোলন”'],
    badge: ':'
  },
  {
    id: 'p-semicolon',
    category: 'punctuation',
    title: 'Semicolon',
    action: ';',
    description: 'Inserts semicolon between closely linked statements.',
    englishPhrases: ['“semicolon”'],
    bengaliPhrases: ['“সেমিকোলন”'],
    badge: ';'
  },
  {
    id: 'p-dash',
    category: 'punctuation',
    title: 'Dash / Hyphen',
    action: '—',
    description: 'Inserts spaced em-dash for emphasis or separation.',
    englishPhrases: ['“dash”', '“hyphen”'],
    badge: '—'
  },
  {
    id: 'p-ellipsis',
    category: 'punctuation',
    title: 'Ellipsis',
    action: '...',
    description: 'Inserts dot dot dot ellipsis.',
    englishPhrases: ['“ellipsis”', '“dot dot dot”'],
    badge: '...'
  },
  {
    id: 'p-quotes',
    category: 'punctuation',
    title: 'Quotation Marks',
    action: '“  ”',
    description: 'Inserts curly open and close quotation marks.',
    englishPhrases: ['“open quote” / “close quote”', '“begin quote” / “end quote”'],
    badge: '“ ”'
  },
  {
    id: 'p-parens',
    category: 'punctuation',
    title: 'Parentheses & Brackets',
    action: '( )  [ ]',
    description: 'Inserts parentheses or square brackets around parenthetical thoughts.',
    englishPhrases: ['“open paren” / “close paren”', '“open bracket” / “close bracket”'],
    badge: '( )'
  },

  // --- EDITING & STRUCTURE ---
  {
    id: 'e-scratch-that',
    category: 'editing',
    title: 'Scratch That / Undo',
    action: 'Undo Last Speech',
    description: 'Instantly deletes the last dictated sentence or speech segment.',
    englishPhrases: ['“scratch that”', '“undo that”', '“delete that”'],
    hindiPhrases: ['“रद्द करो”', '“वापस लो”'],
    bengaliPhrases: ['“মুছে ফেলো”', '“বাতিল করো”'],
    badge: 'Undo'
  },
  {
    id: 'e-clear-block',
    category: 'editing',
    title: 'Clear Current Block',
    action: 'Clear Active Line',
    description: 'Wipes out the entire active line or paragraph block.',
    englishPhrases: ['“clear block”', '“clear current block”'],
    hindiPhrases: ['“पूरा ब्लॉक मिटाओ”'],
    bengaliPhrases: ['“ব্লক মুছে ফেলো”'],
    badge: 'Clear'
  },
  {
    id: 'e-new-line',
    category: 'editing',
    title: 'New Line (Soft Break)',
    action: 'Break (\\n)',
    description: 'Starts a new line without interrupting continuous voice dictation.',
    englishPhrases: ['“new line”', '“newline”'],
    hindiPhrases: ['“नई लाइन”'],
    bengaliPhrases: ['“নতুন লাইন”'],
    badge: '↵ Line'
  },
  {
    id: 'e-new-paragraph',
    category: 'editing',
    title: 'New Paragraph',
    action: 'Paragraph (\\n\\n)',
    description: 'Creates a double line break to start a fresh block of thoughts.',
    englishPhrases: ['“new paragraph”', '“next paragraph”'],
    hindiPhrases: ['“नया पैराग्राफ”'],
    bengaliPhrases: ['“নতুন প্যারাগ্রাফ”'],
    badge: '↵↵ Block'
  },

  // --- LANGUAGE & SCRIPT MODES ---
  {
    id: 'l-switch-en',
    category: 'language',
    title: 'Switch to English',
    action: 'Language: English',
    description: 'Dynamically switches speech recognition engine to English (India / International).',
    englishPhrases: ['“switch to English”', '“in English”'],
    hindiPhrases: ['“अंग्रेजी में”', '“english mein”'],
    bengaliPhrases: ['“ইংরেজি”'],
    badge: 'EN Mode'
  },
  {
    id: 'l-switch-hi',
    category: 'language',
    title: 'Switch to Hindi',
    action: 'Language: हिन्दी',
    description: 'Dynamically switches speech recognition engine to Hindi.',
    englishPhrases: ['“switch to Hindi”'],
    hindiPhrases: ['“हिंदी में”', '“hindi mein”'],
    bengaliPhrases: ['“হিন্দি”'],
    badge: 'HI Mode'
  },
  {
    id: 'l-switch-bn',
    category: 'language',
    title: 'Switch to Bengali',
    action: 'Language: বাংলা',
    description: 'Dynamically switches speech recognition engine to Bengali.',
    englishPhrases: ['“switch to Bengali”'],
    hindiPhrases: ['“बंगाली में”', '“bangla mein”'],
    bengaliPhrases: ['“বাংলায়”', '“বাংলা”'],
    badge: 'BN Mode'
  },
  {
    id: 'l-script-roman',
    category: 'language',
    title: 'English Script (Romanized)',
    action: 'Script: English',
    description: 'Spoken Bengali/Hindi words are transliterated phonetically into Roman English characters (e.g. "amake ekta boi dao").',
    englishPhrases: ['“write in English”', '“switch to roman script”'],
    hindiPhrases: ['“रोमन लिपि”'],
    bengaliPhrases: ['“রোমান লিপি”', '“রোমান হরফ”'],
    badge: 'English Script'
  },
  {
    id: 'l-script-native',
    category: 'language',
    title: 'Native Script Mode',
    action: 'Script: Native',
    description: 'Writes spoken speech directly in authentic Bengali (বাংলা) or Devanagari (हिन्दी) script.',
    englishPhrases: ['“write in native”', '“switch to native script”'],
    hindiPhrases: ['“हिंदी लिपि”', '“देवनागरी”'],
    bengaliPhrases: ['“বাংলা লিপি”', '“বাংলা হরফ”'],
    badge: 'Native Script'
  },
  {
    id: 'e-convert-to-word',
    category: 'editing',
    title: 'That Was a Word / As Word',
    action: 'Convert Symbol to Word',
    description: 'Reverts the most recently inserted punctuation mark back into its literal spoken word (e.g. "." becomes "full stop").',
    englishPhrases: ['“that was a word”', '“as word”', '“undo punctuation”'],
    hindiPhrases: ['“शब्द के रूप में”'],
    bengaliPhrases: ['“শব্দ হিসেবে”'],
    badge: 'Undo Mark'
  },
  {
    id: 'l-mode-literal',
    category: 'language',
    title: 'Literal Mode (Dictation Only)',
    action: 'Mode: Literal Words',
    description: 'Writes all spoken words verbatim without executing commands or inserting punctuation marks (e.g. saying "full stop" writes the words "full stop").',
    englishPhrases: ['“literal mode”', '“dictation mode”', '“text mode”'],
    badge: 'Literal Mode'
  },
  {
    id: 'l-mode-command',
    category: 'language',
    title: 'Command Mode (Smart Punctuation)',
    action: 'Mode: Smart Commands',
    description: 'Restores automatic punctuation formatting and voice commands.',
    englishPhrases: ['“command mode”', '“smart mode”', '“punctuation mode”'],
    badge: 'Command Mode'
  },
  {
    id: 'p-literal-escape',
    category: 'punctuation',
    title: 'Literal Word Escapes',
    action: 'Speak Words Verbatim',
    description: 'Prefix any punctuation word with "word", "literal", or "as word" to dictate it as text instead of a symbol.',
    englishPhrases: ['“word full stop”', '“literal comma”', '“as word full stop”'],
    hindiPhrases: ['“शब्द पूर्ण विराम”'],
    bengaliPhrases: ['“শব্দ দাঁড়ি”'],
    badge: 'Verbatim Word'
  }
]
