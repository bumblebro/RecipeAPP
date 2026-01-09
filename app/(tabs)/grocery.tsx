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
  ShoppingCart,
  Plus,
  Trash2,
  X,
  Check,
} from "lucide-react-native";
import { cn } from "../../lib/cn";
import { useGroceryStore } from "../../stores/useGroceryStore";

export default function GroceryScreen() {
  const insets = useSafeAreaInsets();
  const {
    lists,
    createList,
    deleteList,
    addItem,
    removeItem,
    toggleItem,
    clearCheckedItems,
    getListItems,
    getCheckedCount,
  } = useGroceryStore();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");

  const selectedList = lists.find((l) => l.id === selectedListId);
  const selectedItems = selectedListId ? getListItems(selectedListId) : [];
  const checkedCount = selectedListId ? getCheckedCount(selectedListId) : 0;

  const handleSelectList = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedListId(id);
    },
    []
  );

  const handleCreateList = useCallback(() => {
    if (!newListName.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createList(newListName.trim());
    setNewListName("");
    setShowNewListModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newListName, createList]);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim() || !selectedListId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(
      selectedListId,
      newItemName.trim(),
      newItemQuantity.trim() || undefined
    );
    setNewItemName("");
    setNewItemQuantity("");
    setShowAddItemModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [newItemName, newItemQuantity, selectedListId, addItem]);

  const handleToggleItem = useCallback(
    (itemId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleItem(itemId);
    },
    [toggleItem]
  );

  const handleClearChecked = useCallback(() => {
    if (checkedCount === 0 || !selectedListId) return;

    Alert.alert(
      "Clear Checked Items",
      `Remove ${checkedCount} checked item${checkedCount > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            clearCheckedItems(selectedListId);
          },
        },
      ]
    );
  }, [checkedCount, selectedListId, clearCheckedItems]);

  const handleDeleteList = useCallback(
    (id: string) => {
      const list = lists.find((l) => l.id === id);
      Alert.alert(
        "Delete List",
        `Are you sure you want to delete "${list?.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              deleteList(id);
              if (selectedListId === id) {
                setSelectedListId(null);
              }
            },
          },
        ]
      );
    },
    [lists, selectedListId, deleteList]
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
              <ShoppingCart size={28} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-white">Grocery Lists</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowNewListModal(true);
            }}
            className="bg-amber-500 rounded-lg p-2"
          >
            <Plus size={20} color="#000000" />
          </Pressable>
        </View>

        <Text className="text-neutral-400 text-sm px-5 mb-4">
          {lists.length} lists
        </Text>

        {/* Split Panel Layout */}
        <View className="flex-1 flex-row">
          {/* Left Panel - Lists */}
          <View className="w-1/2 border-r border-neutral-800">
            <ScrollView className="flex-1">
              {lists.map((list, index) => (
                <Pressable
                  key={list.id}
                  onPress={() => handleSelectList(list.id)}
                  className={cn(
                    "mx-3 mt-2 rounded-lg p-4 border-l-4",
                    selectedListId === list.id
                      ? "bg-blue-500/20 border-blue-500"
                      : "bg-neutral-800/50 border-neutral-700"
                  )}
                >
                  <Animated.View
                    entering={FadeInUp.delay(index * 50).duration(300)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-base mb-1">
                          {list.name}
                        </Text>
                        <Text className="text-neutral-400 text-xs">
                          {getListItems(list.id).length} items
                        </Text>
                      </View>
                      {selectedListId === list.id && (
                        <Pressable
                          onPress={() => handleDeleteList(list.id)}
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

          {/* Right Panel - Items */}
          <View className="w-1/2 bg-neutral-900/50">
            {!selectedListId ? (
              <View className="flex-1 items-center justify-center px-5">
                <ShoppingCart size={48} color="#4b5563" />
                <Text className="text-neutral-400 text-center mt-4">
                  Select a list to view items
                </Text>
              </View>
            ) : (
              <View className="flex-1">
                {/* Header Bar */}
                <View className="px-4 py-3 border-b border-neutral-800">
                  <Text className="text-white font-semibold text-lg mb-1">
                    {selectedList?.name}
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    {checkedCount} of {selectedItems.length} items checked
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2 px-4 py-3 border-b border-neutral-800">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowAddItemModal(true);
                    }}
                    className="flex-1 bg-amber-500 rounded-lg py-3 items-center"
                  >
                    <Text className="text-black font-semibold">+ Item</Text>
                  </Pressable>
                  {checkedCount > 0 && (
                    <Pressable
                      onPress={handleClearChecked}
                      className="bg-neutral-800 rounded-lg py-3 px-4 items-center"
                    >
                      <Text className="text-white font-semibold text-sm">
                        Clear Checked
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Items List */}
                <FlatList
                  data={selectedItems}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item, index }) => (
                    <Animated.View
                      entering={FadeInUp.delay(index * 50).duration(300)}
                      className="flex-row items-center bg-neutral-800/50 rounded-lg p-3 mb-2"
                    >
                      {/* Checkbox */}
                      <Pressable
                        onPress={() => handleToggleItem(item.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 items-center justify-center mr-3",
                          item.checked
                            ? "bg-green-500 border-green-500"
                            : "border-neutral-600"
                        )}
                      >
                        {item.checked && <Check size={12} color="#ffffff" />}
                      </Pressable>

                      {/* Item Info */}
                      <View className="flex-1">
                        <Text
                          className={cn(
                            "text-white font-medium",
                            item.checked && "line-through text-neutral-500"
                          )}
                        >
                          {item.name}
                        </Text>
                        {item.quantity && (
                          <Text className="text-neutral-400 text-xs mt-0.5">
                            {item.quantity}
                          </Text>
                        )}
                      </View>

                      {/* Remove Button */}
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          if (selectedListId) {
                            removeItem(selectedListId, item.id);
                          }
                        }}
                        className="p-2"
                      >
                        <X size={18} color="#ef4444" />
                      </Pressable>
                    </Animated.View>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* New List Modal */}
      <Modal
        visible={showNewListModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewListModal(false)}
      >
        <View
          className="flex-1 bg-neutral-950"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">New List</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowNewListModal(false);
                setNewListName("");
              }}
              className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-6">
            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Weekly shopping..."
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base"
              autoFocus
            />

            <Pressable
              onPress={handleCreateList}
              disabled={!newListName.trim()}
              className={cn(
                "bg-amber-500 rounded-xl py-4 items-center justify-center mt-6",
                !newListName.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-base">
                Create List
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View
          className="flex-1 bg-neutral-950"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-neutral-800">
            <Text className="text-xl font-bold text-white">Add Item</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddItemModal(false);
                setNewItemName("");
                setNewItemQuantity("");
              }}
              className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center"
            >
              <X size={20} color="#9ca3af" />
            </Pressable>
          </View>

          <View className="flex-1 px-5 pt-6">
            <Text className="text-white font-semibold mb-2">Item Name</Text>
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Milk, eggs, bread..."
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base mb-4"
              autoFocus
            />

            <Text className="text-white font-semibold mb-2">
              Quantity (optional)
            </Text>
            <TextInput
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              placeholder="2 cups, 1 dozen..."
              placeholderTextColor="#737373"
              className="bg-neutral-800/50 rounded-xl px-4 py-4 text-white text-base mb-6"
            />

            <Pressable
              onPress={handleAddItem}
              disabled={!newItemName.trim()}
              className={cn(
                "bg-amber-500 rounded-xl py-4 items-center justify-center",
                !newItemName.trim() && "opacity-50"
              )}
            >
              <Text className="text-black font-bold text-base">Add Item</Text>
            </Pressable>

            {/* Add from Recipes Section */}
            <View className="mt-8">
              <Text className="text-neutral-400 text-sm mb-4">
                Or add from recipes
              </Text>
              {/* In a real app, this would show saved recipes */}
              <View className="bg-neutral-800/50 rounded-xl p-4">
                <Text className="text-neutral-400 text-sm text-center">
                  No saved recipes yet
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

