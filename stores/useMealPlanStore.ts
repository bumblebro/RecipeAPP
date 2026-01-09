import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface Meal {
  id: string;
  type: MealType;
  recipeId?: string;
  recipeName?: string;
  day: string;
  createdAt: number;
}

export interface MealPlan {
  id: string;
  name: string;
  mealIds: string[];
  createdAt: number;
  weekStart: number; // Timestamp for Monday of the week
}

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

interface MealPlanState {
  plans: MealPlan[];
  meals: Record<string, Meal>; // mealId -> meal data

  // Actions
  createPlan: (name: string, weekStart?: number) => string;
  deletePlan: (id: string) => void;
  addMeal: (
    planId: string,
    day: string,
    type: MealType,
    recipeId?: string,
    recipeName?: string
  ) => string;
  removeMeal: (planId: string, mealId: string) => void;
  updateMeal: (mealId: string, updates: Partial<Meal>) => void;
  getPlanMeals: (planId: string) => Record<string, Meal[]>; // day -> meals[]
  getMealCount: (planId: string) => number;
  getWeekStart: () => number; // Get Monday of current week
}

const getMondayOfWeek = (date: Date = new Date()): number => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      meals: {},

      createPlan: (name: string, weekStart?: number) => {
        const newPlan: MealPlan = {
          id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          mealIds: [],
          createdAt: Date.now(),
          weekStart: weekStart || getMondayOfWeek(),
        };
        set((state) => ({
          plans: [...state.plans, newPlan],
        }));
        return newPlan.id;
      },

      deletePlan: (id: string) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === id);
        if (plan) {
          const newMeals = { ...state.meals };
          plan.mealIds.forEach((mealId) => {
            delete newMeals[mealId];
          });
          set({ meals: newMeals });
        }

        set((state) => ({
          plans: state.plans.filter((p) => p.id !== id),
        }));
      },

      addMeal: (
        planId: string,
        day: string,
        type: MealType,
        recipeId?: string,
        recipeName?: string
      ) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);
        if (!plan) return "";

        // Check if meal already exists for this day/type
        const existingMeal = plan.mealIds
          .map((id) => state.meals[id])
          .find((m) => m && m.day === day && m.type === type);

        if (existingMeal) {
          // Update existing meal
          set((s) => ({
            meals: {
              ...s.meals,
              [existingMeal.id]: {
                ...s.meals[existingMeal.id],
                recipeId,
                recipeName,
              },
            },
          }));
          return existingMeal.id;
        }

        // Create new meal
        const newMeal: Meal = {
          id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type,
          recipeId,
          recipeName,
          day,
          createdAt: Date.now(),
        };

        set((state) => ({
          meals: { ...state.meals, [newMeal.id]: newMeal },
          plans: state.plans.map((p) =>
            p.id === planId
              ? { ...p, mealIds: [...p.mealIds, newMeal.id] }
              : p
          ),
        }));

        return newMeal.id;
      },

      removeMeal: (planId: string, mealId: string) => {
        const state = get();
        const newMeals = { ...state.meals };
        delete newMeals[mealId];

        set({
          meals: newMeals,
          plans: state.plans.map((p) =>
            p.id === planId
              ? { ...p, mealIds: p.mealIds.filter((id) => id !== mealId) }
              : p
          ),
        });
      },

      updateMeal: (mealId: string, updates: Partial<Meal>) => {
        set((state) => ({
          meals: {
            ...state.meals,
            [mealId]: {
              ...state.meals[mealId],
              ...updates,
            },
          },
        }));
      },

      getPlanMeals: (planId: string) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);
        if (!plan) return {};

        const mealsByDay: Record<string, Meal[]> = {};
        DAYS.forEach((day) => {
          mealsByDay[day] = [];
        });

        plan.mealIds.forEach((id) => {
          const meal = state.meals[id];
          if (meal && mealsByDay[meal.day]) {
            mealsByDay[meal.day].push(meal);
          }
        });

        return mealsByDay;
      },

      getMealCount: (planId: string) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);
        if (!plan) return 0;
        return plan.mealIds.length;
      },

      getWeekStart: () => getMondayOfWeek(),
    }),
    {
      name: "mealplan-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

