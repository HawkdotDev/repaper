import DOMPurify from 'dompurify'

// Helper to parse Wikilinks [[Target]] or [[Target|Label]] to HTML anchors

export function parseWikilinksToHTML(text: string): string {
  if (!text) return ''
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, path, label) => {
    const targetPath = path.trim()
    const targetLabel = label ? label.trim() : targetPath
    return `<a class="wikilink" data-path="${targetPath}">${targetLabel}</a>`
  })
}

// Helper to convert HTML anchors back to Wikilinks
export function convertHTMLToWikilinks(html: string): string {
  if (!html) return ''
  let processed = html.replace(
    /<a\s+[^>]*class=["']wikilink["'][^>]*data-path=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi,
    (_, path, label) => {
      const cleanPath = path.trim()
      const cleanLabel = label.trim()
      return cleanPath === cleanLabel ? `[[${cleanPath}]]` : `[[${cleanPath}|${cleanLabel}]]`
    }
  )
  processed = processed.replace(
    /<a\s+[^>]*data-path=["']([^"']+)["'][^>]*class=["']wikilink["'][^>]*>(.*?)<\/a>/gi,
    (_, path, label) => {
      const cleanPath = path.trim()
      const cleanLabel = label.trim()
      return cleanPath === cleanLabel ? `[[${cleanPath}]]` : `[[${cleanPath}|${cleanLabel}]]`
    }
  )
  return processed
}

/**
 * Robust markdownToHtml converter for WYSIWYG rich text rendering
 */
export function markdownToHtml(text: string): string {
  if (!text) return ''

  let processed = text

  // 1. Convert bold **text** or __text__ -> <b>text</b>
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
  processed = processed.replace(/__(.*?)__/g, '<b>$1</b>')

  // 2. Convert italic *text* or _text_ -> <i>text</i>
  processed = processed.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<i>$2</i>')
  processed = processed.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1<i>$2</i>')

  // 3. Convert strikethrough ~~text~~ -> <s>text</s>
  processed = processed.replace(/~~(.*?)~~/g, '<s>$1</s>')

  // 4. Convert underline <u>text</u> or <ins>text</ins>
  processed = processed.replace(/<ins[^>]*>(.*?)<\/ins>/gi, '<u>$1</u>')

  // 5. Convert inline code `text` -> <code class="inline-code">text</code>
  processed = processed.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // 6. Convert standard markdown links [text](url) (excluding image links ![alt](url))
  processed = processed.replace(
    /(^|[^!])\[([^\]]+)\]\(([^)]+)\)/g,
    '$1<a href="$3" target="_blank" rel="noopener noreferrer">$2</a>'
  )

  // 7. Convert Wikilinks [[Target|Label]] or [[Target]]
  processed = parseWikilinksToHTML(processed)

  if (typeof window !== 'undefined' && DOMPurify && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(processed, {
      ADD_ATTR: ['data-path', 'target', 'rel', 'controls', 'allowfullscreen'],
      ADD_TAGS: ['iframe', 'video', 's', 'u']
    })
  }

  // Fallback sanitizer for non-browser/SSR/test environments
  return processed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')

  return processed
}


/**
 * Robust htmlToMarkdown converter for saving document blocks
 */
export function htmlToMarkdown(htmlText: string): string {
  if (!htmlText) return ''

  let text = htmlText

  // 1. Convert wikilinks back to [[path|label]]
  text = convertHTMLToWikilinks(text)

  // 2. Convert standard hyperlinks back to [text](url)
  text = text.replace(
    /<a\s+(?:[^>]*?)href=["']([^"']+)["'](?:[^>]*?)>(.*?)<\/a>/gi,
    (_, href, label) => {
      return `[${label.trim()}](${href.trim()})`
    }
  )

  // 3. Convert <b> and <strong> -> **text**
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')

  // 4. Convert <i> and <em> -> *text*
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

  // 5. Convert <s> and <strike> and <del> -> ~~text~~
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
  text = text.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')

  // 6. Convert <u> and <ins> -> <u>text</u>
  text = text.replace(/<ins[^>]*>(.*?)<\/ins>/gi, '<u>$1</u>')

  // 7. Convert <code> -> `text`
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

  // 8. Convert <br> -> \n
  text = text.replace(/<br\s*\/?>/gi, '\n')

  return text
}

export interface MarkdownBlockData {
  type:
    | 'header'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'heading5'
    | 'heading6'
    | 'paragraph'
    | 'list'
    | 'checklist'
    | 'quote'
    | 'code'
    | 'delimiter'
    | 'image'
    | 'video'
    | 'embed'
    | 'table'
    | 'math'
    | 'mermaid'
  data: {
    text?: string
    code?: string
    language?: string
    level?: number
    style?: 'unordered' | 'ordered'
    items?: string[] | { text: string; checked: boolean }[]
    file?: { url?: string }
    url?: string
    source?: string
    embed?: string
    service?: string
    caption?: string
    withHeadings?: boolean
    content?: string[][]
    math?: string
  }
}

/**
 * Line-by-line Markdown Document Parser for Editor.js blocks
 */
export function parseMarkdownToBlocks(text: string): MarkdownBlockData[] {
  const textWithoutFrontmatter = text
    ? text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').trimStart()
    : ''

  if (!textWithoutFrontmatter || !textWithoutFrontmatter.trim()) {
    return [{ type: 'paragraph', data: { text: '' } }]
  }

  const lines = textWithoutFrontmatter.split(/\r?\n/)
  const blocks: MarkdownBlockData[] = []

  let currentList: { style: 'unordered' | 'ordered'; items: string[] } | null = null
  let currentChecklist: { items: { text: string; checked: boolean }[] } | null = null
  let currentParagraphLines: string[] = []
  let currentQuoteLines: string[] = []
  let currentTableLines: string[] = []
  let inCodeBlock = false
  let currentCodeLines: string[] = []
  let currentCodeLang = ''

  const flushParagraph = (): void => {
    if (currentParagraphLines.length > 0) {
      const fullText = currentParagraphLines.join('<br>')
      blocks.push({
        type: 'paragraph',
        data: { text: markdownToHtml(fullText) }
      })
      currentParagraphLines = []
    }
  }

  const flushList = (): void => {
    if (currentList) {
      blocks.push({
        type: 'list',
        data: {
          style: currentList.style,
          items: currentList.items.map((item) => markdownToHtml(item))
        }
      })
      currentList = null
    }
  }

  const flushChecklist = (): void => {
    if (currentChecklist && currentChecklist.items.length > 0) {
      blocks.push({
        type: 'checklist',
        data: {
          items: currentChecklist.items
        }
      })
      currentChecklist = null
    }
  }

  const flushQuote = (): void => {
    if (currentQuoteLines.length > 0) {
      blocks.push({
        type: 'quote',
        data: { text: markdownToHtml(currentQuoteLines.join('<br>')) }
      })
      currentQuoteLines = []
    }
  }

  const flushTable = (): void => {
    if (currentTableLines.length >= 2) {
      const rows: string[][] = []
      for (const line of currentTableLines) {
        // Skip separator rows like |---|---|
        if (/^\s*\|?\s*[-:]+[-| :]*\|\s*$/.test(line)) {
          continue
        }
        const cells = line
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => markdownToHtml(c.trim()))
        rows.push(cells)
      }
      if (rows.length > 0) {
        blocks.push({
          type: 'table',
          data: {
            withHeadings: true,
            content: rows
          }
        })
      }
    } else if (currentTableLines.length === 1) {
      currentParagraphLines.push(currentTableLines[0])
    }
    currentTableLines = []
  }

  const flushAll = (): void => {
    flushParagraph()
    flushList()
    flushChecklist()
    flushQuote()
    flushTable()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Handle fenced code block content
    if (inCodeBlock) {
      if (trimmed.startsWith('```')) {
        if (currentCodeLang.toLowerCase() === 'mermaid') {
          blocks.push({
            type: 'mermaid',
            data: {
              code: currentCodeLines.join('\n')
            }
          })
        } else {
          blocks.push({
            type: 'code',
            data: {
              code: currentCodeLines.join('\n'),
              language: currentCodeLang
            }
          })
        }
        currentCodeLines = []
        currentCodeLang = ''
        inCodeBlock = false
        continue
      }
      currentCodeLines.push(line)
      continue
    }

    // Start of fenced code block (```lang)
    if (trimmed.startsWith('```')) {
      flushAll()
      inCodeBlock = true
      currentCodeLang = trimmed.slice(3).trim()
      currentCodeLines = []
      continue
    }

    // Math display block ($$...$$)
    if (trimmed.startsWith('$$')) {
      flushAll()
      if (trimmed === '$$') {
        const mathLines: string[] = []
        let j = i + 1
        while (j < lines.length && lines[j].trim() !== '$$') {
          mathLines.push(lines[j])
          j++
        }
        blocks.push({
          type: 'math',
          data: { math: mathLines.join('\n') }
        })
        i = j
        continue
      } else if (trimmed.endsWith('$$') && trimmed.length > 4) {
        const mathContent = trimmed.slice(2, -2).trim()
        blocks.push({
          type: 'math',
          data: { math: mathContent }
        })
        continue
      }
    }

    // Markdown Table rows (| col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      flushParagraph()
      flushList()
      flushChecklist()
      flushQuote()
      currentTableLines.push(trimmed)
      continue
    } else if (currentTableLines.length > 0) {
      flushTable()
    }

    // Empty lines
    if (!trimmed) {
      flushAll()
      continue
    }

    // Checklist item (- [ ] or - [x] or * [ ] or * [x])
    const checklistMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (checklistMatch) {
      flushParagraph()
      flushList()
      flushQuote()
      if (!currentChecklist) {
        currentChecklist = { items: [] }
      }
      const isChecked = checklistMatch[1].toLowerCase() === 'x'
      currentChecklist.items.push({
        text: markdownToHtml(checklistMatch[2]),
        checked: isChecked
      })
      continue
    }

    // Image (![alt](url))
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      flushAll()
      blocks.push({
        type: 'image',
        data: { file: { url: imgMatch[2] }, caption: imgMatch[1] }
      })
      continue
    }

    // Video tag
    const videoMatch = trimmed.match(/<video[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (videoMatch) {
      flushAll()
      blocks.push({
        type: 'video',
        data: { url: videoMatch[1] }
      })
      continue
    }

    // Embed / Iframe
    const iframeMatch = trimmed.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (iframeMatch) {
      flushAll()
      blocks.push({
        type: 'embed',
        data: { embed: iframeMatch[1], source: iframeMatch[1] }
      })
      continue
    }

    // Headings H1 through H6
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushAll()
      const level = headingMatch[1].length
      const headingText = markdownToHtml(headingMatch[2])
      const typeKey = `heading${level}` as MarkdownBlockData['type']
      blocks.push({
        type: typeKey,
        data: { text: headingText, level }
      })
      continue
    }

    // Delimiter
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushAll()
      blocks.push({ type: 'delimiter', data: {} })
      continue
    }

    // Multi-line Quote (consecutive > lines)
    if (trimmed.startsWith('>')) {
      flushParagraph()
      flushList()
      flushChecklist()
      const quoteText = trimmed.replace(/^>\s?/, '')
      currentQuoteLines.push(quoteText)
      continue
    } else if (currentQuoteLines.length > 0) {
      flushQuote()
    }

    // Unordered List item (- or *) with indentation support
    const unorderedMatch = line.match(/^(\s*)([-*])\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      flushChecklist()
      flushQuote()
      if (!currentList || currentList.style !== 'unordered') {
        flushList()
        currentList = { style: 'unordered', items: [] }
      }
      currentList.items.push(unorderedMatch[3])
      continue
    }

    // Ordered List item (1. 2. 3.)
    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      flushChecklist()
      flushQuote()
      if (!currentList || currentList.style !== 'ordered') {
        flushList()
        currentList = { style: 'ordered', items: [] }
      }
      currentList.items.push(orderedMatch[2])
      continue
    }

    // Regular paragraph line
    flushList()
    flushChecklist()
    flushQuote()
    currentParagraphLines.push(line)
  }

  // Handle trailing unclosed code block if any
  if (inCodeBlock && currentCodeLines.length > 0) {
    blocks.push({
      type: 'code',
      data: {
        code: currentCodeLines.join('\n'),
        language: currentCodeLang
      }
    })
  }

  flushAll()

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', data: { text: '' } })
  }

  return blocks
}

/**
 * Serializes an array of Editor.js blocks back into a full Markdown document
 */
export function serializeBlocksToMarkdown(
  blocks: Array<{
    type: string
    data: {
      text?: string
      level?: number
      code?: string
      language?: string
      items?: Array<string | { text?: string; checked?: boolean }>
      style?: string
      caption?: string
      file?: { url?: string }
      url?: string
      embed?: string
      source?: string
      content?: string[][]
      math?: string
    }
  }>
): string {
  if (!blocks || !Array.isArray(blocks)) return ''

  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading1':
          return `# ${htmlToMarkdown(b.data.text || '')}`
        case 'heading2':
          return `## ${htmlToMarkdown(b.data.text || '')}`
        case 'heading3':
          return `### ${htmlToMarkdown(b.data.text || '')}`
        case 'heading4':
          return `#### ${htmlToMarkdown(b.data.text || '')}`
        case 'heading5':
          return `##### ${htmlToMarkdown(b.data.text || '')}`
        case 'heading6':
          return `###### ${htmlToMarkdown(b.data.text || '')}`
        case 'header': {
          const level = Math.min(6, Math.max(1, b.data.level || 2))
          const hashes = '#'.repeat(level)
          return `${hashes} ${htmlToMarkdown(b.data.text || '')}`
        }
        case 'code': {
          const codeText = b.data.code || b.data.text || ''
          const lang = b.data.language || ''
          return `\`\`\`${lang}\n${codeText}\n\`\`\``
        }
        case 'list': {
          const items = b.data.items || []
          const isOrdered = b.data.style === 'ordered'
          return items
            .map((item, idx) => {
              const itemText = typeof item === 'string' ? item : item?.text || ''
              return isOrdered
                ? `${idx + 1}. ${htmlToMarkdown(itemText)}`
                : `- ${htmlToMarkdown(itemText)}`
            })
            .join('\n')
        }
        case 'checklist': {
          const items = b.data.items || []
          return items
            .map((item) => {
              const isChecked = typeof item === 'object' && item !== null ? Boolean(item.checked) : false
              const text = typeof item === 'object' && item !== null ? item.text || '' : String(item)
              return `- [${isChecked ? 'x' : ' '}] ${htmlToMarkdown(text)}`
            })
            .join('\n')
        }
        case 'quote': {
          const text = b.data.text || ''
          const lines = text.replace(/<br\s*\/?>/gi, '\n').split('\n')
          return lines.map((line) => `> ${htmlToMarkdown(line)}`).join('\n')
        }
        case 'table': {
          const content = b.data.content || []
          if (!content.length) return ''
          const header = content[0]
          const rows = content.slice(1)
          const headerLine = `| ${header.map((c) => htmlToMarkdown(c)).join(' | ')} |`
          const sepLine = `| ${header.map(() => '---').join(' | ')} |`
          const rowLines = rows.map(
            (r) => `| ${r.map((c) => htmlToMarkdown(c)).join(' | ')} |`
          )
          return [headerLine, sepLine, ...rowLines].join('\n')
        }
        case 'image': {
          const url = b.data.file?.url || b.data.url || ''
          const caption = b.data.caption || ''
          return `![${caption}](${url})`
        }
        case 'video': {
          const url = b.data.url || ''
          return `<video src="${url}" controls></video>`
        }
        case 'embed': {
          const url = b.data.embed || b.data.source || ''
          return `<iframe src="${url}" allowfullscreen></iframe>`
        }
        case 'math': {
          const formula = b.data.math || ''
          return `$$\n${formula}\n$$`
        }
        case 'mermaid': {
          const code = b.data.code || ''
          return `\`\`\`mermaid\n${code}\n\`\`\``
        }
        case 'delimiter': {
          return '---'
        }
        case 'paragraph':
        default: {
          const cleanText = b.data.text ? b.data.text.replace(/<br\s*\/?>/gi, '\n') : ''
          return htmlToMarkdown(cleanText)
        }
      }
    })
    .join('\n\n')
}
