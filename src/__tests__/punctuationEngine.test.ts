import { describe, it, expect } from 'bun:test'
import { formatSpokenText, shouldPrependSpace, detectLanguage } from '../utils/punctuationEngine'

describe('punctuationEngine', () => {
  it('replaces basic spoken punctuation marks', () => {
    const input = 'hello comma how are you question mark'
    const result = formatSpokenText(input)
    expect(result.text).toBe('Hello, how are you?')
  })

  it('handles period and full stop in English', () => {
    const input1 = 'this is a sentence period this is another full stop'
    const result1 = formatSpokenText(input1)
    expect(result1.text).toBe('This is a sentence. This is another.')
  })

  it('handles exclamation mark and exclamation point', () => {
    const input1 = 'wow exclamation point that is amazing exclamation mark'
    const result1 = formatSpokenText(input1)
    expect(result1.text).toBe('Wow! That is amazing!')
  })

  it('handles colon and semicolon', () => {
    const input = 'note colon item one semicolon item two period'
    const result = formatSpokenText(input)
    expect(result.text).toBe('Note: item one; item two.')
  })

  it('handles dash and ellipsis', () => {
    const input = 'wait dot dot dot it was him dash or was it question mark'
    const result = formatSpokenText(input)
    expect(result.text).toBe('Wait... It was him — or was it?')
  })

  it('handles quotes and parentheses', () => {
    const input = 'he said open quote hello close quote open paren quietly close paren'
    const result = formatSpokenText(input)
    expect(result.text).toBe('He said “hello” (quietly)')
  })

  it('auto-capitalizes the first word and standalone pronoun I', () => {
    const input = 'yesterday i went to the store and i think i will go again'
    const result = formatSpokenText(input)
    expect(result.text).toBe('Yesterday I went to the store and I think I will go again')
  })

  it('auto-capitalizes contractions of pronoun I', () => {
    const input = "i'm happy and i've seen it and i'll be there"
    const result = formatSpokenText(input)
    expect(result.text).toBe("I'm happy and I've seen it and I'll be there")
  })

  it('normalizes spaces before and after punctuation', () => {
    const input = 'hello , world . how are you ?'
    const result = formatSpokenText(input)
    expect(result.text).toBe('Hello, world. How are you?')
  })

  it('extracts structural commands for new line and new paragraph', () => {
    const input = 'first line new line second line new paragraph next paragraph content'
    const result = formatSpokenText(input)
    expect(result.commands.some((c) => c.type === 'new-line')).toBe(true)
    expect(result.commands.some((c) => c.type === 'new-paragraph')).toBe(true)
    expect(result.text).toContain('\n')
  })

  it('extracts editing command scratch that in English, Hindi, and Bengali', () => {
    expect(formatSpokenText('scratch that').commands.some((c) => c.type === 'scratch-that')).toBe(
      true
    )
    expect(formatSpokenText('रद्द करो').commands.some((c) => c.type === 'scratch-that')).toBe(true)
    expect(formatSpokenText('বাতিল করো').commands.some((c) => c.type === 'scratch-that')).toBe(true)
  })

  it('handles empty or whitespace-only inputs gracefully', () => {
    expect(formatSpokenText('').text).toBe('')
    expect(formatSpokenText('   ').text).toBe('')
  })

  describe('Hindi & Bengali Support', () => {
    it('handles Hindi verbal punctuation (पूर्णविराम, अल्पविराम, प्रश्न चिन्ह)', () => {
      const input = 'नमस्ते अल्प विराम आप कैसे हैं प्रश्न चिन्ह मैं ठीक हूँ पूर्ण विराम'
      const result = formatSpokenText(input, { language: 'hi-IN' })
      expect(result.text).toBe('नमस्ते, आप कैसे हैं? मैं ठीक हूँ।')
      expect(result.detectedLanguage).toBe('hi')
    })

    it('handles Bengali verbal punctuation (দাঁড়ি, কমা, জিজ্ঞাসা চিহ্ন)', () => {
      const input = 'নমস্কার কমা আপনি কেমন আছেন জিজ্ঞাসা চিহ্ন আমি ভালো আছি দাঁড়ি'
      const result = formatSpokenText(input, { language: 'bn-IN' })
      expect(result.text).toBe('নমস্কার, আপনি কেমন আছেন? আমি ভালো আছি।')
      expect(result.detectedLanguage).toBe('bn')
    })

    it('replaces English full stop with danda । in Hindi/Bengali context', () => {
      const hindiInput = 'यह एक अच्छी बात है full stop'
      const hindiResult = formatSpokenText(hindiInput, { language: 'hi-IN' })
      expect(hindiResult.text).toBe('यह एक अच्छी बात है।')

      const bengaliInput = 'এটি খুব ভালো full stop'
      const bengaliResult = formatSpokenText(bengaliInput, { language: 'bn-IN' })
      expect(bengaliResult.text).toBe('এটি খুব ভালো।')
    })

    it('extracts on-the-fly language switching commands', () => {
      const toHindi = formatSpokenText('switch to Hindi नमस्ते')
      expect(
        toHindi.commands.some((c) => c.type === 'switch-language' && c.language === 'hi-IN')
      ).toBe(true)
      expect(toHindi.text).toBe('नमस्ते')

      const toBengali = formatSpokenText('switch to Bengali আমি ভালো আছি')
      expect(
        toBengali.commands.some((c) => c.type === 'switch-language' && c.language === 'bn-IN')
      ).toBe(true)

      const toEnglish = formatSpokenText('switch to English hello world')
      expect(
        toEnglish.commands.some((c) => c.type === 'switch-language' && c.language === 'en-IN')
      ).toBe(true)
      expect(toEnglish.text).toBe('Hello world')
    })

    it('detects language correctly based on Unicode script', () => {
      expect(detectLanguage('Hello this is pure English')).toBe('en')
      expect(detectLanguage('नमस्ते भारत कैसे हो')).toBe('hi')
      expect(detectLanguage('আমি বাংলায় কথা বলছি')).toBe('bn')
    })

    it('handles scriptMode romanized vs native for Bengali and Hindi', () => {
      // User prompt exact example: "আমাকে, একদিন, জিনিস" -> "amake, ekdin, jinish"
      const bengaliRoman = formatSpokenText('আমাকে, একদিন, জিনিস', {
        language: 'bn-IN',
        scriptMode: 'romanized'
      })
      expect(bengaliRoman.text.toLowerCase()).toBe('amake, ekdin, jinish')

      // Bengali native script mode preserves native script
      const bengaliNative = formatSpokenText('আমাকে, একদিন, জিনিস', {
        language: 'bn-IN',
        scriptMode: 'native'
      })
      expect(bengaliNative.text).toBe('আমাকে, একদিন, জিনিস')

      // Hindi Romanized script mode
      const hindiRoman = formatSpokenText('मुझे, एक दिन', {
        language: 'hi-IN',
        scriptMode: 'romanized'
      })
      expect(hindiRoman.text.toLowerCase()).toBe('mujhe, ek din')

      // Hindi with spoken punctuation in romanized mode uses period '.' instead of danda '।'
      const hindiPuncRoman = formatSpokenText('मुझे एक दिन पूर्ण विराम', {
        language: 'hi-IN',
        scriptMode: 'romanized'
      })
      expect(hindiPuncRoman.text).toBe('Mujhe ek din.')

      // Bengali with spoken punctuation in romanized mode uses period '.'
      const bengaliPuncRoman = formatSpokenText('আমাকে একটি জিনিস দাও দাঁড়ি', {
        language: 'bn-IN',
        scriptMode: 'romanized'
      })
      expect(bengaliPuncRoman.text).toContain('.')
      expect(bengaliPuncRoman.text).not.toContain('।')
    })

    it('extracts on-the-fly script switching voice commands', () => {
      const toRoman = formatSpokenText('switch to roman script আমাকে বলো')
      expect(
        toRoman.commands.some((c) => c.type === 'switch-script' && c.scriptMode === 'romanized')
      ).toBe(true)

      const toNative = formatSpokenText('বাংলা লিপি আমাকে বলো')
      expect(
        toNative.commands.some((c) => c.type === 'switch-script' && c.scriptMode === 'native')
      ).toBe(true)
    })

    it('handles standalone punctuation phrases with clean symbols', () => {
      expect(formatSpokenText('full stop').text).toBe('.')
      expect(formatSpokenText('period').text).toBe('.')
      expect(formatSpokenText('comma').text).toBe(',')
      expect(formatSpokenText('question mark').text).toBe('?')
      expect(formatSpokenText('দাঁড়ি', { language: 'bn-IN' }).text).toBe('।')
      expect(formatSpokenText('দাড়ি', { language: 'bn-IN' }).text).toBe('।')
      expect(formatSpokenText('পূর্ণ বিরাম', { language: 'bn-IN' }).text).toBe('।')
      expect(formatSpokenText('पूर्ण विराम', { language: 'hi-IN' }).text).toBe('।')
    })
    it('handles extended verbal symbols (@, #, %, $, ₹, •, &)', () => {
      expect(formatSpokenText('contact me at sign oink').text).toBe('Contact me @oink')
      expect(formatSpokenText('tag hashtag notes').text).toBe('Tag #notes')
      expect(formatSpokenText('one hundred percent sign').text).toBe('One hundred%')
      expect(formatSpokenText('total fifty dollar sign').text).toBe('Total fifty $')
      expect(formatSpokenText('price five hundred rupees').text).toBe('Price five hundred ₹')
      expect(formatSpokenText('bullet point first item').text).toBe('• First item')
      expect(formatSpokenText('rock ampersand roll').text).toBe('Rock & roll')
    })

    it('extracts multilingual language switching commands for Spanish, French, German, Japanese', () => {
      const toEs = formatSpokenText('switch to Spanish hola mundo')
      expect(
        toEs.commands.some((c) => c.type === 'switch-language' && c.language === 'es-ES')
      ).toBe(true)

      const toFr = formatSpokenText('switch to French bonjour')
      expect(
        toFr.commands.some((c) => c.type === 'switch-language' && c.language === 'fr-FR')
      ).toBe(true)

      const toDe = formatSpokenText('switch to German guten tag')
      expect(
        toDe.commands.some((c) => c.type === 'switch-language' && c.language === 'de-DE')
      ).toBe(true)

      const toJa = formatSpokenText('switch to Japanese konnichiwa')
      expect(
        toJa.commands.some((c) => c.type === 'switch-language' && c.language === 'ja-JP')
      ).toBe(true)
    })
  })

  describe('Voice Command vs Literal Word Disambiguation', () => {
    it('shields verbal escape prefixes ("word", "literal", "as word", "raw")', () => {
      expect(formatSpokenText('word full stop').text).toBe('Full stop')
      expect(formatSpokenText('literal full stop').text).toBe('Full stop')
      expect(formatSpokenText('as word full stop').text).toBe('Full stop')
      expect(formatSpokenText('as words comma').text).toBe('Comma')
      expect(formatSpokenText('literally question mark').text).toBe('Question mark')
      expect(formatSpokenText('raw new line').text).toBe('New line')
    })

    it('disambiguates natural prepositional and idiomatic phrases containing "full stop"', () => {
      expect(formatSpokenText('the car came to a full stop').text).toBe('The car came to a full stop')
      expect(formatSpokenText('brought to a full stop').text).toBe('Brought to a full stop')
      expect(formatSpokenText('this thought ended without a full stop').text).toBe(
        'This thought ended without a full stop'
      )
      expect(formatSpokenText('at a full stop').text).toBe('At a full stop')
      expect(formatSpokenText('a complete full stop').text).toBe('A complete full stop')
    })

    it('disambiguates action, speech, and writing verbs with "full stop"', () => {
      expect(formatSpokenText('say full stop').text).toBe('Say full stop')
      expect(formatSpokenText('write full stop').text).toBe('Write full stop')
      expect(formatSpokenText('he wrote full stop in the notes').text).toBe(
        'He wrote full stop in the notes'
      )
      expect(formatSpokenText('put a full stop here').text).toBe('Put a full stop here')
    })

    it('handles explicit quotation escapes', () => {
      expect(formatSpokenText('quote full stop').text).toBe('“full stop”')
      expect(formatSpokenText('in quotes question mark').text).toBe('“question mark”')
    })

    it('extracts mode-switching commands (literal mode vs smart/command mode)', () => {
      const litRes = formatSpokenText('switch to literal mode please')
      expect(litRes.commands.some((c) => c.type === 'switch-mode' && c.dictationMode === 'literal')).toBe(true)

      const cmdRes = formatSpokenText('command mode')
      expect(cmdRes.commands.some((c) => c.type === 'switch-mode' && c.dictationMode === 'smart')).toBe(true)
    })

    it('extracts post-punctuation correction command "that was a word" / "as word"', () => {
      const wordRes1 = formatSpokenText('that was a word')
      expect(wordRes1.commands.some((c) => c.type === 'convert-to-word')).toBe(true)

      const wordRes2 = formatSpokenText('as word')
      expect(wordRes2.commands.some((c) => c.type === 'convert-to-word')).toBe(true)

      const wordRes3 = formatSpokenText('undo punctuation')
      expect(wordRes3.commands.some((c) => c.type === 'convert-to-word')).toBe(true)
    })

    it('tracks lastSubstitutions when spoken punctuation is applied', () => {
      const res = formatSpokenText('this is great full stop')
      expect(res.text).toBe('This is great.')
      expect(res.lastSubstitutions).toBeDefined()
      expect(res.lastSubstitutions?.some((s) => s.symbol === '.' && s.spokenPhrase === 'full stop')).toBe(true)
    })

    it('treats all words literally when autoPunctuateCommands is disabled (Literal Mode)', () => {
      const res = formatSpokenText('this is a sentence full stop and another comma here', {
        autoPunctuateCommands: false
      })
      expect(res.text).toBe('This is a sentence full stop and another comma here')
    })
  })

  describe('shouldPrependSpace', () => {
    it('returns true after standard word characters when next text is standard words', () => {
      expect(shouldPrependSpace('a')).toBe(true)
      expect(shouldPrependSpace('.')).toBe(true)
      expect(shouldPrependSpace('।')).toBe(true)
      expect(shouldPrependSpace('ह')).toBe(true)
      expect(shouldPrependSpace('আ')).toBe(true)
    })

    it('returns false after whitespace, newline, opening brackets, or prefix symbols (@, #, $, ₹)', () => {
      expect(shouldPrependSpace(' ')).toBe(false)
      expect(shouldPrependSpace('\n')).toBe(false)
      expect(shouldPrependSpace('(')).toBe(false)
      expect(shouldPrependSpace('[')).toBe(false)
      expect(shouldPrependSpace('@')).toBe(false)
      expect(shouldPrependSpace('#')).toBe(false)
      expect(shouldPrependSpace('$')).toBe(false)
      expect(shouldPrependSpace('₹')).toBe(false)
      expect(shouldPrependSpace(null)).toBe(false)
      expect(shouldPrependSpace(undefined)).toBe(false)
    })

    it('NEVER prepends space before incoming punctuation marks', () => {
      expect(shouldPrependSpace('a', '.')).toBe(false)
      expect(shouldPrependSpace('a', ',')).toBe(false)
      expect(shouldPrependSpace('a', '?')).toBe(false)
      expect(shouldPrependSpace('a', '!')).toBe(false)
      expect(shouldPrependSpace('a', '।')).toBe(false)
      expect(shouldPrependSpace('a', ':')).toBe(false)
      expect(shouldPrependSpace('a', ';')).toBe(false)
      expect(shouldPrependSpace('a', ')')).toBe(false)
      expect(shouldPrependSpace('a', '%')).toBe(false)
    })

    it('always returns true after full stop or other sentence punctuation when next text is a word', () => {
      expect(shouldPrependSpace('.', 'Always')).toBe(true)
      expect(shouldPrependSpace('.', 'next')).toBe(true)
      expect(shouldPrependSpace('?', 'Why')).toBe(true)
      expect(shouldPrependSpace('!', 'Awesome')).toBe(true)
      expect(shouldPrependSpace('।', 'পরবর্তী')).toBe(true)
      expect(shouldPrependSpace(',', 'then')).toBe(true)
    })

    it('always returns true after a word character when the user takes a pause before speaking the next word', () => {
      expect(shouldPrependSpace('d', 'world')).toBe(true)
      expect(shouldPrependSpace('e', 'example')).toBe(true)
      expect(shouldPrependSpace('1', 'second')).toBe(true)
    })
  })
})
