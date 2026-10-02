import { describe, expect, it } from 'vitest';
import { buildCoachFallback } from './coachFallback';

describe('coach fallback templates', () => {
  it('uses the exact scoped target phrase for a full-form fallback', () => {
    expect(
      buildCoachFallback({
        step: 'full_form',
        targetLanguage: 'Dutch',
        characterName: 'Noor',
        targetPhraseForm: 'Heeft u havermelk?',
      })
    ).toContain('Heeft u havermelk?');
  });

  it('does not inject Spanish examples into unrelated target languages', () => {
    const hint = buildCoachFallback({
      step: 'partial_form',
      targetLanguage: 'French',
      characterName: 'Camille',
      targetPhraseForm: 'Je voudrais un café, s’il vous plaît.',
    });

    expect(hint).toContain('Je voudrais un');
    expect(hint).not.toMatch(/Un café con|Tiene leche/i);
  });

  it('keeps explanation separate from answer generation', () => {
    const hint = buildCoachFallback({
      step: 'explanation',
      targetLanguage: 'Dutch',
      characterName: 'Noor',
      lastAssistantLine: 'Wilt u het meenemen of hier drinken?',
    });

    expect(hint).toContain('Wilt u het meenemen of hier drinken?');
  });
});
