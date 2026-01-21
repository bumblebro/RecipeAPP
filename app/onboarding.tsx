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
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { ChevronRight, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AnimatePresence, MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettingsStore } from '../stores/useSettingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_DATA = [
  { image: require('../assets/onboarding/Onboarding_Step1.png') },
  { image: require('../assets/onboarding/Onboarding_Step2.png') },
  { image: require('../assets/onboarding/Onboarding_Step3.png') },
  { image: require('../assets/onboarding/Onboarding_Step4.png') },
  { image: require('../assets/onboarding/Onboarding_Step5.png') },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setHasCompletedOnboarding = useSettingsStore((state) => state.setHasCompletedOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasCompletedOnboarding(true);
  };

  const scrollRef = useRef<Animated.ScrollView>(null);

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
      >
        {ONBOARDING_DATA.map((item, index) => (
          <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Image
              source={item.image}
              contentFit="contain"
              style={[StyleSheet.absoluteFill, { top: -80 }]}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots Overlay */}
      <View style={[styles.pagination, { bottom: insets.bottom + 110 }]}>
        {ONBOARDING_DATA.map((_, index) => {
          const dotStyle = useAnimatedStyle(() => {
            const opacity = interpolate(
              scrollX.value / SCREEN_WIDTH,
              [index - 1, index, index + 1],
              [0.3, 1, 0.3],
              'clamp'
            );
            const width = interpolate(
              scrollX.value / SCREEN_WIDTH,
              [index - 1, index, index + 1],
              [8, 22, 8],
              'clamp'
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

      {/* Bottom Buttons Overlay */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <View />
        <Pressable 
          onPress={nextSlide}
          className="h-14 px-8 rounded-full items-center justify-center flex-row overflow-hidden active:opacity-80 bg-neutral-800"
          onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          {/* Sliding Background Color Animation */}
          <AnimatePresence>
            <MotiView
              key={currentIndex >= ONBOARDING_DATA.length - 1 ? "done" : "next"}
              from={{ translateX: -200, opacity: 0 }}
              animate={{ 
                translateX: 0, 
                opacity: 1,
                scale: currentIndex >= ONBOARDING_DATA.length - 1 ? [1, 1.05, 1] : 1
              }}
              exit={{ translateX: 200, opacity: 0 }}
              transition={{ 
                type: 'timing', 
                duration: 450, 
                easing: Easing.out(Easing.quad),
                scale: {
                  type: 'timing',
                  duration: 1500,
                  loop: true,
                  easing: Easing.inOut(Easing.quad)
                }
              }}
              className="absolute inset-0"
              style={StyleSheet.absoluteFill}
            >
              <LinearGradient
                colors={currentIndex >= ONBOARDING_DATA.length - 1
                  ? ["#4ade80", "#16a34a"] // Vibrant Green for Done
                  : ["#fb923c", "#f97316"] // Pop Orange for Next
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={{ flex: 1 }}
              />
            </MotiView>
          </AnimatePresence>

          <View className="items-center justify-center z-10 relative flex-row">
            <Text className="text-black font-bold text-xl leading-tight">
              {currentIndex === ONBOARDING_DATA.length - 1
                ? "Get Started"
                : "Next"}
            </Text>
            {currentIndex !== ONBOARDING_DATA.length - 1 && (
              <ChevronRight size={24} color="#000" className="ml-1" />
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
    backgroundColor: '#f59e0b',
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
    paddingHorizontal: 40,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    padding: 10,
  },
  nextButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
});
