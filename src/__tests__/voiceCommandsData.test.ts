import { describe, it, expect } from 'bun:test'
import { VOICE_COMMANDS_DATA } from '../utils/voiceCommandsData'

describe('voiceCommandsData', () => {
  it('contains entries across all key categories', () => {
    expect(VOICE_COMMANDS_DATA.length).toBeGreaterThanOrEqual(18)

    const categories = new Set(VOICE_COMMANDS_DATA.map((c) => c.category))
    expect(categories.has('punctuation')).toBe(true)
    expect(categories.has('editing')).toBe(true)
    expect(categories.has('language')).toBe(true)
  })

  it('documents multilingual spoken phrases for punctuation', () => {
    const period = VOICE_COMMANDS_DATA.find((c) => c.id === 'p-period')
    expect(period).toBeDefined()
    expect(period?.englishPhrases).toContain('“period”')
    expect(period?.hindiPhrases).toContain('“पूर्ण विराम”')
    expect(period?.bengaliPhrases).toContain('“দাঁড়ি”')

    const comma = VOICE_COMMANDS_DATA.find((c) => c.id === 'p-comma')
    expect(comma).toBeDefined()
    expect(comma?.englishPhrases).toContain('“comma”')
    expect(comma?.hindiPhrases).toContain('“अल्प विराम”')
    expect(comma?.bengaliPhrases).toContain('“কমা”')

    const question = VOICE_COMMANDS_DATA.find((c) => c.id === 'p-question')
    expect(question).toBeDefined()
    expect(question?.englishPhrases).toContain('“question mark”')
    expect(question?.hindiPhrases).toContain('“प्रश्न चिन्ह”')
    expect(question?.bengaliPhrases).toContain('“জিজ্ঞাসা চিহ্ন”')
  })

  it('documents structural and editing commands (undo, new line, new paragraph)', () => {
    const scratch = VOICE_COMMANDS_DATA.find((c) => c.id === 'e-scratch-that')
    expect(scratch).toBeDefined()
    expect(scratch?.englishPhrases).toContain('“scratch that”')
    expect(scratch?.hindiPhrases).toContain('“रद्द करो”')
    expect(scratch?.bengaliPhrases).toContain('“মুছে ফেলো”')

    const newLine = VOICE_COMMANDS_DATA.find((c) => c.id === 'e-new-line')
    expect(newLine).toBeDefined()
    expect(newLine?.englishPhrases).toContain('“new line”')
    expect(newLine?.hindiPhrases).toContain('“नई लाइन”')
    expect(newLine?.bengaliPhrases).toContain('“নতুন লাইন”')
  })

  it('documents on-the-fly language and script switching commands', () => {
    const switchHi = VOICE_COMMANDS_DATA.find((c) => c.id === 'l-switch-hi')
    expect(switchHi).toBeDefined()
    expect(switchHi?.hindiPhrases).toContain('“हिंदी में”')

    const switchBn = VOICE_COMMANDS_DATA.find((c) => c.id === 'l-switch-bn')
    expect(switchBn).toBeDefined()
    expect(switchBn?.bengaliPhrases).toContain('“বাংলায়”')

    const romanScript = VOICE_COMMANDS_DATA.find((c) => c.id === 'l-script-roman')
    expect(romanScript).toBeDefined()
    expect(romanScript?.englishPhrases).toContain('“write in English”')
    expect(romanScript?.bengaliPhrases).toContain('“রোমান লিপি”')

    const nativeScript = VOICE_COMMANDS_DATA.find((c) => c.id === 'l-script-native')
    expect(nativeScript).toBeDefined()
    expect(nativeScript?.englishPhrases).toContain('“write in native”')
    expect(nativeScript?.bengaliPhrases).toContain('“বাংলা লিপি”')
  })
})
