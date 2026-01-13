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

import '../app/global.css';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * Auth-aware navigation handler
 * Redirects users based on authentication state
 */
function useProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is initialized
    if (!isInitialized) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not signed in and trying to access protected route
      // Redirect to login
      router.replace('/(auth)/login' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // User is signed in but still in auth group
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments]);
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
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="serving-size"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
