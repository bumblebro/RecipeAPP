import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { 
  Link2, 
  ChefHat, 
  Clock, 
  Settings, 
  Sparkles, 
  Play,
  ArrowRight,
  Heart,
  Users
} from "lucide-react-native";
import { useCookingStore } from "../../stores/useCookingStore";
import { useExtractionStore } from '../../stores/useExtractionStore';
import { recipeApi } from "../../features/recipe/recipe.api";
import { cn } from "../../lib/cn";
import { usePaywall } from "../../lib/usePaywall";

import { useShareIntent } from "expo-share-intent";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  processedInstructions?: any[];
  totalTime?: string;
  yield?: string | number;
  sourceUrl?: string;
}

type ViewState = "home" | "overview";

const processedUrls = new Set<string>();

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasActiveSession, recipe: activeRecipe } = useCookingStore();
  const { isSubscribed, showPaywall, checkAndUseRecipeExtraction, checkAndUseCookingSession, checkCanSaveRecipe } = usePaywall();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [viewState, setViewState] = useState<ViewState>("home");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [url, setUrl] = useState("");
  const { isExtracting, setIsExtracting } = useExtractionStore();
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  /* Fix: Argument can be an event (from onPress) or a string (from Share Intent) */
  const handleExtract = useCallback(async (arg?: string | any) => {
    const targetUrl = (typeof arg === 'string') ? arg : url;
    
    if (!targetUrl.trim()) {
      Alert.alert("Error", "Please paste a recipe link first.");
      return;
    }

    // Check usage limits for free users (client-side)
    if (!isSubscribed && !checkAndUseRecipeExtraction()) {
      return; // Paywall already shown by checkAndUseRecipeExtraction
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExtracting(true);
    // Determine which URL to use for API call
    const apiCallUrl = targetUrl.trim();

    try {
      const response = await recipeApi.extractRecipe(apiCallUrl);
      const extractedData = response.data;

      const recipe: Recipe = {
        id: `imported-${Date.now()}`,
        name: extractedData.name,
        description: extractedData.description,
        image: extractedData.image,
        ingredients: extractedData.ingredients,
        instructions: extractedData.instructions,
        totalTime: extractedData.totalTime,
        yield: extractedData.yield,
        sourceUrl: apiCallUrl,
        processedInstructions: (extractedData as any).processedInstructions
      };

      // Add to recent recipes
      setRecentRecipes(prev => [recipe, ...prev].slice(0, 5));
      setUrl("");

      // Show Overview instead of immediate navigation
      setSelectedRecipe(recipe);
      setViewState("overview");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle the 'Require upgrade' error 403 specially
      if (e.response?.status === 403 && e.response?.data?.requiresUpgrade) {
        showPaywall();
        return;
      }

      Alert.alert(
        "Extraction Failed",
        e.response?.data?.error || "Could not extract recipe. Please try again or check the URL."
      );
    } finally {
      setIsExtracting(false);
    }
  }, [url, isSubscribed, checkAndUseRecipeExtraction, showPaywall]);


  const intentLock = React.useRef(false);

  /* Handle Share Intent (Incoming URL from other apps) */
  useEffect(() => {
    if (hasShareIntent && !intentLock.current) {
      console.log("DEBUG: Received Share Intent:", JSON.stringify(shareIntent, null, 2));
      
      const anyIntent = shareIntent as any;
      const candidateUrl = anyIntent.value || anyIntent.webUrl || (anyIntent.files?.[0]?.webUrl);

      if (candidateUrl && (typeof candidateUrl === 'string') && (candidateUrl.startsWith('http') || candidateUrl.startsWith('www'))) {
        
        // GLOBAL LOCK: Check if this URL was recently processed
        if (processedUrls.has(candidateUrl)) {
             console.log("DEBUG: Duplicate share ignored:", candidateUrl);
             resetShareIntent();
             return;
        }

        // Lock locally and globally
        intentLock.current = true;
        processedUrls.add(candidateUrl);
        
        console.log("DEBUG: Extracted URL:", candidateUrl);
        setUrl(candidateUrl);
        
        // Force loading state immediately
        setIsExtracting(true);
        
        // Auto-trigger extraction
        // Clear global lock ONLY after extraction finishes (success or fail)
        handleExtract(candidateUrl)
          .catch(err => console.log("Share extraction error", err))
          .finally(() => {
             console.log("DEBUG: Releasing lock for", candidateUrl);
             processedUrls.delete(candidateUrl);
          });
        
        // Reset local lock quickly (debounce rapid fires)
        setTimeout(() => {
          intentLock.current = false;
        }, 1000);
      } else {
         console.log("DEBUG: No valid URL found in share intent");
      }
      
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, resetShareIntent, handleExtract]);

  const handleStartCooking = useCallback(async () => {
    if (!selectedRecipe) return;

    // Check usage limits for free users (client-side)
    if (!isSubscribed && !checkAndUseCookingSession()) {
      return; // Paywall already shown by checkAndUseCookingSession
    }

    try {
      // Track session in backend (limit 3/day)
      await recipeApi.trackCookSession();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({
        pathname: "/serving-size",
        params: { recipe: JSON.stringify(selectedRecipe) },
      });
    } catch (error: any) {
      if (error.status === 403) {
        Alert.alert(
          "Limit Reached",
          error.message || "You've reached your daily cooking limit.",
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: showPaywall },
          ]
        );
      } else {
        console.error("Failed to track cooking session:", error);
        Alert.alert("Error", "Could not start cooking session. Please try again.");
      }
    }
  }, [selectedRecipe, router, isSubscribed, checkAndUseCookingSession, showPaywall]);

  const handleSaveRecipe = useCallback(async () => {
    if (!selectedRecipe || isSaving || isSaved) return;

    // Check saved recipes limit for free users (client-side)
    if (!isSubscribed && !checkCanSaveRecipe()) {
      return; // Paywall already shown by checkCanSaveRecipe
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await recipeApi.saveRecipe(selectedRecipe.name, selectedRecipe);
      setIsSaved(true);
      Alert.alert("Saved!", "Recipe added to your cookbook.");
    } catch (error: any) {
      if (error.status === 403) {
        Alert.alert(
          "Limit Reached",
          error.message || "You've reached your saved recipes limit.",
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade to Premium', onPress: showPaywall },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to save recipe. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedRecipe, isSaving, isSaved, isSubscribed, checkCanSaveRecipe, showPaywall]);

  // Overview UI
  if (viewState === "overview" && selectedRecipe) {
    return (
      <View className="flex-1 bg-neutral-950">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewState("home");
            }}
            style={{ marginTop: insets.top + 10 }}
            className="flex-row items-center px-5 py-2 mb-4"
          >
            <Text className="text-amber-500 text-lg font-semibold">← Back to Home</Text>
          </Pressable>

          <View className="px-5">
            {selectedRecipe.image && (
              <View className="relative w-full h-56 mb-6">
                <Image
                  source={{ uri: typeof selectedRecipe.image === 'string' ? selectedRecipe.image : selectedRecipe.image[0] }}
                  className="w-full h-full rounded-3xl"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={handleSaveRecipe}
                  disabled={isSaving}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/20"
                >
                  <Heart 
                    size={24} 
                    color={isSaved ? "#f59e0b" : "#ffffff"} 
                    fill={isSaved ? "#f59e0b" : "transparent"} 
                  />
                </Pressable>
              </View>
            )}

            <Text className="text-3xl font-bold text-white mb-3">
              {selectedRecipe.name}
            </Text>

            <View className="flex-row items-center gap-4 mb-6">
              <View className="flex-row items-center bg-neutral-900 px-3 py-1.5 rounded-full">
                <Clock size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400 text-sm">
                  {selectedRecipe.totalTime || "30 min"}
                </Text>
              </View>
              <View className="flex-row items-center bg-neutral-900 px-3 py-1.5 rounded-full">
                <ChefHat size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400 text-sm">
                  {selectedRecipe.instructions.length} steps
                </Text>
              </View>
              <View className="flex-row items-center bg-neutral-900 px-3 py-1.5 rounded-full">
                <Users size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400 text-sm">
                  {selectedRecipe.yield || "4 servings"}
                </Text>
              </View>
            </View>

            {selectedRecipe.description && (
              <Text className="text-neutral-400 text-base leading-relaxed mb-8 px-1">
                {selectedRecipe.description}
              </Text>
            )}

            {/* Ingredients */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-white mb-4 px-1">Ingredients</Text>
              <View className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <View key={i} className={cn("py-2.5 flex-row items-center", i < selectedRecipe.ingredients.length - 1 && "border-b border-neutral-800")}>
                    <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3" />
                    <Text className="text-white flex-1">{ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Steps Preview */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-white mb-4 px-1">Instructions</Text>
              <View className="gap-3">
                {selectedRecipe.instructions.map((step, i) => (
                  <View key={i} className="bg-neutral-900 rounded-2xl p-4 flex-row border border-neutral-800">
                    <Text className="text-amber-500 font-bold mr-3 w-4">{i + 1}.</Text>
                    <Text className="text-neutral-300 flex-1 leading-tight">{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Start Cooking Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-neutral-950/90"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={handleStartCooking}
            className="w-full h-16 rounded-2xl bg-amber-500 items-center justify-center flex-row shadow-2xl"
          >
            <Play size={24} color="#000000" fill="#000000" />
            <Text className="ml-3 text-black font-extrabold text-xl uppercase tracking-tight">
              Start Cooking Mode
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        className="flex-1"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="px-5 py-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-amber-500 rounded-lg items-center justify-center mr-2">
              <ChefHat size={20} color="#000000" />
            </View>
            <Text className="text-xl font-bold text-white">RecipeGenie</Text>
          </View>
          <Pressable 
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="w-10 h-10 rounded-full bg-neutral-900 items-center justify-center"
          >
            <Settings size={20} color="#9ca3af" />
          </Pressable>
        </View>

        <ScrollView 
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Input Card */}
          <Animated.View 
            entering={FadeInUp.delay(100).duration(500)}
            className="bg-neutral-900 rounded-3xl p-6 mb-6 shadow-xl border border-neutral-800"
          >
            <Text className="text-xl font-bold text-white mb-2">
              Paste a recipe link
            </Text>
            <Text className="text-neutral-400 mb-6 font-medium">
              We'll extract ingredients & steps automatically.
            </Text>

            <View className="bg-neutral-800 rounded-2xl px-4 py-2 border border-neutral-700 mb-4 flex-row items-center">
              <Link2 size={20} color="#6b7280" className="mr-2" />
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="Blog, YouTube, or News link..."
                placeholderTextColor="#4b5563"
                className="flex-1 text-white h-12 text-base"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              onPress={handleExtract}
              disabled={isExtracting}
              className={cn(
                "h-14 rounded-2xl items-center justify-center flex-row",
                isExtracting ? "bg-neutral-800" : "bg-amber-500"
              )}
            >
              {isExtracting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Sparkles size={20} color="#000000" />
                  <Text className="ml-2 text-black font-bold text-lg">
                    Extract Recipe
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Smart Feature Info Card */}
          <Animated.View 
            entering={FadeInUp.delay(200).duration(500)}
            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mr-4">
              <Sparkles size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold mb-0.5">
                Smart Extract
              </Text>
              <Text className="text-neutral-400 text-sm leading-tight">
                Instantly converts any food blog into guided cooking steps.
              </Text>
            </View>
          </Animated.View>

          {/* Recent Recipes */}
          {recentRecipes.length > 0 && (
            <Animated.View entering={FadeIn.delay(300)}>
              <Text className="text-lg font-bold text-white mb-4 px-1">
                Recent Recipes
              </Text>
              <View className="gap-3">
                {recentRecipes.map((recipe, index) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedRecipe(recipe);
                      setViewState("overview");
                    }}
                    className="bg-neutral-900 rounded-2xl p-3 flex-row items-center border border-neutral-800"
                  >
                    <View className="w-16 h-16 rounded-xl bg-neutral-800 overflow-hidden mr-3">
                      {recipe.image ? (
                        <Image 
                          source={{ uri: recipe.image }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <ChefHat size={24} color="#4b5563" style={{ alignSelf: 'center', marginTop: 16 }} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-1" numberOfLines={1}>
                        {recipe.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Clock size={12} color="#9ca3af" />
                        <Text className="ml-1 text-neutral-500 text-xs">
                          {recipe.instructions.length} steps
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={18} color="#4b5563" className="ml-2" />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Empty State Recent */}
          {recentRecipes.length === 0 && (
            <View className="py-10 items-center justify-center opacity-30">
              <ChefHat size={40} color="#4b5563" />
              <Text className="text-neutral-500 mt-4 text-center">
                Your extracted recipes will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Fullscreen Loading Overlay */}
      {isExtracting && (
        <View style={{
          position: 'absolute',
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-white font-bold mt-6 text-xl">Extracting Recipe...</Text>
          <Text className="text-neutral-400 text-base mt-2">Analyzing content with AI</Text>
        </View>
      )}
    </View>
  );
}

