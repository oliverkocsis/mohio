import { StorageAdapter } from '../types'

let storageInstance: StorageAdapter | null = null

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    if (typeof window === 'undefined') {
      // Server-side: use Prisma storage
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaStorageAdapter } = require('./prisma-storage')
      storageInstance = new PrismaStorageAdapter()
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