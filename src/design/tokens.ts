/**
 * Mission Coach design tokens.
 *
 * Single source of truth for colour. `index.css` mirrors these values for the
 * web, because CSS is the only thing the web bundle reads; `tests/design.test.ts`
 * asserts the two stay identical, because that duplication is the exact thing
 * that silently drifted before.
 *
 * Every pairing used for text or for a control boundary is verified in that test
 * against WCAG 2.2 contrast minimums. If you change a value here and the pairing
 * stops working, the test fails rather than the UI quietly becoming unreadable.
 */

/** Canvas is deliberately not white, so a card can separate from it. */
export const LIGHT = {
  canvas: '#F2EDE4',
  surface: '#FFFFFF',
  /** Neutral secondary panel. Distinct from the warm brand soft on purpose. */
  surfaceSoft: '#F4F0E8',
  /** Recessed: inputs and wells. Darker than canvas. */
  sunken: '#E8E0D2',
  /** Hover on a surface that sits directly on canvas. */
  surfaceHover: '#EAE3D8',
  /**
   * Dialogs and popovers. In light mode a raised surface is the same white as a
   * card and is separated by shadow instead of tone; there is no lighter white
   * available, so pretending otherwise would only weaken the canvas contrast.
   */
  raised: '#FFFFFF',

  /** Grouping only. Decorative: not a control boundary. */
  borderSubtle: '#C8BFB2',
  /** Any control the user must be able to see and hit. Clears 3:1 on canvas. */
  borderInteractive: '#8A7F71',

  ink: '#1C1917',
  body: '#57534E',
  muted: '#6E6963',

  brand: '#A7442F',
  brandHover: '#8F3826',
  brandPressed: '#7A3021',
  brandSoft: '#F7E8E2',
  brandText: '#FFFFFF',
  /**
   * The CTA background. Same value in both themes: light mode's brand is already
   * dark enough to carry white text, so only the *foreground* brand changes for
   * dark mode.
   */
  brandButton: '#A7442F',

  language: '#246B63',
  languageHover: '#1E5D56',
  languageSoft: '#E4F2EF',
  languageText: '#FFFFFF',

  success: '#2D6B49',
  successSoft: '#E5F1E9',
  warning: '#8A5A12',
  warningSoft: '#F7EDD8',
  danger: '#B42318',
  dangerSoft: '#FBE8E6',
  info: '#356C96',
  infoSoft: '#E5EFF7',

  focus: '#246B63',
  /**
   * Focus ring for use directly against the brand fill.
   *
   * `focus` cannot do both jobs: teal clears the canvas at 5.36:1 but is
   * invisible on the terracotta CTA at 1.05:1, and any colour that works on the
   * CTA is invisible on the canvas. That is why a focus ring must use an offset
   * (see FOCUS_RING) so it is drawn against the background rather than against
   * the component. This token covers the flush case where that is not possible.
   */
  focusOnBrand: '#FFFFFF',
} as const;

export const DARK = {
  canvas: '#171613',
  surface: '#29251F',
  /** Neutral secondary panel. Deliberately not the warm brand soft. */
  surfaceSoft: '#332E27',
  sunken: '#12110F',
  /** Dialogs, popovers, floating support. Separates from both surface and canvas. */
  raised: '#423A31',
  surfaceHover: '#3B342C',

  borderSubtle: '#514A40',
  borderInteractive: '#7A7063',

  ink: '#F7F4EE',
  body: '#D4CEC4',
  muted: '#AFA79C',

  /** Dark mode needs a lighter brand to read as text; the button stays dark. */
  brand: '#EF9B7F',
  brandHover: '#F5AB93',
  brandPressed: '#D98263',
  brandSoft: '#3B251E',
  brandButton: '#A7442F',
  brandText: '#FFFFFF',

  language: '#7CC7BE',
  languageHover: '#98D6CE',
  languageSoft: '#17332F',
  languageText: '#12110F',

  success: '#7BC59A',
  successSoft: '#193326',
  warning: '#E0B466',
  warningSoft: '#3B2D17',
  danger: '#FF8A80',
  dangerSoft: '#3A1E1B',
  info: '#86B7DF',
  infoSoft: '#1B2B38',

  focus: '#7CC7BE',
  /** White reads against the dark brand fill; teal would not. */
  focusOnBrand: '#FFFFFF',
} as const;

/**
 * A resolved palette. Deliberately not keyed by the literal types of LIGHT, so a
 * theme can differ in value but must not differ in shape: forgetting a token in
 * one theme is a type error instead of an undefined variable at runtime.
 */
export type ThemeTokens = Record<string, string>;

export type ThemeName = 'light' | 'dark';

export const TOKENS: Record<ThemeName, ThemeTokens> = {
  light: LIGHT,
  dark: DARK,
};

/**
 * CSS custom property name for a token.
 *
 * On web the stylesheet defines these. On native they are supplied through
 * NativeWind's `vars()`, because `react-native-css-interop` resolves variables
 * through a React context rather than by parsing the stylesheet. A `.dark {}`
 * rule alone therefore themes the web only.
 *
 * camelCase becomes kebab-case, so the token `borderInteractive` and the Tailwind
 * utility `border-interactive` refer to the same `--color-border-interactive`.
 */
export function cssVarName(token: keyof typeof LIGHT): string {
  const kebab = token.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
  return `--color-${kebab}`;
}

/** The `vars()` payload for a theme, used on native. */
export function cssVariables(theme: ThemeName): Record<string, string> {
  return Object.fromEntries(
    Object.entries(TOKENS[theme]).map(([token, value]) => [cssVarName(token as keyof typeof LIGHT), value])
  );
}

// ------------------------------------------------------------------- typography

/**
 * Type roles. `captionSm` at 12 is the floor: nothing essential may render
 * smaller, because sub-12px text is the most common way a "clean" design turns
 * unreadable on a phone.
 */
export const TYPE = {
  displayLg: { fontSize: 32, lineHeight: 38, fontWeight: '600' },
  displayMd: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  titleLg: { fontSize: 24, lineHeight: 30, fontWeight: '600' },
  titleMd: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  titleSm: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  bodyLg: { fontSize: 17, lineHeight: 25, fontWeight: '400' },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLg: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  labelMd: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  /** The floor. Do not go below this for anything a user must read. */
  captionSm: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  /** The current spoken line in a live session: the hero of that screen. */
  conversation: { fontSize: 26, lineHeight: 35, fontWeight: '500' },
} as const;

export const MIN_READABLE_PX = 12;

// ---------------------------------------------------------------------- spacing

export const SPACE = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

export const RADIUS = {
  xs: 8, sm: 10, control: 14, card: 20, hero: 24, sheet: 28, pill: 999,
} as const;

/** Apple and Android both treat this as the minimum comfortable target. */
export const MIN_TOUCH_TARGET = 48;

/**
 * Focus indicator geometry.
 *
 * The offset is not decoration. A single-colour ring cannot contrast with both
 * the component and the background at once, so the ring is drawn against the
 * background with a gap: 2px ring, 2px offset. Anything that draws a focus ring
 * flush against a filled control must use `focusOnBrand` instead.
 */
export const FOCUS_RING = {
  width: 2,
  offset: 2,
  /** Web equivalent. */
  outline: '2px solid',
  outlineOffset: '2px',
} as const;

// ----------------------------------------------------------------------- motion

export const MOTION = {
  instant: 80, short: 140, standard: 220, long: 320,
} as const;

// ------------------------------------------------------------------ breakpoints

/**
 * Width tiers. Layout code branches on these names rather than on device
 * labels, so "expanded" means the same thing on a tablet and a desktop.
 */
export const BREAKPOINTS = {
  compact: { min: 0, max: 599 },
  medium: { min: 600, max: 839 },
  expanded: { min: 840, max: 1199 },
  large: { min: 1200, max: 1599 },
  xl: { min: 1600, max: Number.POSITIVE_INFINITY },
} as const;

export type LayoutTier = keyof typeof BREAKPOINTS;

export function layoutForWidth(width: number): LayoutTier {
  if (width >= BREAKPOINTS.xl.min) return 'xl';
  if (width >= BREAKPOINTS.large.min) return 'large';
  if (width >= BREAKPOINTS.expanded.min) return 'expanded';
  if (width >= BREAKPOINTS.medium.min) return 'medium';
  return 'compact';
}

/** Content must not stretch indefinitely on very wide displays. */
export const MAX_WIDTH = {
  app: 1180,
  conversation: 720,
  reading: 760,
  catalog: 1320,
} as const;