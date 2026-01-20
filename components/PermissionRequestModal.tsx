import React from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Mic, Speech, X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

interface PermissionRequestModalProps {
  visible: boolean;
  onGrant: () => void;
  onCancel: () => void;
}

export default function PermissionRequestModal({
  visible,
  onGrant,
  onCancel,
}: PermissionRequestModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.contentContainer}
          className="bg-neutral-900 w-[90%] max-w-[400px] rounded-3xl p-6 border border-neutral-800"
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-amber-500/10 items-center justify-center mb-4">
              <Mic size={32} color="#f59e0b" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Hands-Free Cooking
            </Text>
            <Text className="text-neutral-400 text-center text-base">
              StepChef uses voice commands so you can cook without touching your screen with messy hands.
            </Text>
          </View>

          {/* Features List */}
          <View className="gap-4 mb-8">
            <Animated.View entering={FadeInUp.delay(100)} className="flex-row items-center bg-neutral-800/50 p-4 rounded-xl">
              <View className="w-10 h-10 rounded-full bg-neutral-700/50 items-center justify-center mr-4">
                <Mic size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Microphone Access</Text>
                <Text className="text-neutral-400 text-xs">Used to listen for commands like "Next step"</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200)} className="flex-row items-center bg-neutral-800/50 p-4 rounded-xl">
              <View className="w-10 h-10 rounded-full bg-neutral-700/50 items-center justify-center mr-4">
                <Speech size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">Speech Recognition</Text>
                <Text className="text-neutral-400 text-xs">Used to process your voice commands accurately</Text>
              </View>
            </Animated.View>
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onGrant();
              }}
              className="bg-amber-500 w-full py-4 rounded-xl items-center active:opacity-90"
            >
              <Text className="text-black font-bold text-lg">Enable Voice Control</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onCancel();
              }}
              className="w-full py-3 rounded-xl items-center active:opacity-70"
            >
              <Text className="text-neutral-500 font-semibold text-base">Maybe Later</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  contentContainer: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }
});
