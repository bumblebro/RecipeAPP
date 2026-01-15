import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, RecipeStep, Ingredient, TimerState } from '../types/recipe';

interface CookingState {
  // Session State
  recipe: Recipe | null;
  rawRecipeData: any | null;
  currentStepIndex: number;
  isCompleted: boolean;
  startedAt: number | null;
  lastActiveAt: number | null;
  isPaused: boolean;


  // Ingredient Tracking
  usedIngredientIds: string[];

  // Progress Tracking
  completedSteps: number[];

  // Timer Management
  timers: TimerState[];

  // Actions
  startCooking: (recipe: Recipe, rawData?: any) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (index: number) => void;
  toggleIngredient: (ingredientId: string) => void;
  setStepCompleted: (index: number, completed: boolean) => void;
  addTimer: (timerData: Omit<TimerState, 'id'>) => void;
  startTimer: (timerId: string) => void;
  pauseTimer: (timerId: string) => void;
  resetTimer: (timerId: string) => void;
  tickTimer: (timerId: string) => void;
  adjustTimer: (timerId: string, seconds: number) => void;
  removeTimer: (timerId: string) => void;
  completeRecipe: () => void;
  resetSession: () => void;
  togglePause: () => void;

  hasActiveSession: () => boolean;
}

/**
 * Generate unique timer ID
 */
const generateTimerId = (): string => {
  return `timer-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Update lastActiveAt timestamp
 */
const updateLastActive = (state: CookingState): Partial<CookingState> => ({
  lastActiveAt: Date.now(),
});

export const useCookingStore = create<CookingState>()(
  persist(
    (set, get) => ({
      // Initial State
      recipe: null,
      rawRecipeData: null,
      currentStepIndex: 0,
      isCompleted: false,
      startedAt: null,
      lastActiveAt: null,
      usedIngredientIds: [],
      completedSteps: [],
      timers: [],
      isPaused: false,


      // Session Management
      startCooking: (recipe: Recipe, rawData?: any) => {
        set({
          recipe,
          rawRecipeData: rawData || null,
          currentStepIndex: 0,
          isCompleted: false,
          startedAt: Date.now(),
          lastActiveAt: Date.now(),
          usedIngredientIds: [],
          completedSteps: [],
          timers: [],
          isPaused: false,

        });
      },

      goToNextStep: () => {
        const state = get();
        if (!state.recipe) return;

        const maxIndex = state.recipe.steps.length - 1;
        if (state.currentStepIndex < maxIndex) {
          set({
            ...updateLastActive(state),
            currentStepIndex: state.currentStepIndex + 1,
          });
        }
      },

      goToPreviousStep: () => {
        const state = get();
        if (state.currentStepIndex > 0) {
          set({
            ...updateLastActive(state),
            currentStepIndex: state.currentStepIndex - 1,
          });
        }
      },

      goToStep: (index: number) => {
        const state = get();
        if (!state.recipe) return;

        const maxIndex = state.recipe.steps.length - 1;
        if (index >= 0 && index <= maxIndex) {
          set({
            ...updateLastActive(state),
            currentStepIndex: index,
          });
        }
      },

      // Ingredient Tracking
      toggleIngredient: (ingredientId: string) => {
        const state = get();
        const isUsed = state.usedIngredientIds.includes(ingredientId);
        const newUsedIds = isUsed
          ? state.usedIngredientIds.filter((id) => id !== ingredientId)
          : [...state.usedIngredientIds, ingredientId];

        set({
          ...updateLastActive(state),
          usedIngredientIds: newUsedIds,
        });
      },

      setStepCompleted: (index: number, completed: boolean) => {
        const state = get();
        const newCompleted = completed
          ? [...new Set([...state.completedSteps, index])]
          : state.completedSteps.filter((i) => i !== index);
        
        set({
          ...updateLastActive(state),
          completedSteps: newCompleted,
        });
      },

      // Timer Management
      addTimer: (timerData: Omit<TimerState, 'id'>) => {
        const state = get();
        const newTimer: TimerState = {
          ...timerData,
          id: generateTimerId(),
        };

        set({
          ...updateLastActive(state),
          timers: [...state.timers, newTimer],
        });
      },

      startTimer: (timerId: string) => {
        const state = get();
        const timer = state.timers.find((t) => t.id === timerId);
        if (!timer || timer.isComplete) return;

        set({
          ...updateLastActive(state),
          timers: state.timers.map((t) =>
            t.id === timerId ? { ...t, isRunning: true } : t
          ),
        });
      },

      pauseTimer: (timerId: string) => {
        const state = get();
        const timer = state.timers.find((t) => t.id === timerId);
        if (!timer) return;

        set({
          ...updateLastActive(state),
          timers: state.timers.map((t) =>
            t.id === timerId ? { ...t, isRunning: false } : t
          ),
        });
      },

      resetTimer: (timerId: string) => {
        const state = get();
        const timer = state.timers.find((t) => t.id === timerId);
        if (!timer) return;

        set({
          ...updateLastActive(state),
          timers: state.timers.map((t) =>
            t.id === timerId
              ? {
                  ...t,
                  remainingSeconds: t.totalSeconds,
                  isRunning: false,
                  isComplete: false,
                }
              : t
          ),
        });
      },

      tickTimer: (timerId: string) => {
        const state = get();
        if (state.isPaused) return; // Prevent ticking if globally paused
        
        const timer = state.timers.find((t) => t.id === timerId);
        if (!timer || !timer.isRunning || timer.isComplete) return;

        const newRemaining = timer.remainingSeconds - 1;
        const isComplete = newRemaining <= 0;

        set({
          // Note: tickTimer does NOT update lastActiveAt per requirements
          timers: state.timers.map((t) =>
            t.id === timerId
              ? {
                  ...t,
                  remainingSeconds: Math.max(0, newRemaining),
                  isRunning: !isComplete,
                  isComplete: isComplete,
                }
              : t
          ),
        });
      },

      adjustTimer: (timerId: string, seconds: number) => {
        const state = get();
        set({
          ...updateLastActive(state),
          timers: state.timers.map((t) =>
            t.id === timerId
              ? {
                  ...t,
                  remainingSeconds: Math.max(0, t.remainingSeconds + seconds),
                  totalSeconds: Math.max(0, t.totalSeconds + seconds),
                  isComplete: Math.max(0, t.remainingSeconds + seconds) <= 0 && t.isComplete,
                }
              : t
          ),
        });
      },

      removeTimer: (timerId: string) => {
        const state = get();
        set({
          ...updateLastActive(state),
          timers: state.timers.filter((t) => t.id !== timerId),
        });
      },

      // Session Lifecycle
      completeRecipe: () => {
        const state = get();
        set({
          ...updateLastActive(state),
          isCompleted: true,
        });
      },

      resetSession: () => {
        set({
          recipe: null,
          rawRecipeData: null,
          currentStepIndex: 0,
          isCompleted: false,
          startedAt: null,
          lastActiveAt: null,
          usedIngredientIds: [],
          completedSteps: [],
          timers: [],
          isPaused: false,

        });
      },

      togglePause: () => {
        const state = get();
        set({
          ...updateLastActive(state),
          isPaused: !state.isPaused
        });
      },

      // Helper Methods
      hasActiveSession: () => {
        const state = get();
        return state.recipe !== null && !state.isCompleted;
      },
    }),
    {
      name: 'cooking-mode-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recipe: state.recipe,
        rawRecipeData: state.rawRecipeData,
        currentStepIndex: state.currentStepIndex,
        usedIngredientIds: state.usedIngredientIds,
        completedSteps: state.completedSteps,
        timers: state.timers,
        isCompleted: state.isCompleted,
        startedAt: state.startedAt,
        lastActiveAt: state.lastActiveAt,
        isPaused: state.isPaused,

      }),
    }
  )
);

