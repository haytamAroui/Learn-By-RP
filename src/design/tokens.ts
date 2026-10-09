/**
 * Mission Coach design tokens.
 *
 * Single source of truth for colour. `global.css` is generated from these values for the
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
  canvas: '#F8F3E8',
  surface: '#FFFFFF',
  /** Pale neutral secondary panel from the reference, distinct from coral. */
  surfaceSoft: '#F4F0E9',
  /** Recessed: inputs and wells. Darker than canvas. */
  sunken: '#E5E9E5',
  /** Hover on a surface that sits directly on canvas. */
  surfaceHover: '#ECF5F0',
  /**
   * Dialogs and popovers. In light mode a raised surface is the same white as a
   * card and is separated by shadow instead of tone; there is no lighter white
   * available, so pretending otherwise would only weaken the canvas contrast.
   */
  raised: '#FFFFFF',

  /** Grouping only. Decorative: not a control boundary. */
  borderSubtle: '#D2D3C9',
  /** Any control the user must be able to see and hit. Clears 3:1 on canvas. */
  borderInteractive: '#75857E',

  ink: '#0C2B2E',
  body: '#42575B',
  muted: '#55646A',

  brand: '#B5412F',
  brandHover: '#9D3527',
  brandPressed: '#822B20',
  brandSoft: '#FFEAE2',
  brandText: '#FFFFFF',
  /**
   * Deep teal action fill from the Lingo 2027 reference. Coral remains the speaking
   * accent; primary actions carry a readable white label in both themes.
   */
  brandButton: '#07454B',
  brandButtonHover: '#0C6469',
  brandButtonPressed: '#05373C',

  language: '#0A726C',
  languageHover: '#095D58',
  languageSoft: '#DDF1EA',
  languageText: '#FFFFFF',

  success: '#21664C',
  successSoft: '#E3F5EE',
  warning: '#855818',
  warningSoft: '#FFF1DC',
  danger: '#B42318',
  dangerSoft: '#FBE8E6',
  info: '#0D6581',
  infoSoft: '#E0F2F8',

  focus: '#0A726C',
  /**
   * Focus ring for use directly against the brand fill.
   *
   * A focus ring is stronger on the canvas than on a filled action. Use an offset
   * (see FOCUS_RING) so it is drawn against the background rather than against
   * the component. This token covers the flush case where that is not possible.
   */
  focusOnBrand: '#FFFFFF',
  lime: '#CBF37C',
  limeText: '#17310F',
  coralControl: '#EA4B3B',
  lilac: '#65509D',
  lilacSoft: '#EFEAFF',
} as const;

export const DARK = {
  canvas: '#122322',
  surface: '#1D3231',
  /** Neutral secondary panel. Deliberately not the warm brand soft. */
  surfaceSoft: '#243C39',
  sunken: '#0B191A',
  /** Dialogs, popovers, floating support. Separates from both surface and canvas. */
  raised: '#304B47',
  surfaceHover: '#2C4541',

  borderSubtle: '#526F65',
  borderInteractive: '#95ADA3',

  ink: '#F9F7F0',
  body: '#D5E4DD',
  muted: '#B2C6BD',

  /** Dark mode needs a lighter brand to read as text; the button stays dark. */
  brand: '#FFAB91',
  brandHover: '#FFC0AA',
  brandPressed: '#E8967D',
  brandSoft: '#492E28',
  brandButton: '#07454B',
  brandButtonHover: '#0C6469',
  brandButtonPressed: '#05373C',
  brandText: '#FFFFFF',

  language: '#82D8C7',
  languageHover: '#ADE8D9',
  languageSoft: '#18453F',
  languageText: '#0B191A',

  success: '#95D2AF',
  successSoft: '#1C4030',
  warning: '#EFCA84',
  warningSoft: '#443820',
  danger: '#FFA899',
  dangerSoft: '#492D2A',
  info: '#99CBE1',
  infoSoft: '#203C47',

  focus: '#82D8C7',
  /** White reads against the deep teal action fill. */
  focusOnBrand: '#FFFFFF',
  lime: '#CBF37C',
  limeText: '#17310F',
  coralControl: '#EA4B3B',
  lilac: '#C3ACF5',
  lilacSoft: '#372C4D',
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
/**
 * Converts a hex token to the space-separated channel form.
 *
 * The colour utilities are generated as `rgb(<variable> / <alpha-value>)`,
 * which only parses when the variable holds channels - `rgb(232 224 210 / 1)`.
 * Handing it hex instead gives `rgb(#E8E0D2 / 1)`, which is invalid, so the
 * browser drops the whole declaration and the element silently falls back to
 * transparent.
 *
 * This matters because the same variables are declared twice: global.css emits
 * channels, and the theme provider writes inline values for native. When the two
 * disagreed the inline one won, so a background that looked correct in the
 * stylesheet rendered as nothing at runtime.
 *
 * The channels must also be bare. Wrapping them again gives a nested function,
 * which is equally invalid, so the value is `232 224 210` and never `rgb(...)`.
 */
function hexToChannels(value: string): string {
  const hex = value.trim();

  // Already channels (e.g. "232 224 210") or a function such as rgb().
  if (!hex.startsWith('#')) return value;

  const body = hex.slice(1);
  const full =
    body.length === 3 || body.length === 4
      ? body
          .split('')
          .map(c => c + c)
          .join('')
      : body;

  if (full.length !== 6 && full.length !== 8) return value;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some(n => Number.isNaN(n))) return value;

  // Bare channels, never wrapped in rgb(): the utility supplies the function, and
  // `rgb(rgb(232 224 210) / 1)` is as invalid as the hex form it replaced.
  const alpha = full.length === 8 ? ` / ${parseInt(full.slice(6, 8), 16) / 255}` : '';
  return `${r} ${g} ${b}${alpha}`;
}

export function cssVariables(theme: ThemeName): Record<string, string> {
  return Object.fromEntries(
    Object.entries(TOKENS[theme]).map(([token, value]) => [
      cssVarName(token as keyof typeof LIGHT),
      hexToChannels(value),
    ])
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
  xs: 8, sm: 12, control: 20, card: 26, hero: 28, sheet: 32, pill: 999,
} as const;

/** Decorative elevation from the supplied HTML; never a status indicator. */
export const ELEVATION = {
  card: '0px 14px 30px -16px rgba(7,69,75,0.28)',
  floating: '0px 14px 32px -10px rgba(7,69,75,0.32)',
} as const;

/** Theme-independent illustration paints adapted from the reference skyline. */
export const CITY_ART = {
  sky: '#B7D3E7', sunset: '#F0CDA7', horizon: '#6F91A5',
  house: '#694F40', houseLight: '#8B6653', tower: '#74503F',
  water: '#6D97AA', waterDeep: '#3E7188', window: '#FFE4AA',
  shade: '#172D3D',
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
  phone: { min: 0, max: 599 },
  tablet: { min: 600, max: 1023 },
  desktop: { min: 1024, max: Number.POSITIVE_INFINITY },
} as const;

export type LayoutTier = keyof typeof BREAKPOINTS;

export function layoutForWidth(width: number): LayoutTier {
  if (width >= BREAKPOINTS.desktop.min) return 'desktop';
  if (width >= BREAKPOINTS.tablet.min) return 'tablet';
  return 'phone';
}

/** Content must not stretch indefinitely on very wide displays. */
export const MAX_WIDTH = {
  app: 1200,
  conversation: 720,
  reading: 720,
  catalog: 1200,
} as const;
