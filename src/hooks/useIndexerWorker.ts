import { useEffect, useState, useCallback } from 'react'
import { DocumentStatsResult, HeadingItem } from '../workers/indexerWorker'
import { indexerWorkerService } from '../services/indexerWorkerService'

export function useIndexerWorker(activeFileContent?: string): {
  stats: DocumentStatsResult
  headings: HeadingItem[]
  extractGraphLinks: (
    files: Record<string, string>
  ) => Promise<{ source: string; target: string }[]>
  searchFiles: (filePaths: string[], query: string) => Promise<string[]>
} {
  const [stats, setStats] = useState<DocumentStatsResult>({
    lines: 1,
    words: 0,
    chars: 0,
    readingTimeMinutes: 1
  })

  const [headings, setHeadings] = useState<HeadingItem[]>([])

  useEffect(() => {
    const unsubStats = indexerWorkerService.onStats(setStats)
    const unsubHeadings = indexerWorkerService.onHeadings(setHeadings)

    return (): void => {
      unsubStats()
      unsubHeadings()
    }
  }, [])

  // Offload stats & heading parsing to worker thread whenever document content changes
  useEffect(() => {
    const content = activeFileContent || ''
    const timer = setTimeout(() => {
      indexerWorkerService.requestStatsAndHeadings(content)
    }, 60)

    return (): void => clearTimeout(timer)
  }, [activeFileContent])

  const extractGraphLinks = useCallback(
    (files: Record<string, string>): Promise<{ source: string; target: string }[]> => {
      return indexerWorkerService.extractGraphLinks(files)
    },
    []
  )

  const searchFiles = useCallback((filePaths: string[], query: string): Promise<string[]> => {
    return indexerWorkerService.searchFiles(filePaths, query)
  }, [])

  return {
    stats,
    headings,
    extractGraphLinks,
    searchFiles
  }
}
