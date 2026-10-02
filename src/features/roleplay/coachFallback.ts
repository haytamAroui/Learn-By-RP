export type CoachSupportStep =
  | 'intent_hint'
  | 'partial_form'
  | 'full_form'
  | 'explanation';

export function buildCoachFallback(input: {
  step: CoachSupportStep;
  targetLanguage: string;
  characterName: string;
  targetPhraseForm?: string;
  lastAssistantLine?: string;
}): string {
  const {
    step,
    targetLanguage,
    characterName,
    targetPhraseForm = '',
    lastAssistantLine = '',
  } = input;

  const phrase = targetPhraseForm.trim();
  const starter = phrase
    ? phrase.split(/\s+/).slice(0, Math.min(3, phrase.split(/\s+/).length)).join(' ')
    : '';

  switch (step) {
    case 'intent_hint':
      return `Focus on the communicative goal in ${targetLanguage}: say what you need clearly; a short natural message is enough.`;
    case 'partial_form':
      return starter
        ? `Start with: “${starter}…” and finish the idea in ${targetLanguage}.`
        : `Use a short ${targetLanguage} request starter, then add the key item or condition.`;
    case 'full_form':
      return phrase
        ? `A complete model you can use is: “${phrase}”.`
        : `Use one short, complete sentence in ${targetLanguage} that directly expresses your goal.`;
    case 'explanation':
      return lastAssistantLine
        ? `${characterName} said: “${lastAssistantLine}”. Focus on the key words that change what you need to do next.`
        : `Review what ${characterName} just asked and identify the key condition before answering.`;
  }
}
