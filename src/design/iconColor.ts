import { ThemeTokens, TOKENS, ThemeName } from './tokens';

/**
 * Resolves a design token to a concrete colour for SVG use.
 *
 * Icons cannot be given a CSS custom property as their paint. NativeWind resolves
 * custom properties for style props such as `color` on a Text, but a lucide icon
 * turns that prop into an SVG stroke attribute, which receives the literal string
 * and never resolves the variable. The result is a valid element with an invalid
 * paint, which renders as nothing at all — so on web every icon in the product was
 * invisible while the code looked correct.
 *
 * Colours therefore come from the token file at runtime rather than from a CSS
 * variable. Screens still reference tokens by name, so the palette stays
 * single-sourced.
 */

let resolved: ThemeName = 'light';

/** Called by the theme provider whenever the resolved theme changes. */
export function setIconTheme(theme: ThemeName): void {
  resolved = theme;
}

export function iconColor(token: keyof ThemeTokens): string {
  return TOKENS[resolved][token];
}