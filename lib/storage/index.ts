import { StorageAdapter } from '../types'

let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    if (typeof window === 'undefined') {
      // Server-side: use file storage
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { FileStorageAdapter } = require('./file-storage')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path')
      const dataDir = path.join(process.cwd(), 'data')
      storageInstance = new FileStorageAdapter(dataDir)
    } else {
      // Client-side: use API calls
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ApiStorageAdapter } = require('./api-storage')
      storageInstance = new ApiStorageAdapter()
    }
  }
  return storageInstance!
}

export function setStorage(adapter: StorageAdapter): void {
  storageInstance = adapter
}