import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserRecipe {
  id: string;
  title: string;
  description: string;
  rating: number;
  steps: number;
  isShared: boolean;
  createdAt: number;
  recipeData?: any; // Full recipe data if needed
}

interface ProfileState {
  username: string;
  bio: string;
  avatarUrl?: string;
  shared: number;
  followers: number;
  following: number;
  recipes: Record<string, UserRecipe>; // recipeId -> recipe data

  // Actions
  updateProfile: (updates: { username?: string; bio?: string; avatarUrl?: string }) => void;
  addRecipe: (recipe: UserRecipe) => void;
  removeRecipe: (recipeId: string) => void;
  toggleShare: (recipeId: string) => void;
  updateRecipe: (recipeId: string, updates: Partial<UserRecipe>) => void;
  getUserRecipes: () => UserRecipe[];
  getSharedRecipes: () => UserRecipe[];
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      username: "ChefMaster",
      bio: "Passionate home cook sharing favorite recipes",
      avatarUrl: undefined,
      shared: 0,
      followers: 0,
      following: 0,
      recipes: {},

      updateProfile: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
        }));
      },

      addRecipe: (recipe: UserRecipe) => {
        set((state) => ({
          recipes: { ...state.recipes, [recipe.id]: recipe },
        }));
      },

      removeRecipe: (recipeId: string) => {
        const state = get();
        const recipe = state.recipes[recipeId];
        const newRecipes = { ...state.recipes };
        delete newRecipes[recipeId];

        set({
          recipes: newRecipes,
          shared: recipe?.isShared
            ? Math.max(0, state.shared - 1)
            : state.shared,
        });
      },

      toggleShare: (recipeId: string) => {
        const state = get();
        const recipe = state.recipes[recipeId];
        if (!recipe) return;

        const newIsShared = !recipe.isShared;
        set({
          recipes: {
            ...state.recipes,
            [recipeId]: {
              ...recipe,
              isShared: newIsShared,
            },
          },
          shared: newIsShared ? state.shared + 1 : Math.max(0, state.shared - 1),
        });
      },

      updateRecipe: (recipeId: string, updates: Partial<UserRecipe>) => {
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

      getUserRecipes: () => {
        const state = get();
        return Object.values(state.recipes).sort(
          (a, b) => b.createdAt - a.createdAt
        );
      },

      getSharedRecipes: () => {
        const state = get();
        return Object.values(state.recipes)
          .filter((r) => r.isShared)
          .sort((a, b) => b.createdAt - a.createdAt);
      },
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

