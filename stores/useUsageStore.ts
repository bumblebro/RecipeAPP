/**
 * Usage Store
 * Tracks free tier usage limits with daily reset
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Free tier limits
export const FREE_TIER_LIMITS = {
  recipeExtractionsPerMonth: 3,
  maxSavedRecipes: 5,
  cookingSessionsPerMonth: 6,
};

interface UsageState {
  // Monthly counters (reset each month)
  recipeExtractions: number;
  cookingSessions: number;
  lastResetMonth: string; // ISO format YYYY-MM

  // Actions
  incrementRecipeExtractions: () => boolean; // Returns true if allowed, false if limit reached
  incrementCookingSessions: () => boolean;
  resetMonthlyCounters: () => void;
  checkAndResetIfNewMonth: () => void;
  clearUsage: () => void;
  setUsage: (extractions: number, sessions: number) => void;
  syncWithBackend: () => Promise<void>;

  // Getters
  getRemainingExtractions: () => number;
  getRemainingSessions: () => number;
  canExtractRecipe: () => boolean;
  canStartCookingSession: () => boolean;
}

const getCurrentMonthString = () => new Date().toISOString().substring(0, 7); // YYYY-MM

export const useUsageStore = create<UsageState>()(
  persist(
    (set, get) => ({
      recipeExtractions: 0,
      cookingSessions: 0,
      lastResetMonth: getCurrentMonthString(),

      checkAndResetIfNewMonth: () => {
        const currentMonth = getCurrentMonthString();
        const { lastResetMonth } = get();
        if (lastResetMonth !== currentMonth) {
          set({
            recipeExtractions: 0,
            cookingSessions: 0,
            lastResetMonth: currentMonth,
          });
        }
      },

      incrementRecipeExtractions: () => {
        get().checkAndResetIfNewMonth();
        const current = get().recipeExtractions;
        if (current >= FREE_TIER_LIMITS.recipeExtractionsPerMonth) {
          return false; // Limit reached
        }
        set({ recipeExtractions: current + 1 });
        return true;
      },

      incrementCookingSessions: () => {
        get().checkAndResetIfNewMonth();
        const current = get().cookingSessions;
        if (current >= FREE_TIER_LIMITS.cookingSessionsPerMonth) {
          return false; // Limit reached
        }
        set({ cookingSessions: current + 1 });
        return true;
      },

      resetMonthlyCounters: () => {
        set({
          recipeExtractions: 0,
          cookingSessions: 0,
          lastResetMonth: getCurrentMonthString(),
        });
      },

      getRemainingExtractions: () => {
        get().checkAndResetIfNewMonth();
        return Math.max(0, FREE_TIER_LIMITS.recipeExtractionsPerMonth - get().recipeExtractions);
      },

      getRemainingSessions: () => {
        get().checkAndResetIfNewMonth();
        return Math.max(0, FREE_TIER_LIMITS.cookingSessionsPerMonth - get().cookingSessions);
      },

      canExtractRecipe: () => {
        get().checkAndResetIfNewMonth();
        return get().recipeExtractions < FREE_TIER_LIMITS.recipeExtractionsPerMonth;
      },

      canStartCookingSession: () => {
        get().checkAndResetIfNewMonth();
        return get().cookingSessions < FREE_TIER_LIMITS.cookingSessionsPerMonth;
      },

      clearUsage: () => {
        set({
          recipeExtractions: 0,
          cookingSessions: 0,
          lastResetMonth: getCurrentMonthString(),
        });
      },

      setUsage: (extractions: number, sessions: number) => {
        set({
          recipeExtractions: extractions,
          cookingSessions: sessions,
        });
      },

      syncWithBackend: async () => {
        try {
          // Import here to avoid circular dependency issues if any
          const { recipeApi } = require('../features/recipe/recipe.api');
          const usage = await recipeApi.getUsage();
          
          if (usage) {
            set({
              recipeExtractions: usage.extraction.today, // Assuming 'today' field holds the monthly count based on recent backend changes
              cookingSessions: usage.cooking.today,
              // We don't update lastResetMonth here as backend handles reset logic
            });
          }
        } catch (error) {
          console.log('Failed to sync usage with backend:', error);
        }
      },
    }),
    {
      name: 'usage-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
