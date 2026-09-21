import { createContext, useContext } from 'react'
import { UseFileStorageReturn } from '../hooks/useFileStorage'

export type FileStorageContextType = UseFileStorageReturn

export const FileStorageContext = createContext<FileStorageContextType | null>(null)

export function useFileStorageContext(): FileStorageContextType {
  const context = useContext(FileStorageContext)
  if (!context) {
    throw new Error('useFileStorageContext must be used within a FileStorageProvider')
  }
  return context
}
