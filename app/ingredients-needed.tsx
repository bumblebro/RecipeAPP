import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ListChecks, ArrowLeft, Play, Info, Check, Square, ChevronRight } from "lucide-react-native";
import { MotiView, MotiText, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";

export default function IngredientsNeededScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  let recipeData = null;
  if (typeof params.recipe === "string") {
    try {
      recipeData = JSON.parse(params.recipe);
    } catch (e) {
      console.error("Failed to parse recipe JSON:", e);
    }
  }

  const ingredients = recipeData?.scaledIngredients || [];
  const selectedServings = recipeData?.selectedServings || 4;

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedIngredients(newChecked);
  };

  const handleStartCooking = () => {
    router.push({
      pathname: "/recipe",
      params: { recipe: JSON.stringify(recipeData) },
    });
  };

  if (!recipeData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Missing recipe data.</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Ingredients Needed</Text>
            <View style={styles.servingsBadge}>
              <Text style={styles.servingsText}>For {selectedServings} Servings</Text>
            </View>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Header */}
          <MotiView
            animate={{ opacity: 1, scale: 1 }}
            from={{ opacity: 0, scale: 0.9 }}
            style={styles.progressContainer}
          >
            <Text style={styles.progressText}>
              {checkedIngredients.size} of {ingredients.length} items ready
            </Text>
            <View style={styles.progressBarBg}>
              <MotiView
                animate={{ width: `${(checkedIngredients.size / ingredients.length) * 100}%` || "0%" }}
                transition={{ type: "timing", duration: 500 }}
                style={styles.progressBarFill}
              />
            </View>
          </MotiView>

          {/* Note Section */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500 }}
            style={styles.infoCard}
          >
            <Info size={18} color="#fbbf24" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Tap each item once you have it ready on your counter.
            </Text>
          </MotiView>

          {/* Ingredients List */}
          <View style={styles.ingredientsList}>
            {ingredients.map((ingredient, index) => {
              const isChecked = checkedIngredients.has(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => toggleIngredient(index)}
                >
                  <MotiView
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{
                      opacity: isChecked ? 0.5 : 1,
                      translateX: 0,
                      scale: isChecked ? 0.98 : 1,
                      backgroundColor: isChecked ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)"
                    }}
                    transition={{ type: "timing", duration: 300, delay: index * 50 }}
                    style={[
                      styles.ingredientItem,
                      isChecked && styles.ingredientItemChecked
                    ]}
                  >
                    <View style={styles.checkboxContainer}>
                      <AnimatePresence exitBeforeEnter>
                        {isChecked ? (
                          <MotiView
                            key="checked"
                            from={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Check size={20} color="#ffa500" strokeWidth={3} />
                          </MotiView>
                        ) : (
                          <MotiView
                            key="unchecked"
                            from={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                          >
                            <Square size={20} color="rgba(255,255,255,0.2)" />
                          </MotiView>
                        )}
                      </AnimatePresence>
                    </View>
                    <View style={styles.ingredientDetails}>
                      <Text style={[
                        styles.ingredientName,
                        isChecked && styles.textStrikethrough
                      ]}>
                        {ingredient.name}
                      </Text>
                      {ingredient.quantity && (
                        <Text style={[
                          styles.ingredientQuantity,
                          isChecked && styles.textStrikethrough
                        ]}>
                          {ingredient.quantity} {ingredient.unit || ""}
                        </Text>
                      )}
                      {ingredient.originalString && !isChecked && (
                        <Text style={styles.originalString}>
                          Original: {ingredient.originalString}
                        </Text>
                      )}
                    </View>
                  </MotiView>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

      </SafeAreaView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable
          onPress={handleStartCooking}
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
        >
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.buttonContent}>
              <View style={styles.playIconContainer}>
                <Play size={20} color="#000000" fill="#000000" />
              </View>
              <Text style={styles.startButtonText}>Start Cooking</Text>
            </View>
            <ChevronRight size={24} color="#000000" style={styles.arrowIcon} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  servingsBadge: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  servingsText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // More padding for fixed footer
    paddingTop: 10,
  },
  progressContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  progressText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10, // Smoother progress bar
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ffa500",
    borderRadius: 10,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(251, 191, 36, 0.05)",
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.15)",
    marginBottom: 24,
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    color: "#d1d5db",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  ingredientsList: {
    gap: 16,
  },
  ingredientItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 18,
    borderRadius: 24, // softer list items
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  ingredientItemChecked: {
    borderColor: "rgba(255,255,255,0.02)",
  },
  checkboxContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
    textTransform: "capitalize",
  },
  textStrikethrough: {
    textDecorationLine: "line-through",
    color: "#4b5563",
  },
  ingredientQuantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffa500",
  },
  originalString: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 24,
    backgroundColor: "rgba(10, 10, 10, 0.98)",
    borderTopLeftRadius: 36, // Large elegant sheet curve
    borderTopRightRadius: 36,
    borderTopWidth: 1.5,
    borderTopColor: "rgba(255,255,255,0.12)",
    zIndex: 999,
  },
  startButton: {
    height: 64,
    borderRadius: 28,
    // Removed overflow: hidden to ensure the shadow is visible on iOS
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderRadius: 28, // Explicitly rounded for the gradient component
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  playIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: -0.2,
  },
  arrowIcon: {
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
