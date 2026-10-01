import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, globSync } from 'node:fs';
import {
  LIGHT,
  DARK,
  TOKENS,
  TYPE,
  MIN_READABLE_PX,
  SPACE,
  cssVarName,
  cssVariables,
  layoutForWidth,
  MIN_TOUCH_TARGET,
  FOCUS_RING,
} from '../src/design/tokens';

/**
 * Design-system guarantees.
 *
 * Two things are being defended here, and both failed before.
 *
 * 1. Contrast. The first palette put white on the CTA at 3.12:1, below the 4.5:1
 *    minimum, and used borders at 1.31:1 to define cards. Nothing failed; it
 *    simply looked slightly wrong and failed WCAG. These assertions make it loud.
 *
 * 2. Drift. The palette existed as a hand-edited stylesheet, a hand-edited
 *    Tailwind config, and a runtime, and the three disagreed. The stylesheet and
 *    the Tailwind config are now generated from the same token file; this test
 *    fails if they are edited by hand or fall out of date.
 */

// ---------------------------------------------------------------- contrast maths

const hexToRgb = (hex: string) => {
  const s = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
};

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(c =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const AA_TEXT = 4.5;
const AA_LARGE_TEXT = 3;
const NON_TEXT = 3;

const THEMES = [
  { name: 'light' as const, tokens: LIGHT },
  { name: 'dark' as const, tokens: DARK },
];

describe('WCAG contrast: text', () => {
  for (const { name, tokens } of THEMES) {
    // Every surface a piece of text can legitimately sit on.
    const surfaces: Array<[string, string]> = [
      ['surface', tokens.surface],
      ['canvas', tokens.canvas],
      ['surfaceSoft', tokens.surfaceSoft],
      ['raised', tokens.raised],
    ];

    describe(name, () => {
      it('ink passes on every surface', () => {
        for (const [surfaceName, surface] of surfaces) {
          expect(
            `${name}/${surfaceName}: ${contrast(tokens.ink, surface).toFixed(2)}`
          ).toBe(`${name}/${surfaceName}: ${contrast(tokens.ink, surface).toFixed(2)}`);
          expect(contrast(tokens.ink, surface)).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });

      it('body passes on every surface', () => {
        for (const [surfaceName, surface] of surfaces) {
          expect(
            contrast(tokens.body, surface),
            `body on ${surfaceName} in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });

      // `muted` is the old `faint`: metadata, dates, evidence counts. It replaced
      // a token that sat at 2.22:1, so it is held to the full text minimum.
      it('muted passes as text on every surface', () => {
        for (const [surfaceName, surface] of surfaces) {
          expect(
            contrast(tokens.muted, surface),
            `muted on ${surfaceName} in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });

      it('brand reads as text on surface, canvas and its own soft tint', () => {
        expect(contrast(tokens.brand, tokens.surface)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(tokens.brand, tokens.canvas)).toBeGreaterThanOrEqual(AA_TEXT);
        // This pairing is what a selected/brand-tinted card uses.
        expect(contrast(tokens.brand, tokens.brandSoft)).toBeGreaterThanOrEqual(AA_TEXT);
      });

      it('button label passes on the button fill', () => {
        expect(contrast(tokens.brandText, tokens.brandButton)).toBeGreaterThanOrEqual(AA_TEXT);
      });

      it('language reads on surface and on its soft tint', () => {
        expect(contrast(tokens.language, tokens.surface)).toBeGreaterThanOrEqual(AA_TEXT);
        expect(contrast(tokens.language, tokens.languageSoft)).toBeGreaterThanOrEqual(AA_TEXT);
      });

      it('every semantic status colour reads on surface', () => {
        for (const status of ['success', 'warning', 'danger', 'info'] as const) {
          expect(
            contrast(tokens[status], tokens.surface),
            `${status} on surface in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });

      it('every semantic status colour reads on its own soft tint', () => {
        for (const status of ['success', 'warning', 'danger', 'info'] as const) {
          expect(
            contrast(tokens[status], tokens[`${status}Soft`]),
            `${status} on ${status}Soft in ${name}`
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      });
    });
  }
});

describe('WCAG contrast: non-text and structure', () => {
  for (const { name, tokens } of THEMES) {
    describe(name, () => {
      it('a control boundary is visible on surface and on canvas', () => {
        // The first palette validated this against white only and failed on
        // canvas at 2.90:1, which is where inputs and search fields sit.
        expect(
          contrast(tokens.borderInteractive, tokens.surface),
          `interactive border on surface in ${name}`
        ).toBeGreaterThanOrEqual(NON_TEXT);
        expect(
          contrast(tokens.borderInteractive, tokens.canvas),
          `interactive border on canvas in ${name}`
        ).toBeGreaterThanOrEqual(NON_TEXT);
      });

      it('the focus ring is visible on every surface it can sit beside', () => {
        // The ring is drawn with an offset (FOCUS_RING), so what it must contrast
        // with is the background, not the component it surrounds.
        for (const [surfaceName, surface] of [
          ['surface', tokens.surface],
          ['canvas', tokens.canvas],
          ['raised', tokens.raised],
          ['sunken', tokens.sunken],
        ] as const) {
          expect(
            contrast(tokens.focus, surface),
            `focus on ${surfaceName} in ${name}`
          ).toBeGreaterThanOrEqual(NON_TEXT);
        }
      });

      it('a flush ring against the brand fill has its own usable colour', () => {
        // Teal on terracotta measures 1.05:1 in light mode. Any implementation
        // that draws a focus ring flush against the CTA must use focusOnBrand.
        expect(
          contrast(tokens.focusOnBrand, tokens.brandButton),
          `focusOnBrand on brandButton in ${name}`
        ).toBeGreaterThanOrEqual(NON_TEXT);
        expect(tokens.focusOnBrand).not.toBe(tokens.focus);
      });

      it('the offset is wide enough to keep the ring off the component', () => {
        // This is what resolves the focus/brand conflict: the ring is never
        // adjacent to the fill, so one colour is enough.
        expect(FOCUS_RING.offset).toBeGreaterThanOrEqual(2);
        expect(FOCUS_RING.width).toBeGreaterThanOrEqual(2);
      });

      it('a card is distinguishable from the canvas behind it', () => {
        // "Tonal depth before shadow depth" only works if there is a tone to see.
        expect(
          contrast(tokens.surface, tokens.canvas),
          `surface vs canvas in ${name}`
        ).toBeGreaterThan(1.02);
      });

      it('a raised surface reads as above the surface it sits on', () => {
        // Light mode has no lighter white, so a raised surface is the same colour
        // as a card and is separated by shadow instead. Dark mode has room for
        // tone and must use it, because dark mode also gets weaker shadows.
        if (name === 'dark') {
          expect(
            contrast(tokens.raised, tokens.surface),
            `raised vs surface in ${name}`
          ).toBeGreaterThan(1.1);
        } else {
          expect(tokens.raised).toBe(tokens.surface);
        }
        expect(
          contrast(tokens.raised, tokens.canvas),
          `raised vs canvas in ${name}`
        ).toBeGreaterThan(1.1);
      });

      it('sunken sits below the canvas so inputs read as recessed', () => {
        expect(contrast(tokens.sunken, tokens.canvas)).toBeGreaterThan(1.02);
      });

      it('the decorative border is subtle, not invisible', () => {
        // Grouping only, so it is held to a floor rather than to 3:1.
        expect(contrast(tokens.borderSubtle, tokens.surface)).toBeGreaterThan(1.4);
      });
    });
  }
});

describe('no token is an accidental duplicate of another in the same theme', () => {
  /**
   * Identical values under two names is how a theme rots: a component reads the
   * token that was not meant to change and nothing moves. Some pairs are
   * deliberate and are listed here with the reason.
   */
  const INTENTIONAL: Record<string, string[]> = {
    light: [
      // White is the label colour on the white-on-brand button; there is no
      // second "text on brand" token in light mode.
      'surface === brandText',
      'surface === languageText',
      'raised === brandText',
      'raised === languageText',
      'brandText === languageText',
      // Light brand is already dark enough for white text, so the CTA fill is
      // the brand itself.
      'brand === brandButton',
      'brandHover === brandButtonHover',
      'brandPressed === brandButtonPressed',
      // Focus is the language teal by design: one teal, two roles.
      'language === focus',
      // Light mode has no lighter white, so a raised surface is a card-coloured
      // surface separated by shadow rather than by tone.
      'surface === raised',
      // White is the only colour that reads on the terracotta fill, so it serves
      // as the label, the on-brand chip text and the flush focus ring.
      'brandText === focusOnBrand',
      'languageText === focusOnBrand',
      'surface === focusOnBrand',
      'raised === focusOnBrand',
    ],
    dark: [
      'sunken === languageText',
      'language === focus',
      'brandText === focusOnBrand',
    ],
  };

  for (const { name, tokens } of THEMES) {
    it(`${name} has no accidental duplicates`, () => {
      const entries = Object.entries(tokens);
      const collisions: string[] = [];
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const [aName, aValue] = entries[i];
          const [bName, bValue] = entries[j];
          if (aValue === bValue) collisions.push(`${aName} === ${bName}`);
        }
      }
      const allowed = INTENTIONAL[name] ?? [];
      expect(collisions.filter(c => !allowed.includes(c))).toEqual([]);
    });
  }
});

describe('token shape', () => {
  it('both themes define exactly the same tokens', () => {
    expect(Object.keys(LIGHT).sort()).toEqual(Object.keys(DARK).sort());
  });

  it('every value is a 6-digit hex colour', () => {
    for (const { name, tokens } of THEMES) {
      for (const [token, value] of Object.entries(tokens)) {
        expect(value, `${name}.${token}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('is addressed by kebab-case custom property names', () => {
    expect(cssVarName('brand')).toBe('--color-brand');
    expect(cssVarName('borderInteractive')).toBe('--color-border-interactive');
    expect(cssVarName('surfaceSoft')).toBe('--color-surface-soft');
  });

  it('cssVariables exposes every token as channels, not hex', () => {
    const vars = cssVariables('dark');
    expect(Object.keys(vars)).toHaveLength(Object.keys(DARK).length);

    /*
      The generated utilities are `rgb(var(--color-x) / <alpha-value>)`, which only
      parses when the variable holds channels. Asserting the raw hex here would let
      the two definitions drift apart again, and the symptom is a background that
      silently renders as nothing rather than an error.
    */
    expect(vars['--color-canvas']).toMatch(/^\d+ \d+ \d+$/);

    const hex = DARK.canvas.replace('#', '');
    const channels = hex.match(/../g)!.map(h => parseInt(h, 16));
    expect(vars['--color-canvas']).toBe(channels.join(' '));
  });

  it('resolves to the requested theme', () => {
    expect(TOKENS.light.canvas).toBe(LIGHT.canvas);
    expect(TOKENS.dark.canvas).toBe(DARK.canvas);
  });
});

describe('generated files match the tokens', () => {
  const css = readFileSync('global.css', 'utf8');

  it('global.css defines every token in both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const [token, value] of Object.entries(TOKENS[theme])) {
        const [r, g, b] = hexToRgb(value).map(c => Math.round(c * 255));
        const declaration = `${cssVarName(token as keyof typeof LIGHT)}: ${r} ${g} ${b};`;
        expect(css, `${theme} ${token} missing or stale in global.css`).toContain(declaration);
      }
    }
  });

  it('global.css scopes dark to any .dark element, not only html', () => {
    // Scoping to `html` themes the web and leaves native permanently light.
    expect(css).toMatch(/^\s*\.dark\s*\{/m);
    expect(css).not.toMatch(/^\s*html\.dark\s*\{/m);
  });

  it('global.css uses Tailwind 3 directives', () => {
    expect(css).toContain('@tailwind base;');
    expect(css).toContain('@tailwind components;');
    expect(css).toContain('@tailwind utilities;');
    // Tailwind 4 syntax that Tailwind 3 silently ignores, which is how the
    // previous stylesheet ended up doing nothing.
    expect(css).not.toContain('@import "tailwindcss"');
    expect(css).not.toContain('@theme');
  });

  it('maps filled actions to brandButton rather than the foreground brand', () => {
    const { colors } = JSON.parse(
      readFileSync('src/design/tailwind-colors.generated.json', 'utf8')
    ) as { colors: { action: { DEFAULT: string; text: string } } };

    expect(colors.action.DEFAULT).toContain('--color-brand-button');
    expect(colors.action.text).toContain('--color-brand-text');
  });

  it('the Tailwind colour map points only at defined tokens', () => {
    const { colors } = JSON.parse(
      readFileSync('src/design/tailwind-colors.generated.json', 'utf8')
    ) as { colors: Record<string, unknown> };

    const referenced = new Set<string>();
    const walk = (node: unknown) => {
      if (typeof node === 'string') {
        const match = node.match(/var\((--color-[a-z-]+)\)/);
        if (match) referenced.add(match[1]);
      } else if (node && typeof node === 'object') {
        Object.values(node).forEach(walk);
      }
    };
    walk(colors);

    const defined = new Set(
      [...Object.keys(LIGHT), ...Object.keys(DARK)].map(t => cssVarName(t as keyof typeof LIGHT))
    );

    const dangling = [...referenced].filter(name => !defined.has(name));
    expect(dangling).toEqual([]);
  });
});

describe('the UI specification stays in sync with the tokens', () => {
  const V2 = 'MISSION_COACH_UI_UX_DESIGN_SYSTEM_v2.md';
  const V1 = 'MISSION_COACH_COMPLETE_UI_UX_DESIGN_SYSTEM_2026_v1 (1).md';

  const spec = readFileSync(V2, 'utf8');

  it('has balanced generator markers so regeneration is possible', () => {
    // A spec whose generated regions cannot be regenerated will drift silently,
    // which is the exact failure this document replaced.
    for (const name of ['palette', 'typography']) {
      expect(spec, `missing BEGIN marker for ${name}`).toContain(
        `<!-- BEGIN GENERATED:${name} -->`
      );
      expect(spec, `missing END marker for ${name}`).toContain(
        `<!-- END GENERATED:${name} -->`
      );
    }
    expect(spec).not.toContain('<!-- GENERATED:');
  });

  it('declares exactly two generated regions', () => {
    expect(spec.match(/BEGIN GENERATED:/g)).toHaveLength(2);
    expect(spec.match(/END GENERATED:/g)).toHaveLength(2);
  });

  it('publishes every token value for both themes', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const value of Object.values(TOKENS[theme])) {
        expect(spec, `${theme} value ${value}`).toContain(`\`${value}\``);
      }
    }
  });

  it('publishes every type role at its real size', () => {
    for (const [role, spec_] of Object.entries(TYPE)) {
      expect(spec, `type role ${role}`).toContain(`\`${role}\``);
      expect(spec, `type size ${spec_.fontSize}`).toContain(`| ${spec_.fontSize} |`);
    }
  });

  it('does not reintroduce the superseded brand value', () => {
    // #B4533A was the old brand. It may appear in the dark CTA slot where it is
    // still correct, but never as the light brand.
    expect(spec).not.toContain('| `brand` | `#B4533A` |');
  });

  it('does not reintroduce the failing interactive border', () => {
    // 2.90:1 on canvas. Unusable.
    expect(spec).not.toContain('#958A7D');
  });

  it('does not require Tamagui', () => {
    expect(spec).not.toMatch(/Tamagui (is required|must)/i);
    expect(spec).toMatch(/Tamagui is not used/i);
  });

  it('states both corrected skill thresholds', () => {
    expect(spec).toContain('≥ 2 contexts');
    expect(spec).toContain('≥ 4 contexts');
    expect(spec).toContain('3 days');
  });

  it('keeps the reduced QA tier as the required one', () => {
    expect(spec).toMatch(/36 snapshots/i);
    // The old 1,120 matrix is named once, in the authority section, as something
    // this document corrects. What matters is that it is not the requirement.
    const mentions = spec.match(/1,120/g) ?? [];
    expect(mentions.length).toBeLessThanOrEqual(1);
    expect(spec).toMatch(/pr-blocking visual regression/i);
  });

  it('carries authority, precedence and supersession', () => {
    expect(spec).toMatch(/PRECEDENCE/i);
    expect(spec).toMatch(/Supersedes:/i);
    expect(spec).toContain('src/design/tokens.ts');
    expect(spec).toMatch(/IndexedDB/i);
    expect(spec).toMatch(/RTL|Right-to-left/i);
    expect(spec).toMatch(/ContinueCard/i);
  });

  it('is marked superseded in v1 so its values cannot be copied blind', () => {
    const v1 = readFileSync(V1, 'utf8');

    expect(v1).toMatch(/SUPERSEDED/i);
    expect(v1).toContain(V2);
    expect(v1).toMatch(/research input only/i);
    // The banner must appear before the original body, or it reads as a footnote.
    expect(v1.indexOf('SUPERSEDED')).toBeLessThan(v1.indexOf('Why this document exists'));
  });
});

describe('no screen uses sub-floor type', () => {
  it('has no arbitrary text size below the 12px floor', () => {
    // The floor is not advisory: it was 49 sites, and it silently grew back twice
    // because nothing failed when it did.
    const offenders: Array<{ file: string; size: string }> = [];

    for (const file of globSync('src/**/*.tsx', { cwd: process.cwd() })) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/text-\[(\d+)px\]/g)) {
        const size = Number(match[1]);
        if (size < MIN_READABLE_PX) offenders.push({ file, size: `${size}px` });
      }
    }

    expect(offenders).toEqual([]);
  });

  it('enforces the floor on inline style objects too', () => {
    /*
      The className scan above cannot see a style object, and that is not a
      hypothetical gap: `tabBarLabelStyle: { fontSize: 10 }` shipped a 10px tab
      label past a guard that reported the floor as clean. React Navigation screen
      options are style objects, so this is a live path, not a theoretical one.
    */
    const offenders: Array<{ file: string; size: string }> = [];
    const allowed = new Set([12, 13, 14, 15, 16, 17, 18, 20, 24, 26, 28, 32]);

    for (const file of globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() })) {
      const source = readFileSync(file, 'utf8');

      // `fontSize: 12` in a style object, ignoring matches inside prose/comments.
      for (const match of source.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)/g)) {
        const size = Number(match[1]);
        if (size < MIN_READABLE_PX || !allowed.has(size)) {
          offenders.push({ file, size: `${size}px` });
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('has no arbitrary text size above the scale either', () => {
    // Invented sizes are as much a drift risk as undersized ones: a screen that
    // invents 15.5px has stopped reading the type scale at all.
    const allowed = new Set([12, 13, 14, 15, 16, 17, 18, 20, 24, 26, 28, 32]);
    const offenders: Array<{ file: string; size: string }> = [];

    for (const file of globSync('src/**/*.tsx', { cwd: process.cwd() })) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/text-\[(\d+)px\]/g)) {
        const size = Number(match[1]);
        if (!allowed.has(size)) offenders.push({ file, size: `${size}px` });
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('no source file references a token that does not exist', () => {
  it('every var(--color-*) in src is defined by the palette', () => {
    const defined = new Set(
      Object.keys(LIGHT).map(t => cssVarName(t as keyof typeof LIGHT))
    );

    const files = globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() })
      .filter(f => !f.includes('design/tokens'));

    const dangling: Array<{ file: string; name: string }> = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/var\((--color-[a-z-]+)\)/g)) {
        if (!defined.has(match[1])) dangling.push({ file, name: match[1] });
      }
    }

    expect(dangling).toEqual([]);
  });

  it('no screen still uses the removed faint role', () => {
    const files = globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
    const offenders = files.filter(f =>
      /\btext-faint\b|\btext-heading\b/.test(readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});

describe('typography', () => {
  it('has no role below the readable floor', () => {
    for (const [role, spec] of Object.entries(TYPE)) {
      expect(
        spec.fontSize,
        `${role} is ${spec.fontSize}px, below the ${MIN_READABLE_PX}px floor`
      ).toBeGreaterThanOrEqual(MIN_READABLE_PX);
    }
  });

  it('keeps line height comfortable at every role', () => {
    for (const [role, spec] of Object.entries(TYPE)) {
      expect(spec.lineHeight / spec.fontSize, `${role} line height`).toBeGreaterThan(1.15);
    }
  });

  it('makes the conversation line the largest body role', () => {
    expect(TYPE.conversation.fontSize).toBeGreaterThan(TYPE.bodyLg.fontSize);
  });
});

describe('layout and targets', () => {
  it('keeps the touch target at the platform minimum', () => {
    expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(48);
  });

  it('offers only the documented spacing scale', () => {
    // The spec explicitly forbids inventing 13/17/19/23.
    expect(Object.values(SPACE)).not.toContain(13);
    expect(Object.values(SPACE)).not.toContain(17);
    expect(Object.values(SPACE)).not.toContain(19);
    expect(Object.values(SPACE)).not.toContain(23);
  });

  it('maps widths to the mobile-first phone/tablet/desktop tiers', () => {
    expect(layoutForWidth(390)).toBe('phone');
    expect(layoutForWidth(600)).toBe('tablet');
    expect(layoutForWidth(844)).toBe('tablet');
    expect(layoutForWidth(1024)).toBe('desktop');
    expect(layoutForWidth(1600)).toBe('desktop');
  });

  it('treats the canonical boundaries as belonging to the wider tier', () => {
    expect(layoutForWidth(599)).toBe('phone');
    expect(layoutForWidth(600)).toBe('tablet');
    expect(layoutForWidth(1023)).toBe('tablet');
    expect(layoutForWidth(1024)).toBe('desktop');
  });

  it('keeps every shared button size at or above the 48px target', () => {
    const ui = readFileSync('src/components/ui.tsx', 'utf8');
    expect(ui).toContain("sm: 'min-h-12");
    expect(ui).toContain("md: 'min-h-12");
    expect(ui).toContain("lg: 'min-h-14");
  });

  it('uses the dark-safe action fill for the primary button', () => {
    const ui = readFileSync('src/components/ui.tsx', 'utf8');
    expect(ui).toContain('bg-action');
    expect(ui).toContain('text-action-text');
    expect(ui).not.toMatch(/primary:\s*'[^']*bg-primary\b/);
  });
});

describe('mobile-first learner route architecture', () => {
  it('uses route screens for briefing and recap instead of the legacy modal components', () => {
    expect(existsSync('src/app/mission/[missionId].tsx')).toBe(true);
    expect(existsSync('src/components/MissionBriefingScreen.tsx')).toBe(true);
    expect(existsSync('src/components/RecapScreen.tsx')).toBe(true);

    expect(existsSync('src/components/MissionBriefingModal.tsx')).toBe(false);
    expect(existsSync('src/components/RecapModal.tsx')).toBe(false);
    expect(existsSync('src/components/SettingsModal.tsx')).toBe(false);
  });

  it('routes Talk and Missions through the governed briefing screen', () => {
    const talk = readFileSync('src/app/(tabs)/index.tsx', 'utf8');
    const missions = readFileSync('src/app/(tabs)/missions.tsx', 'utf8');

    expect(talk).toContain("pathname: '/mission/[missionId]'");
    expect(missions).toContain("pathname: '/mission/[missionId]'");
    expect(talk).not.toContain('MissionBriefingModal');
    expect(missions).not.toContain('MissionBriefingModal');
  });

  it('keeps meaning and coaching support secondary in the live conversation', () => {
    const live = readFileSync('src/components/LiveSessionView.tsx', 'utf8');

    expect(live).toContain('size="compact"');
    expect(live).toContain('visible={showHelpSheet}');
    expect(live).toContain('visible={showMeaningLine && Boolean(latestAssistantPassage?.meaning)}');
  });
});
