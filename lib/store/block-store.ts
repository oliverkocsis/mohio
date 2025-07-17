import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createBlockSlice, type BlockSlice } from './slices/block-slice';
import { createViewSlice, type ViewSlice } from './slices/view-slice';
import { createVariantSlice, type VariantSlice } from './slices/variant-slice';
import { createUtilitySlice, type UtilitySlice } from './slices/utility-slice';

// Combined store interface
export interface BlockStore extends BlockSlice, ViewSlice, VariantSlice, UtilitySlice {}

export const useBlockStore = create<BlockStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...createBlockSlice(set, get),
        ...createViewSlice(set, get),
        ...createVariantSlice(set, get),
        ...createUtilitySlice(set, get)
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