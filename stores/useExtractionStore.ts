import { create } from 'zustand';

interface ExtractionState {
  isExtracting: boolean;
  isAddModalVisible: boolean;
  setIsExtracting: (isExtracting: boolean) => void;
  setAddModalVisible: (visible: boolean) => void;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  isExtracting: false,
  isAddModalVisible: false,
  setIsExtracting: (isExtracting) => set({ isExtracting }),
  setAddModalVisible: (visible) => set({ isAddModalVisible: visible }),
}));
