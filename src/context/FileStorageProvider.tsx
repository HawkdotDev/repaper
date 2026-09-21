import React, { useMemo } from 'react'
import { useFileStorage, OpenFileItem } from '../hooks/useFileStorage'
import { useWorkspaceContext } from './WorkspaceContext'
import { FileStorageContext, FileStorageContextType } from './FileStorageContext'

export interface FileStorageProviderProps {
  children: React.ReactNode
  initialActiveFilePath?: string | null
  initialOpenFiles?: OpenFileItem[]
  autoSaveEnabled?: boolean
  initialAutoSaveEnabled?: boolean
  autoSaveDelay?: number
  initialAutoSaveDelay?: number
}

export function FileStorageProvider({
  children,
  initialActiveFilePath = null,
  initialOpenFiles = [],
  autoSaveEnabled,
  initialAutoSaveEnabled,
  autoSaveDelay,
  initialAutoSaveDelay
}: FileStorageProviderProps): React.JSX.Element {
  const { workspacePath } = useWorkspaceContext()

  const storage = useFileStorage(
    workspacePath,
    initialActiveFilePath,
    initialOpenFiles,
    initialAutoSaveEnabled !== undefined ? initialAutoSaveEnabled : autoSaveEnabled,
    initialAutoSaveDelay !== undefined ? initialAutoSaveDelay : autoSaveDelay
  )

  const value = useMemo<FileStorageContextType>(() => storage, [storage])

  return <FileStorageContext.Provider value={value}>{children}</FileStorageContext.Provider>
}
