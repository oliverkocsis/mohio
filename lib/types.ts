export interface Artifact {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateArtifactInput {
  title: string
  content: string
}

export interface UpdateArtifactInput {
  title?: string
  content?: string
}

export interface StorageAdapter {
  getArtifact(id: string): Promise<Artifact | null>
  getAllArtifacts(): Promise<Artifact[]>
  createArtifact(input: CreateArtifactInput): Promise<Artifact>
  updateArtifact(id: string, input: UpdateArtifactInput): Promise<Artifact | null>
  deleteArtifact(id: string): Promise<boolean>
}