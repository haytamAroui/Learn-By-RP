import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Compass, MessageSquare } from 'lucide-react-native';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { getTranslations } from '../../features/i18n';
import { useTheme } from '../../features/theme';
import { BREAKPOINTS, ELEVATION } from '../../design/tokens';
import { iconColor } from '../../design/iconColor';

const BAR_HEIGHT = 68;
const BAR_PADDING = 6;

const TAB_ICONS = {
  index: MessageSquare,
  missions: Compass,
  progress: BarChart2,
} as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const archive = useArchive();
  useTheme();

  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINTS.desktop.min;
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;
  const t = getTranslations(archive.preferences.explanationLanguage);

  const labels = {
    index: t.nav.talk,
    missions: t.nav.missions,
    progress: t.nav.progress,
  } as const;

  const activeTint = iconColor('language');
  const inactiveTint = iconColor('muted');
  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(20px) saturate(1.6)' } : {};

  return (
    <Tabs
      screenOptions={({ route }) => {
        const routeName = route.name as keyof typeof TAB_ICONS;
        const Icon = TAB_ICONS[routeName] ?? MessageSquare;
        const label = labels[routeName] ?? route.name;

        return {
          headerShown: false,
          tabBarPosition: isDesktop ? 'left' : 'bottom',
          tabBarLabelPosition: isDesktop ? 'beside-icon' : 'below-icon',
          tabBarActiveTintColor: activeTint,
          tabBarInactiveTintColor: inactiveTint,
          tabBarActiveBackgroundColor: iconColor('languageSoft'),
          tabBarLabel: label,
          tabBarAccessibilityLabel: label,
          tabBarIcon: ({ color, focused }) => (
            <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
          tabBarLabelStyle: {
            fontSize: isDesktop ? 14 : 12,
            lineHeight: isDesktop ? 18 : 16,
            fontWeight: '600' as const,
            fontFamily: Platform.OS === 'web' ? 'Figtree, system-ui, sans-serif' : undefined,
          },
          tabBarItemStyle: {
            minHeight: 52,
            borderRadius: 25,
            overflow: 'hidden',
            marginHorizontal: isDesktop ? 8 : 4,
            marginVertical: isDesktop ? 3 : 0,
          },
          tabBarStyle: isDesktop
            ? {
                width: 216,
                margin: 12,
                borderRadius: 28,
                paddingTop: 16,
                paddingBottom: 16,
                backgroundColor: `${iconColor('surface')}E6`,
                ...glass,
                borderTopWidth: 0,
                borderRightWidth: 0,
                boxShadow: ELEVATION.floating,
              }
            : {
                height: BAR_HEIGHT,
                paddingTop: BAR_PADDING,
                paddingBottom: BAR_PADDING,
                paddingHorizontal: 4,
                marginHorizontal: Math.max(12, (width - 720) / 2),
                marginBottom: bottomInset + 12,
                marginTop: 6,
                borderRadius: 31,
                borderTopWidth: 0,
                boxShadow: ELEVATION.floating,
                backgroundColor: `${iconColor('surface')}E6`,
                borderWidth: 1,
                borderColor: `${iconColor('surface')}D9`,
                ...glass,
              },
          sceneStyle: {
            backgroundColor: iconColor('canvas'),
          },
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: labels.index }} />
      <Tabs.Screen name="missions" options={{ title: labels.missions }} />
      <Tabs.Screen name="progress" options={{ title: labels.progress }} />
    </Tabs>
  );
}
