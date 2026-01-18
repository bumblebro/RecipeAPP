import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { recipeApi, SavedRecipe } from "../features/recipe/recipe.api";

interface SavedRecipesState {
  recipes: SavedRecipe[];
  lastFetched: number | null;
  isLoading: boolean;
  
  // Actions
  setRecipes: (recipes: SavedRecipe[]) => void;
  fetchRecipes: () => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addRecipe: (recipe: SavedRecipe) => void;
  clear: () => void;
}

export const useSavedRecipesStore = create<SavedRecipesState>()(
  persist(
    (set, get) => ({
      recipes: [],
      lastFetched: null,
      isLoading: false,

      setRecipes: (recipes) => set({ recipes, lastFetched: Date.now() }),

      fetchRecipes: async () => {
        // If we have recipes, we don't set global isLoading to true 
        // to avoid showing a full screen spinner. We fetch in background.
        const isInitialFetch = get().recipes.length === 0;
        if (isInitialFetch) set({ isLoading: true });

        try {
          const response = await recipeApi.getSavedRecipes();
          if (response.success) {
            set({ 
              recipes: response.data, 
              lastFetched: Date.now(),
              isLoading: false 
            });
          }
        } catch (error) {
          console.error("Failed to fetch saved recipes:", error);
          set({ isLoading: false });
        }
      },

      deleteRecipe: async (id) => {
        try {
          await recipeApi.deleteSavedRecipe(id);
          set((state) => ({
            recipes: state.recipes.filter((r) => r.id !== id),
          }));
        } catch (error) {
          console.error("Failed to delete recipe:", error);
          throw error;
        }
      },

      addRecipe: (recipe) => {
        set((state) => ({
          recipes: [recipe, ...state.recipes],
        }));
      },

      clear: () => set({ recipes: [], lastFetched: null }),
    }),
    {
      name: "saved-recipes-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
