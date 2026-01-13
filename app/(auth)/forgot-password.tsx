/**
 * Forgot Password Screen
 * Password reset email request
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

import { useAuth } from '../../hooks/useAuth';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../types/auth';
import { cn } from '../../lib/cn';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await resetPassword(data.email);

    if (result.success) {
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/login' as any);
  };

  const isFormLoading = isLoading || isSubmitting;

  // Success State
  if (isSuccess) {
    return (
      <View className="flex-1 bg-neutral-950">
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + verticalScale(20),
            paddingBottom: insets.bottom + verticalScale(20),
            paddingHorizontal: moderateScale(24),
            justifyContent: 'center',
          }}
        >
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center"
          >
            {/* Success Icon */}
            <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center mb-6">
              <CheckCircle2 size={48} color="#22c55e" />
            </View>

            {/* Success Message */}
            <Text className="text-2xl font-bold text-white mb-3 text-center">
              Check Your Email
            </Text>
            <Text className="text-neutral-400 text-center mb-8 px-4 leading-6">
              We've sent a password reset link to{'\n'}
              <Text className="text-amber-500 font-medium">
                {submittedEmail}
              </Text>
            </Text>

            {/* Instructions */}
            <View className="bg-neutral-800/50 rounded-xl p-4 mb-8 w-full">
              <Text className="text-neutral-300 text-sm text-center leading-5">
                Check your inbox and follow the link to reset your password.
                The link will expire in 1 hour.
              </Text>
            </View>

            {/* Back to Login Button */}
            <Pressable
              onPress={handleBackToLogin}
              className="bg-amber-500 rounded-xl py-4 px-8 items-center justify-center w-full"
            >
              <Text className="text-black font-bold text-base">
                Back to Login
              </Text>
            </Pressable>

            {/* Resend Link */}
            <Pressable
              onPress={() => {
                setIsSuccess(false);
                clearError();
              }}
              className="mt-4"
            >
              <Text className="text-neutral-400 text-sm">
                Didn't receive the email?{' '}
                <Text className="text-amber-500 font-medium">Resend</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + verticalScale(10),
            paddingBottom: insets.bottom + verticalScale(20),
            paddingHorizontal: moderateScale(24),
          }}
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.duration(400)} className="mb-6">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-neutral-800/50 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
          </Animated.View>

          {/* Content */}
          <View className="flex-1 justify-center">
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(600).delay(100)}
              className="items-center mb-8"
            >
              <View className="w-20 h-20 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                <KeyRound size={40} color="#f59e0b" />
              </View>
              <Text className="text-2xl font-bold text-white mb-2">
                Forgot Password?
              </Text>
              <Text className="text-neutral-400 text-center px-8 leading-5">
                No worries! Enter your email and we'll send you a reset link.
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
              >
                <Text className="text-red-400 text-center text-sm">
                  {error.message}
                </Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-neutral-300 text-sm font-medium mb-2">
                  Email Address
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
                          : 'border-neutral-700'
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
                        autoFocus
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

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isFormLoading}
                className={cn(
                  'bg-amber-500 rounded-xl py-4 items-center justify-center mb-4',
                  isFormLoading && 'opacity-70'
                )}
              >
                {isFormLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-black font-bold text-base">
                    Send Reset Link
                  </Text>
                )}
              </Pressable>

              {/* Back to Login */}
              <Pressable
                onPress={handleBackToLogin}
                className="py-2 items-center"
              >
                <Text className="text-neutral-400">
                  Remember your password?{' '}
                  <Text className="text-amber-500 font-semibold">Log In</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
