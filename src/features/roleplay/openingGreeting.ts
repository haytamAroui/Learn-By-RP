import type { MissionDefinition } from '../../types';

/** Belgian Dutch opening lines for the locally authored first scene turn. */
export function getBelgianDutchOpeningGreeting(
  target: Pick<MissionDefinition, 'category' | 'title'>
): { greeting: string; meaning: string } {
  if (target.category === 'problems') {
    return {
      greeting:
        'Goeiedag! Kan ik u helpen de officiële informatie op de verpakking of in de bijsluiter te vinden?',
      meaning:
        'Good day! Can I help you find the official information on the package or in the leaflet?',
    };
  }
  if (target.category === 'transit') {
    return {
      greeting: 'Goeiedag! Welke richting zoekt u? Ik help u graag op weg.',
      meaning: 'Good day! Which direction are you looking for? I will gladly help you.',
    };
  }
  if (target.category === 'services') {
    return {
      greeting: 'Goeiedag! Komt u een pakje ophalen of versturen?',
      meaning: 'Good day! Are you here to pick up or send a parcel?',
    };
  }
  if (target.category === 'social') {
    return {
      greeting: 'Goeiedag! Waarmee kan ik u helpen?',
      meaning: 'Good day! How can I help you?',
    };
  }
  if (target.title.toLowerCase().includes('terras')) {
    return {
      greeting: 'Goedenavond! Welkom. Heeft u een tafel voor twee nodig?',
      meaning: 'Good evening! Welcome. Do you need a table for two?',
    };
  }
  if (target.category === 'cafes') {
    return {
      greeting: 'Goeiemorgen! Wat mag het zijn?',
      meaning: 'Good morning! What can I get for you?',
    };
  }
  return {
    greeting: 'Goeiedag! Waarmee kan ik u helpen?',
    meaning: 'Good day! How can I help you?',
  };
}
