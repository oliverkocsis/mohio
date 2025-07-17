import { SyntacticVariant, BlockID, CreateSyntacticVariantInput } from '../../types';
import { getStorage } from '../../storage';
import { createErrorHandler } from '../utils/error-handler';

export interface VariantSlice {
  // State
  variants: Map<string, SyntacticVariant>;
  
  // Variant operations
  getVariant: (baseId: BlockID, variantId: BlockID) => SyntacticVariant | null;
  getAllVariants: () => SyntacticVariant[];
  createVariant: (input: CreateSyntacticVariantInput) => Promise<SyntacticVariant>;
  deleteVariant: (baseId: BlockID, variantId: BlockID) => Promise<boolean>;
  getVariantsForBlock: (blockId: BlockID) => SyntacticVariant[];
  getBaseBlocksForVariant: (variantId: BlockID) => SyntacticVariant[];
}

export const createVariantSlice = (set: any, get: any) => {
  const withErrorHandling = createErrorHandler(set);
  
  return {
    // Initial state
    variants: new Map(),

    // Variant operations
    getVariant: (baseId: BlockID, variantId: BlockID) => {
      const key = `${baseId}:${variantId}`;
      return get().variants.get(key) || null;
    },

    getAllVariants: () => {
      return Array.from(get().variants.values());
    },

    createVariant: withErrorHandling(async (input: CreateSyntacticVariantInput) => {
      const storage = getStorage();
      const variant = await storage.createSyntacticVariant(input);
      const key = `${variant.base}:${variant.variant}`;
      set((state: any) => ({
        ...state,
        variants: new Map(state.variants).set(key, variant)
      }));
      return variant;
    }),

    deleteVariant: withErrorHandling(async (baseId: BlockID, variantId: BlockID) => {
      const storage = getStorage();
      const success = await storage.deleteSyntacticVariant(baseId, variantId);
      if (success) {
        const key = `${baseId}:${variantId}`;
        set((state: any) => {
          const newVariants = new Map(state.variants);
          newVariants.delete(key);
          return {
            ...state,
            variants: newVariants
          };
        });
      }
      return success;
    }),

    getVariantsForBlock: (blockId: BlockID) => {
      return Array.from(get().variants.values()).filter(
        variant => variant.base === blockId || variant.variant === blockId
      );
    },

    getBaseBlocksForVariant: (variantId: BlockID) => {
      return Array.from(get().variants.values()).filter(
        variant => variant.variant === variantId
      );
    }
  };
};