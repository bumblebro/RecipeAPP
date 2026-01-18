import React from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import RevenueCatUI from 'react-native-purchases-ui';

import { revenueCatService } from '../lib/revenuecat-service';

export default function PaywallScreen() {
  return (
    <View className="flex-1 bg-black">
      <RevenueCatUI.Paywall 
        onPurchaseCompleted={async () => {
          // Use our robust check that handles both entitlements AND active subscriptions
          const isActive = await revenueCatService.checkSubscriptionStatus();
          
          if (isActive) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          } else {
            // If the immediate check fails, it might be sandbox delay
            // We'll give it one more try after a short delay
            setTimeout(async () => {
              const retryActive = await revenueCatService.checkSubscriptionStatus();
              if (retryActive) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              } else {
                Alert.alert(
                  'Processing Purchase', 
                  'Your purchase was successful but is still being processed. It should reflect in your account shortly.'
                );
                router.back();
              }
            }, 2000);
          }
        }}
        onRestoreCompleted={async () => {
          const isActive = await revenueCatService.checkSubscriptionStatus();
          
          if (isActive) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Your subscription has been restored!');
            router.back();
          } else {
            Alert.alert('No Subscription Found', 'We could not find an active subscription.');
          }
        }}
        onDismiss={() => {
          router.back();
        }}
      />
    </View>
  );
}
