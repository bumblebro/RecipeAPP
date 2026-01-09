import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BookOpen,
  Plus,
  Trash2,
  ChefHat,
  X,
  Star,
} from "lucide-react-native";
import { cn } from "../../lib/cn";
import { useCookbookStore } from "../../stores/useCookbookStore";

export default function CookbookScreen() {
  const insets = useSafeAreaInsets();
  const {
    cookbooks,
    createCookbook,
    deleteCookbook,
    getCookbookRecipes,
    getFavoriteRecipes,
  } = useCookbookStore();

  const [selectedCookbookId, setSelectedCookbookId] = useState<string | null>(
    null
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCookbookName, setNewCookbookName] = useState("");

  const selectedCookbook = cookbooks.find((cb) => cb.id === selectedCookbookId);
  const selectedRecipes =
    selectedCookbookId === "favorites"
      ? getFavoriteRecipes()
      : selectedCookbookId
      ? getCookbookRecipes(selectedCookbookId)
      : [];

  const handleSelectCookbook = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedCookbookId(id);
    },
    []
  );

  const handleCreateCookbook = useCallback(() => {
    if (!newCookbookName.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createCookbook(newCookbookName.trim());
    setNewCookbookName("");
    setShowNewModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newCookbookName, createCookbook]);

  const handleDeleteCookbook = useCallback(
    (id: string) => {
      if (id === "favorites") {
        Alert.alert("Cannot Delete", "Favorites cookbook cannot be deleted.");
        return;
      }

      const cookbook = cookbooks.find((cb) => cb.id === id);
      Alert.alert(
        "Delete Cookbook",
        `Are you sure you want to delete "${cookbook?.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              deleteCookbook(id);
              if (selectedCookbookId === id) {
                setSelectedCookbookId(null);
              }
            },
          },
        ]
      );
    },
    [cookbooks, selectedCookbookId, deleteCookbook]
  );

  const totalRecipes = cookbooks.reduce(
    (sum, cb) => sum + (cb.id === "favorites" ? getFavoriteRecipes().length : getCookbookRecipes(cb.id).length),
    0
  );

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
              <BookOpen size={28} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-white">Cookbooks</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowNewModal(true);
            }}
            className="bg-amber-500 rounded-full px-4 py-2 flex-row items-center"
          >
            <View className="mr-1.5">
              <Plus size={18} color="#000000" />
            </View>
            <Text className="text-black font-semibold">New Cookbook</Text>
          </Pressable>
        </View>

        <Text className="text-neutral-400 text-sm px-5 mb-4">
          {cookbooks.length} cookbooks • {totalRecipes} recipes
        </Text>

        {/* Split Panel Layout */}
        <View className="flex-1 flex-row">
          {/* Left Panel - Cookbooks List */}
          <View className="w-1/2 border-r border-neutral-800">
            <ScrollView className="flex-1">
              {/* Favorites Card */}
              <Pressable
                onPress={() => handleSelectCookbook("favorites")}
                className={cn(
                  "mx-3 mt-2 rounded-lg p-4 border-l-4",
                  selectedCookbookId === "favorites"
                    ? "bg-amber-500/20 border-amber-500"
                    : "bg-neutral-800/50 border-neutral-700"
                )}
              >
                <Animated.View entering={FadeInUp.duration(300)}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-1">
                        ⭐ Favorites
                      </Text>
                      <Text className="text-neutral-400 text-xs">
                        {getFavoriteRecipes().length} recipes
                      </Text>
                    </View>
                    {selectedCookbookId === "favorites" && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          // Favorites cannot be deleted
                        }}
                        className="p-2"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                </Animated.View>
              </Pressable>

              {/* Other Cookbooks */}
              {cookbooks
                .filter((cb) => cb.id !== "favorites")
                .map((cookbook, index) => (
                  <Pressable
                    key={cookbook.id}
                    onPress={() => handleSelectCookbook(cookbook.id)}
                    className={cn(
                      "mx-3 mt-2 rounded-lg p-4 border-l-4",
                      selectedCookbookId === cookbook.id
                        ? "bg-amber-500/20 border-amber-500"
                        : "bg-neutral-800/50 border-neutral-700"
                    )}
                  >
                    <Animated.View
                      entering={FadeInUp.delay(index * 50).duration(300)}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-white font-semibold text-base mb-1">
                            {cookbook.name}
                          </Text>
                          <Text className="text-neutral-400 text-xs">
                            {getCookbookRecipes(cookbook.id).length} recipes
                          </Text>
                        </View>
                        {selectedCookbookId === cookbook.id && (
                          <Pressable
                            onPress={() => handleDeleteCookbook(cookbook.id)}
                            className="p-2"
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </Pressable>
                        )}
                      </View>
                    </Animated.View>
                  </Pressable>
                ))}
            </ScrollView>
          </View>

          {/* Right Panel - Recipes Display */}
          <View className="w-1/2 bg-neutral-900/50">
            {!selectedCookbookId ? (
              <View className="flex-1 items-center justify-center px-5">
                <ChefHat size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  Select a cookbook to view recipes
                </Text>
              </View>
            ) : selectedRecipes.length === 0 ? (
              <View className="flex-1 items-center justify-center px-5">
                <ChefHat size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  {selectedCookbookId === "favorites"
                    ? "No favorite recipes yet"
                    : "No recipes in this cookbook yet"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedRecipes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item, index }) => (
                  <Animated.View
                    entering={FadeInUp.delay(index * 50).duration(300)}
                    className="bg-neutral-800/50 rounded-xl p-4 mb-3 border border-neutral-700"
                  >
                    <Text className="text-white font-semibold text-base mb-2">
                      {item.title}
                    </Text>

                    {/* Star Rating */}
                    {item.rating && (
                      <View className="flex-row items-center mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            color={i < item.rating! ? "#fbbf24" : "#4b5563"}
                            fill={i < item.rating! ? "#fbbf24" : "transparent"}
                          />
                        ))}
                      </View>
                    )}

                    {/* Notes Preview */}
                    {item.notes && (
                      <Text className="text-neutral-400 text-xs mb-2">
                        {item.notes}
                      </Text>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {item.tags.map((tag) => (
                          <View
                            key={tag}
                            className="bg-amber-500/20 rounded-full px-2 py-1"
                          >
                            <Text className="text-amber-400 text-xs">{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Animated.View>
                )}
              />
            )}
          </View>
        </View>
      </View>

      {/* New Cookbook Modal */}
      <Modal
        visible={showNewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewModal(false)}
      >
        <View className="flex-1 bg-neutral-950" style={{ paddingTop: insets.top }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">New Cookbook</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNewModal(false);
                setNewCookbookName("");
              }}
              className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 px-5 pt-6">
            <TextInput
              value={newCookbookName}
              onChangeText={setNewCookbookName}
              placeholder="My favorite recipes..."
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base"
              autoFocus
            />

            <Pressable
              onPress={handleCreateCookbook}
              disabled={!newCookbookName.trim()}
              className={cn(
                "bg-amber-500 rounded-xl py-4 items-center justify-center mt-6",
                !newCookbookName.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-base">
                Create Cookbook
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

