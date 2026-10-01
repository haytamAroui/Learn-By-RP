import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Compass, MessageSquare } from 'lucide-react-native';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { useTheme } from '../../features/theme';
import { iconColor } from '../../design/iconColor';

/**
 * The bar must fit an icon *and* a label.
 *
 * Content height is `BAR_HEIGHT - paddingTop - paddingBottom`, and the inset was
 * being counted twice: once in the height and again in the bottom padding. On web
 * `useSafeAreaInsets()` reports a non-zero bottom inset, so the label was left 1px
 * tall and rendered as nothing at all - the bar showed only its badge.
 *
 * 28px of icon plus a 12px label needs about 42px of content. At 56px tall the bar
 * offered 40px and the label was crushed out of existence, so the height has to
 * clear the content, not just look plausible.
 */
const BAR_HEIGHT = 64;
const BAR_PADDING = 6;

const TAB_META = [
  { name: 'index', label: 'Talk', Icon: MessageSquare },
  { name: 'missions', label: 'Missions', Icon: Compass },
  { name: 'progress', label: 'Progress', Icon: BarChart2 },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { duePhrases } = useArchive();
  // Subscribing keeps the resolved tints correct when the theme changes; the icon
  // lookup reads the published theme rather than a CSS variable.
  useTheme();

  // A browser viewport has no home indicator to clear.
  const bottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  /*
    These tints must be concrete colours, not CSS variables.
    React Navigation hands `tabBarIcon`'s colour straight to an SVG stroke, which
    cannot resolve `var(--color-*)`, so the icons rendered as nothing. Text does
    resolve the variable, which is why labels were affected differently from icons.
  */
  const activeTint = iconColor('brand');
  const inactiveTint = iconColor('muted');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: iconColor('surface'),
          borderTopColor: iconColor('borderSubtle'),
          height: BAR_HEIGHT + bottomInset,
          paddingBottom: bottomInset + BAR_PADDING,
          paddingTop: BAR_PADDING,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {TAB_META.map(({ name, label, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarBadge:
              name === 'progress' && duePhrases.length > 0 ? duePhrases.length : undefined,
            tabBarIcon: ({ color, focused }) => (
              <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
