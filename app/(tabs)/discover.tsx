import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Heart,
  Star,
  Clock,
} from "lucide-react-native";
import { cn } from "../../lib/cn";
import { useDiscoverStore } from "../../stores/useDiscoverStore";

type TabType = "cooks" | "recipes";

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const {
    cooks: cooksMap,
    recipes: recipesMap,
    followCook,
    unfollowCook,
    isFollowing,
    likeRecipe,
    unlikeRecipe,
    isLiked,
    searchCooks,
    searchRecipes,
  } = useDiscoverStore();

  const [activeTab, setActiveTab] = useState<TabType>("cooks");
  const [searchQuery, setSearchQuery] = useState("");

  // Get filtered lists based on search
  const cooks = searchQuery
    ? searchCooks(searchQuery)
    : Object.values(cooksMap);
  const recipes = searchQuery
    ? searchRecipes(searchQuery)
    : Object.values(recipesMap);

  const handleFollow = useCallback(
    (cookId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isFollowing(cookId)) {
        unfollowCook(cookId);
      } else {
        followCook(cookId);
      }
    },
    [isFollowing, followCook, unfollowCook]
  );

  const handleLikeRecipe = useCallback(
    (recipeId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isLiked(recipeId)) {
        unlikeRecipe(recipeId);
      } else {
        likeRecipe(recipeId);
      }
    },
    [isLiked, likeRecipe, unlikeRecipe]
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
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <View className="mr-3">
            <Users size={28} color="#f59e0b" />
          </View>
          <Text className="text-2xl font-bold text-white">Discover</Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 mb-4">
          <View className="bg-neutral-800/50 rounded-lg px-4 py-3 flex-row items-center">
            <View className="mr-3">
              <Search size={18} color="#6b7280" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === "cooks"
                  ? "Search cooks..."
                  : "Search recipes..."
              }
              placeholderTextColor="#6b7280"
              className="flex-1 text-white text-base"
            />
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row border-b border-neutral-800">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("cooks");
            }}
            className="flex-1 py-4 items-center border-b-2"
            style={{
              borderBottomColor:
                activeTab === "cooks" ? "#f59e0b" : "transparent",
            }}
          >
            <Text
              className={cn(
                "font-semibold",
                activeTab === "cooks" ? "text-amber-500" : "text-neutral-400"
              )}
            >
              Cooks
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("recipes");
            }}
            className="flex-1 py-4 items-center border-b-2"
            style={{
              borderBottomColor:
                activeTab === "recipes" ? "#f59e0b" : "transparent",
            }}
          >
            <Text
              className={cn(
                "font-semibold",
                activeTab === "recipes" ? "text-amber-500" : "text-neutral-400"
              )}
            >
              Recipes
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === "cooks" ? (
          <ScrollView className="flex-1 px-5 py-4">
            {cooks.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Users size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  No cooks to discover yet
                </Text>
              </View>
            ) : (
              cooks.map((cook, index) => (
                <Animated.View
                  key={cook.id}
                  entering={FadeInUp.delay(index * 50).duration(300)}
                  className="bg-neutral-800/50 rounded-xl p-4 mb-3 border border-neutral-700"
                >
                  {/* Row 1: Username + Follow Button */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-lg">
                      {cook.username}
                    </Text>
                    <Pressable
                      onPress={() => handleFollow(cook.id)}
                      className={cn(
                        "flex-row items-center px-4 py-2 rounded-lg",
                        isFollowing(cook.id)
                          ? "bg-neutral-700"
                          : "bg-amber-500"
                      )}
                    >
                      {isFollowing(cook.id) ? (
                        <View className="mr-1.5">
                          <UserMinus size={16} color="#ffffff" />
                        </View>
                      ) : (
                        <View className="mr-1.5">
                          <UserPlus size={16} color="#000000" />
                        </View>
                      )}
                      <Text
                        className={cn(
                          "font-semibold text-sm",
                          isFollowing(cook.id) ? "text-white" : "text-black"
                        )}
                      >
                        {isFollowing(cook.id) ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Bio */}
                  <Text className="text-neutral-400 text-xs mb-3">
                    {cook.bio}
                  </Text>

                  {/* Stats Row */}
                  <View className="flex-row gap-4">
                    <View>
                      <Text className="text-amber-500 font-bold text-base">
                        {cook.shared}
                      </Text>
                      <Text className="text-neutral-400 text-xs">Shared</Text>
                    </View>
                    <View>
                      <Text className="text-amber-500 font-bold text-base">
                        {cook.followers}
                      </Text>
                      <Text className="text-neutral-400 text-xs">Followers</Text>
                    </View>
                    <View>
                      <Text className="text-amber-500 font-bold text-base">
                        {cook.following}
                      </Text>
                      <Text className="text-neutral-400 text-xs">Following</Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-5 py-4">
            {recipes.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Heart size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  Follow some cooks to see their shared recipes
                </Text>
              </View>
            ) : (
              recipes.map((recipe, index) => (
                <Animated.View
                  key={recipe.id}
                  entering={FadeInUp.delay(index * 50).duration(300)}
                  className="bg-neutral-800/50 rounded-xl p-4 mb-3 border border-neutral-700"
                >
                  {/* Title + Like */}
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-base flex-1">
                      {recipe.title}
                    </Text>
                    <Pressable
                      onPress={() => handleLikeRecipe(recipe.id)}
                      className="p-1"
                    >
                      <Heart
                        size={20}
                        color={isLiked(recipe.id) ? "#ef4444" : "#6b7280"}
                        fill={isLiked(recipe.id) ? "#ef4444" : "transparent"}
                      />
                    </Pressable>
                  </View>

                  {/* Description */}
                  <Text className="text-neutral-400 text-xs mb-3 line-clamp-2">
                    {recipe.description}
                  </Text>

                  {/* Stats Row */}
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-amber-500 text-xs ml-1">
                        {recipe.rating}
                      </Text>
                      <Text className="text-neutral-400 text-xs ml-1">
                        ({recipe.ratingCount})
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color="#9ca3af" />
                      <Text className="text-neutral-400 text-xs ml-1">
                        {recipe.cookTime} min
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

