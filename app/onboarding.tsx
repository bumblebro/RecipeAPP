import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AnimatePresence, MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useSettingsStore } from '../stores/useSettingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    animation: require('../assets/animations/waiting.json'),
    title: "Your AI Kitchen Guide",
    subtitle: "Personalized recipes, smart scaling, and voice-assisted cooking tailored to your taste.",
  },
  {
    animation: require('../assets/animations/sauteing.json'),
    title: "Say \"Hey Chef\"",
    subtitle: "Control your guide hands-free while you cook. Never touch your screen with messy hands again.",
  },
  {
    animation: require('../assets/animations/measuring.json'),
    title: "Cook for Any Crowd",
    subtitle: "Instantly scale ingredient quantities for 1 to 12 servings with professional precision.",
  },
  {
    animation: require('../assets/animations/heating.json'),
    title: "Smart Instructions",
    subtitle: "Detailed, step-by-step guidance that feels like having a pro chef right by your side.",
  },
  {
    animation: require('../assets/animations/serving.json'),
    title: "Build Your Cookbook",
    subtitle: "Save your favorite creations and build a personalized library of dishes you love.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setHasCompletedOnboarding = useSettingsStore((state) => state.setHasCompletedOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasCompletedOnboarding(true);
  };

  const nextSlide = () => {
    const nextIndex = Math.floor(scrollX.value / SCREEN_WIDTH) + 1;
    if (nextIndex < ONBOARDING_DATA.length) {
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Immersive Dark Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#111111']}
          style={StyleSheet.absoluteFill}
        />
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 1500 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={[styles.glow, { top: '20%', left: '-10%', backgroundColor: '#f59e0b10' }]} />
          <View style={[styles.glow, { bottom: '10%', right: '-10%', backgroundColor: '#f59e0b05' }]} />
        </MotiView>
      </View>

      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(newIndex);
        }}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {ONBOARDING_DATA.map((item, index) => {
          const contentStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              scrollX.value,
              [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
              [0, 1, 0],
              Extrapolation.CLAMP
            );
            const scale = interpolate(
              scrollX.value,
              [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
              [0.8, 1, 0.8],
              Extrapolation.CLAMP
            );
            return {
              opacity,
              transform: [{ scale }],
            };
          });

          return (
            <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Animated.View style={[styles.slideContent, contentStyle]}>
                 {/* Lottie Animation Header */}
                <View style={styles.animationContainer}>
                  <LottieView
                    source={item.animation}
                    autoPlay
                    loop
                    style={styles.lottie}
                  />
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 800, delay: 200 }}
                  >
                    <Text style={styles.title}>{item.title}</Text>
                  </MotiView>
                  
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 800, delay: 400 }}
                  >
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                  </MotiView>
                </View>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={[styles.pagination, { bottom: insets.bottom + 120 }]}>
        {ONBOARDING_DATA.map((_, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              scrollX.value / SCREEN_WIDTH,
              [index - 1, index, index + 1],
              [0.3, 1, 0.3],
              Extrapolation.CLAMP
            );
            const width = interpolate(
              scrollX.value / SCREEN_WIDTH,
              [index - 1, index, index + 1],
              [8, 24, 8],
              Extrapolation.CLAMP
            );
            return {
              opacity,
              width,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[styles.dot, dotStyle]}
            />
          );
        })}
      </View>

      {/* Footer Controls */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <Pressable 
          onPress={handleFinish}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <Pressable 
          onPress={nextSlide}
          className="h-16 px-10 rounded-[28px] items-center justify-center flex-row overflow-hidden active:scale-95 bg-neutral-800"
        >
          <AnimatePresence>
            <MotiView
              key={currentIndex >= ONBOARDING_DATA.length - 1 ? "done" : "next"}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={StyleSheet.absoluteFill}
            >
              <LinearGradient
                colors={currentIndex >= ONBOARDING_DATA.length - 1
                  ? ["#4ade80", "#16a34a"]
                  : ["#fb923c", "#f97316"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </MotiView>
          </AnimatePresence>

          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}
            </Text>
            {currentIndex !== ONBOARDING_DATA.length - 1 && (
              <ChevronRight size={22} color="#000" style={{ marginLeft: 4 }} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 160, // Clear the dots and footer
  },
  animationContainer: {
    width: SCREEN_WIDTH * 0.65, // Reduced from 0.8
    height: SCREEN_WIDTH * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Tighter margin for small screens
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12, // Tighter title margin
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17, // Slightly smaller
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fb923c',
    marginHorizontal: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 19,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
});
