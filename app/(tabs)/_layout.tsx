import { Tabs } from "expo-router";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme.web";
import {
  ChefHat,
  BookOpen,
  ShoppingCart,
  Calendar,
  Users,
  User,
} from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#262626",
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cook",
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          href: null,
          title: "Cookbook",
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          href: null,
          title: "Grocery",
          tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          href: null,
          title: "Meals",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
          title: "Discover",
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
