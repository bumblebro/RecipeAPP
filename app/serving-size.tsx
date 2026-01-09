import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SERVING_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12];

export default function ServingSizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedServings, setSelectedServings] = useState<number>(4);
  const [isLoading, setIsLoading] = useState(false);

  let recipe = null;
  if (typeof params.recipe === "string") {
    try {
      recipe = JSON.parse(params.recipe);
    } catch (e) {
      console.error("Failed to parse recipe JSON:", e);
    }
  }

  const originalServings = useMemo(() => {
    if (!recipe?.yield) return 4;
    const yieldStr = String(recipe.yield);
    const match = yieldStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 4;
  }, [recipe?.yield]);

  const handleContinue = async () => {
    if (!recipe) return;

    setIsLoading(true);

    try {
      // Process the recipe if not already processed
      let processedRecipe = recipe;

      if (!recipe.processedInstructions) {
        const processResponse = await fetch(
          "http://localhost:4000/api/process-recipe",
          // "https://recipeserver.guidemyrecipe.com/api/process-recipe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instructions: recipe.instructions,
              ingredients: recipe.ingredients,
            }),
          }
        );
        console.log("processResponse", processResponse);

        if (!processResponse.ok) {
          throw new Error("Failed to process the recipe.");
        }

        const processedData = await processResponse.json();
        processedRecipe = {
          ...recipe,
          processedInstructions: processedData.processedInstructions,
        };
      }

      // Add serving size info
      const finalRecipe = {
        ...processedRecipe,
        selectedServings,
        originalServings,
      };

      // Navigate to recipe screen with processed recipe and serving size
      router.push({
        pathname: "/recipe",
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
          style={[
            styles.continueButton,
            isLoading && styles.continueButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>
              Start Cooking ({selectedServings}{" "}
              {selectedServings === 1 ? "serving" : "servings"})
            </Text>
          )}
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
  continueButton: {
    backgroundColor: "#ffa500",
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000000",
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
