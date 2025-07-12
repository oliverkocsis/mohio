import { promises as fs } from 'fs'
import path from 'path'
import { Artifact, CreateArtifactInput, UpdateArtifactInput, StorageAdapter } from '../types'

export class FileStorageAdapter implements StorageAdapter {
  private dataDir: string

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir)
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true })
    }
  }

  private getFilePath(id: string): string {
    return path.join(this.dataDir, `${id}.json`)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    try {
      const filePath = this.getFilePath(id)
      const data = await fs.readFile(filePath, 'utf-8')
      const artifact = JSON.parse(data)
      return {
        ...artifact,
        createdAt: new Date(artifact.createdAt),
        updatedAt: new Date(artifact.updatedAt)
      }
    } catch {
      return null
    }
  }

  async getAllArtifacts(): Promise<Artifact[]> {
    try {
      const files = await fs.readdir(this.dataDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      const artifacts = await Promise.all(
        jsonFiles.map(async (file) => {
          const id = file.replace('.json', '')
          return this.getArtifact(id)
        })
      )
      
      return artifacts.filter((artifact): artifact is Artifact => artifact !== null)
    } catch {
      return []
    }
  }

  async createArtifact(input: CreateArtifactInput): Promise<Artifact> {
    const id = this.generateId()
    const now = new Date()
    const artifact: Artifact = {
      id,
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now
    }

    try {
      await this.ensureDataDir()
      const filePath = this.getFilePath(id)
      await fs.writeFile(filePath, JSON.stringify(artifact, null, 2))
    } catch (error) {
      console.warn('Could not persist artifact to file system (production environment):', error)
    }
    
    return artifact
  }

  async updateArtifact(id: string, input: UpdateArtifactInput): Promise<Artifact | null> {
    const existing = await this.getArtifact(id)
    if (!existing) return null

    const updated: Artifact = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      updatedAt: new Date()
    }

    try {
      const filePath = this.getFilePath(id)
      await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    } catch (error) {
      console.warn('Could not persist artifact update to file system (production environment):', error)
    }
    
    return updated
  }

  async deleteArtifact(id: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(id)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }
}