import { create } from 'zustand';

interface ExtractionState {
  isExtracting: boolean;
  setIsExtracting: (isExtracting: boolean) => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  isExtracting: false,
  setIsExtracting: (isExtracting) => set({ isExtracting }),
}));
