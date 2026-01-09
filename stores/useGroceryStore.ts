import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
  createdAt: number;
}

export interface GroceryList {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: number;
}

interface GroceryState {
  lists: GroceryList[];
  items: Record<string, GroceryItem>; // itemId -> item data

  // Actions
  createList: (name: string) => string;
  deleteList: (id: string) => void;
  addItem: (listId: string, name: string, quantity?: string) => string;
  removeItem: (listId: string, itemId: string) => void;
  toggleItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<GroceryItem>) => void;
  clearCheckedItems: (listId: string) => void;
  getListItems: (listId: string) => GroceryItem[];
  getCheckedCount: (listId: string) => number;
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set, get) => ({
      lists: [],
      items: {},

      createList: (name: string) => {
        const newList: GroceryList = {
          id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          itemIds: [],
          createdAt: Date.now(),
        };
        set((state) => ({
          lists: [...state.lists, newList],
        }));
        return newList.id;
      },

      deleteList: (id: string) => {
        const state = get();
        // Remove all items in the list
        const list = state.lists.find((l) => l.id === id);
        if (list) {
          const newItems = { ...state.items };
          list.itemIds.forEach((itemId) => {
            delete newItems[itemId];
          });
          set({ items: newItems });
        }

        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
        }));
      },

      addItem: (listId: string, name: string, quantity?: string) => {
        const newItem: GroceryItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          quantity,
          checked: false,
          createdAt: Date.now(),
        };

        set((state) => ({
          items: { ...state.items, [newItem.id]: newItem },
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, itemIds: [...list.itemIds, newItem.id] }
              : list
          ),
        }));

        return newItem.id;
      },

      removeItem: (listId: string, itemId: string) => {
        const state = get();
        const newItems = { ...state.items };
        delete newItems[itemId];

        set({
          items: newItems,
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, itemIds: list.itemIds.filter((id) => id !== itemId) }
              : list
          ),
        });
      },

      toggleItem: (itemId: string) => {
        set((state) => ({
          items: {
            ...state.items,
            [itemId]: {
              ...state.items[itemId],
              checked: !state.items[itemId]?.checked,
            },
          },
        }));
      },

      updateItem: (itemId: string, updates: Partial<GroceryItem>) => {
        set((state) => ({
          items: {
            ...state.items,
            [itemId]: {
              ...state.items[itemId],
              ...updates,
            },
          },
        }));
      },

      clearCheckedItems: (listId: string) => {
        const state = get();
        const list = state.lists.find((l) => l.id === listId);
        if (!list) return;

        const checkedItemIds = list.itemIds.filter(
          (id) => state.items[id]?.checked
        );

        const newItems = { ...state.items };
        checkedItemIds.forEach((id) => {
          delete newItems[id];
        });

        set({
          items: newItems,
          lists: state.lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  itemIds: l.itemIds.filter(
                    (id) => !checkedItemIds.includes(id)
                  ),
                }
              : l
          ),
        });
      },

      getListItems: (listId: string) => {
        const state = get();
        const list = state.lists.find((l) => l.id === listId);
        if (!list) return [];
        return list.itemIds
          .map((id) => state.items[id])
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt);
      },

      getCheckedCount: (listId: string) => {
        const state = get();
        const list = state.lists.find((l) => l.id === listId);
        if (!list) return 0;
        return list.itemIds.filter(
          (id) => state.items[id]?.checked
        ).length;
      },
    }),
    {
      name: "grocery-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

