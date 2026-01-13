/**
 * Human-readable error messages for Firebase Auth error codes
 */

// Firebase Auth error code to user-friendly message mapping
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Email/Password errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
  
  // Account status errors
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/account-exists-with-different-credential': 
    'An account already exists with this email using a different sign-in method.',
  
  // Rate limiting
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  
  // Network errors
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
  'auth/internal-error': 'An unexpected error occurred. Please try again.',
  
  // OAuth errors
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
  
  // Google Sign-In errors
  'auth/google-signin-cancelled': 'Google Sign-In was cancelled.',
  'auth/google-signin-failed': 'Google Sign-In failed. Please try again.',
  
  // Apple Sign-In errors
  'auth/apple-signin-cancelled': 'Apple Sign-In was cancelled.',
  'auth/apple-signin-failed': 'Apple Sign-In failed. Please try again.',
  'auth/apple-signin-no-token': 'Apple Sign-In failed - no identity token received.',
  
  // Password reset errors
  'auth/expired-action-code': 'This password reset link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This password reset link is invalid. Please request a new one.',
  
  // General errors
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  
  // Default
  'default': 'An unexpected error occurred. Please try again.',
};

/**
 * Converts a Firebase Auth error code to a user-friendly message
 * @param errorCode - The Firebase error code (e.g., 'auth/user-not-found')
 * @returns A user-friendly error message
 */
export function getAuthErrorMessage(errorCode: string): string {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES['default'];
}

/**
 * Extracts the error code from various error formats
 * @param error - The error object from Firebase or other sources
 * @returns The error code string
 */
export function extractErrorCode(error: unknown): string {
  if (!error) return 'default';
  
  // Firebase error object
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Firebase Auth error format
    if (typeof errorObj.code === 'string') {
      return errorObj.code;
    }
    
    // Some errors have nested userInfo
    if (errorObj.userInfo && typeof errorObj.userInfo === 'object') {
      const userInfo = errorObj.userInfo as Record<string, unknown>;
      if (typeof userInfo.code === 'string') {
        return userInfo.code;
      }
    }
    
    // Error message parsing for some edge cases
    if (typeof errorObj.message === 'string') {
      const message = errorObj.message;
      
      // Try to extract auth/ code from message
      const authCodeMatch = message.match(/auth\/[\w-]+/);
      if (authCodeMatch) {
        return authCodeMatch[0];
      }
    }
  }
  
  if (typeof error === 'string') {
    const authCodeMatch = error.match(/auth\/[\w-]+/);
    if (authCodeMatch) {
      return authCodeMatch[0];
    }
  }
  
  return 'default';
}

/**
 * Creates a structured auth error from any error type
 * @param error - The original error
 * @returns A structured AuthError object
 */
export function createAuthError(error: unknown): { code: string; message: string } {
  const code = extractErrorCode(error);
  const message = getAuthErrorMessage(code);
  
  return { code, message };
}
