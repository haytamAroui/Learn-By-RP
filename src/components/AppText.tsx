import React from 'react';
import { Platform, Text as NativeText, type TextProps } from 'react-native';

/** App-wide reference typography. Web uses the exact supplied font families. */
export function Text({ className = '', style, ...props }: TextProps & { className?: string }) {
  const display = /font-display|text-\[(26|28|32)px\]|text-(2xl|3xl)/.test(className);
  const fontFamily = Platform.OS === 'web'
    ? display ? '"Bricolage Grotesque", "Avenir Next", "Trebuchet MS", system-ui, sans-serif'
      : 'Figtree, Inter, system-ui, -apple-system, "Segoe UI", sans-serif'
    : Platform.OS === 'ios' ? 'System' : 'sans-serif';
  return <NativeText {...props} className={className} style={[{ fontFamily }, style]} />;
}
