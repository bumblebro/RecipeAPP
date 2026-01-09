/**
 * Recipe type definitions for the cooking session store
 * These types are designed to work with the Zustand store and may need
 * to be mapped from the existing RecipeData structure
 */

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface RecipeStep {
  id: string;
  text: string;
  time: number; // minutes
  ingredientIds: string[];
}

export interface Recipe {
  id: string;
  title: string;
  totalTime: number; // minutes
  servings: number;
  steps: RecipeStep[];
  ingredients: Ingredient[];
}

export interface TimerState {
  id: string;
  stepId: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
}

