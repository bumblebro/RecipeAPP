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
import {
  User,
  Edit3,
  Share2,
  Heart,
  Star,
  LogOut,
} from "lucide-react-native";
import { cn } from "../../lib/cn";
import { useProfileStore } from "../../stores/useProfileStore";
import { useAuth } from "../../hooks/useAuth";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    username,
    bio,
    shared,
    followers,
    following,
    recipes: recipesMap,
    updateProfile,
    toggleShare,
    getUserRecipes,
  } = useProfileStore();
  const { logout } = useAuth();

  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);
  const [showEditModal, setShowEditModal] = useState(false);

  const recipes = getUserRecipes();

  // Sync edit state when profile changes
  useEffect(() => {
    setEditUsername(username);
    setEditBio(bio);
  }, [username, bio]);

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

  const handleToggleShare = useCallback(
    (recipeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleShare(recipeId);
    },
    [toggleShare]
  );

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
          <View className="px-5 py-6">
            <View className="flex-row items-start justify-between mb-4">
              {/* Avatar */}
              <View className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 items-center justify-center">
                <User size={32} color="#f59e0b" />
              </View>

              {/* Edit Button */}
              {/* Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setEditUsername(username);
                    setEditBio(bio);
                    setShowEditModal(true);
                  }}
                  className="bg-neutral-800 rounded-lg px-4 py-2 flex-row items-center"
                >
                  <View className="mr-2">
                    <Edit3 size={16} color="#f59e0b" />
                  </View>
                  <Text className="text-amber-500 font-semibold">Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    logout();
                  }}
                  className="bg-neutral-800 rounded-lg px-3 py-2 items-center justify-center"
                >
                  <LogOut size={18} color="#ef4444" />
                </Pressable>
              </View>
            </View>

            {/* Username */}
            <Text className="text-2xl font-bold text-white mb-2">
              {username}
            </Text>

            {/* Bio */}
            <Text className="text-neutral-400 text-sm mb-6">{bio}</Text>

            {/* Stats Row */}
            <View className="flex-row gap-6">
              <View>
                <Text className="text-amber-500 font-bold text-lg">
                  {shared}
                </Text>
                <Text className="text-neutral-400 text-xs">Shared</Text>
              </View>
              <View>
                <Text className="text-amber-500 font-bold text-lg">
                  {followers}
                </Text>
                <Text className="text-neutral-400 text-xs">Followers</Text>
              </View>
              <View>
                <Text className="text-amber-500 font-bold text-lg">
                  {following}
                </Text>
                <Text className="text-neutral-400 text-xs">Following</Text>
              </View>
            </View>
          </View>

          {/* Your Recipes Section */}
          <View className="px-5 pb-6">
            <Text className="text-white font-bold text-lg mb-4">
              Your Recipes ({recipes.length})
            </Text>

            {recipes.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Heart size={40} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  No recipes yet. Cook something first!
                </Text>
              </View>
            ) : (
              recipes.map((recipe, index) => (
                <Animated.View
                  key={recipe.id}
                  entering={FadeInUp.delay(index * 50).duration(300)}
                  className="bg-neutral-800/50 rounded-xl p-4 mb-3 border border-neutral-700"
                >
                  {/* Title + Share */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-base flex-1">
                      {recipe.title}
                    </Text>
                    <Pressable
                      onPress={() => handleToggleShare(recipe.id)}
                      className={cn(
                        "p-2 rounded-lg",
                        recipe.isShared
                          ? "bg-amber-500/20"
                          : "bg-neutral-700"
                      )}
                    >
                      <Share2
                        size={18}
                        color={recipe.isShared ? "#f59e0b" : "#9ca3af"}
                      />
                    </Pressable>
                  </View>

                  {/* Description */}
                  <Text className="text-neutral-400 text-xs mb-3 line-clamp-1">
                    {recipe.description}
                  </Text>

                  {/* Stats */}
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-amber-500 text-xs ml-1">
                        {recipe.rating}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-neutral-400 text-xs">📝</Text>
                      <Text className="text-neutral-400 text-xs ml-1">
                        {recipe.steps} steps
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
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
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
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
          <View className="flex-1 px-5 pt-6">
            <Text className="text-white font-semibold mb-2">Username</Text>
            <TextInput
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Enter username"
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base mb-6"
              autoFocus
            />

            <Text className="text-white font-semibold mb-2">Bio</Text>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#737373"
              multiline
              numberOfLines={4}
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base mb-6"
              textAlignVertical="top"
            />

            <Pressable
              onPress={handleSaveProfile}
              disabled={!editUsername.trim()}
              className={cn(
                "bg-amber-500 rounded-xl py-4 items-center justify-center",
                !editUsername.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-base">
                Save Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

