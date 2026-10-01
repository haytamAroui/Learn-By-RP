/**
 * Generates `global.css` from `src/design/tokens.ts`.
 *
 * The web bundle can only read CSS; native reads tokens through NativeWind's
 * `vars()`. That leaves two copies of the palette, which is exactly how the old
 * one drifted: the stylesheet was hand-edited, the tokens were not, and dark mode
 * silently stopped working on native without failing anywhere. So the stylesheet
 * is generated, not authored.
 *
 * Values are emitted as space-separated RGB triplets because the Tailwind config
 * composes them as `rgb(var(--color-x) / <alpha-value>)`, which needs the
 * triplet form to stay valid.
 *
 * Run after changing tokens:  node scripts/generate-css.mts
 */
import { writeFileSync } from 'node:fs';
import { LIGHT, DARK, cssVarName } from '../src/design/tokens.ts';

/** '#RRGGBB' -> 'R G B' */
const triplet = (hex: string) => {
  const s = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)).join(' ');
};

const block = (tokens: Record<string, string>, selector: string) => {
  const body = Object.entries(tokens)
    .map(([name, value]) => `    ${cssVarName(name as keyof typeof LIGHT)}: ${triplet(value)};`)
    .join('\n');
  return `  ${selector} {\n${body}\n  }`;
};

const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * GENERATED FILE - do not edit by hand.
 *
 * Source of truth: src/design/tokens.ts
 * Regenerate:      node scripts/generate-css.mts
 *
 * Read by the web bundle only. React Native does not parse this stylesheet, so
 * native theming comes from the \`vars()\` call in src/features/theme/index.tsx.
 * Both read the same token file; tests/design.test.ts asserts they agree.
 */

@layer base {
  /* Light: the default. */
${block(LIGHT, ':root')}

  /**
   * Dark applies to any element carrying \`dark\`, not just \`html\`. On web
   * NativeWind puts the class on the document element; on native it puts it on a
   * wrapper View. Scoping to \`html\` alone themes the web and leaves native light.
   */
${block(DARK, '.dark')}

  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: rgb(var(--color-canvas));
    color: rgb(var(--color-ink));
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /**
   * Reduced motion for CSS-driven transitions. Components must honour it in JS
   * too; see src/design/motion.ts.
   */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @layer utilities {
    /* Safe-area padding that respects a gesture bar without a magic number. */
    .pb-safe {
      padding-bottom: max(env(safe-area-inset-bottom), 0.75rem);
    }
  }
}
`;

writeFileSync('global.css', css, 'utf8');
console.log(`wrote global.css (${css.length} bytes) from src/design/tokens.ts`);

/**
 * Emits the Tailwind colour map so `tailwind.config.js` cannot drift from the
 * token file either. Without this, the stylesheet and the utility classes are
 * three separate hand-maintained copies of one palette.
 */
type ColorSpec = string | { DEFAULT: string; [key: string]: string };

/**
 * Refuses to emit a utility that points at a token the palette does not define.
 * A missing token produces `--color-x` that is never assigned, which fails to no
 * colour at all and silently inherits instead — the same class of bug as the
 * original mismatch, one level deeper.
 *
 * The `var()` wrapper is not optional. `rgb(--color-brand / <alpha-value>)` is
 * invalid CSS: the browser needs `rgb(var(--color-brand) / <alpha-value>)`, where
 * the variable reference is a function argument. Without it the declaration is
 * dropped, the utility silently does nothing, and the result depends on what
 * happens to be inherited — which is why a solid `bg-primary` badge rendered as
 * white-on-cream while `text-primary` looked fine.
 */
const referenced = new Set<string>();
const alias = (token: string): string => {
  referenced.add(token);
  return `rgb(var(${cssVarName(token as keyof typeof LIGHT)}) / <alpha-value>)`;
};

const colors: Record<string, ColorSpec> = {
  canvas: alias('canvas'),

  surface: {
    DEFAULT: alias('surface'),
    soft: alias('surfaceSoft'),
    hover: alias('surfaceHover'),
    sunken: alias('sunken'),
    raised: alias('raised'),
  },

  // `border` is the decorative grouping edge. Anything the user must see and hit
  // uses `border-interactive`, which is held to 3:1 on both surface and canvas.
  border: {
    DEFAULT: alias('borderSubtle'),
    subtle: alias('borderSubtle'),
    interactive: alias('borderInteractive'),
  },

  ink: alias('ink'),
  body: alias('body'),
  muted: alias('muted'),

  // Brand scale. `brand-soft` is a background, never a foreground: as text it
  // measures 1.19:1 on white, which is why there is no `primary-light` alias.
  brand: {
    DEFAULT: alias('brand'),
    hover: alias('brandHover'),
    pressed: alias('brandPressed'),
    soft: alias('brandSoft'),
    on: alias('brandText'),
    button: alias('brandButton'),
    buttonHover: alias('brandButtonHover'),
    buttonPressed: alias('brandButtonPressed'),
  },

  // Filled actions intentionally do not use the foreground brand token. In dark
  // mode the foreground brand is light for readability, while the CTA stays dark
  // enough to carry white text.
  action: {
    DEFAULT: alias('brandButton'),
    hover: alias('brandButtonHover'),
    pressed: alias('brandButtonPressed'),
    text: alias('brandText'),
  },

  // Retained during the component migration so screens can be reworked one at a
  // time. `primary.dark` predates the rename and means hover, not a new meaning.
  primary: {
    DEFAULT: alias('brand'),
    dark: alias('brandHover'),
    pressed: alias('brandPressed'),
    text: alias('brandText'),
  },

  // Teal is reserved for target-language content. Never generic success.
  language: {
    DEFAULT: alias('language'),
    hover: alias('languageHover'),
    soft: alias('languageSoft'),
    text: alias('languageText'),
  },

  success: { DEFAULT: alias('success'), soft: alias('successSoft') },
  warning: { DEFAULT: alias('warning'), soft: alias('warningSoft') },
  danger: { DEFAULT: alias('danger'), soft: alias('dangerSoft') },
  info: { DEFAULT: alias('info'), soft: alias('infoSoft') },
  focus: alias('focus'),

  // Legacy names, now pointed at the semantic tokens they were approximating.
  // `accent-sage` was evidence status, `card-warm` was brand selection.
  accent: {
    sage: alias('success'),
    sky: alias('info'),
  },
  card: {
    warm: alias('brandSoft'),
    sage: alias('successSoft'),
    sky: alias('infoSoft'),
    heather: alias('warningSoft'),
  },
};

const missing: string[] = [];
for (const name of referenced) {
  if (!(name in LIGHT)) missing.push(`light: ${name}`);
  if (!(name in DARK)) missing.push(`dark: ${name}`);
}
if (missing.length > 0) {
  console.error(
    `\nERROR: tailwind utilities reference tokens the palette does not define:\n  ${missing.join(
      '\n  '
    )}\nAdd them to LIGHT and DARK in src/design/tokens.ts, or remove the utility.\n`
  );
  process.exit(1);
}

writeFileSync(
  'src/design/tailwind-colors.generated.json',
  JSON.stringify({ colors }, null, 2) + '\n',
  'utf8'
);
console.log('wrote src/design/tailwind-colors.generated.json');