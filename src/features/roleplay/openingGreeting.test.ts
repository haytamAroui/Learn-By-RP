import { describe, expect, it } from 'vitest';
import { getBelgianDutchOpeningGreeting } from './openingGreeting';

describe('Belgian Dutch opening greeting', () => {
  it('uses Dutch for a transit mission instead of the Spanish default', () => {
    expect(
      getBelgianDutchOpeningGreeting({ category: 'transit', title: 'Metro in Brussel' })
    ).toEqual({
      greeting: 'Goeiedag! Welke richting zoekt u? Ik help u graag op weg.',
      meaning: 'Good day! Which direction are you looking for? I will gladly help you.',
    });
  });

  it('keeps pharmacy openings within the authored non-diagnostic boundary', () => {
    const result = getBelgianDutchOpeningGreeting({
      category: 'problems',
      title: 'Apotheek: informatie op de verpakking',
    });
    expect(result.greeting).toContain('officiële informatie');
    expect(result.greeting).toContain('bijsluiter');
    expect(result.greeting).not.toMatch(/nemen|dosering|geneesmiddel/i);
  });
});
