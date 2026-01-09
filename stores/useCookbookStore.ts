import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CookbookRecipe {
  id: string;
  title: string;
  rating?: number;
  notes?: string;
  tags?: string[];
  recipeData?: any; // Full recipe data if needed
}

export interface Cookbook {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: number;
}

interface CookbookState {
  cookbooks: Cookbook[];
  recipes: Record<string, CookbookRecipe>; // recipeId -> recipe data
  favorites: string[]; // recipe IDs in favorites

  // Actions
  createCookbook: (name: string) => string;
  deleteCookbook: (id: string) => void;
  addRecipeToCookbook: (cookbookId: string, recipe: CookbookRecipe) => void;
  removeRecipeFromCookbook: (cookbookId: string, recipeId: string) => void;
  addToFavorites: (recipe: CookbookRecipe) => void;
  removeFromFavorites: (recipeId: string) => void;
  updateRecipe: (recipeId: string, updates: Partial<CookbookRecipe>) => void;
  getCookbookRecipes: (cookbookId: string) => CookbookRecipe[];
  getFavoriteRecipes: () => CookbookRecipe[];
}

export const useCookbookStore = create<CookbookState>()(
  persist(
    (set, get) => ({
      cookbooks: [
        {
          id: "favorites",
          name: "⭐ Favorites",
          recipeIds: [],
          createdAt: Date.now(),
        },
      ],
      recipes: {},
      favorites: [],

      createCookbook: (name: string) => {
        const newCookbook: Cookbook = {
          id: `cookbook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          recipeIds: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          cookbooks: [...state.cookbooks, newCookbook],
        }));
        return newCookbook.id;
      },

      deleteCookbook: (id: string) => {
        if (id === "favorites") return; // Cannot delete favorites
        set((state) => ({
          cookbooks: state.cookbooks.filter((cb) => cb.id !== id),
        }));
      },

      addRecipeToCookbook: (cookbookId: string, recipe: CookbookRecipe) => {
        const state = get();
        // Store recipe if not already stored
        if (!state.recipes[recipe.id]) {
          set((s) => ({
            recipes: { ...s.recipes, [recipe.id]: recipe },
          }));
        }

        // Add to cookbook
        set((s) => ({
          cookbooks: s.cookbooks.map((cb) =>
            cb.id === cookbookId
              ? {
                  ...cb,
                  recipeIds: cb.recipeIds.includes(recipe.id)
                    ? cb.recipeIds
                    : [...cb.recipeIds, recipe.id],
                }
              : cb
          ),
        }));
      },

      removeRecipeFromCookbook: (cookbookId: string, recipeId: string) => {
        set((state) => ({
          cookbooks: state.cookbooks.map((cb) =>
            cb.id === cookbookId
              ? {
                  ...cb,
                  recipeIds: cb.recipeIds.filter((id) => id !== recipeId),
                }
              : cb
          ),
        }));
      },

      addToFavorites: (recipe: CookbookRecipe) => {
        const state = get();
        // Store recipe if not already stored
        if (!state.recipes[recipe.id]) {
          set((s) => ({
            recipes: { ...s.recipes, [recipe.id]: recipe },
          }));
        }

        set((s) => ({
          favorites: s.favorites.includes(recipe.id)
            ? s.favorites
            : [...s.favorites, recipe.id],
          cookbooks: s.cookbooks.map((cb) =>
            cb.id === "favorites"
              ? {
                  ...cb,
                  recipeIds: cb.recipeIds.includes(recipe.id)
                    ? cb.recipeIds
                    : [...cb.recipeIds, recipe.id],
                }
              : cb
          ),
        }));
      },

      removeFromFavorites: (recipeId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== recipeId),
          cookbooks: state.cookbooks.map((cb) =>
            cb.id === "favorites"
              ? {
                  ...cb,
                  recipeIds: cb.recipeIds.filter((id) => id !== recipeId),
                }
              : cb
          ),
        }));
      },

      updateRecipe: (recipeId: string, updates: Partial<CookbookRecipe>) => {
        set((state) => ({
          recipes: {
            ...state.recipes,
            [recipeId]: {
              ...state.recipes[recipeId],
              ...updates,
            },
          },
        }));
      },

      getCookbookRecipes: (cookbookId: string) => {
        const state = get();
        const cookbook = state.cookbooks.find((cb) => cb.id === cookbookId);
        if (!cookbook) return [];
        return cookbook.recipeIds
          .map((id) => state.recipes[id])
          .filter(Boolean);
      },

      getFavoriteRecipes: () => {
        const state = get();
        return state.favorites
          .map((id) => state.recipes[id])
          .filter(Boolean);
      },
    }),
    {
      name: "cookbook-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

