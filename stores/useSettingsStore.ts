import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  voiceEnabled: boolean;
  keepScreenAwake: boolean;
  hasCompletedOnboarding: boolean;
  _hasHydrated: boolean;
  
  setVoiceEnabled: (enabled: boolean) => void;
  setKeepScreenAwake: (enabled: boolean) => void;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  clearSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      keepScreenAwake: true,
      hasCompletedOnboarding: false,
      _hasHydrated: false,

      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setKeepScreenAwake: (enabled) => set({ keepScreenAwake: enabled }),
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      clearSettings: () => set({
        voiceEnabled: true,
        keepScreenAwake: true,
        hasCompletedOnboarding: false,
      }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
