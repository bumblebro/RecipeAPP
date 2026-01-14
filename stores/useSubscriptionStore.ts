/**
 * Subscription Store
 * Manages subscription state with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionTier = 'free' | 'premium';

interface SubscriptionState {
  // State
  isSubscribed: boolean;
  currentTier: SubscriptionTier;
  expirationDate: string | null;
  isLoading: boolean;

  // Actions
  setSubscription: (tier: SubscriptionTier, expirationDate: string | null) => void;
  clearSubscription: () => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      isSubscribed: false,
      currentTier: 'free',
      expirationDate: null,
      isLoading: false,

      setSubscription: (tier, expirationDate) =>
        set({
          isSubscribed: tier !== 'free',
          currentTier: tier,
          expirationDate,
        }),

      clearSubscription: () =>
        set({
          isSubscribed: false,
          currentTier: 'free',
          expirationDate: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
