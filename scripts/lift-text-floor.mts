import { readFileSync, writeFileSync, globSync } from 'node:fs';

/**
 * Lifts every sub-floor text size to `text-xs` (12px).
 *
 * 12px is the documented floor in the v2 spec. The sites being replaced are
 * metadata: consent versions, dates, evidence labels, counts - all informative,
 * none of them decorative, so none of them belong below the floor.
 */
const files = globSync('src/**/*.{ts,tsx}', { cwd: process.cwd() });
const totals = new Map<string, number>();

for (const file of files) {
  let source = readFileSync(file, 'utf8');
  const original = source;

  for (const size of ['9px', '10px', '11px']) {
    const from = `text-[${size}]`;
    const parts = source.split(from);
    if (parts.length > 1) {
      totals.set(size, (totals.get(size) ?? 0) + parts.length - 1);
      source = parts.join('text-xs');
    }
  }

  if (source !== original) writeFileSync(file, source, 'utf8');
}

for (const [size, count] of totals) console.log(`text-[${size}] -> text-xs : ${count}`);
console.log(`total lifted: ${[...totals.values()].reduce((a, b) => a + b, 0)}`);