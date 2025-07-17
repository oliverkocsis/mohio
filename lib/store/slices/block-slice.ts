import { Block, BlockID, CreateBlockInput, UpdateBlockInput, UserID } from '../../types';
import { getStorage } from '../../storage';
import { createErrorHandler } from '../utils/error-handler';

export interface BlockSlice {
  // State
  blocks: Map<BlockID, Block>;
  
  // Block operations
  getBlock: (id: BlockID) => Block | null;
  getAllBlocks: () => Block[];
  createBlock: (input: CreateBlockInput) => Promise<Block>;
  updateBlock: (id: BlockID, input: UpdateBlockInput) => Promise<Block | null>;
  deleteBlock: (id: BlockID) => Promise<boolean>;
  cloneBlock: (blockId: BlockID, newCanonical?: string) => Promise<Block>;
  
  // Block sharing and synchronization
  syncBlockAcrossViews: (blockId: BlockID, updatedBlock: Block) => void;
  getBlockUsage: (blockId: BlockID) => string[];
}

export const createBlockSlice = (set: any, get: any) => {
  const withErrorHandling = createErrorHandler(set);
  
  return {
    // Initial state
    blocks: new Map(),

    // Block operations
    getBlock: (id: BlockID) => {
      return get().blocks.get(id) || null;
    },

    getAllBlocks: () => {
      return Array.from(get().blocks.values());
    },

    createBlock: withErrorHandling(async (input: CreateBlockInput) => {
      const storage = getStorage();
      const block = await storage.createBlock(input);
      set((state: any) => ({
        ...state,
        blocks: new Map(state.blocks).set(block.id, block)
      }));
      return block;
    }),

    updateBlock: withErrorHandling(async (id: BlockID, input: UpdateBlockInput) => {
      const storage = getStorage();
      const updatedBlock = await storage.updateBlock(id, input);
      if (updatedBlock) {
        set((state: any) => ({
          ...state,
          blocks: new Map(state.blocks).set(id, updatedBlock)
        }));
        
        // Sync across views if needed
        get().syncBlockAcrossViews(id, updatedBlock);
      }
      return updatedBlock;
    }),

    deleteBlock: withErrorHandling(async (id: BlockID) => {
      const storage = getStorage();
      const success = await storage.deleteBlock(id);
      if (success) {
        set((state: any) => {
          const newBlocks = new Map(state.blocks);
          newBlocks.delete(id);
          return {
            ...state,
            blocks: newBlocks
          };
        });
      }
      return success;
    }),

    cloneBlock: withErrorHandling(async (blockId: BlockID, newCanonical?: string) => {
      const originalBlock = get().getBlock(blockId);
      if (!originalBlock) {
        throw new Error('Block not found');
      }

      const clonedInput: CreateBlockInput = {
        canonical: newCanonical || originalBlock.canonical,
        html: originalBlock.html,
        style: originalBlock.style,
        children: originalBlock.children ? [...originalBlock.children] : undefined,
        createdBy: get().currentUser
      };

      return await get().createBlock(clonedInput);
    }),

    // Block sharing and synchronization
    syncBlockAcrossViews: (blockId: BlockID, updatedBlock: Block) => {
      set((state: any) => {
        const updateBlocksRecursively = (blocks: Block[]): Block[] => {
          return blocks.map(block => {
            if (block.id === blockId) {
              return { ...updatedBlock };
            }
            if (block.children) {
              return { ...block, children: updateBlocksRecursively(block.children) };
            }
            return block;
          });
        };

        const newViews = new Map(state.views);
        newViews.forEach((view) => {
          view.rootBlocks = updateBlocksRecursively(view.rootBlocks);
        });

        const updatedCurrentView = state.currentView && newViews.get(state.currentView.id);

        return {
          ...state,
          views: newViews,
          currentView: updatedCurrentView || state.currentView
        };
      });
    },

    getBlockUsage: (blockId: BlockID) => {
      const usedInViews: string[] = [];
      const views = get().views;
      
      const searchBlocksRecursively = (blocks: Block[]): boolean => {
        return blocks.some(block => {
          if (block.id === blockId) {
            return true;
          }
          if (block.children) {
            return searchBlocksRecursively(block.children);
          }
          return false;
        });
      };

      views.forEach((view: any, viewId: string) => {
        if (searchBlocksRecursively(view.rootBlocks)) {
          usedInViews.push(viewId);
        }
      });

      return usedInViews;
    }
  };
};