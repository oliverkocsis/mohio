import { StorageAdapter, Block, View, SyntacticVariant, CreateBlockInput, CreateViewInput, UpdateBlockInput, UpdateViewInput, CreateSyntacticVariantInput, BlockID } from '../types'

export class ApiStorageAdapter implements StorageAdapter {
  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  // View operations
  async getView(id: string): Promise<View | null> {
    try {
      return await this.fetchJson<View>(`/api/views/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getAllViews(): Promise<View[]> {
    return this.fetchJson<View[]>('/api/views')
  }

  async createView(input: CreateViewInput): Promise<View> {
    return this.fetchJson<View>('/api/views', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateView(id: string, input: UpdateViewInput): Promise<View | null> {
    try {
      return await this.fetchJson<View>(`/api/views/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async deleteView(id: string): Promise<boolean> {
    try {
      await this.fetchJson(`/api/views/${id}`, {
        method: 'DELETE',
      })
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      throw error
    }
  }

  // Block operations
  async getBlock(id: BlockID): Promise<Block | null> {
    try {
      return await this.fetchJson<Block>(`/api/blocks/${id}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getAllBlocks(): Promise<Block[]> {
    return this.fetchJson<Block[]>('/api/blocks')
  }

  async createBlock(input: CreateBlockInput): Promise<Block> {
    return this.fetchJson<Block>('/api/blocks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async updateBlock(id: BlockID, input: UpdateBlockInput): Promise<Block | null> {
    try {
      return await this.fetchJson<Block>(`/api/blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async deleteBlock(id: BlockID): Promise<boolean> {
    try {
      await this.fetchJson(`/api/blocks/${id}`, {
        method: 'DELETE',
      })
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      throw error
    }
  }

  // Syntactic variant operations
  async getSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<SyntacticVariant | null> {
    try {
      return await this.fetchJson<SyntacticVariant>(`/api/variants/${baseId}/${variantId}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async getAllSyntacticVariants(): Promise<SyntacticVariant[]> {
    return this.fetchJson<SyntacticVariant[]>('/api/variants')
  }

  async createSyntacticVariant(input: CreateSyntacticVariantInput): Promise<SyntacticVariant> {
    return this.fetchJson<SyntacticVariant>('/api/variants', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  async deleteSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<boolean> {
    try {
      await this.fetchJson(`/api/variants/${baseId}/${variantId}`, {
        method: 'DELETE',
      })
      return true
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false
      }
      throw error
    }
  }

  async getVariantsForBlock(blockId: BlockID): Promise<SyntacticVariant[]> {
    return this.fetchJson<SyntacticVariant[]>(`/api/variants/block/${blockId}`)
  }

  async getBaseBlocksForVariant(variantId: BlockID): Promise<SyntacticVariant[]> {
    return this.fetchJson<SyntacticVariant[]>(`/api/variants/variant/${variantId}`)
  }
}