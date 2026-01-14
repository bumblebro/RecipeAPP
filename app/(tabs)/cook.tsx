import React, { useCallback } from "react";
import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChefHat, Play, Clock, ArrowRight, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCookingStore } from "../../stores/useCookingStore";
import { cn } from "../../lib/cn";

export default function CookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { 
    recipe, 
    rawRecipeData, 
    currentStepIndex, 
    hasActiveSession, 
    resetSession 
  } = useCookingStore();

  const isActive = hasActiveSession();

  const handleResume = useCallback(() => {
    if (!rawRecipeData) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/recipe",
      params: { recipe: JSON.stringify(rawRecipeData) },
    });
  }, [rawRecipeData, router]);

  const handleClear = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetSession();
  }, [resetSession]);

  if (isActive && recipe) {
    const totalSteps = recipe.steps.length;
    const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

    return (
      <View className="flex-1 bg-neutral-950">
        <ScrollView 
          className="flex-1 px-6"
          style={{ paddingTop: insets.top }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="py-6">
            <Text className="text-3xl font-bold text-white mb-2">Cooking Now</Text>
            <Text className="text-neutral-500 mb-8">You have an active cooking session.</Text>

            {/* Session Card */}
            <View className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 shadow-xl">
              {rawRecipeData?.image && (
                <Image 
                  source={{ uri: typeof rawRecipeData.image === 'string' ? rawRecipeData.image : rawRecipeData.image[0] }} 
                  className="w-full h-48"
                  resizeMode="cover"
                />
              )}
              
              <View className="p-6">
                <Text className="text-2xl font-bold text-white mb-4">
                  {recipe.title}
                </Text>

                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Clock size={16} color="#9ca3af" />
                    <Text className="ml-2 text-neutral-400">
                      {recipe.totalTime} min total
                    </Text>
                  </View>
                  <Text className="text-amber-500 font-bold">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className="h-2 w-full bg-neutral-800 rounded-full mb-8 overflow-hidden">
                  <View 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
                </View>

                <View className="flex-row gap-4">
                  <Pressable
                    onPress={handleResume}
                    className="flex-1 bg-amber-500 h-14 rounded-2xl flex-row items-center justify-center active:opacity-80"
                  >
                    <Play size={20} color="#000000" fill="#000000" />
                    <Text className="text-black font-bold text-lg ml-2">Resume</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleClear}
                    className="w-14 h-14 bg-neutral-800 rounded-2xl items-center justify-center active:bg-neutral-700"
                  >
                    <Trash2 size={24} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <View 
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-24 h-24 rounded-full bg-neutral-900 items-center justify-center mb-6">
          <ChefHat size={48} color="#525252" />
        </View>
        
        <Text className="text-2xl font-bold text-white mb-2 text-center">
          No active cooking session
        </Text>
        
        <Text className="text-neutral-400 text-center mb-8">
          Select a recipe to start cooking or extract a new one from a link.
        </Text>

        <Pressable
          onPress={() => router.push("/")} 
          className="w-full bg-amber-500 rounded-xl py-4 flex-row items-center justify-center active:opacity-80 shadow-lg shadow-amber-500/20"
        >
          <Play size={20} color="#000000" fill="#000000" />
          <Text className="text-black font-bold text-lg ml-2">
            Pick a Recipe
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
