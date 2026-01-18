import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  voiceEnabled: boolean;
  keepScreenAwake: boolean;
  
  setVoiceEnabled: (enabled: boolean) => void;
  setKeepScreenAwake: (enabled: boolean) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      keepScreenAwake: true,

      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setKeepScreenAwake: (enabled) => set({ keepScreenAwake: enabled }),
      clearSettings: () => set({
        voiceEnabled: true,
        keepScreenAwake: true,
      }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
