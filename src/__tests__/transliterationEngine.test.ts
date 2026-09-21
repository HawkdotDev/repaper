import { describe, it, expect } from 'bun:test'
import {
  transliterateBengaliToRoman,
  transliterateHindiToRoman,
  transliterateIndicToRoman
} from '../utils/transliterationEngine'

describe('transliterationEngine', () => {
  describe('Bengali to Roman English', () => {
    it('transliterates the user example "আমাকে, একদিন, জিনিস" accurately', () => {
      const input = 'আমাকে, একদিন, জিনিস'
      const result = transliterateBengaliToRoman(input)
      expect(result).toBe('amake, ekdin, jinish')
    })

    it('transliterates common Bengali phrases', () => {
      expect(transliterateBengaliToRoman('আমি ভালো আছি')).toBe('ami bhalo achi')
      expect(transliterateBengaliToRoman('আপনি কেমন আছেন')).toBe('apni kemon achen')
      expect(transliterateBengaliToRoman('ধন্যবাদ')).toBe('dhonnobad')
    })

    it('converts Bengali danda । to period . in Romanized mode', () => {
      expect(transliterateBengaliToRoman('আমি ভালো আছি।')).toBe('ami bhalo achi.')
    })

    it('transliterates multi-consonant words accurately with inherent vowel', () => {
      expect(transliterateBengaliToRoman('কলম')).toBe('kolom')
      expect(transliterateBengaliToRoman('সময়')).toBe('somoy')
      expect(transliterateBengaliToRoman('নরম')).toBe('norom')
    })

    it('preserves embedded English words and punctuation in Bengali', () => {
      const input = 'আমি office যাব'
      expect(transliterateBengaliToRoman(input)).toBe('ami office jabo')
    })
  })

  describe('Hindi to Roman English', () => {
    it('transliterates Hindi words accurately into Hinglish', () => {
      expect(transliterateHindiToRoman('मुझे, एक दिन, चीज़')).toBe('mujhe, ek din, cheez')
      expect(transliterateHindiToRoman('आप कैसे हैं')).toBe('aap kaise hain')
      expect(transliterateHindiToRoman('बहुत अच्छा')).toBe('bahut accha')
    })

    it('converts Hindi danda । to period . in Romanized mode', () => {
      expect(transliterateHindiToRoman('नमस्ते।')).toBe('namaste.')
    })
  })

  describe('Universal transliterateIndicToRoman', () => {
    it('handles mixed Hindi, Bengali and English text', () => {
      const input = 'আমাকে ekdin mujhe'
      expect(transliterateIndicToRoman(input)).toBe('amake ekdin mujhe')
    })
  })
})
