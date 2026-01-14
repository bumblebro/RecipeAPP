import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { 
  Heart, 
  Trash2, 
  Play, 
  Clock,
  ChefHat
} from "lucide-react-native";
import { recipeApi, SavedRecipe } from "../../features/recipe/recipe.api";
import { cn } from "../../lib/cn";

export default function SavedRecipesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedRecipes = useCallback(async () => {
    try {
      const response = await recipeApi.getSavedRecipes();
      if (response.success) {
        setRecipes(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch saved recipes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedRecipes();
  }, [fetchSavedRecipes]);

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
               await recipeApi.deleteSavedRecipe(id);
               setRecipes(prev => prev.filter(r => r.id !== id));
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             } catch (error) {
               Alert.alert("Error", "Failed to delete recipe.");
             }
          }
        }
      ]
    );
  }, []);

  const handleCook = useCallback(async (recipeData: any) => {
    try {
      await recipeApi.trackCookSession();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/serving-size",
        params: { recipe: JSON.stringify(recipeData) },
      });
    } catch (error: any) {
      if (error.status === 403) {
        Alert.alert("Limit Reached", error.message || "You've reached your daily cooking limit.");
      } else {
        console.error("Failed to track cooking session:", error);
        Alert.alert("Error", "Could not start cooking session. Please try again.");
      }
    }
  }, [router]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View 
        className="px-5 py-4 border-b border-neutral-900"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Text className="text-3xl font-bold text-white">Cookbook</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#f59e0b" size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-full bg-neutral-900 items-center justify-center mb-6">
            <Heart size={40} color="#4b5563" />
          </View>
          <Text className="text-2xl font-bold text-white text-center mb-2">Your Cookbook is empty</Text>
          <Text className="text-neutral-500 text-center text-lg">Your favorite recipes will appear here once you save them.</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1 px-5 pt-6"
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {recipes.map((recipe, index) => {
            const data = typeof recipe.data === 'string' ? JSON.parse(recipe.data) : recipe.data;
            return (
              <Animated.View 
                key={recipe.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                exiting={FadeOutRight}
                className="bg-neutral-900 rounded-3xl overflow-hidden mb-6 border border-neutral-800 shadow-xl"
              >
                {data.image && (
                  <Image 
                    source={{ uri: typeof data.image === 'string' ? data.image : data.image[0] }} 
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                )}
                <View className="p-6">
                  <Text className="text-2xl font-bold text-white mb-3">{recipe.name}</Text>
                  
                  <View className="flex-row items-center gap-5 mb-6">
                    <View className="flex-row items-center">
                      <Clock size={16} color="#9ca3af" />
                      <Text className="ml-2 text-neutral-400 text-sm font-medium">{data.totalTime || "30 min"}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <ChefHat size={16} color="#9ca3af" />
                      <Text className="ml-2 text-neutral-400 text-sm font-medium">{data.instructions?.length || 0} steps</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    <Pressable
                      onPress={() => handleCook(data)}
                      className="flex-1 h-14 bg-amber-500 rounded-2xl items-center justify-center flex-row active:opacity-80 shadow-lg shadow-amber-500/20"
                    >
                      <Play size={20} color="#000000" fill="#000000" />
                      <Text className="ml-2 text-black font-bold text-lg">Cook Now</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(recipe.id, recipe.name)}
                      className="w-14 h-14 bg-neutral-800 rounded-2xl items-center justify-center active:bg-neutral-700 border border-neutral-700"
                    >
                      <Trash2 size={24} color="#ef4444" />
                    </Pressable>
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
