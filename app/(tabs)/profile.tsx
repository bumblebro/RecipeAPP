import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  User,
  Edit3,
  Heart,
  LogOut,
  ChevronRight,
  History,
  Zap,
  Settings as SettingsIcon,
  HelpCircle,
  CreditCard
} from "lucide-react-native";
import { cn } from "../../lib/cn";
import { useProfileStore } from "../../stores/useProfileStore";
import { useAuth } from "../../hooks/useAuth";
import { revenueCatService } from "../../lib/revenuecat-service";
import { usePaywall } from "../../lib/usePaywall";
import { useSubscriptionStore } from "../../stores/useSubscriptionStore";
import { FREE_TIER_LIMITS } from "../../stores/useUsageStore";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

const MenuItem = ({ icon, label, onPress, destructive }: MenuItemProps) => (
  <Pressable
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    className="flex-row items-center justify-between py-4 border-b border-neutral-900 active:opacity-60"
  >
    <View className="flex-row items-center">
      <View className={cn(
        "w-10 h-10 rounded-xl items-center justify-center mr-4",
        destructive ? "bg-red-500/10" : "bg-neutral-900"
      )}>
        {icon}
      </View>
      <Text className={cn(
        "text-base font-semibold",
        destructive ? "text-red-500" : "text-white"
      )}>
        {label}
      </Text>
    </View>
    {!destructive && <ChevronRight size={18} color="#4b5563" />}
  </Pressable>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    username,
    bio,
    updateProfile,
  } = useProfileStore();
  const { logout, user } = useAuth();
  
  const { 
    isSubscribed, 
    showPaywall, 
    remainingExtractions, 
    remainingSessions, 
    remainingSavedRecipes 
  } = usePaywall();

  const expirationDate = useSubscriptionStore(s => s.expirationDate);

  // Format expiration date with time
  const formattedExpiration = expirationDate 
    ? new Date(expirationDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Prefer auth user data, fallback to store data
  const displayName = user?.displayName || username || user?.email?.split('@')[0] || "User";
  const displayEmail = user?.email || "";

  const [editUsername, setEditUsername] = useState(displayName);
  const [editBio, setEditBio] = useState(bio);
  const [showEditModal, setShowEditModal] = useState(false);

  // Sync edit state when profile changes
  useEffect(() => {
    setEditUsername(displayName);
    setEditBio(bio);
  }, [displayName, bio]);

  const handleSaveProfile = useCallback(() => {
    if (!editUsername.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProfile({
      username: editUsername.trim(),
      bio: editBio.trim(),
    });
    setShowEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [editUsername, editBio, updateProfile]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          backgroundColor: "#0a0a0a",
        }}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View className="px-5 py-8 items-center border-b border-neutral-900">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500 items-center justify-center mb-4 overflow-hidden">
               {user?.photoURL ? (
                  <View className="w-full h-full bg-neutral-800">
                     <User size={48} color="#f59e0b" style={{ alignSelf: 'center', marginTop: 22 }} />
                  </View>
                ) : (
                  <User size={48} color="#f59e0b" />
                )}
            </View>

            <Text className="text-2xl font-bold text-white mb-1">
              {displayName}
            </Text>
            <Text className="text-neutral-500 text-sm mb-6">{displayEmail}</Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditUsername(displayName);
                setEditBio(bio);
                setShowEditModal(true);
              }}
              className="bg-neutral-900 rounded-full px-6 py-2.5 flex-row items-center border border-neutral-800"
            >
              <Edit3 size={16} color="#f59e0b" className="mr-2" />
              <Text className="text-white font-semibold">Edit Profile</Text>
            </Pressable>
          </View>

          {/* Menu Sections */}
          <View className="px-5 py-4">
            <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 px-1">
              Account
            </Text>
            <MenuItem 
              icon={<Heart size={20} color="#f59e0b" />} 
              label="Saved Recipes" 
              onPress={() => router.push("/(tabs)/saved")} 
            />
            <MenuItem 
              icon={<History size={20} color="#f59e0b" />} 
              label="Cooking History" 
              onPress={() => {}} 
            />
            
            
            <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-8 mb-2 px-1">
              Subscription
            </Text>

            {/* Subscription Status Card */}
            <View className="bg-neutral-900 rounded-2xl p-4 mb-4 border border-neutral-800">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className={cn(
                    "w-10 h-10 rounded-xl items-center justify-center mr-3",
                    isSubscribed ? "bg-amber-500/20" : "bg-neutral-800"
                  )}>
                    <Zap size={20} color={isSubscribed ? "#f59e0b" : "#9ca3af"} fill={isSubscribed ? "#f59e0b" : "none"} />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">
                      {isSubscribed ? "Premium Plan" : "Free Plan"}
                    </Text>
                    <Text className="text-neutral-400 text-xs">
                      {isSubscribed 
                        ? (formattedExpiration ? `Renews ${formattedExpiration}` : "Active") 
                        : "Limited Access"}
                    </Text>
                  </View>
                </View>
                {!isSubscribed && (
                  <Pressable 
                    onPress={showPaywall}
                    className="bg-amber-500 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="text-black font-bold text-xs">Upgrade</Text>
                  </Pressable>
                )}
              </View>

              {/* Usage Stats (only for free plan) */}
              {!isSubscribed && (
                <View className="bg-neutral-950/50 rounded-xl p-3 border border-neutral-800/50">
                  <Text className="text-neutral-400 text-xs font-semibold mb-2 uppercase tracking-wider">
                    Daily Usage
                  </Text>
                  
                  {/* Extractions */}
                  <View className="mb-2">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-neutral-300 text-xs">Recipe Extractions</Text>
                      <Text className="text-neutral-300 text-xs">
                        {Math.max(0, FREE_TIER_LIMITS.recipeExtractionsPerDay - remainingExtractions)} / {FREE_TIER_LIMITS.recipeExtractionsPerDay}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-amber-500/50 rounded-full" 
                        style={{ width: `${((FREE_TIER_LIMITS.recipeExtractionsPerDay - remainingExtractions) / FREE_TIER_LIMITS.recipeExtractionsPerDay) * 100}%` }} 
                      />
                    </View>
                  </View>

                  {/* Cooking Sessions */}
                  <View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-neutral-300 text-xs">Cooking Sessions</Text>
                      <Text className="text-neutral-300 text-xs">
                        {Math.max(0, FREE_TIER_LIMITS.cookingSessionsPerDay - remainingSessions)} / {FREE_TIER_LIMITS.cookingSessionsPerDay}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <View 
                        className="h-full bg-blue-500/50 rounded-full" 
                        style={{ width: `${((FREE_TIER_LIMITS.cookingSessionsPerDay - remainingSessions) / FREE_TIER_LIMITS.cookingSessionsPerDay) * 100}%` }} 
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {!isSubscribed && (
              <MenuItem 
                icon={<Zap size={20} color="#f59e0b" />} 
                label="Upgrade to Pro" 
                onPress={showPaywall} 
              />
            )}
            <MenuItem 
              icon={<CreditCard size={20} color="#9ca3af" />} 
              label="Billing & Plans (Cancel)" 
              onPress={() => revenueCatService.manageSubscription()} 
            />

            <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-8 mb-2 px-1">
              Preferences
            </Text>
            <MenuItem 
              icon={<SettingsIcon size={20} color="#9ca3af" />} 
              label="App Settings" 
              onPress={() => {}} 
            />
            <MenuItem 
              icon={<HelpCircle size={20} color="#9ca3af" />} 
              label="Help & Support" 
              onPress={() => {}} 
            />

            <View className="mt-8 mb-10">
              <MenuItem 
                icon={<LogOut size={20} color="#ef4444" />} 
                label="Logout" 
                destructive
                onPress={logout} 
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          className="flex-1 bg-neutral-950"
          style={{ paddingTop: insets.top }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-6 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">Edit Profile</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditModal(false);
              }}
            >
              <Text className="text-amber-500 font-semibold">Cancel</Text>
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-5 pt-8">
            <Text className="text-neutral-400 font-semibold mb-2 ml-1">Username</Text>
            <TextInput
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Enter username"
              placeholderTextColor="#4b5563"
              className="bg-neutral-900 rounded-2xl px-5 py-4 text-white text-base mb-6 border border-neutral-800"
              autoFocus
            />

            <Text className="text-neutral-400 font-semibold mb-2 ml-1">Bio (Optional)</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about your culinary journey..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={4}
              className="bg-neutral-900 rounded-2xl px-5 py-4 text-white text-base mb-8 border border-neutral-800"
              textAlignVertical="top"
            />

            <Pressable
              onPress={handleSaveProfile}
              disabled={!editUsername.trim()}
              className={cn(
                "bg-amber-500 rounded-2xl py-4 items-center justify-center shadow-lg",
                !editUsername.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-lg">
                Save Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

