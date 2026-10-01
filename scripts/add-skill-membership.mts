/**
 * Inserts curated skill membership into each mission definition.
 *
 * Membership is authored, not inferred: which skills a mission teaches is a
 * content decision, and inferring it from intent strings would recreate exactly
 * the heuristic coupling this contract exists to remove. Run once; asserts that
 * every mission received exactly one insert.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MEMBERSHIP: Record<string, { primary: string[]; secondary: string[] }> = {
  // Cafes / food
  'mission-es-cafe-sol': {
    primary: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondary: ['skill-propose-alternative', 'skill-communicative-repair'],
  },
  'mission-es-la-terraza': {
    primary: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondary: ['skill-request-substitution'],
  },
  'mission-fr-boulangerie': {
    primary: ['skill-inquire-specifications'],
    secondary: ['skill-request-substitution', 'skill-communicative-repair'],
  },
  'mission-fr-bistro': {
    primary: ['skill-inquire-specifications', 'skill-propose-alternative'],
    secondary: ['skill-request-substitution'],
  },
  'mission-de-baeckerei': {
    primary: ['skill-request-substitution'],
    secondary: ['skill-inquire-specifications', 'skill-communicative-repair'],
  },
  'mission-de-gasthaus': {
    primary: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondary: ['skill-request-substitution'],
  },
  'mission-it-bar-portico': {
    primary: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-it-trattoria': {
    primary: ['skill-request-substitution', 'skill-propose-alternative'],
    secondary: ['skill-inquire-specifications'],
  },
  'mission-ja-izakaya': {
    primary: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },

  // Transit
  'mission-es-metro-station': {
    primary: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-fr-kiosque': {
    primary: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-de-ubahn': {
    primary: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-it-stazione': {
    primary: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-ja-eki': {
    primary: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },

  // Pharmacy / problems
  'mission-es-farmacia-sol': {
    primary: ['skill-inquire-specifications', 'skill-communicative-repair'],
    secondary: ['skill-request-substitution'],
  },
  'mission-fr-pharmacie': {
    primary: ['skill-inquire-specifications', 'skill-communicative-repair'],
    secondary: ['skill-request-substitution'],
  },
  'mission-de-apotheke': {
    primary: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-it-farmacia': {
    primary: ['skill-inquire-specifications'],
    secondary: ['skill-request-substitution', 'skill-communicative-repair'],
  },
  'mission-ja-yakkyoku': {
    primary: ['skill-inquire-specifications', 'skill-request-substitution'],
    secondary: ['skill-communicative-repair'],
  },

  // Services / social
  'mission-es-parcel-counter': {
    primary: ['skill-inquire-specifications', 'skill-propose-alternative'],
    secondary: ['skill-communicative-repair'],
  },
  'mission-es-neighbors-door': {
    primary: ['skill-propose-alternative', 'skill-communicative-repair'],
    secondary: ['skill-inquire-specifications'],
  },
  'mission-ja-konbini': {
    primary: ['skill-request-substitution', 'skill-communicative-repair'],
    secondary: ['skill-inquire-specifications'],
  },
};

const format = (ids: string[]) =>
  `[${ids.map(id => `'${id}'`).join(', ')}]`;

const path = 'src/data/missions.ts';
let source = readFileSync(path, 'utf8');

const inserted: string[] = [];
const skipped: string[] = [];

for (const [missionId, membership] of Object.entries(MEMBERSHIP)) {
  // Anchor on the mission id, then the targetIntents array that follows it.
  const anchor = new RegExp(
    `(id: '${missionId}',[\\s\\S]{0,4000}?\\n(\\s*)targetIntents: \\[[^\\]]*\\],)`,
    'm'
  );
  const match = source.match(anchor);
  if (!match) {
    skipped.push(missionId);
    continue;
  }

  const indent = match[2];
  const addition =
    `${match[1]}\n${indent}primarySkillIds: ${format(membership.primary)},\n` +
    `${indent}secondarySkillIds: ${format(membership.secondary)},`;

  source = source.replace(anchor, addition);
  inserted.push(missionId);
}

writeFileSync(path, source, 'utf8');

console.log(`inserted: ${inserted.length}`);
console.log(`skipped:  ${skipped.length}${skipped.length ? ` -> ${skipped.join(', ')}` : ''}`);

const ids = [...source.matchAll(/id: '(mission-[a-z0-9-]+)'/g)].map(m => m[1]);
console.log(`missions in file: ${ids.length}`);
console.log(`with primarySkillIds: ${(source.match(/primarySkillIds:/g) || []).length}`);
console.log(`with secondarySkillIds: ${(source.match(/secondarySkillIds:/g) || []).length}`);