import React from "react";
import {
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarChart2, Compass, MessageSquare } from "lucide-react-native";
import { useArchive } from "../../features/archive/ArchiveProvider";
import { useTheme } from "../../features/theme";
import { iconColor } from "../../design/iconColor";

/** Shared by the compact bar and the expanded rail so the two cannot drift. */
const RAIL_ITEM_HEIGHT = 44;

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
  { name: "index", label: "Talk", Icon: MessageSquare },
  { name: "missions", label: "Missions", Icon: Compass },
  { name: "progress", label: "Progress", Icon: BarChart2 },
] as const;

/**
 * A custom bar rather than `tabBarButton`, so the icon and label are laid out as
 * one row instead of stacked.
 *
 * The badge sits inline instead of floating above the icon, which is what made it
 * overlap at every width: React Navigation positions `tabBarBadge` absolutely over
 * the icon's top-right corner, and with three tabs at 390px there is not enough
 * room to clear it.
 */
function RailTab({
  label,
  badge,
  focused,
  tint,
  inactiveTint,
  accessibilityState,
}: {
  label: string;
  badge?: number;
  focused: boolean;
  tint: string;
  inactiveTint: string;
  accessibilityState: { selected: boolean };
}) {
  return (
    <View
      accessible
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
      accessibilityLabel={badge ? `${label}, ${badge} due` : label}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: RAIL_ITEM_HEIGHT,
        borderRadius: 10,
        backgroundColor: focused ? iconColor("brandSoft") : "transparent",
      }}
    >
      <TabIcon
        name={label}
        focused={focused}
        color={focused ? tint : inactiveTint}
      />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 13,
          fontWeight: focused ? "700" : "500",
          color: focused ? tint : inactiveTint,
        }}
      >
        {label}
      </Text>
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            minWidth: 22,
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 11,
            alignItems: "center",
            backgroundColor: iconColor("brand"),
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
            {badge}
          </Text>
        </View>
      )}
    </View>
  );
}

const TAB_ICONS = {
  Talk: MessageSquare,
  Missions: Compass,
  Progress: BarChart2,
} as const;

function TabIcon({
  name,
  focused,
  color,
}: {
  name: string;
  focused: boolean;
  color: string;
}) {
  const Icon = TAB_ICONS[name as keyof typeof TAB_ICONS] ?? MessageSquare;
  return <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 2} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { duePhrases } = useArchive();
  // Subscribing keeps the resolved tints correct when the theme changes; the icon
  // lookup reads the published theme rather than a CSS variable.
  useTheme();

  const { width } = useWindowDimensions();
  const isWide = width >= 1024;
  const router = useRouter();

  // A browser viewport has no home indicator to clear.
  const bottomInset = Platform.OS === "web" ? 0 : insets.bottom;

  /*
    These tints must be concrete colours, not CSS variables.
    React Navigation hands `tabBarIcon`'s colour straight to an SVG stroke, which
    cannot resolve `var(--color-*)`, so the icons rendered as nothing. Text does
    resolve the variable, which is why labels were affected differently from icons.
  */
  const activeTint = iconColor("brand");
  const inactiveTint = iconColor("muted");

  /*
    Expanded width gets a rail.

    A bottom bar stretched across 1440px puts three targets at the far corners of
    a very wide screen with a long empty run between them, which is why this looked
    wrong long before it was noticed. The rail is the standard answer: a fixed
    column at the left, targets stacked, labels horizontal beside their icons.
  */
  if (isWide) {
    return (
<Tabs
        tabBar={({ state, descriptors }) => (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: iconColor("surface"),
              borderRightColor: iconColor("borderSubtle"),
              borderRightWidth: 1,
            }}
          >
            <View
              style={{ width: 232, paddingTop: 16, paddingBottom: 16, gap: 6 }}
            >
              {state.routes.map((route, index) => {
                const meta = TAB_META.find((tab) => tab.name === route.name);
                if (!meta) return null;
                const focused = state.index === index;
                const badge =
                  meta.name === "progress" && duePhrases.length > 0
                    ? duePhrases.length
                    : undefined;

                return (
                  <Pressable
                    key={route.key}
                    onPress={() =>
                      router.navigate({
                        pathname: "/(tabs)",
                        params: { screen: meta.name },
                      })
                    }
                    accessibilityRole="tab"
                    accessibilityState={{ selected: focused }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      paddingHorizontal: 12,
                      height: RAIL_ITEM_HEIGHT,
                      borderRadius: 10,
                      backgroundColor: focused
                        ? iconColor("brandSoft")
                        : "transparent",
                    }}
                  >
                    <TabIcon
                      name={meta.label}
                      focused={focused}
                      color={focused ? activeTint : inactiveTint}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: focused ? "700" : "500",
                        color: focused ? activeTint : inactiveTint,
                      }}
                    >
                      {meta.label}
                    </Text>
                    {badge !== undefined && badge > 0 && (
                      <View
                        style={{
                          minWidth: 22,
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 11,
                          alignItems: "center",
                          backgroundColor: iconColor("brand"),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#FFFFFF",
                          }}
                        >
                          {badge}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flex: 1 }}>{descriptors[state.routes[state.index].key]?.render()}</View>
          </View>
        )}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeTint,
          tabBarInactiveTintColor: inactiveTint,
        }}
      >
        {TAB_META.map(({ name }) => (
          <Tabs.Screen key={name} name={name} />
        ))}
      </Tabs>
    );
  }

  return (
    <Tabs
      tabBar={({ state, navigation }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            height: BAR_HEIGHT + bottomInset,
            paddingTop: BAR_PADDING,
            paddingBottom: bottomInset + BAR_PADDING,
            paddingHorizontal: 8,
            backgroundColor: iconColor("surface"),
            borderTopColor: iconColor("borderSubtle"),
            borderTopWidth: 1,
          }}
        >
          {state.routes.map((route, index) => {
            const meta = TAB_META.find(tab => tab.name === route.name);
            if (!meta) return null;

            const focused = state.index === index;

            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={meta.label}
                style={{
                  flex: 1,
                  minHeight: 52,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  borderRadius: 14,
                }}
              >
                <TabIcon
                  name={meta.label}
                  focused={focused}
                  color={focused ? activeTint : inactiveTint}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    fontWeight: focused ? "700" : "600",
                    color: focused ? activeTint : inactiveTint,
                  }}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
      }}
    >
      {TAB_META.map(({ name, label }) => (
        <Tabs.Screen key={name} name={name} options={{ title: label }} />
      ))}
    </Tabs>
  );
}
