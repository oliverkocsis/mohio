import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Block, BlockID, View, SyntacticVariant, CreateBlockInput, UpdateBlockInput, CreateViewInput, UpdateViewInput, CreateSyntacticVariantInput, UserID, BlockStyle } from '../types';
import { getStorage } from '../storage';
import { createBlock } from '../utils/block-utils';

export interface BlockStore {
  // State
  blocks: Map<BlockID, Block>;
  views: Map<string, View>;
  variants: Map<string, SyntacticVariant>;
  currentView: View | null;
  currentUser: UserID;
  isLoading: boolean;
  error: string | null;

  // Block operations
  getBlock: (id: BlockID) => Block | null;
  getAllBlocks: () => Block[];
  createBlock: (input: CreateBlockInput) => Promise<Block>;
  updateBlock: (id: BlockID, input: UpdateBlockInput) => Promise<Block | null>;
  deleteBlock: (id: BlockID) => Promise<boolean>;
  
  // View operations
  getView: (id: string) => View | null;
  getAllViews: () => View[];
  createView: (input: CreateViewInput) => Promise<View>;
  updateView: (id: string, input: UpdateViewInput) => Promise<View | null>;
  deleteView: (id: string) => Promise<boolean>;
  setCurrentView: (view: View | null) => void;
  
  // Variant operations
  getVariant: (baseId: BlockID, variantId: BlockID) => SyntacticVariant | null;
  getAllVariants: () => SyntacticVariant[];
  createVariant: (input: CreateSyntacticVariantInput) => Promise<SyntacticVariant>;
  deleteVariant: (baseId: BlockID, variantId: BlockID) => Promise<boolean>;
  getVariantsForBlock: (blockId: BlockID) => SyntacticVariant[];
  getBaseBlocksForVariant: (variantId: BlockID) => SyntacticVariant[];
  
  // Utility operations
  loadInitialData: () => Promise<void>;
  setCurrentUser: (userId: UserID) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Block sharing and synchronization
  syncBlockAcrossViews: (blockId: BlockID, updatedBlock: Block) => void;
  getBlockUsage: (blockId: BlockID) => string[]; // Returns view IDs where block is used
  cloneBlock: (blockId: BlockID, newCanonical?: string) => Promise<Block>;
  
  // Editor integration
  getBlockFromEditor: (editorContent: string) => Block[];
  syncEditorWithBlocks: (viewId: string, editorContent: string) => Promise<void>;
}

export const useBlockStore = create<BlockStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        blocks: new Map(),
        views: new Map(),
        variants: new Map(),
        currentView: null,
        currentUser: 'default-user',
        isLoading: false,
        error: null,

        // Block operations
        getBlock: (id: BlockID) => {
          return get().blocks.get(id) || null;
        },

        getAllBlocks: () => {
          return Array.from(get().blocks.values());
        },

        createBlock: async (input: CreateBlockInput) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const block = await storage.createBlock(input);
            set((state) => ({
              ...state,
              blocks: new Map(state.blocks).set(block.id, block),
              isLoading: false
            }));
            return block;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create block',
              isLoading: false
            });
            throw error;
          }
        },

        updateBlock: async (id: BlockID, input: UpdateBlockInput) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const updatedBlock = await storage.updateBlock(id, input);
            if (updatedBlock) {
              set((state) => ({
                ...state,
                blocks: new Map(state.blocks).set(id, updatedBlock),
                isLoading: false
              }));
              
              // Sync across views if needed
              get().syncBlockAcrossViews(id, updatedBlock);
            }
            return updatedBlock;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update block',
              isLoading: false
            });
            throw error;
          }
        },

        deleteBlock: async (id: BlockID) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const success = await storage.deleteBlock(id);
            if (success) {
              set((state) => {
                const newBlocks = new Map(state.blocks);
                newBlocks.delete(id);
                return {
                  ...state,
                  blocks: newBlocks,
                  isLoading: false
                };
              });
            }
            return success;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete block',
              isLoading: false
            });
            throw error;
          }
        },

        // View operations
        getView: (id: string) => {
          return get().views.get(id) || null;
        },

        getAllViews: () => {
          return Array.from(get().views.values());
        },

        createView: async (input: CreateViewInput) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const view = await storage.createView(input);
            set((state) => ({
              ...state,
              views: new Map(state.views).set(view.id, view),
              isLoading: false
            }));
            return view;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create view',
              isLoading: false
            });
            throw error;
          }
        },

        updateView: async (id: string, input: UpdateViewInput) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const updatedView = await storage.updateView(id, input);
            if (updatedView) {
              set((state) => ({
                ...state,
                views: new Map(state.views).set(id, updatedView),
                currentView: state.currentView?.id === id ? updatedView : state.currentView,
                isLoading: false
              }));
            }
            return updatedView;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to update view',
              isLoading: false
            });
            throw error;
          }
        },

        deleteView: async (id: string) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const success = await storage.deleteView(id);
            if (success) {
              set((state) => {
                const newViews = new Map(state.views);
                newViews.delete(id);
                return {
                  ...state,
                  views: newViews,
                  currentView: state.currentView?.id === id ? null : state.currentView,
                  isLoading: false
                };
              });
            }
            return success;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete view',
              isLoading: false
            });
            throw error;
          }
        },

        setCurrentView: (view: View | null) => {
          set({ currentView: view });
        },

        // Variant operations
        getVariant: (baseId: BlockID, variantId: BlockID) => {
          const key = `${baseId}:${variantId}`;
          return get().variants.get(key) || null;
        },

        getAllVariants: () => {
          return Array.from(get().variants.values());
        },

        createVariant: async (input: CreateSyntacticVariantInput) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const variant = await storage.createSyntacticVariant(input);
            const key = `${variant.base}:${variant.variant}`;
            set((state) => ({
              ...state,
              variants: new Map(state.variants).set(key, variant),
              isLoading: false
            }));
            return variant;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to create variant',
              isLoading: false
            });
            throw error;
          }
        },

        deleteVariant: async (baseId: BlockID, variantId: BlockID) => {
          set({ isLoading: true, error: null });

          try {
            const storage = getStorage();
            const success = await storage.deleteSyntacticVariant(baseId, variantId);
            if (success) {
              const key = `${baseId}:${variantId}`;
              set((state) => {
                const newVariants = new Map(state.variants);
                newVariants.delete(key);
                return {
                  ...state,
                  variants: newVariants,
                  isLoading: false
                };
              });
            }
            return success;
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to delete variant',
              isLoading: false
            });
            throw error;
          }
        },

        getVariantsForBlock: (blockId: BlockID) => {
          return Array.from(get().variants.values()).filter(
            variant => variant.base === blockId || variant.variant === blockId
          );
        },

        getBaseBlocksForVariant: (variantId: BlockID) => {
          return Array.from(get().variants.values()).filter(
            variant => variant.variant === variantId
          );
        },

        // Utility operations
        loadInitialData: async () => {
          set({ isLoading: true, error: null });

          try {
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
              variants: variantsMap,
              isLoading: false
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Failed to load initial data',
              isLoading: false
            });
          }
        },

        setCurrentUser: (userId: UserID) => {
          set({ currentUser: userId });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Block sharing and synchronization
        syncBlockAcrossViews: (blockId: BlockID, updatedBlock: Block) => {
          set((state) => {
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

          views.forEach((view, viewId) => {
            if (searchBlocksRecursively(view.rootBlocks)) {
              usedInViews.push(viewId);
            }
          });

          return usedInViews;
        },

        cloneBlock: async (blockId: BlockID, newCanonical?: string) => {
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

        syncEditorWithBlocks: async (viewId: string, editorContent: string) => {
          const blocks = get().getBlockFromEditor(editorContent);
          const updateInput: UpdateViewInput = {
            rootBlocks: blocks
          };
          
          await get().updateView(viewId, updateInput);
        }
      }),
      {
        name: 'block-store',
        partialize: (state) => ({
          currentUser: state.currentUser,
          // Don't persist the entire state to avoid issues with Map serialization
          // The store will reload data from storage on initialization
        })
      }
    ),
    {
      name: 'block-store'
    }
  )
);