/**
 * RevenueCat Service
 * Wrapper for RevenueCat SDK operations in StepChef
 */

import { Platform, Linking } from 'react-native';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

// Lazy import to prevent crash when native module isn't linked yet
let Purchases: typeof import('react-native-purchases').default | null = null;
let PurchasesPackageType: any = null;

const loadPurchases = async () => {
  if (Purchases) return Purchases;
  try {
    const module = await import('react-native-purchases');
    Purchases = module.default;
    return Purchases;
  } catch (error) {
    console.warn('RevenueCat native module not available. Please rebuild the app.');
    return null;
  }
};

// Re-export types for use in other files
export type { PurchasesPackage, CustomerInfo, PurchasesOffering } from 'react-native-purchases';

// RevenueCat API keys - REPLACE WITH YOUR ACTUAL KEYS
const API_KEYS = {
  ios: 'test_tMPtNwQxbxfBJHAlmlQVOaQZDIK',
  android: 'test_tMPtNwQxbxfBJHAlmlQVOaQZDIK',
};

// Entitlement identifier from RevenueCat dashboard
const ENTITLEMENT_ID = 'Premium';

class RevenueCatService {
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    const purchases = await loadPurchases();
    if (!purchases) {
      console.warn('RevenueCat not available - skipping initialization');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

      purchases.configure({
        apiKey,
        appUserID: userId,
      });

      // Listen for real-time customer info updates (e.g. expiration while app is open)
      purchases.addCustomerInfoUpdateListener(() => {
        this.checkSubscriptionStatus();
      });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<any | null> {
    const purchases = await loadPurchases();
    if (!purchases) return null;

    try {
      const offerings = await purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: any): Promise<any | null> {
    const purchases = await loadPurchases();
    if (!purchases) return null;

    try {
      const { customerInfo } = await purchases.purchasePackage(pkg);
      this.checkSubscriptionStatus(); // Sync status
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
        return null;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<any> {
    const purchases = await loadPurchases();
    if (!purchases) throw new Error('RevenueCat not available');

    try {
      const customerInfo = await purchases.restorePurchases();
      this.checkSubscriptionStatus(); // Sync status
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<any> {
    const purchases = await loadPurchases();
    if (!purchases) throw new Error('RevenueCat not available');

    try {
      const customerInfo = await purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Debug logging to find the correct Entitlement ID
      console.log('DEBUG: RevenueCat CustomerInfo:', JSON.stringify(customerInfo, null, 2));
      console.log('DEBUG: Active Entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('DEBUG: Checking for Entitlement ID:', ENTITLEMENT_ID);

      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      const activeSubscriptions = customerInfo.activeSubscriptions || [];
      
      // Look for our specific entitlement ID
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] || customerInfo.entitlements.active[activeEntitlements[0]];
      
      // If we have an active entitlement OR an active subscription, consider it premium
      // (Fallback for missing entitlement-product link in dashboard)
      const isActive = activeEntitlements.length > 0 || activeSubscriptions.length > 0;
      
      // Sync with backend (fire and forget)
      this.syncSubscription(isActive, entitlement?.expirationDate || null);
      
      if (isActive) {
        console.log('DEBUG: Subscription is ACTIVE (Entitlements:', activeEntitlements.join(', '), '| Subs:', activeSubscriptions.join(', '), ')');
        useSubscriptionStore.getState().setSubscription(
          'premium', 
          entitlement?.expirationDate || null
        );
      } else {
        console.log('DEBUG: Subscription is NOT ACTIVE. If you paid, check ENTITLEMENT_ID matches RevenueCat dashboard.');
        useSubscriptionStore.getState().setSubscription('free', null);
      }

      return isActive;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async loginUser(userId: string): Promise<any> {
    const purchases = await loadPurchases();
    if (!purchases) throw new Error('RevenueCat not available');

    try {
      const { customerInfo } = await purchases.logIn(userId);
      await this.checkSubscriptionStatus(); // Sync status after login
      return customerInfo;
    } catch (error) {
      console.error('Failed to login user:', error);
      throw error;
    }
  }

  async logoutUser(): Promise<void> {
    const purchases = await loadPurchases();
    if (!purchases) return;

    try {
      await purchases.logOut();
    } catch (error) {
      console.error('Failed to logout user:', error);
    }
  }

  /**
   * Sync subscription status with our backend
   */
  // Tracking local state to avoid redundant syncs
  private lastSyncedPlan: string | null = null;
  private lastSyncedExpiration: string | null = null;

  /**
   * Sync subscription status with our backend
   */
  /**
   * Sync subscription status with our backend
   */
  private async syncSubscription(isActive: boolean, expirationDate: string | null) {
      const plan = isActive ? 'premium' : 'free';
      
      // Prevent redundant syncs (Optimistic Check)
      if (
        this.lastSyncedPlan === plan && 
        this.lastSyncedExpiration === expirationDate
      ) {
         return;
      }

      // Optimistically update tracking to block concurrent duplicate calls
      const previousPlan = this.lastSyncedPlan;
      const previousExpiration = this.lastSyncedExpiration;
      
      this.lastSyncedPlan = plan;
      this.lastSyncedExpiration = expirationDate;

    try {
      // Dynamic import to avoid circular dependencies
      const { api } = await import('../features/api/api.client');
      const { useAuthStore } = await import('../stores/useAuthStore');
      
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      
      if (!isAuthenticated) {
        // Revert since we didn't actually sync
        this.lastSyncedPlan = previousPlan;
        this.lastSyncedExpiration = previousExpiration;
        console.log('Skipping subscription sync (user not authenticated)');
        return;
      }

      await api.post('/user/sync-subscription', { 
        plan,
        expirationDate 
      });
      console.log('Synced subscription with backend:', plan);
      
    } catch (error) {
      // Revert on failure so we retry next time
      this.lastSyncedPlan = previousPlan;
      this.lastSyncedExpiration = previousExpiration;
      console.error('Failed to sync subscription with backend:', error);
    }
  }
  /**
   * Open the OS subscription management page
   */
  async manageSubscription(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // Opens Apple ID Subscriptions
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
        // Opens Play Store Subscriptions
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
    } catch (error) {
      console.error('Failed to open subscription management:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
export { ENTITLEMENT_ID };
