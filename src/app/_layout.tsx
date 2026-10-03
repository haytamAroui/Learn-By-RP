import React from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../features/theme";
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

  return (
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
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
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
