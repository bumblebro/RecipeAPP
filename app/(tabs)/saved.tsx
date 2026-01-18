import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { RefreshControl } from "react-native";
import { 
  Heart, 
  Trash2, 
  Play, 
  Clock,
  ChefHat,
  Settings,
  Search,
  X,
} from "lucide-react-native";
import { recipeApi, SavedRecipe } from "../../features/recipe/recipe.api";
import { useSavedRecipesStore } from "../../stores/useSavedRecipesStore";
import { cn } from "../../lib/cn";

export default function SavedRecipesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    recipes, 
    isLoading: isStoreLoading, 
    fetchRecipes, 
    deleteRecipe: deleteFromStore 
  } = useSavedRecipesStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchRecipes();
    setIsRefreshing(false);
  }, [fetchRecipes]);

  // Sync when focused - background fetch if we already have data
  useFocusEffect(
    useCallback(() => {
      fetchRecipes();
    }, [fetchRecipes])
  );

  const handleDelete = useCallback(async (id: string, name: string) => {
    Alert.alert(
      "Delete Recipe",
      `Are you sure you want to remove "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
             try {
               await deleteFromStore(id);
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             } catch (error) {
               Alert.alert("Error", "Failed to delete recipe.");
             }
          }
        }
      ]
    );
  }, []);

  const handleCook = useCallback((recipeData: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/recipe-preview",
      params: { recipe: JSON.stringify(recipeData) },
    });
  }, [router]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View 
        className="px-6 pt-8 pb-4 flex-row items-center justify-between border-b border-neutral-900"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-amber-500 rounded-lg items-center justify-center mr-3 shadow-sm">
            <Heart size={18} color="#000000" fill="#000000" />
          </View>
          <Text className="text-xl font-bold text-white">Saved</Text>
        </View>
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/profile");
          }}
          className="w-10 h-10 rounded-full bg-neutral-900 items-center justify-center border border-neutral-800 active:bg-neutral-800"
        >
          <Settings size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View className="px-6 pb-2 pt-4">
        <View className="flex-row items-center bg-neutral-900 border border-neutral-800 rounded-xl px-4 h-12">
          <Search size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes..."
            placeholderTextColor="#6b7280"
            className="flex-1 ml-3 text-white font-medium text-base"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="p-1"
            >
              <X size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {isStoreLoading && recipes.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-full bg-neutral-900 items-center justify-center mb-6">
            <Heart size={40} color="#4b5563" />
          </View>
          <Text className="text-2xl font-bold text-white text-center mb-2">No saved recipes</Text>
          <Text className="text-neutral-500 text-center text-lg">Your favorite recipes will appear here once you save them.</Text>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-full bg-neutral-900 items-center justify-center mb-4">
            <Search size={32} color="#4b5563" />
          </View>
          <Text className="text-xl font-bold text-white text-center mb-2">No matches found</Text>
          <Text className="text-neutral-500 text-center">Try searching for a different recipe name.</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-5 pt-2"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
          }
        >
          {filteredRecipes.map((recipe, index) => {
            const data = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;
            return (
              <Animated.View 
                key={recipe.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                exiting={FadeOutRight}
                className="bg-neutral-900 rounded-2xl overflow-hidden mb-4 border border-neutral-800 shadow-lg"
              >
                <View className="flex-row p-3">
                  <View className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-800">
                    {data.image && (
                      <Image 
                        source={{ uri: typeof data.image === 'string' ? data.image : data.image[0] }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  
                  <View className="flex-1 ml-4 justify-between">
                    <View>
                      <Text className="text-lg font-bold text-white mb-1" numberOfLines={1}>{recipe.name}</Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Clock size={12} color="#9ca3af" />
                          <Text className="ml-1 text-neutral-400 text-xs font-medium">{data.totalTime || "30m"}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <ChefHat size={12} color="#9ca3af" />
                          <Text className="ml-1 text-neutral-400 text-xs font-medium">{data.instructions?.length || 0} steps</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleCook(data)}
                        className="flex-1 h-10 bg-amber-500 rounded-xl items-center justify-center flex-row active:opacity-80 shadow-md shadow-amber-500/10"
                      >
                        <Play size={14} color="#000000" fill="#000000" />
                        <Text className="ml-1.5 text-black font-bold text-sm">Cook</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(recipe.id, recipe.name)}
                        className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center active:bg-neutral-700 border border-neutral-700"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
