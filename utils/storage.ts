// Simple storage utility with fallback
// Uses SecureStore if available, otherwise falls back to in-memory storage

let storage: { [key: string]: string } = {};

let SecureStore: any = null;
try {
  SecureStore = require("expo-secure-store");
} catch (e) {
  // SecureStore not available, will use in-memory storage
}

export const saveRecipe = async (recipe: any): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@saved_recipes");
      const recipes = existing ? JSON.parse(existing) : [];
      
      // Check if recipe already exists
      const exists = recipes.some((r: any) => r.id === recipe.id);
      if (exists) {
        // Update existing
        const updated = recipes.map((r: any) => 
          r.id === recipe.id ? { ...recipe, savedAt: Date.now() } : r
        );
        await SecureStore.setItemAsync("@saved_recipes", JSON.stringify(updated));
      } else {
        // Add new
        recipes.push({ ...recipe, id: recipe.id || `recipe_${Date.now()}`, savedAt: Date.now() });
        await SecureStore.setItemAsync("@saved_recipes", JSON.stringify(recipes));
      }
    } else {
      // Fallback to in-memory storage
      const existing = storage["@saved_recipes"] || "[]";
      const recipes = JSON.parse(existing);
      const exists = recipes.some((r: any) => r.id === recipe.id);
      if (exists) {
        const updated = recipes.map((r: any) => 
          r.id === recipe.id ? { ...recipe, savedAt: Date.now() } : r
        );
        storage["@saved_recipes"] = JSON.stringify(updated);
      } else {
        recipes.push({ ...recipe, id: recipe.id || `recipe_${Date.now()}`, savedAt: Date.now() });
        storage["@saved_recipes"] = JSON.stringify(recipes);
      }
    }
  } catch (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }
};

export const getSavedRecipes = async (): Promise<any[]> => {
  try {
    if (SecureStore) {
      const data = await SecureStore.getItemAsync("@saved_recipes");
      return data ? JSON.parse(data) : [];
    } else {
      // Fallback to in-memory storage
      const data = storage["@saved_recipes"] || "[]";
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading recipes:", error);
    return [];
  }
};

export const deleteSavedRecipe = async (id: string): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@saved_recipes");
      const recipes = existing ? JSON.parse(existing) : [];
      const updated = recipes.filter((r: any) => r.id !== id);
      await SecureStore.setItemAsync("@saved_recipes", JSON.stringify(updated));
    } else {
      // Fallback to in-memory storage
      const existing = storage["@saved_recipes"] || "[]";
      const recipes = JSON.parse(existing);
      const updated = recipes.filter((r: any) => r.id !== id);
      storage["@saved_recipes"] = JSON.stringify(updated);
    }
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

// Recipe notes and ratings
export const saveRecipeNotes = async (recipeId: string, notes: string, rating: number): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@saved_recipes");
      const recipes = existing ? JSON.parse(existing) : [];
      const updated = recipes.map((r: any) => 
        r.id === recipeId ? { ...r, notes, rating, notesUpdatedAt: Date.now() } : r
      );
      await SecureStore.setItemAsync("@saved_recipes", JSON.stringify(updated));
    } else {
      const existing = storage["@saved_recipes"] || "[]";
      const recipes = JSON.parse(existing);
      const updated = recipes.map((r: any) => 
        r.id === recipeId ? { ...r, notes, rating, notesUpdatedAt: Date.now() } : r
      );
      storage["@saved_recipes"] = JSON.stringify(updated);
    }
  } catch (error) {
    console.error("Error saving recipe notes:", error);
    throw error;
  }
};

export const getRecipeNotesAndRating = async (recipeId: string): Promise<{ notes: string; rating: number } | null> => {
  try {
    const recipes = await getSavedRecipes();
    const recipe = recipes.find((r: any) => r.id === recipeId);
    if (recipe && (recipe.notes || recipe.rating)) {
      return {
        notes: recipe.notes || "",
        rating: recipe.rating || 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting recipe notes:", error);
    return null;
  }
};

// Recipe collections/folders
export const createCollection = async (name: string): Promise<string> => {
  try {
    const collectionId = `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@collections");
      const collections = existing ? JSON.parse(existing) : [];
      collections.push({ id: collectionId, name, createdAt: Date.now(), recipeIds: [] });
      await SecureStore.setItemAsync("@collections", JSON.stringify(collections));
    } else {
      const existing = storage["@collections"] || "[]";
      const collections = JSON.parse(existing);
      collections.push({ id: collectionId, name, createdAt: Date.now(), recipeIds: [] });
      storage["@collections"] = JSON.stringify(collections);
    }
    return collectionId;
  } catch (error) {
    console.error("Error creating collection:", error);
    throw error;
  }
};

export const getCollections = async (): Promise<any[]> => {
  try {
    if (SecureStore) {
      const data = await SecureStore.getItemAsync("@collections");
      return data ? JSON.parse(data) : [];
    } else {
      const data = storage["@collections"] || "[]";
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading collections:", error);
    return [];
  }
};

export const addRecipeToCollection = async (collectionId: string, recipeId: string): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@collections");
      const collections = existing ? JSON.parse(existing) : [];
      const updated = collections.map((c: any) => 
        c.id === collectionId 
          ? { ...c, recipeIds: [...(c.recipeIds || []), recipeId] }
          : c
      );
      await SecureStore.setItemAsync("@collections", JSON.stringify(updated));
    } else {
      const existing = storage["@collections"] || "[]";
      const collections = JSON.parse(existing);
      const updated = collections.map((c: any) => 
        c.id === collectionId 
          ? { ...c, recipeIds: [...(c.recipeIds || []), recipeId] }
          : c
      );
      storage["@collections"] = JSON.stringify(updated);
    }
  } catch (error) {
    console.error("Error adding recipe to collection:", error);
    throw error;
  }
};

export const removeRecipeFromCollection = async (collectionId: string, recipeId: string): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@collections");
      const collections = existing ? JSON.parse(existing) : [];
      const updated = collections.map((c: any) => 
        c.id === collectionId 
          ? { ...c, recipeIds: (c.recipeIds || []).filter((id: string) => id !== recipeId) }
          : c
      );
      await SecureStore.setItemAsync("@collections", JSON.stringify(updated));
    } else {
      const existing = storage["@collections"] || "[]";
      const collections = JSON.parse(existing);
      const updated = collections.map((c: any) => 
        c.id === collectionId 
          ? { ...c, recipeIds: (c.recipeIds || []).filter((id: string) => id !== recipeId) }
          : c
      );
      storage["@collections"] = JSON.stringify(updated);
    }
  } catch (error) {
    console.error("Error removing recipe from collection:", error);
    throw error;
  }
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@collections");
      const collections = existing ? JSON.parse(existing) : [];
      const updated = collections.filter((c: any) => c.id !== collectionId);
      await SecureStore.setItemAsync("@collections", JSON.stringify(updated));
    } else {
      const existing = storage["@collections"] || "[]";
      const collections = JSON.parse(existing);
      const updated = collections.filter((c: any) => c.id !== collectionId);
      storage["@collections"] = JSON.stringify(updated);
    }
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
};

// Recently viewed recipes
export const addToRecentlyViewed = async (recipe: any): Promise<void> => {
  try {
    if (SecureStore) {
      const existing = await SecureStore.getItemAsync("@recently_viewed");
      const recent = existing ? JSON.parse(existing) : [];
      
      // Remove if already exists
      const filtered = recent.filter((r: any) => r.id !== recipe.id);
      
      // Add to beginning
      filtered.unshift({
        ...recipe,
        viewedAt: Date.now(),
      });
      
      // Keep only last 20
      const limited = filtered.slice(0, 20);
      
      await SecureStore.setItemAsync("@recently_viewed", JSON.stringify(limited));
    } else {
      const existing = storage["@recently_viewed"] || "[]";
      const recent = JSON.parse(existing);
      const filtered = recent.filter((r: any) => r.id !== recipe.id);
      filtered.unshift({
        ...recipe,
        viewedAt: Date.now(),
      });
      const limited = filtered.slice(0, 20);
      storage["@recently_viewed"] = JSON.stringify(limited);
    }
  } catch (error) {
    console.error("Error adding to recently viewed:", error);
  }
};

// Meal planning
export const saveMealPlan = async (mealPlan: { [key: string]: any }): Promise<void> => {
  try {
    if (SecureStore) {
      await SecureStore.setItemAsync("@meal_plan", JSON.stringify(mealPlan));
    } else {
      storage["@meal_plan"] = JSON.stringify(mealPlan);
    }
  } catch (error) {
    console.error("Error saving meal plan:", error);
    throw error;
  }
};

export const getMealPlan = async (): Promise<{ [key: string]: any }> => {
  try {
    if (SecureStore) {
      const data = await SecureStore.getItemAsync("@meal_plan");
      return data ? JSON.parse(data) : {};
    } else {
      const data = storage["@meal_plan"] || "{}";
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading meal plan:", error);
    return {};
  }
};

export const getRecentlyViewed = async (): Promise<any[]> => {
  try {
    if (SecureStore) {
      const data = await SecureStore.getItemAsync("@recently_viewed");
      return data ? JSON.parse(data) : [];
    } else {
      const data = storage["@recently_viewed"] || "[]";
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading recently viewed:", error);
    return [];
  }
};

