import { FileStorageAdapter } from './file-storage'
import { StorageAdapter } from '../types'

let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new FileStorageAdapter('./data')
  }
  return storageInstance
}

export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter
}