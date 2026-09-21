import JSZip from 'jszip'
import { normalizePath } from './pathUtils'

export interface CollectedFile {
  relativePath: string
  content: string
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'notes'
  )
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/**
 * Recursively collects all markdown and text files within a directory using window.api.fs
 */
export async function collectWorkspaceFiles(
  dirPath: string,
  rootPath: string
): Promise<CollectedFile[]> {
  const normalizedRoot = normalizePath(rootPath) || ''
  const normalizedDir = normalizePath(dirPath) || ''

  try {
    const entries = await window.api.fs.readDirectory(normalizedDir)
    const results: CollectedFile[] = []

    for (const entry of entries) {
      if (!entry || !entry.name) continue
      // Exclude hidden files / system config directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

      const entryPath = normalizePath(entry.path)

      if (entry.isDir) {
        const subFiles = await collectWorkspaceFiles(entryPath, normalizedRoot)
        results.push(...subFiles)
      } else {
        try {
          const content = await window.api.fs.readFile(entryPath)
          let rel = entryPath
          if (rel.toLowerCase().startsWith(normalizedRoot.toLowerCase())) {
            rel = rel.slice(normalizedRoot.length).replace(/^[/\\]+/, '')
          } else {
            rel = entry.name
          }
          results.push({ relativePath: rel, content })
        } catch (err) {
          console.warn('Failed to read file for export:', entryPath, err)
        }
      }
    }
    return results
  } catch (err) {
    console.error('Failed to read directory during export:', normalizedDir, err)
    return []
  }
}

/**
 * Exports all markdown documents in the workspace as a single .zip file
 */
export async function exportWorkspaceAsZip(
  workspacePath: string | null,
  workspaceName = 'workspace'
): Promise<boolean> {
  const targetPath = workspacePath || '/workspace'
  try {
    const files = await collectWorkspaceFiles(targetPath, targetPath)
    const zip = new JSZip()

    if (files.length === 0) {
      zip.file(
        'Welcome.md',
        '# My Notes\n\nExported from Repaper.\nStart writing in your browser and export anytime!\n'
      )
    } else {
      for (const file of files) {
        zip.file(file.relativePath, file.content)
      }
    }

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const cleanName = sanitizeFilename(workspaceName)
    triggerBlobDownload(blob, `${cleanName}-notes.zip`)
    return true
  } catch (err) {
    console.error('Error generating workspace zip export:', err)
    return false
  }
}

/**
 * Exports workspace documents and structure as a JSON backup
 */
export async function exportWorkspaceBackup(
  workspacePath: string | null,
  workspaceName = 'workspace'
): Promise<boolean> {
  const targetPath = workspacePath || '/workspace'
  try {
    const files = await collectWorkspaceFiles(targetPath, targetPath)
    const backupData = {
      app: 'Repaper',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaceName,
      totalNotes: files.length,
      notes: files.map((f) => ({
        path: f.relativePath,
        content: f.content
      }))
    }

    const jsonBlob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8'
    })

    const cleanName = sanitizeFilename(workspaceName)
    triggerBlobDownload(jsonBlob, `${cleanName}-backup.json`)
    return true
  } catch (err) {
    console.error('Error exporting workspace backup json:', err)
    return false
  }
}
