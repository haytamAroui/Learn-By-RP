import { describe, expect, it } from 'vitest';
import { generateDutchActorFallback } from './dutchActorFallback';

describe('Dutch actor fallback', () => {
  it('answers in Dutch for a coffee turn when the structured provider is unavailable', () => {
    const reply = generateDutchActorFallback('Een koffie met melk, alstublieft.');
    expect(reply.replyText).toBe('Natuurlijk. Wilt u er melk of suiker bij?');
    expect(reply.meaning).toBe('Of course. Would you like milk or sugar with that?');
    expect(reply.proposedAction).toBeNull();
  });

  it('never switches a Belgian Dutch fallback turn to Spanish', () => {
    const reply = generateDutchActorFallback('Kunt u mij helpen?');
    expect(reply.replyText).toBe('Goeiedag! Waarmee kan ik u helpen?');
    expect(reply.replyText).not.toMatch(/[¡¿áéíóúñ]/i);
  });
});
