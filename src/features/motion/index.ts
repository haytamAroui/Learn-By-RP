import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * The single source of truth for "should this device animate?".
 *
 * Motion is an accessibility setting, not a preference screen. Honouring it in one
 * shared hook is the point: every call site that wants to animate asks here rather
 * than re-deriving it, which is how an app ends up with three answers to the same
 * question and a vestibular-sensitive user getting the loudest one.
 *
 * Native reads the OS accessibility setting and stays subscribed, because it can
 * change while the app is running. Web reads the media query, which also changes
 * live when the OS setting does.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `window` is reached through `globalThis` rather than by adding "dom" to tsconfig,
 * because that would let DOM globals type-check in native-only code and hide the
 * exact mistake this hook guards against: touching `window` on a platform that has
 * none.
 */
type WebWindow = {
  matchMedia?: (query: string) => {
    matches: boolean;
    addEventListener?: (
      type: "change",
      listener: (event: { matches: boolean }) => void,
    ) => void;
    removeEventListener?: (
      type: "change",
      listener: (event: { matches: boolean }) => void,
    ) => void;
    addListener?: (listener: (event: { matches: boolean }) => void) => void;
    removeListener?: (listener: (event: { matches: boolean }) => void) => void;
  };
};

type MediaListener = (event: { matches: boolean }) => void;

function webWindow(): WebWindow | null {
  const scope = globalThis as { window?: WebWindow };
  return typeof scope === "object" && scope.window ? scope.window : null;
}

function readWebPreference(): boolean {
  const win = webWindow();
  if (!win || typeof win.matchMedia !== "function") return false;
  return win.matchMedia(QUERY).matches;
}

export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    Platform.OS === "web" ? readWebPreference() : false,
  );

  useEffect(() => {
    if (Platform.OS === "web") {
      const win = webWindow();
      if (!win || typeof win.matchMedia !== "function") return;

      const list = win.matchMedia(QUERY);
      const onChange: MediaListener = event => setReduced(event.matches);

      setReduced(list.matches);

      // Safari before 14 only has the deprecated listener API.
      if (typeof list.addEventListener === "function") {
        list.addEventListener("change", onChange);
        return () => list.removeEventListener?.("change", onChange);
      }
      list.addListener?.(onChange);
      return () => list.removeListener?.(onChange);
    }

    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!cancelled) setReduced(enabled);
      })
      .catch(() => {
        // A device that cannot answer must not be treated as "reduce motion", or
        // the app silently loses all of its motion for those users.
        if (!cancelled) setReduced(false);
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => setReduced(enabled),
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/**
 * Motion tokens that collapse to their nearest static equivalent when reduced.
 *
 * Returning plain values rather than booleans keeps call sites free of branching:
 * a component sets `duration: motion.duration(320)` and gets 0 when reduced, which
 * makes "did anyone remember to handle this?" a question about one table instead
 * of every animation in the app.
 */
export function motionTokens(reduced: boolean) {
  return {
    reduced,
    /** Scale applied on press. Colour-only feedback when reduced. */
    pressScale: reduced ? 1 : 0.97,
    /** Sheet and page transition length. */
    duration: reduced ? 0 : 260,
    /** Continuous looping animation period; 0 disables the loop. */
    loop: reduced ? 0 : 1200,
    /** Whether decorative looping motion may run at all. */
    allowLoop: !reduced,
  };
}

/** True when continuous decorative motion should be paused. */
export function shouldPauseDecorativeMotion(
  reduced: boolean,
  appState: string,
): boolean {
  return reduced || appState !== "active";
}
