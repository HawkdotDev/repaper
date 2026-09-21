/**
 * Transliteration Engine for Indic Scripts (Bengali & Hindi)
 *
 * Converts native Bengali and Devanagari (Hindi) scripts into natural,
 * phonetic Romanized English text (e.g. "আমাকে, একদিন, জিনিস" -> "amake, ekdin, jinish",
 * "मुझे, एक दिन" -> "mujhe, ek din").
 */

// ==================== BENGALI TRANSLITERATION ====================

const BENGALI_INDEPENDENT_VOWELS: Record<string, string> = {
  'অ': 'o',
  'আ': 'a',
  'ই': 'i',
  'ঈ': 'i',
  'উ': 'u',
  'ঊ': 'u',
  'ঋ': 'ri',
  'এ': 'e',
  'ঐ': 'oi',
  'ও': 'o',
  'ঔ': 'ou'
}

const BENGALI_DEPENDENT_MATRAS: Record<string, string> = {
  'া': 'a',
  'ি': 'i',
  'ী': 'i',
  'ু': 'u',
  'ূ': 'u',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou'
}

const BENGALI_CONSONANTS: Record<string, string> = {
  'ক': 'k',
  'খ': 'kh',
  'গ': 'g',
  'ঘ': 'gh',
  'ঙ': 'ng',
  'চ': 'ch',
  'ছ': 'ch',
  'জ': 'j',
  'ঝ': 'jh',
  'ঞ': 'n',
  'ট': 't',
  'ঠ': 'th',
  'ড': 'd',
  'ঢ': 'dh',
  'ণ': 'n',
  'ত': 't',
  'থ': 'th',
  'দ': 'd',
  'ধ': 'dh',
  'ন': 'n',
  'প': 'p',
  'ফ': 'f',
  'ব': 'b',
  'ভ': 'bh',
  'ম': 'm',
  'য': 'j',
  'র': 'r',
  'ল': 'l',
  'শ': 'sh',
  'ষ': 'sh',
  'স': 's',
  'হ': 'h',
  'য়': 'y',
  'ড়': 'r',
  'ঢ়': 'rh',
  'ৎ': 't',
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': 'n'
}

const BENGALI_HASANTA = '্'

// Common Bengali word overrides for colloquial natural spelling
const BENGALI_WORD_OVERRIDES: Record<string, string> = {
  'আমাকে': 'amake',
  'একদিন': 'ekdin',
  'জিনিস': 'jinish',
  'আমি': 'ami',
  'তুমি': 'tumi',
  'আপনি': 'apni',
  'কেমন': 'kemon',
  'আছেন': 'achen',
  'আছো': 'acho',
  'ভালো': 'bhalo',
  'আছি': 'achi',
  'ধন্যবাদ': 'dhonnobad',
  'কোথায়': 'kothay',
  'কি': 'ki',
  'কী': 'ki',
  'কেন': 'keno',
  'হ্যাঁ': 'ha',
  'না': 'na',
  'এক': 'ek',
  'দুই': 'dui',
  'তিন': 'tin',
  'অনেক': 'onek',
  'খুব': 'khub',
  'কালকে': 'kalke',
  'আজকে': 'aajke',
  'এখন': 'ekhon',
  'বলছি': 'bolchi',
  'করছি': 'korchi',
  'হচ্ছে': 'hocche',
  'করব': 'korbo',
  'যাব': 'jabo',
  'কলম': 'kolom',
  'সময়': 'somoy',
  'কাজ': 'kaaj',
  'কথা': 'kotha',
  'বাড়ি': 'bari',
  'জল': 'jol',
  'খাবার': 'khabar',
  'বন্ধু': 'bondhu',
  'মানুষ': 'manush'
}

/**
 * Transliterates a Bengali word into natural phonetic Romanized English script.
 */
function transliterateBengaliWord(word: string): string {
  const cleanWord = word.trim()
  if (BENGALI_WORD_OVERRIDES[cleanWord]) {
    return BENGALI_WORD_OVERRIDES[cleanWord]
  }

  let result = ''
  const len = cleanWord.length

  for (let i = 0; i < len; i++) {
    const char = cleanWord[i]
    const nextChar = i + 1 < len ? cleanWord[i + 1] : null

    // 1. Independent Vowels
    if (BENGALI_INDEPENDENT_VOWELS[char]) {
      result += BENGALI_INDEPENDENT_VOWELS[char]
      continue
    }

    // 2. Consonants
    if (BENGALI_CONSONANTS[char]) {
      const romConsonant = BENGALI_CONSONANTS[char]
      result += romConsonant

      // If next char is Hasanta (্), don't add vowel
      if (nextChar === BENGALI_HASANTA) {
        i++ // Skip hasanta
        continue
      }

      // If next char is a dependent vowel sign (matra)
      if (nextChar && BENGALI_DEPENDENT_MATRAS[nextChar]) {
        result += BENGALI_DEPENDENT_MATRAS[nextChar]
        i++ // Skip matra
        continue
      }

      // Inherent vowel handling:
      // In Bengali, final consonants drop the inherent vowel (e.g. এক = ek, দিন = din, জিনিস = jinish)
      // Non-final consonants without a matra or hasanta take inherent vowel 'o'
      const isEnd = i === len - 1
      if (!isEnd && nextChar && BENGALI_CONSONANTS[nextChar]) {
        result += 'o'
      }
      continue
    }

    // 3. Standalone Matras or other characters
    if (BENGALI_DEPENDENT_MATRAS[char]) {
      result += BENGALI_DEPENDENT_MATRAS[char]
      continue
    }

    // Danda to period
    if (char === '।') {
      result += '.'
      continue
    }

    // Preserved Latin or punctuation characters
    result += char
  }

  return result
}

export function transliterateBengaliToRoman(text: string): string {
  if (!text) return ''

  // Split by whitespace and punctuation while keeping delimiters
  return text.replace(/[\u0980-\u09FF]+/g, (match) => {
    return transliterateBengaliWord(match)
  }).replace(/।/g, '.')
}

// ==================== HINDI (DEVANAGARI) TRANSLITERATION ====================

const HINDI_INDEPENDENT_VOWELS: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au'
}

const HINDI_DEPENDENT_MATRAS: Record<string, string> = {
  'ा': 'a',
  'ि': 'i',
  'ी': 'ee',
  'ु': 'u',
  'ू': 'oo',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au'
}

const HINDI_CONSONANTS: Record<string, string> = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ng',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'n',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'f',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'ड़': 'r',
  'ढ़': 'rh',
  'फ़': 'f',
  'ज़': 'z',
  'क़': 'q',
  'ख़': 'kh',
  'ग़': 'gh',
  'ं': 'n',
  'ः': 'h',
  'ँ': 'n'
}

const HINDI_VIRAMA = '्'

// Common Hindi word overrides for colloquial Hinglish
const HINDI_WORD_OVERRIDES: Record<string, string> = {
  'मुझे': 'mujhe',
  'एक': 'ek',
  'दिन': 'din',
  'चीज़': 'cheez',
  'चीज': 'cheez',
  'मैं': 'main',
  'हम': 'hum',
  'आप': 'aap',
  'तुम': 'tum',
  'कैसे': 'kaise',
  'कैसी': 'kaisi',
  'कैसा': 'kaisa',
  'हो': 'ho',
  'हैं': 'hain',
  'है': 'hai',
  'था': 'tha',
  'थी': 'thi',
  'थे': 'the',
  'अच्छा': 'accha',
  'बहुत': 'bahut',
  'ठीक': 'theek',
  'धन्यवाद': 'dhanyawad',
  'नमस्ते': 'namaste',
  'क्या': 'kya',
  'क्यों': 'kyun',
  'हाँ': 'haan',
  'नहीं': 'nahi',
  'कल': 'kal',
  'आज': 'aaj',
  'काम': 'kaam',
  'बात': 'baat',
  'कर': 'kar',
  'रहा': 'raha',
  'रही': 'rahi',
  'रहे': 'rahe',
  'मिलते': 'milte',
  'समय': 'samay',
  'पानी': 'paani',
  'घर': 'ghar',
  'दोस्त': 'dost',
  'लोग': 'log',
  'किताब': 'kitaab',
  'कलम': 'kalam'
}

function transliterateHindiWord(word: string): string {
  const cleanWord = word.trim()
  if (HINDI_WORD_OVERRIDES[cleanWord]) {
    return HINDI_WORD_OVERRIDES[cleanWord]
  }

  let result = ''
  const len = cleanWord.length

  for (let i = 0; i < len; i++) {
    const char = cleanWord[i]
    const nextChar = i + 1 < len ? cleanWord[i + 1] : null

    // 1. Independent Vowels
    if (HINDI_INDEPENDENT_VOWELS[char]) {
      result += HINDI_INDEPENDENT_VOWELS[char]
      continue
    }

    // 2. Consonants
    if (HINDI_CONSONANTS[char]) {
      const romConsonant = HINDI_CONSONANTS[char]
      result += romConsonant

      // If next char is Virama (्), don't add inherent vowel
      if (nextChar === HINDI_VIRAMA) {
        i++
        continue
      }

      // If next char is a dependent matra
      if (nextChar && HINDI_DEPENDENT_MATRAS[nextChar]) {
        result += HINDI_DEPENDENT_MATRAS[nextChar]
        i++
        continue
      }

      // Schwa deletion rule in Hindi:
      // Final consonants drop 'a' (e.g. दिन -> din, एक -> ek, बात -> baat)
      // Non-final consonants add inherent 'a'
      const isEnd = i === len - 1
      if (!isEnd && nextChar && (HINDI_CONSONANTS[nextChar] || HINDI_INDEPENDENT_VOWELS[nextChar])) {
        // If followed by an end consonant, add 'a' (e.g. कर -> kar, कम -> kam)
        result += 'a'
      }
      continue
    }

    // 3. Standalone Matras
    if (HINDI_DEPENDENT_MATRAS[char]) {
      result += HINDI_DEPENDENT_MATRAS[char]
      continue
    }

    if (char === '।') {
      result += '.'
      continue
    }

    result += char
  }

  return result
}

export function transliterateHindiToRoman(text: string): string {
  if (!text) return ''

  return text.replace(/[\u0900-\u097F]+/g, (match) => {
    return transliterateHindiWord(match)
  }).replace(/।/g, '.')
}

/**
 * Universal transliterator for Indic scripts to Roman English text.
 */
export function transliterateIndicToRoman(text: string): string {
  if (!text) return ''
  let output = transliterateBengaliToRoman(text)
  output = transliterateHindiToRoman(output)
  return output
}
