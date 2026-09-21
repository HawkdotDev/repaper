import { FileNode, FileSystemAPI } from '../types/api'
import { normalizePath } from '../utils/pathUtils'
import { storageService, STORAGE_KEYS } from './storageService'
import { UserSettings } from '../components/settings/types'

interface StoredFile {
  path: string
  name: string
  isDir: boolean
  parentPath: string
  content: string
  updatedAt: number
}

const DB_NAME = 'oink_storage'
const DB_VERSION = 1
const STORE_FILES = 'files'

class WebFileSystemService implements FileSystemAPI {
  private dbPromise: Promise<IDBDatabase> | null = null
  private changeListeners: Set<
    (data: {
      eventType: string
      filename: string
      absolutePath: string
      parentPath: string
    }) => void
  > = new Set()
  private activeDirHandle: FileSystemDirectoryHandle | null = null
  private initialized = false

  public getActiveDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.activeDirHandle
  }

  public isLocalDirectory(): boolean {
    return this.activeDirHandle !== null
  }

  public setBrowserMode(): void {
    this.activeDirHandle = null
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(STORE_FILES)) {
            const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'path' })
            fileStore.createIndex('parentPath', 'parentPath', { unique: false })
            fileStore.createIndex('isDir', 'isDir', { unique: false })
          }
        }

        request.onsuccess = () => {
          resolve(request.result)
        }

        request.onerror = () => {
          reject(request.error)
        }
      })
    }
    return this.dbPromise
  }

  public async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    const db = await this.getDB()
    const count = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readonly')
      const req = tx.objectStore(STORE_FILES).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(0)
    })

    if (count === 0) {
      await this.seedDefaultWorkspace()
    } else {
      await this.cleanLegacyMockFiles()
    }
  }

  private async cleanLegacyMockFiles(): Promise<void> {
    const hasLegacy = await this.getRawFile('/workspace/Product-Roadmap.md')
    if (!hasLegacy) return

    const legacyPaths = [
      '/workspace/Welcome to Oink.md',
      '/workspace/Welcome to Repaper.md',
      '/workspace/Product-Roadmap.md',
      '/workspace/Tech-Architecture.md',
      '/workspace/Design-System.md',
      '/workspace/General Knowledge/Documents/RFC-001.md',
      '/workspace/General Knowledge/Documents',
      '/workspace/General Knowledge/Integrations/Slack-Webhook.md',
      '/workspace/General Knowledge/Integrations/Github-Actions.md',
      '/workspace/General Knowledge/Integrations',
      '/workspace/General Knowledge/Onboarding-Guide.md',
      '/workspace/General Knowledge/Company-Handbook.md',
      '/workspace/General Knowledge',
      '/workspace/Team Interviews/Candidate-Evaluation.md',
      '/workspace/Team Interviews'
    ]

    const db = await this.getDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite')
      const store = tx.objectStore(STORE_FILES)
      for (const p of legacyPaths) {
        store.delete(normalizePath(p)!)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    // Ensure /workspace/Untitled.md exists
    const untitled = await this.getRawFile('/workspace/Untitled.md')
    if (!untitled) {
      await this.saveRawFile({
        path: '/workspace/Untitled.md',
        name: 'Untitled.md',
        isDir: false,
        parentPath: '/workspace',
        content: '',
        updatedAt: Date.now()
      })
    }

    // Update metadata.json to clean state
    await this.saveRawFile({
      path: '/workspace/.oink/metadata.json',
      name: 'metadata.json',
      isDir: false,
      parentPath: '/workspace/.oink',
      content: JSON.stringify(
        {
          version: 1,
          workspace: { name: 'Workspace', id: 'ws_default', createdAt: Date.now() },
          files: {},
          icons: {}
        },
        null,
        2
      ),
      updatedAt: Date.now()
    })

    this.notifyChange('change', '', '/workspace', '')
  }

  private async seedDefaultWorkspace(): Promise<void> {
    const starterDocs: { path: string; name: string; isDir: boolean; content?: string }[] = [
      { path: '/workspace', name: 'workspace', isDir: true },
      { path: '/workspace/.oink', name: '.oink', isDir: true },
      {
        path: '/workspace/.oink/config.ts',
        name: 'config.ts',
        isDir: false,
        content: `export const config = {\n  name: 'Workspace',\n  theme: { mode: 'dark', accentColor: '#ffffff' }\n}`
      },
      {
        path: '/workspace/.oink/metadata.json',
        name: 'metadata.json',
        isDir: false,
        content: JSON.stringify(
          {
            version: 1,
            workspace: { name: 'Workspace', id: 'ws_default', createdAt: Date.now() },
            files: {},
            icons: {}
          },
          null,
          2
        )
      },
      {
        path: '/workspace/Untitled.md',
        name: 'Untitled.md',
        isDir: false,
        content: ''
      }
    ]

    for (const doc of starterDocs) {
      await this.saveRawFile({
        path: normalizePath(doc.path)!,
        name: doc.name,
        isDir: doc.isDir,
        parentPath: normalizePath(this.getParentPath(doc.path))!,
        content: doc.content || '',
        updatedAt: Date.now()
      })
    }
  }

  private getParentPath(fullPath: string): string {
    const norm = normalizePath(fullPath)!
    const lastSlash = Math.max(norm.lastIndexOf('/'), norm.lastIndexOf('\\'))
    if (lastSlash <= 0) return '/workspace'
    return norm.substring(0, lastSlash)
  }

  private async saveRawFile(file: StoredFile): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite')
      tx.objectStore(STORE_FILES).put(file)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  private async getRawFile(filePath: string): Promise<StoredFile | null> {
    const norm = normalizePath(filePath)!
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly')
      const req = tx.objectStore(STORE_FILES).get(norm)
      req.onsuccess = () => resolve((req.result as StoredFile) || null)
      req.onerror = () => reject(req.error)
    })
  }

  private notifyChange(
    eventType: string,
    filename: string,
    absolutePath: string,
    parentPath: string
  ): void {
    const data = { eventType, filename, absolutePath, parentPath }
    this.changeListeners.forEach((cb) => {
      try {
        cb(data)
      } catch (err) {
        console.error('Error in workspace change listener:', err)
      }
    })
  }

  // ===================== FileSystemAPI Implementation =====================

  public async openDirectory(): Promise<{ path: string; name: string } | null> {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (
          window as unknown as {
            showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle>
          }
        ).showDirectoryPicker({
          mode: 'readwrite'
        })
        if (handle) {
          this.activeDirHandle = handle
          // Read files from handle into indexedDB cache for smooth access
          await this.syncDirectoryHandle(handle, `/${handle.name}`)
          return {
            path: `/${handle.name}`,
            name: handle.name
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          return null
        }
        console.warn('showDirectoryPicker failed:', err)
        return null
      }
    } else {
      alert(
        'Local directory access is not supported in this browser. You can continue writing with browser storage.'
      )
    }

    return null
  }

  private async syncDirectoryHandle(
    dirHandle: FileSystemDirectoryHandle,
    basePath: string
  ): Promise<void> {
    const normBase = normalizePath(basePath)!
    // Ensure parent directory entry
    await this.saveRawFile({
      path: normBase,
      name: normBase.split('/').pop() || 'workspace',
      isDir: true,
      parentPath: this.getParentPath(normBase),
      content: '',
      updatedAt: Date.now()
    })

    // Iterate directory entries
    const dirEntries = (
      dirHandle as unknown as { values: () => AsyncIterable<FileSystemHandle> }
    ).values()
    for await (const entry of dirEntries) {
      const entryPath = normalizePath(`${normBase}/${entry.name}`)!
      if (entry.kind === 'directory') {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.syncDirectoryHandle(entry as FileSystemDirectoryHandle, entryPath)
        }
      } else if (entry.kind === 'file') {
        try {
          const file = await (entry as FileSystemFileHandle).getFile()
          const text = await file.text()
          await this.saveRawFile({
            path: entryPath,
            name: entry.name,
            isDir: false,
            parentPath: normBase,
            content: text,
            updatedAt: file.lastModified || Date.now()
          })
        } catch {
          // ignore binary files or unreadable files
        }
      }
    }
  }

  public getHandleRelativePath(fullPath: string): string | null {
    if (!this.activeDirHandle) return null
    const norm = normalizePath(fullPath)!
    const rootPrefix = normalizePath(`/${this.activeDirHandle.name}`)!
    if (norm === rootPrefix) return ''
    if (norm.startsWith(`${rootPrefix}/`)) {
      return norm.slice(rootPrefix.length + 1)
    }
    return null
  }

  public async resolveFileHandle(
    relativePath: string,
    create = false
  ): Promise<FileSystemFileHandle | null> {
    if (!this.activeDirHandle) return null
    const parts = relativePath.split(/[\\/]/).filter(Boolean)
    if (parts.length === 0) return null
    const fileName = parts.pop()!
    let currentDir = this.activeDirHandle
    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create })
      } catch {
        return null
      }
    }
    try {
      return await currentDir.getFileHandle(fileName, { create })
    } catch {
      return null
    }
  }

  public async resolveDirHandle(
    relativePath: string,
    create = false
  ): Promise<FileSystemDirectoryHandle | null> {
    if (!this.activeDirHandle) return null
    if (!relativePath) return this.activeDirHandle
    const parts = relativePath.split(/[\\/]/).filter(Boolean)
    let currentDir = this.activeDirHandle
    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create })
      } catch {
        return null
      }
    }
    return currentDir
  }

  public async readDirectory(dirPath: string): Promise<FileNode[]> {
    await this.init()
    const normDir = normalizePath(dirPath)!
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly')
      const index = tx.objectStore(STORE_FILES).index('parentPath')
      const req = index.getAll(normDir)

      req.onsuccess = () => {
        const userSettings = storageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS)
        const showHidden = userSettings?.showHiddenFiles ?? false
        const items = (req.result as StoredFile[])
          .filter((item) => item.path !== normDir && (showHidden || !item.name.startsWith('.')))
          .map((item) => ({
            name: item.name,
            path: item.path,
            isDir: item.isDir
          }))
          .sort((a, b) => {
            if (a.isDir && !b.isDir) return -1
            if (!a.isDir && b.isDir) return 1
            return a.name.localeCompare(b.name)
          })
        resolve(items)
      }

      req.onerror = () => reject(req.error)
    })
  }

  public async readFile(filePath: string): Promise<string> {
    await this.init()
    const norm = normalizePath(filePath)!
    const file = await this.getRawFile(norm)
    if (!file) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`)
    }
    return file.content || ''
  }

  public async exists(filePath: string): Promise<boolean> {
    await this.init()
    const norm = normalizePath(filePath)!
    const file = await this.getRawFile(norm)
    return Boolean(file)
  }

  public async writeFile(filePath: string, content: string): Promise<void> {
    await this.init()

    // Handle web export download triggers
    if (filePath.startsWith('__download__:')) {
      const filename = filePath.replace('__download__:', '').trim()
      this.triggerBrowserDownload(filename, content)
      return
    }

    const norm = normalizePath(filePath)!
    const name = norm.split(/[\\/]/).pop() || 'untitled.md'
    const parentPath = this.getParentPath(norm)

    // Ensure parent folders exist
    await this.ensureParentFolders(parentPath)

    await this.saveRawFile({
      path: norm,
      name,
      isDir: false,
      parentPath,
      content,
      updatedAt: Date.now()
    })

    // Write-back to local disk handle if active
    const rel = this.getHandleRelativePath(norm)
    if (rel) {
      try {
        const fileHandle = await this.resolveFileHandle(rel, true)
        if (fileHandle) {
          const writable = await fileHandle.createWritable()
          await writable.write(content)
          await writable.close()
        }
      } catch (diskErr) {
        console.warn('Failed to write back to local disk handle:', diskErr)
      }
    }

    this.notifyChange('change', name, norm, parentPath)
  }

  private async ensureParentFolders(dirPath: string): Promise<void> {
    const norm = normalizePath(dirPath)!
    if (norm === '' || norm === '/' || norm === '/workspace') return

    const existing = await this.getRawFile(norm)
    if (!existing) {
      const name = norm.split(/[\\/]/).pop() || 'folder'
      const parent = this.getParentPath(norm)
      await this.ensureParentFolders(parent)
      await this.saveRawFile({
        path: norm,
        name,
        isDir: true,
        parentPath: parent,
        content: '',
        updatedAt: Date.now()
      })
    }
  }

  public async createFile(parentPath: string, name: string): Promise<string> {
    await this.init()
    const validParent = normalizePath(parentPath)!
    const sanitizedName = name.replace(/[\\/:*?"<>|]/g, '_').trim()
    const filePath = normalizePath(`${validParent}/${sanitizedName}`)!

    await this.ensureParentFolders(validParent)

    await this.saveRawFile({
      path: filePath,
      name: sanitizedName,
      isDir: false,
      parentPath: validParent,
      content: '',
      updatedAt: Date.now()
    })

    // Mirror to local disk handle if active
    const relParent = this.getHandleRelativePath(validParent)
    if (relParent !== null) {
      try {
        const dirHandle = await this.resolveDirHandle(relParent, true)
        if (dirHandle) {
          const fileHandle = await dirHandle.getFileHandle(sanitizedName, { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write('')
          await writable.close()
        }
      } catch (err) {
        console.warn('Failed to create file on disk handle:', err)
      }
    }

    this.notifyChange('create', sanitizedName, filePath, validParent)
    return filePath
  }

  public async createFolder(parentPath: string, name: string): Promise<string> {
    await this.init()
    const validParent = normalizePath(parentPath)!
    const sanitizedName = name.replace(/[\\/:*?"<>|]/g, '_').trim()
    const folderPath = normalizePath(`${validParent}/${sanitizedName}`)!

    await this.ensureParentFolders(validParent)

    await this.saveRawFile({
      path: folderPath,
      name: sanitizedName,
      isDir: true,
      parentPath: validParent,
      content: '',
      updatedAt: Date.now()
    })

    // Mirror to local disk handle if active
    const relParent = this.getHandleRelativePath(validParent)
    if (relParent !== null) {
      try {
        const dirHandle = await this.resolveDirHandle(relParent, true)
        if (dirHandle) {
          await dirHandle.getDirectoryHandle(sanitizedName, { create: true })
        }
      } catch (err) {
        console.warn('Failed to create directory on disk handle:', err)
      }
    }

    this.notifyChange('create', sanitizedName, folderPath, validParent)
    return folderPath
  }

  public async deletePath(itemPath: string): Promise<void> {
    await this.init()
    const norm = normalizePath(itemPath)!
    const db = await this.getDB()

    // Get keys matching item and any nested child paths without reading full file content
    const keysToDelete = await this.getKeysByPrefix(norm)

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readwrite')
      const store = tx.objectStore(STORE_FILES)
      keysToDelete.forEach((key) => store.delete(key))
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    // Mirror deletion to local disk handle if active
    const rel = this.getHandleRelativePath(norm)
    if (rel) {
      try {
        const parts = rel.split(/[\\/]/).filter(Boolean)
        const name = parts.pop()!
        const parentRel = parts.join('/')
        const parentHandle = await this.resolveDirHandle(parentRel, false)
        if (parentHandle) {
          await parentHandle.removeEntry(name, { recursive: true })
        }
      } catch (diskErr) {
        console.warn('Failed to remove entry from disk handle:', diskErr)
      }
    }

    const name = norm.split(/[\\/]/).pop() || ''
    const parentPath = this.getParentPath(norm)
    this.notifyChange('delete', name, norm, parentPath)
  }

  public async renamePath(oldPath: string, newPath: string): Promise<void> {
    await this.init()
    const validOld = normalizePath(oldPath)!
    const validNew = normalizePath(newPath)!
    const oldItem = await this.getRawFile(validOld)
    if (!oldItem) return

    const newName = validNew.split(/[\\/]/).pop() || oldItem.name
    const newParent = this.getParentPath(validNew)
    const db = await this.getDB()

    if (!oldItem.isDir) {
      await this.saveRawFile({
        ...oldItem,
        path: validNew,
        name: newName,
        parentPath: newParent,
        updatedAt: Date.now()
      })
      await new Promise<void>((res) => {
        const tx = db.transaction(STORE_FILES, 'readwrite')
        tx.objectStore(STORE_FILES).delete(validOld)
        tx.oncomplete = () => res()
      })
    } else {
      // Directory rename: query only children under validOld/ using key range
      const children = await this.getFilesByPrefix(`${validOld}/`)

      const tx = db.transaction(STORE_FILES, 'readwrite')
      const store = tx.objectStore(STORE_FILES)

      // Delete old directory
      store.delete(validOld)

      // Insert new directory
      store.put({
        ...oldItem,
        path: validNew,
        name: newName,
        parentPath: newParent,
        updatedAt: Date.now()
      })

      // Update children
      for (const child of children) {
        store.delete(child.path)
        const childRelative = child.path.substring(validOld.length)
        const updatedChildPath = normalizePath(`${validNew}${childRelative}`)!
        const updatedChildParent = this.getParentPath(updatedChildPath)
        store.put({
          ...child,
          path: updatedChildPath,
          parentPath: updatedChildParent,
          updatedAt: Date.now()
        })
      }

      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      })
    }

    // Mirror rename to local disk handle if active
    const oldRel = this.getHandleRelativePath(validOld)
    const newRel = this.getHandleRelativePath(validNew)
    if (oldRel && newRel) {
      try {
        const oldParts = oldRel.split(/[\\/]/).filter(Boolean)
        const oldName = oldParts.pop()!
        const oldParentRel = oldParts.join('/')
        const oldParentHandle = await this.resolveDirHandle(oldParentRel, false)

        const newParts = newRel.split(/[\\/]/).filter(Boolean)
        const targetNewName = newParts.pop()!
        const newParentRel = newParts.join('/')
        const newParentHandle = await this.resolveDirHandle(newParentRel, true)

        if (oldParentHandle && newParentHandle) {
          if (!oldItem.isDir) {
            const oldFileHandle = await oldParentHandle.getFileHandle(oldName)
            const moveableHandle = oldFileHandle as FileSystemFileHandle & {
              move?: (dest: FileSystemDirectoryHandle, newName?: string) => Promise<void>
            }
            if (typeof moveableHandle.move === 'function') {
              await moveableHandle.move(newParentHandle, targetNewName)
            } else {
              const file = await oldFileHandle.getFile()
              const content = await file.text()
              const newFileHandle = await newParentHandle.getFileHandle(targetNewName, {
                create: true
              })
              const writable = await newFileHandle.createWritable()
              await writable.write(content)
              await writable.close()
              await oldParentHandle.removeEntry(oldName)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to rename entry on disk handle:', err)
      }
    }

    this.notifyChange('rename', newName, validNew, newParent)
  }

  public async showItemInFolder(fullPath: string): Promise<boolean> {
    // In web, highlights or acknowledges presence
    void fullPath
    return true
  }

  public async showSaveDialog(defaultName: string): Promise<string | null> {
    // In web browsers, return download marker pseudo-path
    return `__download__:${defaultName}`
  }

  public async saveAttachment(
    workspacePath: string,
    fileName: string,
    dataUrl: string
  ): Promise<string> {
    await this.init()
    const validWorkspace = normalizePath(workspacePath)!
    const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '.png'
    const base = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
    const finalName = `${base}_${Date.now()}${ext}`
    const fullPath = normalizePath(`${validWorkspace}/assets/${finalName}`)!

    await this.ensureParentFolders(`${validWorkspace}/assets`)

    await this.saveRawFile({
      path: fullPath,
      name: finalName,
      isDir: false,
      parentPath: normalizePath(`${validWorkspace}/assets`)!,
      content: dataUrl,
      updatedAt: Date.now()
    })

    // If disk handle active, mirror attachment to disk
    const rel = this.getHandleRelativePath(fullPath)
    if (rel) {
      try {
        const fileHandle = await this.resolveFileHandle(rel, true)
        if (fileHandle) {
          const res = await fetch(dataUrl)
          const blob = await res.blob()
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
        }
      } catch (err) {
        console.warn('Failed to save attachment to disk handle:', err)
      }
    }

    return `assets/${finalName}`
  }

  public async watchDirectory(dirPath: string): Promise<void> {
    void dirPath
  }

  public async closeWatcher(): Promise<void> {
    // watcher cleanup
  }

  public async getGraphData(dirPath: string): Promise<{
    nodes: Array<{ id: string; name: string }>
    links: Array<{ source: string; target: string }>
  }> {
    await this.init()
    const normDir = normalizePath(dirPath)!
    const files = await this.getFilesByPrefix(normDir)

    const mdFiles = files.filter((f) => !f.isDir && f.name.endsWith('.md'))

    const noteTitleMap = new Map<string, string>()
    const nodes = mdFiles.map((f) => {
      const name = f.name.replace(/\.md$/, '')
      noteTitleMap.set(name.toLowerCase(), f.path)
      return {
        id: f.path,
        name
      }
    })

    const links: Array<{ source: string; target: string }> = []
    for (const f of mdFiles) {
      const content = f.content || ''
      const matches = content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)
      for (const match of matches) {
        const targetName = match[1].trim().toLowerCase()
        const targetId = noteTitleMap.get(targetName)
        if (targetId && targetId !== f.path) {
          links.push({
            source: f.path,
            target: targetId
          })
        }
      }
    }

    return { nodes, links }
  }

  public onWorkspaceChanged(
    callback: (data: {
      eventType: string
      filename: string
      absolutePath: string
      parentPath: string
    }) => void
  ): () => void {
    this.changeListeners.add(callback)
    return (): void => {
      this.changeListeners.delete(callback)
    }
  }

  private async getKeysByPrefix(prefix: string): Promise<string[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly')
      const store = tx.objectStore(STORE_FILES)
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff')
      const req = store.getAllKeys(range)
      req.onsuccess = () => {
        const keys = (req.result as string[]).filter(
          (k) => k === prefix || k.startsWith(`${prefix}/`)
        )
        resolve(keys)
      }
      req.onerror = () => reject(req.error)
    })
  }

  private async getFilesByPrefix(prefix: string): Promise<StoredFile[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_FILES, 'readonly')
      const store = tx.objectStore(STORE_FILES)
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff')
      const req = store.getAll(range)
      req.onsuccess = () => {
        const files = (req.result as StoredFile[]).filter(
          (f) => f.path === prefix || f.path.startsWith(`${prefix}/`)
        )
        resolve(files)
      }
      req.onerror = () => reject(req.error)
    })
  }

  private triggerBrowserDownload(filename: string, content: string): void {
    const mimeType = filename.endsWith('.html')
      ? 'text/html;charset=utf-8'
      : filename.endsWith('.json')
        ? 'application/json;charset=utf-8'
        : 'text/markdown;charset=utf-8'

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export const webFileSystem = new WebFileSystemService()
