/**
 * Regenerates docs/PHASE_1H_OPPORTUNITY_REVIEW.md from the authored scene catalogue.
 *
 * Run with: npx tsx scripts/generate-opportunity-review.mts
 *
 * The point is that the Phase 1H review list should be derived, never maintained by
 * hand. A hand-maintained list of what still needs review is stale the moment content
 * changes, and a stale review list is worse than none: it reads as coverage.
 *
 * A committed catalogue that says "these all have bands" is not evidence that they do.
 * This script reads the same objects the runtime reads, so it cannot disagree with them.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCENES } from '../src/content/scenes';
import type { SceneDefinition } from '../src/contracts/scene';

interface Row {
  sceneId: string;
  sceneReview: string;
  opportunityId: string;
  skillId: string;
  band: string;
  channel: string;
  modalities: string;
}

function collect(): Row[] {
  const rows: Row[] = [];

  for (const scene of Object.values(SCENES) as SceneDefinition[]) {
    for (const opportunity of scene.opportunityDefinitions ?? []) {
      rows.push({
        sceneId: scene.id,
        sceneReview: scene.reviewStatus,
        opportunityId: opportunity.id,
        skillId: opportunity.skillId,
        band: opportunity.evidenceBand ?? '—',
        channel: opportunity.assessedChannel ?? '—',
        modalities: (opportunity.eligibleModalities ?? []).join(', ') || '—',
      });
    }
  }

  return rows.sort((a, b) => a.opportunityId.localeCompare(b.opportunityId));
}

const rows = collect();
const unreleased = rows.filter(row => row.sceneReview !== 'released');
const missingBand = rows.filter(row => row.band === '—');
const missingChannel = rows.filter(row => row.channel === '—');
const missingBoth = rows.filter(row => row.band === '—' && row.channel === '—');

const byScene = new Map<string, number>();
for (const row of rows) byScene.set(row.sceneId, (byScene.get(row.sceneId) ?? 0) + 1);

const lines: string[] = [];

lines.push('# Phase 1H — authored opportunity qualification review list');
lines.push('');
lines.push('**Generated:** do not edit by hand. Regenerate with `npx tsx scripts/generate-opportunity-review.mts`.');
lines.push('');
lines.push(
  'Derived from the authored scene catalogue, read the same way the runtime reads it. ' +
    'This file lists what a human reviewer still has to decide. It is not evidence that ' +
    'any row has been reviewed.'
);
lines.push('');
lines.push('## Status');
lines.push('');
lines.push(`- Authored opportunities: **${rows.length}**`);
lines.push(`- In scenes not marked \`released\`: **${unreleased.length}**`);
lines.push(`- Missing \`evidenceBand\`: **${missingBand.length}**`);
lines.push(`- Missing \`assessedChannel\`: **${missingChannel.length}**`);
lines.push(`- Missing both: **${missingBoth.length}**`);
lines.push('');
lines.push(
  '`SceneOpportunity` declares `evidenceBand`, `assessedChannel` and `eligibleModalities` ' +
    'as optional, so an unqualified opportunity compiles and runs. Nothing fails until a ' +
    'learner\'s evidence is judged against it, which is why this cannot be closed by a ' +
    'passing test suite.'
);
lines.push('');
lines.push('## What a reviewer decides, per opportunity');
lines.push('');
lines.push('1. **Evidence band** — the authored demand the rubric actually holds, not the mission display band.');
lines.push('2. **Assessed channel** — production, comprehension, or both. Determines which performances can qualify.');
lines.push('3. **Eligible modalities** — whether typed production can satisfy this opportunity at all.');
lines.push('');
lines.push(
  'A reviewer who cannot defend the band from the opportunity\'s own trigger, exposure and ' +
    'rubric should record it as undecided rather than guessing. An undecided band must stay ' +
    'invisible to promotion, which the validators already enforce.'
);
lines.push('');
lines.push('## Review list');
lines.push('');
lines.push('| Opportunity | Scene | Scene review | Skill | Band | Channel | Modalities |');
lines.push('|---|---|---|---|---|---|---|');

for (const row of rows) {
  lines.push(
    `| \`${row.opportunityId}\` | \`${row.sceneId}\` | ${row.sceneReview} | \`${row.skillId}\` | ${row.band} | ${row.channel} | ${row.modalities} |`
  );
}

lines.push('');
lines.push('## Per-scene counts');
lines.push('');
lines.push('| Scene | Opportunities |');
lines.push('|---|---:|');
for (const [sceneId, count] of [...byScene.entries()].sort()) {
  lines.push(`| \`${sceneId}\` | ${count} |`);
}
lines.push('');

const target = join(process.cwd(), 'docs', 'PHASE_1H_OPPORTUNITY_REVIEW.md');
writeFileSync(target, lines.join('\n'), 'utf8');

console.log(
  `Wrote ${target}: ${rows.length} opportunities, ${missingBoth.length} missing band and channel.`
);
