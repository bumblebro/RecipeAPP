import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LogOut, Trash2, ChevronLeft, User as UserIcon } from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { useAlert } from "../components/AlertProvider";

export default function AccountInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, deleteAccount, user } = useAuth();
  const { showAlert } = useAlert();

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        className="px-6 pb-4 border-b border-neutral-900"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-neutral-900 items-center justify-center mr-3 border border-neutral-800 active:bg-neutral-800"
          >
            <ChevronLeft size={24} color="#ffffff" />
          </Pressable>
          <Text className="text-xl font-bold text-white">Account Information</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        
        {/* User Details */}
        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-900 p-4 mb-6">
            <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-neutral-800 rounded-full items-center justify-center mr-4">
                    <UserIcon size={24} color="#9ca3af" />
                </View>
                <View>
                    <Text className="text-neutral-400 text-sm font-medium">Signed in as</Text>
                    <Text className="text-white text-base font-bold">{user?.email}</Text>
                </View>
            </View>
             <View className="h-[1px] bg-neutral-800 my-2" />
             <Text className="text-neutral-500 text-xs text-center mt-2 uppercase tracking-widest font-bold">StepChef v1.0.0</Text>
        </View>

        <Text className="text-neutral-500 font-bold text-xs uppercase mb-3 ml-2">Actions</Text>
        <View className="bg-neutral-900 rounded-2xl border border-neutral-900 overflow-hidden">
             <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              showAlert({
                title: "Logout",
                message: "Are you sure you want to log out of your account?",
                type: "warning",
                secondaryButton: { text: "Cancel" },
                primaryButton: {
                  text: "Logout",
                  onPress: logout,
                },
              });
            }}
            className="flex-row items-center justify-between p-4 bg-neutral-900 active:bg-neutral-800 border-b border-neutral-800"
          >
            <View className="flex-row items-center">
              <LogOut size={20} color="#ef4444" className="mr-3" />
              <Text className="text-lg font-semibold text-red-500 ml-3">Logout</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              showAlert({
                title: "Delete Account",
                message:
                  "This will permanently delete your account and all saved data. This action cannot be undone.",
                type: "error",
                secondaryButton: { text: "Cancel" },
                primaryButton: {
                  text: "Delete My Account",
                  onPress: deleteAccount,
                },
              });
            }}
            className="flex-row items-center justify-between p-4 bg-neutral-900 active:bg-neutral-800"
          >
            <View className="flex-row items-center">
              <Trash2 size={20} color="#ef4444" className="mr-3" />
              <Text className="text-lg font-semibold text-red-500 ml-3">Delete Account</Text>
            </View>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}
