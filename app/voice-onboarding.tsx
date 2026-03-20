import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Mic, MicOff, ChevronRight, Sparkles, ChefHat, Volume2 } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Voice from "@react-native-voice/voice";
import * as Haptics from "expo-haptics";

export default function VoiceOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [isRequesting, setIsRequesting] = useState(false);

  const recipeData = params.recipe;

  const handleContinue = async (requestPermission: boolean) => {
    setIsRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (requestPermission) {
      try {
        // 1. Request Microphone (Expo Audio)
        const { status: micStatus } = await Audio.requestPermissionsAsync();
        
        // 2. Request Speech Recognition (System Prompt)
        if (Platform.OS === 'ios' && micStatus === 'granted') {
          // We WAIT for the user to click Allow/Don't Allow before moving on.
          // Voice.start triggers the prompt, and we listen for events to know when it's done.
          await new Promise<void>((resolve) => {
            let resolved = false;
            const finish = () => {
              if (resolved) return;
              resolved = true;
              Voice.onSpeechStart = null;
              Voice.onSpeechError = null;
              resolve();
            };
            
            Voice.onSpeechStart = () => {
              console.log("[Onboarding] Interaction resolved (Started)");
              finish();
            };
            Voice.onSpeechError = (e) => {
              console.log("[Onboarding] Interaction resolved (Error/Denied):", e);
              finish();
            };

            Voice.start('en-US').catch((err) => {
              console.log("[Onboarding] Voice start catch:", err);
              finish();
            });

            // 10-second safety timeout in case the user takes a while or dialog is blocked
            setTimeout(finish, 10000);
          });
        }
      } catch (e) {
        console.log("Permission request error:", e);
      }
    }

    // Crucial: Clean up before navigating to avoid 'Already started' errors in RecipeScreen
    try {
      await Voice.destroy();
    } catch (e) {
      console.log("Cleanup error:", e);
    }

    router.push({
      pathname: "/recipe",
      params: { recipe: recipeData },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#000000", "#0a0a0a", "#111111"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <MotiView
            from={{ opacity: 0, scale: 0.5, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            className="items-center mb-10"
          >
            <View className="w-24 h-24 rounded-full bg-amber-500/10 items-center justify-center border border-amber-500/20 mb-6">
              <Mic size={48} color="#f59e0b" />
            </View>
            <Text className="text-white text-4xl font-black text-center tracking-tighter mb-2">
              Hey Chef!
            </Text>
            <Text className="text-amber-500/80 text-lg font-bold uppercase tracking-widest">
              Hands-Free Mode
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800, delay: 300 }}
            className="gap-6 mb-12"
          >
            <View className="flex-row items-start gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
              <View className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center">
                <Volume2 size={20} color="#000" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">Voice Guidance</Text>
                <Text className="text-neutral-400 leading-relaxed">
                  I'll read the steps and ingredients to you as you cook.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <Sparkles size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">Say "Hey Chef"</Text>
                <Text className="text-neutral-400 leading-relaxed">
                  Ask me to "Go Next", "Repeat", or "Read Ingredients" at any time.
                </Text>
              </View>
            </View>
          </MotiView>

          <View className="mt-auto gap-4">
            <Pressable
              onPress={() => handleContinue(true)}
              disabled={isRequesting}
              style={styles.primaryButtonContainer}
            >
              <LinearGradient
                colors={["#fbbf24", "#f59e0b"]}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>
                  Enable Voice Guide
                </Text>
                <ChevronRight size={22} color="#000" />
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => handleContinue(false)}
              disabled={isRequesting}
              style={styles.secondaryButton}
            >
              <Text className="text-neutral-500 font-bold text-base">
                No thanks, I'll use buttons
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 20,
  },
  primaryButtonContainer: {
    height: 64,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: -0.2,
    marginRight: 8,
  },
  secondaryButton: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
