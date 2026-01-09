import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

interface RecipeData {
  name: string;
  description?: string;
  image?: string | string[];
  ingredients: string[];
  instructions: string[];
  totalTime?: string;
  cookTime?: string;
  prepTime?: string;
  yield?: string | number;
  processedInstructions?: any[];
}

const formatDuration = (duration: string): string => {
  if (!duration) return "";
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return duration;
};

export default function RecipePreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { recipe } = useLocalSearchParams<{ recipe: string }>();

  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (recipe) {
      try {
        const parsed = JSON.parse(recipe);
        setRecipeData(parsed);

        // Handle image
        if (parsed.image) {
          if (Array.isArray(parsed.image) && parsed.image.length > 0) {
            setImage(parsed.image[0]);
          } else if (typeof parsed.image === "string") {
            setImage(parsed.image);
          }
        }
      } catch (error) {
        console.error("Error parsing recipe:", error);
      }
    }
  }, [recipe]);

  const handleStartCooking = () => {
    if (!recipeData) return;

    // Navigate to serving size selection screen
    // Processing will happen there after serving size is selected
    router.push({
      pathname: "/serving-size",
      params: { recipe: JSON.stringify(recipeData) },
    });
  };

  if (!recipeData) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffa500" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Back Button */}
      <View style={[styles.topBar]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.backButtonIcon}>←</Text>
        </Pressable>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* Recipe Image */}
          <View style={styles.imageContainer}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>🍳</Text>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Recipe Info */}
          <View style={styles.content}>
            <Text style={styles.recipeName}>{recipeData.name}</Text>

            {recipeData.description && (
              <Text style={styles.description}>{recipeData.description}</Text>
            )}

            {/* Meta Info */}
            <View style={styles.metaContainer}>
              {recipeData.totalTime && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>⏱️</Text>
                  <Text style={styles.metaText}>
                    {formatDuration(recipeData.totalTime)}
                  </Text>
                </View>
              )}
              {recipeData.yield && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>👥</Text>
                  <Text style={styles.metaText}>
                    {recipeData.yield} servings
                  </Text>
                </View>
              )}
              {recipeData.ingredients && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>🥄</Text>
                  <Text style={styles.metaText}>
                    {recipeData.ingredients.length} ingredients
                  </Text>
                </View>
              )}
              {recipeData.instructions && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📖</Text>
                  <Text style={styles.metaText}>
                    {recipeData.instructions.length} steps
                  </Text>
                </View>
              )}
            </View>

            {/* Ingredients Section */}
            {recipeData.ingredients && recipeData.ingredients.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>🥄</Text>
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  <Text style={styles.sectionCount}>
                    ({recipeData.ingredients.length} items)
                  </Text>
                </View>
                <View style={styles.ingredientsList}>
                  {recipeData.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientBullet}>•</Text>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Instructions Section */}
            {recipeData.instructions && recipeData.instructions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📖</Text>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                  <Text style={styles.sectionCount}>
                    ({recipeData.instructions.length} steps)
                  </Text>
                </View>
                <View style={styles.instructionsList}>
                  {recipeData.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionItem}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Start Cooking Button */}
      <View style={[styles.footer]}>
        <Pressable
          onPress={handleStartCooking}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Start Cooking</Text>
            <Text style={styles.buttonSubtext}>AI Step-by-Step Guide</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#000000",
    zIndex: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonIcon: {
    fontSize: 20,
    color: "#9ca3af",
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: "100%",
    height: 280,
    backgroundColor: "#1a1a1a",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  placeholderIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "#000000",
  },
  recipeName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: "#9ca3af",
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "400",
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: "#e1e4e8",
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButton: {
    width: "100%",
    borderRadius: 20,
    minHeight: 70,
    backgroundColor: "#ffa500",
    borderWidth: 2,
    borderColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonContent: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    color: "rgba(0, 0, 0, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  section: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9ca3af",
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  ingredientBullet: {
    fontSize: 18,
    color: "#ffa500",
    marginRight: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: "#e1e4e8",
    lineHeight: 22,
    fontWeight: "400",
  },
  instructionsList: {
    gap: 20,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffa500",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000000",
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: "#e1e4e8",
    lineHeight: 24,
    fontWeight: "400",
  },
});
