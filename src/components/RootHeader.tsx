import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './AppText';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { iconColor } from '../design/iconColor';
import { useArchive } from '../features/archive/ArchiveProvider';
import { getTranslations } from '../features/i18n';

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
  const archive = useArchive();
  const t = getTranslations(archive.preferences.explanationLanguage);

  return (
    <View
      className="w-full self-center flex-row items-center justify-between gap-4 px-5 pb-3"
      style={{ paddingTop: insets.top + 14, maxWidth: 720 }}
    >
      <View className="min-h-12 flex-1 justify-center">
        <Text className="font-display text-[32px] font-bold leading-[38px] tracking-tight text-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 max-w-[620px] text-sm leading-5 text-body">{subtitle}</Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel={t.nav.settingsTooltip}
        hitSlop={6}
        className="h-12 w-12 items-center justify-center rounded-full border border-surface bg-surface hover:bg-surface-hover active:opacity-70 focus:border-2 focus:border-focus"
      >
        <Settings size={21} color={iconColor('muted')} strokeWidth={2} />
      </Pressable>
    </View>
  );
};
