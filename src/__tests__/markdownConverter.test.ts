import { describe, it, expect } from 'bun:test'
import {
  parseMarkdownToBlocks,
  serializeBlocksToMarkdown,
  markdownToHtml
} from '../utils/markdownConverter'

describe('markdownConverter', () => {
  it('parses headings H1 through H6 correctly', () => {
    const md = `# Heading 1\n## Heading 2\n### Heading 3\n#### Heading 4\n##### Heading 5\n###### Heading 6`
    const blocks = parseMarkdownToBlocks(md)

    expect(blocks.length).toBe(6)
    expect(blocks[0].type).toBe('heading1')
    expect(blocks[0].data.level).toBe(1)
    expect(blocks[0].data.text).toBe('Heading 1')

    expect(blocks[1].type).toBe('heading2')
    expect(blocks[1].data.level).toBe(2)
    expect(blocks[2].type).toBe('heading3')
    expect(blocks[2].data.level).toBe(3)
    expect(blocks[3].type).toBe('heading4')
    expect(blocks[3].data.level).toBe(4)
    expect(blocks[4].type).toBe('heading5')
    expect(blocks[4].data.level).toBe(5)
    expect(blocks[5].type).toBe('heading6')
    expect(blocks[5].data.level).toBe(6)
    expect(blocks[5].data.text).toBe('Heading 6')
  })

  it('serializes headings H1 through H6 to markdown correctly', () => {
    const blocks = [
      { type: 'header', data: { text: 'Title', level: 1 } },
      { type: 'header', data: { text: 'Subtitle', level: 2 } },
      { type: 'header', data: { text: 'Section', level: 3 } },
      { type: 'header', data: { text: 'Sub-section', level: 4 } },
      { type: 'header', data: { text: 'Deep Section', level: 5 } },
      { type: 'header', data: { text: 'Deepest Section', level: 6 } }
    ]

    const md = serializeBlocksToMarkdown(blocks)
    expect(md).toContain('# Title')
    expect(md).toContain('## Subtitle')
    expect(md).toContain('### Section')
    expect(md).toContain('#### Sub-section')
    expect(md).toContain('##### Deep Section')
    expect(md).toContain('###### Deepest Section')
  })

  it('parses and serializes markdown links [text](url)', () => {
    const md = `Check out [Google](https://google.com) for searching.`
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks[0].data.text).toContain('href="https://google.com"')
    expect(blocks[0].data.text).toContain('Google</a>')

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('[Google](https://google.com)')
  })

  it('parses and serializes multi-line blockquotes', () => {
    const md = `> Line 1 of quote\n> Line 2 of quote`
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('quote')
    expect(blocks[0].data.text).toContain('Line 1 of quote')
    expect(blocks[0].data.text).toContain('Line 2 of quote')

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('> Line 1 of quote')
  })

  it('parses and serializes checklists with completed state', () => {
    const md = `- [ ] Incomplete item\n- [x] Completed item`
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('checklist')
    expect(blocks[0].data.items?.length).toBe(2)

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('- [ ] Incomplete item')
    expect(serialized).toContain('- [x] Completed item')
  })

  it('parses and serializes markdown tables', () => {
    const md = `| Col A | Col B |\n| --- | --- |\n| Cell 1 | Cell 2 |`
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('table')
    expect(blocks[0].data.content?.length).toBe(2)

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('| Col A | Col B |')
    expect(serialized).toContain('| Cell 1 | Cell 2 |')
  })

  it('parses code blocks with languages', () => {
    const md = '```typescript\nconst x: number = 42;\n```'
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('code')
    expect(blocks[0].data.code).toBe('const x: number = 42;')

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('```typescript\nconst x: number = 42;\n```')
  })

  it('parses and serializes LaTeX math blocks', () => {
    const md = '$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$'
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('math')
    expect(blocks[0].data.math).toBe('\\int_0^1 x^2 dx = \\frac{1}{3}')

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('$$\n\\int_0^1 x^2 dx = \\frac{1}{3}\n$$')
  })

  it('parses and serializes Mermaid diagram blocks', () => {
    const md = '```mermaid\ngraph TD;\n  A --> B;\n```'
    const blocks = parseMarkdownToBlocks(md)
    expect(blocks.length).toBe(1)
    expect(blocks[0].type).toBe('mermaid')
    expect(blocks[0].data.code).toBe('graph TD;\n  A --> B;')

    const serialized = serializeBlocksToMarkdown(blocks)
    expect(serialized).toContain('```mermaid\ngraph TD;\n  A --> B;\n```')
  })

  it('sanitizes malicious HTML via markdownToHtml', () => {
    const malicious = `Normal text <script>alert("hack")</script> <img src="x" onerror="alert(1)" />`
    const html = markdownToHtml(malicious)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onerror')
  })
})
