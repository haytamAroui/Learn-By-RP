import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useTheme } from '../features/theme';
import { iconColor } from '../design/iconColor';

/**
 * The root header.
 *
 * Settings is deliberately not a fourth tab. It stays one tap from every primary
 * destination through the same affordance on each root, which is why this is a
 * shared component rather than three copies that drift.
 *
 * Compact shows the title and the action. Expanded leaves room for a rail, so the
 * action is anchored consistently either way.
 */
interface RootHeaderProps {
  title: string;
  subtitle?: string;
}

export const RootHeader: React.FC<RootHeaderProps> = ({ title, subtitle }) => {
  const router = useRouter();
  const { isDark, setPreference } = useTheme();

  return (
    <View
      className="flex-row items-start justify-between gap-3 px-4 pb-3"
      style={{ paddingTop: 52 }}
    >
      <View className="flex-1">
        <Text className="text-2xl font-semibold text-ink">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-body">{subtitle}</Text> : null}
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setPreference(isDark ? 'light' : 'dark')}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          // 48px hit target even though the glyph is smaller.
          hitSlop={8}
          className="h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-surface active:opacity-80"
        >
          <Text className="text-sm font-semibold text-muted">{isDark ? '☀' : '☾'}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          className="h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-surface active:opacity-80"
        >
          <Settings size={20} color={iconColor('muted')} />
        </Pressable>
      </View>
    </View>
  );
};