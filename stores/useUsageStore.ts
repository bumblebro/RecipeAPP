/**
 * Usage Store
 * Tracks free tier usage limits with daily reset
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Free tier limits
export const FREE_TIER_LIMITS = {
  recipeExtractionsPerDay: 3,
  maxSavedRecipes: 5,
  cookingSessionsPerDay: 3,
};

interface UsageState {
  // Daily counters (reset each day)
  recipeExtractions: number;
  cookingSessions: number;
  lastResetDate: string; // ISO date string YYYY-MM-DD

  // Actions
  incrementRecipeExtractions: () => boolean; // Returns true if allowed, false if limit reached
  incrementCookingSessions: () => boolean;
  resetDailyCounters: () => void;
  checkAndResetIfNewDay: () => void;

  // Getters
  getRemainingExtractions: () => number;
  getRemainingSessions: () => number;
  canExtractRecipe: () => boolean;
  canStartCookingSession: () => boolean;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      recipeExtractions: 0,
      cookingSessions: 0,
      lastResetDate: getTodayString(),

      checkAndResetIfNewDay: () => {
        const today = getTodayString();
        const { lastResetDate } = get();
        if (lastResetDate !== today) {
          set({
            recipeExtractions: 0,
            cookingSessions: 0,
            lastResetDate: today,
          });
        }
      },

      incrementRecipeExtractions: () => {
        get().checkAndResetIfNewDay();
        const current = get().recipeExtractions;
        if (current >= FREE_TIER_LIMITS.recipeExtractionsPerDay) {
          return false; // Limit reached
        }
        set({ recipeExtractions: current + 1 });
        return true;
      },

      incrementCookingSessions: () => {
        get().checkAndResetIfNewDay();
        const current = get().cookingSessions;
        if (current >= FREE_TIER_LIMITS.cookingSessionsPerDay) {
          return false; // Limit reached
        }
        set({ cookingSessions: current + 1 });
        return true;
      },

      resetDailyCounters: () => {
        set({
          recipeExtractions: 0,
          cookingSessions: 0,
          lastResetDate: getTodayString(),
        });
      },

      getRemainingExtractions: () => {
        get().checkAndResetIfNewDay();
        return Math.max(0, FREE_TIER_LIMITS.recipeExtractionsPerDay - get().recipeExtractions);
      },

      getRemainingSessions: () => {
        get().checkAndResetIfNewDay();
        return Math.max(0, FREE_TIER_LIMITS.cookingSessionsPerDay - get().cookingSessions);
      },

      canExtractRecipe: () => {
        get().checkAndResetIfNewDay();
        return get().recipeExtractions < FREE_TIER_LIMITS.recipeExtractionsPerDay;
      },

      canStartCookingSession: () => {
        get().checkAndResetIfNewDay();
        return get().cookingSessions < FREE_TIER_LIMITS.cookingSessionsPerDay;
      },
    }),
    {
      name: 'usage-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
