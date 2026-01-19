/**
 * Root Layout
 * Handles authentication routing, splash screen, and global providers
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';

import { useAuthStore, initializeAuthListener } from '../stores/useAuthStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useUsageStore, FREE_TIER_LIMITS } from '../stores/useUsageStore';
import { revenueCatService } from '../lib/revenuecat-service';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '../components/AlertProvider';

import '../app/global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Auth-aware navigation handler
 * Redirects users based on authentication state
 * Shows paywall after login for non-subscribers
 */
function useProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const isSubscribed = useSubscriptionStore((s) => s.isSubscribed);
  const { recipeExtractions, cookingSessions } = useUsageStore();
  const segments = useSegments();
  const router = useRouter();
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

  const limitsCrossed = recipeExtractions >= FREE_TIER_LIMITS.recipeExtractionsPerMonth ||
    cookingSessions >= FREE_TIER_LIMITS.cookingSessionsPerMonth;

  useEffect(() => {
    // Wait until auth state is initialized
    if (!isInitialized) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inPaywall = segments.includes('paywall' as never);

    if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and trying to access protected route
      // Redirect to login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // User is signed in but still in auth group
      // Redirect to main app
      router.replace('/(tabs)');
    } else if (isAuthenticated && !inAuthGroup && !inPaywall && !isSubscribed && limitsCrossed && !hasShownPaywall) {
      // User is logged in, not on paywall, and has crossed limits
      // Show paywall on app open/install
      setHasShownPaywall(true);
      setTimeout(() => {
        router.push('/paywall');
      }, 800);
    }
  }, [isAuthenticated, isInitialized, segments, isSubscribed, hasShownPaywall, limitsCrossed]);
}

export default function RootLayout() {
  const { isInitialized } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initializeAuthListener();

    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await revenueCatService.initialize();

        // Check current subscription status using centralized logic
        await revenueCatService.checkSubscriptionStatus();
      } catch (error) {
        console.error('RevenueCat init error:', error);
      }
    };

    initRevenueCat();
  }, []);

  // Handle app ready state
  useEffect(() => {
    if (fontsLoaded && isInitialized) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isInitialized]);

  // Use protected route hook
  useProtectedRoute();

  // Show loading while app is not ready
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AlertProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: {
              backgroundColor: '#0a0a0a',
            },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="recipe-preview"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="recipe"
            options={{
              title: "Cooking Mode",
            }}
          />
          <Stack.Screen
            name="serving-size"
            options={{
              title: "Serving Size",
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
