/**
 * Centralized error handling utility for Zustand store operations
 */
export const createErrorHandler = (set: any) => {
  return <T extends unknown[], R>(
    operation: (...args: T) => Promise<R>
  ) => async (...args: T): Promise<R> => {
    set({ isLoading: true, error: null });
    try {
      const result = await operation(...args);
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Operation failed',
        isLoading: false
      });
      throw error;
    }
  };
};