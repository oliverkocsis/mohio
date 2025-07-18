import { PrismaClient } from '../generated/prisma';
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

export class PrismaStorageAdapter implements StorageAdapter {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  // View management methods
  async getView(id: string): Promise<View | null> {
    const view = await this.prisma.view.findUnique({
      where: { id },
      include: {
        rootBlocks: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true // Support up to 4 levels of nesting
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!view) return null

    return {
      id: view.id,
      type: view.type as 'document' | 'presentation',
      title: view.title,
      purpose: view.purpose,
      tone: view.tone,
      rootBlocks: this.transformPrismaBlocksToBlocks(view.rootBlocks),
      createdBy: view.createdBy,
      createdAt: view.createdAt,
      updatedBy: view.updatedBy,
      updatedAt: view.updatedAt
    }
  }

  async getAllViews(): Promise<View[]> {
    const views = await this.prisma.view.findMany({
      include: {
        rootBlocks: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return views.map(view => ({
      id: view.id,
      type: view.type as 'document' | 'presentation',
      title: view.title,
      purpose: view.purpose,
      tone: view.tone,
      rootBlocks: this.transformPrismaBlocksToBlocks(view.rootBlocks),
      createdBy: view.createdBy,
      createdAt: view.createdAt,
      updatedBy: view.updatedBy,
      updatedAt: view.updatedAt
    }))
  }

  async createView(input: CreateViewInput): Promise<View> {
    const view = await this.prisma.view.create({
      data: {
        type: input.type,
        title: input.title,
        purpose: input.purpose,
        tone: input.tone,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
        rootBlocks: {
          connect: input.rootBlocks.map(block => ({ id: block.id }))
        }
      },
      include: {
        rootBlocks: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return {
      id: view.id,
      type: view.type as 'document' | 'presentation',
      title: view.title,
      purpose: view.purpose,
      tone: view.tone,
      rootBlocks: this.transformPrismaBlocksToBlocks(view.rootBlocks),
      createdBy: view.createdBy,
      createdAt: view.createdAt,
      updatedBy: view.updatedBy,
      updatedAt: view.updatedAt
    }
  }

  async updateView(id: string, input: UpdateViewInput): Promise<View | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (input.title !== undefined) updateData.title = input.title
      if (input.purpose !== undefined) updateData.purpose = input.purpose
      if (input.tone !== undefined) updateData.tone = input.tone
      
      // Handle rootBlocks - create new blocks first, then connect them
      if (input.rootBlocks !== undefined) {
        // Create or update blocks first
        const blockIds = []
        for (const block of input.rootBlocks) {
          // Use 'system' as the user ID since that's what exists in the database
          const createdBlock = await this.prisma.block.upsert({
            where: { id: block.id },
            update: {
              canonical: block.canonical,
              html: block.html || null,
              style: block.style as any || null,
              updatedBy: "system",
              updatedAt: new Date()
            },
            create: {
              id: block.id,
              canonical: block.canonical,
              html: block.html || null,
              style: block.style as any || null,
              createdBy: "system",
              updatedBy: "system",
              createdAt: block.createdAt || new Date(),
              updatedAt: block.updatedAt || new Date()
            }
          })
          blockIds.push(createdBlock.id)
        }
        
        updateData.rootBlocks = {
          set: blockIds.map(id => ({ id }))
        }
      }

      const view = await this.prisma.view.update({
        where: { id },
        data: updateData,
        include: {
          rootBlocks: {
            include: {
              children: {
                include: {
                  children: {
                    include: {
                      children: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      return {
        id: view.id,
        type: view.type as 'document' | 'presentation',
        title: view.title,
        purpose: view.purpose,
        tone: view.tone,
        rootBlocks: this.transformPrismaBlocksToBlocks(view.rootBlocks),
        createdBy: view.createdBy,
        createdAt: view.createdAt,
        updatedBy: view.updatedBy,
        updatedAt: view.updatedAt
      }
    } catch (error) {
      console.error('Error updating view:', error)
      return null
    }
  }

  async deleteView(id: string): Promise<boolean> {
    try {
      await this.prisma.view.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }

  // Block management methods
  async getBlock(id: BlockID): Promise<Block | null> {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true
              }
            }
          }
        }
      }
    })

    if (!block) return null

    return this.transformPrismaBlockToBlock(block)
  }

  async getAllBlocks(): Promise<Block[]> {
    const blocks = await this.prisma.block.findMany({
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true
              }
            }
          }
        }
      }
    })

    return blocks.map(block => this.transformPrismaBlockToBlock(block))
  }

  async createBlock(input: CreateBlockInput): Promise<Block> {
    const block = await this.prisma.block.create({
      data: {
        canonical: input.canonical,
        html: input.html || null,
        style: input.style as any || null,
        createdBy: input.createdBy,
        updatedBy: input.createdBy
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true
              }
            }
          }
        }
      }
    })

    return this.transformPrismaBlockToBlock(block)
  }

  async updateBlock(id: BlockID, input: UpdateBlockInput): Promise<Block | null> {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }

      if (input.canonical !== undefined) updateData.canonical = input.canonical
      if (input.html !== undefined) updateData.html = input.html
      if (input.style !== undefined) updateData.style = input.style as any

      const block = await this.prisma.block.update({
        where: { id },
        data: updateData,
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: true
                }
              }
            }
          }
        }
      })

      return this.transformPrismaBlockToBlock(block)
    } catch {
      return null
    }
  }

  async deleteBlock(id: BlockID): Promise<boolean> {
    try {
      await this.prisma.block.delete({
        where: { id }
      })
      return true
    } catch {
      return false
    }
  }

  // SyntacticVariant management methods
  async getSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<SyntacticVariant | null> {
    const variant = await this.prisma.syntacticVariant.findUnique({
      where: {
        baseId_variantId: {
          baseId,
          variantId
        }
      }
    })

    if (!variant) return null

    return {
      base: variant.baseId,
      variant: variant.variantId,
      variance: variant.variance,
      transformation: variant.transformation,
      depth: variant.depth ?? undefined,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt
    }
  }

  async getAllSyntacticVariants(): Promise<SyntacticVariant[]> {
    const variants = await this.prisma.syntacticVariant.findMany()

    return variants.map(variant => ({
      base: variant.baseId,
      variant: variant.variantId,
      variance: variant.variance,
      transformation: variant.transformation,
      depth: variant.depth ?? undefined,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt
    }))
  }

  async createSyntacticVariant(input: CreateSyntacticVariantInput): Promise<SyntacticVariant> {
    const variant = await this.prisma.syntacticVariant.create({
      data: {
        baseId: input.base,
        variantId: input.variant,
        variance: input.variance,
        transformation: input.transformation || [],
        depth: input.depth
      }
    })

    return {
      base: variant.baseId,
      variant: variant.variantId,
      variance: variant.variance,
      transformation: variant.transformation,
      depth: variant.depth ?? undefined,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt
    }
  }

  async deleteSyntacticVariant(baseId: BlockID, variantId: BlockID): Promise<boolean> {
    try {
      await this.prisma.syntacticVariant.delete({
        where: {
          baseId_variantId: {
            baseId,
            variantId
          }
        }
      })
      return true
    } catch {
      return false
    }
  }

  async getVariantsForBlock(blockId: BlockID): Promise<SyntacticVariant[]> {
    const variants = await this.prisma.syntacticVariant.findMany({
      where: {
        baseId: blockId
      }
    })

    return variants.map(variant => ({
      base: variant.baseId,
      variant: variant.variantId,
      variance: variant.variance,
      transformation: variant.transformation,
      depth: variant.depth ?? undefined,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt
    }))
  }

  async getBaseBlocksForVariant(variantId: BlockID): Promise<SyntacticVariant[]> {
    const variants = await this.prisma.syntacticVariant.findMany({
      where: {
        variantId: variantId
      }
    })

    return variants.map(variant => ({
      base: variant.baseId,
      variant: variant.variantId,
      variance: variant.variance,
      transformation: variant.transformation,
      depth: variant.depth ?? undefined,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt
    }))
  }

  // Helper methods
  private transformPrismaBlockToBlock(prismaBlock: any): Block {
    return {
      id: prismaBlock.id,
      canonical: prismaBlock.canonical,
      html: prismaBlock.html,
      style: prismaBlock.style,
      children: prismaBlock.children ? this.transformPrismaBlocksToBlocks(prismaBlock.children) : undefined,
      createdBy: prismaBlock.createdBy,
      createdAt: prismaBlock.createdAt,
      updatedBy: prismaBlock.updatedBy,
      updatedAt: prismaBlock.updatedAt
    }
  }

  private transformPrismaBlocksToBlocks(prismaBlocks: any[]): Block[] {
    return prismaBlocks.map(block => this.transformPrismaBlockToBlock(block))
  }
}