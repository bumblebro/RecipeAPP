import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Linking,
} from "react-native";
import { useAlert } from "../../components/AlertProvider";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mic,
  Smartphone,
  CreditCard,
  RefreshCcw,
  Mail,
  Zap,
  ShieldCheck,
  FileText,
  ChevronRight,
  User,
} from "lucide-react-native";
// import { useAuth } from "../../hooks/useAuth"; // logic moved to account-info
import { useSettingsStore } from "../../stores/useSettingsStore";
import { useSubscriptionStore } from "../../stores/useSubscriptionStore";
import { useUsageStore, FREE_TIER_LIMITS } from "../../stores/useUsageStore";
import { revenueCatService } from "../../lib/revenuecat-service";
import { usePaywall } from "../../lib/usePaywall";

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    voiceEnabled,
    setVoiceEnabled,
    keepScreenAwake,
    setKeepScreenAwake,
  } = useSettingsStore();

  // const { logout, deleteAccount, user } = useAuth();
  const { showAlert } = useAlert();
  const { isSubscribed, showPaywall } = usePaywall();
  const expirationDate = useSubscriptionStore(s => s.expirationDate);
  const { recipeExtractions, cookingSessions, syncWithBackend } = useUsageStore();

  // Sync usage with backend whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      syncWithBackend();
    }, [syncWithBackend])
  );

  const handleToggleVoice = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVoiceEnabled(value);
  };

  const handleToggleAwake = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setKeepScreenAwake(value);
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await revenueCatService.restorePurchases();
    } catch (e) {
      console.error("Restore Failed", e);
    }
  };

  const handleFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:shreyasmadappady20@gmail.com?subject=Feedback");
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      >
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="py-8">
            <Text className="text-3xl font-bold text-white">Account</Text>
          </View>

          {/* Preferences Section */}
          <Animated.View entering={FadeInUp.delay(100)} className="gap-2">

            {/* Voice Control */}
            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <Mic size={20} color="#f59e0b" />
                </View>
                <Text className="text-lg font-semibold text-white">Voice Control</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-neutral-500 font-bold text-sm uppercase">
                  {voiceEnabled ? "ON" : "OFF"}
                </Text>
                <Switch
                  value={voiceEnabled}
                  onValueChange={handleToggleVoice}
                  trackColor={{ false: "#171717", true: "#f59e0b" }}
                  thumbColor={Platform.OS === 'ios' ? '#ffffff' : voiceEnabled ? '#ffffff' : '#404040'}
                />
              </View>
            </View>

            {/* Keep Screen Awake */}
            <View className="flex-row items-center justify-between py-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <Smartphone size={20} color="#f59e0b" />
                </View>
                <Text className="text-lg font-semibold text-white">Keep Screen Awake</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-neutral-500 font-bold text-sm uppercase">
                  {keepScreenAwake ? "ON" : "OFF"}
                </Text>
                <Switch
                  value={keepScreenAwake}
                  onValueChange={handleToggleAwake}
                  trackColor={{ false: "#171717", true: "#f59e0b" }}
                  thumbColor={Platform.OS === 'ios' ? '#ffffff' : keepScreenAwake ? '#ffffff' : '#404040'}
                />
              </View>
            </View>

          </Animated.View>

          {/* Separator */}
          <View className="h-[1px] bg-neutral-900 my-4" />

          {/* Upgrade CTA for Free Users */}
          {!isSubscribed && (
            <Animated.View entering={FadeInUp.delay(150)} className="mb-4">
              <Pressable
                onPress={showPaywall}
                className="bg-amber-500 rounded-2xl p-5 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 bg-black/10 rounded-xl items-center justify-center mr-4">
                    <Zap size={24} color="#000000" fill="#000000" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-black font-bold text-lg">Upgrade to Pro</Text>
                    <Text className="text-black/60 text-sm font-medium">Unlock unlimited recipe imports & sessions</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#000000" />
              </Pressable>
            </Animated.View>
          )}

          {/* Subscription Section */}
          <Animated.View entering={FadeInUp.delay(200)} className="gap-2">

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                revenueCatService.manageSubscription();
              }}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <CreditCard size={20} color="#9ca3af" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-white">Subscription Details</Text>
                  <Text className="text-neutral-500 text-xs">
                    {isSubscribed ? "Premium Plan Active" : "Free Plan"}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Usage Stats - Moved here to be part of the flow */}
            <View className="bg-neutral-900/50 rounded-2xl border border-neutral-900 p-4 mt-2 gap-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-neutral-400 text-sm font-medium">Extractions Used</Text>
                  <Text className="text-white text-base font-bold mt-0.5">
                    {isSubscribed ? "Unlimited" : `${recipeExtractions} / ${FREE_TIER_LIMITS.recipeExtractionsPerMonth}`}
                  </Text>
                </View>
                {!isSubscribed && (
                  <View className="h-1.5 w-24 bg-neutral-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500"
                      style={{ width: `${(recipeExtractions / FREE_TIER_LIMITS.recipeExtractionsPerMonth) * 100}%` }}
                    />
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-neutral-400 text-sm font-medium">Cooking Sessions</Text>
                  <Text className="text-white text-base font-bold mt-0.5">
                    {isSubscribed ? "Unlimited" : `${cookingSessions} / ${FREE_TIER_LIMITS.cookingSessionsPerMonth}`}
                  </Text>
                </View>
                {!isSubscribed && (
                  <View className="h-1.5 w-24 bg-neutral-800 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-amber-500"
                      style={{ width: `${(cookingSessions / FREE_TIER_LIMITS.cookingSessionsPerMonth) * 100}%` }}
                    />
                  </View>
                )}
              </View>
            </View>

            <Pressable
              onPress={handleRestore}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <RefreshCcw size={20} color="#9ca3af" />
                </View>
                <Text className="text-lg font-semibold text-white">Restore Subscription</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleFeedback}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <Mail size={20} color="#9ca3af" />
                </View>
                <Text className="text-lg font-semibold text-white">Send Feedback</Text>
              </View>
            </Pressable>

            <View className="h-[1px] bg-neutral-900 my-4" />

            <Pressable
              onPress={() => Linking.openURL("https://step-chef-website.vercel.app/terms")}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <FileText size={20} color="#6b7280" />
                </View>
                <Text className="text-lg font-semibold text-neutral-400">Terms of Service</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL("https://step-chef-website.vercel.app/privacy")}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <ShieldCheck size={20} color="#6b7280" />
                </View>
                <Text className="text-lg font-semibold text-neutral-400">Privacy Policy</Text>
              </View>
            </Pressable>

            <View className="h-[1px] bg-neutral-900 my-4" />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/account-info");
              }}
              className="flex-row items-center justify-between py-4 active:opacity-60"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-neutral-900 items-center justify-center mr-4">
                  <User size={20} color="#9ca3af" />
                </View>
                <Text className="text-lg font-semibold text-white">Account Information</Text>
              </View>
              <ChevronRight size={20} color="#525252" />
            </Pressable>

          </Animated.View>

          <View style={{ height: insets.bottom + 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}
