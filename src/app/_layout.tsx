import React from "react";
import { Platform } from "react-native";
import Head from 'expo-router/head';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../features/theme";
import { TOKENS } from "../design/tokens";
import {
  ArchiveProvider,
  useArchive,
} from "../features/archive/ArchiveProvider";
import { AppStateProvider } from "../features/session/AppStateProvider";
import { ConsentGate } from "../features/consent/ConsentGate";
import { useReducedMotionPreference } from "../features/motion";
import "../../global.css";

/**
 * On boot, an archive left holding an unfinished session offers recovery before
 * the learner re-enters the app (§7.11). Otherwise this is a plain pass-through.
 */
function BootRecoveryGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, interruptedSessions } = useArchive();
  const [asked, setAsked] = React.useState(false);

  React.useEffect(() => {
    if (!ready || asked) return;
    if (interruptedSessions.length === 0) return;

    router.replace("/recovery");
    setAsked(true);
  }, [ready, asked, interruptedSessions, router]);

  return <>{children}</>;
}

/**
 * Stack transitions honour the reduced-motion preference.
 *
 * `slide_from_bottom` is a large-area movement, which is the motion most likely to
 * cause trouble, so it is the one that must not be hard-coded. `fade` becomes
 * `none` rather than a shorter slide: a shortened slide is still a slide.
 */
function MotionAwareStack() {
  const reduced = useReducedMotionPreference();
  const { theme, isDark } = useTheme();
  const navigationTheme = React.useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    const tokens = TOKENS[theme];
    return {
      ...base,
      colors: {
        ...base.colors,
        background: tokens.canvas,
        card: tokens.surface,
        text: tokens.ink,
        primary: tokens.language,
        border: tokens.borderSubtle,
        notification: tokens.danger,
      },
    };
  }, [theme, isDark]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: reduced ? "none" : "default",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: "modal" }} />
        <Stack.Screen name="recovery" options={{ presentation: "modal" }} />
        <Stack.Screen name="mission/[missionId]" />
        <Stack.Screen name="program/[programId]" />
        <Stack.Screen
          name="session/[sessionId]"
          options={{
            animation: reduced ? "none" : "default",
          }}
        />
        <Stack.Screen name="recap/[sessionId]" />
        <Stack.Screen
          name="phrase/[phraseId]"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="settings/privacy"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? <Head>
        <link id="learnbyrp-reference-fonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Figtree:wght@400..800&display=swap" />
      </Head> : null}
      <ThemeProvider>
        <AppStateProvider>
          <ArchiveProvider>
            <BootRecoveryGate>
              <ConsentGate>
                <MotionAwareStack />
              </ConsentGate>
            </BootRecoveryGate>
          </ArchiveProvider>
        </AppStateProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
