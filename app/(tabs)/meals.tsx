import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Calendar, Plus, X } from "lucide-react-native";
import { cn } from "../../lib/cn";
import {
  useMealPlanStore,
  type MealType,
  DAYS,
} from "../../stores/useMealPlanStore";

const MEAL_TYPES: Array<{
  type: MealType;
  emoji: string;
  bg: string;
  border: string;
}> = [
  { type: "breakfast", emoji: "🍳", bg: "bg-orange-500/20", border: "border-orange-500" },
  { type: "lunch", emoji: "🍽️", bg: "bg-green-500/20", border: "border-green-500" },
  { type: "dinner", emoji: "🍲", bg: "bg-blue-500/20", border: "border-blue-500" },
  { type: "snack", emoji: "🍪", bg: "bg-purple-500/20", border: "border-purple-500" },
];

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const {
    plans,
    createPlan,
    deletePlan,
    getPlanMeals,
    getMealCount,
    getWeekStart,
  } = useMealPlanStore();

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedMeals = selectedPlanId ? getPlanMeals(selectedPlanId) : {};

  const handleCreatePlan = useCallback(() => {
    if (!newPlanName.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createPlan(newPlanName.trim(), getWeekStart());
    setNewPlanName("");
    setShowNewPlanModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newPlanName, createPlan, getWeekStart]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          backgroundColor: "#0a0a0a",
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            <View className="mr-3">
              <Calendar size={28} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-white">Meal Plans</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowNewPlanModal(true);
            }}
            className="bg-amber-500 rounded-lg p-2"
          >
            <Plus size={20} color="#000000" />
          </Pressable>
        </View>

        <Text className="text-neutral-400 text-sm px-5 mb-4">
          {plans.length} plans
        </Text>

        {!selectedPlanId ? (
          <ScrollView className="flex-1 px-5">
            {plans.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Calendar size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  Create a meal plan to get started
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-neutral-400 text-sm mb-4">
                  Select a meal plan
                </Text>
                {plans.map((plan, index) => (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlanId(plan.id);
                    }}
                    className="bg-neutral-800/50 rounded-lg p-4 mb-3 border border-neutral-700"
                  >
                    <Animated.View
                      entering={FadeInUp.delay(index * 50).duration(300)}
                    >
                      <Text className="text-white font-semibold text-base mb-1">
                        {plan.name}
                      </Text>
                      <Text className="text-neutral-400 text-sm">
                        {getMealCount(plan.id)} meals planned
                      </Text>
                    </Animated.View>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
        ) : (
          <View className="flex-1">
            {/* Plan Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
              <View>
                <Text className="text-2xl font-bold text-white">
                  {selectedPlan?.name}
                </Text>
                <Text className="text-neutral-400 text-sm mt-1">
                  {selectedPlanId ? getMealCount(selectedPlanId) : 0} meals planned
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlanId(null);
                }}
                className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
              >
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Weekly Grid */}
            <ScrollView className="flex-1 px-5 py-4">
              {DAYS.map((day, dayIndex) => {
                const dayMeals = selectedMeals[day] || [];

                return (
                  <Animated.View
                    key={day}
                    entering={FadeInUp.delay(dayIndex * 50).duration(300)}
                    className="mb-6"
                  >
                    <Text className="text-white font-semibold text-lg mb-3">
                      {day}
                    </Text>

                    {MEAL_TYPES.map((mealType) => {
                      const meal = dayMeals.find((m) => m.type === mealType.type);

                      return (
                        <Pressable
                          key={mealType.type}
                          className={cn(
                            "rounded-lg p-3 mb-2 border",
                            mealType.bg,
                            mealType.border
                          )}
                        >
                          <View className="flex-row items-center">
                            <Text className="text-lg mr-2">
                              {mealType.emoji}
                            </Text>
                            <Text className="text-white font-medium text-sm flex-1">
                              {mealType.type.charAt(0).toUpperCase() +
                                mealType.type.slice(1)}
                            </Text>
                            <Text
                              className={cn(
                                "text-sm",
                                meal?.recipeName
                                  ? "text-neutral-300"
                                  : "text-neutral-500"
                              )}
                            >
                              {meal?.recipeName || "Not planned"}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* New Plan Modal */}
      <Modal
        visible={showNewPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewPlanModal(false)}
      >
        <View
          className="flex-1 bg-neutral-950"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">New Meal Plan</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNewPlanModal(false);
                setNewPlanName("");
              }}
              className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-6">
            <TextInput
              value={newPlanName}
              onChangeText={setNewPlanName}
              placeholder="This week's meals..."
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base"
              autoFocus
            />

            <Text className="text-neutral-400 text-sm mt-4 mb-6">
              Plans are organized by week starting Monday
            </Text>

            <Pressable
              onPress={handleCreatePlan}
              disabled={!newPlanName.trim()}
              className={cn(
                "bg-amber-500 rounded-xl py-4 items-center justify-center",
                !newPlanName.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-base">Create Plan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

