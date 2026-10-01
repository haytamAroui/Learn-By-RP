/**
 * UI theme preference. Deliberately separate from the learning archive: a theme
 * is a display preference, not something worth a transactional row.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'mission_coach_theme';

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

let cached: ThemePreference | null = null;

export async function loadTheme(): Promise<ThemePreference | null> {
  if (cached) return cached;
  try {
    const value = await AsyncStorage.getItem(THEME_KEY);
    if (isPreference(value)) {
      cached = value;
      return cached;
    }
  } catch {
    // A missing or unreadable preference falls back to following the system.
  }
  return null;
}

export async function saveTheme(preference: ThemePreference): Promise<void> {
  cached = preference;
  try {
    await AsyncStorage.setItem(THEME_KEY, preference);
  } catch {
    // Not worth surfacing: the in-memory value still applies this session.
  }
}