import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('phrase drill evidence flow', () => {
  it('never substitutes the displayed target form for learner production', () => {
    const source = readFileSync(
      'src/components/DuePhrasesPracticeModal.tsx',
      'utf8'
    );

    expect(source).not.toContain(
      'userTranscript || typedAnswer || currentPhrase.form'
    );
    expect(source).toContain(
      'const learnerQuote = (userTranscript || typedAnswer).trim()'
    );
    expect(source).toContain(
      "const effectiveResult = learnerQuote ? result : 'supported'"
    );
    expect(source).toContain('if (learnerQuote) {');
  });

  it('records briefing reveal as phrase-scoped production support before session start', () => {
    const briefing = readFileSync(
      'src/components/MissionBriefingScreen.tsx',
      'utf8'
    );
    const route = readFileSync('src/app/mission/[missionId].tsx', 'utf8');

    expect(briefing).toContain('setPreviewedSupport(true)');
    expect(briefing).toContain('previewedPhraseIds');
    expect(route).toContain("kind: 'briefing_exposure'");
    expect(route).toContain('targetPhraseId: phraseId');
    expect(route).toContain('targetItemIds: [phraseId]');
  });
});
