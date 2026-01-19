import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Info, AlertTriangle, CheckCircle2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onPrimaryAction: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
  type?: "info" | "warning" | "success" | "error";
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onPrimaryAction,
  primaryButtonText = "OK, Got it",
  secondaryButtonText,
  onSecondaryAction,
  type = "info",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // We rely on Modal's visible prop to handle rendering/overlay

  const Icon = () => {
    switch (type) {
      case "warning":
      case "error":
        return <AlertTriangle size={32} color="#f59e0b" />;
      case "success":
        return <CheckCircle2 size={32} color="#10b981" />;
      default:
        return <Info size={32} color="#f59e0b" />;
    }
  };

  const handlePrimaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPrimaryAction();
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSecondaryAction();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable 
            style={styles.backdropPressable} 
            onPress={onSecondaryAction || onPrimaryAction} 
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.buttonsWrapper}>
            {secondaryButtonText && (
              <Pressable
                onPress={handleSecondaryAction}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.secondaryButtonText}>{secondaryButtonText}</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handlePrimaryAction}
              style={({ pressed }) => [
                styles.primaryButtonContainer,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={["#fbbf24", "#f59e0b", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  backdropPressable: {
    flex: 1,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#171717",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  content: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: "#a3a3a3",
    textAlign: "center",
    fontWeight: "500",
  },
  buttonsWrapper: {
    width: "100%",
    gap: 12,
  },
  primaryButtonContainer: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#a3a3a3",
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
