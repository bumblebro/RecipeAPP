/**
 * Paywall Screen
 * Premium subscription purchase modal
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Crown, Sparkles, Zap, ChefHat } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { PurchasesPackage } from 'react-native-purchases';

import { revenueCatService, ENTITLEMENT_ID } from '../lib/revenuecat-service';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Unlimited Recipe Extraction',
    description: 'Extract recipes from any URL without limits',
  },
  {
    icon: ChefHat,
    title: 'Unlimited Saved Recipes',
    description: 'Save unlimited recipes to your cookbook',
  },
  {
    icon: Zap,
    title: 'Unlimited Cooking Sessions',
    description: 'Smart cooking mode with voice guidance',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const offering = await revenueCatService.getOfferings();
      if (offering?.availablePackages) {
        setPackages(offering.availablePackages);
        // Select annual by default if available
        const annual = offering.availablePackages.find((p) => p.packageType === 'ANNUAL');
        setSelectedPackage(annual || offering.availablePackages[0]);
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const customerInfo = await revenueCatService.purchasePackage(selectedPackage);

      if (customerInfo) {
        const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        if (isActive) {
          const expiration = customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate;
          setSubscription('premium', expiration || null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        }
      }
    } catch (error: any) {
      Alert.alert('Purchase Failed', error.message || 'Something went wrong');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const customerInfo = await revenueCatService.restorePurchases();
      const isActive = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

      if (isActive) {
        const expiration = customerInfo.entitlements.active[ENTITLEMENT_ID]?.expirationDate;
        setSubscription('premium', expiration || null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your subscription has been restored!');
        router.back();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription.');
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (pkg: PurchasesPackage) => {
    const price = pkg.product.priceString;
    if (pkg.packageType === 'ANNUAL') {
      return `${price}/year`;
    } else if (pkg.packageType === 'MONTHLY') {
      return `${price}/month`;
    }
    return price;
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <LinearGradient
        colors={['#1a1a1a', '#0a0a0a', '#000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Close Button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-4 right-4 z-10 bg-neutral-800/80 rounded-full p-2"
        style={{ marginTop: insets.top }}
      >
        <X size={24} color="#fff" />
      </Pressable>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View className="items-center px-6 mb-8">
          <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4">
            <Crown size={40} color="#f59e0b" />
          </View>
          <Text className="text-3xl font-bold text-white text-center mb-2">
            Unlock Premium
          </Text>
          <Text className="text-neutral-400 text-center text-base">
            Get unlimited access to all features
          </Text>
        </View>

        {/* Features */}
        <View className="px-6 mb-8">
          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              className="flex-row items-center bg-neutral-800/50 rounded-xl p-4 mb-3"
            >
              <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center mr-4">
                <feature.icon size={24} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">{feature.title}</Text>
                <Text className="text-neutral-400 text-sm">{feature.description}</Text>
              </View>
              <Check size={20} color="#22c55e" />
            </View>
          ))}
        </View>

        {/* Free Tier Limits */}
        <View className="px-6 mb-6">
          <Text className="text-neutral-500 text-xs text-center mb-4">
            Free tier: 3 recipe extractions/day, 5 saved recipes, 3 cooking sessions/day
          </Text>
        </View>

        {/* Packages */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#f59e0b" />
        ) : (
          <View className="px-6 mb-6">
            {packages.length === 0 ? (
              <View className="bg-neutral-800/50 rounded-xl p-4">
                <Text className="text-neutral-400 text-center">
                  No subscription packages available. Please check your RevenueCat configuration.
                </Text>
              </View>
            ) : (
              packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const isAnnual = pkg.packageType === 'ANNUAL';

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => {
                      setSelectedPackage(pkg);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={`rounded-xl p-4 mb-3 border-2 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-neutral-800/50 border-neutral-700'
                    }`}
                  >
                    {isAnnual && (
                      <View className="absolute -top-2 right-4 bg-amber-500 rounded-full px-3 py-1">
                        <Text className="text-black text-xs font-bold">BEST VALUE</Text>
                      </View>
                    )}
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-white font-semibold text-lg">
                          {isAnnual ? 'Annual' : 'Monthly'}
                        </Text>
                        <Text className="text-neutral-400 text-sm">
                          {isAnnual ? 'Save 50%' : 'Cancel anytime'}
                        </Text>
                      </View>
                      <Text className="text-amber-400 font-bold text-xl">
                        {formatPrice(pkg)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* Purchase Button */}
        <View className="px-6">
          <Pressable
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPackage}
            className={`rounded-xl py-4 items-center ${
              isPurchasing || !selectedPackage ? 'bg-amber-500/50' : 'bg-amber-500'
            }`}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-bold text-lg">Continue</Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable onPress={handleRestore} className="py-4 items-center">
            <Text className="text-neutral-400 text-sm">Restore Purchases</Text>
          </Pressable>

          {/* Legal */}
          <Text className="text-neutral-500 text-xs text-center px-4">
            Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscription automatically renews unless canceled at least 24 hours before the end
            of the current period.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
