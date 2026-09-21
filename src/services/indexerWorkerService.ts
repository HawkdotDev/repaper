import {
  DocumentStatsResult,
  HeadingItem,
  WorkerResultPayload,
  WorkerTaskPayload
} from '../workers/indexerWorker'

class IndexerWorkerService {
  private worker: Worker | null = null
  private pendingPromises = new Map<string, (result: unknown) => void>()
  private statsListeners = new Set<(stats: DocumentStatsResult) => void>()
  private headingsListeners = new Set<(headings: HeadingItem[]) => void>()

  constructor() {
    this.initWorker()
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return
    }

    try {
      this.worker = new Worker(new URL('../workers/indexerWorker.ts', import.meta.url), {
        type: 'module'
      })

      this.worker.onmessage = (event: MessageEvent<WorkerResultPayload>): void => {
        const { id, type, result } = event.data

        if (type === 'CALCULATE_STATS') {
          const stats = result as DocumentStatsResult
          this.statsListeners.forEach((fn) => {
            try {
              fn(stats)
            } catch {
              // ignore
            }
          })
        } else if (type === 'PARSE_HEADINGS') {
          const headings = result as HeadingItem[]
          this.headingsListeners.forEach((fn) => {
            try {
              fn(headings)
            } catch {
              // ignore
            }
          })
        }

        const resolve = this.pendingPromises.get(id)
        if (resolve) {
          resolve(result)
          this.pendingPromises.delete(id)
        }
      }

      this.worker.onerror = (err): void => {
        console.warn('[IndexerWorkerService] Worker error:', err)
      }
    } catch (err) {
      console.warn('[IndexerWorkerService] Failed to initialize worker:', err)
      this.worker = null
    }
  }

  public onStats(callback: (stats: DocumentStatsResult) => void): () => void {
    this.statsListeners.add(callback)
    return () => {
      this.statsListeners.delete(callback)
    }
  }

  public onHeadings(callback: (headings: HeadingItem[]) => void): () => void {
    this.headingsListeners.add(callback)
    return () => {
      this.headingsListeners.delete(callback)
    }
  }

  public postTask<T>(type: WorkerTaskPayload['type'], payload: Omit<WorkerTaskPayload, 'id' | 'type'>): Promise<T> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve(null as unknown as T)
        return
      }

      const id = `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      this.pendingPromises.set(id, (res) => resolve(res as T))

      this.worker.postMessage({
        id,
        type,
        ...payload
      })
    })
  }

  public requestStatsAndHeadings(content: string): void {
    if (!this.worker) return

    const statsId = `stats_${Date.now()}`
    this.worker.postMessage({
      id: statsId,
      type: 'CALCULATE_STATS',
      content
    })

    const headingsId = `headings_${Date.now()}`
    this.worker.postMessage({
      id: headingsId,
      type: 'PARSE_HEADINGS',
      content
    })
  }

  public extractGraphLinks(files: Record<string, string>): Promise<{ source: string; target: string }[]> {
    return this.postTask<{ source: string; target: string }[]>('EXTRACT_GRAPH_LINKS', { files }).then(
      (res) => res || []
    )
  }

  public searchFiles(filePaths: string[], query: string): Promise<string[]> {
    return this.postTask<string[]>('FUZZY_SEARCH', { filePaths, query }).then((res) => res || [])
  }
}

export const indexerWorkerService = new IndexerWorkerService()
