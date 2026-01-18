import { api } from '../api/api.client';

export interface ExtractedRecipe {
  name: string;
  description: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  totalTime: string;
  cookTime: string;
  prepTime: string;
  yield: string;
  nutrition: any;
  // ... other fields
}

export interface UsageStats {
  today: number;
  limit: number;
  remaining: number;
}

export interface DetailedUsage {
  extraction: UsageStats;
  saved: {
    count: number;
    limit: number;
    remaining: number;
  };
  cooking: UsageStats;
}

export interface ExtractResponse {
  success: boolean;
  data: ExtractedRecipe;
  usage: UsageStats;
}

export interface SavedRecipe {
  id: string;
  name: string;
  data: any;
  createdAt: string;
}

export const recipeApi = {
  /**
   * Extract a recipe from a URL.
   * Throws 403 ApiError if daily limit is reached.
   */
  extractRecipe: async (url: string, servings?: number): Promise<ExtractResponse> => {
    return api.post('/recipe/extract', { url, servings });
  },

  /**
   * Extract a recipe from raw text.
   * Throws 403 ApiError if daily limit is reached.
   */
  extractRecipeText: async (text: string, servings?: number): Promise<ExtractResponse> => {
    return api.post('/recipe/extract-text', { text, servings });
  },

  /**
   * Get current usage statistics for the user across all features
   */
  getUsage: async (): Promise<DetailedUsage> => {
    return api.get('/recipe/usage');
  },

  /**
   * Get all saved recipes
   */
  getSavedRecipes: async (): Promise<{ success: boolean; data: SavedRecipe[] }> => {
    return api.get('/recipe/saved');
  },

  /**
   * Save a recipe for later use
   */
  saveRecipe: async (name: string, data: any): Promise<{ success: boolean; data: SavedRecipe }> => {
    return api.post('/recipe/save', { name, data });
  },

  /**
   * Remove a saved recipe
   */
  deleteSavedRecipe: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/recipe/save/${id}`);
  },

  /**
   * Track the start of a smart cooking session
   */
  trackCookSession: async (): Promise<{ success: boolean }> => {
    return api.post('/recipe/track-cook', {});
  }
};
