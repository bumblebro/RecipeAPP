/**
 * Utility functions to map between RecipeData (existing format) and Recipe (store format)
 */

import type { Recipe, RecipeStep, Ingredient } from '../types/recipe';

// Import types from RecipeScreen (these are the existing types)
interface ProcessedInstruction {
  action: string;
  speech?: string;
  duration?: number;
  durationUnit?: "seconds" | "minutes" | "hours";
  ingredients?: {
    name: string;
    quantity: number | null;
    unit: string | null;
    preparation?: string;
  }[];
  equipment?: string[];
  temperature?: number;
  temperatureUnit?: "C" | "F";
  animationType?: string;
  notes?: string;
}

interface RecipeData {
  name: string;
  description?: string;
  image?: string | string[];
  ingredients: string[]; // Raw ingredients from extract-recipe
  instructions: string[]; // Raw instructions from extract-recipe
  processedInstructions?: ProcessedInstruction[];
  totalTime?: string;
  cookTime?: string;
  prepTime?: string;
  yield?: string | number;
  selectedServings?: number;
  originalServings?: number;
}

/**
 * Generate a unique ID for an ingredient based on its properties
 */
const generateIngredientId = (name: string, quantity: string, index: number): string => {
  return `ing-${name.toLowerCase().replace(/\s+/g, '-')}-${quantity}-${index}`;
};

/**
 * Generate a unique ID for a recipe step
 */
const generateStepId = (index: number): string => {
  return `step-${index}`;
};

/**
 * Convert duration to minutes
 */
const convertDurationToMinutes = (
  duration: number | undefined,
  unit: "seconds" | "minutes" | "hours" | undefined
): number => {
  if (!duration) return 0;
  
  switch (unit) {
    case "seconds":
      return Math.ceil(duration / 60);
    case "minutes":
      return duration;
    case "hours":
      return duration * 60;
    default:
      return duration; // Assume minutes if unit not specified
  }
};

/**
 * Format quantity as string for ingredient
 */
const formatQuantityString = (
  quantity: number | null,
  unit: string | null
): string => {
  if (quantity === null && unit === null) return "";
  if (quantity === null) return unit || "";
  if (unit === null) return quantity.toString();
  return `${quantity} ${unit}`;
};

/**
 * Parse total time string to minutes
 */
const parseTotalTimeToMinutes = (totalTime?: string): number => {
  if (!totalTime) return 0;
  
  // Handle ISO 8601 duration format (PT30M, PT1H30M, etc.)
  const timeStr = totalTime.replace("PT", "");
  let minutes = 0;
  
  if (timeStr.includes("H")) {
    const hours = parseInt(timeStr.split("H")[0]) || 0;
    minutes += hours * 60;
    const remaining = timeStr.split("H")[1] || "";
    const mins = parseInt(remaining.replace("M", "")) || 0;
    minutes += mins;
  } else if (timeStr.includes("M")) {
    minutes = parseInt(timeStr.replace("M", "")) || 0;
  }
  
  return minutes;
};

/**
 * Extract all unique ingredients from processed instructions and raw ingredients list
 */
const extractAllIngredients = (
  recipeData: RecipeData
): Ingredient[] => {
  const ingredientMap = new Map<string, Ingredient>();
  let index = 0;

  // First, collect ingredients from processed instructions
  if (recipeData.processedInstructions) {
    recipeData.processedInstructions.forEach((step) => {
      step.ingredients?.forEach((ing) => {
        const key = `${ing.name}-${ing.quantity}-${ing.unit}`;
        if (!ingredientMap.has(key)) {
          const quantityStr = formatQuantityString(ing.quantity, ing.unit);
          ingredientMap.set(key, {
            id: generateIngredientId(ing.name, quantityStr, index++),
            name: ing.name,
            quantity: quantityStr,
          });
        }
      });
    });
  }

  // Then, add raw ingredients that weren't already included
  recipeData.ingredients.forEach((ingStr) => {
    // Try to parse the ingredient string
    // Format might be "2 cups flour" or just "flour"
    const trimmed = ingStr.trim();
    if (trimmed && !Array.from(ingredientMap.values()).some(ing => ing.name === trimmed)) {
      ingredientMap.set(trimmed, {
        id: generateIngredientId(trimmed, "", index++),
        name: trimmed,
        quantity: trimmed, // Keep full string as quantity for raw ingredients
      });
    }
  });

  return Array.from(ingredientMap.values());
};

/**
 * Convert RecipeData to Recipe format for the store
 */
export const mapRecipeDataToRecipe = (recipeData: RecipeData): Recipe => {
  const recipeId = `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  // Extract all ingredients
  const ingredients = extractAllIngredients(recipeData);
  
  // Create ingredient ID map for quick lookup
  const ingredientIdMap = new Map<string, string>();
  ingredients.forEach((ing) => {
    // Map by name (case-insensitive) for lookup
    ingredientIdMap.set(ing.name.toLowerCase(), ing.id);
  });

  // Convert processed instructions to steps
  const steps: RecipeStep[] = (recipeData.processedInstructions || []).map(
    (instruction, index) => {
      // Get ingredient IDs for this step
      const stepIngredientIds: string[] = [];
      if (instruction.ingredients) {
        instruction.ingredients.forEach((ing) => {
          const id = ingredientIdMap.get(ing.name.toLowerCase());
          if (id) {
            stepIngredientIds.push(id);
          }
        });
      }

      // Convert duration to minutes
      const timeInMinutes = convertDurationToMinutes(
        instruction.duration,
        instruction.durationUnit
      );

      return {
        id: generateStepId(index),
        text: instruction.action,
        time: timeInMinutes,
        ingredientIds: stepIngredientIds,
      };
    }
  );

  // If no processed instructions, use raw instructions
  if (steps.length === 0 && recipeData.instructions) {
    recipeData.instructions.forEach((instruction, index) => {
      steps.push({
        id: generateStepId(index),
        text: instruction,
        time: 0, // No time specified in raw instructions
        ingredientIds: [], // Can't determine ingredients from raw instructions
      });
    });
  }

  // Parse total time
  const totalTime = parseTotalTimeToMinutes(recipeData.totalTime);

  // Get servings
  const servings =
    recipeData.selectedServings ||
    recipeData.originalServings ||
    (typeof recipeData.yield === "number"
      ? recipeData.yield
      : typeof recipeData.yield === "string"
      ? parseInt(recipeData.yield) || 4
      : 4);

  return {
    id: recipeId,
    title: recipeData.name,
    totalTime,
    servings,
    steps,
    ingredients,
  };
};

