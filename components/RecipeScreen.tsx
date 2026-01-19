import { Audio } from 'expo-av';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  PanResponder,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { useAlert } from "../components/AlertProvider";

import ConfettiCannon from "react-native-confetti-cannon";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
// @ts-ignore - expo-keep-awake may not be installed yet
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { Ionicons } from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { useCookingStore } from "../stores/useCookingStore";
import { mapRecipeDataToRecipe } from "../utils/recipeMapper";
import { synthesizeSpeech } from "../utils/googleTTS";
import Voice from '@react-native-voice/voice';
import { Volume2, VolumeX } from "lucide-react-native";
import { useSettingsStore } from "../stores/useSettingsStore";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  Easing,
  FadeIn,
  FadeOut,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MotiView, AnimatePresence } from "moti";
import {
  X,
  Clock,
  ChefHat,
  Flame,
  Thermometer,
  Scissors,
  Utensils,
  Timer,
  CookingPot,
  Blend,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Bell,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Wrench,
  Coffee,
  Mic,
  MicOff,
} from "lucide-react-native";



const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Constants
const SERVING_MULTIPLIERS = [0.25, 0.5, 1, 1.5, 2, 3, 4] as const;

// Action Badge Color Mapping
interface ActionBadgeConfig {
  icon: any;
  color: string;
  bgColor: string;
}

const getActionBadgeConfig = (actionType: string): ActionBadgeConfig => {
  const normalized = actionType.toLowerCase();

  const configs: Record<string, ActionBadgeConfig> = {
    boiling: {
      icon: CookingPot,
      color: "#60a5fa",
      bgColor: "rgba(96, 165, 250, 0.2)",
    },
    sauteing: {
      icon: Flame,
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.2)",
    },
    heating: {
      icon: Thermometer,
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.2)",
    },
    mixing: {
      icon: Utensils,
      color: "#a78bfa",
      bgColor: "rgba(167, 139, 250, 0.2)",
    },
    chopping: {
      icon: Scissors,
      color: "#22c55e",
      bgColor: "rgba(34, 197, 94, 0.2)",
    },
    baking: {
      icon: ChefHat,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.2)",
    },
    frying: {
      icon: Flame,
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.2)",
    },
    grilling: {
      icon: Flame,
      color: "#dc2626",
      bgColor: "rgba(220, 38, 38, 0.2)",
    },
    resting: {
      icon: Timer,
      color: "#6b7280",
      bgColor: "rgba(107, 114, 128, 0.2)",
    },
    marinating: {
      icon: Timer,
      color: "#14b8a6",
      bgColor: "rgba(20, 184, 166, 0.2)",
    },
    blending: {
      icon: Blend,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.2)",
    },
  };

  return (
    configs[normalized] || {
      icon: Utensils,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.2)",
    }
  );
};

// formatTime is already defined below, so we don't need a duplicate

interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  preparation?: string;
}

interface ProcessedInstruction {
  action: string;
  speech?: string; // Brief, natural-sounding explanation for text-to-speech
  duration?: number;
  durationUnit?: "seconds" | "minutes" | "hours";
  ingredients?: Ingredient[];
  equipment?: string[]; // Equipment, tools, and other items needed for this step
  temperature?: number;
  temperatureUnit?: "C" | "F";
  animationType?: string;
  notes?: string;
  canDoNextStepInParallel?: boolean;
}

interface RecipeData {
  name: string;
  description: string;
  image?: string | string[];
  ingredients: string[]; // Raw ingredients from extract-recipe
  instructions: string[]; // Raw instructions from extract-recipe
  processedInstructions?: ProcessedInstruction[]; // From process-recipe
  totalTime?: string;
  cookTime?: string;
  prepTime?: string;
  yield?: string | number;
  category?: string;
  cuisine?: string;
  keywords?: string[];
  selectedServings?: number; // Selected serving size from serving-size screen
  originalServings?: number; // Original serving size from recipe
  nutrition?: {
    calories?: string;
    proteinContent?: string;
    fatContent?: string;
    carbohydrateContent?: string;
  };
}

// Helper function to format quantities as fractions - imported from lib/format
import { formatQuantity } from "../lib/format";

const formatDuration = (duration: string): string => {
  const time = duration.replace("PT", "");

  if (time.includes("H")) {
    const hours = time.split("H")[0];
    const minutes = time.split("H")[1]?.replace("M", "") || "0";
    return `${hours}h ${minutes}m`;
  }

  if (time.includes("M")) {
    const minutes = time.replace("M", "");
    return `${minutes} min`;
  }

  return duration;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

// Helper function to get action image source based on animationType
const getActionImageSource = (animationType?: string): any => {
  if (!animationType) return null;

  const normalizedType = animationType.toLowerCase();

  // Map animation types to image sources
  const imageMap: { [key: string]: any } = {
    beating: require("../assets/actionImages/beating.png"),
    blending: require("../assets/actionImages/blending.png"),
    cooling: require("../assets/actionImages/cooling.png"),
    crushing: require("../assets/actionImages/crushing.png"),
    cutting: require("../assets/actionImages/cutting.png"),
    folding: require("../assets/actionImages/folding.png"),
    grating: require("../assets/actionImages/grating.png"),
    heating: require("../assets/actionImages/heating.png"),
    juicing: require("../assets/actionImages/juicing.png"),
    kneading: require("../assets/actionImages/kneading.png"),
    mashing: require("../assets/actionImages/mashing.png"),
    measuring: require("../assets/actionImages/measuring.png"),
    mixing: require("../assets/actionImages/mixing.png"),
    peeling: require("../assets/actionImages/peeling.png"),
    pouring: require("../assets/actionImages/pouring.png"),
    rolling: require("../assets/actionImages/rolling.png"),
    sauteing: require("../assets/actionImages/sauteing.png"),
    seasoning: require("../assets/actionImages/seasoning.png"),
    serving: require("../assets/actionImages/serving.png"),
    shredding: require("../assets/actionImages/shredding.png"),
    sifting: require("../assets/actionImages/sifting.png"),
    steaming: require("../assets/actionImages/steaming.png"),
    stirring: require("../assets/actionImages/stirring.png"),
    straining: require("../assets/actionImages/straining.png"),
    waiting: require("../assets/actionImages/waiting.png"),
    whisking: require("../assets/actionImages/whisking.png"),
  };

  return imageMap[normalizedType] || null;
};

// Function to render text with bold numbers (times and quantities)
const renderTextWithBoldNumbers = (text: string): React.ReactNode => {
  // Pattern to match numbers: whole numbers, decimals, fractions, ranges (e.g., 3-4, 5-10)
  // Also matches numbers with units (e.g., 4 cups, 3 hours, 2-3 minutes)
  const numberPattern =
    /(\d+(?:\.\d+)?(?:\/\d+)?(?:-\d+(?:\.\d+)?)?(?:\s*(?:cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|oz|pounds?|lb|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|hours?|hrs?|minutes?|mins?|min|seconds?|secs?|sec|degrees?|°|F|C))?)/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = numberPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the bold number
    parts.push(
      <Text key={match.index} style={{ fontWeight: "900", color: "#ffa500" }}>
        {match[0]}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? (
    <Text style={{ color: "#ffffff" }}>{parts}</Text>
  ) : (
    <Text style={{ color: "#ffffff" }}>{text}</Text>
  );
};

interface RecipeScreenProps {
  recipe:
  | (RecipeData & { processedInstructions?: ProcessedInstruction[] })
  | null;
}

export default function RecipeScreen({ recipe }: RecipeScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  // Zustand store hooks
  const {
    currentStepIndex,
    usedIngredientIds,
    timers,
    startCooking,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    toggleIngredient,
    addTimer,
    startTimer: startStoreTimer,
    pauseTimer: pauseStoreTimer,
    resetTimer: resetStoreTimer,
    tickTimer,
    adjustTimer,
    removeTimer,
    completeRecipe,
    resetSession,
    isCompleted,
    hasActiveSession: hasStoreActiveSession,
    completedSteps: storedCompletedSteps,
    setStepCompleted,
    isPaused: isGlobalPaused,
    togglePause: toggleGlobalPause,
  } = useCookingStore();

  const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const initializedRecipeRef = useRef<string | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isStepComplete, setIsStepComplete] = useState(false);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [isCookingPaused, setIsCookingPaused] = useState(false); // Pause cooking mode
  const lastUpdateTimeRef = useRef<number>(Date.now());
  // Convert usedIngredientIds from store to Set for compatibility
  const checkedIngredients = useMemo(() => {
    return new Set(usedIngredientIds);
  }, [usedIngredientIds]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(
    "Setting up the kitchen..."
  );

  // New states for cooking mode features
  const [glossaryTerm, setGlossaryTerm] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);  // UI State
  const [showTimersModal, setShowTimersModal] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const {
    voiceEnabled: settingsVoiceEnabled,
    keepScreenAwake: settingsKeepScreenAwake
  } = useSettingsStore();

  const [keepAwakeActive, setKeepAwakeActive] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(settingsVoiceEnabled);

  // Sync with settings but allow local override
  useEffect(() => {
    setIsVoiceEnabled(settingsVoiceEnabled);
  }, [settingsVoiceEnabled]);

  // Keep screen awake logic
  useEffect(() => {
    if (settingsKeepScreenAwake) {
      activateKeepAwake();
      setKeepAwakeActive(true);
    } else {
      deactivateKeepAwake();
      setKeepAwakeActive(false);
    }

    return () => {
      deactivateKeepAwake();
    };
  }, [settingsKeepScreenAwake]);

  // TTS State
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playedTimerAlerts = useRef<Set<string>>(new Set());
  const spokenStepsRef = useRef<Set<number>>(new Set());
  const lastCommandRef = useRef<number>(0);
  const isVoiceStartingRef = useRef<boolean>(false);
  const handleVoiceCommandRef = useRef<((t: string) => void) | null>(null);

  const playCompletionSound = useCallback(async () => {
    try {
      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Memoize loading messages to prevent recreation on every render
  const loadingMessages = useMemo(
    () => [
      "Setting up the kitchen...",
      "Gathering ingredients...",
      "Preheating the oven...",
      "Sharpening knives...",
      "Washing vegetables...",
      "Measuring ingredients...",
      "Organizing cooking tools...",
      "Reading recipe carefully...",
      "Preparing work station...",
      "Getting everything ready...",
    ],
    []
  );

  // Background Timers (Running on other steps)
  const activeTimers = useMemo(() => {
    return timers.filter((t) => t.isRunning && !t.isComplete);
  }, [timers]);

  const getDurationInSeconds = (
    step: ProcessedInstruction
  ): number | undefined => {
    if (!step || !step.duration) return undefined;

    // Normalize durationUnit to handle both singular and plural forms
    const unit = step.durationUnit?.toLowerCase() || "";

    if (unit === "minutes" || unit === "minute" || unit === "min") {
      return step.duration * 60;
    }
    if (
      unit === "hours" ||
      unit === "hour" ||
      unit === "hr" ||
      unit === "hrs"
    ) {
      return step.duration * 3600;
    }
    if (
      unit === "seconds" ||
      unit === "second" ||
      unit === "sec" ||
      unit === "secs"
    ) {
      return step.duration;
    }

    // Default: assume seconds if unit is not recognized
    return step.duration;
  };

  // Get current step timer from store
  const currentStepTimer = useMemo(() => {
    if (!recipeData || !recipeData.processedInstructions) return null;
    const stepId = `step-${currentStepIndex}`;
    return timers.find((t) => t.stepId === stepId) || null;
  }, [timers, currentStepIndex, recipeData]);

  const timeRemaining = currentStepTimer?.remainingSeconds ?? null;
  const isTimerRunning = currentStepTimer?.isRunning ?? false;

  // Master Timer Ticking Effect
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (isGlobalPaused) return;

      // Find all running timers that aren't complete
      const runningTimers = timers.filter(t => t.isRunning && !t.isComplete);
      if (runningTimers.length > 0) {
        runningTimers.forEach(t => tickTimer(t.id));
      }
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [timers, tickTimer, isGlobalPaused]);

  const startStep = useCallback(
    (stepIndex: number) => {
      if (
        !recipeData ||
        !recipeData.processedInstructions ||
        stepIndex < 0 ||
        stepIndex >= recipeData.processedInstructions.length
      )
        return;
      goToStep(stepIndex);
      const duration = getDurationInSeconds(
        recipeData.processedInstructions[stepIndex]
      );

      // Create or update timer in store if step has duration
      if (duration && duration > 0) {
        const stepId = `step-${stepIndex}`;

        // Check if timer already exists for this step
        const existingTimer = timers.find((t) => t.stepId === stepId);

        if (existingTimer) {
          // Use existing timer
          setIsPaused(!existingTimer.isRunning);
        } else {
          // Create new timer in store
          addTimer({
            stepId,
            label: `Step ${stepIndex + 1}`,
            totalSeconds: duration,
            remainingSeconds: duration,
            isRunning: false,
            isComplete: false,
          });
          setIsPaused(true);
        }
      } else {
        setIsPaused(false);
      }

      setIsStepComplete(false);
      setIsTimerComplete(false);
      lastUpdateTimeRef.current = Date.now();
    },
    [recipeData, goToStep, timers, addTimer]
  );

  // Handle timer completion (Haptics, UI State, Sound) for ALL timers
  useEffect(() => {
    // Check all timers, not just the current one
    timers.forEach(timer => {
      if (timer.isComplete && !playedTimerAlerts.current.has(timer.id)) {
        // Mark as played first to prevent race conditions
        playedTimerAlerts.current.add(timer.id);

        // Sound and Haptics
        playCompletionSound();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Extract step index from stepId (e.g., "step-2" -> 2)
        const stepIndexMatch = timer.stepId.match(/step-(\d+)/);
        const targetIndex = stepIndexMatch ? parseInt(stepIndexMatch[1], 10) : -1;

        if (targetIndex !== -1 && targetIndex !== currentStepIndex) {
          // AUTO-NAVIGATE to completed step
          startStep(targetIndex);
        } else if (targetIndex === currentStepIndex) {
          // If it's the current step, update UI states
          setIsTimerComplete(true);
          setIsStepComplete(true);
        }
      } else if (!timer.isComplete && playedTimerAlerts.current.has(timer.id)) {
        // If timer was reset, allow it to sound again later
        playedTimerAlerts.current.delete(timer.id);
      }
    });

    // Update local state for current step specifically (for UI toggle)
    if (currentStepTimer?.isComplete) {
      setIsTimerComplete(true);
    } else {
      setIsTimerComplete(false);
    }
  }, [timers, currentStepIndex, currentStepTimer?.isComplete, playCompletionSound, startStep]);

  const handleNext = useCallback(() => {
    if (!recipeData || !recipeData.processedInstructions) return;

    // Add current step to completed steps if not already completed
    setCompletedSteps((prev) => {
      if (!prev.includes(currentStepIndex)) {
        setStepCompleted(currentStepIndex, true);
        return [...prev, currentStepIndex];
      }
      return prev;
    });

    if (currentStepIndex === recipeData.processedInstructions.length - 1) {
      setIsStepComplete(true);
      completeRecipe();
      setShowCompletionScreen(true);
      return;
    }

    goToNextStep();
    setIsStepComplete(false);
    setIsTimerComplete(false);
  }, [recipeData, currentStepIndex, goToNextStep, completeRecipe]);

  const handlePrevious = useCallback(() => {
    if (
      !recipeData ||
      !recipeData.processedInstructions ||
      currentStepIndex <= 0
    )
      return;

    goToPreviousStep();
    setIsPaused(false);
    setIsStepComplete(false);
    setIsTimerComplete(false);
  }, [recipeData, currentStepIndex, goToPreviousStep]);

  // Swipe gesture handling logic (without visual horizontal translation as requested)
  const swipeThreshold = SCREEN_WIDTH * 0.35; 
  const translateX = useSharedValue(0); // Kept for potential future use or non-intrusive feedback
  const isSwiping = useSharedValue(false);

  // We are keeping the gesture detection but removing the translateX style from the main view
  // to ensure the screen remains "still" during swipes as requested.

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (isCookingPaused) return false;
          // Only respond to intentional horizontal swipes
          return (
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 &&
            Math.abs(gestureState.dx) > 30
          );
        },
        onPanResponderGrant: () => {
          isSwiping.value = true;
        },
        onPanResponderMove: (_, gestureState) => {
          if (isCookingPaused) return;
          // We no longer update translateX.value here to keep the screen "still"
          // but we still allow the responder to stay active if it's a horizontal intent
        },
        onPanResponderRelease: (_, gestureState) => {
          isSwiping.value = false;
          if (isCookingPaused) return;

          const { dx, dy, vx } = gestureState;

          // Horizontal swipe detection for navigation
          if (Math.abs(dx) > Math.abs(dy) * 1.5) {
            const shouldNavigate =
              Math.abs(dx) > swipeThreshold || Math.abs(vx) > 0.6;

            if (shouldNavigate) {
              if (dx > 0) {
                // Swipe right - Previous
                if (currentStepIndex > 0) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handlePrevious();
                }
              } else {
                // Swipe left - Next
                const instructionsLength =
                  recipeData?.processedInstructions?.length || 0;
                if (currentStepIndex < instructionsLength - 1) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleNext();
                }
              }
            }
          }
        },
      }),
    [
      isCookingPaused,
      currentStepIndex,
      recipeData?.processedInstructions?.length,
      handlePrevious,
      handleNext,
      swipeThreshold,
    ]
  );

  // Reset translateX when step changes
  useEffect(() => {
    translateX.value = withSpring(0, { damping: 20 });
  }, [currentStepIndex, translateX]);

  const togglePause = useCallback(() => {
    if (!currentStepTimer) return;

    if (isPaused) {
      // Currently paused - Resume timer
      startStoreTimer(currentStepTimer.id);
      setIsPaused(false);
    } else {
      // Currently running - Pause timer
      pauseStoreTimer(currentStepTimer.id);
      setIsPaused(true);
    }
  }, [
    isPaused,
    currentStepTimer,
    startStoreTimer,
    pauseStoreTimer,
  ]);

  const handleCompleteStep = () => {
    // Check if timer is still running and has time remaining
    const timerStillRunning = isTimerRunning;
    const hasTimeRemaining = timeRemaining !== null && timeRemaining > 0;

    if (timerStillRunning && hasTimeRemaining) {
      // Show confirmation if timer is still running
      showAlert({
        title: "Timer Still Running",
        message: `Are you sure? The timer still has ${formatTime(
          timeRemaining || 0
        )} remaining.`,
        type: "warning",
        secondaryButton: {
          text: "Cancel",
        },
        primaryButton: {
          text: "Complete Anyway",
          onPress: () => {
            // Pause timer in store if it's running
            if (currentStepTimer) {
              pauseStoreTimer(currentStepTimer.id);
            }
            setIsPaused(true);

            setIsStepComplete(true);
            setCompletedSteps((prev) => {
              if (!prev.includes(currentStepIndex)) {
                setStepCompleted(currentStepIndex, true);
                return [...prev, currentStepIndex];
              }
              return prev;
            });

            // Move to next step
            if (
              recipeData &&
              recipeData.processedInstructions &&
              currentStepIndex < recipeData.processedInstructions.length - 1
            ) {
              goToNextStep();
              setIsStepComplete(false);
              setIsTimerComplete(false);
            } else {
              // Last step completed
              completeRecipe();
              showAlert({
                title: "Recipe Complete!",
                message: "You've finished all the steps. Great job!",
                type: "success"
              });
            }
          },
        },
      });
    } else {
      // Timer is not running or has finished, complete normally
      setIsStepComplete(true);
      setCompletedSteps((prev) => {
        if (!prev.includes(currentStepIndex)) {
          setStepCompleted(currentStepIndex, true);
          return [...prev, currentStepIndex];
        }
        return prev;
      });

      // Move to next step if possible
      if (
        recipeData &&
        recipeData.processedInstructions &&
        currentStepIndex < recipeData.processedInstructions.length - 1
      ) {
        goToNextStep();
        setIsStepComplete(false);
        setIsTimerComplete(false);
      } else if (currentStepIndex === (recipeData?.processedInstructions?.length || 0) - 1) {
        // Last step completed
        completeRecipe();
        showAlert({
          title: "Recipe Complete!",
          message: "You've finished all the steps. Great job!",
          type: "success"
        });
      }
    }
  };

  const toggleIngredientHandler = useCallback(
    (ingredient: Ingredient) => {
      // Generate ingredient ID similar to mapper
      const quantityStr =
        ingredient.quantity !== null
          ? `${ingredient.quantity}${ingredient.unit ? ` ${ingredient.unit}` : ""
          }`
          : ingredient.unit || "";
      const ingredientId = `ing-${ingredient.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${quantityStr}`;
      toggleIngredient(ingredientId);
    },
    [toggleIngredient]
  );

  // Rotate loading messages
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[index]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isLoading, loadingMessages]);

  // Get available voices and select a natural-sounding female voice


  useEffect(() => {
    // Recipe data should always be provided as a prop from the parent component
    if (recipe) {
      // Validate recipe data
      if (
        !recipe.processedInstructions ||
        recipe.processedInstructions.length === 0
      ) {
        setError("Recipe instructions are missing or invalid");
        setIsLoading(false);
        return;
      }

      // Create a unique key for this recipe based on title and instructions
      const recipeKey = recipe.name
        ? `${recipe.name}-${recipe.processedInstructions?.length || 0}`
        : JSON.stringify(recipe).substring(0, 100);

      // Prevent re-initialization if this recipe is already initialized
      if (initializedRecipeRef.current === recipeKey && recipeData) {
        return;
      }

      initializedRecipeRef.current = recipeKey;
      setRecipeData(recipe as RecipeData);

      // Map RecipeData to Recipe format and start cooking session in store
      try {
        const mappedRecipe = mapRecipeDataToRecipe(recipe as RecipeData);
        // Only start cooking if we don't have an active session for this recipe
        const store = useCookingStore.getState();
        if (!store.recipe || store.recipe.title !== mappedRecipe.title) {
          startCooking(mappedRecipe, recipe);
        }
      } catch (error) {
        console.error("Error mapping recipe to store format:", error);
        // Continue with local state if mapping fails
      }

      setIsLoading(false);

      const store = useCookingStore.getState();
      const isResuming = store.recipe && store.recipe.title === (recipe as RecipeData).name;
      const initialSteps = isResuming ? store.completedSteps : [];
      const initialStep = isResuming ? store.currentStepIndex : 0;

      setCompletedSteps(initialSteps);
      startStep(initialStep);
    } else {
      setError("No recipe data provided");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.name, recipe?.processedInstructions?.length]); // Only depend on stable recipe properties



  // All hooks must be called before any conditional returns
  const processedInstructions = recipeData?.processedInstructions || [];
  const currentStep = processedInstructions[currentStepIndex];

  // Auto-play audio when step changes (on swipe)


  const initialServings = useMemo(() => {
    // Use selectedServings if provided, otherwise use original yield
    if (recipeData?.selectedServings) return recipeData.selectedServings;
    if (recipeData?.yield) {
      const yieldStr = String(recipeData.yield);
      const match = yieldStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 4;
    }
    return 4;
  }, [recipeData?.selectedServings, recipeData?.yield]);

  const originalServings = useMemo(() => {
    if (recipeData?.originalServings) return recipeData.originalServings;
    if (recipeData?.yield) {
      const yieldStr = String(recipeData.yield);
      const match = yieldStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 4;
    }
    return 4;
  }, [recipeData?.originalServings, recipeData?.yield]);

  const currentServings = initialServings;

  // Helper function to check if a string looks like an instruction rather than an ingredient
  const isInstructionLike = (text: string): boolean => {
    if (!text || typeof text !== "string") return true;

    const trimmed = text.trim();
    if (trimmed.length === 0) return true;

    // If it's very long, it's likely an instruction
    if (trimmed.length > 80) return true;

    const lowerText = trimmed.toLowerCase();

    // Instruction keywords
    const instructionKeywords = [
      "drain",
      "press",
      "cut",
      "mix",
      "heat",
      "fry",
      "cook",
      "simmer",
      "boil",
      "add",
      "stir",
      "toss",
      "remove",
      "place",
      "return",
      "pour",
      "let",
      "gently",
      "until",
      "about",
      "minutes",
      "seconds",
      "degrees",
      "over",
      "medium",
      "high",
      "low",
      "wrap",
      "coat",
      "bake",
      "roast",
      "grill",
      "steam",
      "blend",
      "chop",
      "slice",
      "dice",
      "mince",
      "grate",
      "peel",
      "whisk",
      "beat",
      "fold",
      "knead",
      "roll",
      "sauté",
      "pan-fry",
      "deep-fry",
      "marinate",
      "season",
      "garnish",
      "serve",
    ];

    // Instruction patterns (verbs at the start, action phrases)
    const instructionPatterns = [
      /^(drain|press|cut|mix|heat|fry|cook|simmer|boil|add|stir|toss|remove|place|return|pour|let|wrap|coat|bake|roast|grill|steam|blend|chop|slice|dice|mince|grate|peel|whisk|beat|fold|knead|roll|saute|pan-fry|deep-fry|marinate|season|garnish|serve)\s+/i,
      /\s+(for|until|about|over|on|in|at)\s+\d+/i, // "for 15 minutes", "until golden"
      /\d+\s*(minutes?|seconds?|hours?)/i, // "15 minutes", "30 seconds"
      /(degrees?|\u00B0)\s*(c|f|celcius|fahrenheit)/i, // temperature
      /(over|on)\s+(high|medium|low|medium-high|medium-low)\s+heat/i,
      /^[A-Z][^.!?]*[.!?]$/, // Full sentences (starts with capital, ends with punctuation)
      /\s+and\s+then\s+/i, // "and then"
      /\s+or\s+until\s+/i, // "or until"
    ];

    // Check for instruction patterns
    const hasInstructionPattern = instructionPatterns.some((pattern) =>
      pattern.test(trimmed)
    );
    if (hasInstructionPattern) return true;

    // Count instruction keywords
    const keywordCount = instructionKeywords.filter((kw) =>
      lowerText.includes(kw)
    ).length;

    // If it contains multiple instruction keywords, it's likely an instruction
    if (keywordCount >= 2) return true;

    // If it starts with a verb (common in instructions), it's likely an instruction
    const startsWithVerb =
      /^(drain|press|cut|mix|heat|fry|cook|simmer|boil|add|stir|toss|remove|place|return|pour|let|wrap|coat|bake|roast|grill|steam|blend|chop|slice|dice|mince|grate|peel|whisk|beat|fold|knead|roll|saute|pan-fry|deep-fry|marinate|season|garnish|serve)/i.test(
        trimmed
      );
    if (startsWithVerb) return true;

    // If it contains multiple verbs or action words, it's likely an instruction
    const verbCount = (
      trimmed.match(
        /\b(drain|press|cut|mix|heat|fry|cook|simmer|boil|add|stir|toss|remove|place|return|pour|let|wrap|coat|bake|roast|grill|steam|blend|chop|slice|dice|mince|grate|peel|whisk|beat|fold|knead|roll|saute|pan-fry|deep-fry|marinate|season|garnish|serve)\b/gi
      ) || []
    ).length;
    if (verbCount >= 2) return true;

    // Valid ingredients are usually short, simple names (1-3 words max)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 5) return true; // Too many words for an ingredient

    return false;
  };

  // Memoize all unique ingredients from all steps
  const allIngredients = useMemo(() => {
    const ingredientsMap = new Map<string, Ingredient>();

    // First, collect ingredients from processed instructions (these are the most reliable)
    if (recipeData && recipeData.processedInstructions) {
      recipeData.processedInstructions.forEach((step) => {
        step.ingredients?.forEach((ingredient) => {
          // Validate ingredient has a valid name
          if (
            !ingredient ||
            !ingredient.name ||
            typeof ingredient.name !== "string"
          ) {
            return;
          }

          const trimmedName = ingredient.name.trim();
          if (trimmedName.length === 0) {
            return;
          }

          // Skip if it looks like an instruction
          if (isInstructionLike(trimmedName)) {
            return;
          }

          // Additional validation: ingredient names should be simple (not full sentences)
          // Normalize the name (remove extra whitespace, etc.)
          const normalizedName = trimmedName.replace(/\s+/g, " ");

          // Skip if name is too long or looks like a sentence
          if (normalizedName.length > 50) {
            return;
          }

          // Use normalized name for the key
          const key = `${normalizedName}-${ingredient.preparation || ""}`;
          if (!ingredientsMap.has(key)) {
            ingredientsMap.set(key, { ...ingredient, name: normalizedName });
          } else {
            const existing = ingredientsMap.get(key)!;
            if (
              existing.unit === ingredient.unit &&
              existing.quantity !== null &&
              ingredient.quantity !== null
            ) {
              existing.quantity += ingredient.quantity;
            }
          }
        });
      });
    }

    // Then, add raw ingredients from recipe data (only if not already present and valid)
    if (recipeData && recipeData.ingredients) {
      recipeData.ingredients.forEach((ingName) => {
        if (
          !ingName ||
          typeof ingName !== "string" ||
          ingName.trim().length === 0
        ) {
          return;
        }

        // Skip if it looks like an instruction
        if (isInstructionLike(ingName)) {
          return;
        }

        // Try to parse the ingredient string
        const trimmedName = ingName.trim();

        // Extract name from formats like "Name: quantity unit" or just "Name"
        let name = trimmedName;
        const colonIndex = trimmedName.indexOf(":");
        if (colonIndex > 0) {
          name = trimmedName.substring(0, colonIndex).trim();
        }

        // Skip if name is too long (likely an instruction)
        if (name.length > 50) {
          return;
        }

        const key = `${name}-`;
        // Only add if not already in map (processed instructions take priority)
        if (!ingredientsMap.has(key)) {
          ingredientsMap.set(key, { name, quantity: null, unit: null });
        }
      });
    }

    const scaledIngredients = Array.from(ingredientsMap.values())
      .filter((ing) => {
        // Final validation - must be a valid ingredient object
        if (!ing || !ing.name || typeof ing.name !== "string") return false;

        const trimmedName = ing.name.trim();
        if (trimmedName.length === 0) return false;

        // Final check - make sure it's not instruction-like
        if (isInstructionLike(trimmedName)) return false;

        // Ingredients should be relatively short (max 50 chars)
        if (trimmedName.length > 50) return false;

        // Ingredients shouldn't be full sentences
        if (/^[A-Z][^.!?]*[.!?]$/.test(trimmedName)) return false;

        return true;
      })
      .map((ing) => {
        if (ing.quantity !== null && originalServings > 0) {
          const scaleFactor = currentServings / originalServings;
          return { ...ing, quantity: ing.quantity * scaleFactor };
        }
        return ing;
      });
    return scaledIngredients;
  }, [recipeData, currentServings, originalServings]);

  // Memoize ingredients needed for current step (scaled)
  const currentStepIngredients = useMemo(() => {
    if (
      !recipeData ||
      !recipeData.processedInstructions ||
      !recipeData.processedInstructions[currentStepIndex]
    )
      return new Set();

    const scaleFactor =
      originalServings > 0 ? currentServings / originalServings : 1;

    return new Set(
      recipeData.processedInstructions[currentStepIndex]?.ingredients?.map(
        (i) => {
          const scaledQuantity =
            i.quantity !== null ? i.quantity * scaleFactor : null;
          return `${i.name}-${scaledQuantity}-${i.unit}`;
        }
      ) || []
    );
  }, [recipeData, currentStepIndex, currentServings, originalServings]);

  // Calculate step progress
  const stepProgress = useMemo(() => {
    if (timeRemaining === null || !currentStep) return 0;
    const totalDuration = getDurationInSeconds(currentStep);
    if (!totalDuration) return 0;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  }, [timeRemaining, currentStep]);

  // Calculate overall recipe progress
  const overallProgress = useMemo(() => {
    if (processedInstructions.length === 0) return 0;

    // Calculate progress based on current index
    // This ensures the progress bar stays in sync with the step counter (e.g., 1/10 = 10%)
    const progress = ((currentStepIndex + 1) / processedInstructions.length) * 100;

    // If we've completed the last step, ensure it stays at 100%
    if (currentStepIndex === processedInstructions.length - 1 && isStepComplete) {
      return 100;
    }

    return progress;
  }, [
    currentStepIndex,
    isStepComplete,
    processedInstructions.length,
  ]);

  // Glossary terms detection
  const glossaryTerms: Record<string, string> = {
    simmer: "Simmer: Cook gently just below boiling point (small bubbles).",
    fold: "Fold: Gently combine ingredients using a cutting motion with a spatula.",
    braise: "Braise: Cook slowly in a covered pot with liquid at low heat.",
    blanch: "Blanch: Briefly boil then immediately cool in ice water.",
    sauté:
      "Sauté: Cook quickly in a small amount of fat over medium-high heat.",
    sear: "Sear: Cook at high heat to brown the surface quickly.",
    poach: "Poach: Cook gently in liquid just below boiling point.",
    whisk: "Whisk: Beat rapidly with a wire whisk to incorporate air.",
    knead: "Knead: Work dough by pressing and folding repeatedly.",
    julienne: "Julienne: Cut into thin matchstick-sized strips.",
  };

  // Detect glossary terms in instruction
  const detectGlossaryTerms = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    for (const term in glossaryTerms) {
      if (lowerText.includes(term)) {
        return term;
      }
    }
    return null;
  }, []);

  // Safety detection
  const safetyKeywords = [
    "hot oil",
    "pressure cooker",
    "raw meat",
    "boiling water",
    "steam",
    "sharp knife",
    "open flame",
  ];

  const hasSafetyNotice = useMemo(() => {
    if (!currentStep?.action) return false;
    const lowerAction = currentStep.action.toLowerCase();
    return safetyKeywords.some((keyword) => lowerAction.includes(keyword));
  }, [currentStep]);

  const getSafetyMessage = useMemo(() => {
    if (!currentStep?.action) return null;
    const lowerAction = currentStep.action.toLowerCase();
    if (lowerAction.includes("hot oil"))
      return "⚠️ Be careful: Add oil slowly to avoid splashing.";
    if (lowerAction.includes("pressure cooker"))
      return "⚠️ Follow pressure cooker safety guidelines carefully.";
    if (lowerAction.includes("raw meat"))
      return "⚠️ Handle raw meat safely. Wash hands and surfaces after contact.";
    if (lowerAction.includes("boiling water") || lowerAction.includes("steam"))
      return "⚠️ Be careful with hot steam and boiling water.";
    if (lowerAction.includes("sharp knife"))
      return "⚠️ Use sharp knives carefully. Keep fingers away from blade.";
    if (lowerAction.includes("open flame"))
      return "⚠️ Be cautious around open flames. Keep flammable items away.";
    return null;
  }, [currentStep]);

  // Handle timer start
  const handleStartTimer = useCallback(() => {
    if (!recipeData || !recipeData.processedInstructions) return;

    const currentStep = recipeData.processedInstructions[currentStepIndex];
    const duration = getDurationInSeconds(currentStep);

    if (!duration || duration <= 0) return;

    const stepId = `step-${currentStepIndex}`;

    // Get current store state
    const store = useCookingStore.getState();

    // Check if timer exists in store
    let timer = store.timers.find((t) => t.stepId === stepId);

    // If timer doesn't exist, create it
    if (!timer) {
      addTimer({
        stepId,
        label: `Step ${currentStepIndex + 1}`,
        totalSeconds: duration,
        remainingSeconds: duration,
        isRunning: false,
        isComplete: false,
      });
      // Get the newly created timer from updated store
      timer = useCookingStore
        .getState()
        .timers.find((t) => t.stepId === stepId);
    }

    if (timer) {
      if (timer.isComplete) {
        // Restart logic
        resetStoreTimer(timer.id);
        startStoreTimer(timer.id);
        setIsPaused(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (timer.isRunning) {
        pauseStoreTimer(timer.id);
        setIsPaused(true);
      } else {
        startStoreTimer(timer.id);
        setIsPaused(false);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [
    recipeData,
    currentStepIndex,
    addTimer,
    startStoreTimer,
    pauseStoreTimer,
    resetStoreTimer,
    getDurationInSeconds,
  ]);

  const audioRequestId = useRef(0);

  // TTS Functions
  const stopAudio = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (error) {
      console.log("Error stopping audio:", error);
    }
  }, []);

  const playStepAudio = useCallback(async (text: string) => {
    // Increment ID to cancel any previous pending operations
    const requestId = ++audioRequestId.current;

    try {
      // Stop previous audio
      await stopAudio();
      
      if (requestId !== audioRequestId.current) return;

      if (!text) return;

      setIsPlaying(true);
      const audioUri = await synthesizeSpeech(text);
      
      // Check if this request is still valid after async operation
      if (requestId !== audioRequestId.current) return;

      if (audioUri) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        
        // Final check before assigning/playing
        if (requestId !== audioRequestId.current) {
             await sound.unloadAsync();
             return;
        }

        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.log("Error playing audio:", error);
      setIsPlaying(false);
    }
  }, [stopAudio]);

  // Auto-read effect
  useEffect(() => {
    if (isTTSEnabled && !isGlobalPaused && !isLoading && currentStep?.action && !isCompleted) {
      // Only auto-play if we haven't read this step index yet
      if (!spokenStepsRef.current.has(currentStepIndex)) {
        // Small delay to allow transition to settle
        const timer = setTimeout(() => {
          const textToRead = currentStep.speech || currentStep.action;
          playStepAudio(textToRead);
          // Mark as spoken
          spokenStepsRef.current.add(currentStepIndex);
        }, 500);
        
        // Cleanup function handles interruption
        return () => {
             clearTimeout(timer);
             // Verify we should definitely stop audio when switching steps
             stopAudio();
             // Invalidate any pending loads from this step
             audioRequestId.current++;
        };
      }
    } else {
      stopAudio();
    }
  }, [currentStepIndex, isTTSEnabled, isGlobalPaused, isLoading, currentStep, isCompleted, stopAudio, playStepAudio]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      audioRequestId.current++;
    };
  }, []);

  // Handle add 1 minute
  const handleAddMinute = useCallback(() => {
    if (currentStepTimer) {
      adjustTimer(currentStepTimer.id, 60);
    }
  }, [currentStepTimer, adjustTimer]);

  // Voice Command Handler (Deterministic Engine)
  const handleVoiceCommand = useCallback((transcript: string) => {
    const now = Date.now();
    // 1.5 second cooldown to prevent double-triggers (especially from partial results)
    if (now - lastCommandRef.current < 1500) {
      return false;
    }

    const text = transcript.toLowerCase().trim();
    if (!text) return false;

    console.log("[Voice] Received:", text);

    // special regex check for "step X" commands
    const stepMatch = text.match(/(?:go to |jump to |move to )?step\s+(\w+|\d+)/);
    if (stepMatch) {
      let stepNum = parseInt(stepMatch[1], 10);
      
      // Handle word numbers (limiting to common recipe step counts)
      if (isNaN(stepNum)) {
        const wordMap: {[key: string]: number} = {
          "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
          "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "twenty": 20
        };
        stepNum = wordMap[stepMatch[1]] || 0;
      }
      
      const totalSteps = recipeData?.processedInstructions?.length || 0;
      
      if (stepNum > 0 && stepNum <= totalSteps) {
         lastCommandRef.current = now;
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         Voice.stop().catch(e => console.log("Voice stop error:", e));
         setPartialTranscript("");
         
         // Convert to 0-based index
         startStep(stepNum - 1);
         return true;
      }
    }

    const commands = [
      {
        match: ["go to timer", "jump to timer", "show timer", "where is the timer"],
        action: () => {
          // Find the first running timer
          const runningTimer = timers.find(t => t.isRunning && !t.isComplete);
          if (runningTimer) {
             const stepIdMatch = runningTimer.stepId.match(/step-(\d+)/);
             if (stepIdMatch) {
               const stepIndex = parseInt(stepIdMatch[1], 10);
               startStep(stepIndex);
             }
          }
        }
      },
      { match: ["next step", "next", "continue", "forward", "ready"], action: () => goToNextStep() },
      { match: ["back", "previous", "go back", "previous step"], action: () => goToPreviousStep() },
      {
        match: ["pause", "stop", "pause timer"], action: () => {
          if (currentStepTimer?.isRunning) {
            pauseStoreTimer(currentStepTimer.id);
            setIsPaused(true);
          }
        }
      },
      {
        match: ["restart", "restart timer", "reset timer"], action: () => {
          if (currentStepTimer) {
             resetStoreTimer(currentStepTimer.id);
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      },
      {
        match: ["break", "kitchen break", "take a break", "pause cooking", "hold on"],
        action: () => {
             if (!isGlobalPaused) {
                 toggleGlobalPause();
                 Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
             }
        }
      },
      { 
        match: ["resume", "resume cooking", "resume timer", "continue timer", "continue", "back to cooking"], action: () => {
          // If global pause is active, resume cooking
          if (isGlobalPaused) {
              toggleGlobalPause();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return;
          }
          
          // If timer is paused, this will resume it (handleStartTimer toggles)
          if (currentStepTimer && !currentStepTimer.isRunning && !currentStepTimer.isComplete) {
            handleStartTimer();
          }
        }
      },
      { match: ["start timer", "begin", "start"], action: () => handleStartTimer() },
      {
        match: ["repeat", "say again", "repeat instruction"], action: () => {
          const textToRead = currentStep.speech || currentStep.action;
          playStepAudio(textToRead);
        }
      },
      { match: ["add one minute", "add 1 minute", "minute extra"], action: () => handleAddMinute() },
    ];

    for (const cmd of commands) {
      if (cmd.match.some(m => text.includes(m))) {
        lastCommandRef.current = now; // Set cooldown
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Stop recognition immediately and clear transcript to avoid race conditions
        Voice.stop().catch(e => console.log("Voice stop error:", e));
        setPartialTranscript("");

        cmd.action();
        return true;
      }
    }
    return false;
  }, [goToNextStep, goToPreviousStep, currentStepTimer, pauseStoreTimer, handleStartTimer, currentStep, playStepAudio, handleAddMinute, startStep, recipeData]);

  // Keep Ref in sync for listeners to stay stable
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  }, [handleVoiceCommand]);

  // Stable Voice Recognition Listeners
  useEffect(() => {
    if (!isVoiceEnabled) {
      Voice.stop().catch(() => { });
      return;
    }

    const startVoice = async () => {
      if (isVoiceStartingRef.current) return;
      try {
        isVoiceStartingRef.current = true;
        await Voice.start('en-US');
      } catch (e) {
        console.log("Voice start error helper:", e);
      } finally {
        isVoiceStartingRef.current = false;
      }
    };

    Voice.onSpeechStart = () => setIsListening(true);

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      if (isVoiceEnabled) {
        setTimeout(startVoice, 500);
      }
    };

    Voice.onSpeechError = (e) => {
      // Log only real errors, ignore "already started" in console if possible
      if (e.error?.message !== "Speech recognition already started!") {
        console.log("Voice Error:", e);
      }
      setIsListening(false);
      if (isVoiceEnabled) {
        setTimeout(startVoice, 1000);
      }
    };

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        handleVoiceCommandRef.current?.(e.value[0]);
      }
    };

    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setPartialTranscript(e.value[0]);
        handleVoiceCommandRef.current?.(e.value[0]);
      }
    };

    // Initial start
    startVoice();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
    // Dependency array is minimal to prevent redundant re-renders
  }, [isVoiceEnabled]);







  // Handle exit with confirmation
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(() => {
    // Stop any ongoing speech
    stopAudio();
    if (keepAwakeActive) {
      deactivateKeepAwake();
    }
    // Go to the cook tab session instead of back to ingredients
    router.replace("/cook");
  }, [keepAwakeActive, router, stopAudio]);

  // Get shortened recipe title
  const recipeTitle = useMemo(() => {
    if (!recipeData?.name) return "Recipe";
    const title = recipeData.name;
    return title.length > 20 ? title.substring(0, 20) + "..." : title;
  }, [recipeData?.name]);

  // Check if instruction has glossary terms
  const instructionGlossaryTerm = useMemo(() => {
    if (!currentStep?.action) return null;
    return detectGlossaryTerms(currentStep.action);
  }, [currentStep, detectGlossaryTerms]);

  // Calculate total time in minutes (must be before early returns)
  const totalTimeMinutes = useMemo(() => {
    if (!recipeData?.totalTime) return 45; // Default
    const match = recipeData.totalTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 45;
  }, [recipeData?.totalTime]);

  // Animated progress value (must be before early returns)
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withTiming(overallProgress, {
      duration: 400,
      easing: Easing.out(Easing.cubic), // cubic-out easing
    });
  }, [overallProgress, progressValue]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value}%`,
    };
  });

  // Early returns after all hooks
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffa500" />
          <Text style={styles.loadingText}>{currentLoadingMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipeData || !recipeData.processedInstructions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>
            Error: {error || "No recipe data found."}
          </Text>
          <Text style={styles.errorSubtext}>
            Please go back and try extracting the recipe again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View
      className="flex-1 bg-neutral-950"
      {...panResponder.panHandlers}
    >
      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* 1. Progress Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4 bg-neutral-950 z-10">
          {/* Close Button */}
          <Pressable
            onPress={handleExit}
            className="w-10 h-10 rounded-full bg-neutral-800/80 items-center justify-center active:opacity-70"
            onPressIn={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            hitSlop={8}
          >
            <X size={20} color="#9ca3af" />
          </Pressable>

          {/* Title - Centered */}
          <View className="flex-1 items-center px-4">
            <Text
              className="text-center text-white font-semibold text-base"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {recipeTitle}
            </Text>
          </View>

          {/* Time & Pause Display */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center bg-neutral-800/80 rounded-full px-3 py-1.5">
              <Clock size={14} color="#9ca3af" />
              <Text className="text-neutral-400 text-sm ml-1.5">
                {totalTimeMinutes} min
              </Text>
            </View>

            {/* Global Pause Button */}
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                toggleGlobalPause();
              }}
              className={`w-10 h-10 rounded-full items-center justify-center active:opacity-70 ${isGlobalPaused ? "bg-amber-500" : "bg-neutral-800/80"
                }`}
            >
              {isGlobalPaused ? (
                <Play size={20} color="#000000" fill="#000000" />
              ) : (
                <Coffee size={20} color="#9ca3af" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Progress Bar with Counter */}
        <MotiView
          animate={{
            opacity: isTimerRunning ? [1, 0.7, 1] : 1,
            scale: isTimerRunning ? [1, 1.01, 1] : 1,
          }}
          transition={{
            type: "timing",
            duration: 1500,
            loop: true,
          }}
          className="flex-row items-center px-4 pb-2"
        >
          <View className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-amber-500 rounded-full"
              style={progressStyle}
            />
          </View>
          <View className="ml-4 items-end justify-center">
            <View className="flex-row items-baseline">
              <MotiView
                key={currentStepIndex}
                from={{ scale: 0.5, opacity: 0, translateY: 10 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                <Text className="text-amber-500 text-3xl font-black italic tracking-tighter">
                  {currentStepIndex + 1}
                </Text>
              </MotiView>
              <Text className="text-neutral-600 text-lg font-bold ml-1">
                / {processedInstructions.length}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Active Timers Strip */}
        {activeTimers.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="px-4 pb-2 flex-row flex-wrap gap-2"
          >
            {activeTimers.map((timer) => {
              const stepIdx = processedInstructions.findIndex((_, idx) => `step-${idx}` === timer.stepId);
              const isCurrentStep = stepIdx === currentStepIndex;

              return (
                <MotiView
                  key={`timer-moti-${timer.id}`}
                  animate={{
                    scale: isCurrentStep ? [1, 1.06, 1] : 1,
                    opacity: isCurrentStep ? 1 : 0.8,
                    shadowOpacity: isCurrentStep ? [0, 0.8, 0] : 0,
                  }}
                  transition={{
                    type: "timing",
                    duration: 1200,
                    loop: true,
                  }}
                  style={{
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 8,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      if (stepIdx !== -1) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        startStep(stepIdx);
                      }
                    }}
                    className={`flex-row items-center border rounded-full px-4 py-2 ${isCurrentStep
                        ? "bg-amber-500 border-amber-600"
                        : "bg-amber-500/10 border-amber-500/30"
                      }`}
                  >
                    <Timer size={18} color={isCurrentStep ? "#000000" : "#f59e0b"} />
                    <Text className={`font-bold ml-2 ${isCurrentStep ? "text-black text-base" : "text-amber-500 text-sm"
                      }`}>
                      {stepIdx !== -1 ? `Step ${stepIdx + 1}: ` : ""}{formatTime(timer.remainingSeconds)}
                    </Text>
                  </Pressable>
                </MotiView>
              );
            })}
          </Animated.View>
        )}

        {/* Step Indicators */}
        <View className="flex-row items-center justify-center gap-2 py-2">
          {processedInstructions.map((_, index) => {
            const isCurrent = index === currentStepIndex;
            const isCompleted = completedSteps.includes(index);

            return (
              <Pressable
                key={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  startStep(index);
                }}
                className={`${isCurrent
                    ? "w-8 h-2 bg-amber-500 rounded-full"
                    : isCompleted
                      ? "w-2 h-2 bg-amber-500/50 rounded-full"
                      : "w-2 h-2 bg-neutral-700 rounded-full"
                  }`}
              />
            );
          })}
        </View>

        {/* Main Content Area - Scrollable */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 250, 320),
            paddingTop: 0,
          }}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1, bottom: 0 }}
          nestedScrollEnabled={true}
          bounces={true}
          alwaysBounceVertical={true}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          removeClippedSubviews={false}
        >
          {currentStep && (
            <View className="px-5 py-2">
              {/* Step Image */}
              {/* {currentStep.animationType &&
                getActionImageSource(currentStep.animationType) && (
                  <View className="h-48 mb-4 rounded-2xl overflow-hidden bg-neutral-900">
                    <Image
                      source={getActionImageSource(currentStep.animationType)}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/80" />
                  </View>
                )} */}

              {/* Action Badge */}
              {currentStep.animationType && (
                <View
                  className="self-start rounded-full px-3 py-1.5 mb-4 flex-row items-center gap-2"
                  style={{
                    backgroundColor: getActionBadgeConfig(
                      currentStep.animationType
                    ).bgColor,
                  }}
                >
                  {React.createElement(
                    getActionBadgeConfig(currentStep.animationType).icon,
                    {
                      size: 16,
                      color: getActionBadgeConfig(currentStep.animationType)
                        .color,
                    }
                  )}
                  <Text
                    className="font-semibold text-sm capitalize"
                    style={{
                      color: getActionBadgeConfig(currentStep.animationType)
                        .color,
                    }}
                  >
                    {currentStep.animationType}
                  </Text>
                </View>
              )}

              {/* Main Instruction */}
              <Text className="text-2xl font-semibold text-white leading-relaxed mb-4">
                {renderTextWithBoldNumbers(currentStep.action)}
              </Text>

              {/* Ingredients Needed for This Step */}
              {currentStep.ingredients &&
                currentStep.ingredients.length > 0 && (
                  <View className="bg-neutral-800/40 rounded-lg px-4 py-3 mb-4">
                    <View className="flex-row items-center mb-2 gap-1">
                      <ListChecks size={16} color="#ffa500" className="mr-2" />
                      <Text className="text-amber-400 text-sm font-semibold uppercase tracking-wide">
                        Ingredients Needed
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {currentStep.ingredients
                        .filter((ing) => {
                          if (!ing || !ing.name) return false;
                          return !isInstructionLike(ing.name);
                        })
                        .map((ingredient, index) => {
                          const scaleFactor =
                            originalServings > 0
                              ? currentServings / originalServings
                              : 1;
                          const scaledQuantity =
                            ingredient.quantity !== null
                              ? ingredient.quantity * scaleFactor
                              : null;
                          const quantityText = scaledQuantity
                            ? `${formatQuantity(scaledQuantity)}${ingredient.unit ? ` ${ingredient.unit}` : ""
                            }`
                            : ingredient.unit || "";

                          return (
                            <View
                              key={`ing-step-${index}`}
                              className="bg-neutral-700/50 rounded-full px-3 py-1.5 flex-row items-center"
                            >
                              <Text className="text-white text-sm font-medium">
                                {quantityText && (
                                  <Text className="text-amber-400 font-semibold">
                                    {quantityText}{" "}
                                  </Text>
                                )}
                                {ingredient.name}
                              </Text>
                            </View>
                          );
                        })}
                    </View>
                  </View>
                )}

              {/* Equipment Needed for This Step */}
              {currentStep.equipment && currentStep.equipment.length > 0 && (
                <View className="bg-neutral-800/40 rounded-lg px-4 py-3 mb-4">
                  <View className="flex-row items-center mb-2 gap-1">
                    <Wrench size={16} color="#60a5fa" className="mr-2" />
                    <Text className="text-blue-400 text-sm font-semibold uppercase tracking-wide">
                      Equipment Needed
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {currentStep.equipment.map((item, index) => (
                      <View
                        key={`eq-${item}-${index}`}
                        className="bg-neutral-700/50 rounded-full px-3 py-1.5"
                      >
                        <Text className="text-white text-sm font-medium">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Temperature */}
              {currentStep.temperature && (
                <View className="bg-red-500/10 rounded-xl px-4 py-3 mb-4 flex-row items-center">
                  <Thermometer size={20} color="#ef4444" className="mr-2" />
                  <Text className="text-red-400 font-medium">
                    {currentStep.temperature}°
                    {currentStep.temperatureUnit || "F"}
                    {currentStep.temperatureUnit === "C" &&
                      currentStep.temperature
                      ? ` / ${Math.round(
                        (currentStep.temperature * 9) / 5 + 32
                      )}°F`
                      : currentStep.temperatureUnit === "F" &&
                        currentStep.temperature
                        ? ` / ${Math.round(
                          ((currentStep.temperature - 32) * 5) / 9
                        )}°C`
                        : ""}
                  </Text>
                </View>
              )}

              {/* Warning */}
              {hasSafetyNotice && getSafetyMessage && (
                <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-4">
                  <View className="flex-row items-start">
                    <AlertTriangle size={20} color="#f59e0b" className="mr-3" />
                    <Text className="text-amber-300 text-sm leading-relaxed flex-1">
                      {getSafetyMessage.replace("⚠️ ", "")}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tip */}
              {currentStep.notes && (
                <View className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 mb-4">
                  <View className="flex-row items-start">
                    <Lightbulb size={20} color="#60a5fa" className="mr-3" />
                    <Text className="text-blue-300 text-sm leading-relaxed flex-1">
                      {currentStep.notes}
                    </Text>
                  </View>
                </View>
              )}

              {/* Timer Button */}
              {currentStep.duration && (
                <MotiView
                  animate={{
                    scale: isTimerRunning ? [1, 1.03, 1] : 1,
                    shadowOpacity: isTimerRunning ? [0, 0.5, 0] : 0,
                  }}
                  transition={{
                    type: "timing",
                    duration: 2000,
                    loop: true,
                  }}
                  style={{
                    shadowColor: "#f59e0b",
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 10,
                  }}
                >
                  {currentStepTimer && !isTimerRunning && !isTimerComplete && currentStepTimer.remainingSeconds < currentStepTimer.totalSeconds ? (
                    <View className="flex-row gap-3 mt-2">
                       {/* Resume Button */}
                       <Pressable
                        onPress={handleStartTimer}
                        className="flex-1 bg-amber-500 rounded-2xl px-4 py-4 active:opacity-80 items-center justify-center flex-row"
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      >
                        <Play size={22} color="#000000" fill="#000000" className="mr-2" />
                        <Text className="text-black text-lg font-bold">
                          Resume ({formatTime(currentStepTimer.remainingSeconds)})
                        </Text>
                      </Pressable>

                      {/* Restart Button */}
                      <Pressable
                        onPress={() => {
                          if (currentStepTimer) resetStoreTimer(currentStepTimer.id);
                        }}
                        className="bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-4 active:bg-neutral-700 items-center justify-center"
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      >
                         <RotateCcw size={22} color="#ffffff" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleStartTimer}
                      className={`rounded-2xl px-6 py-4 mt-2 ${isTimerComplete
                          ? "bg-green-500"
                          : isTimerRunning
                            ? "bg-neutral-800 border border-amber-500/50"
                            : "bg-amber-500"
                        } active:opacity-80`}
                      onPressIn={() =>
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                      }
                    >
                      <View className="flex-row items-center justify-center">
                        {isTimerComplete ? (
                          <CheckCircle2 size={22} color="#000000" className="mr-2" />
                        ) : isTimerRunning ? (
                          <Pause
                            size={22}
                            color="#ffffff"
                            className="mr-2"
                          />
                        ) : (
                          <Timer
                            size={22}
                            color="#000000"
                            className="mr-2"
                          />
                        )}
                        <Text
                          className={`text-lg font-semibold ${isTimerComplete
                              ? "text-black"
                              : isTimerRunning
                                ? "text-neutral-300"
                                : "text-black"
                            }`}
                        >
                          {isTimerComplete
                            ? "Timer Completed - Tap to Restart"
                            : isTimerRunning
                              ? `${formatTime(timeRemaining || 0)} Remaining`
                              : `Start ${formatTime(
                                getDurationInSeconds(currentStep) || 0
                              )} Timer`}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                </MotiView>
              )}
            </View>
          )}

          {/* Voice Command Toggle / Status */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsVoiceEnabled(!isVoiceEnabled);
            }}
            className="absolute top-4 right-16 z-50 w-10 h-10 rounded-full bg-neutral-800/80 items-center justify-center border border-neutral-700/50"
          >
            {isVoiceEnabled ? (
              <MotiView
                animate={{
                  scale: isListening ? [1, 1.2, 1] : 1,
                  opacity: isListening ? [1, 0.6, 1] : 1,
                }}
                transition={{
                  type: 'timing',
                  duration: 1000,
                  loop: true,
                }}
              >
                <Mic
                  size={20}
                  color={isListening ? "#f59e0b" : "#ffffff"}
                />
              </MotiView>
            ) : (
              <MicOff size={20} color="#6b7280" />
            )}
          </Pressable>

          {/* TTS Speaker Toggle / Manual Trigger */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (isPlaying) {
                stopAudio();
              } else if (currentStep) {
                const textToRead = currentStep.speech || currentStep.action;
                playStepAudio(textToRead);
                // Also mark as spoken if it wasn't already (though it usually would be)
                spokenStepsRef.current.add(currentStepIndex);
              }
            }}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-800/80 items-center justify-center border border-neutral-700/50"
          >
            <View>
              {isPlaying ? (
                <Volume2
                  size={20}
                  color="#f59e0b"
                  className="animate-pulse"
                />
              ) : (
                <Volume2 size={20} color="#ffffff" />
              )}
            </View>
          </Pressable>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-neutral-800 flex-row items-center justify-between px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          {/* Left Buttons */}
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowIngredientsModal(true);
              }}
              className="w-12 h-12 rounded-full bg-neutral-800 items-center justify-center active:opacity-70"
            >
              <ListChecks size={22} color="#9ca3af" />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimersModal(true);
              }}
              className="w-12 h-12 rounded-full bg-neutral-800 items-center justify-center active:opacity-70"
            >
              <Timer size={22} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Right Buttons */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={handlePrevious}
              disabled={currentStepIndex === 0}
              className={`w-14 h-14 rounded-full items-center justify-center ${currentStepIndex === 0 ? "bg-neutral-800/50" : "bg-neutral-700"
                } active:opacity-70`}
              onPressIn={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <ChevronLeft
                size={28}
                color={currentStepIndex === 0 ? "#4b5563" : "#ffffff"}
              />
            </Pressable>
            <Pressable
              onPress={handleNext}
              className={`h-14 px-8 rounded-full items-center justify-center flex-row ${currentStepIndex ===
                  (recipeData?.processedInstructions?.length || 1) - 1
                  ? "bg-green-500"
                  : "bg-amber-500"
                } active:opacity-80`}
              onPressIn={() => {
                if (
                  currentStepIndex ===
                  (recipeData?.processedInstructions?.length || 1) - 1
                ) {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                  );
                } else {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            >
              <Text className="text-black font-bold text-lg">
                {currentStepIndex ===
                  (recipeData?.processedInstructions?.length || 1) - 1
                  ? "Done!"
                  : currentStep?.canDoNextStepInParallel
                    ? "Next (Ready Now)"
                    : "Next"}
              </Text>
              {currentStepIndex !==
                (recipeData?.processedInstructions?.length || 1) - 1 && (
                  <ChevronRight size={24} color="#000000" className="ml-1" />
                )}
            </Pressable>
          </View>
        </View>

        {/* Session Paused Overlay */}
        <AnimatePresence>
          {isGlobalPaused && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] items-center justify-center p-6"
              style={{ backgroundColor: "rgba(10, 10, 10, 0.95)" }}
            >
              <MotiView
                from={{ scale: 0.9, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 400 }}
                className="items-center w-full"
              >
                <View className="w-24 h-24 rounded-full bg-amber-500/10 items-center justify-center mb-6 border border-amber-500/20">
                  <Coffee size={48} color="#f59e0b" />
                </View>

                <Text className="text-white text-3xl font-bold text-center mb-4">
                  Kitchen Break
                </Text>

                <Text className="text-neutral-400 text-lg text-center leading-relaxed mb-10 px-4">
                  "No stress. I’ve caught your place."{"\n"}
                  All timers and background guides are paused while you handle real life.
                </Text>

                <Pressable
                  onPress={toggleGlobalPause}
                  className="bg-amber-500 h-16 rounded-2xl px-12 flex-row items-center justify-center active:bg-amber-600 w-full"
                  onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <Play size={24} color="#000000" fill="#000000" className="mr-3" />
                  <Text className="text-black text-xl font-bold">Resume Cooking</Text>
                </Pressable>
              </MotiView>
            </MotiView>
          )}
        </AnimatePresence>
      </SafeAreaView>

      {/* Modals */}
      {/* Exit Confirmation Overlay */}
      {showExitConfirm && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: 'rgba(0,0,0,0.7)' }]}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Exit Cooking Mode?</Text>
              <Text style={styles.modalText}>
                Are you sure you want to leave? Your progress will be saved.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowExitConfirm(false)}
                  style={[styles.modalButton, styles.modalButtonCancel]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmExit}
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                >
                  <Text style={styles.modalButtonConfirmText}>Exit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Glossary Overlay */}
      {glossaryTerm !== null && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[StyleSheet.absoluteFill, { zIndex: 101, backgroundColor: 'rgba(0,0,0,0.7)' }]}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {glossaryTerm &&
                  glossaryTerm.charAt(0).toUpperCase() + glossaryTerm.slice(1)}
              </Text>
              <Text style={styles.modalText}>
                {glossaryTerm && glossaryTerms[glossaryTerm]}
              </Text>
              <Pressable
                onPress={() => setGlossaryTerm(null)}
                style={[styles.modalButton, styles.modalButtonConfirm]}
              >
                <Text style={styles.modalButtonConfirmText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Ingredients Checklist Overlay */}
      {showIngredientsModal && (
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[StyleSheet.absoluteFill, { zIndex: 102 }]}
        >
          <SafeAreaView
            className="flex-1 bg-neutral-950"
            edges={["top", "bottom"]}
          >
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-800">
                <Text className="text-white text-xl font-bold">Ingredients</Text>
                <Pressable
                  onPress={() => setShowIngredientsModal(false)}
                  className="px-4 py-2"
                >
                  <Text className="text-amber-500 font-semibold">Done</Text>
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView className="flex-1 px-4 py-4">
                {/* Needed Now Section */}
                {currentStep?.ingredients &&
                  currentStep.ingredients.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-amber-400 text-sm font-medium uppercase tracking-wide mb-3">
                        Needed Now
                      </Text>
                      {currentStep.ingredients
                        .filter((ing) => {
                          if (!ing || !ing.name) return false;
                          return !isInstructionLike(ing.name);
                        })
                        .map((ingredient, index) => {
                          const scaleFactor =
                            originalServings > 0
                              ? currentServings / originalServings
                              : 1;
                          const scaledQuantity =
                            ingredient.quantity !== null
                              ? ingredient.quantity * scaleFactor
                              : null;
                          const ingredientId = `ing-${ingredient.name
                            .toLowerCase()
                            .replace(/\s+/g, "-")}-${scaledQuantity || ingredient.unit || ""
                            }`;
                          const isUsed = usedIngredientIds.includes(ingredientId);

                          return (
                            <Pressable
                              key={`ing-now-${index}`}
                              onPress={() => toggleIngredient(ingredientId)}
                              className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${isUsed ? "bg-green-500/10" : "bg-neutral-800/50"
                                }`}
                            >
                              <View
                                className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${isUsed
                                    ? "bg-green-500 border-green-500"
                                    : "border-neutral-600"
                                  }`}
                              >
                                {isUsed && (
                                  <CheckCircle2 size={16} color="#ffffff" />
                                )}
                              </View>
                              <View className="flex-1">
                                <Text
                                  className={`${isUsed
                                      ? "text-neutral-500 line-through"
                                      : "text-white"
                                    } text-base`}
                                >
                                  {ingredient.name}
                                </Text>
                                <Text className="text-neutral-400 text-sm">
                                  {scaledQuantity
                                    ? `${formatQuantity(scaledQuantity)}${ingredient.unit
                                      ? ` ${ingredient.unit}`
                                      : ""
                                    }`
                                    : ingredient.unit || ""}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                    </View>
                  )}

                {/* Other Ingredients Section */}
                {recipeData?.ingredients && recipeData.ingredients.length > 0 && (
                  <View>
                    <Text className="text-neutral-500 text-sm font-medium uppercase tracking-wide mb-3">
                      Other Ingredients
                    </Text>
                    {recipeData.ingredients.map((ingredient, index) => {
                      const ingredientId = `ing-${ingredient
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`;
                      const isUsed = usedIngredientIds.includes(ingredientId);

                      return (
                        <Pressable
                          key={`ing-other-${index}`}
                          onPress={() => toggleIngredient(ingredientId)}
                          className={`flex-row items-center px-4 py-3 rounded-xl mb-2 ${isUsed ? "bg-green-500/10" : "bg-neutral-800/50"
                            }`}
                        >
                          <View
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${isUsed
                                ? "bg-green-500 border-green-500"
                                : "border-neutral-600"
                              }`}
                          >
                            {isUsed && <CheckCircle2 size={16} color="#ffffff" />}
                          </View>
                          <Text
                            className={`flex-1 ${isUsed
                                ? "text-neutral-500 line-through"
                                : "text-white"
                              } text-base`}
                          >
                            {ingredient}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Timers Overlay */}
      {showTimersModal && (
        <Animated.View
          entering={SlideInDown}
          exiting={SlideOutDown}
          style={[StyleSheet.absoluteFill, { zIndex: 103 }]}
        >
          <SafeAreaView
            className="flex-1 bg-neutral-950"
            edges={["top", "bottom"]}
          >
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-neutral-800">
                <Text className="text-white text-xl font-bold">Timers</Text>
                <Pressable
                  onPress={() => setShowTimersModal(false)}
                  className="px-4 py-2"
                >
                  <Text className="text-amber-500 font-semibold">Done</Text>
                </Pressable>
              </View>

              {/* Content */}
              <ScrollView className="flex-1 px-4 py-4">
                {timers.length === 0 ? (
                  <View className="items-center justify-center py-12">
                    <Timer size={48} color="#6b7280" />
                    <Text className="text-neutral-400 text-base mt-4">
                      No active timers
                    </Text>
                  </View>
                ) : (
                  timers.map((timer) => {
                    const isRunning = timer.isRunning && !timer.isComplete;
                    const isComplete = timer.isComplete;
                    const progress =
                      timer.totalSeconds > 0
                        ? (timer.remainingSeconds / timer.totalSeconds) * 100
                        : 0;

                    return (
                      <View
                        key={timer.id}
                        className={`rounded-2xl p-4 mb-4 border ${isComplete
                            ? "bg-green-500/10 border-green-500/30"
                            : isRunning
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-neutral-800/50 border-neutral-700/50"
                          }`}
                      >
                        {/* Timer Label */}
                        <View className="flex-row items-center mb-4">
                          <Bell
                            size={20}
                            color={
                              isComplete
                                ? "#22c55e"
                                : isRunning
                                  ? "#f59e0b"
                                  : "#9ca3af"
                            }
                            className="mr-2"
                          />
                          <Text
                            className={`text-base font-semibold ${isComplete
                                ? "text-green-400"
                                : isRunning
                                  ? "text-amber-400"
                                  : "text-white"
                              }`}
                          >
                            {timer.label}
                          </Text>
                        </View>

                        {/* Timer Display */}
                        <Text
                          className={`text-4xl font-mono font-bold text-center mb-4 ${isComplete
                              ? "text-green-400"
                              : isRunning
                                ? "text-amber-400"
                                : "text-white"
                            }`}
                        >
                          {formatTime(timer.remainingSeconds)}
                        </Text>

                        {/* Progress Bar */}
                        <View className="h-1.5 bg-neutral-700 rounded-full overflow-hidden mb-4">
                          <View
                            className={`h-full rounded-full ${isComplete
                                ? "bg-green-500"
                                : isRunning
                                  ? "bg-amber-500"
                                  : "bg-neutral-600"
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </View>

                        {/* Control Buttons */}
                        <View className="flex-row items-center justify-center gap-4">
                          {!isComplete && (
                            <>
                              <Pressable
                                onPress={() => {
                                  if (isRunning) {
                                    pauseStoreTimer(timer.id);
                                  } else {
                                    startStoreTimer(timer.id);
                                  }
                                }}
                                className={`w-16 h-16 rounded-full items-center justify-center ${isRunning ? "bg-amber-500" : "bg-white"
                                  }`}
                              >
                                {isRunning ? (
                                  <Pause size={24} color="#000000" />
                                ) : (
                                  <Play size={24} color="#000000" />
                                )}
                              </Pressable>
                              <Pressable
                                onPress={() => resetStoreTimer(timer.id)}
                                className="w-12 h-12 bg-neutral-700/50 rounded-full items-center justify-center"
                              >
                                <RotateCcw size={20} color="#ffffff" />
                              </Pressable>
                            </>
                          )}
                          {isComplete && (
                            <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center">
                              <Bell size={24} color="#22c55e" />
                            </View>
                          )}
                          <Pressable
                            onPress={() => removeTimer(timer.id)}
                            className="w-12 h-12 bg-red-500/20 rounded-full items-center justify-center"
                          >
                            <X size={20} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Completion Overlay */}
      {showCompletionScreen && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[StyleSheet.absoluteFill, { zIndex: 104 }]}
        >
          <View className="flex-1 bg-black/95 items-center justify-center">
            {/* Confetti Effect */}
            <View className="absolute inset-0 z-0" pointerEvents="none">
              <ConfettiCannon
                count={200}
                origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
                fadeOut={true}
                autoStart={true}
              />
            </View>

            <ScrollView
              className="flex-1 w-full z-10"
              contentContainerStyle={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
              }}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                entering={FadeInUp.delay(300).duration(800)}
                className="items-center w-full px-6"
              >
                {/* Success Icon */}
                <View className="w-40 h-40 rounded-full bg-amber-500/20 items-center justify-center mb-8 border border-amber-500/30">
                  <View className="w-32 h-32 rounded-full bg-amber-500/40 items-center justify-center shadow-2xl shadow-amber-500/50">
                    <ChefHat size={64} color="#f59e0b" />
                  </View>
                </View>

                {/* Title */}
                <Text className="text-5xl font-black text-white mb-2 text-center tracking-tight">
                  Bon Appétit!
                </Text>

                {/* Success Message */}
                <Text className="text-xl text-neutral-400 mb-8 text-center font-medium">
                  You've mastered this recipe! 🥂
                </Text>

                {/* Cooked Details Card */}
                <View className="w-full bg-neutral-900/80 border border-neutral-800 rounded-[40px] p-8 mb-10 shadow-2xl">
                  <Text className="text-amber-500 text-xs font-bold uppercase tracking-[4px] mb-4 text-center">
                    Cooked Details
                  </Text>
                  <Text className="text-2xl font-bold text-white mb-8 text-center">
                    {recipeData?.name || "Delicious Meal"}
                  </Text>

                  <View className="flex-row justify-between items-center px-2">
                    <View className="items-center flex-1">
                      <View className="w-12 h-12 bg-neutral-800 rounded-2xl items-center justify-center mb-3">
                        <ListChecks size={24} color="#9ca3af" />
                      </View>
                      <Text className="text-2xl font-bold text-white">
                        {processedInstructions.length}
                      </Text>
                      <Text className="text-neutral-500 text-xs font-semibold uppercase">Steps</Text>
                    </View>

                    <View className="w-[1px] h-12 bg-neutral-800 mx-4" />

                    <View className="items-center flex-1">
                      <View className="w-12 h-12 bg-neutral-800 rounded-2xl items-center justify-center mb-3">
                        <Clock size={24} color="#9ca3af" />
                      </View>
                      <Text className="text-2xl font-bold text-white">
                        {totalTimeMinutes}
                      </Text>
                      <Text className="text-neutral-500 text-xs font-semibold uppercase">Minutes</Text>
                    </View>

                    <View className="w-[1px] h-12 bg-neutral-800 mx-4" />

                    <View className="items-center flex-1">
                      <View className="w-12 h-12 bg-neutral-800 rounded-2xl items-center justify-center mb-3">
                        <Utensils size={24} color="#9ca3af" />
                      </View>
                      <Text className="text-2xl font-bold text-white">
                        {recipeData?.ingredients?.length || 0}
                      </Text>
                      <Text className="text-neutral-500 text-xs font-semibold uppercase">Items</Text>
                    </View>
                  </View>
                </View>

                {/* Buttons */}
                <View className="w-full gap-4">
                  <Pressable
                    onPress={() => {
                      setShowCompletionScreen(false);
                      router.replace("/(tabs)");
                    }}
                    className="w-full h-16 bg-amber-500 rounded-3xl items-center justify-center shadow-xl shadow-amber-500/20 active:opacity-90"
                  >
                    <Text className="text-black font-black text-lg uppercase tracking-wider">
                      🏠 Back Home
                    </Text>
                  </Pressable>

                  <View className="flex-row gap-4">
                    <Pressable
                      onPress={() => {
                        setShowCompletionScreen(false);
                        router.replace("/(tabs)/saved");
                      }}
                      className="flex-1 h-14 bg-neutral-800 rounded-3xl items-center justify-center border border-neutral-700 active:bg-neutral-700"
                    >
                      <Text className="text-white font-bold">📖 Cookbook</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        resetSession();
                        router.replace({
                          pathname: "/ingredients-needed",
                          params: { recipe: JSON.stringify(recipeData) }
                        });
                      }}
                      className="flex-1 h-14 bg-neutral-900 rounded-3xl items-center justify-center border border-neutral-800 active:bg-neutral-800"
                    >
                      <Text className="text-neutral-400 font-bold">🔄 Start Over</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  recipeSummarySection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  recipeSummaryContent: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  recipeImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#e9ecef",
    flexShrink: 0,
  },
  recipeImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#f6f8fa",
    borderWidth: 1.5,
    borderColor: "#e1e4e8",
    borderStyle: "dashed",
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: "#656d76",
    fontWeight: "600",
    textAlign: "center",
  },
  recipeDetails: {
    flex: 1,
    justifyContent: "center",
  },
  recipeNameHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0d1117",
    marginBottom: 6,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  recipeDescription: {
    fontSize: 13,
    color: "#656d76",
    marginBottom: 10,
    lineHeight: 20,
    fontWeight: "400",
  },
  timeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f8fa",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  timeText: {
    fontSize: 12,
    color: "#24292f",
    fontWeight: "600",
  },
  originalInstructionsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  originalInstructionsHeaderPressable: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f6f8fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  originalInstructionsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalInstructionsTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0d1117",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  originalInstructionsSubtitle: {
    fontSize: 14,
    color: "#656d76",
    fontWeight: "600",
  },
  originalInstructionsContent: {
    padding: 18,
  },
  originalInstructionItem: {
    flexDirection: "row",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  originalInstructionNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#0879a3",
    flexShrink: 0,
  },
  originalInstructionNumber: {
    fontWeight: "800",
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  originalInstructionText: {
    flex: 1,
    fontSize: 16,
    color: "#24292f",
    lineHeight: 24,
    fontWeight: "500",
  },
  progressBarWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  progressTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0d1117",
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  progressSubtitle: {
    fontSize: 15,
    color: "#656d76",
    fontWeight: "600",
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  progressPercentage: {
    fontSize: 16,
    color: "#0a7ea4",
    textAlign: "right",
    marginTop: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stepProgressWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  timerText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0879a3",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 16,
    letterSpacing: 0.5,
    backgroundColor: "#e0f4f8",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0a7ea4",
  },
  timerButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  pauseButton: {
    backgroundColor: "#ffc107",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    flex: 1,
    shadowColor: "#ffc107",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#ffb300",
  },
  completeButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
    flex: 1,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#218838",
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  stepHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    gap: 12,
  },
  stepNumberBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0879a3",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  stepNumberText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  stepCounter: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    color: "#0d1117",
    letterSpacing: 0.8,
    backgroundColor: "#f6f8fa",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    borderStyle: "solid",
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 28,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  animationPlaceholder: {
    width: 220,
    height: 220,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
  },
  instructionCard: {
    alignSelf: "stretch",
    backgroundColor: "#f6f8fa",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionHeader: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#0879a3",
  },
  instructionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  instructionText: {
    fontSize: 23,
    textAlign: "left",
    fontWeight: "700",
    marginBottom: 0,
    color: "#0d1117",
    lineHeight: 34,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#fff",
  },
  ingredientsContainer: {
    alignSelf: "stretch",
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#e1e4e8",
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f4f8",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#0a7ea4",
    gap: 10,
  },
  ingredientsIcon: {
    fontSize: 22,
  },
  ingredientsTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0879a3",
    letterSpacing: 0.5,
  },
  ingredientsList: {
    padding: 20,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0a7ea4",
    marginTop: 8,
    marginRight: 14,
    flexShrink: 0,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0d1117",
    marginBottom: 4,
    lineHeight: 24,
  },
  ingredientPrepText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#656d76",
    fontStyle: "italic",
  },
  ingredientQuantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a7ea4",
    marginTop: 2,
  },
  ingredient: {
    fontSize: 16,
    lineHeight: 26,
    color: "#24292f",
    marginBottom: 8,
    fontWeight: "500",
    paddingLeft: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 24,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    gap: 14,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  button: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flex: 1,
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#0879a3",
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#dee2e6",
    shadowOpacity: 0,
    elevation: 0,
    borderColor: "#adb5bd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  errorSubtext: {
    color: "#e1e4e8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e1e4e8",
  },
  checklistSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  checklistHeaderPressable: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f6f8fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },
  checklistHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBackground: {
    padding: 12,
    backgroundColor: "#e0f4f8",
    borderRadius: 12,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  iconText: {
    fontSize: 22,
  },
  checklistTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0d1117",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  checklistSubtitle: {
    fontSize: 14,
    color: "#656d76",
    fontWeight: "600",
  },
  checklistHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  allGatheredTag: {
    backgroundColor: "#d1e7dd",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2,
    borderColor: "#28a745",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  allGatheredText: {
    color: "#0f5132",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  chevronIcon: {
    fontSize: 18,
    color: "#666",
  },
  chevronIconExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  checklistContent: {
    padding: 18,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#fafbfc",
  },
  ingredientItemChecked: {
    backgroundColor: "#f6f8fa",
    opacity: 0.75,
    borderBottomColor: "#d0d7de",
  },
  ingredientItemNeeded: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: "#ffd700",
    borderRightWidth: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#ced4da",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#28a745",
    borderColor: "#218838",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  ingredientDetails: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 17,
    color: "#0d1117",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  ingredientNameChecked: {
    textDecorationLine: "line-through",
    color: "#656d76",
    opacity: 0.6,
  },
  ingredientPreparation: {
    fontSize: 14,
    color: "#656d76",
    marginTop: 3,
    fontStyle: "italic",
    fontWeight: "500",
  },
  ingredientQuantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  ingredientQuantity: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0a7ea4",
    letterSpacing: 0.3,
  },
  ingredientQuantityChecked: {
    color: "#656d76",
    opacity: 0.6,
  },
  ingredientUnit: {
    fontSize: 14,
    color: "#656d76",
    marginLeft: 5,
    fontWeight: "600",
  },
  ingredientUnitChecked: {
    color: "#656d76",
    opacity: 0.6,
  },
  neededNowTag: {
    backgroundColor: "#fff3cd",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginLeft: 14,
    borderWidth: 2,
    borderColor: "#ffc107",
    shadowColor: "#ffc107",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  neededNowText: {
    color: "#856404",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  servingSizeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  servingSizeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  servingSizeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  servingSizeTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0d1117",
    letterSpacing: 0.3,
  },
  servingSizeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  servingButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#dee2e6",
    backgroundColor: "#f8f9fa",
    minWidth: 55,
  },
  servingButtonActive: {
    borderColor: "#0a7ea4",
    backgroundColor: "#e0f4f8",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  servingButtonText: {
    color: "#495057",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  servingButtonTextActive: {
    color: "#0a7ea4",
    fontWeight: "700",
  },
  servingsDisplayContainer: {
    flex: 1,
    minWidth: "100%",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    alignItems: "center",
  },
  currentServingsText: {
    fontSize: 16,
    color: "#0a7ea4",
    fontWeight: "700",
  },
  stepsListContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stepsListTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  stepListItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  stepListItemActive: {
    borderColor: "#0a7ea4",
    backgroundColor: "#e0f4f8",
  },
  stepListItemCompleted: {
    borderColor: "#28a745",
    backgroundColor: "#d4edda",
  },
  stepListItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNumberActive: {
    backgroundColor: "#0a7ea4",
  },
  stepNumberCompleted: {
    backgroundColor: "#28a745",
  },
  stepListItemNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  stepNumberTextActive: {
    color: "#fff",
  },
  stepNumberCheck: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  stepListItemText: {
    flex: 1,
  },
  stepListItemAction: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  stepListItemActionActive: {
    color: "#0a7ea4",
    fontWeight: "bold",
  },
  stepListItemActionCompleted: {
    color: "#155724",
  },
  stepListItemIngredients: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  stepListItemTimer: {
    fontSize: 12,
    color: "#666",
    flexShrink: 0,
  },
  detailsContainer: {
    alignSelf: "stretch",
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#e0f4f8",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0a7ea4",
    flex: 1,
    gap: 10,
  },
  detailIcon: {
    fontSize: 22,
  },
  detailText: {
    fontSize: 17,
    color: "#0879a3",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  notesContainer: {
    alignSelf: "stretch",
    padding: 0,
    backgroundColor: "#fff",
    borderRadius: 18,
    marginTop: 0,
    borderWidth: 2,
    borderColor: "#ffd700",
    overflow: "hidden",
    shadowColor: "#ffc107",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#ffc107",
    gap: 10,
  },
  notesIcon: {
    fontSize: 22,
  },
  notesTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#856404",
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 17,
    color: "#856404",
    lineHeight: 26,
    fontWeight: "600",
    padding: 20,
    backgroundColor: "#fffbf0",
  },
  temperatureContainer: {
    alignSelf: "stretch",
    padding: 18,
    backgroundColor: "#e0f4f8",
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    shadowColor: "#0a7ea4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  temperatureText: {
    fontSize: 17,
    color: "#0879a3",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  keepAwakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f8fa",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  keepAwakeButtonActive: {
    backgroundColor: "#e7f3ff",
    borderColor: "#0a7ea4",
  },
  keepAwakeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  keepAwakeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#656d76",
  },
  keepAwakeTextActive: {
    color: "#0a7ea4",
  },
  keepAwakeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaed",
  },
  keepAwakeButtonCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f6f8fa",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    justifyContent: "center",
    alignItems: "center",
  },
  progressCompact: {
    flex: 1,
    marginLeft: 12,
    alignItems: "flex-end",
  },
  progressTextCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0a7ea4",
    marginBottom: 4,
  },
  progressBarCompact: {
    width: "100%",
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    backgroundColor: "#0a7ea4",
    borderRadius: 3,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: "flex-start",
  },
  stepNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  stepCounterCompact: {
    fontSize: 18,
    fontWeight: "700",
    color: "#656d76",
  },
  timerCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e0f4f8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#0a7ea4",
  },
  timerTextCompact: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0879a3",
    letterSpacing: 1,
  },
  timerButtonsCompact: {
    flexDirection: "row",
    gap: 8,
  },
  timerButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
  },
  timerButtonTextSmall: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  mainInstruction: {
    backgroundColor: "#f6f8fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#0a7ea4",
    minHeight: 120,
    justifyContent: "center",
  },
  mainInstructionText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0d1117",
    lineHeight: 32,
    textAlign: "center",
  },
  currentIngredientsCompact: {
    marginBottom: 12,
  },
  ingCompact: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  ingCompactText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#24292f",
  },
  detailsCompact: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  detailCompactText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0879a3",
    backgroundColor: "#e0f4f8",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  notesCompact: {
    backgroundColor: "#fff3cd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffc107",
    marginBottom: 12,
  },
  notesCompactText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    lineHeight: 20,
  },
  // New Cooking Mode Styles
  cookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exitButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 22,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  recipeTitleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  stepCounterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e1e4e8",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  muteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  muteButtonText: {
    fontSize: 18,
  },
  pauseCookingButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonActive: {
    backgroundColor: "#ffa500",
    borderColor: "#ff8c00",
  },
  cookingProgressBarContainer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
  },
  instructionArea: {
    flex: 1,
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    justifyContent: "flex-start",
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  safetyNotice: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ffc107",
  },
  safetyNoticeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#856404",
    textAlign: "center",
  },
  bigInstructionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#ffa500",
    flexShrink: 1,
    justifyContent: "center",
  },
  bigInstructionText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 32,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  glossaryButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffa500",
  },
  glossaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffa500",
    textAlign: "center",
  },
  visualArea: {
    height: 150,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  actionImageContainer: {
    height: 150,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  actionImage: {
    width: 150,
    height: 150,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  timerSection: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ffa500",
  },
  startTimerButton: {
    backgroundColor: "#ffa500",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  startTimerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  timerDisplay: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffa500",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 6,
  },
  timerControlButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444444",
  },
  timerControlText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  inlineIngredients: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  inlineIngredientsLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#24292f",
    marginBottom: 8,
  },
  inlineIngredient: {
    fontSize: 15,
    fontWeight: "600",
    color: "#24292f",
    marginBottom: 6,
    paddingLeft: 8,
  },
  metadataSection: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e1e4e8",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactMetadataSection: {
    gap: 8,
    marginBottom: 12,
  },
  compactTemperatureBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#c82333",
  },
  compactTemperatureText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  compactCautionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ff9800",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#f57c00",
  },
  compactCautionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  compactNotesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#2196f3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#1976d2",
  },
  compactNotesText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 16,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  compactIngredientsBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#d1e7dd",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#28a745",
  },
  compactIngredientsList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  compactIngredientItem: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f5132",
    lineHeight: 14,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  compactEquipmentBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#cfe2ff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  compactEquipmentList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  compactEquipmentItem: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0879a3",
    lineHeight: 14,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  metadataRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  temperatureCard: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffc107",
    alignItems: "center",
  },
  temperatureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  temperatureLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#856404",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  temperatureValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#856404",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  temperatureValueCompact: {
    fontSize: 16,
    fontWeight: "700",
    color: "#856404",
  },
  enhancedIngredientsContainer: {
    backgroundColor: "#d1e7dd",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28a745",
  },
  enhancedEquipmentContainer: {
    backgroundColor: "#cfe2ff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  enhancedNotesContainer: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  enhancedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  enhancedSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#24292f",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  enhancedList: {
    gap: 6,
  },
  enhancedListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: 2,
  },
  listItemIcon: {
    marginTop: 2,
  },
  enhancedItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#24292f",
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  enhancedNotesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#856404",
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  compactIngredientsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#d1e7dd",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28a745",
    gap: 6,
    minWidth: 120,
  },
  compactEquipmentContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#cfe2ff",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0a7ea4",
    gap: 6,
    minWidth: 120,
  },
  compactNotesContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffc107",
    gap: 6,
    minWidth: 120,
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    marginRight: 4,
  },
  ingredientsLabel: {
    color: "#0f5132",
  },
  equipmentLabel: {
    color: "#0879a3",
  },
  notesLabel: {
    color: "#856404",
  },
  compactList: {
    flex: 1,
    gap: 4,
  },
  compactItem: {
    fontSize: 13,
    fontWeight: "600",
    color: "#24292f",
    lineHeight: 18,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  moreIndicator: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8b949e",
    fontStyle: "italic",
    marginLeft: 4,
  },
  swipeIndicator: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#f6f8fa",
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
    alignItems: "center",
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#656d76",
    textAlign: "center",
  },
  navigationButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333333",
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#1a1a1a",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  navButtonTextDisabled: {
    color: "#666666",
  },
  navButtonNext: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffa500",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff8c00",
    gap: 6,
  },
  navButtonNextText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  pausedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  pausedContent: {
    alignItems: "center",
  },
  pausedText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },
  pausedSubtext: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  modalText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e1e4e8",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444444",
  },
  modalButtonConfirm: {
    backgroundColor: "#ffa500",
    borderWidth: 1,
    borderColor: "#ff8c00",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: Platform.select({
      ios: "System",
      android: "Roboto",
      default: "System",
    }),
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  noteInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    color: "#24292f",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    textAlignVertical: "top",
    marginBottom: 24,
  },
});
