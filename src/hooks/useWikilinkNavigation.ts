import { useCallback } from 'react'
import { normalizePath } from '../utils/pathUtils'

interface UseWikilinkNavigationProps {
  workspacePath: string | null
  handleFileSelect: (filePath: string) => Promise<void>
}

/**
 * Recursively search a directory tree for a file matching targetName by basename or exact name
 */
async function findFileRecursively(dirPath: string, targetName: string): Promise<string | null> {
  const cleanTarget = targetName.replace(/^\[\[|\]\]$/g, '').trim().toLowerCase()
  const targetBase = cleanTarget.endsWith('.md') ? cleanTarget.slice(0, -3) : cleanTarget

  try {
    const entries = await window.api.fs.readDirectory(dirPath)
    for (const entry of entries) {
      if (entry.isDir) {
        if (!entry.name.startsWith('.')) {
          const found = await findFileRecursively(entry.path, targetName)
          if (found) return found
        }
      } else {
        const entryName = entry.name.toLowerCase()
        const entryBase = entryName.endsWith('.md') ? entryName.slice(0, -3) : entryName
        if (entryName === cleanTarget || entryName === `${targetBase}.md` || entryBase === targetBase) {
          return entry.path
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return null
}

export function useWikilinkNavigation({
  workspacePath,
  handleFileSelect
}: UseWikilinkNavigationProps) {
  const handleWikilinkClick = useCallback(
    async (targetName: string): Promise<void> => {
      if (!workspacePath) return
      const cleanName = targetName.replace(/^\[\[|\]\]$/g, '').trim()
      const targetFileName = cleanName.endsWith('.md') ? cleanName : `${cleanName}.md`

      try {
        // 1. First check if directly resolvable from workspace path (or explicit relative path)
        const targetPath = `${workspacePath}/${targetFileName}`
        const normPath = normalizePath(targetPath)!

        let directExists = false
        if (typeof window.api.fs.exists === 'function') {
          directExists = await window.api.fs.exists(normPath)
        } else {
          try {
            await window.api.fs.readFile(normPath)
            directExists = true
          } catch {
            directExists = false
          }
        }

        if (directExists) {
          await handleFileSelect(normPath)
          return
        }

        // 2. Search recursively across all subdirectories in the workspace
        const nestedMatch = await findFileRecursively(workspacePath, cleanName)
        if (nestedMatch) {
          await handleFileSelect(nestedMatch)
          return
        }

        // 3. If file doesn't exist anywhere in workspace, prompt to create at workspace root
        const create = confirm(
          `File "${targetFileName}" does not exist in workspace. Would you like to create it?`
        )
        if (create) {
          const newPath = await window.api.fs.createFile(workspacePath, targetFileName)
          await handleFileSelect(newPath)
        }
      } catch (err) {
        console.error('Error navigating wikilink:', err)
      }
    },
    [workspacePath, handleFileSelect]
  )

  return { handleWikilinkClick }
}
