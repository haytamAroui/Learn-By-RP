/**
 * Injects the palette and typography tables into the v2 UI specification.
 *
 * The specification is prose, and prose is exactly where a stale colour value
 * survives: v1 carried a palette that had already failed contrast while reading as
 * authoritative. So the tables are generated from the token file and the document
 * holds markers, not numbers. `tests/design.test.ts` asserts the document is in
 * sync, which means a drifted palette is a failing test rather than a future
 * developer's typo.
 *
 * Run after changing tokens:  node scripts/generate-spec.mts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { LIGHT, DARK, TYPE, cssVarName } from '../src/design/tokens.ts';

const SPEC = 'MISSION_COACH_UI_UX_DESIGN_SYSTEM_v2.md';

const SPEC_TOKEN_LABELS: Record<string, string> = {
  canvas: 'App background',
  surface: 'Cards, main panels',
  surfaceSoft: 'Neutral secondary panel',
  sunken: 'Recessed: inputs, wells',
  surfaceHover: 'Hover on a canvas-level surface',
  raised: 'Dialogs, popovers, floating support',
  borderSubtle: 'Grouping only — not a control boundary',
  borderInteractive: 'Any control the user must see and hit',
  ink: 'Highest emphasis',
  body: 'Normal body',
  muted: 'Secondary labels, metadata, dates',
  brand: 'Primary action',
  brandHover: 'Primary action hover',
  brandPressed: 'Primary action pressed',
  brandSoft: 'Warm highlighted / selected card',
  brandButton: 'CTA fill',
  brandText: 'Label on a brand fill',
  language: 'Target-language semantics',
  languageHover: 'Target-language hover',
  languageSoft: 'Phrase card background',
  languageText: 'Label on a language fill',
  success: 'Verified positive evidence',
  successSoft: 'Positive surface',
  warning: 'Assisted, partial, pending, degraded',
  warningSoft: 'Attention surface',
  danger: 'Destructive, hard error',
  dangerSoft: 'Error surface',
  info: 'Informational',
  infoSoft: 'Informational surface',
  focus: 'Focus ring',
  focusOnBrand: 'Focus ring against a brand fill',
};

function paletteTable(tokens: Record<string, string>): string {
  const rows = Object.entries(tokens).map(([token, value]) => {
    const label = SPEC_TOKEN_LABELS[token] ?? token;
    return `| \`${cssVarName(token as keyof typeof LIGHT).replace('--color-', '')}\` | \`${value}\` | ${label} |`;
  });

  return ['| Token | Value | Use |', '|---|---|---|', ...rows].join('\n');
}

function typographyTable(): string {
  const rows = Object.entries(TYPE).map(([role, spec]) => {
    const weight =
      typeof spec.fontWeight === 'number' ? spec.fontWeight : Number(spec.fontWeight);
    return `| \`${role}\` | ${spec.fontSize} | ${spec.lineHeight} | ${weight} |`;
  });

  return ['| Role | Size | Line height | Weight |', '|---|---:|---:|---:|', ...rows].join('\n');
}

/**
 * Replaces the region between two markers.
 *
 * Uses BEGIN/END delimiters rather than a single marker so the generator is
 * idempotent: running it twice produces the same file. A one-shot marker would be
 * consumed on first run and the second run would fail, which makes `npm run
 * generate` unsafe to run twice in a row.
 */
function replaceRegion(source: string, name: string, body: string): string {
  const begin = `<!-- BEGIN GENERATED:${name} -->`;
  const end = `<!-- END GENERATED:${name} -->`;

  const start = source.indexOf(begin);
  const stop = source.indexOf(end);

  if (start === -1 || stop === -1 || stop < start) {
    throw new Error(
      `Markers not found in ${SPEC}: ${name}\n` +
        'The document structure changed; update this generator rather than editing values by hand.'
    );
  }

  return `${source.slice(0, start + begin.length)}\n${body}\n${source.slice(stop)}`;
}

const spec = readFileSync(SPEC, 'utf8');

const updated = replaceRegion(spec, 'palette', paletteTable(LIGHT) + '\n\n**Dark theme**\n\n' + paletteTable(DARK));
const withTypography = replaceRegion(updated, 'typography', typographyTable());

writeFileSync(SPEC, withTypography, 'utf8');
console.log(
  `updated ${SPEC}: ${Object.keys(LIGHT).length} light + ${Object.keys(DARK).length} dark tokens, ` +
    `${Object.keys(TYPE).length} type roles`
);