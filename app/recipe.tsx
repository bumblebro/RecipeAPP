import React from "react";
import { useLocalSearchParams } from "expo-router";
import RecipeScreen from "../components/RecipeScreen";
import { Text } from "react-native";

export default function RecipeRoute() {
  const params = useLocalSearchParams();
  let recipe = null;

  if (typeof params.recipe === "string") {
    try {
      recipe = JSON.parse(params.recipe);
    } catch (e) {
      console.error("Failed to parse recipe JSON:", e);
      return <Text>Error: Invalid recipe data.</Text>;
    }
  }

  return <RecipeScreen recipe={recipe} />;
}
