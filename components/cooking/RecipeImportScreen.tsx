import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
// import { LinearGradient } from 'expo-linear-gradient'; // Temporarily disabled due to native module linking issue
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import {
  Link2,
  ChefHat,
  AlertCircle,
  Clipboard,
  X,
} from 'lucide-react-native';
import { cn } from '../../lib/cn';

type ImportState = 'idle' | 'extracting' | 'processing' | 'error';

interface RecipeImportScreenProps {
  onClose: () => void;
  onImport: (url: string) => Promise<void>;
}

export default function RecipeImportScreen({
  onClose,
  onImport,
}: RecipeImportScreenProps) {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState<string>('');
  const [importState, setImportState] = useState<ImportState>('idle');
  const [error, setError] = useState<string | null>(null);

  const isLoading = importState === 'extracting' || importState === 'processing';

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const text = await ExpoClipboard.getStringAsync();
      if (text) {
        setUrl(text.trim());
        setError(null);
      }
    } catch (e) {
      console.error('Error pasting from clipboard:', e);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!url.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setImportState('extracting');

    try {
      await onImport(url.trim());
      setImportState('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || 'Failed to import recipe');
      setImportState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [url, isLoading, onImport]);

  return (
    <View className="flex-1 bg-neutral-950">
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: '#0a0a0a',
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Row */}
            <View className="flex-row items-center justify-between px-4 py-4">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onClose();
                }}
                className="w-10 h-10 rounded-full bg-neutral-800 items-center justify-center active:opacity-70"
              >
                <X size={20} color="#9ca3af" />
              </Pressable>
              <View className="flex-1" />
            </View>

            {/* Icon Badge */}
            <Animated.View
              entering={FadeInUp.delay(100).duration(400)}
              className="items-center mb-8"
            >
              <View className="w-24 h-24 rounded-full bg-amber-500/20 items-center justify-center">
                <ChefHat size={48} color="#f59e0b" />
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              entering={FadeInUp.delay(200).duration(400)}
              className="text-3xl font-bold text-white text-center mb-3 px-6"
            >
              Import Recipe
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text
              entering={FadeInUp.delay(300).duration(400)}
              className="text-neutral-400 text-center mb-8 px-6"
            >
              Paste a URL from your favorite recipe website
            </Animated.Text>

            {/* URL Input Field */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(400)}
              className="px-6 mb-4"
            >
              <View className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
                <View className="flex-row items-center px-4 py-4">
                  <Link2 size={20} color="#6b7280" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="https://example.com/recipe..."
                    placeholderTextColor="#4b5563"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    value={url}
                    onChangeText={(text) => {
                      setUrl(text);
                      setError(null);
                    }}
                    editable={!isLoading}
                  />
                  {url.length > 0 && !isLoading && (
                    <Pressable
                      onPress={() => {
                        setUrl('');
                        setError(null);
                      }}
                      className="p-1 active:opacity-70"
                    >
                      <X size={18} color="#6b7280" />
                    </Pressable>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Paste Button */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(400)}
              className="px-6"
            >
              <Pressable
                onPress={handlePasteFromClipboard}
                disabled={isLoading}
                className="flex-row items-center justify-center py-3 active:opacity-70"
              >
                <Clipboard size={16} color="#f59e0b" />
                <Text className="ml-2 text-amber-500 font-medium">
                  Paste from clipboard
                </Text>
              </Pressable>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="px-6 mt-4"
              >
                <View className="flex-row items-start bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <AlertCircle size={18} color="#ef4444" className="mt-0.5" />
                  <Text className="ml-3 flex-1 text-red-400 text-sm">
                    {error}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Loading State */}
            {isLoading && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="items-center mt-8"
              >
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text className="text-neutral-400 mt-4">
                  {importState === 'extracting'
                    ? 'Extracting recipe from URL...'
                    : 'Processing recipe extraction...'}
                </Text>
              </Animated.View>
            )}

            {/* Import Button */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(400)}
              className="px-6 pb-6 mt-auto"
            >
              <Pressable
                onPress={handleImport}
                disabled={isLoading || !url.trim()}
                className={cn(
                  'w-full h-14 rounded-2xl items-center justify-center',
                  isLoading || !url.trim()
                    ? 'bg-neutral-800'
                    : 'bg-amber-500 active:opacity-80'
                )}
              >
                {isLoading ? (
                  <ActivityIndicator color="#9ca3af" />
                ) : (
                  <Text
                    className={cn(
                      'font-bold text-lg',
                      isLoading || !url.trim()
                        ? 'text-neutral-500'
                        : 'text-black'
                    )}
                  >
                    Import Recipe
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

