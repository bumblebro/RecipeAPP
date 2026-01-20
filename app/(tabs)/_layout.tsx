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
import * as Haptics from "expo-haptics";

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
            paddingTop: 16,
            height: Platform.OS === 'ios' ? 96 : 76,
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
            title: "Import",
            tabBarIcon: ({ color }) => <Plus size={24} color={color} />,
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
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({});
