/**
 * usePaywall Hook
 * Convenience hook for paywall access, subscription gating, and usage limit checking
 */

import { useCallback } from 'react';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore, FREE_TIER_LIMITS } from '../stores/useUsageStore';
import { useCookbookStore } from '../stores/useCookbookStore';

export function usePaywall() {
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const currentTier = useSubscriptionStore((s) => s.currentTier);

  // Usage tracking
  const canExtractRecipe = useUsageStore((s) => s.canExtractRecipe);
  const canStartCookingSession = useUsageStore((s) => s.canStartCookingSession);
  const incrementRecipeExtractions = useUsageStore((s) => s.incrementRecipeExtractions);
  const incrementCookingSessions = useUsageStore((s) => s.incrementCookingSessions);
  const getRemainingExtractions = useUsageStore((s) => s.getRemainingExtractions);
  const getRemainingSessions = useUsageStore((s) => s.getRemainingSessions);

  // Cookbook store for saved recipes limit
  const recipes = useCookbookStore((s) => s.recipes);
  const savedRecipeCount = Object.keys(recipes).length;

  const showPaywall = useCallback(() => {
    router.push('/paywall');
  }, []);

  const requireSubscription = useCallback(
    (callback: () => void) => {
      if (isSubscribed) {
        callback();
      } else {
        showPaywall();
      }
    },
    [isSubscribed, showPaywall]
  );

  /**
   * Validate if user can extract a recipe (check limit only)
   */
  const validateRecipeExtraction = useCallback((): boolean => {
    if (isSubscribed) return true;

    if (!canExtractRecipe()) {
      Alert.alert(
        'Monthly Limit Reached',
        `You've used all ${FREE_TIER_LIMITS.recipeExtractionsPerMonth} free recipe extractions for this month. Upgrade to Premium for unlimited access!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: showPaywall },
        ]
      );
      return false;
    }
    return true;
  }, [isSubscribed, canExtractRecipe, showPaywall]);

  /**
   * Record a successful extraction and handle paywall trigger
   */
  const recordSuccessfulExtraction = useCallback(() => {
    if (isSubscribed) return;

    // Check if this is the first extraction before incrementing
    const isFirstExtraction = useUsageStore.getState().recipeExtractions === 0;
    const success = incrementRecipeExtractions();

    if (success && isFirstExtraction) {
      // Show paywall after a short delay so user can see the extraction result first
      setTimeout(() => {
        showPaywall();
      }, 1500);
    }
  }, [isSubscribed, showPaywall, incrementRecipeExtractions]);

  /**
   * Validate if user can start a cooking session (check limit only)
   */
  const validateCookingSession = useCallback((): boolean => {
    if (isSubscribed) return true;

    if (!canStartCookingSession()) {
      Alert.alert(
        'Monthly Limit Reached',
        `You've used all ${FREE_TIER_LIMITS.cookingSessionsPerMonth} free cooking sessions for this month. Upgrade to Premium for unlimited access!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: showPaywall },
        ]
      );
      return false;
    }
    return true;
  }, [isSubscribed, canStartCookingSession, showPaywall]);

  /**
   * Record a successful cooking session
   */
  const recordSuccessfulCookingSession = useCallback(() => {
    if (isSubscribed) return;
    incrementCookingSessions();
  }, [isSubscribed, incrementCookingSessions]);

  /**
   * Check if user can save a recipe (max 5 for free users)
   * Shows paywall if limit reached
   */
  const checkCanSaveRecipe = useCallback((): boolean => {
    if (isSubscribed) return true;

    if (savedRecipeCount >= FREE_TIER_LIMITS.maxSavedRecipes) {
      Alert.alert(
        'Recipe Limit Reached',
        `You can only save ${FREE_TIER_LIMITS.maxSavedRecipes} recipes on the free plan. Upgrade to Premium for unlimited saved recipes!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: showPaywall },
        ]
      );
      return false;
    }

    return true;
  }, [isSubscribed, savedRecipeCount, showPaywall]);

  return {
    // State
    isSubscribed,
    currentTier,
    
    // Remaining usage (for display in UI)
    remainingExtractions: isSubscribed ? Infinity : getRemainingExtractions(),
    remainingSessions: isSubscribed ? Infinity : getRemainingSessions(),
    remainingSavedRecipes: isSubscribed ? Infinity : Math.max(0, FREE_TIER_LIMITS.maxSavedRecipes - savedRecipeCount),
    
    // Actions
    showPaywall,
    requireSubscription,
    
    // Usage-aware actions
    validateRecipeExtraction,
    recordSuccessfulExtraction,
    validateCookingSession,
    recordSuccessfulCookingSession,
    checkCanSaveRecipe,
  };
}
