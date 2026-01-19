import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { 
  ChefHat, 
  Clock, 
  Play, 
  Users, 
  Heart,
  ChevronLeft,
  Sparkles
} from "lucide-react-native";
import { recipeApi } from "../features/recipe/recipe.api";
import { useSavedRecipesStore } from "../stores/useSavedRecipesStore";
import { cn } from "../lib/cn";
import { usePaywall } from "../lib/usePaywall";
import { useAlert } from "../components/AlertProvider";

interface RecipeData {
  id?: string;
  name: string;
  description?: string;
  image?: string | string[];
  ingredients: string[];
  instructions: string[];
  totalTime?: string;
  yield?: string | number;
  processedInstructions?: any[];
  sourceUrl?: string;
}

export default function RecipePreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { recipe } = useLocalSearchParams<{ recipe: string }>();
  const { isSubscribed, validateCookingSession, checkCanSaveRecipe, showPaywall } = usePaywall();

  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (recipe) {
      try {
        const parsed = JSON.parse(recipe);
        setRecipeData(parsed);
        // If it's a saved recipe, it might already have an ID or we can check if it's in the cookbook
        // For now, we'll assume the parent screen tells us if it's saved if needed, 
        // or we can just let handleSave handle the duplication check via API
      } catch (error) {
        console.error("Error parsing recipe:", error);
      }
    }
  }, [recipe]);

  const handleSaveRecipe = useCallback(async () => {
    if (!recipeData || isSaving || isSaved) return;

    // Check saved recipes limit for free users
    if (!isSubscribed && !checkCanSaveRecipe()) {
      return; 
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await recipeApi.saveRecipe(recipeData.name, recipeData);
      if (response.success) {
        useSavedRecipesStore.getState().addRecipe(response.data);
      }
      setIsSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      if (error.status === 403) {
        showAlert({
          title: "Limit Reached",
          message: error.message || "You've reached your saved recipes limit.",
          type: "warning",
          secondaryButton: { text: 'Maybe Later' },
          primaryButton: { text: 'Upgrade', onPress: showPaywall },
        });
      } else {
        showAlert({
          title: "Error",
          message: "Failed to save recipe. Please try again.",
          type: "error"
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [recipeData, isSaving, isSaved, isSubscribed, checkCanSaveRecipe, showPaywall]);

  const handleStartCooking = useCallback(async () => {
    if (!recipeData) return;

    // Check usage limits for free users (Validation Only)
    if (!isSubscribed) {
      const canProceed = validateCookingSession();
      if (!canProceed) return;
    }

    try {
      // usage is tracked in the next step (serving-size/process)

      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/serving-size",
        params: { recipe: JSON.stringify(recipeData) },
      });
    } catch (error: any) {
      console.error("Failed to navigate to serving size:", error);
    }
  }, [recipeData, router, isSubscribed, validateCookingSession, showPaywall]);

  if (!recipeData) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-neutral-500 mt-4 font-medium">Loading recipe...</Text>
      </View>
    );
  }

  const recipeImage = Array.isArray(recipeData.image) ? recipeData.image[0] : recipeData.image;

  return (
    <View className="flex-1 bg-neutral-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header/Back Button */}
        <View 
          className="flex-row items-center justify-between px-5 py-4 z-10"
          style={{ marginTop: insets.top }}
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-neutral-900/80 items-center justify-center border border-neutral-800"
          >
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          
          <Text className="text-white font-bold text-lg opacity-80">Recipe Preview</Text>
          <View className="w-10" /> 
        </View>

        <View className="px-5">
          {recipeImage && (
            <View className="relative w-full h-64 mb-6 shadow-2xl">
              <Image
                source={{ uri: recipeImage }}
                className="w-full h-full rounded-[32px]"
                resizeMode="cover"
              />
              <View className="absolute inset-0 rounded-[32px] border border-white/10" />
            </View>
          )}

          <Text className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">
            {recipeData.name}
          </Text>

          {/* Quick Stats */}
          <View className="flex-row items-center gap-3 mb-6 flex-wrap">
            <View className="flex-row items-center bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-2xl">
              <Clock size={16} color="#f59e0b" />
              <Text className="ml-2 text-neutral-300 text-sm font-semibold">
                {recipeData.totalTime || "30 min"}
              </Text>
            </View>
            <View className="flex-row items-center bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-2xl">
              <ChefHat size={16} color="#f59e0b" />
              <Text className="ml-2 text-neutral-300 text-sm font-semibold">
                {recipeData.instructions.length} steps
              </Text>
            </View>
            <View className="flex-row items-center bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-2xl">
              <Users size={16} color="#f59e0b" />
              <Text className="ml-2 text-neutral-300 text-sm font-semibold">
                {recipeData.yield || "4 servings"}
              </Text>
            </View>
          </View>

          {recipeData.description && (
            <View className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-5 mb-8">
              <Text className="text-neutral-400 text-base leading-relaxed italic">
                "{recipeData.description}"
              </Text>
            </View>
          )}

          {/* Ingredients */}
          <View className="mb-8">
            <View className="flex-row items-center mb-5 px-1">
              <Text className="text-2xl font-black text-white">Ingredients</Text>
              <View className="ml-3 bg-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-800">
                <Text className="text-neutral-500 text-sm font-bold">{recipeData.ingredients.length}</Text>
              </View>
            </View>
            <View className="bg-neutral-900 rounded-[32px] p-6 border border-neutral-800/50">
              {recipeData.ingredients.map((ing, i) => (
                <View key={i} className={cn("py-3 flex-row items-center", i < recipeData.ingredients.length - 1 && "border-b border-neutral-800/50")}>
                  <View className="w-2 h-2 rounded-full bg-amber-500/80 mr-4" />
                  <Text className="text-neutral-200 text-base flex-1 font-medium">{ing}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Steps Preview */}
          <View className="mb-8">
             <View className="flex-row items-center mb-5 px-1">
              <Text className="text-2xl font-black text-white">Instructions</Text>
              <View className="ml-3 bg-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-800">
                <Text className="text-neutral-500 text-sm font-bold">{recipeData.instructions.length}</Text>
              </View>
            </View>
            <View className="gap-4">
              {recipeData.instructions.map((step, i) => (
                <View key={i} className="bg-neutral-900/50 rounded-3xl p-5 flex-row border border-neutral-800/30">
                  <Text className="text-amber-500 font-black mr-4 text-lg">{i + 1}</Text>
                  <Text className="text-neutral-400 flex-1 leading-snug font-medium">{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Actions */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 pt-5 bg-neutral-950/95 border-t border-neutral-900"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-row gap-4">
          <Pressable
            onPress={handleSaveRecipe}
            disabled={isSaving || isSaved}
            className={cn(
              "flex-1 h-16 rounded-[22px] items-center justify-center border",
              isSaved 
                ? "bg-neutral-900 border-neutral-800" 
                : "bg-neutral-900 border-neutral-700 active:bg-neutral-800"
            )}
          >
            <View className="flex-row items-center">
              <Heart 
                size={22} 
                color={isSaved ? "#f59e0b" : "#ffffff"} 
                fill={isSaved ? "#f59e0b" : "transparent"} 
              />
              <Text className={cn(
                "ml-2.5 font-bold text-lg",
                isSaved ? "text-amber-500" : "text-white"
              )}>
                {isSaving ? "Saving..." : isSaved ? "Saved" : "Save later"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleStartCooking}
            className="flex-[1.6] h-16 rounded-[22px] bg-amber-500 items-center justify-center flex-row shadow-2xl active:scale-[0.98]"
          >
            <Play size={22} color="#000000" fill="#000000" />
            <Text className="ml-2.5 text-black font-black text-xl uppercase tracking-tighter">
              Start Cooking
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

