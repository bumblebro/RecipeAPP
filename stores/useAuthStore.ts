/**
 * Authentication State Store
 * Zustand store for managing authentication state with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStore, AuthState, AuthUser, AuthError } from '../types/auth';
import { AuthService } from '../features/auth/auth.service';
import { revenueCatService } from '../lib/revenuecat-service';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

/**
 * Auth store with persistence
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      ...initialState,

      // Actions
      setUser: (user: AuthUser | null) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setInitialized: (isInitialized: boolean) => {
        set({ isInitialized });
      },

      setError: (error: AuthError | null) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Initialize auth state listener
 * Call this once when the app starts
 */
let authListenerUnsubscribe: (() => void) | null = null;

export function initializeAuthListener(): () => void {
  const store = useAuthStore.getState();

  // Prevent multiple listeners
  if (authListenerUnsubscribe) {
    return authListenerUnsubscribe;
  }

  // Set loading while initializing
  store.setLoading(true);

  // Configure Google Sign-In
  AuthService.configureGoogleSignIn();

  // Subscribe to auth state changes
  authListenerUnsubscribe = AuthService.onAuthStateChanged((user) => {
    const currentStore = useAuthStore.getState();
    currentStore.setUser(user);
    currentStore.setLoading(false);
    currentStore.setInitialized(true);

    // Sync with RevenueCat
    if (user) {
      revenueCatService.loginUser(user.uid).catch(e => 
        console.error('Failed to sync RevenueCat user:', e)
      );
    } else {
      revenueCatService.logoutUser().catch(e => 
        console.error('Failed to logout RevenueCat user:', e)
      );
    }
  });

  return () => {
    if (authListenerUnsubscribe) {
      authListenerUnsubscribe();
      authListenerUnsubscribe = null;
    }
  };
}

/**
 * Cleanup auth listener
 */
export function cleanupAuthListener(): void {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
    authListenerUnsubscribe = null;
  }
}
