import { useCallback } from 'react'
import { markdownToHtml } from '../utils/markdownConverter'
import { stripFrontmatter } from '../utils/metadataUtils'
import { normalizePath } from '../utils/pathUtils'

interface UseDocumentExportProps {
  activeFilePath: string | null
  fileContents: Record<string, string>
  editorFontFamily: string
  editorFontSize: number
  workspacePath: string | null
  handleFileSelect: (filePath: string) => Promise<void>
  isLight?: boolean
}

export function useDocumentExport({
  activeFilePath,
  fileContents,
  editorFontFamily,
  editorFontSize,
  workspacePath,
  handleFileSelect,
  isLight = false
}: UseDocumentExportProps) {
  const handleExportHTML = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const htmlBody = markdownToHtml(rawContent)
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <style>
    :root {
      --bg: ${isLight ? '#ffffff' : '#18181b'};
      --fg: ${isLight ? '#18181b' : '#e4e4e7'};
      --border: ${isLight ? '#e4e4e7' : '#27272a'};
      --surface: ${isLight ? '#f4f4f5' : '#202023'};
      --link: ${isLight ? '#2563eb' : '#a78bfa'};
      --code-bg: ${isLight ? '#f4f4f5' : '#27272a'};
      --quote-fg: ${isLight ? '#52525b' : '#a1a1aa'};
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #ffffff;
        --fg: #18181b;
        --border: #e4e4e7;
        --surface: #f4f4f5;
        --link: #2563eb;
        --code-bg: #f4f4f5;
        --quote-fg: #52525b;
      }
    }
    body {
      font-family: ${editorFontFamily};
      font-size: ${editorFontSize}px;
      line-height: 1.65;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: var(--fg);
      background: var(--bg);
    }
    h1, h2, h3, h4, h5, h6 { color: var(--fg); font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 2.2em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    h2 { font-size: 1.6em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
    h3 { font-size: 1.3em; }
    h4 { font-size: 1.15em; }
    h5 { font-size: 1.0em; text-transform: uppercase; letter-spacing: 0.04em; }
    h6 { font-size: 0.88em; text-transform: uppercase; letter-spacing: 0.06em; }
    p { margin-bottom: 1em; }
    a { color: var(--link); text-decoration: underline; text-underline-offset: 3px; }
    code { background: var(--code-bg); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: var(--code-bg); border: 1px solid var(--border); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }
    blockquote { border-left: 3px solid var(--border); margin: 1em 0; padding: 0.5em 1em; color: var(--quote-fg); background: var(--surface); border-radius: 0 4px 4px 0; }
    ul, ol { padding-left: 2em; margin-bottom: 1em; }
    li { margin-bottom: 0.3em; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2em 0; }
    img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
    th { background: var(--surface); }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.html`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, fullHtml)
      }
    } catch (err) {
      alert(`Export HTML error: ${err}`)
    }
  }, [activeFilePath, fileContents, editorFontFamily, editorFontSize, isLight])

  const handleExportText = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    const plainText = stripFrontmatter(rawContent).replace(/[#*_`~[\]()]/g, '')
    try {
      const savePath = await window.api.fs.showSaveDialog(`${baseName}.txt`)
      if (savePath) {
        await window.api.fs.writeFile(savePath, plainText)
      }
    } catch (err) {
      alert(`Export Text error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleExportMarkdown = useCallback(async () => {
    if (!activeFilePath) return
    const rawContent = fileContents[activeFilePath] || ''
    const baseName = activeFilePath.split(/[\\/]/).pop() || 'document.md'
    try {
      const savePath = await window.api.fs.showSaveDialog(baseName)
      if (savePath) {
        await window.api.fs.writeFile(savePath, rawContent)
      }
    } catch (err) {
      alert(`Export Markdown error: ${err}`)
    }
  }, [activeFilePath, fileContents])

  const handleCopyLink = useCallback(() => {
    if (!activeFilePath) return
    const baseName = activeFilePath.split(/[\\/]/).pop()?.replace(/\.md$/, '') || 'document'
    navigator.clipboard.writeText(`[[${baseName}]]`)
  }, [activeFilePath])

  const handleImportFile = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.md,.markdown,.txt,.json'
      input.onchange = async (e: Event): Promise<void> => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const text = await file.text()
        const fileName = file.name
        if (workspacePath) {
          const newPath = normalizePath(`${workspacePath}/${fileName}`)
          await window.api.fs.writeFile(newPath, text)
          await handleFileSelect(newPath)
        }
      }
      input.click()
    } catch (err) {
      alert(`Import error: ${err}`)
    }
  }, [workspacePath, handleFileSelect])

  return {
    handleExportHTML,
    handleExportText,
    handleExportMarkdown,
    handleCopyLink,
    handleImportFile
  }
}
