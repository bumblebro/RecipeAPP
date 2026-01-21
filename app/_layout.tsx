/**
 * Root Layout
 * Handles authentication routing, splash screen, and global providers
 */

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter,  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

import {
  useAuthStore,
  initializeAuthListener,
} from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
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
  const { hasCompletedOnboarding, _hasHydrated } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is initialized and settings are hydrated
    if (!isInitialized || !_hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and trying to access protected route
      // Redirect to login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated) {
      if (!hasCompletedOnboarding && !isOnboarding) {
        // Authenticated but hasn't done onboarding
        router.replace('/onboarding' as any);
      } else if (hasCompletedOnboarding && (inAuthGroup || isOnboarding)) {
        // Authenticated and done onboarding, but in auth/onboarding group
        // If we were just finishing onboarding, this will take us back to tabs
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isInitialized, _hasHydrated, segments, hasCompletedOnboarding]);
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
          <Stack.Screen name="onboarding" />
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
