import React from 'react';
import { View } from 'react-native';
import { useAlert } from '../components/AlertProvider';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import RevenueCatUI from 'react-native-purchases-ui';

import { revenueCatService } from '../lib/revenuecat-service';

export default function PaywallScreen() {
  const { showAlert } = useAlert();
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
                showAlert({
                  title: 'Processing Purchase', 
                  message: 'Your purchase was successful but is still being processed. It should reflect in your account shortly.',
                  type: 'info'
                });
                router.back();
              }
            }, 2000);
          }
        }}
        onRestoreCompleted={async () => {
          const isActive = await revenueCatService.checkSubscriptionStatus();
          
          if (isActive) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert({
              title: 'Success', 
              message: 'Your subscription has been restored!',
              type: 'success'
            });
            router.back();
          } else {
            showAlert({
              title: 'No Subscription Found', 
              message: 'We could not find an active subscription.',
              type: 'warning'
            });
          }
        }}
        onDismiss={() => {
          router.back();
        }}
      />
    </View>
  );
}
