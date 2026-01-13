/**
 * Register Screen
 * Account creation with email/password and social login options
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
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  ChefHat,
} from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale, verticalScale } from 'react-native-size-matters';

import { useAuth } from '../../hooks/useAuth';
import { registerSchema, RegisterFormData } from '../../types/auth';
import { cn } from '../../lib/cn';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const {
    register: registerUser,
    loginWithGoogle,
    loginWithApple,
    isLoading,
    error,
    isAppleAuthAvailable,
    clearError,
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await registerUser(data.email, data.password, data.displayName);
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

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
            paddingTop: insets.top + verticalScale(10),
            paddingBottom: insets.bottom + verticalScale(20),
            paddingHorizontal: moderateScale(24),
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.duration(400)} className="mb-4">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-neutral-800/50 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            className="items-center mb-6"
          >
            <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mb-3">
              <ChefHat size={32} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-white mb-1">
              Create Account
            </Text>
            <Text className="text-neutral-400 text-center text-sm">
              Join our community of home chefs
            </Text>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4"
            >
              <Text className="text-red-400 text-center text-sm">
                {error.message}
              </Text>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)}>
            {/* Display Name Input */}
            <View className="mb-3">
              <Text className="text-neutral-300 text-sm font-medium mb-1.5">
                Full Name
              </Text>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.displayName
                        ? 'border-red-500'
                        : 'border-neutral-700'
                    )}
                  >
                    <User size={20} color="#737373" />
                    <TextInput
                      placeholder="Enter your name"
                      placeholderTextColor="#737373"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (error) clearError();
                      }}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      autoComplete="name"
                      editable={!isFormLoading}
                      className="flex-1 py-3.5 px-3 text-white text-base"
                    />
                  </View>
                )}
              />
              {errors.displayName && (
                <Text className="text-red-400 text-xs mt-1">
                  {errors.displayName.message}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View className="mb-3">
              <Text className="text-neutral-300 text-sm font-medium mb-1.5">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.email ? 'border-red-500' : 'border-neutral-700'
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
                      className="flex-1 py-3.5 px-3 text-white text-base"
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
            <View className="mb-3">
              <Text className="text-neutral-300 text-sm font-medium mb-1.5">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.password ? 'border-red-500' : 'border-neutral-700'
                    )}
                  >
                    <Lock size={20} color="#737373" />
                    <TextInput
                      placeholder="Create a password"
                      placeholderTextColor="#737373"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (error) clearError();
                      }}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      editable={!isFormLoading}
                      className="flex-1 py-3.5 px-3 text-white text-base"
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

            {/* Confirm Password Input */}
            <View className="mb-5">
              <Text className="text-neutral-300 text-sm font-medium mb-1.5">
                Confirm Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={cn(
                      'flex-row items-center bg-neutral-800/50 rounded-xl border px-4',
                      errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-neutral-700'
                    )}
                  >
                    <Lock size={20} color="#737373" />
                    <TextInput
                      placeholder="Confirm your password"
                      placeholderTextColor="#737373"
                      value={value}
                      onChangeText={(text) => {
                        onChange(text);
                        if (error) clearError();
                      }}
                      onBlur={onBlur}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      editable={!isFormLoading}
                      className="flex-1 py-3.5 px-3 text-white text-base"
                    />
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowConfirmPassword(!showConfirmPassword);
                      }}
                      hitSlop={10}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#737373" />
                      ) : (
                        <Eye size={20} color="#737373" />
                      )}
                    </Pressable>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text className="text-red-400 text-xs mt-1">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isFormLoading}
              className={cn(
                'bg-amber-500 rounded-xl py-4 items-center justify-center mb-5',
                isFormLoading && 'opacity-70'
              )}
            >
              {isFormLoading && !isGoogleLoading && !isAppleLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black font-bold text-base">
                  Create Account
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(300)}
            className="flex-row items-center mb-5"
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
            className="flex-row gap-3 mb-6"
          >
            {/* Google Button */}
            <Pressable
              onPress={handleGoogleLogin}
              disabled={isFormLoading || isGoogleLoading}
              className={cn(
                'flex-1 flex-row items-center justify-center bg-neutral-800/50 border border-neutral-700 rounded-xl py-3.5',
                (isFormLoading || isGoogleLoading) && 'opacity-70'
              )}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Google</Text>
                </>
              )}
            </Pressable>

            {/* Apple Button (iOS only) */}
            {isAppleAuthAvailable && (
              <Pressable
                onPress={handleAppleLogin}
                disabled={isFormLoading || isAppleLoading}
                className={cn(
                  'flex-1 flex-row items-center justify-center bg-white rounded-xl py-3.5',
                  (isFormLoading || isAppleLoading) && 'opacity-70'
                )}
              >
                {isAppleLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="#000" />
                    <Text className="text-black font-semibold ml-2">Apple</Text>
                  </>
                )}
              </Pressable>
            )}
          </Animated.View>

          {/* Login Link */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(500)}
            className="flex-row justify-center"
          >
            <Text className="text-neutral-400">Already have an account? </Text>
            <Link href={'/(auth)/login' as any} asChild>
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              >
                <Text className="text-amber-500 font-semibold">Log In</Text>
              </Pressable>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
