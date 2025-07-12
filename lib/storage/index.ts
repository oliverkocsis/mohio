import { FileStorageAdapter } from './file-storage'
import { StorageAdapter } from '../types'
import path from 'path'

let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    const dataDir = path.join(process.cwd(), 'data')
    storageInstance = new FileStorageAdapter(dataDir)
  }
  return storageInstance
}

export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter
}