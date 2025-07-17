import { promises as fs } from 'fs'
import path from 'path'
import { 
  StorageAdapter,
  View,
  Block,
  SyntacticVariant,
  CreateViewInput,
  UpdateViewInput,
  CreateBlockInput,
  UpdateBlockInput,
  CreateSyntacticVariantInput,
  BlockID
} from '../types'

export class FileStorageAdapter implements StorageAdapter {
  private viewsDir: string
  private blocksDir: string
  private variantsDir: string

  constructor(dataDir: string = './data') {
    this.viewsDir = path.join(dataDir, 'views')
    this.blocksDir = path.join(dataDir, 'blocks') 
    this.variantsDir = path.join(dataDir, 'variants')
  }


  private async ensureViewsDir(): Promise<void> {
    try {
      await fs.access(this.viewsDir)
    } catch {
      await fs.mkdir(this.viewsDir, { recursive: true })
    }
  }

  private async ensureBlocksDir(): Promise<void> {
    try {
      await fs.access(this.blocksDir)
    } catch {
      await fs.mkdir(this.blocksDir, { recursive: true })
    }
  }

  private async ensureVariantsDir(): Promise<void> {
    try {
      await fs.access(this.variantsDir)
    } catch {
      await fs.mkdir(this.variantsDir, { recursive: true })
    }
  }


  private getViewPath(id: string): string {
    return path.join(this.viewsDir, `${id}.json`)
  }

  private getBlockPath(id: BlockID): string {
    return path.join(this.blocksDir, `${id}.json`)
  }

  private getVariantPath(baseId: BlockID, variantId: BlockID): string {
    return path.join(this.variantsDir, `${baseId}-${variantId}.json`)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }


  // View management methods
  async getView(id: string): Promise<View | null> {
    try {
      const filePath = this.getViewPath(id)
      const data = await fs.readFile(filePath, 'utf-8')
      const view = JSON.parse(data)
      return {
        ...view,
        createdAt: new Date(view.createdAt),
        updatedAt: new Date(view.updatedAt)
      }
    } catch {
      return null
    }
  }

  async getAllViews(): Promise<View[]> {
    try {
      await this.ensureViewsDir()
      const files = await fs.readdir(this.viewsDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      const views = await Promise.all(
        jsonFiles.map(async (file) => {
          const id = file.replace('.json', '')
          return this.getView(id)
        })
      )
      
      return views.filter((view): view is View => view !== null)
    } catch {
      return []
    }
  }

  async createView(input: CreateViewInput): Promise<View> {
    const id = this.generateId()
    const now = new Date()
    const view: View = {
      id,
      type: input.type,
      title: input.title,
      purpose: input.purpose,
      tone: input.tone,
      rootBlocks: input.rootBlocks,
      createdBy: input.createdBy,
      createdAt: now,
      updatedBy: input.createdBy,
      updatedAt: now
    }

    try {
      await this.ensureViewsDir()
      const filePath = this.getViewPath(id)
      await fs.writeFile(filePath, JSON.stringify(view, null, 2))
    } catch (error) {
      console.warn('Could not persist view to file system (production environment):', error)
    }
    
    return view
  }

  async updateView(id: string, input: UpdateViewInput): Promise<View | null> {
    const existing = await this.getView(id)
    if (!existing) return null

    const updated: View = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.purpose !== undefined && { purpose: input.purpose }),
      ...(input.tone !== undefined && { tone: input.tone }),
      ...(input.rootBlocks !== undefined && { rootBlocks: input.rootBlocks }),
      updatedAt: new Date()
    }

    try {
      const filePath = this.getViewPath(id)
      await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    } catch (error) {
      console.warn('Could not persist view update to file system (production environment):', error)
    }
    
    return updated
  }

  async deleteView(id: string): Promise<boolean> {
    try {
      const filePath = this.getViewPath(id)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  // Block management methods
  async getBlock(id: BlockID): Promise<Block | null> {
    try {
      const filePath = this.getBlockPath(id)
      const data = await fs.readFile(filePath, 'utf-8')
      const block = JSON.parse(data)
      return {
        ...block,
        createdAt: new Date(block.createdAt),
        updatedAt: new Date(block.updatedAt)
      }
    } catch {
      return null
    }
  }

  async getAllBlocks(): Promise<Block[]> {
    try {
      await this.ensureBlocksDir()
      const files = await fs.readdir(this.blocksDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      const blocks = await Promise.all(
        jsonFiles.map(async (file) => {
          const id = file.replace('.json', '') as BlockID
          return this.getBlock(id)
        })
      )
      
      return blocks.filter((block): block is Block => block !== null)
    } catch {
      return []
    }
  }

  async createBlock(input: CreateBlockInput): Promise<Block> {
    const id = this.generateId() as BlockID
    const now = new Date()
    const block: Block = {
      id,
      canonical: input.canonical,
      html: input.html,
      style: input.style,
      children: input.children,
      createdBy: input.createdBy,
      createdAt: now,
      updatedBy: input.createdBy,
      updatedAt: now
    }

    try {
      await this.ensureBlocksDir()
      const filePath = this.getBlockPath(id)
      await fs.writeFile(filePath, JSON.stringify(block, null, 2))
    } catch (error) {
      console.warn('Could not persist block to file system (production environment):', error)
    }
    
    return block
  }

  async updateBlock(id: BlockID, input: UpdateBlockInput): Promise<Block | null> {
    const existing = await this.getBlock(id)
    if (!existing) return null

    const updated: Block = {
      ...existing,
      ...(input.canonical !== undefined && { canonical: input.canonical }),
      ...(input.html !== undefined && { html: input.html }),
      ...(input.style !== undefined && { style: input.style }),
      ...(input.children !== undefined && { children: input.children }),
      updatedAt: new Date()
    }

    try {
      const filePath = this.getBlockPath(id)
      await fs.writeFile(filePath, JSON.stringify(updated, null, 2))
    } catch (error) {
      console.warn('Could not persist block update to file system (production environment):', error)
    }
    
    return updated
  }

  async deleteBlock(id: BlockID): Promise<boolean> {
    try {
      const filePath = this.getBlockPath(id)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  // SyntacticVariant management methods
  async getSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<SyntacticVariant | null> {
    try {
      const filePath = this.getVariantPath(baseId, variantId)
      const data = await fs.readFile(filePath, 'utf-8')
      const variant = JSON.parse(data)
      return {
        ...variant,
        createdAt: new Date(variant.createdAt),
        updatedAt: new Date(variant.updatedAt)
      }
    } catch {
      return null
    }
  }

  async getAllSyntacticVariants(): Promise<SyntacticVariant[]> {
    try {
      await this.ensureVariantsDir()
      const files = await fs.readdir(this.variantsDir)
      const jsonFiles = files.filter(file => file.endsWith('.json'))
      
      const variants = await Promise.all(
        jsonFiles.map(async (file) => {
          const [baseId, variantId] = file.replace('.json', '').split('-') as [BlockID, BlockID]
          return this.getSyntacticVariant(baseId, variantId)
        })
      )
      
      return variants.filter((variant): variant is SyntacticVariant => variant !== null)
    } catch {
      return []
    }
  }

  async createSyntacticVariant(input: CreateSyntacticVariantInput): Promise<SyntacticVariant> {
    const now = new Date()
    const variant: SyntacticVariant = {
      base: input.base,
      variant: input.variant,
      variance: input.variance,
      transformation: input.transformation,
      depth: input.depth,
      createdAt: now,
      updatedAt: now
    }

    try {
      await this.ensureVariantsDir()
      const filePath = this.getVariantPath(input.base, input.variant)
      await fs.writeFile(filePath, JSON.stringify(variant, null, 2))
    } catch (error) {
      console.warn('Could not persist syntactic variant to file system (production environment):', error)
    }
    
    return variant
  }

  async deleteSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<boolean> {
    try {
      const filePath = this.getVariantPath(baseId, variantId)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  async getVariantsForBlock(blockId: BlockID): Promise<SyntacticVariant[]> {
    const allVariants = await this.getAllSyntacticVariants()
    return allVariants.filter(variant => variant.base === blockId)
  }

  async getBaseBlocksForVariant(variantId: BlockID): Promise<SyntacticVariant[]> {
    const allVariants = await this.getAllSyntacticVariants()
    return allVariants.filter(variant => variant.variant === variantId)
  }
}