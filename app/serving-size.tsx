import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../features/api/api.client";
import { usePaywall } from "../lib/usePaywall";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12];

export default function ServingSizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when screen comes into focus (e.g. back navigation)
  useFocusEffect(
    useCallback(() => {
      setIsLoading(false);
    }, [])
  );

  const loadingMessages = [
    "Gathering ingredients...",
    "Scaling quantities...",
    "Heating the pan...",
    "Consulting the chef...",
    "Setting the table...",
    "Preparing your guide..."
  ];
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const recipe = useMemo(() => {
    if (typeof params.recipe === "string") {
      try {
        return JSON.parse(params.recipe);
      } catch (e) {
        console.error("Failed to parse recipe JSON:", e);
      }
    }
    return null;
  }, [params.recipe]);

  const originalServings = useMemo(() => {
    // Check multiple common field names for yield/servings
    const yieldSource = recipe?.yield || recipe?.recipeYield || recipe?.servings;
    if (!yieldSource) return 4;
    
    const yieldStr = String(yieldSource);
    // Find the first number in the string
    const match = yieldStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 4;
  }, [recipe?.yield, recipe?.recipeYield, recipe?.servings]);

  const [selectedServings, setSelectedServings] = useState<number>(originalServings);

  // Sync selectedServings with originalServings when recipe loads
  useEffect(() => {
    if (originalServings) {
      setSelectedServings(originalServings);
    }
  }, [originalServings]);

  const { isSubscribed, validateCookingSession, recordSuccessfulCookingSession } = usePaywall();

  const handleContinue = async () => {
    if (!recipe) return;

    if (!isSubscribed) {
      const canProceed = validateCookingSession();
      if (!canProceed) return;
    }

    setIsLoading(true);

    try {
      // Always process to ensure scaling is applied by the AI
      const response = await api.post<any>("recipe/process", {
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        targetServings: selectedServings,
        originalServings: originalServings,
      });

      if (!response.success) {
        throw new Error("Failed to process the recipe.");
      }

      // Record usage only on success (Cooking made usage = success API response)
      recordSuccessfulCookingSession();

      // Add serving size info to the processed data
      const finalRecipe = {
        ...recipe,
        processedInstructions: response.processedInstructions,
        scaledIngredients: response.scaledIngredients,
        selectedServings,
        originalServings,
      };

      // Navigate to ingredients needed screen (Prep phase)
      router.push({
        pathname: "/ingredients-needed",
        params: { recipe: JSON.stringify(finalRecipe) },
      });
    } catch (error: any) {
      console.error("Error processing recipe:", error);
      alert("Failed to process recipe. Please try again.");
      setIsLoading(false);
    }
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No recipe data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Select Servings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe.name || "Recipe"}
          </Text>
          <Text style={styles.originalServings}>
            Original: {originalServings}{" "}
            {originalServings === 1 ? "serving" : "servings"}
          </Text>
        </View>

        {/* Serving Options */}
        <View style={styles.servingsContainer}>
          <Text style={styles.servingsLabel}>How many servings?</Text>
          <View style={styles.servingsGrid}>
            {SERVING_OPTIONS.map((servings) => (
              <Pressable
                key={servings}
                onPress={() => setSelectedServings(servings)}
                style={[
                  styles.servingButton,
                  selectedServings === servings && styles.servingButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.servingButtonText,
                    selectedServings === servings &&
                    styles.servingButtonTextActive,
                  ]}
                >
                  {servings}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Custom Input */}
        <View style={styles.customInputContainer}>
          <Text style={styles.customInputLabel}>Or enter custom:</Text>
          <View style={styles.customInputRow}>
            <Pressable
              onPress={() =>
                setSelectedServings(Math.max(1, selectedServings - 1))
              }
              style={styles.customButton}
            >
              <Text style={styles.customButtonText}>−</Text>
            </Pressable>
            <View style={styles.customValueContainer}>
              <Text style={styles.customValue}>{selectedServings}</Text>
              <Text style={styles.customValueLabel}>
                {selectedServings === 1 ? "serving" : "servings"}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedServings(selectedServings + 1)}
              style={styles.customButton}
            >
              <Text style={styles.customButtonText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Continue Button */}
        <Pressable
          onPress={handleContinue}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.continueButtonContainer,
            isLoading && styles.continueButtonDisabled,
            pressed && { transform: [{ scale: 0.98 }] }
          ]}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#000" />
                <Text style={styles.continueButtonText}>
                  {loadingMessages[loadingMessageIndex]}
                </Text>
              </View>
            ) : (
              <Text style={styles.continueButtonText}>
                Start Cooking ({selectedServings}{" "}
                {selectedServings === 1 ? "serving" : "servings"})
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: "#ffa500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  placeholder: {
    width: 44,
  },
  recipeInfo: {
    marginBottom: 32,
    alignItems: "center",
  },
  recipeName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
  },
  originalServings: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  servingsContainer: {
    marginBottom: 32,
  },
  servingsLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "center",
  },
  servingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  servingButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    borderWidth: 2,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  servingButtonActive: {
    backgroundColor: "#ffa500",
    borderColor: "#f59e0b",
  },
  servingButtonText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#9ca3af",
  },
  servingButtonTextActive: {
    color: "#000000",
  },
  customInputContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: 12,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  customButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffa500",
    justifyContent: "center",
    alignItems: "center",
  },
  customButtonText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  customValueContainer: {
    minWidth: 100,
    alignItems: "center",
  },
  customValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
  },
  customValueLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  continueButtonContainer: {
    marginTop: "auto",
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
  },
});
