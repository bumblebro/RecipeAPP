import { Tabs } from "expo-router";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme.web";
import {
  ChefHat,
  User,
  Heart,
  Plus,
} from "lucide-react-native";
import { useState } from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { AddRecipeOverlay } from "../../components/AddRecipeOverlay";
import { useExtractionStore } from "../../stores/useExtractionStore";
import * as Haptics from "expo-haptics";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAddModalVisible, setAddModalVisible } = useExtractionStore();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#f59e0b",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: {
            backgroundColor: "#0a0a0a",
            borderTopColor: "#262626",
            paddingTop: 12,
            height: Platform.OS === 'ios' ? 92 : 72,
            paddingBottom: Platform.OS === 'ios' ? 32 : 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="cook"
          options={{
            title: "Cook",
            tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            title: "",
            tabBarButton: () => (
              <View className="flex-1 items-center justify-center">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setAddModalVisible(true);
                  }}
                  style={styles.floatingButton}
                  className="bg-amber-500 shadow-lg shadow-amber-500/40"
                >
                  <Plus size={32} color="#000000" strokeWidth={3} />
                </Pressable>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="saved"
          options={{
            title: "Saved",
            tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <AddRecipeOverlay
        isVisible={isAddModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === 'ios' ? 38 : 28,
    borderWidth: 5,
    borderColor: "#0a0a0a",
  },
});
