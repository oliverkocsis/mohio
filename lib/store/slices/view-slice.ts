import { View, CreateViewInput, UpdateViewInput } from '../../types';
import { getStorage } from '../../storage';
import { createErrorHandler } from '../utils/error-handler';

export interface ViewSlice {
  // State
  views: Map<string, View>;
  currentView: View | null;
  
  // View operations
  getView: (id: string) => View | null;
  getAllViews: () => View[];
  createView: (input: CreateViewInput) => Promise<View>;
  updateView: (id: string, input: UpdateViewInput) => Promise<View | null>;
  deleteView: (id: string) => Promise<boolean>;
  setCurrentView: (view: View | null) => void;
}

export const createViewSlice = (set: any, get: any) => {
  const withErrorHandling = createErrorHandler(set);
  
  return {
    // Initial state
    views: new Map(),
    currentView: null,

    // View operations
    getView: (id: string) => {
      return get().views.get(id) || null;
    },

    getAllViews: (): View[] => {
      return Array.from(get().views.values()) as View[];
    },

    createView: withErrorHandling(async (input: CreateViewInput) => {
      const storage = getStorage();
      const view = await storage.createView(input);
      set((state: any) => ({
        ...state,
        views: new Map(state.views).set(view.id, view)
      }));
      return view;
    }),

    updateView: withErrorHandling(async (id: string, input: UpdateViewInput) => {
      const storage = getStorage();
      const updatedView = await storage.updateView(id, input);
      if (updatedView) {
        set((state: any) => ({
          ...state,
          views: new Map(state.views).set(id, updatedView),
          currentView: state.currentView?.id === id ? updatedView : state.currentView
        }));
      }
      return updatedView;
    }),

    deleteView: withErrorHandling(async (id: string) => {
      const storage = getStorage();
      const success = await storage.deleteView(id);
      if (success) {
        set((state: any) => {
          const newViews = new Map(state.views);
          newViews.delete(id);
          return {
            ...state,
            views: newViews,
            currentView: state.currentView?.id === id ? null : state.currentView
          };
        });
      }
      return success;
    }),

    setCurrentView: (view: View | null) => {
      set({ currentView: view });
    }
  };
};