/**
 * useAuth Hook
 * Provides authentication actions and state for components
 */

import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../stores/useAuthStore';
import { AuthService } from '../features/auth/auth.service';
import { AuthResponse, AuthUser, AuthError } from '../types/auth';

interface UseAuthReturn {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  isAppleAuthAvailable: boolean;

  // Actions
  login: (email: string, password: string) => Promise<AuthResponse<AuthUser>>;
  register: (email: string, password: string, displayName?: string) => Promise<AuthResponse<AuthUser>>;
  loginWithGoogle: () => Promise<AuthResponse<AuthUser>>;
  loginWithApple: () => Promise<AuthResponse<AuthUser>>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse<void>>;
  clearError: () => void;
}

/**
 * Custom hook for authentication
 * Provides all auth operations with loading states and error handling
 */
export function useAuth(): UseAuthReturn {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    setLoading,
    setError,
    clearError,
    reset,
  } = useAuthStore();

  // Check if Apple auth is available (iOS only)
  const isAppleAuthAvailable = useMemo(() => Platform.OS === 'ios', []);

  /**
   * Email/password login
   */
  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse<AuthUser>> => {
      setLoading(true);
      clearError();

      const result = await AuthService.login(email, password);

      if (result.error) {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)' as any);
      }

      setLoading(false);
      return result;
    },
    [setLoading, setError, clearError]
  );

  /**
   * Email/password registration
   */
  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string
    ): Promise<AuthResponse<AuthUser>> => {
      setLoading(true);
      clearError();

      const result = await AuthService.register(email, password, displayName);

      if (result.error) {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)' as any);
      }

      setLoading(false);
      return result;
    },
    [setLoading, setError, clearError]
  );

  /**
   * Google Sign-In
   */
  const loginWithGoogle = useCallback(async (): Promise<AuthResponse<AuthUser>> => {
    setLoading(true);
    clearError();

    const result = await AuthService.loginWithGoogle();

    if (result.error) {
      // Don't show error for user cancellation
      if (result.error.code !== 'auth/google-signin-cancelled') {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)' as any);
    }

    setLoading(false);
    return result;
  }, [setLoading, setError, clearError]);

  /**
   * Apple Sign-In
   */
  const loginWithApple = useCallback(async (): Promise<AuthResponse<AuthUser>> => {
    setLoading(true);
    clearError();

    const result = await AuthService.loginWithApple();

    if (result.error) {
      // Don't show error for user cancellation
      if (result.error.code !== 'auth/apple-signin-cancelled') {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)' as any);
    }

    setLoading(false);
    return result;
  }, [setLoading, setError, clearError]);

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);

    await AuthService.logout();
    reset();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(auth)/login' as any);
  }, [setLoading, reset]);

  /**
   * Password reset
   */
  const resetPassword = useCallback(
    async (email: string): Promise<AuthResponse<void>> => {
      setLoading(true);
      clearError();

      const result = await AuthService.resetPassword(email);

      if (result.error) {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setLoading(false);
      return result;
    },
    [setLoading, setError, clearError]
  );

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    isAppleAuthAvailable,

    // Actions
    login,
    register,
    loginWithGoogle,
    loginWithApple,
    logout,
    resetPassword,
    clearError,
  };
}

export default useAuth;
