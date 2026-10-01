import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { vars } from 'nativewind';
import { loadTheme, saveTheme, ThemePreference } from '../../lib/themePreference';
import { cssVariables, ThemeName } from '../../design/tokens';
import { setIconTheme } from '../../design/iconColor';

/**
 * Theme state.
 *
 * `system` is the default and is a real mode, not a synonym for light. The
 * previous implementation stored only `light | dark` and seeded from the OS once,
 * which meant a device set to dark still rendered light unless the user manually
 * chose dark, and choosing anything at all permanently overrode the OS.
 *
 * The resolved theme is derived on every render from the live OS value, so the app
 * follows the system while the user stays on `system`.
 */
interface ThemeContextType {
  /** What the user chose. */
  preference: ThemePreference;
  /** What is actually being rendered. */
  theme: ThemeName;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    loadTheme().then(saved => {
      if (!cancelled && saved) setPreferenceState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void saveTheme(preference);
  }, [preference]);

  const theme: ThemeName =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  /*
    Icons are painted from the token file rather than from CSS custom properties,
    because an SVG stroke attribute cannot resolve a CSS variable. This publishes
    the resolved theme to that lookup. It is a render-time write on purpose: doing it
    in an effect would let the first paint of a screen use the previous theme, which
    is exactly the flash the theme system exists to prevent.
  */
  setIconTheme(theme);

  const value = useMemo<ThemeContextType>(
    () => ({
      preference,
      theme,
      isDark: theme === 'dark',
      setPreference: setPreferenceState,
    }),
    [preference, theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {/*
        Both are required and they do different jobs.
        - `vars()` supplies the token values on native. `react-native-css-interop`
          resolves custom properties through a React context; it does not parse
          global.css. Without this the native build has no token values at all and
          dark mode silently does nothing.
        - the `dark`/`light` class drives NativeWind's `dark:` variants on both
          platforms and the CSS block on web.
      */}
      <View
        className={theme === 'dark' ? 'dark flex-1' : 'light flex-1'}
        style={vars(cssVariables(theme))}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};