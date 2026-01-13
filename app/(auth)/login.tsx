/**
 * Login Screen
 * Email/password login with Google and Apple social login options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Mail, Lock, Eye, EyeOff, ChefHat } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale, verticalScale } from 'react-native-size-matters';

import { useAuth } from '../../hooks/useAuth';
import { loginSchema, LoginFormData } from '../../types/auth';
import { cn } from '../../lib/cn';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, loginWithApple, isLoading, error, isAppleAuthAvailable, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await login(data.email, data.password);
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGoogleLoading(true);
    await loginWithGoogle();
    setIsGoogleLoading(false);
  };

  const handleAppleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAppleLoading(true);
    await loginWithApple();
    setIsAppleLoading(false);
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <View className="flex-1 bg-neutral-950">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + verticalScale(20),
            paddingBottom: insets.bottom + verticalScale(20),
            paddingHorizontal: moderateScale(24),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            className="items-center mb-8"
          >
            <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4">
              <ChefHat size={40} color="#f59e0b" />
            </View>
            <Text className="text-3xl font-bold text-white mb-2">
              Welcome Back
            </Text>
            <Text className="text-neutral-400 text-center">
              Sign in to continue your cooking journey
            </Text>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
            >
              <Text className="text-red-400 text-center">{error.message}</Text>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-neutral-300 text-sm font-medium mb-2">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.email
                        ? 'border-red-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    )}
                  >
                    <Mail size={20} color="#737373" />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#737373"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (error) clearError();
                      }}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!isFormLoading}
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text className="text-red-400 text-xs mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-2">
              <Text className="text-neutral-300 text-sm font-medium mb-2">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.password
                        ? 'border-red-500'
                        : 'border-neutral-700 focus:border-amber-500'
                    )}
                  >
                    <Lock size={20} color="#737373" />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#737373"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (error) clearError();
                      }}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      editable={!isFormLoading}
                      className="flex-1 py-4 px-3 text-white text-base"
                    />
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                      hitSlop={10}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#737373" />
                      ) : (
                        <Eye size={20} color="#737373" />
                      )}
                    </Pressable>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <View className="items-end mb-6">
              <Link href={'/(auth)/forgot-password' as any} asChild>
                <Pressable
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                >
                  <Text className="text-amber-500 text-sm font-medium">
                    Forgot Password?
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isFormLoading}
              className={cn(
                'bg-amber-500 rounded-xl py-4 items-center justify-center mb-6',
                isFormLoading && 'opacity-70'
              )}
            >
              {isFormLoading && !isGoogleLoading && !isAppleLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black font-bold text-base">Log In</Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            className="flex-row items-center mb-6"
          >
            <View className="flex-1 h-px bg-neutral-700" />
            <Text className="mx-4 text-neutral-500 text-sm">
              or continue with
            </Text>
            <View className="flex-1 h-px bg-neutral-700" />
          </Animated.View>

          {/* Social Login Buttons */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            className="gap-3 mb-8"
          >
            {/* Google Button */}
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isFormLoading || isGoogleLoading}
              className={cn(
                'flex-row items-center justify-center bg-neutral-800/50 border border-neutral-700 rounded-xl py-4',
                (isFormLoading || isGoogleLoading) && 'opacity-70'
              )}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="logo-google"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-white font-semibold">
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Apple Button (iOS only) */}
            {isAppleAuthAvailable && (
              <Pressable
                onPress={handleAppleLogin}
                disabled={isFormLoading || isAppleLoading}
                className={cn(
                  'flex-row items-center justify-center bg-white rounded-xl py-4',
                  (isFormLoading || isAppleLoading) && 'opacity-70'
                )}
              >
                {isAppleLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons
                      name="logo-apple"
                      size={22}
                      color="#000"
                      style={{ marginRight: 10 }}
                    />
                    <Text className="text-black font-semibold">
                      Continue with Apple
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(500)}
            className="flex-row justify-center"
          >
            <Text className="text-neutral-400">Don't have an account? </Text>
            <Link href={'/(auth)/register' as any} asChild>
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              >
                <Text className="text-amber-500 font-semibold">Sign Up</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
