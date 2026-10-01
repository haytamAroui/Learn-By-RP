import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { iconColor } from '../design/iconColor';

/**
 * Mobile-first root header.
 *
 * Root screens expose one lightweight settings affordance. Theme and other
 * secondary controls belong inside settings rather than competing with the
 * screen's primary learning action.
 */
interface RootHeaderProps {
  title: string;
  subtitle?: string;
}

export const RootHeader: React.FC<RootHeaderProps> = ({ title, subtitle }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="w-full self-center flex-row items-start justify-between gap-4 px-4 pb-3"
      style={{ paddingTop: insets.top + 10, maxWidth: 1200 }}
    >
      <View className="min-h-12 flex-1 justify-center">
        <Text className="text-[26px] font-semibold leading-8 tracking-tight text-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 max-w-[620px] text-sm leading-5 text-body">{subtitle}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        hitSlop={6}
        className="h-12 w-12 items-center justify-center rounded-full border border-transparent bg-surface-soft hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
      >
        <Settings size={21} color={iconColor('muted')} strokeWidth={2} />
      </Pressable>
    </View>
  );
};
