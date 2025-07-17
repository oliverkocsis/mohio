'use client'

import { ReactNode, createContext, useContext, useEffect } from 'react'
import { useBlockStore } from '@/lib/store/block-store'
import { Block, BlockID, View } from '@/lib/types'

interface BlockShareContextType {
  // Block sharing utilities
  shareBlockBetweenViews: (blockId: BlockID, fromViewId: string, toViewId: string) => Promise<void>
  getSharedBlocks: (viewId: string) => Block[]
  getBlockReferences: (blockId: BlockID) => View[]
  duplicateBlockToView: (blockId: BlockID, targetViewId: string) => Promise<Block>
  
  // Real-time synchronization
  subscribeToBlockChanges: (blockId: BlockID, callback: (block: Block) => void) => () => void
  broadcastBlockChange: (blockId: BlockID, updatedBlock: Block) => void
  
  // Collaboration features
  getBlockEditHistory: (blockId: BlockID) => Promise<unknown[]>
  createBlockVariant: (baseBlockId: BlockID, variantText: string) => Promise<Block>
  linkBlocks: (blockId1: BlockID, blockId2: BlockID, relationship: string) => Promise<void>
}

const BlockShareContext = createContext<BlockShareContextType | undefined>(undefined)

export function useBlockShare() {
  const context = useContext(BlockShareContext)
  if (!context) {
    throw new Error('useBlockShare must be used within a BlockShareProvider')
  }
  return context
}

interface BlockShareProviderProps {
  children: ReactNode
}

export function BlockShareProvider({ children }: BlockShareProviderProps) {
  const {
    getBlock,
    cloneBlock,
    getView,
    updateView,
    getBlockUsage,
    createVariant,
    syncBlockAcrossViews,
    loadInitialData
  } = useBlockStore()

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const shareBlockBetweenViews = async (blockId: BlockID, fromViewId: string, toViewId: string) => {
    const block = getBlock(blockId)
    const targetView = getView(toViewId)
    
    if (!block || !targetView) {
      throw new Error('Block or target view not found')
    }

    // Add block to target view's root blocks
    const updatedRootBlocks = [...targetView.rootBlocks, block]
    await updateView(toViewId, { rootBlocks: updatedRootBlocks })
  }

  const getSharedBlocks = (viewId: string): Block[] => {
    const view = getView(viewId)
    if (!view) return []
    
    // Get all blocks used in other views
    const sharedBlocks: Block[] = []
    
    const collectBlocks = (blocks: Block[]) => {
      blocks.forEach(block => {
        const usage = getBlockUsage(block.id)
        if (usage.length > 1) { // Block is used in multiple views
          sharedBlocks.push(block)
        }
        if (block.children) {
          collectBlocks(block.children)
        }
      })
    }
    
    collectBlocks(view.rootBlocks)
    return sharedBlocks
  }

  const getBlockReferences = (blockId: BlockID): View[] => {
    const usageViewIds = getBlockUsage(blockId)
    return usageViewIds.map(viewId => getView(viewId)).filter(Boolean) as View[]
  }

  const duplicateBlockToView = async (blockId: BlockID, targetViewId: string): Promise<Block> => {
    const originalBlock = getBlock(blockId)
    const targetView = getView(targetViewId)
    
    if (!originalBlock || !targetView) {
      throw new Error('Block or target view not found')
    }

    // Clone the block
    const clonedBlock = await cloneBlock(blockId, `${originalBlock.canonical} (copy)`)
    
    // Add to target view
    const updatedRootBlocks = [...targetView.rootBlocks, clonedBlock]
    await updateView(targetViewId, { rootBlocks: updatedRootBlocks })
    
    return clonedBlock
  }

  // Real-time synchronization (simplified - in production would use WebSockets)
  const blockChangeSubscriptions = new Map<BlockID, Set<(block: Block) => void>>()

  const subscribeToBlockChanges = (blockId: BlockID, callback: (block: Block) => void) => {
    if (!blockChangeSubscriptions.has(blockId)) {
      blockChangeSubscriptions.set(blockId, new Set())
    }
    blockChangeSubscriptions.get(blockId)!.add(callback)
    
    return () => {
      const subscribers = blockChangeSubscriptions.get(blockId)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          blockChangeSubscriptions.delete(blockId)
        }
      }
    }
  }

  const broadcastBlockChange = (blockId: BlockID, updatedBlock: Block) => {
    const subscribers = blockChangeSubscriptions.get(blockId)
    if (subscribers) {
      subscribers.forEach(callback => callback(updatedBlock))
    }
    
    // Sync across all views
    syncBlockAcrossViews(blockId, updatedBlock)
  }

  const getBlockEditHistory = async (blockId: BlockID): Promise<unknown[]> => {
    // Simplified implementation - in production would track edit history
    const block = getBlock(blockId)
    if (!block) return []
    
    return [{
      id: '1',
      blockId,
      change: 'created',
      timestamp: block.createdAt,
      userId: block.createdBy,
      oldValue: null,
      newValue: block.canonical
    }]
  }

  const createBlockVariant = async (baseBlockId: BlockID, variantText: string): Promise<Block> => {
    const baseBlock = getBlock(baseBlockId)
    if (!baseBlock) {
      throw new Error('Base block not found')
    }

    // Create variant block
    const variantBlock = await cloneBlock(baseBlockId, variantText)
    
    // Create syntactic variant relationship
    await createVariant({
      base: baseBlockId,
      variant: variantBlock.id,
      variance: 0.1, // Simple similarity score
      transformation: ['text_substitution']
    })
    
    return variantBlock
  }

  const linkBlocks = async (blockId1: BlockID, blockId2: BlockID, relationship: string): Promise<void> => {
    // Create bidirectional relationship
    await createVariant({
      base: blockId1,
      variant: blockId2,
      variance: 0.0,
      transformation: [relationship]
    })
  }

  const contextValue: BlockShareContextType = {
    shareBlockBetweenViews,
    getSharedBlocks,
    getBlockReferences,
    duplicateBlockToView,
    subscribeToBlockChanges,
    broadcastBlockChange,
    getBlockEditHistory,
    createBlockVariant,
    linkBlocks
  }

  return (
    <BlockShareContext.Provider value={contextValue}>
      {children}
    </BlockShareContext.Provider>
  )
}