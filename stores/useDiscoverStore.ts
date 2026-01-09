import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Cook {
  id: string;
  username: string;
  bio: string;
  shared: number;
  followers: number;
  following: number;
  avatarUrl?: string;
}

export interface DiscoverRecipe {
  id: string;
  title: string;
  description: string;
  rating: number;
  ratingCount: number;
  cookTime: number;
  cookId: string;
  cookUsername: string;
  imageUrl?: string;
}

interface DiscoverState {
  cooks: Record<string, Cook>; // cookId -> cook data
  recipes: Record<string, DiscoverRecipe>; // recipeId -> recipe data
  following: string[]; // cook IDs user is following
  likedRecipes: string[]; // recipe IDs user has liked

  // Actions
  addCook: (cook: Cook) => void;
  followCook: (cookId: string) => void;
  unfollowCook: (cookId: string) => void;
  isFollowing: (cookId: string) => boolean;
  addRecipe: (recipe: DiscoverRecipe) => void;
  likeRecipe: (recipeId: string) => void;
  unlikeRecipe: (recipeId: string) => void;
  isLiked: (recipeId: string) => boolean;
  getFollowingCooks: () => Cook[];
  getLikedRecipes: () => DiscoverRecipe[];
  searchCooks: (query: string) => Cook[];
  searchRecipes: (query: string) => DiscoverRecipe[];
}

export const useDiscoverStore = create<DiscoverState>()(
  persist(
    (set, get) => ({
      cooks: {},
      recipes: {},
      following: [],
      likedRecipes: [],

      addCook: (cook: Cook) => {
        set((state) => ({
          cooks: { ...state.cooks, [cook.id]: cook },
        }));
      },

      followCook: (cookId: string) => {
        set((state) => ({
          following: state.following.includes(cookId)
            ? state.following
            : [...state.following, cookId],
          cooks: {
            ...state.cooks,
            [cookId]: {
              ...state.cooks[cookId],
              followers: (state.cooks[cookId]?.followers || 0) + 1,
            },
          },
        }));
      },

      unfollowCook: (cookId: string) => {
        set((state) => ({
          following: state.following.filter((id) => id !== cookId),
          cooks: {
            ...state.cooks,
            [cookId]: {
              ...state.cooks[cookId],
              followers: Math.max(
                0,
                (state.cooks[cookId]?.followers || 0) - 1
              ),
            },
          },
        }));
      },

      isFollowing: (cookId: string) => {
        return get().following.includes(cookId);
      },

      addRecipe: (recipe: DiscoverRecipe) => {
        set((state) => ({
          recipes: { ...state.recipes, [recipe.id]: recipe },
        }));
      },

      likeRecipe: (recipeId: string) => {
        set((state) => ({
          likedRecipes: state.likedRecipes.includes(recipeId)
            ? state.likedRecipes
            : [...state.likedRecipes, recipeId],
        }));
      },

      unlikeRecipe: (recipeId: string) => {
        set((state) => ({
          likedRecipes: state.likedRecipes.filter((id) => id !== recipeId),
        }));
      },

      isLiked: (recipeId: string) => {
        return get().likedRecipes.includes(recipeId);
      },

      getFollowingCooks: () => {
        const state = get();
        return state.following
          .map((id) => state.cooks[id])
          .filter(Boolean);
      },

      getLikedRecipes: () => {
        const state = get();
        return state.likedRecipes
          .map((id) => state.recipes[id])
          .filter(Boolean);
      },

      searchCooks: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return Object.values(state.cooks).filter(
          (cook) =>
            cook.username.toLowerCase().includes(lowerQuery) ||
            cook.bio.toLowerCase().includes(lowerQuery)
        );
      },

      searchRecipes: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return Object.values(state.recipes).filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(lowerQuery) ||
            recipe.description.toLowerCase().includes(lowerQuery) ||
            recipe.cookUsername.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: "discover-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

