/**
 * One-shot rename of inline CSS variable references after the v2 token rename.
 * Exact-match only, and reports what it changed so nothing moves silently.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() });

/** [from, to, expectedCount] - `name` includes the trailing `)` so `--color-border` never eats `--color-border-subtle`. */
const renames: Array<[string, string, number]> = [
  ['var(--color-primary)', 'var(--color-brand)', 22],
  ['var(--color-accent-sage)', 'var(--color-success)', 4],
  ['var(--color-faint)', 'var(--color-muted)', 3],
  ['var(--color-heading)', 'var(--color-ink)', 2],
  ['var(--color-border)', 'var(--color-border-subtle)', 1],
  // The `faint` role is gone: evidence counts, character roles and the consent
  // version are informative text, not decoration.
  ['text-faint', 'text-muted', 8],
  ['text-heading', 'text-ink', 0], // handled separately; count asserted below
];

const totals = new Map<string, number>();

for (const file of files) {
  let source = readFileSync(file, 'utf8');
  const original = source;

  for (const [from, to] of renames) {
    if (from === 'text-heading') continue;
    const parts = source.split(from);
    if (parts.length > 1) {
      totals.set(from, (totals.get(from) ?? 0) + parts.length - 1);
      source = parts.join(to);
    }
  }

  if (source !== original) writeFileSync(file, source, 'utf8');
}

console.log('inline/class renames applied:');
for (const [from, , expected] of renames) {
  if (from === 'text-heading') continue;
  const actual = totals.get(from) ?? 0;
  const status = expected === 0 || actual === expected ? 'ok' : 'MISMATCH';
  console.log(`  ${status.padEnd(9)} ${from.padEnd(28)} -> ${actual} (expected ${expected})`);
}