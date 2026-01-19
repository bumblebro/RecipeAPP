import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { 
  Link2, 
  ChefHat, 
  Clock, 
  Sparkles, 
  ArrowRight,
  Users,
  Quote,
  Type
} from "lucide-react-native";
import { useExtractionStore } from '../../stores/useExtractionStore';
import { recipeApi } from "../../features/recipe/recipe.api";
import { cn } from "../../lib/cn";
import { usePaywall } from "../../lib/usePaywall";
import { useShareIntent } from "expo-share-intent";
import { useAlert } from "../../components/AlertProvider";

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

const processedUrls = new Set<string>();

export default function PlusTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSubscribed, showPaywall, validateRecipeExtraction, recordSuccessfulExtraction } = usePaywall();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [url, setUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [importMode, setImportMode] = useState<"link" | "text">("link");
  const { isExtracting, setIsExtracting } = useExtractionStore();
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);

  const loadingMessages = [
    "Reading recipe secrets...",
    "Scanning ingredients...",
    "Translating chef talk...",
    "Importing deliciousness...",
    "Staging the ingredients...",
    "Polishing the instructions..."
  ];
  const { showAlert } = useAlert();
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isExtracting) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isExtracting]);

  const handleExtract = useCallback(async (arg?: string | any) => {
    const isLinkMode = importMode === "link";
    const targetUrl = (typeof arg === 'string') ? arg : url;
    const targetText = recipeText;
    
    if (isLinkMode && !targetUrl.trim()) {
      showAlert({
        title: "Link Required",
        message: "Please paste a recipe link first.",
        type: "warning"
      });
      return;
    }

    if (!isLinkMode && !targetText.trim()) {
      showAlert({
        title: "Text Required",
        message: "Please paste the recipe text first.",
        type: "warning"
      });
      return;
    }

    if (!isSubscribed) {
      const canProceed = validateRecipeExtraction();
      if (!canProceed) return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExtracting(true);

    try {
      const response = isLinkMode 
        ? await recipeApi.extractRecipe(targetUrl.trim())
        : await recipeApi.extractRecipeText(targetText.trim());
      
      recordSuccessfulExtraction();
      
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
        sourceUrl: isLinkMode ? targetUrl.trim() : "pasted-text",
        processedInstructions: (extractedData as any).processedInstructions
      };

      setRecentRecipes(prev => [recipe, ...prev].slice(0, 5));
      if (isLinkMode) setUrl("");
      else setRecipeText("");
      
      router.push({
        pathname: "/recipe-preview",
        params: { recipe: JSON.stringify(recipe) }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (e.response?.status === 403 && e.response?.data?.requiresUpgrade) {
        showPaywall();
        return;
      }

      const isLinkMode = importMode === "link";
      const message = isLinkMode 
        ? "We've noted this link! We'll work on supporting it soon. Please try another URL or paste the text directly."
        : "We couldn't quite read that! We've noted the error. Please try another recipe or refine the text.";

      showAlert({
        title: "Almost there!",
        message: message,
        type: "info"
      });
    } finally {
      setIsExtracting(false);
    }
  }, [url, recipeText, importMode, isSubscribed, validateRecipeExtraction, recordSuccessfulExtraction, showPaywall, router, setIsExtracting]);

  const intentLock = React.useRef(false);

  useEffect(() => {
    if (hasShareIntent && !intentLock.current) {
      const anyIntent = shareIntent as any;
      const candidateUrl = anyIntent.value || anyIntent.webUrl || (anyIntent.files?.[0]?.webUrl);

      if (candidateUrl && (typeof candidateUrl === 'string') && (candidateUrl.startsWith('http') || candidateUrl.startsWith('www'))) {
        if (processedUrls.has(candidateUrl)) {
             resetShareIntent();
             return;
        }

        intentLock.current = true;
        processedUrls.add(candidateUrl);
        setUrl(candidateUrl);
        setIsExtracting(true);
        
        handleExtract(candidateUrl)
          .catch(err => console.log("Share extraction error", err))
          .finally(() => {
             processedUrls.delete(candidateUrl);
          });
        
        setTimeout(() => {
          intentLock.current = false;
        }, 1000);
      }
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent, resetShareIntent, handleExtract, setIsExtracting]);

  const handleRecentRecipePress = useCallback((recipe: Recipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/recipe-preview",
      params: { recipe: JSON.stringify(recipe) }
    });
  }, [router]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View className="px-6 pt-8 pb-4 flex-row items-center justify-between border-b border-neutral-900" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-amber-500 rounded-lg items-center justify-center mr-3">
            <ChefHat size={18} color="#000000" />
          </View>
          <Text className="text-xl font-bold text-white">Recipe Import</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingHorizontal: 24 }}
      >
        {/* Hero Section */}
        <View className="py-8">
          <Text className="text-3xl font-bold text-white mb-2">Ready to</Text>
          <Text className="text-3xl font-bold text-amber-500">start cooking?</Text>
        </View>

        {/* Mode Toggle */}
        <View className="flex-row bg-neutral-900 rounded-2xl p-1 mb-6 border border-neutral-800">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setImportMode("link");
            }}
            className={cn(
              "flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2",
              importMode === "link" ? "bg-neutral-800" : "bg-transparent"
            )}
          >
            <Link2 size={16} color={importMode === "link" ? "#f59e0b" : "#666"} />
            <Text className={cn(
              "font-bold",
              importMode === "link" ? "text-white" : "text-neutral-500"
            )}>
              Website link
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setImportMode("text");
            }}
            className={cn(
              "flex-1 py-3 rounded-xl flex-row items-center justify-center gap-2",
              importMode === "text" ? "bg-neutral-800" : "bg-transparent"
            )}
          >
            <Type size={16} color={importMode === "text" ? "#f59e0b" : "#666"} />
            <Text className={cn(
              "font-bold",
              importMode === "text" ? "text-white" : "text-neutral-500"
            )}>
              Paste text
            </Text>
          </Pressable>
        </View>

        {/* Extraction Input Card */}
        <View className="bg-neutral-900 rounded-[32px] p-6 mb-8 border border-neutral-800 shadow-2xl">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-lg bg-amber-500/10 items-center justify-center mr-3">
              {importMode === 'link' ? (
                <Link2 size={18} color="#f59e0b" />
              ) : (
                <Quote size={18} color="#f59e0b" />
              )}
            </View>
            <Text className="text-lg font-bold text-white">
              {importMode === 'link' ? "Paste Recipe Link" : "Paste Recipe Text"}
            </Text>
          </View>
          
          <Text className="text-neutral-500 mb-6 text-sm leading-relaxed">
            {importMode === 'link' 
              ? "Drop any recipe blog link. Our system will handle the extraction."
              : "Paste ingredients and steps from any app or chat. We'll structure it for you."
            }
          </Text>

          <View className={cn(
            "bg-neutral-900 rounded-2xl px-4 py-3 border border-neutral-800 mb-5",
            importMode === 'text' ? "h-40" : "flex-row items-center"
          )}>
            {importMode === 'link' ? (
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://cooking-blog.com/recipe..."
                placeholderTextColor="#737373"
                className="flex-1 text-white text-base py-1"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#f59e0b"
              />
            ) : (
              <TextInput
                value={recipeText}
                onChangeText={setRecipeText}
                placeholder="1. Preheat oven to 350F...&#10;2. Mix 2 cups of flour..."
                placeholderTextColor="#737373"
                className="flex-1 text-white text-base py-1"
                multiline
                textAlignVertical="top"
                autoCorrect={false}
                selectionColor="#f59e0b"
              />
            )}
          </View>

          <Pressable
            onPress={handleExtract}
            disabled={isExtracting}
            style={({ pressed }) => [
              {
                borderRadius: 16,
                shadowColor: "#f59e0b",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 10,
              },
              isExtracting && { opacity: 0.6 },
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
          >
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
              }}
            >
              {isExtracting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#000" />
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>
                    {loadingMessages[loadingMessageIndex]}
                  </Text>
                </View>
              ) : (
                <>
                  <Sparkles size={18} color="#000000" />
                  <Text style={{ marginLeft: 8, color: '#000', fontWeight: '900', fontSize: 18 }}>
                    Recipe Import
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Recent Recipes */}
        {recentRecipes.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-4 px-1">
              <Text className="text-lg font-bold text-white">Recently Extracted</Text>
            </View>
            
            <View className="gap-3">
              {recentRecipes.map((recipe, index) => (
                <Pressable
                  key={recipe.id}
                  onPress={() => handleRecentRecipePress(recipe)}
                  className="bg-neutral-950 rounded-2xl p-3 flex-row items-center border border-neutral-900 active:bg-neutral-900"
                >
                  <View className="w-16 h-16 rounded-xl bg-neutral-900 overflow-hidden mr-3">
                    {recipe.image ? (
                      <Image 
                        source={{ uri: recipe.image }} 
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-neutral-900">
                         <ChefHat size={20} color="#4b5563" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>
                      {recipe.name}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <Clock size={12} color="#9ca3af" />
                        <Text className="ml-1.5 text-neutral-500 text-xs font-semibold">
                          {recipe.totalTime || "30m"}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                         <Users size={12} color="#9ca3af" />
                         <Text className="ml-1.5 text-neutral-500 text-xs font-semibold">{recipe.yield || "2"}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-neutral-900 items-center justify-center border border-neutral-800">
                     <ArrowRight size={14} color="#f59e0b" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {recentRecipes.length === 0 && (
          <View className="py-10 items-center justify-center opacity-30">
            <Sparkles size={40} color="#4b5563" />
            <Text className="text-neutral-500 mt-4 text-center">
              Paste a link to see the results.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
