/**
 * Authentication Service
 * Handles all Firebase Auth operations including email/password and social login
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { AuthUser, AuthResponse, AuthProvider } from '../../types/auth';
import { createAuthError } from './auth.errors';

// ============================================
// Configuration
// ============================================

/**
 * Configure Google Sign-In with web client ID from Firebase Console
 * Call this in your app's entry point (App.tsx or _layout.tsx)
 */
export function configureGoogleSignIn(): void {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  
  if (!webClientId) {
    console.warn(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. Google Sign-In will not work.'
    );
    return;
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Maps Firebase user to our AuthUser type
 */
function mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber,
    providerId: firebaseUser.providerId,
    createdAt: firebaseUser.metadata?.creationTime,
  };
}

/**
 * Creates a success response
 */
function successResponse<T>(data: T): AuthResponse<T> {
  return { success: true, data, error: null };
}

/**
 * Creates an error response
 */
function errorResponse(error: unknown): AuthResponse<null> {
  return { success: false, data: null, error: createAuthError(error) };
}

// ============================================
// Email/Password Authentication
// ============================================

/**
 * Sign in with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse<AuthUser>> {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(
      email.trim(),
      password
    );
    return successResponse(mapFirebaseUser(userCredential.user));
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(error);
  }
}

/**
 * Create a new account with email and password
 */
export async function register(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResponse<AuthUser>> {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email.trim(),
      password
    );

    // Update display name if provided
    if (displayName) {
      await userCredential.user.updateProfile({
        displayName: displayName.trim(),
      });
      // Reload user to get updated profile
      await userCredential.user.reload();
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not found after registration');
    }

    return successResponse(mapFirebaseUser(currentUser));
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(error);
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse<void>> {
  try {
    await auth().sendPasswordResetEmail(email.trim());
    return { success: true, data: undefined, error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(error);
  }
}

// ============================================
// Google Sign-In
// ============================================

/**
 * Sign in with Google
 */
export async function loginWithGoogle(): Promise<AuthResponse<AuthUser>> {
  try {
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the user's ID token
    const signInResult = await GoogleSignin.signIn();

    // Get the ID token
    const idToken = signInResult.data?.idToken;

    if (!idToken) {
      throw { code: 'auth/google-signin-failed', message: 'No ID token returned' };
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    return successResponse(mapFirebaseUser(userCredential.user));
  } catch (error: unknown) {
    console.error('Google Sign-In error:', error);

    // Handle specific Google Sign-In errors
    const errorWithCode = error as { code?: string | number };
    if (errorWithCode.code === statusCodes.SIGN_IN_CANCELLED) {
      return errorResponse({ code: 'auth/google-signin-cancelled' });
    }
    if (errorWithCode.code === statusCodes.IN_PROGRESS) {
      return errorResponse({ code: 'auth/google-signin-failed', message: 'Sign in already in progress' });
    }
    if (errorWithCode.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return errorResponse({ code: 'auth/google-signin-failed', message: 'Play Services not available' });
    }

    return errorResponse(error);
  }
}

// ============================================
// Apple Sign-In
// ============================================

/**
 * Check if Apple Sign-In is available (iOS only)
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return await AppleAuthentication.isAvailableAsync();
}

/**
 * Sign in with Apple
 */
export async function loginWithApple(): Promise<AuthResponse<AuthUser>> {
  try {
    // Check availability
    const isAvailable = await isAppleAuthAvailable();
    if (!isAvailable) {
      throw { code: 'auth/apple-signin-failed', message: 'Apple Sign-In is not available on this device' };
    }

    // Generate a random nonce for security
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    // Request Apple Sign-In
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
      nonce: hashedNonce,
    });

    // Ensure we got an identity token
    if (!appleCredential.identityToken) {
      throw { code: 'auth/apple-signin-no-token' };
    }

    // Create Firebase credential from Apple credential
    const firebaseCredential = auth.AppleAuthProvider.credential(
      appleCredential.identityToken,
      nonce
    );

    // Sign in with Firebase
    const userCredential = await auth().signInWithCredential(firebaseCredential);

    // Apple may only provide name on first sign-in, so update if available
    if (appleCredential.fullName?.givenName || appleCredential.fullName?.familyName) {
      const displayName = [
        appleCredential.fullName?.givenName,
        appleCredential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(' ');

      if (displayName && !userCredential.user.displayName) {
        await userCredential.user.updateProfile({ displayName });
        await userCredential.user.reload();
      }
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not found after Apple Sign-In');
    }

    return successResponse(mapFirebaseUser(currentUser));
  } catch (error: unknown) {
    console.error('Apple Sign-In error:', error);

    // Handle specific Apple Sign-In errors
    const errorWithCode = error as { code?: string };
    if (errorWithCode.code === 'ERR_REQUEST_CANCELED') {
      return errorResponse({ code: 'auth/apple-signin-cancelled' });
    }

    return errorResponse(error);
  }
}

// ============================================
// Session Management
// ============================================

/**
 * Sign out the current user
 */
export async function logout(): Promise<AuthResponse<void>> {
  try {
    // Sign out from Firebase
    await auth().signOut();

    // Also sign out from Google if signed in
    try {
      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      if (isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Ignore Google sign-out errors
    }

    return { success: true, data: undefined, error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(error);
  }
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): AuthUser | null {
  const firebaseUser = auth().currentUser;
  return firebaseUser ? mapFirebaseUser(firebaseUser) : null;
}

/**
 * Subscribe to authentication state changes
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChanged(
  callback: (user: AuthUser | null) => void
): () => void {
  return auth().onAuthStateChanged((firebaseUser) => {
    callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
  });
}

/**
 * Subscribe to ID token changes (more reliable for session management)
 * @param callback - Function called when token changes
 * @returns Unsubscribe function
 */
export function onIdTokenChanged(
  callback: (user: AuthUser | null) => void
): () => void {
  return auth().onIdTokenChanged((firebaseUser) => {
    callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
  });
}

// ============================================
// Export Service Object
// ============================================

export const AuthService = {
  // Configuration
  configureGoogleSignIn,
  
  // Email/Password
  login,
  register,
  resetPassword,
  
  // Social Login
  loginWithGoogle,
  loginWithApple,
  isAppleAuthAvailable,
  
  // Session
  logout,
  getCurrentUser,
  onAuthStateChanged,
  onIdTokenChanged,
};

export default AuthService;
