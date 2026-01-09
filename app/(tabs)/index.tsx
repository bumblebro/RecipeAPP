import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
// import { LinearGradient } from "expo-linear-gradient"; // Temporarily disabled due to native module linking issue
import * as Haptics from "expo-haptics";
import { Link2, Plus, Clock, ChefHat, Users, Play } from "lucide-react-native";
import { useCookingStore } from "../../stores/useCookingStore";
import RecipeImportScreen from "../../components/cooking/RecipeImportScreen";
import { cn } from "../../lib/cn";

type ViewState = "home" | "import" | "overview" | "cooking" | "completed";

interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string | string[];
  ingredients: string[];
  instructions: string[];
  processedInstructions?: any[];
  totalTime?: string;
  cookTime?: string;
  prepTime?: string;
  yield?: string | number;
  sourceUrl?: string;
}

// Sample recipe data
const sampleRecipe: Recipe = {
  id: "sample-1",
  name: "Classic Chocolate Chip Cookies",
  description:
    "Soft and chewy chocolate chip cookies that are perfect for any occasion.",
  image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
  ingredients: [
    "2 1/4 cups all-purpose flour",
    "1 tsp baking soda",
    "1 cup butter, softened",
    "3/4 cup granulated sugar",
    "3/4 cup brown sugar",
    "2 large eggs",
    "2 tsp vanilla extract",
    "2 cups chocolate chips",
  ],
  instructions: [
    "Preheat oven to 375°F (190°C).",
    "Mix flour, baking soda, and salt in a bowl.",
    "Cream butter and sugars until fluffy.",
    "Beat in eggs and vanilla.",
    "Gradually blend in flour mixture.",
    "Stir in chocolate chips.",
    "Drop rounded tablespoons onto ungreased baking sheets.",
    "Bake 9-11 minutes until golden brown.",
  ],
  totalTime: "PT30M",
  yield: 24,
};

const formatDuration = (duration: string): string => {
  if (!duration) return "0 min";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return duration;
};

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipe: activeRecipe, hasActiveSession } = useCookingStore();

  const [viewState, setViewState] = useState<ViewState>("home");
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Check if there's an active recipe
  const hasActive = useMemo(() => hasActiveSession(), [hasActiveSession]);

  const handleImportPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setViewState("import");
  }, []);

  const handleImport = useCallback(async (url: string) => {
    setIsImporting(true);
    try {
      // Extract recipe
      const extractResponse = await fetch(
        "http://localhost:4000/api/extract-recipe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );

      if (!extractResponse.ok) {
        throw new Error("Failed to extract recipe from URL.");
      }

      const extractedData = await extractResponse.json();
      const recipe: Recipe = {
        ...extractedData,
        sourceUrl: url,
      };
      setCurrentRecipe(recipe);
      setViewState("overview");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      throw new Error(e.message || "An unexpected error occurred.");
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleSampleRecipe = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentRecipe(sampleRecipe);
    setViewState("overview");
  }, []);

  const handleResumeCooking = useCallback(() => {
    if (!activeRecipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to recipe screen with active recipe
    router.push({
      pathname: "/recipe",
      params: {
        recipe: JSON.stringify({
          name: activeRecipe.title,
          processedInstructions: activeRecipe.steps.map((step) => ({
            action: step.text,
            duration: step.time,
            durationUnit: "minutes" as const,
          })),
        }),
      },
    });
  }, [activeRecipe, router]);

  const handleStartCooking = useCallback(() => {
    if (!currentRecipe) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/serving-size",
      params: { recipe: JSON.stringify(currentRecipe) },
    });
  }, [currentRecipe, router]);

  // Import Screen
  if (viewState === "import") {
    return (
      <RecipeImportScreen
        onClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setViewState("home");
        }}
        onImport={handleImport}
      />
    );
  }

  // Overview Screen
  if (viewState === "overview" && currentRecipe) {
    const displayRecipe = currentRecipe;
    const totalTime = formatDuration(displayRecipe.totalTime || "PT0M");
    const servings =
      typeof displayRecipe.yield === "number"
        ? displayRecipe.yield
        : typeof displayRecipe.yield === "string"
        ? parseInt(displayRecipe.yield) || 4
        : 4;
    const steps =
      displayRecipe.processedInstructions || displayRecipe.instructions || [];
    const imageUrl = Array.isArray(displayRecipe.image)
      ? displayRecipe.image[0]
      : displayRecipe.image;

    return (
      <View className="flex-1 bg-neutral-950">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Image Section */}
          <View className="h-80 relative">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-neutral-900 items-center justify-center">
                <ChefHat size={64} color="#4b5563" />
              </View>
            )}
            {/* Gradient Overlay - Using View with opacity for gradient effect */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 160,
                backgroundColor: "#0a0a0a",
              }}
            />
            {/* Back Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewState("home");
              }}
              style={{
                position: "absolute",
                top: insets.top + 8,
                left: 16,
              }}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-70"
            >
              <Text className="text-white text-xl">←</Text>
            </Pressable>
          </View>

          {/* Content Area */}
          <View className="px-5 -mt-16">
            {/* Title */}
            <Animated.Text
              entering={FadeInUp.delay(100).duration(400)}
              className="text-3xl font-bold text-white mb-3"
            >
              {displayRecipe.name}
            </Animated.Text>

            {/* Meta Information */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              className="flex-row items-center gap-4 mb-6"
            >
              <View className="flex-row items-center">
                <Clock size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400">{totalTime}</Text>
              </View>
              <View className="flex-row items-center">
                <Users size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400">
                  {servings} servings
                </Text>
              </View>
              <View className="flex-row items-center">
                <ChefHat size={16} color="#9ca3af" />
                <Text className="ml-1.5 text-neutral-400">
                  {steps.length} steps
                </Text>
              </View>
            </Animated.View>

            {/* Source URL */}
            {displayRecipe.sourceUrl && (
              <Animated.View
                entering={FadeInUp.delay(250).duration(400)}
                className="flex-row items-center mb-4"
              >
                <Link2 size={14} color="#6b7280" />
                <Text
                  className="ml-1.5 text-neutral-500 text-sm"
                  numberOfLines={1}
                >
                  {extractDomain(displayRecipe.sourceUrl)}
                </Text>
              </Animated.View>
            )}

            {/* Description */}
            {displayRecipe.description && (
              <Animated.Text
                entering={FadeInUp.delay(300).duration(400)}
                className="text-neutral-400 text-base leading-relaxed mb-8"
              >
                {displayRecipe.description}
              </Animated.Text>
            )}

            {/* Resume Banner */}
            {hasActive &&
              activeRecipe &&
              activeRecipe.title === displayRecipe.name && (
                <Animated.View
                  entering={FadeInUp.delay(350).duration(400)}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6"
                >
                  <Text className="text-amber-400 font-semibold mb-1">
                    Resume Cooking
                  </Text>
                  <Text className="text-white font-medium mb-1">
                    {activeRecipe.title}
                  </Text>
                  <Text className="text-neutral-400 text-sm mb-3">
                    You have an active cooking session. Pick up where you left
                    off!
                  </Text>
                  <Pressable
                    onPress={handleResumeCooking}
                    className="w-full bg-amber-500 rounded-xl py-3 items-center justify-center active:opacity-80"
                  >
                    <Text className="text-black font-bold">
                      Continue Cooking
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

            {/* Ingredients Section */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(400)}
              className="mb-6"
            >
              <Text className="text-lg font-semibold text-white mb-3">
                Ingredients ({displayRecipe.ingredients.length})
              </Text>
              <View className="bg-neutral-900 rounded-2xl p-4">
                {displayRecipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    className={cn(
                      "flex-row items-center justify-between py-2.5",
                      index < displayRecipe.ingredients.length - 1 &&
                        "border-b border-neutral-800"
                    )}
                  >
                    <Text className="text-white flex-1">{ingredient}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Steps Section */}
            <Animated.View entering={FadeInUp.delay(500).duration(400)}>
              <Text className="text-lg font-semibold text-white mb-3">
                Steps ({steps.length})
              </Text>
              <View className="gap-3">
                {steps.map((step: any, index: number) => {
                  const stepText =
                    typeof step === "string" ? step : step.action || step.text;
                  const stepTime =
                    typeof step === "object" && step.duration
                      ? step.duration
                      : typeof step === "object" && step.time
                      ? step.time
                      : 0;

                  return (
                    <View
                      key={index}
                      className="flex-row items-start bg-neutral-900 rounded-xl p-4"
                    >
                      <View className="w-7 h-7 rounded-full bg-neutral-800 items-center justify-center mr-3">
                        <Text className="text-neutral-400 text-sm font-semibold">
                          {index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-sm leading-relaxed">
                          {stepText}
                        </Text>
                        {stepTime > 0 && (
                          <View className="flex-row items-center mt-2">
                            <Clock size={12} color="#f59e0b" />
                            <Text className="ml-1 text-amber-500 text-xs">
                              {stepTime} min
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Floating CTA Button */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 pt-4"
          style={{
            paddingBottom: insets.bottom + 16,
            backgroundColor: "transparent",
          }}
        >
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 100,
              backgroundColor: "#0a0a0a",
            }}
          />
          <Pressable
            onPress={handleStartCooking}
            className="w-full h-14 rounded-2xl bg-amber-500 items-center justify-center flex-row active:opacity-80"
          >
            <Play size={22} color="#000000" />
            <Text className="ml-2 text-black font-bold text-lg">
              Start Cooking Mode
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Home Screen
  return (
    <View className="flex-1 bg-neutral-950">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: "#0a0a0a",
        }}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header */}
          <Animated.View
            entering={FadeInUp.duration(400)}
            className="pt-8 pb-6"
          >
            <Text className="text-3xl font-bold text-white mb-2">
              Smart Cooking
            </Text>
            <Text className="text-neutral-400">
              Step-by-step guided cooking experience
            </Text>
          </Animated.View>

          {/* 2. Resume Banner */}
          {hasActive && activeRecipe && (
            <Animated.View
              entering={FadeInUp.delay(100).duration(400)}
              className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6"
            >
              <Text className="text-amber-400 font-semibold mb-1">
                Resume Cooking
              </Text>
              <Text className="text-white font-medium mb-1">
                {activeRecipe.title}
              </Text>
              <Text className="text-neutral-400 text-sm mb-3">
                You have an active cooking session. Pick up where you left off!
              </Text>
              <Pressable
                onPress={handleResumeCooking}
                className="w-full bg-amber-500 rounded-xl py-3 items-center justify-center active:opacity-80"
              >
                <Text className="text-black font-bold">Continue Cooking</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* 3. Import Card */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Pressable
              onPress={handleImportPress}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-4 active:opacity-80"
            >
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-full bg-amber-500/20 items-center justify-center">
                  <Link2 size={28} color="#f59e0b" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-white text-lg font-semibold mb-1">
                    Import from URL
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    Paste a link from any recipe website
                  </Text>
                </View>
                <Plus size={24} color="#6b7280" />
              </View>
              <Text className="text-neutral-500 text-xs">
                Supports most popular recipe websites
              </Text>
            </Pressable>
          </Animated.View>

          {/* 4. Divider */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(400)}
            className="flex-row items-center my-6"
          >
            <View className="flex-1 h-px bg-neutral-800" />
            <Text className="mx-4 text-neutral-500 text-sm">
              or try a sample
            </Text>
            <View className="flex-1 h-px bg-neutral-800" />
          </Animated.View>

          {/* 5. Sample Recipe Card */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Pressable
              onPress={handleSampleRecipe}
              className="bg-neutral-900 rounded-2xl overflow-hidden active:opacity-80"
            >
              {sampleRecipe.image &&
                (Array.isArray(sampleRecipe.image) ? (
                  <Image
                    source={{ uri: sampleRecipe.image[0] }}
                    className="w-full h-40"
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={{ uri: sampleRecipe.image }}
                    className="w-full h-40"
                    resizeMode="cover"
                  />
                ))}
              <View className="p-4">
                <Text className="text-white text-lg font-semibold mb-2">
                  {sampleRecipe.name}
                </Text>
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <Clock size={14} color="#9ca3af" />
                    <Text className="ml-1.5 text-neutral-400 text-sm">
                      {formatDuration(sampleRecipe.totalTime || "PT0M")}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <ChefHat size={14} color="#9ca3af" />
                    <Text className="ml-1.5 text-neutral-400 text-sm">
                      {sampleRecipe.instructions.length} steps
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}
