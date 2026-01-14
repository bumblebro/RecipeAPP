/**
 * Premium Badge Component
 * Shows subscription status and upgrade button
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Crown } from 'lucide-react-native';
import { usePaywall } from '../lib/usePaywall';

export function PremiumBadge() {
  const { isSubscribed, showPaywall } = usePaywall();

  if (isSubscribed) {
    return (
      <View className="flex-row items-center bg-amber-500/20 rounded-full px-3 py-1">
        <Crown size={14} color="#f59e0b" />
        <Text className="text-amber-500 text-xs font-semibold ml-1">PRO</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={showPaywall}
      className="flex-row items-center bg-neutral-800 rounded-full px-3 py-1"
    >
      <Crown size={14} color="#9ca3af" />
      <Text className="text-neutral-400 text-xs font-semibold ml-1">Upgrade</Text>
    </Pressable>
  );
}
