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
import { revenueCatService } from '../lib/revenuecat-service';

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
  const segments = useSegments();
  const router = useRouter();
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

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
      
      // Show paywall after login for non-subscribers (after a short delay to let navigation complete)
      if (!isSubscribed && !hasShownPaywall) {
        setHasShownPaywall(true);
        setTimeout(() => {
          router.push('/paywall');
        }, 500);
      }
    }
  }, [isAuthenticated, isInitialized, segments, isSubscribed, hasShownPaywall]);
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

        // Check current subscription status
        const customerInfo = await revenueCatService.getCustomerInfo();
        const isActive = customerInfo.entitlements.active['premium'] !== undefined;

        if (isActive) {
          const expiration = customerInfo.entitlements.active['premium']?.expirationDate;
          useSubscriptionStore.getState().setSubscription('premium', expiration || null);
        }
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
          presentation: 'modal',
          animation: 'slide_from_bottom',
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
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
