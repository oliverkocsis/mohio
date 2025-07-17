import { Block, BlockStyle, UserID, UpdateViewInput } from '../../types';
import { getStorage } from '../../storage';
import { createBlock } from '../../utils/block-utils';
import { createErrorHandler } from '../utils/error-handler';

export interface UtilitySlice {
  // State
  currentUser: UserID;
  isLoading: boolean;
  error: string | null;
  
  // Utility operations
  loadInitialData: () => Promise<void>;
  setCurrentUser: (userId: UserID) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Editor integration
  getBlockFromEditor: (editorContent: string) => Block[];
  syncEditorWithBlocks: (viewId: string, editorContent: string) => Promise<void>;
}

export const createUtilitySlice = (set: any, get: any) => {
  const withErrorHandling = createErrorHandler(set);
  
  return {
    // Initial state
    currentUser: 'default-user',
    isLoading: false,
    error: null,

    // Utility operations
    loadInitialData: withErrorHandling(async () => {
      const storage = getStorage();
      const [blocks, views, variants] = await Promise.all([
        storage.getAllBlocks(),
        storage.getAllViews(),
        storage.getAllSyntacticVariants()
      ]);

      const blocksMap = new Map();
      const viewsMap = new Map();
      const variantsMap = new Map();

      blocks.forEach(block => blocksMap.set(block.id, block));
      views.forEach(view => viewsMap.set(view.id, view));
      variants.forEach(variant => {
        const key = `${variant.base}:${variant.variant}`;
        variantsMap.set(key, variant);
      });

      set({
        blocks: blocksMap,
        views: viewsMap,
        variants: variantsMap
      });
    }),

    setCurrentUser: (userId: UserID) => {
      set({ currentUser: userId });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    // Editor integration
    getBlockFromEditor: (editorContent: string) => {
      // Parse HTML content and convert to blocks
      // This is a simplified implementation - in practice, you'd want more sophisticated HTML parsing
      const blocks: Block[] = [];
      
      // Only run DOM manipulation in browser environment
      if (typeof window !== 'undefined') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorContent;
        
        const elements = tempDiv.children;
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const blockData = createBlock(
            element.textContent || '',
            element.outerHTML,
            {
              format: element.tagName.toLowerCase() as BlockStyle['format']
            },
            undefined,
            get().currentUser
          );
          
          const block: Block = {
            id: `block-${Date.now()}-${i}`,
            ...blockData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          blocks.push(block);
        }
      }
      
      return blocks;
    },

    syncEditorWithBlocks: withErrorHandling(async (viewId: string, editorContent: string) => {
      const blocks = get().getBlockFromEditor(editorContent);
      const updateInput: UpdateViewInput = {
        rootBlocks: blocks
      };
      
      await get().updateView(viewId, updateInput);
    })
  };
};