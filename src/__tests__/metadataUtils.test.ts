import { describe, it, expect } from 'bun:test'
import {
  parseLocalMetadata,
  parseMarkdownMetadata,
  stripFrontmatter,
  serializeMarkdownMetadata
} from '../utils/metadataUtils'

describe('metadataUtils', () => {
  it('parses local YAML frontmatter fields correctly', () => {
    const content = `---
icon: 🚀
banner: https://example.com/banner.jpg
showCover: true
showIcon: false
---

# Content here`

    const meta = parseLocalMetadata(content)
    expect(meta).not.toBeNull()
    expect(meta?.icon).toBe('🚀')
    expect(meta?.banner).toBe('https://example.com/banner.jpg')
    expect(meta?.showCover).toBe(true)
    expect(meta?.showIcon).toBe(false)
  })

  it('strips YAML frontmatter leaving only body content', () => {
    const content = `---
icon: 📝
---

# Hello World`

    const stripped = stripFrontmatter(content)
    expect(stripped.trim()).toBe('# Hello World')
  })

  it('returns original content when no frontmatter is present', () => {
    const content = '# Hello World\nNo frontmatter here'
    expect(stripFrontmatter(content)).toBe(content)
  })

  it('parses full document with metadata and content separation', () => {
    const raw = `---
icon: 💡
banner: banner.png
---

## Section 1
Body text.`

    const doc = parseMarkdownMetadata(raw)
    expect(doc.metadata.icon).toBe('💡')
    expect(doc.metadata.banner).toBe('banner.png')
    expect(doc.content).toContain('## Section 1')
  })

  it('serializes metadata into valid YAML frontmatter block', () => {
    const content = 'Body text here.'
    const serialized = serializeMarkdownMetadata(content, {
      icon: '🗺️',
      showCover: true
    })
    expect(serialized).toContain('---')
    expect(serialized).toContain('icon: "🗺️"')
    expect(serialized).toContain('showCover: true')
    expect(serialized).toContain('Body text here.')
  })
})
